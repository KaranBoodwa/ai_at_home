from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat
from app.db import engine, Base
from app import models

# Instantiate DB
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(chat.router)

app.add_middleware(
	CORSMiddleware,
	# allow_origins=["*"],
	allow_origins=["http://localhost:5173"],
	allow_methods=["*"],
	allow_headers=["*"],
	expose_headers=["X-Conversation-Id"]
)

# Debug
@app.get("/")
def root():
	return {"message": "API is running"}