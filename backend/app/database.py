from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# Test PostgreSQL connection; fallback to SQLite if offline
try:
    # Attempt to initialize postgres engine and make a quick connection test
    engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 10})
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Connected to PostgreSQL database successfully.")
except Exception as e:
    print(f"PostgreSQL connection test failed: {e}")
    print("PostgreSQL connection offline. Falling back to SQLite local database.")
    DATABASE_URL = "sqlite:///./vaizai_support.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_vector_extension():
    """Enable pgvector extension in PostgreSQL."""
    if "sqlite" in DATABASE_URL:
        return
    db = SessionLocal()
    try:
        db.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        db.commit()
    except Exception as e:
        print(f"Error initializing vector extension: {e}")
        db.rollback()
    finally:
        db.close()
