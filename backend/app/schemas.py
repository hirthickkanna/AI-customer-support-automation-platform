from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_name: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    mfa_required: bool

class VerifyMFA(BaseModel):
    email: EmailStr
    code: str

# Ticket Schemas
class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str = "MEDIUM"
    category: str = "General"
    file_attachment_url: Optional[str] = None

class TicketMessageCreate(BaseModel):
    message_text: str

class TicketMessageOut(BaseModel):
    id: int
    sender_type: str
    sender_id: Optional[int]
    message_text: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TicketOut(BaseModel):
    id: int
    title: str
    description: str
    priority: str
    status: str
    created_at: datetime
    sla_expires_at: Optional[datetime]
    assigned_agent_id: Optional[int]
    assigned_agent_name: Optional[str] = None
    notes: Optional[str] = None
    messages: List[TicketMessageOut] = []

    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    notes: Optional[str] = None

class StaffUserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role_name: str

    class Config:
        from_attributes = True

# KB Schemas
class KBArticleCreate(BaseModel):
    title: str
    category: str
    content: str
    tags: List[str]

class KBArticleOut(BaseModel):
    id: int
    title: str
    category: str
    content: str
    tags: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Chat Schemas
class ChatMessageCreate(BaseModel):
    message_text: str

class ChatMessageOut(BaseModel):
    id: int
    sender_type: str
    message_text: str
    created_at: datetime
    sentiment_score: float

    class Config:
        from_attributes = True

# Sentiment log Schema
class SentimentLogOut(BaseModel):
    id: int
    raw_text: str
    anger_score: float
    created_at: datetime

    class Config:
        from_attributes = True

# Workflow Schema
class WorkflowCreate(BaseModel):
    name: str
    trigger_condition: str
    action_type: str
    action_payload: Dict[str, Any]

class WorkflowOut(BaseModel):
    id: int
    name: str
    trigger_condition: str
    action_type: str
    is_active: bool

    class Config:
        from_attributes = True

# Subscription Schemas
class SubscriptionStatusOut(BaseModel):
    plan_type: str                          # free | basic_daily | pro_unlimited
    total_free_tickets_used: int
    tickets_used_today: int
    subscription_start: Optional[datetime]
    subscription_end: Optional[datetime]
    days_remaining: Optional[int]
    is_active: bool
    quota_exceeded: bool
    # Computed display info
    daily_limit: Optional[int]             # None = unlimited, 20 = basic
    free_tickets_remaining: Optional[int]  # only for free plan

    class Config:
        from_attributes = True

class CreateOrderRequest(BaseModel):
    plan_type: str  # 'basic_daily' | 'pro_unlimited'

class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int        # in paise (₹99 = 9900)
    currency: str
    plan_type: str
    key_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_type: str

class ChannelOut(BaseModel):
    id: int
    name: str
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    config_settings: Optional[Dict[str, Any]] = None
    is_enabled: bool

    class Config:
        from_attributes = True

class ChannelUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    config_settings: Optional[Dict[str, Any]] = None

