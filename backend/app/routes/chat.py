from fastapi import APIRouter, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.bot import stream_mirror
from sqlalchemy.orm import Session
import asyncio

from app.db import LocalSession
from app.models import Message

router = APIRouter()

def get_db():
	db=LocalSession()
	try:
		yield db
	finally:
		db.close()


class ChatRequest(BaseModel):
	message: str

@router.post("/chat")
async def chat(req:ChatRequest, db: Session = Depends(get_db)):

	async def stream_response():
		response = f"This is what you see after post processing of <{req.message}>"
		for char in response:
			yield char
			# Simulate typing response
			await asyncio.sleep(0.03)

	return StreamingResponse(stream_response(), media_type="text/plain")
	# return req.message
