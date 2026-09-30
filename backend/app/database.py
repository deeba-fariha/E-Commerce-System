import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv(
    os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        ".env"
    )
)


# =========================================================
# DATABASE URL
# =========================================================
# Neon (recommended): set DATABASE_URL to the connection
# string from the Neon console, e.g.
#   postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require
#
# Fallback: build the URL from DB_HOST / DB_PORT / ... vars.

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    DATABASE_URL = (
        f"postgresql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

# SQLAlchemy needs the psycopg (v3) driver name in the URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

# Neon only accepts SSL connections
if "neon.tech" in DATABASE_URL and "sslmode=" not in DATABASE_URL:
    DATABASE_URL += ("&" if "?" in DATABASE_URL else "?") + "sslmode=require"


engine = create_engine(
    DATABASE_URL,
    # Neon suspends idle computes and closes idle connections,
    # so check each pooled connection before using it.
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
