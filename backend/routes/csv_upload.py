from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from database import db
import pandas as pd
import io
import re
from datetime import datetime
from typing import Optional

router = APIRouter()

def parse_price(price_str):
    """Convert price string like '₹4,990.00' or '?4,990' to float"""
    if pd.isna(price_str) or not price_str:
        return 0.0
    # Remove currency symbols, commas, spaces
    clean_price = re.sub(r'[^\d.]', '', str(price_str).replace(',', ''))
    try:
        return float(clean_price) if clean_price else 0.0
    except ValueError:
        return 0.0

def extract_category_from_filename(filename):
    """Extract category name from filename like 'BEDROOM.csv' -> 'bedroom'"""
    if not filename:
        return None
    # Remove extension and clean up
    name = filename.rsplit('.', 1)[0]
    # Convert to lowercase and replace spaces/underscores with hyphens
    slug = re.sub(r'[\s_]+', '-', name.lower().strip())
    return slug

def create_category_name(slug):
    """Convert slug to display name: 'work-chairs' -> 'Work Chairs'"""
    return ' '.join(word.capitalize() for word in slug.split('-'))

@router.post("/csv/upload/interio")
async def upload_interio_csv(
    file: UploadFile = File(...),
    category_override: Optional[str] = Form(None)
):
    """
    Upload products via CSV file in Interio scraped format.
    Category is auto-detected from filename (e.g., BEDROOM.csv -> bedroom category)
    
    Expected columns: name, category, price, originalprice, image columns, description columns, 
                     features, inStock, sku, warranty, price-discount-text
    """
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Determine category from filename or override
        if category_override:
            category_slug = category_override.lower().replace(' ', '-')
        else:
            category_slug = extract_category_from_filename(file.filename)
        
        if not category_slug:
            category_slug = 'uncategorized'
        
        category_name = create_category_name(category_slug)
        
        # Ensure category exists in database
        existing_category = await db.categories.find_one({"slug": category_slug})
        if not existing_category:
            # Get first product image for category image
            first_image = None
            if 'image' in df.columns:
                for val in df['image']:
                    if pd.notna(val) and str(val).startswith('http') and 'media/catalog' in str(val):
                        first_image = str(val)
                        break
            
            await db.categories.insert_one({
                "name": category_name,
                "slug": category_slug,
                "description": f"Browse our {category_name} collection",
                "image": first_image or "",
                "order": 10,
                "createdAt": datetime.utcnow()
            })
        
        # Get all column names (handle duplicate column names)
        columns = list(df.columns)
        
        # Process and insert products
        inserted_count = 0
        updated_count = 0
        errors = []
        seen_names = set()
        
        for index, row in df.iterrows():
            try:
                # Get product name
                name = str(row.get('name', '')).strip()
                if not name or name == 'nan':
                    continue
                
                # Skip duplicates within same upload
                if name in seen_names:
                    continue
                seen_names.add(name)
                
                # Parse prices
                price = parse_price(row.get('price', 0))
                original_price = parse_price(row.get('originalprice', row.get('originalPrice', 0)))
                
                if original_price < price:
                    original_price = price
                
                # Collect all images (handle multiple 'image' columns)
                images = []
                for i, col in enumerate(columns):
                    if col == 'image':
                        val = row.iloc[i] if i < len(row) else None
                        if pd.notna(val):
                            img_url = str(val).strip()
                            # Only include actual image URLs (not product page URLs)
                            if img_url.startswith('http') and 'media/catalog' in img_url:
                                images.append(img_url)
                
                primary_image = images[0] if images else ""
                
                # Collect description parts
                description_parts = []
                for i, col in enumerate(columns):
                    if col == 'description':
                        val = row.iloc[i] if i < len(row) else None
                        if pd.notna(val) and str(val).strip():
                            description_parts.append(str(val).strip())
                
                description = ' | '.join(description_parts) if description_parts else name
                
                # Parse features
                features = []
                features_val = row.get('features', '')
                if pd.notna(features_val) and features_val:
                    features = [f.strip() for f in str(features_val).split(',') if f.strip()]
                
                # Add discount to features
                discount_text = row.get('price-discount-text', '')
                if pd.notna(discount_text) and discount_text:
                    features.append(str(discount_text).strip())
                
                # Parse other fields
                in_stock = True
                stock_val = row.get('inStock', 'TRUE')
                if pd.notna(stock_val):
                    in_stock = str(stock_val).upper() in ['TRUE', '1', 'YES']
                
                sku = str(row.get('sku', '')).strip() if pd.notna(row.get('sku')) else f"{category_slug[:3].upper()}-{index+1:04d}"
                warranty = str(row.get('warranty', '')).strip() if pd.notna(row.get('warranty')) else ""
                
                product_data = {
                    'name': name,
                    'category': category_slug,
                    'price': price,
                    'originalPrice': original_price,
                    'image': primary_image,
                    'images': images,
                    'description': description,
                    'features': features,
                    'inStock': in_stock,
                    'sku': sku,
                    'warranty': warranty,
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                
                # Check if product already exists (by name and category)
                existing = await db.products.find_one({
                    'name': name,
                    'category': category_slug
                })
                
                if existing:
                    # Update existing product
                    await db.products.update_one(
                        {'_id': existing['_id']},
                        {'$set': {**product_data, 'createdAt': existing['createdAt']}}
                    )
                    updated_count += 1
                else:
                    # Insert new product
                    await db.products.insert_one(product_data)
                    inserted_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Upload complete for '{category_name}' category",
            "category": {
                "name": category_name,
                "slug": category_slug
            },
            "inserted": inserted_count,
            "updated": updated_count,
            "total_processed": inserted_count + updated_count,
            "errors": errors[:10] if errors else None,
            "total_errors": len(errors)
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@router.delete("/csv/products/category/{category_slug}")
async def clear_category_products(category_slug: str):
    """Clear all products from a specific category"""
    result = await db.products.delete_many({"category": category_slug})
    return {
        "success": True,
        "message": f"Deleted {result.deleted_count} products from '{category_slug}' category"
    }

@router.get("/csv/categories/list")
async def list_product_categories():
    """Get list of all product categories with counts"""
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    results = await db.products.aggregate(pipeline).to_list(100)
    
    categories = []
    for item in results:
        categories.append({
            "slug": item["_id"],
            "name": create_category_name(item["_id"]) if item["_id"] else "Uncategorized",
            "productCount": item["count"]
        })
    
    return {
        "success": True,
        "categories": categories
    }

# Keep old endpoints for backwards compatibility
@router.post("/csv/products/upload")
async def upload_products_csv(file: UploadFile = File(...)):
    """
    Legacy endpoint - Upload products via CSV file.
    Expected columns: name, category, price, originalPrice, image, description, features, inStock, sku, warranty
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Check if this is an Interio format CSV
        if 'originalprice' in df.columns or 'price-discount-text' in df.columns:
            # Redirect to Interio upload handler
            file.file.seek(0)
            return await upload_interio_csv(file)
        
        # Validate required columns for legacy format
        required_columns = ['name', 'category', 'price', 'originalPrice', 'description']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        inserted_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                features = []
                if pd.notna(row.get('features')):
                    features = [f.strip() for f in str(row['features']).split(',')]
                
                images = []
                if pd.notna(row.get('images')):
                    images = [img.strip() for img in str(row['images']).split(',')]
                
                product_data = {
                    'name': str(row['name']),
                    'category': str(row['category']).lower().replace(' ', '-'),
                    'price': float(row['price']),
                    'originalPrice': float(row['originalPrice']),
                    'image': str(row.get('image', '')),
                    'images': images,
                    'description': str(row['description']),
                    'features': features,
                    'inStock': bool(row.get('inStock', True)),
                    'sku': str(row.get('sku', '')),
                    'warranty': str(row.get('warranty', '')),
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                
                await db.products.insert_one(product_data)
                inserted_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully uploaded {inserted_count} products",
            "inserted": inserted_count,
            "errors": errors if errors else None
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@router.post("/csv/categories/upload")
async def upload_categories_csv(file: UploadFile = File(...)):
    """Upload categories via CSV file."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        required_columns = ['name', 'slug', 'description']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        inserted_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                existing = await db.categories.find_one({'slug': str(row['slug'])})
                if existing:
                    errors.append(f"Row {index + 2}: Category with slug '{row['slug']}' already exists")
                    continue
                
                category_data = {
                    'name': str(row['name']),
                    'slug': str(row['slug']),
                    'image': str(row.get('image', '')),
                    'description': str(row['description']),
                    'order': int(row.get('order', 0)),
                    'createdAt': datetime.utcnow()
                }
                
                await db.categories.insert_one(category_data)
                inserted_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully uploaded {inserted_count} categories",
            "inserted": inserted_count,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@router.delete("/csv/products/clear")
async def clear_all_products():
    """Clear all products from database (use with caution)"""
    result = await db.products.delete_many({})
    return {
        "success": True,
        "message": f"Deleted {result.deleted_count} products"
    }

@router.delete("/csv/categories/clear")
async def clear_all_categories():
    """Clear all categories from database (use with caution)"""
    result = await db.categories.delete_many({})
    return {
        "success": True,
        "message": f"Deleted {result.deleted_count} categories"
    }
