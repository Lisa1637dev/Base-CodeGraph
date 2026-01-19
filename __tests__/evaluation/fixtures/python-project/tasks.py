"""Task management service."""

from datetime import datetime
from typing import Optional, List

from models import Task
from database import db
from auth import auth_service, generate_token
from validation import validate_task_title


class TaskService:
    def create_task(
        self, token: str, title: str, description: Optional[str] = None
    ) -> Optional[Task]:
        """Create a new task."""
        user_id = auth_service.get_user_id(token)
        if not user_id:
            return None

        if not validate_task_title(title):
            return None

        task = Task(
            id=generate_token(),
            user_id=user_id,
            title=title,
            description=description,
            completed=False,
            created_at=datetime.now(),
        )
        db.create_task(task)
        return task

    def get_task(self, token: str, task_id: str) -> Optional[Task]:
        """Get a task by ID."""
        user_id = auth_service.get_user_id(token)
        if not user_id:
            return None

        task = db.get_task(task_id)
        if task and task.user_id == user_id:
            return task
        return None

    def get_user_tasks(self, token: str) -> List[Task]:
        """Get all tasks for the authenticated user."""
        user_id = auth_service.get_user_id(token)
        if not user_id:
            return []

        return db.get_user_tasks(user_id)

    def complete_task(self, token: str, task_id: str) -> bool:
        """Mark a task as completed."""
        task = self.get_task(token, task_id)
        if not task:
            return False

        db.update_task(task_id, completed=True, completed_at=datetime.now())
        return True

    def delete_task(self, token: str, task_id: str) -> bool:
        """Delete a task."""
        task = self.get_task(token, task_id)
        if not task:
            return False

        return db.delete_task(task_id)


task_service = TaskService()
