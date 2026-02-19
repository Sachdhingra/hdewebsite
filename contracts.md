# Home Decor Enterprises - Backend Integration Contracts

## Overview
This document outlines the integration plan between the frontend and backend, including API contracts, database schema, and CRM integration requirements.

## Current Status
✅ **Frontend Complete** - Mock data implementation with all UI components
- Homepage with hero carousel, categories, products, showrooms, testimonials
- Category pages with filtering
- Contact and showrooms pages
- Inquiry forms throughout the site

## Mock Data Currently Used (in `/app/frontend/src/data/mockData.js`)
1. **Company Information** - Static data about Home Decor Enterprises
2. **Showroom Details** - 2 Dehradun showroom locations
3. **Product Catalog** - 8 furniture products across categories
4. **Categories** - 6 main categories (Living Room, Bedroom, etc.)
5. **Testimonials** - 4 customer reviews
6. **Hero Slides** - 4 carousel slides

---

## API Contracts

### 1. Inquiry/Lead Management APIs

#### POST `/api/leads`
**Purpose:** Submit customer inquiry/lead to CRM
**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (required)",
  "message": "string (optional)",
  "productInterest": "string (optional)",
  "category": "string (optional)",
  "source": "string (website/category-page/contact-form)"
}
```
**Response:**
```json
{
  "success": true,
  "leadId": "string",
  "message": "Lead submitted successfully"
}
```

#### GET `/api/leads` (Admin Only)
**Purpose:** Retrieve all leads for admin dashboard
**Query Params:**
- `status`: all|new|contacted|converted
- `page`: number
- `limit`: number
**Response:**
```json
{
  "leads": [...],
  "total": number,
  "page": number
}
```

#### PUT `/api/leads/:id/assign`
**Purpose:** Assign lead to sales person
**Request Body:**
```json
{
  "salesPersonId": "string",
  "salesPersonName": "string"
}
```

#### PUT `/api/leads/:id/status`
**Purpose:** Update lead status
**Request Body:**
```json
{
  "status": "new|contacted|interested|converted|closed"
}
```

---

### 2. Product Management APIs

#### GET `/api/products`
**Purpose:** Get all products with filtering
**Query Params:**
- `category`: string (slug)
- `minPrice`: number
- `maxPrice`: number
- `inStock`: boolean
**Response:**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "price": number,
      "originalPrice": number,
      "image": "string (URL)",
      "description": "string",
      "features": ["string"],
      "inStock": boolean
    }
  ],
  "total": number
}
```

#### GET `/api/products/:id`
**Purpose:** Get single product details
**Response:** Single product object

#### POST `/api/products` (Admin Only)
**Purpose:** Add new product

#### PUT `/api/products/:id` (Admin Only)
**Purpose:** Update product

---

### 3. Category APIs

#### GET `/api/categories`
**Purpose:** Get all furniture categories
**Response:**
```json
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "image": "string",
      "description": "string"
    }
  ]
}
```

---

### 4. Testimonial APIs

#### GET `/api/testimonials`
**Purpose:** Get customer testimonials
**Response:**
```json
{
  "testimonials": [
    {
      "id": "string",
      "name": "string",
      "location": "string",
      "rating": number,
      "comment": "string",
      "date": "string"
    }
  ]
}
```

#### POST `/api/testimonials` (Admin Only)
**Purpose:** Add new testimonial

---

## Database Schema

### Collections Required

#### 1. `leads`
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  message: String,
  productInterest: String,
  category: String,
  source: String,
  status: String (enum: new, contacted, interested, converted, closed),
  assignedTo: {
    salesPersonId: String,
    salesPersonName: String,
    assignedAt: Date
  },
  createdAt: Date,
  updatedAt: Date,
  notes: [
    {
      note: String,
      addedBy: String,
      addedAt: Date
    }
  ]
}
```

#### 2. `products`
```javascript
{
  _id: ObjectId,
  name: String,
  category: String (slug),
  price: Number,
  originalPrice: Number,
  image: String,
  images: [String],
  description: String,
  features: [String],
  inStock: Boolean,
  sku: String,
  warranty: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. `categories`
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  image: String,
  description: String,
  order: Number,
  createdAt: Date
}
```

#### 4. `testimonials`
```javascript
{
  _id: ObjectId,
  name: String,
  location: String,
  rating: Number,
  comment: String,
  approved: Boolean,
  createdAt: Date
}
```

#### 5. `users` (Admin/Sales Team)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (enum: admin, salesperson),
  phone: String,
  createdAt: Date
}
```

---

## Frontend Changes Required for Backend Integration

### Files to Update:

1. **`/app/frontend/src/components/InquiryForm.jsx`**
   - Replace mock submission with actual API call to `POST /api/leads`
   - Add proper error handling
   - Show success/error toast messages

2. **`/app/frontend/src/pages/Home.jsx`**
   - Fetch products from `GET /api/products?featured=true`
   - Fetch testimonials from `GET /api/testimonials`
   - Fetch categories from `GET /api/categories`

3. **`/app/frontend/src/pages/CategoryPage.jsx`**
   - Fetch products by category from `GET /api/products?category={slug}`
   - Implement real-time filtering with API

4. **Create new utility file:** `/app/frontend/src/utils/api.js`
   - Centralized API calling functions
   - Error handling
   - Loading states

---

## CRM Integration Plan

### Admin Dashboard Features Needed:
1. **Lead Management Dashboard**
   - View all leads in a table
   - Filter by status (new, contacted, interested, converted)
   - Search by name, email, phone
   - Assign leads to sales team
   - Update lead status
   - Add notes to leads

2. **Product Management**
   - Add/Edit/Delete products
   - Upload product images
   - Manage inventory status

3. **Analytics**
   - Total leads by source
   - Conversion rate
   - Popular products/categories
   - Lead response time

### Authentication Required:
- JWT-based authentication for admin/sales team
- Protected routes on frontend
- Middleware on backend APIs

---

## Implementation Phases

### Phase 1: Backend API Development
- Set up MongoDB models
- Create lead management endpoints
- Create product/category endpoints
- Add testimonial endpoints

### Phase 2: Frontend-Backend Integration
- Replace mock data with API calls
- Add loading states
- Implement error handling
- Test all inquiry forms

### Phase 3: Admin Dashboard (CRM)
- Create admin login
- Build lead management UI
- Add lead assignment feature
- Implement product management

### Phase 4: Testing & Deployment
- Test all user flows
- Test CRM workflows
- Performance optimization
- Production deployment

---

## Notes
- All mock data will be seeded to MongoDB during backend setup
- Image uploads will be handled via file upload to server (can use cloud storage later)
- Email notifications can be added for new leads
- WhatsApp integration can be added for instant notifications
