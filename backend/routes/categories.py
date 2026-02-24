from fastapi import APIRouter, HTTPException
from typing import List
from models.category import Category, CategoryCreate
from database import db
from bson import ObjectId

router = APIRouter()

@router.get("/categories", response_model=dict)
async def get_categories():
    """Get all categories with hierarchy"""
    try:
        cursor = db.categories.find({}).sort('order', 1)
        categories = await cursor.to_list(length=100)
        
        # Get product counts per category
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        counts = await db.products.aggregate(pipeline).to_list(100)
        count_map = {item["_id"]: item["count"] for item in counts}
        
        # Build hierarchy
        parent_categories = []
        subcategory_map = {}
        
        for category in categories:
            category['_id'] = str(category['_id'])
            category['id'] = category['_id']
            category['productCount'] = count_map.get(category.get('slug', ''), 0)
            
            parent = category.get('parentCategory')
            if parent:
                if parent not in subcategory_map:
                    subcategory_map[parent] = []
                subcategory_map[parent].append(category)
            else:
                parent_categories.append(category)
        
        # Attach subcategories to parents
        for parent in parent_categories:
            parent['subcategories'] = subcategory_map.get(parent['slug'], [])
            # Calculate total products including subcategories
            parent['totalProducts'] = parent['productCount'] + sum(
                sub['productCount'] for sub in parent['subcategories']
            )
        
        return {
            "categories": parent_categories,
            "allCategories": categories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

@router.get("/categories/hierarchy", response_model=dict)
async def get_categories_hierarchy():
    """Get categories organized by parent-child hierarchy for navigation"""
    try:
        cursor = db.categories.find({}).sort('order', 1)
        categories = await cursor.to_list(length=100)
        
        # Get product counts
        pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        counts = await db.products.aggregate(pipeline).to_list(100)
        count_map = {item["_id"]: item["count"] for item in counts}
        
        # Build hierarchy
        hierarchy = {}
        standalone = []
        
        for cat in categories:
            cat['_id'] = str(cat['_id'])
            cat['productCount'] = count_map.get(cat.get('slug', ''), 0)
            
            parent = cat.get('parentCategory')
            if parent:
                if parent not in hierarchy:
                    hierarchy[parent] = {
                        'name': parent.replace('-', ' ').title(),
                        'slug': parent,
                        'subcategories': []
                    }
                hierarchy[parent]['subcategories'].append({
                    'name': cat['name'],
                    'slug': cat['slug'],
                    'productCount': cat['productCount']
                })
            elif cat.get('isParent') or not parent:
                if cat['slug'] not in hierarchy:
                    hierarchy[cat['slug']] = {
                        'name': cat['name'],
                        'slug': cat['slug'],
                        'subcategories': []
                    }
                else:
                    hierarchy[cat['slug']]['name'] = cat['name']
        
        return {
            "success": True,
            "hierarchy": list(hierarchy.values())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/categories/{slug}", response_model=dict)
async def get_category_by_slug(slug: str):
    """Get a category by slug with its subcategories"""
    try:
        category = await db.categories.find_one({"slug": slug})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        category['_id'] = str(category['_id'])
        category['id'] = category['_id']
        
        # Get subcategories if this is a parent
        subcategories = await db.categories.find({"parentCategory": slug}).to_list(50)
        for sub in subcategories:
            sub['_id'] = str(sub['_id'])
            sub['id'] = sub['_id']
        
        category['subcategories'] = subcategories
        
        return category
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching category: {str(e)}")

@router.post("/categories", response_model=dict)
async def create_category(category: CategoryCreate):
    """Create a new category (Admin only)"""
    try:
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
