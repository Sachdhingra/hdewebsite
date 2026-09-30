from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Salesperson(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    phone: Optional[str] = None
    # Short code used in the salesperson's personal website link (?ref=<code>)
    code: str
    active: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}


class SalespersonCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    phone: Optional[str] = None
    # Optional; generated from the name when left empty
    code: Optional[str] = None


class SalespersonUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=60)
    phone: Optional[str] = None
    active: Optional[bool] = None
