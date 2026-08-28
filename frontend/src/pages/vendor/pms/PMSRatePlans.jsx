import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import * as api from '../../../services/api';

const PLAN_TYPES = ['Standard', 'Breakfast Included', 'Half Board', 'Full Board', 'Non-Refundable', 'Early Bird', 'Last Minute', 'Long Stay', 'Weekend Special', 'Corporate'];

function RatePlanModal({ hotels, roomTypes, vendorId, plan, onSave, onClose }) {
  const [form, setForm] = useState(plan || {
    hotel_id: hotels[0]?.id || '', room_type_id: '', name: '', plan_type: 'Standard',
    price: '', discount_type: 'None', discount_value: '', min_stay: 1, max_stay: 30,
    min_advance_days: 0, valid_from: '', valid_to: '',
    cancellation_policy: '', is_refundable: true, status: 'Active'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hotelRoomTypes = roomTypes.filter(rt => rt.hotel_id === form.hotel_id);

  const handleSave = async () => {
    if (!form.name || !form.price) { setError('Rate plan name and price are required'); return; }
    setSaving(true); setError('');
    try {
      if (plan?.id) await api.pmsUpdateRatePlan({ ...form, id: plan.id, vendor_id: vendorId });
      else await api.pmsCreateRatePlan({ ...form, vendor_id: vendorId });
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="bg-white rounded-4 shadow-lg overflow-auto" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">{plan ? 'Edit' : 'Create'} Rate Plan</h5>
          <button onClick={onClose} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
        </div>
        <div className="p-4">
          {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}><AlertCircle size={13} className="me-1" />{error}</div>}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Hotel *</label>
              <select className="form-select form-select-sm" value={form.hotel_id} onChange={e => { set('hotel_id', e.target.value); set('room_type_id', ''); }}>
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Room Type (optional)</label>
              <select className="form-select form-select-sm" value={form.room_type_id} onChange={e => set('room_type_id', e.target.value)}>
                <option value="">All Room Types</option>
                {hotelRoomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-8">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Rate Plan Name *</label>
              <input className="form-control form-control-sm" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Early Bird Weekend Offer" />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Plan Type</label>
              <select className="form-select form-select-sm" value={form.plan_type} onChange={e => set('plan_type', e.target.value)}>
                {PLAN_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Base Price (₹) *</label>
              <input type="number" className="form-control form-control-sm" value={form.price} onChange={e => set('price', parseInt(e.target.value))} placeholder="5000" />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Discount Type</label>
              <select className="form-select form-select-sm" value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
                {['None', 'Percentage', 'Fixed Amount'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            {form.discount_type !== 'None' && (
              <div className="col-6 col-md-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Discount Value</label>
                <input type="number" className="form-control form-control-sm" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} placeholder={form.discount_type === 'Percentage' ? '10%' : '₹500'} />
              </div>
            )}
            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Min Stay (nights)</label>
              <input type="number" className="form-control form-control-sm" value={form.min_stay} onChange={e => set('min_stay', parseInt(e.target.value))} min="1" />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Book Advance (days)</label>
              <input type="number" className="form-control form-control-sm" value={form.min_advance_days} onChange={e => set('min_advance_days', parseInt(e.target.value))} min="0" />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Valid From</label>
              <input type="date" className="form-control form-control-sm" value={form.valid_from} onChange={e => set('valid_from', e.target.value)} />
            </div>
            <div className="col-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Valid To</label>
              <input type="date" className="form-control form-control-sm" value={form.valid_to} onChange={e => set('valid_to', e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Cancellation Policy</label>
              <textarea className="form-control form-control-sm" rows={2} value={form.cancellation_policy} onChange={e => set('cancellation_policy', e.target.value)} placeholder="Free cancellation up to 24 hours before check-in..."></textarea>
            </div>
            <div className="col-6 col-md-4 d-flex align-items-center gap-2 pt-3">
              <input type="checkbox" className="form-check-input" id="refundable" checked={!!form.is_refundable} onChange={e => set('is_refundable', e.target.checked)} />
              <label htmlFor="refundable" className="form-check-label" style={{ fontSize: '0.82rem' }}>Refundable</label>
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Status</label>
              <select className="form-select form-select-sm" value={form.status} onChange={e => set('status', e.target.value)}>
                {['Active', 'Inactive', 'Draft'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="p-4 border-top d-flex justify-content-end gap-2">
          <button onClick={onClose} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            <Save size={13} className="me-1" />{saving ? 'Saving...' : 'Save Rate Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PMSRatePlans({ currentUser, vendorHotels }) {
  const [ratePlans, setRatePlans] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rp, rt] = await Promise.all([api.pmsListRatePlans(currentUser.id), api.pmsListRoomTypes(currentUser.id)]);
      setRatePlans(rp.rate_plans || []);
      setRoomTypes(rt.room_types || []);
    } catch { setRatePlans([]); setRoomTypes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [currentUser.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rate plan?')) return;
    await api.pmsDeleteRatePlan(id, currentUser.id);
    fetchData();
  };

  const PLAN_COLORS = {
    Active: ['#edf7f0', '#00b894'],
    Inactive: ['#f8f9fa', '#6c757d'],
    Draft: ['#fff9e6', '#fdcb6e']
  };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Rates & Offers</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{ratePlans.length} rate plans configured</p></div>
        <button onClick={() => { setEditPlan(null); setShowModal(true); }} className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2" style={{ background: '#0D1B2E', color: '#fff' }}>
          <Plus size={15} /> Create Rate Plan
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : ratePlans.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ background: '#fff' }}>
          <Tag size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-muted">No rate plans yet</h5>
          <p className="text-muted small mb-4">Create different rate plans for seasons, advance booking, length of stay and more</p>
          <button onClick={() => setShowModal(true)} className="btn rounded-pill px-5 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>Create First Rate Plan</button>
        </div>
      ) : (
        <div className="row g-3">
          {ratePlans.map(plan => {
            const [sBg, sCl] = PLAN_COLORS[plan.status] || PLAN_COLORS.Draft;
            const finalPrice = plan.discount_type === 'Percentage'
              ? Math.round(plan.price * (1 - parseFloat(plan.discount_value || 0) / 100))
              : plan.price - parseInt(plan.discount_value || 0);
            return (
              <div key={plan.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 rounded-4 shadow-sm h-100 p-4" style={{ background: '#fff' }}>
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="flex-grow-1 me-2">
                      <h6 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>{plan.name}</h6>
                      <div className="text-muted" style={{ fontSize: '0.73rem' }}>{plan.hotel_name} {plan.room_type_name ? `• ${plan.room_type_name}` : '• All Rooms'}</div>
                    </div>
                    <span className="badge rounded-pill" style={{ background: sBg, color: sCl, fontSize: '0.7rem', flexShrink: 0 }}>{plan.status}</span>
                  </div>

                  <div className="d-flex align-items-baseline gap-2 mb-2">
                    <span className="fw-bold" style={{ fontSize: '1.3rem', color: '#0D1B2E' }}>₹{finalPrice.toLocaleString('en-IN')}</span>
                    {plan.discount_type !== 'None' && plan.discount_value > 0 && (
                      <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.85rem' }}>₹{parseInt(plan.price).toLocaleString('en-IN')}</span>
                    )}
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>/night</span>
                  </div>

                  <div className="d-flex flex-wrap gap-1 mb-3">
                    <span className="badge rounded-pill" style={{ background: '#f0f2f5', color: '#6c757d', fontSize: '0.7rem' }}>{plan.plan_type}</span>
                    {plan.min_stay > 1 && <span className="badge rounded-pill" style={{ background: '#f0f2f5', color: '#6c757d', fontSize: '0.7rem' }}>Min {plan.min_stay} nights</span>}
                    {plan.min_advance_days > 0 && <span className="badge rounded-pill" style={{ background: '#f0f2f5', color: '#6c757d', fontSize: '0.7rem' }}>{plan.min_advance_days}+ days advance</span>}
                    {plan.is_refundable ? <span className="badge rounded-pill" style={{ background: '#edf7f0', color: '#00b894', fontSize: '0.7rem' }}>Refundable</span> : <span className="badge rounded-pill" style={{ background: '#fff0f0', color: '#d63031', fontSize: '0.7rem' }}>Non-refundable</span>}
                  </div>

                  {(plan.valid_from || plan.valid_to) && (
                    <div className="text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                      Valid: {plan.valid_from || '—'} → {plan.valid_to || '—'}
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid #f0f2f5' }}>
                    <button onClick={() => { setEditPlan(plan); setShowModal(true); }} className="btn btn-sm flex-grow-1 rounded-pill" style={{ background: '#f0f2f5', color: '#495057', fontSize: '0.78rem' }}>
                      <Edit size={12} className="me-1" /> Edit
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className="btn btn-sm rounded-pill" style={{ background: '#fff0f0', color: '#d63031', fontSize: '0.78rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && vendorHotels.length > 0 && (
        <RatePlanModal
          hotels={vendorHotels} roomTypes={roomTypes} vendorId={currentUser.id} plan={editPlan}
          onSave={() => { setShowModal(false); fetchData(); }} onClose={() => setShowModal(false)}
        />
      )}
      {showModal && vendorHotels.length === 0 && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white rounded-4 p-4 shadow-lg" style={{ maxWidth: '400px' }}>
            <h5 className="fw-bold mb-2">No Hotels</h5>
            <p className="text-muted">You need to add a hotel before creating rate plans.</p>
            <button onClick={() => setShowModal(false)} className="btn rounded-pill px-4" style={{ background: '#f0f2f5' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
