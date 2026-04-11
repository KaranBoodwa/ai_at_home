from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class Message(Base):
	__tablename__ = "messages"

	id = Column(Integer, primary_key=True, index=True)
	role = Column(String)
	content = Column(Text)
	timestamp = Column(DateTime, default=datetime.utcnow)

	conversation_id = Column(Integer, ForeignKey("conversations.id"))
	conversation = relationship("Conversation", back_populates="messages")

class Conversation(Base):
	__tablename__ = "conversations"

	id = Column(Integer, primary_key=True, index=True)
	created = Column(DateTime, default=datetime.utcnow)
	personality = Column(String, default="default")
	messages=relationship("Message", back_populates="conversation")