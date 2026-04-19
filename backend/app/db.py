from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv, find_dotenv
import os

env_path = os.getcwd() + '\\app\\.env'
load_dotenv(dotenv_path=env_path)


POSTGRES_URL = os.getenv('POSTGRES_URL')
POSTGRES_USERNAME = os.getenv('POSTGRES_USERNAME')
POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')

print(f"{POSTGRES_URL=}\n{POSTGRES_USERNAME=}\n{POSTGRES_PASSWORD=}")
DB_URI = f"postgresql://{POSTGRES_USERNAME}:{POSTGRES_PASSWORD}@{POSTGRES_URL}"

engine = create_engine(DB_URI)
LocalSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()