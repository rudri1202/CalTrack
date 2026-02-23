"""AI service: image analysis and Groq-powered nutrition chat with meal logging."""
import uuid
import json
import re
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from groq import Groq
from app.config import get_settings
from app.models.chat_message import ChatMessage, MessageRole
from app.models.goal import Goal
from app.models.food_entry import FoodEntry
from app.schemas.food_entry import FoodEntryCreate
from app.services.entry_service import create_entry
from app.utils.pagination import get_offset, paginate

settings = get_settings()


def _get_groq_client() -> Groq:
    """Return a configured Groq client (Llama 3 / Mistral / Gemma)."""
    if not settings.groq_api_key or settings.groq_api_key == "your-groq-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chat not configured. Add GROQ_API_KEY to .env (free at console.groq.com).",
        )
    return Groq(api_key=settings.groq_api_key)


# ---------------------------------------------------------------------------
# Image analysis — returns editable placeholder values.
# The frontend pre-fills the meal entry form; the user adjusts before saving.
# ---------------------------------------------------------------------------
def analyze_image(image_bytes: bytes, content_type: str) -> dict:
    """
    Returns a template nutritional response.
    The frontend pre-fills the entry form so the user can fill in the real values.
    """
    return {
        "food_name": "Chickpea Salad",
        "quantity": 1.0,
        "quantity_unit": "bowl",
        "calories": 350.0,
        "protein_g": 14.0,
        "carbs_g": 42.0,
        "fat_g": 12.0,
        "fiber_g": 9.0,
        "sugar_g": 6.0,
        "sodium_mg": 480.0,
        "micronutrients": None,
    }


# ---------------------------------------------------------------------------
# Chat — powered by Groq (Llama 3.3 70B by default, free tier)
# ---------------------------------------------------------------------------
async def chat(
    db: AsyncSession,
    user_id: uuid.UUID,
    user_message: str,
) -> tuple[str, list[str]]:
    """Send a message to Llama via Groq and return (response_text, actions_taken)."""
    client = _get_groq_client()

    # Load user's goal for context
    goal_result = await db.execute(select(Goal).where(Goal.user_id == user_id))
    goal = goal_result.scalar_one_or_none()

    # Load today's entries for context
    today = date.today()
    entries_result = await db.execute(
        select(FoodEntry)
        .where(FoodEntry.user_id == user_id, FoodEntry.logged_at == today)
        .order_by(FoodEntry.created_at)
    )
    today_entries = entries_result.scalars().all()

    # Build context block
    if goal:
        goal_context = (
            f"User's daily goals: {goal.daily_calories} kcal, "
            f"protein {goal.protein_g}g, carbs {goal.carbs_g}g, fat {goal.fat_g}g"
        )
        if goal.weight_goal_kg:
            goal_context += f", weight goal {goal.weight_goal_kg} kg"
    else:
        goal_context = "No nutrition goals set yet."

    if today_entries:
        total_cals = sum(e.calories for e in today_entries)
        entries_context = f"Today's logged meals ({len(today_entries)} entries, {total_cals:.0f} kcal total):\n"
        for e in today_entries:
            entries_context += (
                f"- {e.meal_type.value}: {e.food_name} "
                f"({e.calories:.0f} kcal, P:{e.protein_g:.0f}g C:{e.carbs_g:.0f}g F:{e.fat_g:.0f}g)\n"
            )
    else:
        entries_context = "No meals logged today yet."

    system_prompt = f"""You are a helpful nutrition assistant for a personal calorie tracker app. Today is {today.isoformat()}.

{goal_context}
{entries_context}

You help users: log meals, check nutritional progress, answer nutrition questions, give dietary advice.

When a user asks you to log a specific meal or food, include a JSON action block EXACTLY like this on its own line:
<action>{{"type":"log_meal","meal_type":"breakfast","food_name":"Oats with milk","quantity":100,"quantity_unit":"g","calories":150,"protein_g":5,"carbs_g":27,"fat_g":3,"logged_at":"{today.isoformat()}"}}</action>

Rules:
- Only include <action> blocks when the user explicitly asks to log food.
- Use one of: breakfast, lunch, dinner, snack for meal_type.
- Estimate nutritional values if the user doesn't provide them.
- Be concise and friendly. No markdown headers."""

    # Load recent history (last 20 messages) for conversational context
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
    )
    recent_messages = list(reversed(history_result.scalars().all()))

    # Build OpenAI-compatible message list (Groq uses the same format)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in recent_messages:
        messages.append({
            "role": "user" if msg.role == MessageRole.user else "assistant",
            "content": msg.content,
        })
    messages.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model=settings.groq_model,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        assistant_text = completion.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        )

    # Parse and execute any <action> blocks embedded in the response
    actions_taken = []
    action_pattern = re.compile(r'<action>(.*?)</action>', re.DOTALL)
    for action_match in action_pattern.finditer(assistant_text):
        try:
            action_data = json.loads(action_match.group(1).strip())
            if action_data.get("type") == "log_meal":
                entry_data = FoodEntryCreate(
                    meal_type=action_data["meal_type"],
                    food_name=action_data["food_name"],
                    quantity=float(action_data.get("quantity", 1.0)),
                    quantity_unit=action_data.get("quantity_unit", "serving"),
                    calories=float(action_data.get("calories", 0.0)),
                    protein_g=float(action_data.get("protein_g", 0.0)),
                    carbs_g=float(action_data.get("carbs_g", 0.0)),
                    fat_g=float(action_data.get("fat_g", 0.0)),
                    logged_at=date.fromisoformat(action_data.get("logged_at", today.isoformat())),
                )
                await create_entry(db, user_id, entry_data)
                actions_taken.append(f"Logged: {action_data['food_name']}")
        except Exception:
            pass  # Don't fail the response if an action block is malformed

    # Strip action tags from the visible response text
    clean_response = action_pattern.sub("", assistant_text).strip()

    # Persist both messages to the DB
    db.add(ChatMessage(user_id=user_id, role=MessageRole.user, content=user_message))
    assistant_msg = ChatMessage(user_id=user_id, role=MessageRole.assistant, content=clean_response)
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)  # populate DB-generated id and created_at

    return clean_response, actions_taken, assistant_msg


async def get_chat_history(
    db: AsyncSession,
    user_id: uuid.UUID,
    page: int,
    page_size: int,
) -> dict:
    from sqlalchemy import func as sqlfunc
    count_result = await db.execute(
        select(sqlfunc.count()).select_from(ChatMessage).where(ChatMessage.user_id == user_id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .offset(get_offset(page, page_size))
        .limit(page_size)
    )
    items = result.scalars().all()

    return {"items": items, **paginate(total, page, page_size)}
