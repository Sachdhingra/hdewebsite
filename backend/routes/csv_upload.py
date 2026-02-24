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

# Define parent-child category mapping
CATEGORY_HIERARCHY = {
    # Living Room subcategories
    'sofas': 'living-room',
    'sofa': 'living-room',
    'recliners': 'living-room',
    'recliner': 'living-room',
    'coffee-tables': 'living-room',
    'tv-units': 'living-room',
    'bean-bags': 'living-room',
    'ottomans': 'living-room',
    'center-tables': 'living-room',
    
    # Bedroom subcategories
    'beds': 'bedroom',
    'bed': 'bedroom',
    'wardrobes': 'bedroom',
    'wardrobe': 'bedroom',
    'dressers': 'bedroom',
    'bedside-tables': 'bedroom',
    'mattresses': 'bedroom',
    'mattress': 'bedroom',
    
    # Dining Room subcategories
    'dining-tables': 'dining-room',
    'dining-chairs': 'dining-room',
    'dining-sets': 'dining-room',
    'crockery-units': 'dining-room',
    'bar-cabinets': 'dining-room',
    
    # Office & Study subcategories
    'office-chairs': 'office-study',
    'work-chairs': 'office-study',
    'study-tables': 'office-study',
    'bookshelves': 'office-study',
    'computer-tables': 'office-study',
    'filing-cabinets': 'office-study',
    
    # Modular Kitchen subcategories
    'kitchen-cabinets': 'modular-kitchen',
    'kitchen-storage': 'modular-kitchen',
    'kitchen-islands': 'modular-kitchen',
    
    # Storage subcategories
    'shoe-racks': 'storage',
    'storage-cabinets': 'storage',
    'wall-shelves': 'storage',
    'display-units': 'storage',
}

PARENT_CATEGORIES = {
    'living-room': 'Living Room',
    'bedroom': 'Bedroom',
    'dining-room': 'Dining Room',
    'office-study': 'Office & Study',
    'modular-kitchen': 'Modular Kitchen',
    'storage': 'Storage'
}

def clean_price(price_str):
    """Remove ₹, ?, commas and convert to float"""
    if pd.isna(price_str) or not price_str:
        return 0.0
    cleaned = re.sub(r'[^\d.]', '', str(price_str).replace(',', ''))
    try:
        return float(cleaned) if cleaned else 0.0
    except:
        return 0.0

def get_category_from_filename(filename):
    """Auto-detect category and parent from filename"""
    filename_lower = filename.lower()
    name = filename_lower.rsplit('.', 1)[0]
    
    # Clean up the name
    slug = re.sub(r'[\s_]+', '-', name.strip())
    
    # Check for known subcategories
    for subcat, parent in CATEGORY_HIERARCHY.items():
        if subcat in slug or subcat.replace('-', '') in slug.replace('-', ''):
            display_name = ' '.join(word.capitalize() for word in subcat.split('-'))
            return slug, display_name, parent
    
    # Check if it's a parent category itself
    for parent_slug, parent_name in PARENT_CATEGORIES.items():
        if parent_slug.replace('-', '') in slug.replace('-', ''):
            return parent_slug, parent_name, None
    
    # Keyword-based detection
    keyword_mapping = {
        'chair': ('office-chairs', 'Office Chairs', 'office-study'),
        'sofa': ('sofas', 'Sofas', 'living-room'),
        'recliner': ('recliners', 'Recliners', 'living-room'),
        'bed': ('beds', 'Beds', 'bedroom'),
        'wardrobe': ('wardrobes', 'Wardrobes', 'bedroom'),
        'dining': ('dining-sets', 'Dining Sets', 'dining-room'),
        'table': ('tables', 'Tables', 'living-room'),
        'storage': ('storage-cabinets', 'Storage Cabinets', 'storage'),
        'kitchen': ('kitchen-cabinets', 'Kitchen Cabinets', 'modular-kitchen'),
        'mattress': ('mattresses', 'Mattresses', 'bedroom'),
    }
    
    for keyword, (cat_slug, cat_name, parent) in keyword_mapping.items():
        if keyword in slug:
            return cat_slug, cat_name, parent
    
    # Default: use filename as category under misc
    display_name = ' '.join(word.capitalize() for word in slug.split('-'))
    return slug, display_name, None

