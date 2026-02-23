import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.chat_message import MessageRole


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    message: ChatMessageResponse
    actions_taken: list[str] = []


class PaginatedChatHistory(BaseModel):
    items: list[ChatMessageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
