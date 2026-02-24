from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from database import db
import pandas as pd
import io
import re
from datetime import datetime
from typing import Optional
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def parse_price(price_str):
    """Convert price string like '₹4,990.00' or '??21,690' to float"""
    if pd.isna(price_str) or not price_str:
        return 0.0
    # Remove currency symbols, commas, spaces, question marks
    clean_price = re.sub(r'[^\d.]', '', str(price_str).replace(',', ''))
    try:
        return float(clean_price) if clean_price else 0.0
    except ValueError:
        return 0.0

def extract_category_from_filename(filename):
    """Extract category name from filename like 'BEDROOM.csv' -> 'bedroom'"""
    if not filename:
        return None
    name = filename.rsplit('.', 1)[0]
    slug = re.sub(r'[\s_]+', '-', name.lower().strip())
    return slug

def create_category_name(slug):
    """Convert slug to display name: 'work-chairs' -> 'Work Chairs'"""
    return ' '.join(word.capitalize() for word in slug.split('-'))

def detect_csv_format(columns):
    """Detect which CSV format is being used"""
    columns_lower = [c.lower() for c in columns]
    
    # Format 2: SOFAS/RECLINERS format (product-name, main-image src, etc.)
    if 'product-name' in columns_lower or 'main-image src' in columns_lower:
        return 'format2'
    
    # Format 1: Standard Interio format (name, originalprice, etc.)
    if 'name' in columns_lower or 'originalprice' in columns_lower:
        return 'format1'
    
    # Try to detect by checking for common patterns
    for col in columns_lower:
        if 'product' in col and 'name' in col:
            return 'format2'
    
    return 'format1'  # Default to format1

def process_format1_row(row, columns, category_slug, index):
    """Process a row in Format 1 (name, originalprice, image, etc.)"""
    name = str(row.get('name', '')).strip()
    if not name or name == 'nan':
        return None
    
    price = parse_price(row.get('price', 0))
    original_price = parse_price(row.get('originalprice', row.get('originalPrice', 0)))
    
    if original_price < price:
        original_price = price
    
    # Collect images
    images = []
    for col in columns:
        if col == 'image' or col.startswith('image.'):
            val = row.get(col)
            if pd.notna(val):
                img_url = str(val).strip()
                if img_url.startswith('http') and 'media/catalog' in img_url:
                    images.append(img_url)
    
    # Collect description
    description_parts = []
    for col in columns:
        if col == 'description' or col.startswith('description.'):
            val = row.get(col)
            if pd.notna(val) and str(val).strip():
                description_parts.append(str(val).strip())
    description = ' | '.join(description_parts) if description_parts else name
    
    # Parse features
    features = []
    features_val = row.get('features', '')
    if pd.notna(features_val) and features_val:
        features = [f.strip() for f in str(features_val).split(',') if f.strip()]
    
    discount_text = row.get('price-discount-text', '')
    if pd.notna(discount_text) and discount_text:
        features.append(str(discount_text).strip())
    
    in_stock = True
    stock_val = row.get('inStock', 'TRUE')
    if pd.notna(stock_val):
        in_stock = str(stock_val).upper() in ['TRUE', '1', 'YES']
    
    sku = str(row.get('sku', '')).strip() if pd.notna(row.get('sku')) else f"{category_slug[:3].upper()}-{index+1:04d}"
    warranty = str(row.get('warranty', '')).strip() if pd.notna(row.get('warranty')) else ""
    
    return {
        'name': name,
        'category': category_slug,
        'price': price,
        'originalPrice': original_price,
        'image': images[0] if images else "",
        'images': images,
        'description': description,
        'features': features,
        'inStock': in_stock,
        'sku': sku,
        'warranty': warranty,
        'createdAt': datetime.utcnow(),
        'updatedAt': datetime.utcnow()
    }

