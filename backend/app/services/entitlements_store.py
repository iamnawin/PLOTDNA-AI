from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal
import hashlib
import hmac
import secrets

from app.core.config import settings


def _db_path() -> Path:
    # Local-first MVP: a tiny SQLite DB.
    # In production, replace with Supabase/Postgres + verified IAP receipts.
    if settings.ENTITLEMENTS_DB_PATH:
        path = Path(settings.ENTITLEMENTS_DB_PATH).expanduser()
        path.parent.mkdir(parents=True, exist_ok=True)
        return path
    base = Path(__file__).resolve().parents[2]  # backend/app
    path = base / ".local" / "entitlements.sqlite3"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _hash_otp(email: str, otp: str) -> str:
    message = f"{email.strip().lower()}:{otp.strip()}".encode("utf-8")
    return hmac.new(settings.JWT_SECRET.encode("utf-8"), message, hashlib.sha256).hexdigest()


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if len(normalized) < 6 or len(normalized) > 254:
        raise ValueError("Invalid email")
    if "@" not in normalized or "." not in normalized.rsplit("@", 1)[-1]:
        raise ValueError("Invalid email")
    if any(char.isspace() for char in normalized):
        raise ValueError("Invalid email")
    return normalized


def normalize_name(name: str | None) -> str | None:
    if name is None:
        return None
    normalized = " ".join(name.strip().split())
    if not normalized:
        return None
    if len(normalized) > 80:
        raise ValueError("Name is too long")
    return normalized


