# Home Decor Enterprises - Godrej Interio Partner Website

## Project Overview
A website clone of interio.com for Home Decor Enterprises, a Godrej Interio channel partner since 2006. The site focuses on lead generation and inquiry capture, not direct e-commerce.

## Core Requirements
1. **Website Objective:** Generate traffic and capture inquiries/leads
2. **CRM Dashboard:** Admin dashboard to view and manage leads
3. **Lead Management:** Ability to assign leads to salespeople
4. **Mega Menu Navigation:** Sub-category dropdowns like interio.com
5. **Inquiry Cart:** Add products to cart for inquiry (not purchase)
6. **Admin Features:** Product editing, CSV bulk upload
7. **Store Information:** Display showroom locations
8. **Branding:** Home Decor Enterprises logo, Godrej Interio style

## What's Been Implemented

### December 2024

#### Frontend (React)
- ✅ Homepage with hero carousel, category grid, featured products
- ✅ Category pages with price filtering
- ✅ **Product Detail Page** with:
  - Image gallery with thumbnails
  - Price display (current + original with discount)
  - "Add to Inquiry Cart" button
  - "Talk to Expert" button (WhatsApp integration)
  - "Visit Store" button
  - Features and warranty badges
  - Trust badges (Free Delivery, Warranty, Genuine Product)
- ✅ **Lead Capture Popup** - Email/phone collection on first visit
- ✅ Mega menu navigation
- ✅ Inquiry cart system
- ✅ Admin Dashboard with lead management
- ✅ **CSV Upload Page** with:
  - Drag & drop file upload
  - Auto-category detection from filename
  - Category management sidebar
  - Product count per category

#### Backend (FastAPI)
- ✅ Products API (CRUD operations)
- ✅ Categories API
- ✅ Leads API
- ✅ Cart/Inquiries API
- ✅ **CSV Upload API** supporting Interio-scraped format:
  - Auto-detect category from filename (BEDROOM.csv → Bedroom)
  - Handle multiple image columns
  - Parse price formats (₹20,990.00)
  - Extract features and warranty info
  - Duplicate handling (update existing products)

#### Data Uploaded
- Work Chairs: 66 products
- Bedroom: 64 products
- Living Room: 4 products
- Office Study: 2 products
- Dining Room: 1 product

## Technical Stack
- **Frontend:** React, TailwindCSS, Shadcn UI, React Router
- **Backend:** FastAPI, Motor (async MongoDB driver)
- **Database:** MongoDB
- **Data Processing:** Pandas for CSV handling

## Key Files
- `/app/frontend/src/pages/ProductDetailPage.jsx` - Product detail with all CTAs
- `/app/frontend/src/components/LeadCapturePopup.jsx` - Email/phone capture
- `/app/frontend/src/pages/CSVUploadPage.jsx` - Admin bulk upload
- `/app/backend/routes/csv_upload.py` - CSV processing API
- `/app/frontend/src/context/CartContext.jsx` - Cart state management

## API Endpoints
- `GET /api/products` - List products with filters
- `GET /api/products/{id}` - Product details
- `POST /api/csv/upload/interio` - Upload Interio-format CSV
- `GET /api/csv/categories/list` - List categories with counts
- `DELETE /api/csv/products/category/{slug}` - Clear category products
- `POST /api/leads` - Submit lead
- `POST /api/cart/inquiries` - Submit cart inquiry

## Pending Tasks (P1)
1. Store Locations page with Dehradun showroom addresses
2. Admin Cart Inquiries page implementation
3. Admin Product Edit page implementation

## Future Tasks (P2)
1. AI Chatbot with multi-language support (Hindi, North Indian languages)
2. Instagram lead capture integration
3. User authentication for admin

## CSV Format Supported
```
name, category, price, originalprice, image, image.1, image.2, description, features, inStock, sku, warranty, price-discount-text
```

Products are auto-categorized based on filename (e.g., "BEDROOM.csv" → "bedroom" category).
