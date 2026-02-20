import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, CheckCircle, Phone, Mail, Package, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CartInquiriesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inquiriesData, statsData] = await Promise.all([
        axios.get(`${API}/cart/inquiries`, { params: { status: statusFilter === 'all' ? null : statusFilter } }),
        axios.get(`${API}/cart/inquiries/stats/summary`)
      ]);
      
      setInquiries(inquiriesData.data.inquiries);
      setStats(statsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch inquiries');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (inquiryId, newStatus) => {
    try {
      await axios.put(`${API}/cart/inquiries/${inquiryId}`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Cart Inquiries</h1>
          <p className="text-gray-600 mt-1">Manage customer cart submissions and inquiries</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Inquiries</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
                </div>
                <ShoppingCart className="text-gray-400" size={32} />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Pending</p>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Contacted</p>
                  <p className="text-3xl font-bold text-yellow-800 mt-2">{stats.contacted}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Completed</p>
                  <p className="text-3xl font-bold text-green-800 mt-2">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {['all', 'pending', 'contacted', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading inquiries...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No inquiries found</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {inquiries.map((inquiry) => (
                <div key={inquiry._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{inquiry.customerName}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail size={14} />
                          <span>{inquiry.customerEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone size={14} />
                          <span>{inquiry.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        inquiry.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                        inquiry.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                        inquiry.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inquiry.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Package size={16} />
                      Cart Items ({inquiry.items.length})
                    </h4>
                    <div className="space-y-2">
                      {inquiry.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img src={item.image} alt={item.productName} className="w-12 h-12 object-cover rounded" />
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{item.productName}</p>
                              <p className="text-gray-600">Qty: {item.quantity}</p>
                            </div>
                          </div>
                          <p className="font-semibold text-gray-800">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-3 pt-3 flex justify-between">
                      <span className="font-semibold text-gray-800">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{inquiry.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {inquiry.message && (
                    <div className="mb-4 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Message:</strong> {inquiry.message}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <select
                      value={inquiry.status}
                      onChange={(e) => updateStatus(inquiry._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Button
                      onClick={() => setSelectedInquiry(inquiry)}
                      variant="outline"
                      className="text-sm"
                    >
                      View Full Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartInquiriesPage;
