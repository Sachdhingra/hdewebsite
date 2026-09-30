from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from models.lead import Lead, LeadCreate, LeadAssign, LeadStatusUpdate, LeadNote, LeadNoteAdd
from database import db
from routes.salespeople import find_by_ref
from datetime import datetime
from bson import ObjectId

router = APIRouter()

def salesperson_filter(sales_person_id: Optional[str]) -> dict:
    if not sales_person_id or sales_person_id == 'all':
        return {}
    if sales_person_id == 'unassigned':
        return {"$or": [{"assignedTo": None}, {"assignedTo.salesPersonId": None}]}
    return {"assignedTo.salesPersonId": sales_person_id}

@router.post("/leads", response_model=dict)
async def create_lead(lead: LeadCreate):
    """Submit a new lead/inquiry"""
    try:
        lead_dict = lead.dict()
        ref = lead_dict.pop('ref', None)
        lead_dict['status'] = 'new'
        lead_dict['createdAt'] = datetime.utcnow()
        lead_dict['updatedAt'] = datetime.utcnow()
        lead_dict['notes'] = []
        lead_dict['assignedTo'] = None
        lead_dict['refCode'] = None

        # Enquiry came through a salesperson's personal link: it goes straight to them
        salesperson = await find_by_ref(ref) if ref else None
        if salesperson:
            lead_dict['refCode'] = salesperson['code']
            lead_dict['assignedTo'] = {
                "salesPersonId": str(salesperson['_id']),
                "salesPersonName": salesperson['name'],
                "assignedAt": datetime.utcnow()
            }
        
        result = await db.leads.insert_one(lead_dict)
        
        return {
            "success": True,
            "leadId": str(result.inserted_id),
            "message": "Lead submitted successfully. Our team will contact you shortly!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")

@router.get("/leads", response_model=dict)
async def get_leads(
    status: Optional[str] = Query(None, description="Filter by status"),
    salesPersonId: Optional[str] = Query(None, description="Only this salesperson's leads, or 'unassigned'"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all leads with filtering and pagination"""
    try:
        query = {}
        if status and status != 'all':
            query['status'] = status
        query.update(salesperson_filter(salesPersonId))
        
        skip = (page - 1) * limit
        
        # Get total count
        total = await db.leads.count_documents(query)
        
        # Get leads
        cursor = db.leads.find(query).sort('createdAt', -1).skip(skip).limit(limit)
        leads = await cursor.to_list(length=limit)
        
        # Convert ObjectId to string
        for lead in leads:
            lead['_id'] = str(lead['_id'])
        
        return {
            "leads": leads,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leads: {str(e)}")

@router.get("/leads/{lead_id}", response_model=dict)
async def get_lead(lead_id: str):
    """Get a single lead by ID"""
    try:
        lead = await db.leads.find_one({"_id": ObjectId(lead_id)})
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        lead['_id'] = str(lead['_id'])
        return lead
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lead: {str(e)}")

@router.put("/leads/{lead_id}/assign", response_model=dict)
async def assign_lead(lead_id: str, assignment: LeadAssign):
    """Assign a lead to a sales person"""
    try:
        update_data = {
            "assignedTo": {
                "salesPersonId": assignment.salesPersonId,
                "salesPersonName": assignment.salesPersonName,
                "assignedAt": datetime.utcnow()
            },
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {
            "success": True,
            "message": f"Lead assigned to {assignment.salesPersonName}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning lead: {str(e)}")

@router.put("/leads/{lead_id}/status", response_model=dict)
async def update_lead_status(lead_id: str, status_update: LeadStatusUpdate):
    """Update lead status"""
    try:
        result = await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {"$set": {
                "status": status_update.status,
                "updatedAt": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {
            "success": True,
            "message": f"Lead status updated to {status_update.status}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lead status: {str(e)}")

@router.post("/leads/{lead_id}/notes", response_model=dict)
async def add_lead_note(lead_id: str, note_data: LeadNoteAdd):
    """Add a note to a lead"""
    try:
        note = {
            "note": note_data.note,
            "addedBy": note_data.addedBy,
            "addedAt": datetime.utcnow()
        }
        
        result = await db.leads.update_one(
            {"_id": ObjectId(lead_id)},
            {
                "$push": {"notes": note},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return {
            "success": True,
            "message": "Note added successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")

@router.get("/leads/stats/summary", response_model=dict)
async def get_lead_stats(
    salesPersonId: Optional[str] = Query(None, description="Only this salesperson's leads, or 'unassigned'")
):
    """Get lead statistics for dashboard"""
    try:
        base = salesperson_filter(salesPersonId)
        total = await db.leads.count_documents(base)
        new = await db.leads.count_documents({**base, "status": "new"})
        contacted = await db.leads.count_documents({**base, "status": "contacted"})
        interested = await db.leads.count_documents({**base, "status": "interested"})
        converted = await db.leads.count_documents({**base, "status": "converted"})
        
        return {
            "total": total,
            "new": new,
            "contacted": contacted,
            "interested": interested,
            "converted": converted,
            "conversionRate": round((converted / total * 100) if total > 0 else 0, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")
