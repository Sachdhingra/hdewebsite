from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.product import Product, ProductCreate, ProductUpdate
from database import db
from bson import ObjectId

router = APIRouter()

# Category hierarchy for fetching products by parent category
PARENT_SUBCATEGORIES = {
    'living-room': ['sofas', 'recliners', 'coffee-tables', 'tv-units', 'bean-bags', 'ottomans', 'center-tables'],
    'bedroom': ['beds', 'wardrobes', 'dressers', 'bedside-tables', 'mattresses'],
    'dining-room': ['dining-tables', 'dining-chairs', 'dining-sets', 'crockery-units', 'bar-cabinets'],
    'office-study': ['office-chairs', 'work-chairs', 'study-tables', 'bookshelves', 'computer-tables', 'filing-cabinets'],
    'modular-kitchen': ['kitchen-cabinets', 'kitchen-storage', 'kitchen-islands'],
    'storage': ['shoe-racks', 'storage-cabinets', 'wall-shelves', 'display-units']
}

@router.get("/products", response_model=dict)
async def get_products(
    category: Optional[str] = Query(None, description="Filter by category slug"),
    parentCategory: Optional[str] = Query(None, description="Filter by parent category"),
    minPrice: Optional[float] = Query(None, description="Minimum price"),
    maxPrice: Optional[float] = Query(None, description="Maximum price"),
    inStock: Optional[bool] = Query(None, description="Filter by stock status"),
    featured: Optional[bool] = Query(None, description="Get featured products only")
):
    """Get all products with optional filtering"""
    try:
        query = {}
        
        if category:
            # Check if this is a parent category
            if category in PARENT_SUBCATEGORIES:
                # Get products from this category AND all its subcategories
                subcategories = PARENT_SUBCATEGORIES[category]
                query['$or'] = [
                    {'category': category},
                    {'category': {'$in': subcategories}},
                    {'parentCategory': category}
                ]
            else:
                query['category'] = category
        
        if parentCategory:
            query['parentCategory'] = parentCategory
        
        if minPrice is not None or maxPrice is not None:
            query['price'] = {}
            if minPrice is not None:
                query['price']['$gte'] = minPrice
            if maxPrice is not None:
                query['price']['$lte'] = maxPrice
        
        if inStock is not None:
            query['inStock'] = inStock
        
        cursor = db.products.find(query).sort('createdAt', -1)
        
        if featured:
            cursor = cursor.limit(8)
        
        products = await cursor.to_list(length=500)
        
        # Convert ObjectId to string
        for product in products:
            product['_id'] = str(product['_id'])
            product['id'] = product['_id']
        
        return {
            "products": products,
            "total": len(products)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")

@router.get("/products/{product_id}", response_model=dict)
async def get_product(product_id: str):
    """Get a single product by ID"""
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product['_id'] = str(product['_id'])
        product['id'] = product['_id']
        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching product: {str(e)}")

@router.post("/products", response_model=dict)
async def create_product(product: ProductCreate):
    """Create a new product (Admin only)"""
    try:
        product_dict = product.dict()
        result = await db.products.insert_one(product_dict)
        
        return {
            "success": True,
            "productId": str(result.inserted_id),
            "message": "Product created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")

@router.put("/products/{product_id}", response_model=dict)
async def update_product(product_id: str, product_update: ProductUpdate):
    """Update a product (Admin only)"""
    try:
        update_data = {k: v for k, v in product_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
            "success": True,
            "message": "Product updated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")

@router.delete("/products/{product_id}", response_model=dict)
async def delete_product(product_id: str):
    """Delete a product (Admin only)"""
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {
            "success": True,
            "message": "Product deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")
