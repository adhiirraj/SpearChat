import db
import secrets
from argon2 import PasswordHasher
from datetime import datetime, timedelta

ph = PasswordHasher()

def register(username, password):
    if not username or not password:
        return {"error": "empty"}
    
    if db.fetch_user_by_username(username):
        return {"error": "taken"}
        
    db.add_user(username, ph.hash(password), "")
    return {"success": True}

def login(username, password):
    user = db.fetch_user_by_username(username)
    if not user:
        return {"error": "invalid"}
        
    try:
        ph.verify(user["argon2_hash"], password)
    except:
        return {"error": "invalid"}
        
    token = secrets.token_hex(32)
    expires_at = datetime.now() + timedelta(days=7)
    
    db.add_session(user["id"], token, expires_at)
    return {"token": token}

def verify_token(token):
    session = db.fetch_session_by_token(token)
    if not session:
        return None
        
    expires_at = datetime.fromisoformat(str(session["expires_at"]))
    if expires_at < datetime.now():
        db.delete_session(token)
        return None
        
    return session["user_id"]