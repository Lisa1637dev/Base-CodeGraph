"""Authentication service."""

import hashlib
import secrets
from datetime import datetime
from typing import Optional, Tuple

from models import User
from database import db
from validation import validate_email, validate_password


def hash_password(password: str) -> str:
    """Hash a password for storage."""
    salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256((password + salt).encode())
    return f"{salt}:{hash_obj.hexdigest()}"


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    salt, stored_hash = password_hash.split(":")
    hash_obj = hashlib.sha256((password + salt).encode())
    return hash_obj.hexdigest() == stored_hash


def generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)


class AuthService:
    def __init__(self):
        self.tokens: dict = {}

    def register(self, email: str, password: str, name: str) -> Tuple[bool, str]:
        """Register a new user."""
        if not validate_email(email):
            return False, "Invalid email format"

        if not validate_password(password):
            return False, "Password too weak"

        if db.get_user_by_email(email):
            return False, "Email already registered"

        user = User(
            id=generate_token(),
            email=email,
            name=name,
            password_hash=hash_password(password),
            created_at=datetime.now(),
        )
        db.create_user(user)
        return True, user.id

    def login(self, email: str, password: str) -> Optional[str]:
        """Authenticate user and return token."""
        user = db.get_user_by_email(email)
        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        token = generate_token()
        self.tokens[token] = user.id
        return token

    def logout(self, token: str) -> None:
        """Invalidate a token."""
        self.tokens.pop(token, None)

    def get_user_id(self, token: str) -> Optional[str]:
        """Get user ID from token."""
        return self.tokens.get(token)


auth_service = AuthService()
