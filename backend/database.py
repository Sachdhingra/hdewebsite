"""
Database connection module
Shared MongoDB client for all route modules
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'interio_db')

if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
else:
    db = None
