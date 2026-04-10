from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Switch to .envs later
DATABSE_URI = "postgresql://user:password@localhost/chatbot"

engine = create_engine(DATABSE_URI)
LocalSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()