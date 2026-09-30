from pydantic import BaseModel, Field, EmailStr, field_validator
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
    email: Optional[EmailStr] = None
    phone: str
    message: Optional[str] = None
    productInterest: Optional[str] = None
    category: Optional[str] = None
    source: LeadSource = LeadSource.WEBSITE
    status: LeadStatus = LeadStatus.NEW
    assignedTo: Optional[AssignedTo] = None
    refCode: Optional[str] = None
    notes: List[LeadNote] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class LeadCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str
    message: Optional[str] = None
    productInterest: Optional[str] = None
    category: Optional[str] = None
    source: LeadSource = LeadSource.WEBSITE
    # Salesperson link code from the website (?ref=<code>); the lead is assigned to them
    ref: Optional[str] = Field(default=None, max_length=60)

    @field_validator("email", mode="before")
    @classmethod
    def blank_email_is_none(cls, v):
        # The website's short forms have no email field and send ""
        return v or None

class LeadAssign(BaseModel):
    salesPersonId: str
    salesPersonName: str

class LeadStatusUpdate(BaseModel):
    status: LeadStatus

class LeadNoteAdd(BaseModel):
    note: str
    addedBy: str
