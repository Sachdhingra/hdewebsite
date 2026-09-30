from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    CONVERTED = "converted"
    CLOSED = "closed"

class LeadSource(str, Enum):
    WEBSITE = "website"
    CATEGORY_PAGE = "category-page"
    CONTACT_FORM = "contact-form"
    SHOWROOM_PAGE = "showroom-page"

class AssignedTo(BaseModel):
    salesPersonId: Optional[str] = None
    salesPersonName: Optional[str] = None
    assignedAt: Optional[datetime] = None

class LeadNote(BaseModel):
    note: str
    addedBy: str
    addedAt: datetime = Field(default_factory=datetime.utcnow)

class Lead(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    phone: str
    message: Optional[str] = None
    productInterest: Optional[str] = None
    category: Optional[str] = None
    source: LeadSource = LeadSource.WEBSITE
    status: LeadStatus = LeadStatus.NEW
    assignedTo: Optional[AssignedTo] = None
    notes: List[LeadNote] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    message: Optional[str] = None
    productInterest: Optional[str] = None
    category: Optional[str] = None
    source: LeadSource = LeadSource.WEBSITE

class LeadAssign(BaseModel):
    salesPersonId: str
    salesPersonName: str

class LeadStatusUpdate(BaseModel):
    status: LeadStatus

class LeadNoteAdd(BaseModel):
    note: str
    addedBy: str
