"""
Seed script to populate MongoDB with initial data
Run this script once to populate the database with mock data
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Categories data
categories = [
    {
        "name": "Living Room",
        "slug": "living-room",
        "image": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
        "description": "Transform your living space with our elegant sofas, loungers, and coffee tables",
        "order": 1,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Bedroom",
        "slug": "bedroom",
        "image": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
        "description": "Create your perfect sanctuary with beds, wardrobes, and bedroom sets",
        "order": 2,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Dining Room",
        "slug": "dining-room",
        "image": "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
        "description": "Dine in style with our premium dining tables and chairs",
        "order": 3,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Office & Study",
        "slug": "office-study",
        "image": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
        "description": "Boost productivity with ergonomic office chairs and study tables",
        "order": 4,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Modular Kitchen",
        "slug": "modular-kitchen",
        "image": "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
        "description": "Design your dream kitchen with modular solutions",
        "order": 5,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Storage Solutions",
        "slug": "storage",
        "image": "https://images.unsplash.com/photo-1595428773491-ae4a0b7e3a4a?w=800",
        "description": "Organize beautifully with wardrobes, almirahs, and cabinets",
        "order": 6,
        "createdAt": datetime.utcnow()
    }
]

# Products data
products = [
    {
        "name": "Royale Fabric Sofa Set",
        "category": "living-room",
        "price": 45990,
        "originalPrice": 65990,
        "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
        "images": ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"],
        "description": "Premium 3-seater sofa with plush cushioning",
        "features": ["Premium Fabric", "Sturdy Frame", "5 Year Warranty"],
        "inStock": True,
        "sku": "GI-SOF-001",
        "warranty": "5 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "name": "Urbane King Size Bed",
        "category": "bedroom",
        "price": 32990,
        "originalPrice": 45990,
        "image": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
        "images": ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800"],
        "description": "Elegant king size bed with storage",
        "features": ["Storage Compartments", "Premium Wood", "10 Year Warranty"],
        "inStock": True,
        "sku": "GI-BED-001",
        "warranty": "10 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "name": "Elite L-Shaped Sofa",
        "category": "living-room",
        "price": 58990,
        "originalPrice": 79990,
        "image": "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
        "images": ["https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800"],
        "description": "Spacious L-shaped sofa perfect for large families",
        "features": ["Leather Finish", "Corner Design", "5 Year Warranty"],
        "inStock": True,
        "sku": "GI-SOF-002",
        "warranty": "5 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "name": "Classic Wooden Wardrobe",
        "category": "bedroom",
        "price": 28990,
        "originalPrice": 39990,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
        "images": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"],
        "description": "Spacious 3-door wardrobe with mirror",
        "features": ["3 Door Design", "Multiple Compartments", "10 Year Warranty"],
        "inStock": True,
        "sku": "GI-WAR-001",
        "warranty": "10 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "name": "Marble Top Dining Table",
        "category": "dining-room",
        "price": 35990,
        "originalPrice": 49990,
        "image": "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
        "images": ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800"],
        "description": "6-seater dining table with marble top",
        "features": ["Marble Top", "Seats 6", "5 Year Warranty"],
        "inStock": True,
        "sku": "GI-DIN-001",
        "warranty": "5 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "name": "Ergonomic Office Chair",
        "category": "office-study",
        "price": 8990,
        "originalPrice": 12990,
        "image": "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800",
        "images": ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"],
        "description": "Premium ergonomic chair with lumbar support",
        "features": ["Adjustable Height", "Lumbar Support", "2 Year Warranty"],
        "inStock": True,
        "sku": "GI-OFF-001",
        "warranty": "2 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "name": "Study Table with Storage",
        "category": "office-study",
        "price": 12990,
        "originalPrice": 18990,
        "image": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
        "images": ["https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800"],
        "description": "Compact study table with multiple drawers",
        "features": ["Built-in Storage", "Cable Management", "5 Year Warranty"],
        "inStock": True,
        "sku": "GI-OFF-002",
        "warranty": "5 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    },
    {
        "name": "Recliner Sofa",
        "category": "living-room",
        "price": 42990,
        "originalPrice": 59990,
        "image": "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800",
        "images": ["https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800"],
        "description": "Luxury recliner with massage function",
        "features": ["Reclining Function", "Premium Leather", "3 Year Warranty"],
        "inStock": True,
        "sku": "GI-SOF-003",
        "warranty": "3 Years",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
]

# Testimonials data
testimonials = [
    {
        "name": "Rajesh Kumar",
        "location": "Dehradun",
        "rating": 5,
        "comment": "Excellent quality furniture and amazing service! The team helped me design my entire living room. Highly recommended!",
        "date": "2024-12-15",
        "approved": True,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Priya Sharma",
        "location": "Dehradun",
        "rating": 5,
        "comment": "Bought a complete bedroom set from Home Decor Enterprises. The quality is outstanding and delivery was on time.",
        "date": "2024-11-28",
        "approved": True,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Amit Singh",
        "location": "Mussoorie",
        "rating": 5,
        "comment": "Best furniture showroom in Dehradun! Great collection of Godrej Interio products and professional staff.",
        "date": "2024-11-10",
        "approved": True,
        "createdAt": datetime.utcnow()
    },
    {
        "name": "Neha Verma",
        "location": "Dehradun",
        "rating": 5,
        "comment": "Purchased office furniture for my workspace. The ergonomic chairs are fantastic! Worth every penny.",
        "date": "2024-10-22",
        "approved": True,
        "createdAt": datetime.utcnow()
    }
]

async def seed_database():
    """Seed the database with initial data"""
    print("🌱 Starting database seeding...")
    
    # Clear existing data
    print("\n🗑️  Clearing existing data...")
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.testimonials.delete_many({})
    
    # Insert categories
    print("\n📁 Inserting categories...")
    result = await db.categories.insert_many(categories)
    print(f"   ✓ Inserted {len(result.inserted_ids)} categories")
    
    # Insert products
    print("\n📦 Inserting products...")
    result = await db.products.insert_many(products)
    print(f"   ✓ Inserted {len(result.inserted_ids)} products")
    
    # Insert testimonials
    print("\n⭐ Inserting testimonials...")
    result = await db.testimonials.insert_many(testimonials)
    print(f"   ✓ Inserted {len(result.inserted_ids)} testimonials")
    
    print("\n✅ Database seeding completed successfully!")
    print("\n📊 Summary:")
    print(f"   - Categories: {await db.categories.count_documents({})}")
    print(f"   - Products: {await db.products.count_documents({})}")
    print(f"   - Testimonials: {await db.testimonials.count_documents({})}")
    print(f"   - Leads: {await db.leads.count_documents({})}")

if __name__ == "__main__":
    asyncio.run(seed_database())