@router.post("/csv/upload/interio")
async def upload_products(
    file: UploadFile = File(...),
    category_override: Optional[str] = Form(None)
):
    """Upload products from scraped CSV with auto parent-child category mapping"""
    try:
        logger.info(f"Uploading file: {file.filename}")
        
        # Read CSV
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        logger.info(f"Original columns: {list(df.columns)}")
        logger.info(f"Total rows: {len(df)}")
        
        # Get category info from filename or override
        if category_override and category_override.strip():
            category_slug = category_override.lower().replace(' ', '-')
            category_name = ' '.join(word.capitalize() for word in category_slug.split('-'))
            parent_category = CATEGORY_HIERARCHY.get(category_slug)
        else:
            category_slug, category_name, parent_category = get_category_from_filename(file.filename)
        
        logger.info(f"Category: {category_name} ({category_slug}), Parent: {parent_category}")
        
        # Rename columns from scraped format
        column_mapping = {
            "product-name": "name",
            "productname": "name",
            "short-mini-des": "description", 
            "main-image src": "image",
            "hover-image src": "image2",
            "price 2": "originalPrice",
            "price2": "originalPrice",
            "originalprice": "originalPrice",
            "prod-label": "warranty",
            "price-discount-text": "discount"
        }
        
        for old_col in list(df.columns):
            old_col_lower = old_col.strip().lower()
            for map_key, map_val in column_mapping.items():
                if old_col_lower == map_key.lower():
                    df = df.rename(columns={old_col: map_val})
                    break
        
        df.columns = df.columns.str.strip()
        logger.info(f"Renamed columns: {list(df.columns)}")
        
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
        
        df['category'] = category_slug
        df['inStock'] = True
        
        # Ensure parent category exists first
        if parent_category:
            parent_exists = await db.categories.find_one({"slug": parent_category})
            if not parent_exists:
                await db.categories.insert_one({
                    "name": PARENT_CATEGORIES.get(parent_category, parent_category.replace('-', ' ').title()),
                    "slug": parent_category,
                    "parentCategory": None,
                    "isParent": True,
                    "description": f"Browse our {PARENT_CATEGORIES.get(parent_category, '')} collection",
                    "image": "",
                    "order": list(PARENT_CATEGORIES.keys()).index(parent_category) if parent_category in PARENT_CATEGORIES else 99,
                    "createdAt": datetime.utcnow()
                })
                logger.info(f"Created parent category: {parent_category}")
        
        # Ensure subcategory exists
        existing_category = await db.categories.find_one({"slug": category_slug})
        if not existing_category:
            first_image = ""
            if 'image' in df.columns:
                for img in df['image']:
                    if pd.notna(img) and str(img).startswith('http'):
                        first_image = str(img).strip()
                        break
            
            await db.categories.insert_one({
                "name": category_name,
                "slug": category_slug,
                "parentCategory": parent_category,
                "isParent": False if parent_category else True,
                "description": f"Browse our {category_name} collection",
                "image": first_image,
                "order": 10,
                "createdAt": datetime.utcnow()
            })
            logger.info(f"Created category: {category_name} under {parent_category}")
        else:
            # Update parent if not set
            if parent_category and not existing_category.get('parentCategory'):
                await db.categories.update_one(
                    {"slug": category_slug},
                    {"$set": {"parentCategory": parent_category, "isParent": False}}
                )
        
        # Process rows
        inserted_count = 0
        updated_count = 0
        errors = []
        seen_names = set()
        
        for index, row in df.iterrows():
            try:
                name = str(row.get('name', '')).strip()
                
                if not name or name == 'nan' or name in seen_names:
                    continue
                seen_names.add(name)
                
                price = float(row.get('price', 0))
                original_price = float(row.get('originalPrice', price))
                
                if price <= 0 and original_price <= 0:
                    errors.append(f"Row {index+2}: Invalid price")
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
                    'parentCategory': parent_category,
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
                
                existing = await db.products.find_one({
                    'name': name,
                    'category': category_slug
                })
                
                if existing:
                    await db.products.update_one(
                        {'_id': existing['_id']},
                        {'$set': {**product_data, 'createdAt': existing['createdAt']}}
                    )
                    updated_count += 1
                else:
                    await db.products.insert_one(product_data)
                    inserted_count += 1
                    
            except Exception as e:
                errors.append(f"Row {index+2}: {str(e)}")
        
        total = inserted_count + updated_count
        logger.info(f"Upload complete: {inserted_count} inserted, {updated_count} updated")
        
        if total == 0:
            raise HTTPException(
                status_code=400,
                detail=f"No products processed. Columns: {list(df.columns)}"
            )
        
        return {
            "success": True,
            "message": f"Upload complete for '{category_name}'",
            "category": {
                "name": category_name, 
                "slug": category_slug,
                "parentCategory": parent_category
            },
            "inserted": inserted_count,
            "updated": updated_count,
            "total_processed": total,
            "errors": errors[:10] if errors else None,
            "total_errors": len(errors)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/csv/products/upload")
async def upload_products_legacy(file: UploadFile = File(...)):
    return await upload_products(file)

@router.delete("/csv/products/category/{category_slug}")
async def clear_category_products(category_slug: str):
    result = await db.products.delete_many({"category": category_slug})
    return {"success": True, "message": f"Deleted {result.deleted_count} products"}

@router.get("/csv/categories/list")
async def list_product_categories():
    """Get categories with hierarchy and counts"""
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    product_counts = await db.products.aggregate(pipeline).to_list(100)
    count_map = {item["_id"]: item["count"] for item in product_counts}
    
    # Get all categories from DB
    db_categories = await db.categories.find().to_list(100)
    
    categories = []
    for cat in db_categories:
        slug = cat.get("slug", "")
        categories.append({
            "slug": slug,
            "name": cat.get("name", slug.replace('-', ' ').title()),
            "parentCategory": cat.get("parentCategory"),
            "isParent": cat.get("isParent", False),
            "productCount": count_map.get(slug, 0)
        })
    
    return {"success": True, "categories": categories}

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
        
        if 'name' not in df.columns or 'slug' not in df.columns:
            raise HTTPException(status_code=400, detail="CSV needs 'name' and 'slug' columns")
        
        inserted = 0
        for _, row in df.iterrows():
            slug = str(row['slug']).strip()
            if not await db.categories.find_one({'slug': slug}):
                await db.categories.insert_one({
                    'name': str(row['name']),
                    'slug': slug,
                    'parentCategory': str(row.get('parentCategory', '')) or None,
                    'description': str(row.get('description', '')),
                    'image': str(row.get('image', '')),
                    'order': int(row.get('order', 0)),
                    'createdAt': datetime.utcnow()
                })
                inserted += 1
        
        return {"success": True, "message": f"Uploaded {inserted} categories"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
