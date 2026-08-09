from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Iterable, Sequence
from uuid import UUID

from .models import normalize_identity


STRONG_MATCH_BPS = 9_000
CANDIDATE_FLOOR_BPS = 7_500
WINNER_MARGIN_BPS = 1_200
MAX_QUERY_LENGTH = 160


class ResolverOutcome(str, Enum):
    MATCHED = "MATCHED"
    AMBIGUOUS = "AMBIGUOUS"
    NOT_FOUND = "NOT_FOUND"


@dataclass(frozen=True)
class ProjectAliasIdentity:
    id: UUID
    alias: str
    normalized_alias: str
    alias_type: str


@dataclass(frozen=True)
class ProjectIdentity:
    project_id: UUID
    canonical_name: str
    normalized_name: str
    developer_id: UUID
    developer_name: str
    developer_normalized_name: str
    city_slug: str
    locality_slug: str
    aliases: tuple[ProjectAliasIdentity, ...] = ()


@dataclass(frozen=True)
class RankedCandidate:
    project: ProjectIdentity
    score_bps: int
    match_source: str
    matched_label: str

    @property
    def score(self) -> float:
        return self.score_bps / 100


@dataclass(frozen=True)
class ResolverResult:
    outcome: ResolverOutcome
    project: ProjectIdentity | None
    candidates: tuple[RankedCandidate, ...]
    reason: str


def compact_identity(value: str) -> str:
    return normalize_identity(value).replace(" ", "")


def project_identities_from_rows(rows: Iterable[dict[str, Any]]) -> tuple[ProjectIdentity, ...]:
    grouped: dict[UUID, dict[str, Any]] = {}
    for row in rows:
        project_id = UUID(str(row["project_id"]))
        project = grouped.setdefault(
            project_id,
            {
                "project_id": project_id,
                "canonical_name": row["canonical_name"],
                "normalized_name": row["normalized_name"],
                "developer_id": UUID(str(row["developer_id"])),
                "developer_name": row["developer_name"],
                "developer_normalized_name": row["developer_normalized_name"],
                "city_slug": row["city_slug"],
                "locality_slug": row["locality_slug"],
                "aliases": {},
            },
        )
        if row.get("alias_id") is not None:
            alias_id = UUID(str(row["alias_id"]))
            project["aliases"][alias_id] = ProjectAliasIdentity(
                id=alias_id,
                alias=row["alias"],
                normalized_alias=row["normalized_alias"],
                alias_type=row["alias_type"],
            )

    identities = []
    for project in grouped.values():
        aliases = tuple(
            sorted(
                project.pop("aliases").values(),
                key=lambda alias: (alias.normalized_alias, str(alias.id)),
            )
        )
        identities.append(ProjectIdentity(**project, aliases=aliases))
    return tuple(sorted(identities, key=lambda item: (item.normalized_name, str(item.project_id))))


def resolve_project(query: str | None, projects: Sequence[ProjectIdentity]) -> ResolverResult:
    normalized_query = normalize_identity(query or "")
    if not normalized_query or len(normalized_query) > MAX_QUERY_LENGTH:
        return ResolverResult(ResolverOutcome.NOT_FOUND, None, (), "INVALID_QUERY")
    if not projects:
        return ResolverResult(ResolverOutcome.NOT_FOUND, None, (), "NO_SUPPORTED_PROJECTS")

    compact_query = normalized_query.replace(" ", "")
    ranked = _rank(normalized_query, compact_query, projects)

    exact = _exact_hits(normalized_query, compact_query, projects)
    if exact:
        return _exact_result(exact, ranked)

    contextual = _contextual_exact(normalized_query, projects)
    if contextual is not None:
        identity_query, context_kind, context_value, hits = contextual
        contextual_ranked = _rank(
            identity_query,
            identity_query.replace(" ", ""),
            projects,
            context_kind=context_kind,
            context_value=context_value,
        )
        if hits:
            conflicts = [
                project for project, _ in hits
                if context_kind == "locality" and project.locality_slug != context_value
            ]
            if conflicts:
                forced = _force_exact_candidates(conflicts, contextual_ranked)
                return ResolverResult(
                    ResolverOutcome.AMBIGUOUS,
                    None,
                    tuple(candidate for candidate in forced if candidate.project in conflicts),
                    "CONTEXT_CONFLICT",
                )
            return _exact_result(hits, contextual_ranked, reason="CONTEXT_EXACT")
        if identity_query:
            ranked = contextual_ranked

    family_prefixes = _developer_family_prefixes(projects)
    if normalized_query in family_prefixes:
        return ResolverResult(ResolverOutcome.NOT_FOUND, None, (), "DEVELOPER_ONLY")

    prefix_projects = _shared_prefix_projects(normalized_query, projects)
    if prefix_projects:
        candidates = tuple(candidate for candidate in ranked if candidate.project in prefix_projects)
        return ResolverResult(ResolverOutcome.AMBIGUOUS, None, candidates, "SHARED_PREFIX")

    top = ranked[0]
    second = ranked[1] if len(ranked) > 1 else None
    margin = top.score_bps - (second.score_bps if second else 0)
    if top.score_bps >= STRONG_MATCH_BPS and margin >= WINNER_MARGIN_BPS:
        return ResolverResult(ResolverOutcome.MATCHED, top.project, ranked, "FUZZY_MATCH")
    if (
        second is not None
        and top.score_bps >= CANDIDATE_FLOOR_BPS
        and second.score_bps >= CANDIDATE_FLOOR_BPS
        and margin < WINNER_MARGIN_BPS
    ):
        return ResolverResult(ResolverOutcome.AMBIGUOUS, None, ranked, "FUZZY_COLLISION")
    return ResolverResult(ResolverOutcome.NOT_FOUND, None, ranked, "NO_CONFIDENT_MATCH")