def _init(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          email_verified_at TEXT,
          last_seen_at TEXT,
          created_at TEXT NOT NULL
        )
        """
    )
    existing_columns = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(users)").fetchall()
    }
    if "email_verified_at" not in existing_columns:
        conn.execute("ALTER TABLE users ADD COLUMN email_verified_at TEXT")
    if "name" not in existing_columns:
        conn.execute("ALTER TABLE users ADD COLUMN name TEXT")
    if "last_seen_at" not in existing_columns:
        conn.execute("ALTER TABLE users ADD COLUMN last_seen_at TEXT")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS usage (
          user_id TEXT PRIMARY KEY,
          free_used INTEGER NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS entitlements (
          user_id TEXT PRIMARY KEY,
          is_active INTEGER NOT NULL,
          expires_at TEXT,
          updated_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS email_otps (
          user_id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          otp_hash TEXT NOT NULL,
          attempts INTEGER NOT NULL,
          expires_at TEXT NOT NULL,
          last_sent_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user_events (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          email TEXT,
          event_type TEXT NOT NULL,
          area_slug TEXT,
          package_interest TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )
    conn.commit()


@dataclass(frozen=True)
class Entitlements:
    free_remaining: int
    subscription_active: bool
    subscription_expires_at: str | None
    email: str | None
    name: str | None


@dataclass(frozen=True)
class EmailOtpRequestResult:
    email: str
    status: Literal["sent"]
    expires_at: str
    resend_after_seconds: int
    debug_otp: str | None


@dataclass(frozen=True)
class EmailOtpVerifyResult:
    email: str
    status: Literal["verified"]
    entitlements: Entitlements


@dataclass(frozen=True)
class UserEvent:
    event_type: str
    area_slug: str | None = None
    package_interest: str | None = None
    metadata: str | None = None


@dataclass(frozen=True)
class TopAreaMetric:
    area_slug: str
    count: int


@dataclass(frozen=True)
class AdminMetrics:
    total_users: int
    verified_email_users: int
    download_count: int
    payment_started_count: int
    paid_user_count: int
    live_users: int
    active_users_today: int
    active_users_7d: int
    active_users_30d: int
    top_downloaded_areas: list[TopAreaMetric]


@dataclass(frozen=True)
class PublicMetrics:
    live_users: int
    active_users_today: int


ReportPackage = Literal["instant_pdf_99", "custom_due_diligence_499"]


@dataclass(frozen=True)
class ReportAccess:
    package_interest: ReportPackage
    can_access: bool
    requires_payment: bool
    reason: Literal["admin_allowlist", "subscription_active", "payment_required"]
    email: str | None


def _admin_access_emails() -> set[str]:
    return {
        email.strip().lower()
        for email in settings.ADMIN_ACCESS_EMAILS.split(",")
        if email.strip()
    }


def _admin_access_user_ids() -> set[str]:
    return {
        user_id.strip()
        for user_id in settings.ADMIN_ACCESS_USER_IDS.split(",")
        if user_id.strip()
    }


def ensure_user(user_id: str, *, name: str | None = None) -> None:
    normalized_name = normalize_name(name)
    conn = _connect()
    try:
        _init(conn)
        conn.execute("INSERT OR IGNORE INTO users (id, created_at) VALUES (?, ?)", (user_id, _now_iso()))
        if normalized_name:
            conn.execute("UPDATE users SET name = ? WHERE id = ?", (normalized_name, user_id))
        conn.execute(
            "INSERT OR IGNORE INTO usage (user_id, free_used, updated_at) VALUES (?, ?, ?)",
            (user_id, 0, _now_iso()),
        )
        conn.execute(
            "INSERT OR IGNORE INTO entitlements (user_id, is_active, expires_at, updated_at) VALUES (?, ?, ?, ?)",
            (user_id, 0, None, _now_iso()),
        )
        conn.commit()
    finally:
        conn.close()


def touch_user(user_id: str) -> None:
    ensure_user(user_id)
    conn = _connect()
    try:
        _init(conn)
        conn.execute("UPDATE users SET last_seen_at = ? WHERE id = ?", (_now_iso(), user_id))
        conn.commit()
    finally:
        conn.close()


def get_entitlements(user_id: str) -> Entitlements:
    ensure_user(user_id)
    conn = _connect()
    try:
        _init(conn)
        user = conn.execute("SELECT name, email, email_verified_at FROM users WHERE id = ?", (user_id,)).fetchone()
        usage = conn.execute("SELECT free_used FROM usage WHERE user_id = ?", (user_id,)).fetchone()
        ent = conn.execute("SELECT is_active, expires_at FROM entitlements WHERE user_id = ?", (user_id,)).fetchone()
        free_used = int(usage["free_used"]) if usage else 0
        free_remaining = max(0, int(settings.FREE_SEARCH_LIMIT) - free_used)

        active = bool(int(ent["is_active"])) if ent else False
        expires_at = ent["expires_at"] if ent else None
        if active and expires_at:
            try:
                exp = datetime.fromisoformat(expires_at)
                if exp.tzinfo is None:
                    exp = exp.replace(tzinfo=timezone.utc)
                if exp <= datetime.now(timezone.utc):
                    active = False
            except ValueError:
                # If expires_at is corrupted, fail closed.
                active = False

        return Entitlements(
            free_remaining=free_remaining,
            subscription_active=active,
            subscription_expires_at=expires_at,
            email=(user["email"] if user and user["email_verified_at"] else None),
            name=(user["name"] if user else None),
        )
    finally:
        conn.close()


def consume_search(user_id: str) -> Entitlements:
    """
    Enforces: FREE_SEARCH_LIMIT searches, then email (or subscription) required.
    """
    ensure_user(user_id)
    current = get_entitlements(user_id)
    if current.subscription_active or current.email:
        return current

    if current.free_remaining <= 0:
        return current

    conn = _connect()
    try:
        _init(conn)
        conn.execute(
            "UPDATE usage SET free_used = free_used + 1, updated_at = ? WHERE user_id = ?",
            (_now_iso(), user_id),
        )
        conn.commit()
    finally:
        conn.close()

    return get_entitlements(user_id)


def dev_activate_subscription(user_id: str, *, days: int = 30) -> Entitlements:
    """
    Dev-only helper until App Store / Play Store receipt verification is implemented.
    """
    ensure_user(user_id)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    conn = _connect()
    try:
        _init(conn)
        conn.execute(
            "UPDATE entitlements SET is_active = 1, expires_at = ?, updated_at = ? WHERE user_id = ?",
            (expires_at, _now_iso(), user_id),
        )
        conn.commit()
    finally:
        conn.close()

    return get_entitlements(user_id)


def set_email(user_id: str, email: str) -> Entitlements:
    ensure_user(user_id)
    normalized = normalize_email(email)
    conn = _connect()
    try:
        _init(conn)
        conn.execute(
            "UPDATE users SET email = ?, email_verified_at = ? WHERE id = ?",
            (normalized, _now_iso(), user_id),
        )
        conn.commit()
    finally:
        conn.close()

    return get_entitlements(user_id)


def _debug_otp_allowed(normalized_email: str) -> bool:
    if settings.APP_ENV.lower() != "production":
        return True
    allowed = {
        email.strip().lower()
        for email in settings.EMAIL_OTP_DEBUG_EMAILS.split(",")
        if email.strip()
    }
    return normalized_email in allowed


def request_email_otp(user_id: str, email: str, name: str | None = None) -> EmailOtpRequestResult:
    ensure_user(user_id, name=name)
    normalized = normalize_email(email)
    now = datetime.now(timezone.utc)
    conn = _connect()
    try:
        _init(conn)
        existing = conn.execute(
            "SELECT last_sent_at FROM email_otps WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        last_sent = _parse_iso(existing["last_sent_at"] if existing else None)
        if last_sent:
            elapsed = int((now - last_sent).total_seconds())
            cooldown = int(settings.EMAIL_OTP_RESEND_COOLDOWN_SECONDS)
            if elapsed < cooldown:
                raise PermissionError(f"Wait {cooldown - elapsed} seconds before requesting another code.")

        otp = f"{secrets.randbelow(1_000_000):06d}"
        expires_at = (now + timedelta(minutes=int(settings.EMAIL_OTP_TTL_MINUTES))).isoformat()
        conn.execute(
            """
            INSERT INTO email_otps (user_id, email, otp_hash, attempts, expires_at, last_sent_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              email = excluded.email,
              otp_hash = excluded.otp_hash,
              attempts = 0,
              expires_at = excluded.expires_at,
              last_sent_at = excluded.last_sent_at
            """,
            (user_id, normalized, _hash_otp(normalized, otp), 0, expires_at, now.isoformat(), now.isoformat()),
        )
        conn.commit()
        debug_otp = otp if _debug_otp_allowed(normalized) else None
        return EmailOtpRequestResult(
            email=normalized,
            status="sent",
            expires_at=expires_at,
            resend_after_seconds=int(settings.EMAIL_OTP_RESEND_COOLDOWN_SECONDS),
            debug_otp=debug_otp,
        )
    finally:
        conn.close()


def verify_email_otp(user_id: str, email: str, otp: str) -> EmailOtpVerifyResult:
    ensure_user(user_id)
    normalized = normalize_email(email)
    cleaned_otp = otp.strip()
    if len(cleaned_otp) != 6 or not cleaned_otp.isdigit():
        raise ValueError("Invalid code")

    conn = _connect()
    try:
        _init(conn)
        row = conn.execute(
            "SELECT email, otp_hash, attempts, expires_at FROM email_otps WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        if not row or row["email"] != normalized:
            raise ValueError("Invalid code")
        if int(row["attempts"]) >= int(settings.EMAIL_OTP_MAX_ATTEMPTS):
            raise ValueError("Too many attempts")
        expires_at = _parse_iso(row["expires_at"])
        if not expires_at or expires_at <= datetime.now(timezone.utc):
            raise ValueError("Code expired")

        if not hmac.compare_digest(row["otp_hash"], _hash_otp(normalized, cleaned_otp)):
            conn.execute(
                "UPDATE email_otps SET attempts = attempts + 1 WHERE user_id = ?",
                (user_id,),
            )
            conn.commit()
            raise ValueError("Invalid code")

        now = _now_iso()
        conn.execute(
            "UPDATE users SET email = ?, email_verified_at = ?, last_seen_at = ? WHERE id = ?",
            (normalized, now, now, user_id),
        )
        conn.execute("DELETE FROM email_otps WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()

    record_user_event(user_id, UserEvent(event_type="otp_verified"))
    return EmailOtpVerifyResult(email=normalized, status="verified", entitlements=get_entitlements(user_id))


def record_user_event(user_id: str, event: UserEvent) -> None:
    ensure_user(user_id)
    event_type = event.event_type.strip()
    if not event_type:
        raise ValueError("Event type is required")
    now = _now_iso()
    conn = _connect()
    try:
        _init(conn)
        user = conn.execute(
            "SELECT email, email_verified_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        email = user["email"] if user and user["email_verified_at"] else None
        conn.execute("UPDATE users SET last_seen_at = ? WHERE id = ?", (now, user_id))
        conn.execute(
            """
            INSERT INTO user_events (id, user_id, email, event_type, area_slug, package_interest, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                secrets.token_urlsafe(16),
                user_id,
                email,
                event_type,
                event.area_slug,
                event.package_interest,
                event.metadata,
                now,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def get_admin_metrics() -> AdminMetrics:
    conn = _connect()
    try:
        _init(conn)
        now = datetime.now(timezone.utc)

        def scalar(query: str, params: tuple[object, ...] = ()) -> int:
            row = conn.execute(query, params).fetchone()
            return int(row[0] if row else 0)

        live_cutoff = (now - timedelta(minutes=5)).isoformat()
        today_cutoff = (now - timedelta(days=1)).isoformat()
        week_cutoff = (now - timedelta(days=7)).isoformat()
        month_cutoff = (now - timedelta(days=30)).isoformat()
        top_rows = conn.execute(
            """
            SELECT area_slug, COUNT(*) AS count
            FROM user_events
            WHERE event_type IN ('pdf_downloaded', 'custom_buyer_brief_downloaded') AND area_slug IS NOT NULL
            GROUP BY area_slug
            ORDER BY count DESC, area_slug ASC
            LIMIT 5
            """
        ).fetchall()

        return AdminMetrics(
            total_users=scalar("SELECT COUNT(*) FROM users"),
            verified_email_users=scalar("SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL"),
            download_count=scalar(
                "SELECT COUNT(*) FROM user_events WHERE event_type IN ('pdf_downloaded', 'custom_buyer_brief_downloaded')"
            ),
            payment_started_count=scalar("SELECT COUNT(*) FROM user_events WHERE event_type = 'payment_started'"),
            paid_user_count=scalar(
                "SELECT COUNT(DISTINCT user_id) FROM user_events WHERE event_type = 'payment_completed'"
            ),
            live_users=scalar("SELECT COUNT(*) FROM users WHERE last_seen_at >= ?", (live_cutoff,)),
            active_users_today=scalar("SELECT COUNT(*) FROM users WHERE last_seen_at >= ?", (today_cutoff,)),
            active_users_7d=scalar("SELECT COUNT(*) FROM users WHERE last_seen_at >= ?", (week_cutoff,)),
            active_users_30d=scalar("SELECT COUNT(*) FROM users WHERE last_seen_at >= ?", (month_cutoff,)),
            top_downloaded_areas=[
                TopAreaMetric(area_slug=row["area_slug"], count=int(row["count"]))
                for row in top_rows
            ],
        )
    finally:
        conn.close()


def get_public_metrics() -> PublicMetrics:
    conn = _connect()
    try:
        _init(conn)
        now = datetime.now(timezone.utc)
        live_cutoff = (now - timedelta(minutes=5)).isoformat()
        today_cutoff = (now - timedelta(days=1)).isoformat()

        def scalar(query: str, params: tuple[object, ...] = ()) -> int:
            row = conn.execute(query, params).fetchone()
            return int(row[0] if row else 0)

        return PublicMetrics(
            live_users=scalar("SELECT COUNT(*) FROM users WHERE last_seen_at >= ?", (live_cutoff,)),
            active_users_today=scalar("SELECT COUNT(*) FROM users WHERE last_seen_at >= ?", (today_cutoff,)),
        )
    finally:
        conn.close()


def get_report_access(user_id: str, package_interest: ReportPackage) -> ReportAccess:
    ent = get_entitlements(user_id)
    normalized_email = ent.email.strip().lower() if ent.email else None

    if user_id in _admin_access_user_ids():
        return ReportAccess(
            package_interest=package_interest,
            can_access=True,
            requires_payment=False,
            reason="admin_allowlist",
            email=normalized_email,
        )

    email_bypass_enabled = settings.APP_ENV.lower() != "production"
    if email_bypass_enabled and normalized_email and normalized_email in _admin_access_emails():
        return ReportAccess(
            package_interest=package_interest,
            can_access=True,
            requires_payment=False,
            reason="admin_allowlist",
            email=normalized_email,
        )

    if ent.subscription_active:
        return ReportAccess(
            package_interest=package_interest,
            can_access=True,
            requires_payment=False,
            reason="subscription_active",
            email=normalized_email,
        )

    return ReportAccess(
        package_interest=package_interest,
        can_access=False,
        requires_payment=True,
        reason="payment_required",
        email=normalized_email,
    )
