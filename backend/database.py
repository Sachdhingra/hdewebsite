"""
Database connection module
Shared MongoDB client for all route modules
"""
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'test_database')

if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
else:
    db = None
