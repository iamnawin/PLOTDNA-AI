import json
import unittest
from dataclasses import replace
from pathlib import Path
from uuid import UUID, uuid4

from app.services.flatdna.registry_io import load_registry_bundle
from app.services.flatdna.resolver import (
    CANDIDATE_FLOOR_BPS,
    STRONG_MATCH_BPS,
    WINNER_MARGIN_BPS,
    ProjectAliasIdentity,
    ProjectIdentity,
    ResolverOutcome,
    compact_identity,
    resolve_project,
)


ROOT = Path(__file__).resolve().parents[2]
CORPUS_PATH = ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "resolver-cases.json"
REGISTRY_PATH = ROOT / "data" / "cities" / "hyderabad" / "flatdna" / "registry.json"


def load_corpus():
    return json.loads(CORPUS_PATH.read_text(encoding="utf-8"))


def fixture_projects() -> tuple[ProjectIdentity, ...]:
    bundle = load_registry_bundle(REGISTRY_PATH)
    developers = {developer.id: developer for developer in bundle.developers}
    aliases_by_project = {project.id: [] for project in bundle.projects}
    for alias in bundle.project_aliases:
        if alias.active:
            aliases_by_project[alias.project_id].append(
                ProjectAliasIdentity(
                    id=alias.id,
                    alias=alias.alias,
                    normalized_alias=alias.normalized_alias,
                    alias_type=alias.alias_type.value,
                )
            )
    return tuple(
        ProjectIdentity(
            project_id=project.id,
            canonical_name=project.canonical_name,
            normalized_name=project.normalized_name,
            developer_id=project.developer_id,
            developer_name=developers[project.developer_id].canonical_name,
            developer_normalized_name=developers[project.developer_id].normalized_name,
            city_slug=project.city_slug,
            locality_slug=project.locality_slug,
            aliases=tuple(aliases_by_project[project.id]),
        )
        for project in bundle.projects
    )


class FlatDnaResolverCorpusTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.corpus = load_corpus()
        cls.projects = fixture_projects()

    def test_corpus_is_the_approved_59_case_contract(self):
        cases = self.corpus["cases"]
        self.assertEqual(len(cases), 59)
        self.assertEqual(len({case["case_id"] for case in cases}), 59)
        self.assertEqual(
            {key: int(value * 100) for key, value in self.corpus["thresholds"].items()},
            {
                "strong_match": STRONG_MATCH_BPS,
                "candidate_floor": CANDIDATE_FLOOR_BPS,
                "winner_margin": WINNER_MARGIN_BPS,
            },
        )
        self.assertEqual(
            {case["category"] for case in cases},
            {
                "canonical", "alias", "normalization_context", "typo", "ambiguity",
                "developer_only", "locality_only", "draft", "excluded", "unknown_invalid",
            },
        )

    def test_all_corpus_identity_expectations_use_locked_registry_uuids(self):
        registry_ids = {str(project.project_id) for project in self.projects}
        for case in self.corpus["cases"]:
            ids = [
                case.get("expected_project_id"),
                case.get("expected_top_id"),
                case.get("expected_second_id"),
                *case.get("expected_project_ids", []),
            ]
            self.assertTrue({value for value in ids if value}.issubset(registry_ids), case["case_id"])

    def test_complete_corpus_outcomes_and_identity_are_deterministic(self):
        for case in self.corpus["cases"]:
            with self.subTest(case=case["case_id"], query=case["query"]):
                first = resolve_project(case["query"], self.projects)
                second = resolve_project(case["query"], self.projects)
                self.assertEqual(first, second)
                self.assertEqual(first.outcome.value, case["expected_outcome"])
                actual_id = str(first.project.project_id) if first.project else None
                self.assertEqual(actual_id, case.get("expected_project_id"))
                if case.get("expected_project_ids"):
                    actual_candidates = [str(item.project.project_id) for item in first.candidates]
                    self.assertEqual(
                        actual_candidates[:len(case["expected_project_ids"])],
                        case["expected_project_ids"],
                    )

    def test_complete_corpus_ranking_receipt_matches_calibration(self):
        for case in self.corpus["cases"]:
            with self.subTest(case=case["case_id"], query=case["query"]):
                result = resolve_project(case["query"], self.projects)
                top = result.candidates[0] if result.candidates else None
                second = result.candidates[1] if len(result.candidates) > 1 else None
                self.assertEqual(str(top.project.project_id) if top else None, case["expected_top_id"])
                self.assertEqual(top.score if top else None, case["expected_top_score"])
                self.assertEqual(str(second.project.project_id) if second else None, case["expected_second_id"])
                self.assertEqual(second.score if second else None, case["expected_second_score"])
                margin = round(top.score - second.score, 2) if top and second else None
                self.assertEqual(margin, case["expected_margin"])

    def test_normalization_preserves_digits_and_compacts_only_spacing(self):
        self.assertEqual(compact_identity(" On-Cloud 33 "), "oncloud33")
        self.assertEqual(compact_identity("My Home's 2"), "myhomes2")

    def test_shared_exact_alias_collision_is_ambiguous(self):
        shared = "Shared Registry Name"
        first, second, *rest = self.projects
        first = replace(
            first,
            aliases=first.aliases + (ProjectAliasIdentity(uuid4(), shared, "shared registry name", "MARKETING"),),
        )
        second = replace(
            second,
            aliases=second.aliases + (ProjectAliasIdentity(uuid4(), shared, "shared registry name", "MARKETING"),),
        )
        result = resolve_project(shared, (first, second, *rest))
        self.assertEqual(result.outcome, ResolverOutcome.AMBIGUOUS)
        self.assertIsNone(result.project)
        self.assertEqual({item.project.project_id for item in result.candidates[:2]}, {first.project_id, second.project_id})

    def test_result_returns_stable_canonical_context(self):
        result = resolve_project("Nishada", self.projects)
        self.assertEqual(result.outcome, ResolverOutcome.MATCHED)
        self.assertEqual(result.project.project_id, UUID("421c032d-37c5-4e88-8c18-3b1185ac825f"))
        self.assertEqual(result.project.canonical_name, "My Home Nishada")
        self.assertEqual(result.project.developer_name, "My Home Constructions")
        self.assertEqual(result.project.city_slug, "hyderabad")
        self.assertEqual(result.project.locality_slug, "kokapet")

    def test_empty_supported_snapshot_does_not_fall_back_to_fixture(self):
        result = resolve_project("My Home Nishada", ())
        self.assertEqual(result.outcome, ResolverOutcome.NOT_FOUND)
        self.assertIsNone(result.project)
        self.assertEqual(result.candidates, ())

    def test_resolver_source_has_no_external_or_nondeterministic_dependency(self):
        source = (ROOT / "backend" / "app" / "services" / "flatdna" / "resolver.py").read_text(
            encoding="utf-8"
        ).lower()
        for forbidden in (
            "ai_provider", "gemini", "openai", "requests", "httpx", "urllib", "socket",
            "embedding", "redis", "elasticsearch", "random", "registry.json", "resolver-cases.json",
        ):
            self.assertNotIn(forbidden, source)

    def test_fixed_threshold_boundaries_use_integer_basis_points(self):
        def identity(name: str) -> ProjectIdentity:
            return ProjectIdentity(
                project_id=uuid4(),
                canonical_name=name,
                normalized_name=name,
                developer_id=uuid4(),
                developer_name="Boundary Developer",
                developer_normalized_name="boundary developer",
                city_slug="hyderabad",
                locality_slug="kokapet",
            )

        strong = resolve_project("abcdefghij", (identity("abcdefghix"), identity("zzzzzzzzzz")))
        below_strong = resolve_project("abcdefghij", (identity("abcdefghxy"), identity("zzzzzzzzzz")))
        at_floor = resolve_project("abcd", (identity("abce"), identity("abcf")))
        at_margin = resolve_project(
            "abcdefghijklmnopqrstuvwxy",
            (identity("abcdefghijklmnopqrstuvwxz"), identity("abcdefghijklmnopqrstu0000")),
        )
        below_margin = resolve_project(
            "a" * 100,
            (identity("a" * 99 + "b"), identity("a" * 88 + "b" * 12)),
        )

        self.assertEqual(strong.candidates[0].score_bps, 9_000)
        self.assertEqual(strong.outcome, ResolverOutcome.MATCHED)
        self.assertEqual(below_strong.candidates[0].score_bps, 8_000)
        self.assertEqual(below_strong.outcome, ResolverOutcome.NOT_FOUND)
        self.assertEqual([item.score_bps for item in at_floor.candidates[:2]], [7_500, 7_500])
        self.assertEqual(at_floor.outcome, ResolverOutcome.AMBIGUOUS)
        self.assertEqual(
            at_margin.candidates[0].score_bps - at_margin.candidates[1].score_bps,
            WINNER_MARGIN_BPS,
        )
        self.assertEqual(at_margin.outcome, ResolverOutcome.MATCHED)
        self.assertEqual(
            below_margin.candidates[0].score_bps - below_margin.candidates[1].score_bps,
            1_100,
        )
        self.assertEqual(below_margin.outcome, ResolverOutcome.AMBIGUOUS)


if __name__ == "__main__":
    unittest.main()
