from contextlib import asynccontextmanager
from fastapi import APIRouter, Form, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.bot import stream_mirror
from sqlalchemy.orm import Session
from sqlalchemy import select, update
import random
import asyncio
import json

from app.db import LocalSession
from app.models import Message, Conversation
from app.Bots.PersonalityCore import PersonalityCore


# == initialization ==
router = APIRouter()
personalityCore = PersonalityCore()

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


# Get conversation details
@router.get("/conversation/{conversation_id}")
def get_conversation(conversation_id:int, db: Session=Depends(get_db)):
	conv_query = select(Conversation.id, Conversation.personality, Message.role, Message.content, Message.timestamp).select_from(Message).join(Conversation, Message.conversation_id == Conversation.id).where(Conversation.id==conversation_id).order_by(Message.timestamp.asc())
	# Alt query that makes use of .query instead of .select, but makes access to internal contents trickier (e.g. )
	# conv_query = db.query(Message, Conversation).filter(Message.conversation_id == conversation_id).join(Conversation, Message.conversation_id == Conversation.id).order_by(Message.timestamp.asc())
	
	conv_result = db.execute(conv_query)
	conversation = conv_result.mappings().all()

	if len(conversation) == 0:
		raise HTTPException(status_code=404, detail=f"Conversation {conversation_id} not found") 

	messages = [
		{
			"role":m.role,
			"content":m.content
		}
		for m in conversation
	]

	response = {
		"id":conversation[0].id,
		"personality":conversation[0].personality,
		"messages":messages
	}
	return response


@router.get("/history")
def get_history(db: Session = Depends(get_db)):
	conversations=db.query(Conversation).order_by(Conversation.id.desc()).all()

	return [
		{
			"id":c.id,
			"created":c.created,
			"personality": c.personality,
			"active":c.active
		}
		for c in conversations
	]


@router.post("/chat")
async def chat(req:ChatRequest, db: Session = Depends(get_db)):\
	# By default, set state to 'default', if conversation exists, we fetch state
	state = "default"

	# If a blank message is sent in request, return a 400 (bad request) 
	if not req.message:
		raise HTTPException(status_code=400, detail=f"Blank message not allowed")

	# New conversation, push conversation to db
	if not req.conversation_id:
		conversation = Conversation(personality=req.personality or "default")
		db.add(conversation)
		db.commit()
		db.refresh(conversation)
		req.conversation_id = conversation.id
	# Not a new conversation, fetch conversation state
	else:
		query = select(Conversation.state).select_from(Conversation).where(Conversation.id==req.conversation_id)
		state_select = db.execute(query).one_or_none()
		if state_select:
			state = state_select[0]
		print(f"state after select: {state}")


	# Push user message to db
	user_msg = Message(role="user", content=req.message, conversation_id=req.conversation_id)
	db.add(user_msg)
	db.commit()

	async def stream_response():
		# Generate bot response based on: message, personality, and state
		new_state, response = personalityCore.respond(req.personality, state, req.message)
		print(response)

		for char in response:
			yield char
			# Simulate typing response
			await asyncio.sleep(0.03)

		# Push bot message to db
		bot_msg = Message(role="bot",content=response,conversation_id=req.conversation_id)
		db.add(bot_msg)
		db.commit()

		# Update conversation state to new state
		update_conversation_state(req.conversation_id, new_state, db)

	return StreamingResponse(stream_response(), media_type="text/plain",headers={"X-Conversation-Id": str(req.conversation_id)})


# update conversation state in db
def update_conversation_state(conversation_id, new_state, db: Session = Depends(get_db)):
	statement = (
			update(Conversation)
			.where(Conversation.id == conversation_id)
			.values(state = new_state)
	)

	db.execute(statement)
	db.commit()

@router.get("/bots")
def get_bots(db: Session = Depends(get_db)):
	bot_cfg = {}
	for bot in personalityCore.personality_cfg:
		bot_cfg[bot] = {"name":personalityCore.personality_cfg[bot]["name"]}

	print(bot_cfg)
	return bot_cfg