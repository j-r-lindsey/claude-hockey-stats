import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
import jwt
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using PBKDF2 or bcrypt (for legacy)."""
    try:
        # Check if it's a bcrypt hash (legacy format)
        if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
            # Legacy bcrypt hashes are not supported in minimal deployment
            return False
        
        # PBKDF2 format: salt:hash
        if ':' in hashed_password:
            stored_salt, stored_hash = hashed_password.split(':')
            # Hash the plain password with the same salt
            password_hash = hashlib.pbkdf2_hmac('sha256', 
                                              plain_password.encode('utf-8'), 
                                              bytes.fromhex(stored_salt), 
                                              100000)
            return hmac.compare_digest(stored_hash, password_hash.hex())
        
        return False
    except:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password using PBKDF2."""
    # Generate a random salt
    salt = secrets.token_hex(32)
    # Hash the password
    password_hash = hashlib.pbkdf2_hmac('sha256', 
                                      password.encode('utf-8'), 
                                      bytes.fromhex(salt), 
                                      100000)
    # Return salt:hash format
    return f"{salt}:{password_hash.hex()}"

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt