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
        
        # Get product counts
        pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        counts = await db.products.aggregate(pipeline).to_list(100)
        count_map = {item["_id"]: item["count"] for item in counts}
        
        for cat in categories:
            cat['_id'] = str(cat['_id'])
            cat['id'] = cat['_id']
            cat['productCount'] = count_map.get(cat.get('slug', ''), 0)
        
        return {"categories": categories, "allCategories": categories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/hierarchy", response_model=dict)
async def get_categories_hierarchy():
    """Get 3-level category hierarchy for mega menu"""
    try:
        categories = await db.categories.find({}).sort('order', 1).to_list(100)
        
        # Get product counts
        pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        counts = await db.products.aggregate(pipeline).to_list(100)
        count_map = {item["_id"]: item["count"] for item in counts}
        
        # Organize categories by level
        parents = {}  # Level 1
        groups = {}   # Level 2
        subcats = {}  # Level 3
        
        for cat in categories:
            slug = cat.get('slug')
            level = cat.get('level', 1)
            
            cat_data = {
                'name': cat.get('name', slug),
                'slug': slug,
                'image': cat.get('image', ''),
                'productCount': count_map.get(slug, 0),
                'parentCategory': cat.get('parentCategory'),
                'groupSlug': cat.get('groupSlug')
            }
            
            if level == 1:
                parents[slug] = {**cat_data, 'groups': [], 'subcategories': []}
            elif level == 2:
                groups[slug] = {**cat_data, 'subcategories': []}
            elif level == 3:
                subcats[slug] = cat_data
        
        # Attach subcategories to groups
        for slug, subcat in subcats.items():
            group_slug = subcat.get('groupSlug')
            if group_slug and group_slug in groups:
                groups[group_slug]['subcategories'].append({
                    'name': subcat['name'],
                    'slug': subcat['slug'],
                    'image': subcat['image'],
                    'productCount': subcat['productCount']
                })
        
        # Attach groups to parents
        for slug, group in groups.items():
            parent_slug = group.get('parentCategory')
            if parent_slug and parent_slug in parents:
                parents[parent_slug]['groups'].append({
                    'name': group['name'],
                    'slug': group['slug'],
                    'subcategories': group['subcategories']
                })
        
        # Convert to list and sort
        result = list(parents.values())
        result.sort(key=lambda x: {'living-room': 1, 'bedroom': 2, 'dining-room': 3, 'office-study': 4}.get(x['slug'], 99))
        
        return {"success": True, "hierarchy": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/{slug}", response_model=dict)
async def get_category_by_slug(slug: str):
    """Get a category by slug with subcategories"""
    try:
        category = await db.categories.find_one({"slug": slug})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        category['_id'] = str(category['_id'])
        category['id'] = category['_id']
        
        # Get subcategories (both by parentCategory and groupSlug)
        subcats = await db.categories.find({
            "$or": [
                {"parentCategory": slug},
                {"groupSlug": slug}
            ]
        }).to_list(50)
        
        # Get product counts
        pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
        counts = await db.products.aggregate(pipeline).to_list(100)
        count_map = {item["_id"]: item["count"] for item in counts}
        
        for sub in subcats:
            sub['_id'] = str(sub['_id'])
            sub['id'] = sub['_id']
            sub['productCount'] = count_map.get(sub.get('slug', ''), 0)
        
        category['subcategories'] = subcats
        category['productCount'] = count_map.get(slug, 0)
        
        return category
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categories", response_model=dict)
async def create_category(category: CategoryCreate):
    """Create a new category"""
    try:
        existing = await db.categories.find_one({"slug": category.slug})
        if existing:
            raise HTTPException(status_code=400, detail="Category exists")
        
        result = await db.categories.insert_one(category.dict())
        return {"success": True, "categoryId": str(result.inserted_id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
