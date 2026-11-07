import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, URL, text
from sqlalchemy.orm import sessionmaker, declarative_base


# ==========================================
# 1. Backend folder
# ==========================================

BASE_DIR = Path(__file__).resolve().parent


# ==========================================
# 2. Load environment variables
# ==========================================

env_path = BASE_DIR / ".env"

# Keep Render environment variables as priority.
# Locally, values are loaded from backend/.env.
load_dotenv(dotenv_path=env_path, override=False)


# ==========================================
# 3. Database configuration
# ==========================================

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT", "3306")
db_name = os.getenv("DB_NAME")


# ==========================================
# 4. Validate database settings
# ==========================================

if not all([db_user, db_password, db_host, db_name]):
    raise ValueError(
        "Missing database settings. "
        "Check backend/.env or Render environment variables."
    )


# ==========================================
# 5. TiDB SSL certificate
# ==========================================

CA_CERT_PATH = BASE_DIR / "certs" / "isrgrootx1.pem"

connect_args = {}

# Local MySQL does not need the TiDB CA certificate.
# Remote database connections use SSL.
if db_host not in ("localhost", "127.0.0.1"):

    if not CA_CERT_PATH.exists():
        raise FileNotFoundError(
            f"TiDB CA certificate not found: {CA_CERT_PATH}"
        )

    connect_args = {
        "ssl": {
            "ca": str(CA_CERT_PATH)
        }
    }


# ==========================================
# 6. Build database URL
# ==========================================

DATABASE_URL = URL.create(
    "mysql+pymysql",
    username=db_user,
    password=db_password,
    host=db_host,
    port=int(db_port),
    database=db_name,
)


# ==========================================
# 7. Create database engine
# ==========================================

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=1800,
)


# ==========================================
# 8. Database session
# ==========================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ==========================================
# 9. SQLAlchemy Base
# ==========================================

Base = declarative_base()


# ==========================================
# 10. Database dependency
# ==========================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==========================================
# 11. Database connection test
# ==========================================

def test_database_connection():

    with engine.connect() as connection:

        result = connection.execute(
            text("SELECT 1")
        )

        return result.scalar()