import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db import Base

class Debate(Base):
    __tablename__ = "debates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    topic = Column(String(500), nullable=False, index=True)
    interpretation = Column(Text, nullable=True)
    settings = Column(JSON, nullable=False, default=dict)
    status = Column(String(50), nullable=False, default="pending")  # pending, processing, completed, failed
    stage_message = Column(String(255), nullable=True, default="")
    error_message = Column(Text, nullable=True)
    result = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sources = relationship("Source", back_populates="debate", cascade="all, delete-orphan")

class Source(Base):
    __tablename__ = "sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    debate_id = Column(String(36), ForeignKey("debates.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=True)
    publisher = Column(String(255), nullable=True)
    url = Column(Text, nullable=False)
    published_date = Column(String(100), nullable=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=False)
    status_label = Column(String(50), default="unverified")  # verified, unverified, opinion, unavailable
    snippet = Column(Text, nullable=True)

    debate = relationship("Debate", back_populates="sources")

