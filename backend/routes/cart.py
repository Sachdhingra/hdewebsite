from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.cart import CartInquiry, CartInquiryCreate, CartInquiryUpdate
from database import db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

@router.post("/cart/inquiries", response_model=dict)
async def create_cart_inquiry(inquiry: CartInquiryCreate):
    """Submit cart as inquiry"""
    try:
        inquiry_dict = inquiry.dict()
        inquiry_dict['status'] = 'pending'
        inquiry_dict['createdAt'] = datetime.utcnow()
        inquiry_dict['updatedAt'] = datetime.utcnow()
        
        result = await db.cart_inquiries.insert_one(inquiry_dict)
        
        return {
            "success": True,
            "inquiryId": str(result.inserted_id),
            "message": "Thank you! Our team will contact you shortly regarding your inquiry."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating cart inquiry: {str(e)}")

@router.get("/cart/inquiries", response_model=dict)
async def get_cart_inquiries(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all cart inquiries (Admin)"""
    try:
        query = {}
        if status:
            query['status'] = status
        
        skip = (page - 1) * limit
        total = await db.cart_inquiries.count_documents(query)
        
        cursor = db.cart_inquiries.find(query).sort('createdAt', -1).skip(skip).limit(limit)
        inquiries = await cursor.to_list(length=limit)
        
        for inquiry in inquiries:
            inquiry['_id'] = str(inquiry['_id'])
        
        return {
            "inquiries": inquiries,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cart inquiries: {str(e)}")

@router.get("/cart/inquiries/{inquiry_id}", response_model=dict)
async def get_cart_inquiry(inquiry_id: str):
    """Get single cart inquiry"""
    try:
        inquiry = await db.cart_inquiries.find_one({"_id": ObjectId(inquiry_id)})
        if not inquiry:
            raise HTTPException(status_code=404, detail="Cart inquiry not found")
        
        inquiry['_id'] = str(inquiry['_id'])
        return inquiry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cart inquiry: {str(e)}")

@router.put("/cart/inquiries/{inquiry_id}", response_model=dict)
async def update_cart_inquiry(inquiry_id: str, update_data: CartInquiryUpdate):
    """Update cart inquiry status/assignment"""
    try:
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict['updatedAt'] = datetime.utcnow()
        
        result = await db.cart_inquiries.update_one(
            {"_id": ObjectId(inquiry_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Cart inquiry not found")
        
        return {
            "success": True,
            "message": "Cart inquiry updated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating cart inquiry: {str(e)}")

@router.get("/cart/inquiries/stats/summary", response_model=dict)
async def get_cart_inquiry_stats():
    """Get cart inquiry statistics"""
    try:
        total = await db.cart_inquiries.count_documents({})
        pending = await db.cart_inquiries.count_documents({"status": "pending"})
        contacted = await db.cart_inquiries.count_documents({"status": "contacted"})
        completed = await db.cart_inquiries.count_documents({"status": "completed"})
        
        return {
            "total": total,
            "pending": pending,
            "contacted": contacted,
            "completed": completed
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")
