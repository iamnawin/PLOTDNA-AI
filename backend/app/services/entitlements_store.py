from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.core.config import settings


def _db_path() -> Path:
    # Local-first MVP: a tiny SQLite DB.
    # In production, replace with Supabase/Postgres + verified IAP receipts.
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


def _init(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL
        )
        """
    )
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
    conn.commit()


@dataclass(frozen=True)
class Entitlements:
    free_remaining: int
    subscription_active: bool
    subscription_expires_at: str | None


def ensure_user(user_id: str) -> None:
    conn = _connect()
    try:
        _init(conn)
        conn.execute("INSERT OR IGNORE INTO users (id, created_at) VALUES (?, ?)", (user_id, _now_iso()))
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


def get_entitlements(user_id: str) -> Entitlements:
    ensure_user(user_id)
    conn = _connect()
    try:
        _init(conn)
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
        )
    finally:
        conn.close()


def consume_search(user_id: str) -> Entitlements:
    """
    Enforces: FREE_SEARCH_LIMIT searches, then subscription required.
    """
    ensure_user(user_id)
    current = get_entitlements(user_id)
    if current.subscription_active:
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