def _exact_hits(
    normalized_query: str,
    compact_query: str,
    projects: Sequence[ProjectIdentity],
) -> list[tuple[ProjectIdentity, str]]:
    ladders = (
        ("CANONICAL", lambda project: project.normalized_name == normalized_query),
        ("CANONICAL_COMPACT", lambda project: compact_identity(project.normalized_name) == compact_query),
        ("ALIAS", lambda project: any(alias.normalized_alias == normalized_query for alias in project.aliases)),
        (
            "ALIAS_COMPACT",
            lambda project: any(compact_identity(alias.normalized_alias) == compact_query for alias in project.aliases),
        ),
    )
    for source, predicate in ladders:
        hits = [(project, source) for project in projects if predicate(project)]
        if hits:
            return hits
    return []


def _contextual_exact(
    normalized_query: str,
    projects: Sequence[ProjectIdentity],
) -> tuple[str, str, str, list[tuple[ProjectIdentity, str]]] | None:
    localities = sorted({project.locality_slug for project in projects}, key=len, reverse=True)
    for locality in localities:
        display = normalize_identity(locality.replace("-", " "))
        stripped = _strip_edge(normalized_query, display)
        if stripped is not None:
            hits = _exact_hits(stripped, stripped.replace(" ", ""), projects) if stripped else []
            return stripped, "locality", locality, hits

    developers = sorted(
        {project.developer_normalized_name for project in projects},
        key=len,
        reverse=True,
    )
    for developer in developers:
        stripped = _strip_edge(normalized_query, developer)
        if stripped is None:
            continue
        developer_projects = [project for project in projects if project.developer_normalized_name == developer]
        hits = _exact_hits(stripped, stripped.replace(" ", ""), developer_projects) if stripped else []
        if not hits:
            for project in developer_projects:
                core = _project_core(project)
                if stripped in {core, core.replace(" ", "")}:
                    hits.append((project, "DEVELOPER_COMPOSITE"))
        return stripped, "developer", developer, hits
    return None


def _strip_edge(value: str, context: str) -> str | None:
    if value == context:
        return ""
    prefix = f"{context} "
    suffix = f" {context}"
    if value.startswith(prefix):
        return value[len(prefix):]
    if value.endswith(suffix):
        return value[:-len(suffix)]
    return None


def _project_core(project: ProjectIdentity) -> str:
    project_tokens = project.normalized_name.split()
    developer_tokens = project.developer_normalized_name.split()
    shared = 0
    for project_token, developer_token in zip(project_tokens, developer_tokens):
        if project_token != developer_token:
            break
        shared += 1
    return " ".join(project_tokens[shared:])


def _developer_family_prefixes(projects: Sequence[ProjectIdentity]) -> set[str]:
    by_developer: dict[UUID, list[ProjectIdentity]] = {}
    for project in projects:
        by_developer.setdefault(project.developer_id, []).append(project)
    prefixes: set[str] = set()
    for family in by_developer.values():
        if len(family) < 2:
            continue
        prefix = _common_token_prefix([project.normalized_name.split() for project in family])
        if prefix:
            prefixes.add(" ".join(prefix))
    return prefixes


