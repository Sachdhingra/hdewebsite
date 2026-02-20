# CSV Bulk Upload Feature - Complete Documentation

## ✅ Feature Implemented Successfully!

### 📊 **CSV Upload Admin Panel**
**URL:** https://interio-crm-connect.preview.emergentagent.com/admin/csv-upload

---

## 🎯 What Has Been Built

### **3 Upload Types Available:**

#### 1. **Products Upload**
Upload furniture products in bulk via CSV file.

**Required Columns:**
- `name` - Product name
- `category` - Category slug (e.g., "living-room", "bedroom")
- `price` - Current price (number)
- `originalPrice` - Original price before discount (number)
- `description` - Product description

**Optional Columns:**
- `image` - Main product image URL
- `images` - Comma-separated image URLs
- `features` - Comma-separated features (e.g., "Premium Fabric,5 Year Warranty")
- `inStock` - TRUE or FALSE
- `sku` - Product SKU code
- `warranty` - Warranty period

**CSV Example:**
```csv
name,category,price,originalPrice,image,description,features,inStock,sku,warranty
"Premium Sofa Set","living-room",45990,65990,"https://example.com/sofa.jpg","Comfortable 3-seater","Premium Fabric,5 Year Warranty",TRUE,"SOF-001","5 Years"
```

---

#### 2. **Categories Upload**
Upload product categories via CSV file.

**Required Columns:**
- `name` - Category name
- `slug` - URL-friendly slug (e.g., "living-room")
- `description` - Category description

**Optional Columns:**
- `image` - Category image URL
- `order` - Display order (number, lower appears first)

**CSV Example:**
```csv
name,slug,image,description,order
"Living Room","living-room","https://example.com/living.jpg","Transform your living space",1
"Bedroom","bedroom","https://example.com/bedroom.jpg","Create perfect sanctuary",2
```

---

#### 3. **Leads Upload**
Upload customer leads/inquiries via CSV file.

**Required Columns:**
- `name` - Customer name
- `email` - Email address
- `phone` - Phone number with country code

**Optional Columns:**
- `message` - Customer message/inquiry
- `category` - Product category of interest
- `source` - Lead source (defaults to "csv_upload")

**CSV Example:**
```csv
name,email,phone,message,category,source
"John Doe","john@example.com","+91 9999999999","Interested in sofas","Living Room","csv_upload"
```

---

## 🚀 Features Included

### **Upload Features:**
✅ **File Upload** - Drag-and-drop or click to upload CSV files
✅ **Validation** - Automatic validation of required columns
✅ **Error Reporting** - Detailed error messages for each row
✅ **Success Count** - Shows number of records inserted
✅ **Bulk Processing** - Upload hundreds of records at once

### **Template Features:**
✅ **Download Templates** - Pre-formatted CSV templates for each type
✅ **Sample Data** - Templates include example data
✅ **Format Guide** - CSV format examples shown on page

### **Management Features:**
✅ **Clear Data** - Delete all records of a type (with confirmation)
✅ **Tab Navigation** - Easy switching between Products, Categories, Leads
✅ **Instructions** - Detailed upload instructions for each type
✅ **Real-time Feedback** - Instant upload results and error messages

---

## 📡 API Endpoints Created

### **Upload Endpoints:**
- `POST /api/csv/products/upload` - Upload products CSV
- `POST /api/csv/categories/upload` - Upload categories CSV
- `POST /api/csv/leads/upload` - Upload leads CSV

### **Template Download Endpoints:**
- `GET /api/csv/products/template` - Download products template
- `GET /api/csv/categories/template` - Download categories template
- `GET /api/csv/leads/template` - Download leads template

### **Management Endpoints:**
- `DELETE /api/csv/products/clear` - Clear all products
- `DELETE /api/csv/categories/clear` - Clear all categories

---

## 🎨 UI Features

### **Page Layout:**
- Clean, professional admin interface
- Tabbed navigation for different upload types
- Color-coded sections (blue for instructions, green for success, red for errors)
- Responsive design works on all devices

### **Instructions Panel:**
- Required columns list
- Optional columns list
- Important notes and guidelines
- Format examples

### **Action Buttons:**
- 🟢 **Download Template** - Get CSV template
- 🔴 **Upload CSV File** - Upload your CSV
- 🗑️ **Clear All** - Delete all records (with confirmation)

### **Results Display:**
- Success message with count
- Error list for failed rows
- CSV format example
- Visual feedback with colors

---

## 💡 How to Use

### **Step 1: Download Template**
1. Go to: https://interio-crm-connect.preview.emergentagent.com/admin/csv-upload
2. Select tab (Products/Categories/Leads)
3. Click "Download Template"
4. Open in Excel/Google Sheets

### **Step 2: Fill Template**
1. Replace sample data with your real data
2. Follow the format exactly
3. Keep required columns
4. Add optional columns as needed

### **Step 3: Upload CSV**
1. Click "Upload CSV File"
2. Select your filled CSV
3. Wait for processing
4. Check results for any errors

### **Step 4: Verify Data**
1. Go to main website to see products
2. Check categories are showing
3. View leads in CRM dashboard

---

## 🔧 Technical Details

### **Backend:**
- FastAPI with file upload support
- Pandas for CSV parsing
- MongoDB for data storage
- Validation and error handling

### **Frontend:**
- React with file input
- Axios for API calls
- Toast notifications for feedback
- Tab-based navigation

### **Validation:**
- Required columns checked
- Data type validation
- Unique constraint checks (e.g., category slug)
- Row-by-row error reporting

---

## 📋 Example Use Cases

### **Initial Setup:**
Upload all your products at once instead of adding one by one.

### **Bulk Updates:**
Export current data, modify in Excel, re-upload to update.

### **Data Migration:**
Move data from old system to new website via CSV.

### **Lead Import:**
Import leads from Instagram, Facebook, or other sources.

### **Category Management:**
Add multiple categories at once with proper ordering.

---

## ⚠️ Important Notes

1. **CSV Format:** Must be proper CSV format (not Excel .xlsx)
2. **Column Names:** Must match exactly (case-sensitive)
3. **Slugs:** Category slugs must match in products upload
4. **Images:** Use full URLs (https://...)
5. **Comma-Separated:** For features and images, use commas
6. **Boolean Values:** Use TRUE/FALSE (not 1/0)
7. **Backup:** Always backup before using "Clear All"

---

## 🎯 Quick Access Links

- **CSV Upload Page:** `/admin/csv-upload`
- **CRM Dashboard:** `/admin/dashboard` (has link to CSV upload)
- **Main Website:** `/`

---

## ✨ Benefits

✅ **Save Time:** Upload 100+ products in minutes
✅ **Easy Updates:** Bulk edit in Excel, then upload
✅ **No Coding:** Non-technical staff can manage data
✅ **Error Detection:** Know exactly what went wrong
✅ **Templates:** Pre-formatted files to start with
✅ **Flexible:** Add optional fields as needed

---

## 🔄 Workflow Example

```
1. Download template → 2. Fill in Excel → 3. Save as CSV → 4. Upload
                                                              ↓
                                                    5. Check results
                                                              ↓
                                              6. View on website
```

---

**Status: FULLY FUNCTIONAL** ✅

All CSV upload features are working and ready to use!
