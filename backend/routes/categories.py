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
        
        # Build 3-level hierarchy
        # Level 1: Main categories (Living Room, Bedroom, etc.)
        # Level 2: Groups (Sofas & Loungers, Tables, etc.)
        # Level 3: Subcategories (Sofas, L-shaped Sofa, etc.) with thumbnails
        
        hierarchy = {}
        groups = {}
        subcategories = []
        
        for cat in categories:
            cat['_id'] = str(cat['_id'])
            cat['productCount'] = count_map.get(cat.get('slug', ''), 0)
            
            level = cat.get('level', 1)
            parent = cat.get('parentCategory')
            group = cat.get('groupSlug')
            
            if level == 1 or (not parent and not group):
                # Main category
                hierarchy[cat['slug']] = {
                    'name': cat['name'],
                    'slug': cat['slug'],
                    'image': cat.get('image', ''),
                    'groups': {},
                    'subcategories': []
                }
            elif level == 2 or (parent and not group):
                # Group or direct subcategory
                groups[cat['slug']] = {
                    'name': cat['name'],
                    'slug': cat['slug'],
                    'parent': parent,
                    'subcategories': []
                }
            else:
                # Subcategory with thumbnail
                subcategories.append({
                    'name': cat['name'],
                    'slug': cat['slug'],
                    'parent': parent,
                    'group': group,
                    'image': cat.get('image', ''),
                    'productCount': cat['productCount']
                })
        
        # Also add categories that have products but might not have explicit level
        for cat in categories:
            slug = cat.get('slug')
            parent = cat.get('parentCategory')
            group = cat.get('groupSlug')
            
            if slug not in hierarchy and slug not in groups:
                if count_map.get(slug, 0) > 0:
                    subcategories.append({
                        'name': cat['name'],
                        'slug': slug,
                        'parent': parent,
                        'group': group,
                        'image': cat.get('image', ''),
                        'productCount': count_map.get(slug, 0)
                    })
        
        # Attach groups to parents
        for group_slug, group_data in groups.items():
            parent = group_data['parent']
            if parent and parent in hierarchy:
                hierarchy[parent]['groups'][group_slug] = group_data
        
        # Attach subcategories to groups or directly to parents
        for subcat in subcategories:
            parent = subcat.get('parent')
            group = subcat.get('group')
            
            if group and parent and parent in hierarchy and group in hierarchy[parent]['groups']:
                hierarchy[parent]['groups'][group]['subcategories'].append(subcat)
            elif parent and parent in hierarchy:
                # Check if this should go under a group
                found_group = False
                for g_slug, g_data in hierarchy[parent]['groups'].items():
                    if subcat['slug'] in str(g_data.get('subcategories', [])):
                        g_data['subcategories'].append(subcat)
                        found_group = True
                        break
                
                if not found_group:
                    hierarchy[parent]['subcategories'].append(subcat)
        
        # Convert to list format
        result = []
        for slug, data in hierarchy.items():
            groups_list = []
            for g_slug, g_data in data['groups'].items():
                groups_list.append({
                    'name': g_data['name'],
                    'slug': g_slug,
                    'subcategories': g_data['subcategories']
                })
            
            result.append({
                'name': data['name'],
                'slug': slug,
                'image': data['image'],
                'groups': groups_list,
                'subcategories': data['subcategories']
            })
        
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
