"""Data models for the application."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List


@dataclass
class User:
    id: str
    email: str
    name: str
    password_hash: str
    created_at: datetime


@dataclass
class Task:
    id: str
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    completed_at: Optional[datetime] = None


@dataclass
class Project:
    id: str
    user_id: str
    name: str
    tasks: List[str]  # Task IDs
    created_at: datetime
