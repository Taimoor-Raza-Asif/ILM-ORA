# backend/services/quiz-service/src/database/db.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "quiz_db")

client = None
db = None

def connect_db():
    """Initialize MongoDB connection. Does not raise: service stays up for /health when Mongo is down."""
    global client, db
    if client is not None and db is not None:
        return db
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        client.admin.command('ping')
        print(f"Connected to MongoDB: {DB_NAME}")

        db.quiz_sessions.create_index("session_id", unique=True)
        db.quiz_sessions.create_index("user_id")
        db.quiz_sessions.create_index([("user_id", 1), ("created_at", -1)])

        db.quiz_results.create_index("session_id", unique=True)
        db.quiz_results.create_index("user_id")
        db.quiz_results.create_index([("user_id", 1), ("completed_at", -1)])

        return db
    except Exception as e:
        print(f"WARNING: MongoDB unavailable for quiz service: {e}")
        print("  Start MongoDB (e.g. mongod) or set MONGO_URI in quiz-service .env")
        if client:
            try:
                client.close()
            except Exception:
                pass
        client = None
        db = None
        return None


def is_database_available():
    return db is not None


def get_db():
    """Get database instance (may be None if Mongo is unreachable)."""
    global db
    if db is None:
        connect_db()
    return db


def close_db():
    """Close MongoDB connection"""
    global client, db
    if client:
        try:
            client.close()
        except Exception:
            pass
        print("MongoDB connection closed")
    client = None
    db = None
