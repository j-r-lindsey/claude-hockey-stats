from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import os
import hashlib
import hmac

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using bcrypt or PBKDF2."""
    try:
        # First try bcrypt (original format)
        if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
            return pwd_context.verify(plain_password, hashed_password)
        
        # Then try PBKDF2 format: salt:hash
        if ':' in hashed_password:
            stored_salt, stored_hash = hashed_password.split(':')
            # Hash the plain password with the same salt
            password_hash = hashlib.pbkdf2_hmac('sha256', 
                                              plain_password.encode('utf-8'), 
                                              bytes.fromhex(stored_salt), 
                                              100000)
            return hmac.compare_digest(stored_hash, password_hash.hex())
        
        # If neither format matches, try bcrypt anyway (might be malformed)
        return pwd_context.verify(plain_password, hashed_password)
    except:
        return False

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

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