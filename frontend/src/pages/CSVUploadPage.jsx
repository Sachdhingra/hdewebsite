import React, { useState } from 'react';
import { Upload, Download, Trash2, FileText, Package, Folder, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CSVUploadPage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const tabs = [
    { id: 'products', name: 'Products', icon: Package },
    { id: 'categories', name: 'Categories', icon: Folder },
    { id: 'leads', name: 'Leads', icon: Users }
  ];

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/csv/${type}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadResult(response.data);
      
      if (response.data.success) {
        toast.success(response.data.message, {
          description: response.data.errors ? 'Some rows had errors' : 'All data uploaded successfully'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error.response?.data?.detail || 'Please check your CSV format'
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = async (type) => {
    try {
      const response = await axios.get(`${API}/csv/${type}/template`);
      
      if (response.data.success) {
        // Create a blob and download
        const blob = new Blob([response.data.template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('Template downloaded');
      }
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const clearData = async (type) => {
    if (!window.confirm(`Are you sure you want to delete ALL ${type}? This cannot be undone!`)) {
      return;
    }

    try {
      const response = await axios.delete(`${API}/csv/${type}/clear`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setUploadResult(null);
      }
    } catch (error) {
      console.error('Clear error:', error);
      toast.error('Failed to clear data');
    }
  };

  const getInstructions = (type) => {
    const instructions = {
      products: {
        title: 'Products CSV Upload',
        description: 'Upload products in bulk via CSV file',
        required: ['name', 'category', 'price', 'originalPrice', 'description'],
        optional: ['image', 'images', 'features', 'inStock', 'sku', 'warranty'],
        notes: [
          'Category should match existing category slugs (e.g., "living-room", "bedroom")',
          'Features should be comma-separated (e.g., "Premium Fabric,5 Year Warranty")',
          'Images should be comma-separated URLs',
          'Price and originalPrice should be numbers',
          'inStock should be TRUE or FALSE'
        ]
      },
      categories: {
        title: 'Categories CSV Upload',
        description: 'Upload product categories via CSV file',
        required: ['name', 'slug', 'description'],
        optional: ['image', 'order'],
        notes: [
          'Slug should be lowercase with hyphens (e.g., "living-room")',
          'Slug must be unique',
          'Order should be a number (lower numbers appear first)',
          'Image should be a valid URL'
        ]
      },
      leads: {
        title: 'Leads CSV Upload',
        description: 'Upload customer leads via CSV file',
        required: ['name', 'email', 'phone'],
        optional: ['message', 'category', 'source'],
        notes: [
          'Email should be valid format',
          'Phone should include country code',
          'Source will default to "csv_upload" if not provided',
          'All leads will have status "new" initially'
        ]
      }
    };

    return instructions[type];
  };

  const currentInstructions = getInstructions(activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">CSV Data Upload</h1>
          <p className="text-gray-600 mt-1">Bulk upload data using CSV files</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-4 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setUploadResult(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-500'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                {currentInstructions.title}
              </h3>
              <p className="text-blue-800 mb-4">{currentInstructions.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Required Columns:</h4>
                  <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                    {currentInstructions.required.map((col) => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Optional Columns:</h4>
                  <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                    {currentInstructions.optional.map((col) => (
                      <li key={col}>{col}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Important Notes:</h4>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                  {currentInstructions.notes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-6">
              <Button
                onClick={() => downloadTemplate(activeTab)}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
              >
                <Download size={18} />
                Download Template
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFileUpload(e, activeTab)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                  id="csv-file-input"
                />
                <Button
                  disabled={uploading}
                  className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 pointer-events-none"
                >
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Upload CSV File'}
                </Button>
              </div>

              <Button
                onClick={() => clearData(activeTab)}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 size={18} />
                Clear All {activeTab}
              </Button>
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className={`rounded-lg p-6 border ${
                uploadResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  uploadResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  Upload Results
                </h4>
                <p className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
                  {uploadResult.message}
                </p>
                
                {uploadResult.inserted > 0 && (
                  <div className="mt-2 text-green-800">
                    <strong>Inserted:</strong> {uploadResult.inserted} records
                  </div>
                )}

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-red-900 mb-2">Errors:</h5>
                    <ul className="list-disc list-inside text-red-800 text-sm space-y-1 max-h-40 overflow-y-auto">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CSV Format Example */}
            <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={20} />
                CSV Format Example
              </h4>
              <div className="bg-white p-4 rounded border border-gray-300 overflow-x-auto">
                <pre className="text-xs text-gray-700">
{activeTab === 'products' && `name,category,price,originalPrice,image,description,features,inStock,sku,warranty
"Premium Sofa Set","living-room",45990,65990,"https://example.com/sofa.jpg","Comfortable 3-seater","Premium Fabric,5 Year Warranty",TRUE,"SOF-001","5 Years"
"King Size Bed","bedroom",32990,45990,"https://example.com/bed.jpg","Elegant bed with storage","Storage,Premium Wood",TRUE,"BED-001","10 Years"`}

{activeTab === 'categories' && `name,slug,image,description,order
"Living Room","living-room","https://example.com/living.jpg","Transform your living space",1
"Bedroom","bedroom","https://example.com/bedroom.jpg","Create perfect sanctuary",2`}

{activeTab === 'leads' && `name,email,phone,message,category,source
"John Doe","john@example.com","+91 9999999999","Interested in sofas","Living Room","csv_upload"
"Jane Smith","jane@example.com","+91 8888888888","Looking for beds","Bedroom","csv_upload"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVUploadPage;
