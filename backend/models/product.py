from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Product(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    category: str  # slug
    price: float
    originalPrice: float
    image: str
    images: List[str] = []
    description: str
    features: List[str] = []
    inStock: bool = True
    sku: Optional[str] = None
    warranty: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    originalPrice: float
    image: str
    images: List[str] = []
    description: str
    features: List[str] = []
    inStock: bool = True
    sku: Optional[str] = None
    warranty: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    originalPrice: Optional[float] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    inStock: Optional[bool] = None
    sku: Optional[str] = None
    warranty: Optional[str] = None
