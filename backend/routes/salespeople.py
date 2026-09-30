from fastapi import APIRouter, HTTPException
from models.salesperson import SalespersonCreate, SalespersonUpdate
from database import db
from datetime import datetime
from bson import ObjectId
import re

router = APIRouter()

CODE_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")


def normalise_code(value: str) -> str:
    """Lowercase, spaces to dashes, drop anything that isn't a-z, 0-9 or a dash."""
    code = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower()).strip("-")
    return code[:40]


async def unique_code(base: str) -> str:
    code, n = base, 2
    while await db.salespeople.find_one({"code": code}):
        code = f"{base}-{n}"
        n += 1
    return code


async def find_by_ref(ref: str):
    """The active salesperson a website ?ref= code belongs to, or None."""
    code = normalise_code(ref)
    if not code or not CODE_RE.match(code):
        return None
    return await db.salespeople.find_one({"code": code, "active": True})


def _out(sp: dict) -> dict:
    sp["_id"] = str(sp["_id"])
    return sp


@router.get("/salespeople", response_model=dict)
async def list_salespeople():
    """All salespeople, with how many leads each one has."""
    people = await db.salespeople.find().sort("name", 1).to_list(length=500)
    counts = {}
    async for row in db.leads.aggregate([
        {"$match": {"assignedTo.salesPersonId": {"$ne": None}}},
        {"$group": {"_id": "$assignedTo.salesPersonId", "count": {"$sum": 1}}},
    ]):
        counts[row["_id"]] = row["count"]
    for sp in people:
        _out(sp)
        sp["leadCount"] = counts.get(sp["_id"], 0)
    return {"salespeople": people}


@router.get("/salespeople/{sp_id}", response_model=dict)
async def get_salesperson(sp_id: str):
    """One salesperson, by id or by link code."""
    query = {"_id": ObjectId(sp_id)} if ObjectId.is_valid(sp_id) else {"code": normalise_code(sp_id)}
    sp = await db.salespeople.find_one(query)
    if not sp:
        raise HTTPException(status_code=404, detail="Salesperson not found")
    return _out(sp)


@router.post("/salespeople", response_model=dict)
async def create_salesperson(data: SalespersonCreate):
    """Add a salesperson and give them a personal link code."""
    if data.code:
        code = normalise_code(data.code)
        if not CODE_RE.match(code):
            raise HTTPException(status_code=400, detail="Link code can only use letters, numbers and dashes")
        if await db.salespeople.find_one({"code": code}):
            raise HTTPException(status_code=400, detail=f"The link code '{code}' is already taken")
    else:
        base = normalise_code(data.name) or "sales"
        code = await unique_code(base)

    doc = {
        "name": data.name.strip(),
        "phone": (data.phone or "").strip() or None,
        "code": code,
        "active": True,
        "createdAt": datetime.utcnow(),
    }
    result = await db.salespeople.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return {"success": True, "salesperson": doc}


@router.put("/salespeople/{sp_id}", response_model=dict)
async def update_salesperson(sp_id: str, data: SalespersonUpdate):
    """Rename, change phone, or switch a salesperson's link off (active=false)."""
    if not ObjectId.is_valid(sp_id):
        raise HTTPException(status_code=404, detail="Salesperson not found")
    update = {k: v for k, v in data.dict().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    result = await db.salespeople.update_one({"_id": ObjectId(sp_id)}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Salesperson not found")
    if "name" in update:
        # Keep the name shown on their existing leads in step
        await db.leads.update_many(
            {"assignedTo.salesPersonId": sp_id},
            {"$set": {"assignedTo.salesPersonName": update["name"]}},
        )
    return {"success": True}
