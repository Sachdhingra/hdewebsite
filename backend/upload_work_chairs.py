"""
Script to upload work chairs data from CSV to database.
This transforms the scraped CSV format into our product schema.
"""
import asyncio
import pandas as pd
import re
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'interio_clone')

def parse_price(price_str):
    """Convert price string like '?4,990' or '?1,03,290' to float"""
    if pd.isna(price_str) or not price_str:
        return 0.0
    # Remove currency symbol and commas
    clean_price = re.sub(r'[^\d.]', '', str(price_str).replace(',', ''))
    try:
        return float(clean_price) if clean_price else 0.0
    except ValueError:
        return 0.0

def extract_color_from_name(name):
    """Extract color information from product name"""
    # Common colors in the dataset
    colors = ['Black Ink', 'Black', 'Milan Red', 'Royal Blue', 'Earthstone', 
              'Saddle Brown', 'Blue', 'Green', 'Red', 'Yellow', 'Tan', 
              'Ruben Blue', 'Ash Grey', 'Choco Tan', 'Rosso Red', 'Dark Grey',
              'Azure Blue', 'Indian Red Chilli', 'Dark Tan', 'White']
    
    for color in colors:
        if color.lower() in name.lower():
            return color
    return None

def extract_features(data_field, price3_field=None):
    """Extract features from the data column"""
    features = []
    if pd.notna(data_field) and data_field:
        # Split by comma and clean
        parts = [p.strip() for p in str(data_field).split(',')]
        for part in parts:
            if part and not part.startswith('Login') and not part.startswith('Sign up'):
                features.append(part)
    
    # Add discount info if available
    if pd.notna(price3_field) and price3_field and 'off' in str(price3_field).lower():
        features.append(str(price3_field).strip())
    
    return features

def collect_images(row):
    """Collect all valid image URLs from the row"""
    images = []
    image_cols = ['image', 'image2', 'image3', 'image4', 'image5']
    
    for col in image_cols:
        if col in row and pd.notna(row[col]):
            img_url = str(row[col]).strip()
            # Only include product images, not swatch images
            if img_url.startswith('http') and 'swatch' not in img_url.lower():
                images.append(img_url)
    
    return images

async def upload_work_chairs():
    """Main function to upload work chairs data"""
    
    # Read CSV from URL
    csv_url = "https://customer-assets.emergentagent.com/job_a91e110a-0ee3-4c78-a498-1379a34205ed/artifacts/gsjpfkdh_work%20chairs.csv"
    
    print(f"Reading CSV from: {csv_url}")
    df = pd.read_csv(csv_url)
    print(f"Found {len(df)} rows in CSV")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    # Ensure the category exists
    category_slug = "work-chairs"
    existing_category = await db.categories.find_one({"slug": category_slug})
    
    if not existing_category:
        await db.categories.insert_one({
            "name": "Work Chairs",
            "slug": category_slug,
            "parentCategory": "office-and-study",
            "description": "Ergonomic work chairs for your office and study",
            "image": "https://interio.com/media/catalog/product/cache/f623d8be2b9a8a3e338dce51ea67d03c/5/6/56101522sd04905_01_413x440.jpg",
            "order": 10,
            "createdAt": datetime.utcnow()
        })
        print("Created 'Work Chairs' category")
    
    # Clear existing work chairs products
    deleted = await db.products.delete_many({"category": category_slug})
    print(f"Cleared {deleted.deleted_count} existing work chairs")
    
    # Process and insert products
    products_inserted = 0
    errors = []
    seen_names = set()  # To avoid duplicates
    
    for index, row in df.iterrows():
        try:
            name = str(row['name']).strip()
            
            # Skip duplicates
            if name in seen_names:
                continue
            seen_names.add(name)
            
            # Parse prices
            price = parse_price(row.get('price', '0'))
            original_price = parse_price(row.get('price2', row.get('price', '0')))
            
            # If original price is less than price, swap them
            if original_price < price:
                original_price = price
            
            # Extract features
            features = extract_features(row.get('data', ''), row.get('price3'))
            
            # Add color variants as features if available
            color_cols = ['data3', 'data4', 'data5']
            available_colors = []
            for col in color_cols:
                if col in row and pd.notna(row[col]):
                    color_val = str(row[col]).strip()
                    if color_val and color_val not in ['Login', 'Sign up', 'or', '']:
                        available_colors.append(color_val)
            
            if available_colors:
                features.append(f"Available Colors: {', '.join(available_colors)}")
            
            # Collect images
            images = collect_images(row)
            primary_image = images[0] if images else ""
            
            # Get rating if available
            rating = None
            if 'rating' in row and pd.notna(row['rating']):
                try:
                    rating = float(row['rating'])
                except:
                    pass
            
            # Build description
            description_parts = [name]
            if features:
                description_parts.append("Features: " + ", ".join(features[:3]))
            if rating:
                description_parts.append(f"Rating: {rating}/5")
            
            description = ". ".join(description_parts)
            
            # Extract warranty from features
            warranty = ""
            for feature in features:
                if "warranty" in feature.lower():
                    warranty = feature
                    break
            
            product_data = {
                'name': name,
                'category': category_slug,
                'price': price,
                'originalPrice': original_price,
                'image': primary_image,
                'images': images,
                'description': description,
                'features': features,
                'inStock': True,
                'sku': f"WC-{index+1:04d}",
                'warranty': warranty,
                'rating': rating,
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            await db.products.insert_one(product_data)
            products_inserted += 1
            
        except Exception as e:
            errors.append(f"Row {index + 2}: {str(e)}")
            print(f"Error processing row {index + 2}: {e}")
    
    print(f"\n=== Upload Complete ===")
    print(f"Products inserted: {products_inserted}")
    if errors:
        print(f"Errors: {len(errors)}")
        for err in errors[:5]:
            print(f"  - {err}")
    
    client.close()
    return products_inserted, errors

if __name__ == "__main__":
    asyncio.run(upload_work_chairs())