def _shared_prefix_projects(
    normalized_query: str,
    projects: Sequence[ProjectIdentity],
) -> tuple[ProjectIdentity, ...]:
    tokens = normalized_query.split()
    if len(tokens) < 2:
        return ()
    matches = []
    for project in projects:
        labels = (project.normalized_name,) + tuple(alias.normalized_alias for alias in project.aliases)
        if any(label.split()[:len(tokens)] == tokens for label in labels):
            matches.append(project)
    return tuple(matches) if len(matches) >= 2 else ()


def _common_token_prefix(token_lists: Sequence[list[str]]) -> list[str]:
    if not token_lists:
        return []
    prefix = []
    for tokens in zip(*token_lists):
        if len(set(tokens)) != 1:
            break
        prefix.append(tokens[0])
    return prefix


def _rank(
    normalized_query: str,
    compact_query: str,
    projects: Sequence[ProjectIdentity],
    *,
    context_kind: str | None = None,
    context_value: str | None = None,
) -> tuple[RankedCandidate, ...]:
    candidates = []
    for project in projects:
        labels = [("CANONICAL", project.canonical_name, project.normalized_name)]
        labels.extend(("ALIAS", alias.alias, alias.normalized_alias) for alias in project.aliases)
        scored_labels = []
        for source, label, normalized_label in labels:
            score = max(
                _similarity_bps(normalized_query, normalized_label),
                _similarity_bps(compact_query, normalized_label.replace(" ", "")),
            )
            scored_labels.append((score, 0 if source == "CANONICAL" else 1, source, label))
        score, _, source, label = min(scored_labels, key=lambda item: (-item[0], item[1], item[3]))
        if context_kind == "locality":
            score += 300 if project.locality_slug == context_value else -1_500
        elif context_kind == "developer":
            score += 300 if project.developer_normalized_name == context_value else -1_500
        candidates.append(
            RankedCandidate(
                project=project,
                score_bps=max(0, min(10_000, score)),
                match_source=source,
                matched_label=label,
            )
        )
    return tuple(
        sorted(
            candidates,
            key=lambda candidate: (
                -candidate.score_bps,
                0 if candidate.match_source == "CANONICAL" else 1,
                candidate.project.normalized_name,
                str(candidate.project.project_id),
            ),
        )
    )


def _exact_result(
    hits: Sequence[tuple[ProjectIdentity, str]],
    ranked: Sequence[RankedCandidate],
    *,
    reason: str = "EXACT_MATCH",
) -> ResolverResult:
    hit_projects = [project for project, _ in hits]
    candidates = _force_exact_candidates(hit_projects, ranked)
    if len(hit_projects) != 1:
        return ResolverResult(ResolverOutcome.AMBIGUOUS, None, candidates, "EXACT_COLLISION")
    return ResolverResult(ResolverOutcome.MATCHED, hit_projects[0], candidates, reason)


def _force_exact_candidates(
    projects: Sequence[ProjectIdentity],
    ranked: Sequence[RankedCandidate],
) -> tuple[RankedCandidate, ...]:
    project_ids = {project.project_id for project in projects}
    forced = [
        RankedCandidate(candidate.project, 10_000, candidate.match_source, candidate.matched_label)
        if candidate.project.project_id in project_ids else candidate
        for candidate in ranked
    ]
    return tuple(
        sorted(
            forced,
            key=lambda candidate: (
                -candidate.score_bps,
                0 if candidate.match_source == "CANONICAL" else 1,
                candidate.project.normalized_name,
                str(candidate.project.project_id),
            ),
        )
    )


def _similarity_bps(left: str, right: str) -> int:
    length = max(len(left), len(right))
    if length == 0:
        return 10_000
    distance = _osa_distance(left, right)
    return ((length - distance) * 10_000 + length // 2) // length


def _osa_distance(left: str, right: str) -> int:
    rows = [[0] * (len(right) + 1) for _ in range(len(left) + 1)]
    for index in range(len(left) + 1):
        rows[index][0] = index
    for index in range(len(right) + 1):
        rows[0][index] = index
    for left_index in range(1, len(left) + 1):
        for right_index in range(1, len(right) + 1):
            cost = 0 if left[left_index - 1] == right[right_index - 1] else 1
            rows[left_index][right_index] = min(
                rows[left_index - 1][right_index] + 1,
                rows[left_index][right_index - 1] + 1,
                rows[left_index - 1][right_index - 1] + cost,
            )
            if (
                left_index > 1
                and right_index > 1
                and left[left_index - 1] == right[right_index - 2]
                and left[left_index - 2] == right[right_index - 1]
            ):
                rows[left_index][right_index] = min(
                    rows[left_index][right_index],
                    rows[left_index - 2][right_index - 2] + cost,
                )
    return rows[-1][-1]
