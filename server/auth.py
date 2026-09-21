import db
import secrets
import hashlib
import base64
from datetime import datetime, timedelta

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return base64.b64encode(salt).decode('utf-8') + "$" + base64.b64encode(key).decode('utf-8')

def verify_password(stored_hash: str, password: str) -> bool:
    try:
        salt_b64, key_b64 = stored_hash.split("$")
        salt = base64.b64decode(salt_b64)
        stored_key = base64.b64decode(key_b64)
        new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return secrets.compare_digest(stored_key, new_key)
    except Exception:
        return False

import re

def _clean_username(username):
    """Lowercase and validate username: 3-20 chars, letters/numbers/underscores only."""
    if not username:
        return None, "empty"
    username = username.strip().lower()
    if len(username) < 3 or len(username) > 20:
        return None, "Username must be 3–20 characters"
    if not re.match(r'^[a-z0-9_]+$', username):
        return None, "Username can only contain letters, numbers, and underscores"
    return username, None

def register(username, password):
    username, err = _clean_username(username)
    if err:
        return {"error": err}
    if not password or len(password) < 4:
        return {"error": "Password must be at least 4 characters"}
    
    if db.fetch_user_by_username(username):
        return {"error": "Username already taken"}
        
    db.add_user(username, hash_password(password), "")
    return {"success": True}

def login(username, password):
    username, err = _clean_username(username)
    if err:
        return {"error": err}
    user = db.fetch_user_by_username(username)
    if not user:
        return {"error": "Invalid username or password"}
        
    try:
        if not verify_password(user["argon2_hash"], password):
            return {"error": "Invalid username or password"}
    except:
        return {"error": "Invalid username or password"}
        
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