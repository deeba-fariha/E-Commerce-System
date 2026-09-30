"""
Small, safe schema migrations for existing databases.

Base.metadata.create_all() creates missing TABLES but never adds
COLUMNS to tables that already exist. run_migrations() fills that
gap. It runs once at server start-up (see prepare_database(), called
from the FastAPI lifespan in main.py) and is idempotent: every step
can run again safely, only ADDs columns / rows, and never drops or
rewrites existing data.

Locking rules (PostgreSQL / Neon):
  * Every step runs in its own short `with engine.begin()` block and
    is committed immediately; no transaction is ever held open while
    another connection is used. (A single long transaction used to
    hold the lock from the first ALTER TABLE while the schema check
    waited on it from a second connection, so start-up hung.)
  * Schema checks use their own short connection, closed before any
    ALTER TABLE runs.
  * Each step sets `lock_timeout`, so if another connection (a pgAdmin
    query tab, a stale uvicorn process, ...) holds a lock on the table,
    start-up stops with a clear message instead of waiting forever.
"""

import re
import sys

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError


LOCK_TIMEOUT = "5s"

# PostgreSQL SQLSTATE for lock_timeout / NOWAIT failures
LOCK_NOT_AVAILABLE = "55P03"


class MigrationLockError(RuntimeError):
    """Another connection holds a lock the migration needs."""


def _log(message: str):
    print(f"[migrations] {message}", flush=True)


def _is_postgres(engine: Engine) -> bool:
    return engine.dialect.name == "postgresql"


# =========================================================
# HELPERS
# =========================================================

def _columns(engine: Engine, table: str) -> dict[str, dict]:
    """Current columns of a table, read on a short connection of its own."""
    with engine.connect() as conn:
        return {col["name"]: col for col in inspect(conn).get_columns(table)}


def _is_lock_timeout(exc: OperationalError) -> bool:
    return getattr(exc.orig, "sqlstate", None) == LOCK_NOT_AVAILABLE


def _run(engine: Engine, table: str, *statements, params: dict | None = None):
    """
    Runs statements in ONE short transaction that is committed
    immediately. A statement is SQL text, or (SQL text, params).
    For the last statement returns its rows (a list of tuples) if it
    is a query, else the number of affected rows. Results are read
    before the connection is released.
    """
    try:
        with engine.begin() as conn:
            if _is_postgres(engine):
                conn.execute(text(f"SET LOCAL lock_timeout = '{LOCK_TIMEOUT}'"))

            result = None
            for statement in statements:
                sql, values = statement if isinstance(statement, tuple) else (statement, params)
                result = conn.execute(text(sql), values or {})

            if result is not None and result.returns_rows:
                return [tuple(row) for row in result.fetchall()]
            return result.rowcount if result is not None else 0

    except OperationalError as exc:
        if not _is_lock_timeout(exc):
            raise

        message = (
            f"another connection is holding a lock on {table}; close pgAdmin "
            "query tabs or stale processes and restart"
        )
        print(f"[migrations] ERROR: {message}", file=sys.stderr, flush=True)
        raise MigrationLockError(message) from None


def _add_column(engine: Engine, table: str, column: str, ddl: str) -> bool:
    """ALTER TABLE ... ADD COLUMN, only if the column is missing."""
    if column in _columns(engine, table):
        return False

    if _is_postgres(engine):
        sql = f'ALTER TABLE "{table}" ADD COLUMN IF NOT EXISTS {column} {ddl}'
    else:
        # SQLite (used by the tests) has no ADD COLUMN IF NOT EXISTS;
        # the column check above makes it safe.
        sql = f'ALTER TABLE "{table}" ADD COLUMN {column} {ddl}'

    _run(engine, table, sql)
    _log(f"added {table}.{column}")
    return True


# =========================================================
# CUSTOMERS: created_at, last_login_at
# =========================================================

def _migrate_users(engine: Engine):
    _add_column(engine, "users", "created_at", "TIMESTAMP WITH TIME ZONE")

    # Existing customers get the migration time, since their real
    # registration date was never stored. Harmless when nothing is NULL.
    _run(
        engine, "users",
        "UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL",
    )

    # Only needed once; also completes a run that stopped half-way
    if _is_postgres(engine) and _columns(engine, "users")["created_at"]["nullable"]:
        _run(
            engine, "users",
            "ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now(), "
            "ALTER COLUMN created_at SET NOT NULL",
        )
        _log("users.created_at is now NOT NULL with a default")

    _add_column(engine, "users", "last_login_at", "TIMESTAMP WITH TIME ZONE")


