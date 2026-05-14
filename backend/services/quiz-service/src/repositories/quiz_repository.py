# backend/services/quiz-service/src/repositories/quiz_repository.py
from datetime import datetime
from typing import Dict, Any, Optional, List
from fastapi import HTTPException
from ..database.db import get_db


class QuizRepository:
    """Repository for quiz sessions and results"""

    def __init__(self):
        self._ready = False
        self.db = None
        self.sessions = None
        self.results = None

    def _ensure(self):
        if self._ready:
            return
        d = get_db()
        if d is None:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Quiz database unavailable. Start MongoDB locally (mongodb://localhost:27017) "
                    "or set MONGO_URI / DB_NAME in the quiz-service environment."
                ),
            )
        self.db = d
        self.sessions = d.quiz_sessions
        self.results = d.quiz_results
        self._ready = True

    # ===== SESSION MANAGEMENT =====

    def save_session(self, session_id: str, user_id: str, state: Dict[str, Any]) -> Dict[str, Any]:
        """Save or update quiz session"""
        self._ensure()
        session_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "state": state,
            "updated_at": datetime.utcnow()
        }
        
        self.sessions.update_one(
            {"session_id": session_id},
            {"$set": session_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True
        )
        return session_doc
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get quiz session by ID"""
        self._ensure()
        return self.sessions.find_one({"session_id": session_id})
    
    def get_user_active_session(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's most recent incomplete session"""
        self._ensure()
        return self.sessions.find_one(
            {
                "user_id": user_id,
                "state.is_complete": False
            },
            sort=[("created_at", -1)]
        )
    
    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all sessions for a user"""
        self._ensure()
        return list(self.sessions.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit))
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        self._ensure()
        result = self.sessions.delete_one({"session_id": session_id})
        return result.deleted_count > 0
    
    # ===== RESULTS MANAGEMENT =====
    
    def save_result(self, session_id: str, user_id: str, results: Dict[str, Any], background: Dict[str, Any]) -> Dict[str, Any]:
        """Save quiz results"""
        self._ensure()
        result_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "holland_code": results.get("holland_code"),
            "dimension_averages": results.get("dimension_averages"),
            "sorted_results": results.get("sorted_results"),
            "total_questions": results.get("total_questions"),
            "background": background,
            "completed_at": datetime.utcnow()
        }
        
        self.results.update_one(
            {"session_id": session_id},
            {"$set": result_doc},
            upsert=True
        )
        return result_doc
    
    def get_result(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get results by session ID"""
        self._ensure()
        return self.results.find_one({"session_id": session_id})
    
    def get_user_latest_result(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's most recent completed quiz result"""
        self._ensure()
        return self.results.find_one(
            {"user_id": user_id},
            sort=[("completed_at", -1)]
        )
    
    def get_user_results(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get all results for a user"""
        self._ensure()
        return list(self.results.find(
            {"user_id": user_id}
        ).sort("completed_at", -1).limit(limit))
    
    def has_completed_quiz(self, user_id: str) -> bool:
        """Check if user has completed at least one quiz"""
        self._ensure()
        return self.results.count_documents({"user_id": user_id}) > 0

# Singleton instance
quiz_repo = QuizRepository()
