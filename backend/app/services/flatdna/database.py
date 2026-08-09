from __future__ import annotations

from sqlalchemy import Engine, create_engine

from app.core.config import settings


class FlatDnaDatabaseConfigurationError(RuntimeError):
    pass


def create_flatdna_engine(database_url: str | None = None) -> Engine:
    url = database_url if database_url is not None else settings.DATABASE_URL
    if not url:
        raise FlatDnaDatabaseConfigurationError("FlatDNA DATABASE_URL is not configured")
    return create_engine(url, pool_pre_ping=True)
