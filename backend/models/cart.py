from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class CartItem(BaseModel):
    productId: str
    productName: str
    price: float
    quantity: int = 1
    image: Optional[str] = None

class CartInquiry(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    customerName: str
    customerEmail: EmailStr
    customerPhone: str
    items: List[CartItem]
    totalAmount: float
    message: Optional[str] = None
    status: str = "pending"  # pending, contacted, completed, cancelled
    assignedTo: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class CartInquiryCreate(BaseModel):
    customerName: str
    customerEmail: EmailStr
    customerPhone: str
    items: List[CartItem]
    totalAmount: float
    message: Optional[str] = None

class CartInquiryUpdate(BaseModel):
    status: Optional[str] = None
    assignedTo: Optional[str] = None
