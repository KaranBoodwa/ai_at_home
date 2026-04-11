from fastapi import APIRouter, Form, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.bot import stream_mirror
from sqlalchemy.orm import Session
import asyncio

from app.db import LocalSession
from app.models import Message, Conversation

# Load from DB later
PERSONALITIES = {
	"default":{
		"prefix":""
	},
	"sarcastic":{
		"prefix":"Duh, of course "
	}
}

def apply_personality(text:str, personality: str):
	config = PERSONALITIES.get(personality, PERSONALITIES["default"])
	return config["prefix"] + text

router = APIRouter()

def get_db():
	db=LocalSession()
	try:
		yield db
	finally:
		db.close()


class ChatRequest(BaseModel):
	message: str
	conversation_id: Optional[int] = None,
	personality: Optional[str] = "default"

@router.post("/chat")
async def chat(req:ChatRequest, db: Session = Depends(get_db)):
	message = req.message
	conversation_id = req.conversation_id

	# New conversation, add to db
	if not conversation_id:
		conversation = Conversation(personality=req.personality or "default")
		db.add(conversation)
		db.commit()
		db.refresh(conversation)
		conversation_id = conversation.id

	print(f"{conversation_id=}")

	user_msg = Message(role="user", content=message, conversation_id=conversation_id)

	db.add(user_msg)
	db.commit()

	async def stream_response():
		response = apply_personality(message, req.personality)
		for char in response:
			yield char
			# Simulate typing response
			await asyncio.sleep(0.03)
		bot_msg = Message(role="bot",content=response,conversation_id=conversation_id)
		db.add(bot_msg)
		db.commit()

	print(str(conversation_id))
	return StreamingResponse(stream_response(), media_type="text/plain",headers={"X-Conversation-Id": str(conversation_id)})
	# return req.message



@router.get("/messages/{conversation_id}")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
	messages = (
		db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.timestamp.asc()).all()
	)
	print(f"{messages=}")
	return[
		{
			"role": m.role,
			"content": m.content
		} 
		for m in messages
	]



@router.get("/conversations")
def get_conversations(db: Session = Depends(get_db)):
	conversations=db.query(Conversation).order_by(Conversation.id.desc()).all()

	return [
		{
			"id":c.id,
			"created":c.created,
			"personality": c.personality
		}
		for c in conversations
	]

@router.patch("/conversations/{conversation_id}/personality")
def update_personality(conversation_id: int, personality:str, db: Session = Depends(get_db) ):
	conversation_fetch = db.query(Conversation).filter(Conversation.id == conversation_id).first()

	if not conversation_fetch:
		raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found")

	conversation_fetch.personality = personality
	db.commit()
	return {"id": conversation_fetch.id, "personality":conversation_fetch.personality}