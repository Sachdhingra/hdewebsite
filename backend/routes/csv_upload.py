from fastapi import APIRouter, UploadFile, File, HTTPException
from database import db
import pandas as pd
import io
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.post("/csv/products/upload")
async def upload_products_csv(file: UploadFile = File(...)):
    """
    Upload products via CSV file.
    Expected columns: name, category, price, originalPrice, image, description, features, inStock, sku, warranty
    """
    try:
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = ['name', 'category', 'price', 'originalPrice', 'description']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process and insert products
        inserted_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Parse features (assuming comma-separated in CSV)
                features = []
                if pd.notna(row.get('features')):
                    features = [f.strip() for f in str(row['features']).split(',')]
                
                # Parse images (assuming comma-separated URLs)
                images = []
                if pd.notna(row.get('images')):
                    images = [img.strip() for img in str(row['images']).split(',')]
                
                product_data = {
                    'name': str(row['name']),
                    'category': str(row['category']),
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
    """
    Upload categories via CSV file.
    Expected columns: name, slug, image, description, order
    """
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
                # Check if slug already exists
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

@router.post("/csv/leads/upload")
async def upload_leads_csv(file: UploadFile = File(...)):
    """
    Upload leads via CSV file.
    Expected columns: name, email, phone, message, category, source
    """
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        required_columns = ['name', 'email', 'phone']
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
                lead_data = {
                    'name': str(row['name']),
                    'email': str(row['email']),
                    'phone': str(row['phone']),
                    'message': str(row.get('message', '')),
                    'productInterest': None,
                    'category': str(row.get('category', '')),
                    'source': str(row.get('source', 'csv_upload')),
                    'status': 'new',
                    'assignedTo': None,
                    'notes': [],
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                
                await db.leads.insert_one(lead_data)
                inserted_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "success": True,
            "message": f"Successfully uploaded {inserted_count} leads",
            "inserted": inserted_count,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CSV: {str(e)}")

@router.get("/csv/products/template")
async def download_products_template():
    """Download CSV template for products"""
    template_data = {
        'name': ['Sample Product 1', 'Sample Product 2'],
        'category': ['living-room', 'bedroom'],
        'price': [25990, 35990],
        'originalPrice': [35990, 49990],
        'image': ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        'images': ['https://example.com/img1.jpg,https://example.com/img2.jpg', ''],
        'description': ['Beautiful sofa set', 'Comfortable bed'],
        'features': ['Premium Fabric,5 Year Warranty', 'Storage Compartments,10 Year Warranty'],
        'inStock': [True, True],
        'sku': ['GI-SOF-001', 'GI-BED-001'],
        'warranty': ['5 Years', '10 Years']
    }
    
    df = pd.DataFrame(template_data)
    
    # Create CSV in memory
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return {
        "success": True,
        "template": stream.getvalue(),
        "filename": "products_template.csv"
    }

@router.get("/csv/categories/template")
async def download_categories_template():
    """Download CSV template for categories"""
    template_data = {
        'name': ['Living Room', 'Bedroom'],
        'slug': ['living-room', 'bedroom'],
        'image': ['https://example.com/living.jpg', 'https://example.com/bedroom.jpg'],
        'description': ['Transform your living space', 'Create your perfect sanctuary'],
        'order': [1, 2]
    }
    
    df = pd.DataFrame(template_data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return {
        "success": True,
        "template": stream.getvalue(),
        "filename": "categories_template.csv"
    }

@router.get("/csv/leads/template")
async def download_leads_template():
    """Download CSV template for leads"""
    template_data = {
        'name': ['John Doe', 'Jane Smith'],
        'email': ['john@example.com', 'jane@example.com'],
        'phone': ['+91 9999999999', '+91 8888888888'],
        'message': ['Interested in sofas', 'Looking for bedroom furniture'],
        'category': ['Living Room', 'Bedroom'],
        'source': ['csv_upload', 'csv_upload']
    }
    
    df = pd.DataFrame(template_data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return {
        "success": True,
        "template": stream.getvalue(),
        "filename": "leads_template.csv"
    }

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
