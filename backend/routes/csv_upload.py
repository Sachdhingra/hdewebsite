from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from database import db
import pandas as pd
import io
import re
from datetime import datetime
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# 3-Level Category Hierarchy
# Level 1: Main Category (Living Room, Bedroom, etc.)
# Level 2: Subcategory Group (Sofas & Loungers, Tables, etc.)
# Level 3: Sub-subcategory (Sofas, L-shaped Sofa, Sofa cum Bed, etc.)

CATEGORY_STRUCTURE = {
    'living-room': {
        'name': 'Living Room',
        'groups': {
            'sofas-loungers': {
                'name': 'Sofas & Loungers',
                'subcategories': ['sofas', 'sofa-cum-bed', 'l-shaped-sofa', 'sofa-sets', 'recliner-sofas', 'recliners']
            },
            'tables': {
                'name': 'Tables',
                'subcategories': ['coffee-tables', 'center-tables', 'side-tables', 'console-tables']
            },
            'bean-bags-pouffes': {
                'name': 'Bean Bags & Pouffes',
                'subcategories': ['bean-bags', 'pouffes', 'ottomans']
            },
            'cabinets': {
                'name': 'Cabinets',
                'subcategories': ['tv-units', 'display-units', 'shoe-racks', 'wall-shelves']
            },
            'chairs': {
                'name': 'Chairs',
                'subcategories': ['accent-chairs', 'lounge-chairs', 'rocking-chairs']
            }
        }
    },
    'bedroom': {
        'name': 'Bedroom',
        'groups': {
            'beds': {
                'name': 'Beds',
                'subcategories': ['king-beds', 'queen-beds', 'single-beds', 'double-beds', 'storage-beds']
            },
            'storage': {
                'name': 'Storage',
                'subcategories': ['wardrobes', 'chest-of-drawers', 'dressers', 'bedside-tables']
            },
            'mattresses': {
                'name': 'Mattresses',
                'subcategories': ['mattresses', 'mattress-protectors']
            }
        }
    },
    'dining-room': {
        'name': 'Dining Room',
        'groups': {
            'dining-sets': {
                'name': 'Dining Sets',
                'subcategories': ['dining-tables', 'dining-chairs', '4-seater-dining', '6-seater-dining']
            },
            'storage': {
                'name': 'Storage',
                'subcategories': ['crockery-units', 'bar-cabinets', 'sideboards']
            }
        }
    },
    'office-study': {
        'name': 'Office & Study',
        'groups': {
            'chairs': {
                'name': 'Chairs',
                'subcategories': ['office-chairs', 'work-chairs', 'executive-chairs', 'ergonomic-chairs', 'gaming-chairs']
            },
            'tables': {
                'name': 'Tables',
                'subcategories': ['study-tables', 'computer-tables', 'office-desks', 'standing-desks']
            },
            'storage': {
                'name': 'Storage',
                'subcategories': ['bookshelves', 'filing-cabinets', 'office-storage']
            }
        }
    },
    'modular-kitchen': {
        'name': 'Modular Kitchen',
        'groups': {
            'cabinets': {
                'name': 'Kitchen Cabinets',
                'subcategories': ['base-cabinets', 'wall-cabinets', 'tall-cabinets']
            },
            'storage': {
                'name': 'Kitchen Storage',
                'subcategories': ['kitchen-islands', 'pantry-units']
            }
        }
    }
}

def clean_price(price_str):
    if pd.isna(price_str) or not price_str:
        return 0.0
    cleaned = re.sub(r'[^\d.]', '', str(price_str).replace(',', ''))
    try:
        return float(cleaned) if cleaned else 0.0
    except:
        return 0.0

def get_category_hierarchy(filename):
    """
    Detect category hierarchy from filename.
    Returns: (category_slug, category_name, group_slug, parent_slug)
    """
    filename_lower = filename.lower()
    name = filename_lower.rsplit('.', 1)[0]
    slug = re.sub(r'[\s_]+', '-', name.strip())
    
    # Check each main category's structure
    for parent_slug, parent_data in CATEGORY_STRUCTURE.items():
        for group_slug, group_data in parent_data['groups'].items():
            # Check if filename matches any subcategory
            for subcat in group_data['subcategories']:
                if subcat in slug or subcat.replace('-', '') in slug.replace('-', ''):
                    display_name = ' '.join(word.capitalize() for word in subcat.split('-'))
                    return subcat, display_name, group_slug, parent_slug
            
            # Check if filename matches the group itself
            if group_slug in slug or group_slug.replace('-', '') in slug.replace('-', ''):
                return group_slug, group_data['name'], None, parent_slug
    
    # Keyword-based fallback
    keyword_map = {
        'sofa': ('sofas', 'Sofas', 'sofas-loungers', 'living-room'),
        'l-shaped': ('l-shaped-sofa', 'L Shaped Sofa', 'sofas-loungers', 'living-room'),
        'recliner': ('recliners', 'Recliners', 'sofas-loungers', 'living-room'),
        'sofa-cum-bed': ('sofa-cum-bed', 'Sofa Cum Bed', 'sofas-loungers', 'living-room'),
        'sofacumbed': ('sofa-cum-bed', 'Sofa Cum Bed', 'sofas-loungers', 'living-room'),
        'chair': ('office-chairs', 'Office Chairs', 'chairs', 'office-study'),
        'bed': ('beds', 'Beds', 'beds', 'bedroom'),
        'wardrobe': ('wardrobes', 'Wardrobes', 'storage', 'bedroom'),
        'dining': ('dining-sets', 'Dining Sets', 'dining-sets', 'dining-room'),
        'table': ('tables', 'Tables', 'tables', 'living-room'),
        'mattress': ('mattresses', 'Mattresses', 'mattresses', 'bedroom'),
    }
    
    for keyword, (cat_slug, cat_name, group, parent) in keyword_map.items():
        if keyword in slug:
            return cat_slug, cat_name, group, parent
    
    # Default
    display_name = ' '.join(word.capitalize() for word in slug.split('-'))
    return slug, display_name, None, None

