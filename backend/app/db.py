from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Switch to .envs later, temporary db user and password
DATABSE_URI = "postgresql://postgres:defaultpwd@localhost/postgres"

engine = create_engine(DATABSE_URI)
LocalSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()