from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Category(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    slug: str
    image: str
    description: str
    order: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class CategoryCreate(BaseModel):
    name: str
    slug: str
    image: str
    description: str
    order: int = 0