# =========================================================
# CATEGORIES: seed the storefront's original categories
# =========================================================
# Same slugs the home page, seller forms and existing products
# already use, so nothing breaks. Only runs on an empty table,
# so categories the admin deletes/renames are never re-added.

DEFAULT_CATEGORIES = [
    ("Electronics", "electronics", "laptop"),
    ("Audio & Sound", "audio", "headphones"),
    ("Wearables", "wearables", "smartwatch"),
    ("Fashion & Bags", "fashion", "bag"),
    ("Home & Living", "home", "house"),
]


def _seed_categories(engine: Engine):
    count = _run(engine, "categories", "SELECT COUNT(*) FROM categories")[0][0]
    if count:
        return

    insert = (
        "INSERT INTO categories (name, slug, icon, created_at) "
        "VALUES (:name, :slug, :icon, CURRENT_TIMESTAMP)"
    )
    _run(
        engine, "categories",
        *[(insert, {"name": name, "slug": slug, "icon": icon})
          for name, slug, icon in DEFAULT_CATEGORIES],
    )

    _log(f"seeded {len(DEFAULT_CATEGORIES)} categories")


# =========================================================
# PRODUCTS: category_id (FK) + added_by_role
# =========================================================

def _migrate_products(engine: Engine):
    _add_column(
        engine, "products", "added_by_role",
        "VARCHAR(20) DEFAULT 'seller' NOT NULL"
    )

    # Products added before this change all came from sellers,
    # except any without a seller.
    _run(
        engine, "products",
        "UPDATE products SET added_by_role = 'admin' "
        "WHERE seller_id IS NULL AND added_by_role = 'seller'",
    )

    _add_column(
        engine, "products", "category_id",
        "INTEGER REFERENCES categories(id)"
    )

    _run(
        engine, "products",
        "CREATE INDEX IF NOT EXISTS ix_products_category_id "
        "ON products (category_id)",
    )

    _link_products_to_categories(engine)


def _link_products_to_categories(engine: Engine):
    """
    Sets category_id on products that don't have one yet, using the
    old text column (products.category = a slug like "electronics").
    A slug with no matching category gets a category created for it,
    so no product is left without one. One short transaction per slug.
    """
    unlinked = [row[0] for row in _run(
        engine, "products",
        "SELECT DISTINCT category FROM products WHERE category_id IS NULL",
    )]

    for old_value in unlinked:
        # products.category is NOT NULL, but may hold "" or odd text
        slug = re.sub(r"[^a-z0-9]+", "-", (old_value or "").lower()).strip("-") or "uncategorized"
        name = slug.replace("-", " ").title()

        found = _run(
            engine, "categories",
            "SELECT id FROM categories WHERE slug = :slug OR lower(name) = lower(:name) "
            "ORDER BY (slug = :slug) DESC LIMIT 1",
            params={"slug": slug, "name": name},
        )

        if found:
            category_id = found[0][0]
        else:
            category_id = _run(
                engine, "categories",
                "INSERT INTO categories (name, slug, created_at) "
                "VALUES (:name, :slug, CURRENT_TIMESTAMP)",
                "SELECT id FROM categories WHERE slug = :slug",
                params={"name": name, "slug": slug},
            )[0][0]
            _log(f"created category '{name}' for existing products")

        # Link the rows and sync the text copy to the category's slug
        linked = _run(
            engine, "products",
            "UPDATE products "
            "SET category_id = :cid, "
            "    category = (SELECT slug FROM categories WHERE id = :cid), "
            "    category_name = (SELECT name FROM categories WHERE id = :cid) "
            "WHERE category_id IS NULL AND category = :old",
            params={"cid": category_id, "old": old_value},
        )
        _log(f"linked {linked} product(s) to category '{slug}'")


# =========================================================
# ENTRY POINTS
# =========================================================

def run_migrations(engine: Engine):
    _migrate_users(engine)
    _seed_categories(engine)
    _migrate_products(engine)


def prepare_database(engine: Engine):
    """Creates missing tables, then applies the migrations above."""
    # Imported here so importing this module has no side effects
    from .database import Base
    from . import models  # noqa: F401  (registers all tables on Base)

    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
