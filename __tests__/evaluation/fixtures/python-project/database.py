"""Database operations."""

from typing import Optional, List, Dict
from models import User, Task, Project


class Database:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.tasks: Dict[str, Task] = {}
        self.projects: Dict[str, Project] = {}

    def get_user(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)

    def get_user_by_email(self, email: str) -> Optional[User]:
        for user in self.users.values():
            if user.email == email:
                return user
        return None

    def create_user(self, user: User) -> None:
        self.users[user.id] = user

    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)

    def get_user_tasks(self, user_id: str) -> List[Task]:
        return [t for t in self.tasks.values() if t.user_id == user_id]

    def create_task(self, task: Task) -> None:
        self.tasks[task.id] = task

    def update_task(self, task_id: str, **updates) -> Optional[Task]:
        task = self.tasks.get(task_id)
        if task:
            for key, value in updates.items():
                setattr(task, key, value)
        return task

    def delete_task(self, task_id: str) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False

    def get_project(self, project_id: str) -> Optional[Project]:
        return self.projects.get(project_id)

    def create_project(self, project: Project) -> None:
        self.projects[project.id] = project


db = Database()
