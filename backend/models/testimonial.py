from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Testimonial(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    location: str
    rating: int = Field(ge=1, le=5)
    comment: str
    approved: bool = True
    date: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class TestimonialCreate(BaseModel):
    name: str
    location: str
    rating: int = Field(ge=1, le=5)
    comment: str
    approved: bool = True
    date: Optional[str] = None
