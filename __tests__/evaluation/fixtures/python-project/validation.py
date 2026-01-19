"""Validation utilities."""

import re


def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> bool:
    """Validate password strength."""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True


def validate_task_title(title: str) -> bool:
    """Validate task title."""
    return bool(title and len(title.strip()) >= 1 and len(title) <= 200)
