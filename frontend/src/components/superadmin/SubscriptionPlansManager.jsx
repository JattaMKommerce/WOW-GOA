import React, { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Edit2, Trash2, Check, X, Star, Users, Building,
  Hotel, Car, Package, HardDrive, ChevronDown, ChevronUp, ToggleLeft, ToggleRight
} from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

const COLORS = {
  primary: '#FF6333',
  dark: '#0D1B2E',
  success: '#16a34a',
  danger: '#dc2626',
};

function Badge({ status }) {
  const styles = {
    active: { bg: '#dcfce7', color: '#16a34a' },
    inactive: { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = styles[status] || styles.inactive;
  return (
    <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: s.bg, color: s.color, fontSize: '0.65rem', textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

const EMPTY_PLAN = {
  name: '', monthly_price: '', quarterly_price: '', yearly_price: '',
  trial_days: 0, features: [], max_hotel_vendors: 10, max_vehicle_vendors: 10,
  max_hotels: 50, max_vehicles: 100, max_packages: 20, max_bookings: 1000,
  storage_limit: 10, status: 'active'
};

function PlanFormModal({ plan, onClose, onSave }) {
  const [form, setForm] = useState(plan ? { ...plan, features: Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : []) } : { ...EMPTY_PLAN });
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
      setFeatureInput('');
    }
  };

  const removeFeature = (idx) => setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const action = form.id ? 'update_subscription_plan' : 'create_subscription_plan';
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...form })
      });
      const data = await res.json();
      if (data.success) { onSave(); onClose(); }
      else alert(data.error || 'Failed to save plan');
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.7)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={onClose}>
      <div className="rounded-4 overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', background: '#fff', margin: '0 16px' }} onClick={e => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ background: COLORS.dark, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>{form.id ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</h6>
          <button className="btn p-1 border-0 text-white-50" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Plan Name *</label>
              <input className="form-control" value={form.name} onChange={e => handleChange('name', e.target.value)} required placeholder="e.g. Professional" />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Monthly Price (₹) *</label>
              <input type="number" className="form-control" value={form.monthly_price} onChange={e => handleChange('monthly_price', e.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Quarterly Price (₹)</label>
              <input type="number" className="form-control" value={form.quarterly_price} onChange={e => handleChange('quarterly_price', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Yearly Price (₹)</label>
              <input type="number" className="form-control" value={form.yearly_price} onChange={e => handleChange('yearly_price', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Trial Days</label>
              <input type="number" className="form-control" value={form.trial_days} onChange={e => handleChange('trial_days', e.target.value)} min={0} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Status</label>
              <select className="form-select" value={form.status} onChange={e => handleChange('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Limits */}
            <div className="col-12">
              <div className="fw-bold mb-2" style={{ fontSize: '0.78rem', color: COLORS.dark, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Limits</div>
              <div className="row g-2">
                {[
                  { key: 'max_hotel_vendors', label: 'Max Hotel Vendors', icon: <Hotel size={13} /> },
                  { key: 'max_vehicle_vendors', label: 'Max Vehicle Vendors', icon: <Car size={13} /> },
                  { key: 'max_hotels', label: 'Max Hotels', icon: <Building size={13} /> },
                  { key: 'max_vehicles', label: 'Max Vehicles', icon: <Car size={13} /> },
                  { key: 'max_packages', label: 'Max Packages', icon: <Package size={13} /> },
                  { key: 'max_bookings', label: 'Max Bookings/mo', icon: <Users size={13} /> },
                  { key: 'storage_limit', label: 'Storage (GB)', icon: <HardDrive size={13} /> },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="col-6 col-md-3">
                    <label className="form-label d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', color: '#64748b' }}>{icon} {label}</label>
                    <input type="number" className="form-control form-control-sm" value={form[key]} onChange={e => handleChange(key, e.target.value)} min={0} />
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="col-12">
              <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Features Included</label>
              <div className="d-flex gap-2 mb-2">
                <input className="form-control form-control-sm" placeholder="Add a feature..." value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                <button type="button" className="btn btn-sm px-3 fw-bold text-white" style={{ background: COLORS.primary, whiteSpace: 'nowrap' }} onClick={addFeature}>Add</button>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {form.features.map((f, i) => (
                  <span key={i} className="d-flex align-items-center gap-1 px-2 py-1 rounded-pill" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem' }}>
                    {f}
                    <button type="button" className="btn p-0 border-0" style={{ color: '#7c3aed', lineHeight: 1 }} onClick={() => removeFeature(i)}><X size={12} /></button>
                  </span>
                ))}
                {form.features.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No features added yet</span>}
              </div>
            </div>

            <div className="col-12 d-flex gap-2 justify-content-end mt-2">
              <button type="button" className="btn btn-light fw-bold px-4" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn fw-bold px-5 text-white" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} disabled={saving}>
                {saving ? 'Saving...' : (form.id ? 'Update Plan' : 'Create Plan')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubscriptionPlansManager() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=subscription_plans`);
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription plan?')) return;
    await apiFetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_subscription_plan', id }) });
    load();
  };

  const handleToggle = async (plan) => {
    const newStatus = plan.status === 'active' ? 'inactive' : 'active';
    await apiFetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_subscription_plan', ...plan, features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]'), status: newStatus }) });
    load();
  };

  const BILLING_CYCLES = [
    { label: 'Monthly', key: 'monthly_price' },
    { label: 'Quarterly', key: 'quarterly_price' },
    { label: 'Yearly', key: 'yearly_price' },
  ];

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: COLORS.dark, fontSize: '16px' }}>Subscription Plans</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Create and manage platform subscription tiers for Admin accounts</p>
        </div>
        <button className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={() => { setEditPlan(null); setShowModal(true); }}>
          <Plus size={14} /> Create Plan
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: COLORS.primary }} /></div>
      ) : (
        <div className="row g-4">
          {plans.map(plan => {
            const features = Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : []);
            const isExpanded = expanded === plan.id;
            return (
              <div key={plan.id} className="col-md-6 col-xl-4">
                <div className="rounded-3 h-100" style={{ background: '#fff', border: plan.status === 'active' ? `2px solid ${COLORS.primary}22` : '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.2s ease' }}>
                  {/* Plan Header */}
                  <div className="px-4 py-3 d-flex align-items-start justify-content-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: plan.status === 'active' ? 'linear-gradient(135deg,#fff7f5,#fff)' : '#fafafa' }}>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <CreditCard size={16} style={{ color: COLORS.primary }} />
                        <span className="fw-bold" style={{ fontSize: '15px', color: COLORS.dark }}>{plan.name}</span>
                      </div>
                      <Badge status={plan.status} />
                      {plan.trial_days > 0 && (
                        <span className="ms-2 px-2 py-1 rounded-pill fw-bold" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.65rem' }}>{plan.trial_days}d Trial</span>
                      )}
                    </div>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm p-1" style={{ color: plan.status === 'active' ? '#16a34a' : '#94a3b8' }} onClick={() => handleToggle(plan)} title={plan.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {plan.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button className="btn btn-sm p-1" style={{ color: '#2563eb' }} onClick={() => { setEditPlan(plan); setShowModal(true); }}><Edit2 size={14} /></button>
                      <button className="btn btn-sm p-1" style={{ color: COLORS.danger }} onClick={() => handleDelete(plan.id)}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="d-flex gap-3">
                      {BILLING_CYCLES.filter(c => plan[c.key] > 0).map(c => (
                        <div key={c.key} className="text-center">
                          <div className="fw-bold" style={{ fontSize: c.key === 'monthly_price' ? '1.4rem' : '1.1rem', color: COLORS.dark }}>₹{Number(plan[c.key]).toLocaleString()}</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{c.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="row g-1">
                      {[
                        { label: 'Hotel Vendors', val: plan.max_hotel_vendors, icon: <Hotel size={11} /> },
                        { label: 'Vehicle Vendors', val: plan.max_vehicle_vendors, icon: <Car size={11} /> },
                        { label: 'Hotels', val: plan.max_hotels, icon: <Building size={11} /> },
                        { label: 'Vehicles', val: plan.max_vehicles, icon: <Car size={11} /> },
                        { label: 'Packages', val: plan.max_packages, icon: <Package size={11} /> },
                        { label: 'Storage', val: `${plan.storage_limit}GB`, icon: <HardDrive size={11} /> },
                      ].map(({ label, val, icon }) => (
                        <div key={label} className="col-6">
                          <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            <span style={{ color: COLORS.primary }}>{icon}</span>
                            <span className="fw-bold">{val === 999 || val === 9999 ? '∞' : val}</span> {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="px-4 py-3">
                    <button className="btn p-0 border-0 d-flex align-items-center gap-1 w-100 justify-content-between" style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }} onClick={() => setExpanded(isExpanded ? null : plan.id)}>
                      <span>{features.length} Features</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 d-flex flex-column gap-1">
                        {features.map((f, i) => (
                          <div key={i} className="d-flex align-items-center gap-2" style={{ fontSize: '0.78rem', color: '#374151' }}>
                            <Check size={12} style={{ color: COLORS.success, flexShrink: 0 }} /> {f}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {plans.length === 0 && (
            <div className="col-12">
              <div className="rounded-3 text-center p-5" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
                <CreditCard size={40} className="mb-3" style={{ color: '#94a3b8' }} />
                <h6 className="fw-bold" style={{ color: COLORS.dark }}>No Subscription Plans Yet</h6>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Create your first plan to start monetizing the platform.</p>
                <button className="btn px-4 py-2 fw-bold text-white rounded-3" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={() => { setEditPlan(null); setShowModal(true); }}>
                  <Plus size={14} className="me-1" /> Create First Plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && <PlanFormModal plan={editPlan} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
