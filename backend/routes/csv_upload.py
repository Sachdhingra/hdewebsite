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

def get_column_value(row, col_names, default=''):
    """Safely get value from row trying multiple column names"""
    for col in col_names:
        try:
            val = row.get(col, None)
            if val is not None and pd.notna(val) and str(val).strip() and str(val).strip().lower() != 'nan':
                return str(val).strip()
        except:
            continue
    return default

def detect_csv_format(columns):
    """Detect which CSV format is being used"""
    columns_lower = [c.lower() for c in columns]
    
    # Format 2: SOFAS/RECLINERS format (product-name, main-image src, etc.)
    if 'product-name' in columns_lower or 'main-image src' in columns_lower:
        return 'format2'
    
    # Format 1: Standard Interio format (name, originalprice, etc.)
    return 'format1'

@router.post("/csv/upload/interio")
async def upload_interio_csv(
    file: UploadFile = File(...),
    category_override: Optional[str] = Form(None)
):
    """
    Upload products via CSV file - supports multiple formats.
    Category is auto-detected from filename (e.g., BEDROOM.csv -> bedroom category)
    """
    try:
        logger.info(f"Starting CSV upload for file: {file.filename}")
        
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        columns = list(df.columns)
        logger.info(f"CSV Columns: {columns}")
        
        # Detect format
        csv_format = detect_csv_format(columns)
        logger.info(f"Detected format: {csv_format}")
        
        # Determine category from filename or override
        if category_override and category_override.strip():
            category_slug = category_override.lower().replace(' ', '-')
        else:
            category_slug = extract_category_from_filename(file.filename)
        
        if not category_slug:
            category_slug = 'uncategorized'
        
        category_name = create_category_name(category_slug)
        logger.info(f"Category: {category_name} ({category_slug})")
        
        # Ensure category exists in database
        existing_category = await db.categories.find_one({"slug": category_slug})
        if not existing_category:
            # Get first product image for category image
            first_image = ""
            if csv_format == 'format2':
                if 'main-image src' in df.columns:
                    for val in df['main-image src']:
                        if pd.notna(val) and str(val).startswith('http'):
                            first_image = str(val).strip()
                            break
            else:
                for col in columns:
                    if col == 'image' or col.startswith('image.'):
                        for val in df[col]:
                            if pd.notna(val) and str(val).startswith('http'):
                                first_image = str(val).strip()
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
            logger.info(f"Created new category: {category_name}")
        
        # Process and insert products
        inserted_count = 0
        updated_count = 0
        errors = []
        seen_names = set()
        
        for index, row in df.iterrows():
            try:
                # Get product name based on format
                if csv_format == 'format2':
                    name = get_column_value(row, ['product-name', 'productname', 'product name', 'name'])
                else:
                    name = get_column_value(row, ['name', 'product-name', 'productname'])
                
                if not name:
                    continue
                
                # Skip duplicates
                if name in seen_names:
                    continue
                seen_names.add(name)
                
                # Parse prices based on format
                if csv_format == 'format2':
                    price = parse_price(get_column_value(row, ['price']))
                    original_price = parse_price(get_column_value(row, ['price 2', 'price2', 'originalprice']))
                else:
                    price = parse_price(get_column_value(row, ['price']))
                    original_price = parse_price(get_column_value(row, ['originalprice', 'originalPrice', 'price 2']))
                
                if original_price < price:
                    original_price = price
                if price == 0 and original_price > 0:
                    price = original_price
                
                # Skip if no valid price
                if price == 0:
                    errors.append(f"Row {index + 2}: No valid price")
                    continue
                
                # Collect images based on format
                images = []
                if csv_format == 'format2':
                    main_img = get_column_value(row, ['main-image src'])
                    if main_img.startswith('http'):
                        images.append(main_img)
                    hover_img = get_column_value(row, ['hover-image src'])
                    if hover_img.startswith('http'):
                        images.append(hover_img)
                else:
                    for col in columns:
                        if col == 'image' or col.startswith('image.'):
                            img_val = get_column_value(row, [col])
                            if img_val.startswith('http') and 'media/catalog' in img_val:
                                images.append(img_val)
                
                # Get description
                if csv_format == 'format2':
                    description = get_column_value(row, ['short-mini-des', 'short-mini-description', 'description'], name)
                else:
                    desc_parts = []
                    for col in columns:
                        if col == 'description' or col.startswith('description.'):
                            desc_val = get_column_value(row, [col])
                            if desc_val:
                                desc_parts.append(desc_val)
                    description = ' | '.join(desc_parts) if desc_parts else name
                
                # Get features
                features = []
                if csv_format == 'format2':
                    # Add prod-label (warranty info)
                    prod_label = get_column_value(row, ['prod-label'])
                    if prod_label:
                        features.append(prod_label)
                    # Add description parts
                    if description and description != name:
                        features.extend([p.strip() for p in description.split(',') if p.strip()])
                    # Add discount
                    discount = get_column_value(row, ['price-discount-text'])
                    if discount:
                        features.append(discount)
                    # Add color
                    color = get_column_value(row, ['custom-tooltip'])
                    if color:
                        features.append(f"Color: {color}")
                else:
                    features_val = get_column_value(row, ['features'])
                    if features_val:
                        features = [f.strip() for f in features_val.split(',') if f.strip()]
                    discount = get_column_value(row, ['price-discount-text'])
                    if discount:
                        features.append(discount)
                
                # Get warranty
                warranty = ""
                if csv_format == 'format2':
                    prod_label = get_column_value(row, ['prod-label'])
                    if prod_label and 'warranty' in prod_label.lower():
                        warranty = prod_label
                else:
                    warranty = get_column_value(row, ['warranty'])
                
                # Build product data
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
                
                # Check if product already exists
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
                logger.error(f"Error processing row {index + 2}: {str(e)}")
                errors.append(f"Row {index + 2}: {str(e)}")
        
        total_processed = inserted_count + updated_count
        logger.info(f"Upload complete: {inserted_count} inserted, {updated_count} updated")
        
        if total_processed == 0:
            raise HTTPException(
                status_code=400, 
                detail=f"No products could be processed. Detected format: {csv_format}. Found {len(df)} rows."
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
        logger.error("CSV file is empty")
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing CSV: {str(e)}\n{traceback.format_exc()}")
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
