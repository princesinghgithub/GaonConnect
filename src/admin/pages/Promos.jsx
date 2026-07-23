import React, { useEffect, useState } from 'react';
import { FaPlus, FaTrash, FaEdit, FaTag, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const API = (import.meta.env.VITE_API_URL || 'https://gaonconnect-backend.onrender.com/api');

const authHeaders = () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const VEHICLE_TYPES = ['all', 'bike', 'auto', 'car', 'tractor', 'jcb', 'tempo'];

const empty = {
  code: '', title: '', description: '', discount: '', discountType: 'flat',
  minFare: '', maxUses: '', vehicleType: 'all', validUntil: '', isActive: true,
};

export default function Promos() {
  const [promos, setPromos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(empty);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/promos`, { headers: authHeaders() });
      const data = await res.json();
      setPromos(data.data || data.promos || []);
    } catch { toast.error('Promos load nahi ho sake'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit   = (p)  => {
    setForm({
      code: p.code, title: p.title || '', description: p.description || '',
      discount: p.discount, discountType: p.discountType || 'flat',
      minFare: p.minFare || '', maxUses: p.maxUses || '',
      vehicleType: p.vehicleType || 'all',
      validUntil: p.validUntil ? p.validUntil.split('T')[0] : '',
      isActive: p.isActive !== false,
    });
    setEditId(p._id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount) { toast.error('Code aur discount required hai'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        discount: Number(form.discount),
        minFare:  form.minFare  ? Number(form.minFare)  : undefined,
        maxUses:  form.maxUses  ? Number(form.maxUses)  : undefined,
        validUntil: form.validUntil || undefined,
      };
      const url    = editId ? `${API}/admin/promos/${editId}` : `${API}/admin/promos`;
      const method = editId ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).message);
      toast.success(editId ? 'Promo update ho gaya' : 'Promo create ho gaya');
      setModal(false);
      fetchPromos();
    } catch (e) { toast.error(e.message || 'Error aaya'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Is promo ko delete karna hai?')) return;
    try {
      await fetch(`${API}/admin/promos/${id}`, { method: 'DELETE', headers: authHeaders() });
      toast.success('Deleted');
      fetchPromos();
    } catch { toast.error('Delete nahi hua'); }
  };

  const toggleActive = async (p) => {
    try {
      await fetch(`${API}/admin/promos/${p._id}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      fetchPromos();
    } catch { toast.error('Toggle nahi hua'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promo Codes</h1>
          <p className="text-sm text-gray-500 mt-1">Customer discounts aur offers manage karo</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
        >
          <FaPlus size={14} /> Naya Promo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20">
          <FaTag className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-400 font-semibold">Koi promo nahi hai abhi</p>
          <button onClick={openCreate} className="mt-4 text-orange-500 font-bold underline">+ Pehla Promo Banao</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {promos.map(p => {
            const discount = p.discountType === 'percent' ? `${p.discount}% OFF` : `₹${p.discount} OFF`;
            const expires  = p.validUntil ? new Date(p.validUntil).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry';
            return (
              <div key={p._id} className={`bg-white rounded-xl shadow-sm border-l-4 p-5 flex items-center gap-4 ${p.isActive ? 'border-orange-400' : 'border-gray-300 opacity-60'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`font-black text-lg tracking-widest ${p.isActive ? 'text-orange-500' : 'text-gray-400'}`}>{p.code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800">{p.title || discount}</p>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>💰 {discount}</span>
                    {p.minFare  && <span>Min: ₹{p.minFare}</span>}
                    {p.maxUses  && <span>Max uses: {p.maxUses}</span>}
                    {p.vehicleType && p.vehicleType !== 'all' && <span>Vehicle: {p.vehicleType}</span>}
                    <span>📅 {expires}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(p)} className="text-gray-500 hover:text-orange-500 p-2 rounded-lg hover:bg-orange-50 transition" title="Toggle active">
                    {p.isActive ? <FaToggleOn size={22} className="text-green-500" /> : <FaToggleOff size={22} />}
                  </button>
                  <button onClick={() => openEdit(p)} className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition">
                    <FaEdit size={16} />
                  </button>
                  <button onClick={() => handleDelete(p._id)} className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition">
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editId ? 'Promo Edit Karo' : 'Naya Promo Banao'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Promo Code *</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm font-mono uppercase"
                    placeholder="SAVE50"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Title</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="50 Rupay ki Chhoot"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Khaas offer sirf aaj ke liye"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Discount *</label>
                  <input
                    type="number" min="1"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="50"
                    value={form.discount}
                    onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Discount Type</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  >
                    <option value="flat">Flat (₹)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Min Fare (₹)</label>
                  <input
                    type="number" min="0"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="100"
                    value={form.minFare}
                    onChange={e => setForm(f => ({ ...f, minFare: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Max Uses</label>
                  <input
                    type="number" min="1"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="100"
                    value={form.maxUses}
                    onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Vehicle Type</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.vehicleType}
                    onChange={e => setForm(f => ({ ...f, vehicleType: e.target.value }))}
                  >
                    {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v === 'all' ? 'Sabhi Vehicles' : v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Valid Until</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.validUntil}
                    onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm font-semibold text-gray-700">Abhi se Active karo</span>
              </label>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setModal(false)} className="px-5 py-2 rounded-lg border text-gray-600 font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? 'Save ho raha hai...' : 'Save Karo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
