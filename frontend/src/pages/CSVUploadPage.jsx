import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Trash2, 
  FileText, 
  Package, 
  Folder, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  X,
  CloudUpload
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CSVUploadPage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [categoryOverride, setCategoryOverride] = useState('');

  // Load existing categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await axios.get(`${API}/csv/categories/list`);
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        // Auto-extract category from filename
        const categoryName = file.name.replace('.csv', '').toLowerCase().replace(/[\s_]+/g, '-');
        setCategoryOverride('');
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setCategoryOverride('');
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (categoryOverride) {
      formData.append('category_override', categoryOverride);
    }

    try {
      const response = await axios.post(`${API}/csv/upload/interio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
      
      if (response.data.success) {
        toast.success(`${response.data.total_processed} products uploaded to "${response.data.category.name}"`, {
          description: response.data.total_errors > 0 ? `${response.data.total_errors} rows had errors` : 'All data uploaded successfully'
        });
        loadCategories();
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error.response?.data?.detail || 'Please check your CSV format'
      });
      setUploadResult({
        success: false,
        message: error.response?.data?.detail || 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  };

  const clearCategoryProducts = async (categorySlug, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete all products in "${categoryName}"? This cannot be undone!`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/csv/products/category/${categorySlug}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        loadCategories();
      }
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Failed to clear category products');
    }
  };

  const clearAllProducts = async () => {
    if (!window.confirm('Are you sure you want to delete ALL products from ALL categories? This cannot be undone!')) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/csv/products/clear`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        loadCategories();
      }
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Failed to clear products');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Product CSV Upload</h1>
              <p className="text-gray-600 mt-1">Upload products from Interio-format CSV files</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CloudUpload className="text-red-500" />
                Upload CSV File
              </h2>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Category from filename:</strong> "BEDROOM.csv" → Bedroom category</li>
                  <li>• <strong>Supported format:</strong> Interio scraped CSV with columns like name, price, originalprice, image, features, etc.</li>
                  <li>• <strong>Duplicate handling:</strong> Products with same name in same category will be updated</li>
                  <li>• Category is auto-created if it doesn't exist</li>
                </ul>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-red-500 bg-red-50' 
                    : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={uploading}
                  data-testid="csv-file-input"
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle size={48} className="text-green-500 mb-4" />
                    <p className="text-lg font-semibold text-gray-800">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Category: <strong>{categoryOverride || selectedFile.name.replace('.csv', '').replace(/[\s_]+/g, '-').toLowerCase()}</strong>
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setCategoryOverride('');
                      }}
                      className="mt-3 text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <X size={16} /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload size={48} className="text-gray-400 mb-4" />
                    <p className="text-lg font-semibold text-gray-800">
                      Drag & drop your CSV file here
                    </p>
                    <p className="text-gray-600 mt-1">or click to browse</p>
                    <p className="text-sm text-gray-500 mt-4">
                      Supported: BEDROOM.csv, LIVING_ROOM.csv, work chairs.csv, etc.
                    </p>
                  </div>
                )}
              </div>

              {/* Category Override */}
              {selectedFile && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Override Category (optional)
                  </label>
                  <Input
                    type="text"
                    value={categoryOverride}
                    onChange={(e) => setCategoryOverride(e.target.value)}
                    placeholder="Leave empty to use filename as category"
                    className="max-w-md"
                  />
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-6 flex gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg"
                  data-testid="upload-btn"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="mr-2" />
                      Upload Products
                    </>
                  )}
                </Button>
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className={`mt-6 rounded-lg p-6 border ${
                  uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                    ) : (
                      <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        uploadResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                      </h4>
                      <p className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
                        {uploadResult.message}
                      </p>
                      
                      {uploadResult.success && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white rounded p-3">
                            <p className="text-gray-600">New Products</p>
                            <p className="text-2xl font-bold text-green-600">{uploadResult.inserted}</p>
                          </div>
                          <div className="bg-white rounded p-3">
                            <p className="text-gray-600">Updated Products</p>
                            <p className="text-2xl font-bold text-blue-600">{uploadResult.updated}</p>
                          </div>
                        </div>
                      )}

                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-orange-900 mb-2">
                            Errors ({uploadResult.total_errors}):
                          </h5>
                          <ul className="list-disc list-inside text-orange-800 text-sm space-y-1 max-h-32 overflow-y-auto bg-white rounded p-3">
                            {uploadResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CSV Format Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="text-gray-600" />
                Expected CSV Format (Interio Scraped)
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-semibold">Column</th>
                      <th className="text-left py-2 pr-4 font-semibold">Example</th>
                      <th className="text-left py-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="py-2 pr-4"><code>name</code></td>
                      <td className="py-2 pr-4">Hannah King Size Bed</td>
                      <td className="py-2">Product name (required)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><code>category</code></td>
                      <td className="py-2 pr-4">BEDROOM</td>
                      <td className="py-2">Auto-detected from filename</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><code>price</code></td>
                      <td className="py-2 pr-4">₹20,990.00</td>
                      <td className="py-2">Current price</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><code>originalprice</code></td>
                      <td className="py-2 pr-4">₹32,607.00</td>
                      <td className="py-2">Original/MRP price</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><code>image</code></td>
                      <td className="py-2 pr-4">https://interio.com/media/...</td>
                      <td className="py-2">Multiple columns supported</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><code>features</code></td>
                      <td className="py-2 pr-4">1-Year Warranty, Cola-Rain</td>
                      <td className="py-2">Comma-separated</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4"><code>warranty</code></td>
                      <td className="py-2 pr-4">1 Year Warranty</td>
                      <td className="py-2">Warranty info</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><code>price-discount-text</code></td>
                      <td className="py-2 pr-4">36% off</td>
                      <td className="py-2">Discount badge</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Categories Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Folder className="text-red-500" />
                  Categories
                </h2>
                <button
                  onClick={loadCategories}
                  className="text-gray-500 hover:text-gray-700"
                  title="Refresh"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              {loadingCategories ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No products uploaded yet</p>
                  <p className="text-sm">Upload a CSV to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.slug}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{cat.name}</p>
                        <p className="text-sm text-gray-500">{cat.productCount} products</p>
                      </div>
                      <button
                        onClick={() => clearCategoryProducts(cat.slug, cat.name)}
                        className="text-red-500 hover:text-red-600 p-1"
                        title="Delete all products in this category"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Products:</span>
                      <span className="font-bold text-gray-800">
                        {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
                      </span>
                    </div>
                  </div>

                  {/* Clear All */}
                  <Button
                    onClick={clearAllProducts}
                    variant="destructive"
                    className="w-full mt-4"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Clear All Products
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  to="/admin/products"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  Edit Products
                </Link>
                <Link
                  to="/admin/dashboard"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  Admin Dashboard
                </Link>
                <Link
                  to="/products"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                >
                  View All Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUploadPage;
