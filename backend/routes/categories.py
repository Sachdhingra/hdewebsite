from fastapi import APIRouter, HTTPException
from typing import List
from models.category import Category, CategoryCreate
from motor.motor_asyncio import AsyncIOMotorClient
import os
from bson import ObjectId

router = APIRouter()

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

@router.get("/categories", response_model=dict)
async def get_categories():
    """Get all categories"""
    try:
        cursor = db.categories.find({}).sort('order', 1)
        categories = await cursor.to_list(length=100)
        
        # Convert ObjectId to string
        for category in categories:
            category['_id'] = str(category['_id'])
            category['id'] = category['_id']
        
        return {
            "categories": categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@router.get("/categories/{slug}", response_model=dict)
async def get_category_by_slug(slug: str):
    """Get a category by slug"""
    try:
        category = await db.categories.find_one({"slug": slug})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        category['_id'] = str(category['_id'])
        category['id'] = category['_id']
        return category
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching category: {str(e)}")

@router.post("/categories", response_model=dict)
async def create_category(category: CategoryCreate):
    """Create a new category (Admin only)"""
    try:
        # Check if slug already exists
        existing = await db.categories.find_one({"slug": category.slug})
        if existing:
            raise HTTPException(status_code=400, detail="Category with this slug already exists")
        
        category_dict = category.dict()
        result = await db.categories.insert_one(category_dict)
        
        return {
            "success": True,
            "categoryId": str(result.inserted_id),
            "message": "Category created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating category: {str(e)}")