@router.post("/csv/upload/interio")
async def upload_products(
    file: UploadFile = File(...),
    category_override: Optional[str] = Form(None)
):
    """Upload products with 3-level category hierarchy"""
    try:
        logger.info(f"Uploading file: {file.filename}")
        
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        logger.info(f"Columns: {list(df.columns)}, Rows: {len(df)}")
        
        # Get category hierarchy
        if category_override and category_override.strip():
            category_slug = category_override.lower().replace(' ', '-')
            category_name = ' '.join(word.capitalize() for word in category_slug.split('-'))
            group_slug = None
            parent_slug = None
        else:
            category_slug, category_name, group_slug, parent_slug = get_category_hierarchy(file.filename)
        
        logger.info(f"Category: {category_name} ({category_slug}), Group: {group_slug}, Parent: {parent_slug}")
        
        # Rename columns
        column_mapping = {
            "product-name": "name", "productname": "name",
            "short-mini-des": "description", 
            "main-image src": "image", "hover-image src": "image2",
            "price 2": "originalPrice", "price2": "originalPrice", "originalprice": "originalPrice",
            "prod-label": "warranty", "price-discount-text": "discount"
        }
        
        for old_col in list(df.columns):
            old_lower = old_col.strip().lower()
            for map_key, map_val in column_mapping.items():
                if old_lower == map_key.lower():
                    df = df.rename(columns={old_col: map_val})
                    break
        
        df.columns = df.columns.str.strip()
        
        if 'name' not in df.columns:
            raise HTTPException(status_code=400, detail="CSV must have 'name' or 'product-name' column")
        
        # Clean prices
        if 'price' in df.columns:
            df['price'] = df['price'].apply(clean_price)
        else:
            df['price'] = 0.0
            
        if 'originalPrice' in df.columns:
            df['originalPrice'] = df['originalPrice'].apply(clean_price)
        else:
            df['originalPrice'] = df['price']
        
        df['originalPrice'] = df.apply(
            lambda row: max(row['price'], row['originalPrice']) if row['originalPrice'] > 0 else row['price'],
            axis=1
        )
        
        # Ensure parent category exists
        if parent_slug:
            parent_exists = await db.categories.find_one({"slug": parent_slug})
            if not parent_exists:
                parent_name = CATEGORY_STRUCTURE.get(parent_slug, {}).get('name', parent_slug.replace('-', ' ').title())
                await db.categories.insert_one({
                    "name": parent_name,
                    "slug": parent_slug,
                    "level": 1,
                    "parentCategory": None,
                    "groupSlug": None,
                    "description": f"Browse our {parent_name} collection",
                    "image": "",
                    "order": list(CATEGORY_STRUCTURE.keys()).index(parent_slug) if parent_slug in CATEGORY_STRUCTURE else 99,
                    "createdAt": datetime.utcnow()
                })
        
        # Ensure group category exists
        if group_slug and parent_slug:
            group_exists = await db.categories.find_one({"slug": group_slug, "parentCategory": parent_slug})
            if not group_exists:
                group_name = CATEGORY_STRUCTURE.get(parent_slug, {}).get('groups', {}).get(group_slug, {}).get('name', group_slug.replace('-', ' ').title())
                await db.categories.insert_one({
                    "name": group_name,
                    "slug": group_slug,
                    "level": 2,
                    "parentCategory": parent_slug,
                    "groupSlug": None,
                    "description": f"Browse our {group_name}",
                    "image": "",
                    "order": 10,
                    "createdAt": datetime.utcnow()
                })
        
        # Get first image for category thumbnail
        first_image = ""
        if 'image' in df.columns:
            for img in df['image']:
                if pd.notna(img) and str(img).startswith('http'):
                    first_image = str(img).strip()
                    break
        
        # Ensure subcategory exists
        existing = await db.categories.find_one({"slug": category_slug})
        if not existing:
            await db.categories.insert_one({
                "name": category_name,
                "slug": category_slug,
                "level": 3 if group_slug else (2 if parent_slug else 1),
                "parentCategory": parent_slug,
                "groupSlug": group_slug,
                "description": f"Browse our {category_name} collection",
                "image": first_image,
                "order": 10,
                "createdAt": datetime.utcnow()
            })
        else:
            # Update with image if missing
            if not existing.get('image') and first_image:
                await db.categories.update_one(
                    {"slug": category_slug},
                    {"$set": {"image": first_image, "parentCategory": parent_slug, "groupSlug": group_slug}}
                )
        
        # Process products
        inserted = 0
        updated = 0
        errors = []
        seen = set()
        
        for index, row in df.iterrows():
            try:
                name = str(row.get('name', '')).strip()
                if not name or name == 'nan' or name in seen:
                    continue
                seen.add(name)
                
                price = float(row.get('price', 0))
                original_price = float(row.get('originalPrice', price))
                
                if price <= 0 and original_price <= 0:
                    continue
                if price <= 0:
                    price = original_price
                
                images = []
                if 'image' in row and pd.notna(row['image']) and str(row['image']).startswith('http'):
                    images.append(str(row['image']).strip())
                if 'image2' in row and pd.notna(row['image2']) and str(row['image2']).startswith('http'):
                    images.append(str(row['image2']).strip())
                
                description = str(row.get('description', name)) if pd.notna(row.get('description')) else name
                
                features = []
                if description and description != name:
                    features = [f.strip() for f in description.split(',') if f.strip()]
                
                warranty = str(row.get('warranty', '')) if pd.notna(row.get('warranty')) else ''
                if warranty:
                    features.insert(0, warranty)
                
                discount = str(row.get('discount', '')) if pd.notna(row.get('discount')) else ''
                if discount:
                    features.append(discount)
                
                product_data = {
                    'name': name,
                    'category': category_slug,
                    'groupSlug': group_slug,
                    'parentCategory': parent_slug,
                    'price': price,
                    'originalPrice': original_price,
                    'image': images[0] if images else "",
                    'images': images,
                    'description': description,
                    'features': features,
                    'inStock': True,
                    'sku': f"{category_slug[:3].upper()}-{index+1:04d}",
                    'warranty': warranty,
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                
                existing_product = await db.products.find_one({'name': name, 'category': category_slug})
                
                if existing_product:
                    await db.products.update_one(
                        {'_id': existing_product['_id']},
                        {'$set': {**product_data, 'createdAt': existing_product['createdAt']}}
                    )
                    updated += 1
                else:
                    await db.products.insert_one(product_data)
                    inserted += 1
                    
            except Exception as e:
                errors.append(f"Row {index+2}: {str(e)}")
        
        total = inserted + updated
        
        if total == 0:
            raise HTTPException(status_code=400, detail="No products processed")
        
        return {
            "success": True,
            "message": f"Upload complete for '{category_name}'",
            "category": {
                "name": category_name,
                "slug": category_slug,
                "group": group_slug,
                "parent": parent_slug
            },
            "inserted": inserted,
            "updated": updated,
            "total_processed": total,
            "errors": errors[:10] if errors else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/csv/products/upload")
async def upload_products_legacy(file: UploadFile = File(...)):
    return await upload_products(file)

@router.delete("/csv/products/category/{category_slug}")
async def clear_category_products(category_slug: str):
    result = await db.products.delete_many({"category": category_slug})
    return {"success": True, "message": f"Deleted {result.deleted_count} products"}

@router.get("/csv/categories/list")
async def list_product_categories():
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}]
    counts = await db.products.aggregate(pipeline).to_list(100)
    count_map = {item["_id"]: item["count"] for item in counts}
    
    categories = await db.categories.find().to_list(100)
    
    result = []
    for cat in categories:
        result.append({
            "slug": cat.get("slug"),
            "name": cat.get("name"),
            "parentCategory": cat.get("parentCategory"),
            "groupSlug": cat.get("groupSlug"),
            "level": cat.get("level", 1),
            "image": cat.get("image", ""),
            "productCount": count_map.get(cat.get("slug"), 0)
        })
    
    return {"success": True, "categories": result}

@router.delete("/csv/products/clear")
async def clear_all_products():
    result = await db.products.delete_many({})
    return {"success": True, "message": f"Deleted {result.deleted_count} products"}

@router.delete("/csv/categories/clear")
async def clear_all_categories():
    result = await db.categories.delete_many({})
    return {"success": True, "message": f"Deleted {result.deleted_count} categories"}

@router.post("/csv/categories/upload")
async def upload_categories_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        inserted = 0
        for _, row in df.iterrows():
            slug = str(row.get('slug', '')).strip()
            if slug and not await db.categories.find_one({'slug': slug}):
                await db.categories.insert_one({
                    'name': str(row.get('name', slug)),
                    'slug': slug,
                    'parentCategory': str(row.get('parentCategory', '')) or None,
                    'groupSlug': str(row.get('groupSlug', '')) or None,
                    'level': int(row.get('level', 1)),
                    'image': str(row.get('image', '')),
                    'description': str(row.get('description', '')),
                    'order': int(row.get('order', 10)),
                    'createdAt': datetime.utcnow()
                })
                inserted += 1
        
        return {"success": True, "message": f"Uploaded {inserted} categories"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
