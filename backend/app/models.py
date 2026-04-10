from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from .db import Base

class Message(Base):
	__tablename__ = "messages"

	id = Column(Integer, primary_key=True, index=True)
	role = Column(String)
	content = Column(Text)
	timestamp = Column(DateTime, default=datetime.utcnow)