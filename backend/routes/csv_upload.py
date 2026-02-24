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
    """Auto-detect category from filename"""
    filename = filename.lower()
    
    if "chair" in filename or "seating" in filename:
        return "office-chairs", "Office Chairs"
    elif "sofa" in filename or "couch" in filename:
        return "sofas", "Sofas"
    elif "bed" in filename or "bedroom" in filename:
        return "bedroom", "Bedroom"
    elif "dining" in filename:
        return "dining-room", "Dining Room"
    elif "recliner" in filename:
        return "recliners", "Recliners"
    elif "table" in filename:
        return "tables", "Tables"
    elif "storage" in filename or "wardrobe" in filename:
        return "storage", "Storage"
    elif "living" in filename:
        return "living-room", "Living Room"
    elif "office" in filename or "study" in filename:
        return "office-study", "Office & Study"
    elif "kitchen" in filename or "modular" in filename:
        return "modular-kitchens", "Modular Kitchens"
    else:
        # Use filename itself as category
        name = filename.rsplit('.', 1)[0]
        slug = re.sub(r'[\s_]+', '-', name.lower().strip())
        display_name = ' '.join(word.capitalize() for word in slug.split('-'))
        return slug, display_name

@router.post("/csv/upload/interio")
async def upload_products(
    file: UploadFile = File(...),
    category_override: Optional[str] = Form(None)
):
    """
    Upload products from scraped CSV.
    Category is auto-detected from filename.
    """
    try:
        logger.info(f"Uploading file: {file.filename}")
        
        # Read CSV
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        logger.info(f"Original columns: {list(df.columns)}")
        logger.info(f"Total rows: {len(df)}")
        
        # Get category from filename or override
        if category_override and category_override.strip():
            category_slug = category_override.lower().replace(' ', '-')
            category_name = ' '.join(word.capitalize() for word in category_slug.split('-'))
        else:
            category_slug, category_name = get_category_from_filename(file.filename)
        
        logger.info(f"Category: {category_name} ({category_slug})")
        
        # Rename columns from scraped format to our format
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
        
        # Apply renaming (case-insensitive)
        for old_col in list(df.columns):
            old_col_lower = old_col.strip().lower()
            for map_key, map_val in column_mapping.items():
                if old_col_lower == map_key.lower():
                    df = df.rename(columns={old_col: map_val})
                    break
        
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        logger.info(f"Renamed columns: {list(df.columns)}")
        
        # Ensure we have a name column
        if 'name' not in df.columns:
            raise HTTPException(status_code=400, detail="CSV must have 'name' or 'product-name' column")
        
        # Clean price columns
        if 'price' in df.columns:
            df['price'] = df['price'].apply(clean_price)
        else:
            df['price'] = 0.0
            
        if 'originalPrice' in df.columns:
            df['originalPrice'] = df['originalPrice'].apply(clean_price)
        else:
            df['originalPrice'] = df['price']
        
        # Ensure originalPrice >= price
        df['originalPrice'] = df.apply(
            lambda row: max(row['price'], row['originalPrice']) if row['originalPrice'] > 0 else row['price'],
            axis=1
        )
        
        # Add category
        df['category'] = category_slug
        
        # Set defaults
        df['inStock'] = True
        
        # Ensure category exists
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
                "description": f"Browse our {category_name} collection",
                "image": first_image,
                "order": 10,
                "createdAt": datetime.utcnow()
            })
            logger.info(f"Created category: {category_name}")
        
        # Process rows
        inserted_count = 0
        updated_count = 0
        errors = []
        seen_names = set()
        
        for index, row in df.iterrows():
            try:
                name = str(row.get('name', '')).strip()
                
                # Skip empty names or duplicates
                if not name or name == 'nan' or name in seen_names:
                    continue
                seen_names.add(name)
                
                price = float(row.get('price', 0))
                original_price = float(row.get('originalPrice', price))
                
                # Skip if no valid price
                if price <= 0 and original_price <= 0:
                    errors.append(f"Row {index+2}: Invalid price")
                    continue
                
                if price <= 0:
                    price = original_price
                
                # Collect images
                images = []
                if 'image' in row and pd.notna(row['image']) and str(row['image']).startswith('http'):
                    images.append(str(row['image']).strip())
                if 'image2' in row and pd.notna(row['image2']) and str(row['image2']).startswith('http'):
                    images.append(str(row['image2']).strip())
                
                # Description
                description = str(row.get('description', name)) if pd.notna(row.get('description')) else name
                
                # Features from description
                features = []
                if description and description != name:
                    features = [f.strip() for f in description.split(',') if f.strip()]
                
                # Add warranty to features
                warranty = str(row.get('warranty', '')) if pd.notna(row.get('warranty')) else ''
                if warranty:
                    features.insert(0, warranty)
                
                # Add discount to features  
                discount = str(row.get('discount', '')) if pd.notna(row.get('discount')) else ''
                if discount:
                    features.append(discount)
                
                product_data = {
                    'name': name,
                    'category': category_slug,
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
                
                # Check if exists
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
                detail=f"No products could be processed. Check CSV format. Columns found: {list(df.columns)}"
            )
        
        return {
            "success": True,
            "message": f"Upload complete for '{category_name}'",
            "category": {"name": category_name, "slug": category_slug},
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
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@router.post("/csv/products/upload")
async def upload_products_legacy(file: UploadFile = File(...)):
    """Legacy endpoint - redirects to main upload"""
    return await upload_products(file)

@router.delete("/csv/products/category/{category_slug}")
async def clear_category_products(category_slug: str):
    """Clear all products from a category"""
    result = await db.products.delete_many({"category": category_slug})
    return {
        "success": True,
        "message": f"Deleted {result.deleted_count} products from '{category_slug}'"
    }

@router.get("/csv/categories/list")
async def list_product_categories():
    """Get categories with product counts"""
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    results = await db.products.aggregate(pipeline).to_list(100)
    
    categories = []
    for item in results:
        slug = item["_id"] or "uncategorized"
        name = ' '.join(word.capitalize() for word in slug.split('-'))
        categories.append({
            "slug": slug,
            "name": name,
            "productCount": item["count"]
        })
    
    return {"success": True, "categories": categories}

@router.delete("/csv/products/clear")
async def clear_all_products():
    """Clear all products"""
    result = await db.products.delete_many({})
    return {"success": True, "message": f"Deleted {result.deleted_count} products"}

@router.delete("/csv/categories/clear")
async def clear_all_categories():
    """Clear all categories"""
    result = await db.categories.delete_many({})
    return {"success": True, "message": f"Deleted {result.deleted_count} categories"}

@router.post("/csv/categories/upload")
async def upload_categories_csv(file: UploadFile = File(...)):
    """Upload categories via CSV"""
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
                    'description': str(row.get('description', '')),
                    'image': str(row.get('image', '')),
                    'order': int(row.get('order', 0)),
                    'createdAt': datetime.utcnow()
                })
                inserted += 1
        
        return {"success": True, "message": f"Uploaded {inserted} categories"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
