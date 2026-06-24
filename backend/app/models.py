import datetime
import json
import os
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float, JSON, Date
from sqlalchemy.types import TypeDecorator, TEXT
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base
from app.core.config import settings

class SafeVector(TypeDecorator):
    """Custom SQLite-compatible text type mapping for pgvector embedding floats arrays."""
    impl = TEXT
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return None

    def process_result_value(self, value, dialect):
        if value is not None:
            try:
                return json.loads(value)
            except Exception:
                return value
        return None


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    mfa_secret = Column(String(100))
    mfa_enabled = Column(Boolean, default=False)
    role_id = Column(Integer, ForeignKey("roles.id"))
    
    role = relationship("Role", back_populates="users")
    tickets_assigned = relationship("Ticket", back_populates="assigned_agent")
    audit_logs = relationship("AuditLog", back_populates="user")

    @property
    def role_name(self) -> str:
        return self.role.name if self.role else "unknown"

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    phone = Column(String(20))
    whatsapp_id = Column(String(50))
    
    tickets = relationship("Ticket", back_populates="customer")
    chat_sessions = relationship("ChatSession", back_populates="customer")
    subscription = relationship("Subscription", back_populates="customer", uselist=False)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH
    status = Column(String(20), default="OPEN") # OPEN, PENDING, ESCALATED, CLOSED
    customer_id = Column(Integer, ForeignKey("customers.id"))
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    sla_expires_at = Column(DateTime)

    customer = relationship("Customer", back_populates="tickets")
    assigned_agent = relationship("User", back_populates="tickets_assigned")
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan")

    @property
    def assigned_agent_name(self) -> str:
        return self.assigned_agent.full_name if self.assigned_agent else "Unassigned"

class TicketMessage(Base):
    __tablename__ = "ticket_messages"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    sender_type = Column(String(20)) # customer, agent, ai
    sender_id = Column(Integer, nullable=True)
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    file_attachment_url = Column(String(255))
    
    ticket = relationship("Ticket", back_populates="messages")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    session_token = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    channel = Column(String(50), default="web_chat") # web_chat, whatsapp, telegram
    
    customer = relationship("Customer", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    sender_type = Column(String(20)) # customer, ai_agent, router
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    sentiment_score = Column(Float, default=0.5)
    
    session = relationship("ChatSession", back_populates="messages")

class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(JSON)
    embedding = Column(SafeVector if "sqlite" in settings.DATABASE_URL else Vector(1536))  # Dynamic pgvector fallback for SQLite
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    trigger_condition = Column(String(255), nullable=False) # e.g. sentiment = NEGATIVE, priority = HIGH
    action_type = Column(String(100), nullable=False) # e.g. escalate, slack_notify, email_send
    action_payload = Column(JSON)
    is_active = Column(Boolean, default=True)

class WorkflowLog(Base):
    __tablename__ = "workflow_logs"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    ticket_id = Column(Integer, nullable=True)
    execution_status = Column(String(50)) # SUCCESS, FAILED
    error_message = Column(Text)
    triggered_at = Column(DateTime, default=datetime.datetime.utcnow)

class SentimentLog(Base):
    __tablename__ = "sentiment_logs"
    id = Column(Integer, primary_key=True, index=True)
    chat_message_id = Column(Integer, nullable=True)
    ticket_message_id = Column(Integer, nullable=True)
    raw_text = Column(Text)
    anger_score = Column(Float)
    emotion_scores = Column(JSON) # e.g., {"joy": 0.1, "anger": 0.8, "sadness": 0.1}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Channel(Base):
    __tablename__ = "channels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # whatsapp, telegram, messenger
    api_key = Column(String(255))
    webhook_url = Column(String(255))
    config_settings = Column(JSON)
    is_enabled = Column(Boolean, default=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action_performed = Column(String(255), nullable=False)
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="audit_logs")


class Subscription(Base):
    """Tracks per-customer subscription plan and ticket quota."""
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)

    # Plan: 'free' | 'basic_daily' | 'pro_unlimited'
    plan_type = Column(String(30), default="free", nullable=False)

    # Free tier: tracks lifetime free tickets (max 20)
    total_free_tickets_used = Column(Integer, default=0, nullable=False)

    # Basic plan: tickets submitted today (resets daily at midnight)
    tickets_used_today = Column(Integer, default=0, nullable=False)
    last_daily_reset = Column(Date, default=datetime.date.today, nullable=False)

    # Subscription period (set on payment confirmation)
    subscription_start = Column(DateTime, nullable=True)
    subscription_end = Column(DateTime, nullable=True)  # start + 30 days
    is_active = Column(Boolean, default=True)

    # Razorpay payment reference
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="subscription")
