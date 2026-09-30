import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import SalesLinkBox from '../components/SalesLinkBox';
import { getSalespeople, createSalesperson, updateSalesperson } from '../utils/api';

const SalespeoplePage = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', code: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setPeople(await getSalespeople());
    } catch (error) {
      console.error('Error fetching salespeople:', error);
      toast.error('Failed to fetch salespeople');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Enter the salesperson\'s name');
      return;
    }
    try {
      setSaving(true);
      const { salesperson } = await createSalesperson({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        code: form.code.trim() || null
      });
      toast.success(`${salesperson.name} added. Their link is ready to share.`);
      setForm({ name: '', phone: '', code: '' });
      load();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add salesperson');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (sp) => {
    try {
      await updateSalesperson(sp._id, { active: !sp.active });
      toast.success(sp.active ? `${sp.name}'s link switched off` : `${sp.name}'s link switched on`);
      load();
    } catch (error) {
      toast.error('Failed to update salesperson');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Salespeople</h1>
            <p className="text-gray-600 mt-1">
              Each salesperson has their own website link. Enquiries from a link go straight to that salesperson.
            </p>
          </div>
          <Button onClick={() => navigate('/admin/dashboard')} variant="outline" className="flex items-center gap-2">
            <ArrowLeft size={18} />
            CRM Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <form onSubmit={add} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserPlus size={20} /> Add a salesperson
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <label className="text-sm text-gray-700">
              Name
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
              />
            </label>
            <label className="text-sm text-gray-700">
              Mobile <span className="text-gray-400">(optional)</span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="98765 43210"
              />
            </label>
            <label className="text-sm text-gray-700">
              Link code <span className="text-gray-400">(optional)</span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="made from the name"
              />
            </label>
            <Button type="submit" disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
              {saving ? 'Adding...' : 'Add and create link'}
            </Button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading salespeople...</div>
          ) : people.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No salespeople yet. Add one above to create their link.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {people.map((sp) => (
                <li key={sp._id} className={`p-6 ${sp.active ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {sp.name}
                        {!sp.active && <span className="ml-2 text-xs font-normal text-gray-500">(link switched off)</span>}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sp.phone ? `${sp.phone} · ` : ''}
                        {sp.leadCount} {sp.leadCount === 1 ? 'lead' : 'leads'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/admin/salespeople/${sp.code}`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                      >
                        <Users size={16} />
                        Their leads
                      </Button>
                      <Button onClick={() => toggleActive(sp)} variant="outline">
                        {sp.active ? 'Switch link off' : 'Switch link on'}
                      </Button>
                    </div>
                  </div>
                  <SalesLinkBox salesperson={sp} compact />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalespeoplePage;
