"""Auth request/response schemas: UserCreate, UserLogin, UserResponse, tokens."""
import uuid
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator

Gender = Literal['male', 'female']
GoalType = Literal['bulking', 'cutting', 'maintenance']


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

    # Optional profile fields — all five required together to trigger auto goal calculation
    height_cm: float | None = None
    weight_kg: float | None = None
    age: int | None = None
    gender: Gender | None = None
    goal_type: GoalType | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    height_cm: float | None
    weight_kg: float | None
    age: int | None
    gender: str | None
    goal_type: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefresh(BaseModel):
    refresh_token: str
