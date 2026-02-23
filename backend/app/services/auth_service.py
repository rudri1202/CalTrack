"""Auth business logic: register, login, token refresh."""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.user import User
from app.models.goal import Goal
from app.schemas.auth import UserCreate, UserLogin
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.utils.nutrition import calculate_goals


async def register_user(db: AsyncSession, data: UserCreate) -> tuple[User, str, str]:
    """Create a new user and return (user, access_token, refresh_token)."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        height_cm=data.height_cm,
        weight_kg=data.weight_kg,
        age=data.age,
        gender=data.gender,
        goal_type=data.goal_type,
    )
    db.add(user)
    await db.flush()  # Get the user.id before committing

    # Auto-calculate goals when all profile fields are provided
    goal_kwargs: dict = {}
    if all([data.height_cm, data.weight_kg, data.age, data.gender, data.goal_type]):
        goal_kwargs = calculate_goals(
            height_cm=data.height_cm,  # type: ignore[arg-type]
            weight_kg=data.weight_kg,  # type: ignore[arg-type]
            age=data.age,              # type: ignore[arg-type]
            gender=data.gender,        # type: ignore[arg-type]
            goal_type=data.goal_type,  # type: ignore[arg-type]
        )

    goal = Goal(user_id=user.id, **goal_kwargs)
    db.add(goal)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return user, access_token, refresh_token


async def login_user(db: AsyncSession, data: UserLogin) -> tuple[User, str, str]:
    """Authenticate user and return (user, access_token, refresh_token)."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return user, access_token, refresh_token


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> tuple[User, str, str]:
    """Validate refresh token and issue new token pair."""
    user_id = decode_token(refresh_token, token_type="refresh")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_access = create_access_token(user.id)
    new_refresh = create_refresh_token(user.id)
    return user, new_access, new_refresh
