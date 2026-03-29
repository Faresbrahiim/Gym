import uuid
from sqlalchemy import Column, String, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.db.database import Base
import enum

class RecommendationType(str, enum.Enum):
    nutrition = "nutrition"
    sport = "sport"

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    type = Column(Enum(RecommendationType), nullable=False)
    question = Column(Text, nullable=False)
    prompt_used = Column(Text, nullable=True)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)