def process_format2_row(row, columns, category_slug, index):
    """Process a row in Format 2 (product-name, main-image src, price 2, etc.)"""
    # Get product name - try multiple column names
    name = None
    for col_name in ['product-name', 'productname', 'product name']:
        if col_name in [c.lower() for c in columns]:
            actual_col = [c for c in columns if c.lower() == col_name][0]
            name = str(row.get(actual_col, '')).strip()
            if name and name != 'nan':
                break
    
    if not name or name == 'nan':
        return None
    
    # Parse prices - try multiple column names
    price = parse_price(row.get('price', 0))
    original_price = parse_price(row.get('price 2', row.get('price2', 0)))
    
    if original_price < price:
        original_price = price
    if price == 0 and original_price > 0:
        price = original_price
    
    # Collect images
    images = []
    main_img = row.get('main-image src', '')
    if pd.notna(main_img) and str(main_img).startswith('http'):
        images.append(str(main_img).strip())
    
    hover_img = row.get('hover-image src', '')
    if pd.notna(hover_img) and str(hover_img).startswith('http'):
        images.append(str(hover_img).strip())
    
    # Description from short-mini-des or similar
    description = ""
    for col_name in ['short-mini-des', 'short-mini-description', 'description', 'mini-des']:
        if col_name in [c.lower() for c in columns]:
            actual_col = [c for c in columns if c.lower() == col_name][0]
            desc_val = row.get(actual_col, '')
            if pd.notna(desc_val) and str(desc_val).strip():
                description = str(desc_val).strip()
                break
    
    if not description:
        description = name
    
    # Features
    features = []
    
    # Add prod-label (warranty info)
    prod_label = row.get('prod-label', '')
    if pd.notna(prod_label) and prod_label:
        features.append(str(prod_label).strip())
    
    # Add description parts as features
    if description and description != name:
        desc_parts = [p.strip() for p in description.split(',') if p.strip()]
        features.extend(desc_parts)
    
    # Add discount text
    discount_text = row.get('price-discount-text', '')
    if pd.notna(discount_text) and discount_text:
        features.append(str(discount_text).strip())
    
    # Add color/finish from custom-tooltip
    color_tooltip = row.get('custom-tooltip', '')
    if pd.notna(color_tooltip) and color_tooltip and str(color_tooltip).strip():
        features.append(f"Color: {str(color_tooltip).strip()}")
    
    # Warranty
    warranty = ""
    if pd.notna(prod_label) and 'warranty' in str(prod_label).lower():
        warranty = str(prod_label).strip()
    
    return {
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

@router.post("/csv/upload/interio")
async def upload_interio_csv(
    file: UploadFile = File(...),
    category_override: Optional[str] = Form(None)
):
    """
    Upload products via CSV file - supports multiple formats.
    Category is auto-detected from filename (e.g., BEDROOM.csv -> bedroom category)
    
    Supported formats:
    - Format 1: name, category, price, originalprice, image, features, warranty
    - Format 2: product-name, main-image src, price, price 2, short-mini-des, prod-label
    """
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        columns = list(df.columns)
        print(f"CSV Columns: {columns}")
        
        # Detect format
        csv_format = detect_csv_format(columns)
        print(f"Detected format: {csv_format}")
        
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
            first_image = ""
            if csv_format == 'format2':
                for val in df.get('main-image src', []):
                    if pd.notna(val) and str(val).startswith('http'):
                        first_image = str(val)
                        break
            else:
                for col in columns:
                    if col == 'image' or col.startswith('image.'):
                        for val in df[col]:
                            if pd.notna(val) and str(val).startswith('http') and 'media/catalog' in str(val):
                                first_image = str(val)
                                break
                        if first_image:
                            break
            
            await db.categories.insert_one({
                "name": category_name,
                "slug": category_slug,
                "description": f"Browse our {category_name} collection",
                "image": first_image,
                "order": 10,
                "createdAt": datetime.utcnow()
            })
        
        # Process and insert products
        inserted_count = 0
        updated_count = 0
        errors = []
        seen_names = set()
        
        for index, row in df.iterrows():
            try:
                # Process row based on format
                if csv_format == 'format2':
                    product_data = process_format2_row(row, columns, category_slug, index)
                else:
                    product_data = process_format1_row(row, columns, category_slug, index)
                
                if not product_data:
                    continue
                
                name = product_data['name']
                
                # Skip duplicates within same upload
                if name in seen_names:
                    continue
                seen_names.add(name)
                
                # Skip if no valid price
                if product_data['price'] == 0 and product_data['originalPrice'] == 0:
                    errors.append(f"Row {index + 2}: No valid price found")
                    continue
                
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
        
        total_processed = inserted_count + updated_count
        
        if total_processed == 0:
            raise HTTPException(
                status_code=400, 
                detail=f"No products could be processed. Format detected: {csv_format}. Columns found: {columns}"
            )
        
        return {
            "success": True,
            "message": f"Upload complete for '{category_name}' category",
            "category": {
                "name": category_name,
                "slug": category_slug
            },
            "format_detected": csv_format,
            "inserted": inserted_count,
            "updated": updated_count,
            "total_processed": total_processed,
            "errors": errors[:10] if errors else None,
            "total_errors": len(errors)
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except HTTPException:
        raise
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
    """Legacy endpoint - redirects to main upload handler"""
    return await upload_interio_csv(file)

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
