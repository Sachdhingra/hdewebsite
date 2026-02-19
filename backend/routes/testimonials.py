from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.testimonial import Testimonial, TestimonialCreate
from database import db
from bson import ObjectId

router = APIRouter()

@router.get("/testimonials", response_model=dict)
async def get_testimonials(
    approved: Optional[bool] = Query(True, description="Filter by approval status")
):
    """Get all testimonials"""
    try:
        query = {"approved": approved} if approved is not None else {}
        
        cursor = db.testimonials.find(query).sort('createdAt', -1)
        testimonials = await cursor.to_list(length=100)
        
        # Convert ObjectId to string
        for testimonial in testimonials:
            testimonial['_id'] = str(testimonial['_id'])
            testimonial['id'] = testimonial['_id']
        
        return {
            "testimonials": testimonials
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching testimonials: {str(e)}")

@router.post("/testimonials", response_model=dict)
async def create_testimonial(testimonial: TestimonialCreate):
    """Create a new testimonial (Admin only)"""
    try:
        testimonial_dict = testimonial.dict()
        result = await db.testimonials.insert_one(testimonial_dict)
        
        return {
            "success": True,
            "testimonialId": str(result.inserted_id),
            "message": "Testimonial created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating testimonial: {str(e)}")
