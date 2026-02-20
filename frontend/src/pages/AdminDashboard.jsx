import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeads, getLeadStats, updateLeadStatus, assignLead } from '../utils/api';
import { toast } from 'sonner';
import { Users, Mail, Phone, Calendar, Filter, Upload } from 'lucide-react';
import { Button } from '../components/ui/button';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [statusFilter, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsData, statsData] = await Promise.all([
        getLeads({ status: statusFilter, page: currentPage, limit: 20 }),
        getLeadStats()
      ]);
      setLeads(leadsData.leads);
      setTotalPages(leadsData.pages || 1);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      toast.success('Lead status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      interested: 'bg-purple-100 text-purple-800',
      converted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.new;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">CRM Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage leads and track conversions</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => navigate('/admin/cart-inquiries')}
                className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2"
              >
                <ShoppingCart size={18} />
                Cart Inquiries
              </Button>
              <Button
                onClick={() => navigate('/admin/products')}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
              >
                <Package size={18} />
                Edit Products
              </Button>
              <Button
                onClick={() => navigate('/admin/csv-upload')}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
              >
                <Upload size={18} />
                CSV Upload
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
                </div>
                <Users className="text-gray-400" size={32} />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">New</p>
                  <p className="text-3xl font-bold text-blue-800 mt-2">{stats.new}</p>
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
            <div className="bg-purple-50 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Interested</p>
                  <p className="text-3xl font-bold text-purple-800 mt-2">{stats.interested}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Converted</p>
                  <p className="text-3xl font-bold text-green-800 mt-2">{stats.converted}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">{stats.conversionRate}% rate</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-600" />
            <div className="flex gap-2 flex-wrap">
              {['all', 'new', 'contacted', 'interested', 'converted', 'closed'].map((status) => (
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
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No leads found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{lead.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} />
                            <span>{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={14} />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {lead.category || lead.productInterest || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {lead.message || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="interested">Interested</option>
                          <option value="converted">Converted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
