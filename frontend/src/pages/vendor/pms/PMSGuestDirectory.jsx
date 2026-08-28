import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Phone, Mail, MapPin, Eye, Edit, Flag, X, Save, AlertCircle } from 'lucide-react';
import * as api from '../../../services/api';

function GuestModal({ guest, vendorId, onSave, onClose }) {
  const [form, setForm] = useState(guest || { name: '', phone: '', email: '', address: '', city: '', country: 'India', id_type: 'Aadhaar', id_number_masked: '', preferences: '', internal_notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.phone) { setError('Name and phone are required'); return; }
    setSaving(true); setError('');
    try {
      if (guest?.id) await api.pmsUpdateGuest({ ...form, id: guest.id, vendor_id: vendorId });
      else {
        const res = await api.pmsCreateGuest({ ...form, vendor_id: vendorId });
        if (!res.success) { setError(res.error || 'Failed to create guest'); setSaving(false); return; }
      }
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="bg-white rounded-4 shadow-lg overflow-auto" style={{ width: '540px', maxWidth: '95vw', maxHeight: '90vh' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">{guest ? 'Edit Guest' : 'Add Guest'}</h5>
          <button onClick={onClose} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
        </div>
        <div className="p-4">
          {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}><AlertCircle size={13} className="me-1" />{error}</div>}
          <div className="row g-3">
            {[['Full Name *', 'name'], ['Phone *', 'phone', 'tel'], ['Email', 'email', 'email'], ['Address', 'address'], ['City', 'city'], ['Country', 'country']].map(([l, k, t = 'text']) => (
              <div key={k} className="col-12 col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>{l}</label>
                <input type={t} className="form-control form-control-sm" value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>ID Type</label>
              <select className="form-select form-select-sm" value={form.id_type} onChange={e => set('id_type', e.target.value)}>
                {['Aadhaar', 'Passport', 'Driving License', 'PAN', 'Voter ID', 'Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>ID Number (last 4 digits)</label>
              <input className="form-control form-control-sm" value={form.id_number_masked} onChange={e => set('id_number_masked', e.target.value)} placeholder="e.g. XXXX-1234" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Preferences</label>
              <input className="form-control form-control-sm" value={form.preferences} onChange={e => set('preferences', e.target.value)} placeholder="e.g. Quiet room, high floor, early check-in" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Internal Notes (staff only)</label>
              <textarea className="form-control form-control-sm" rows={2} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)}></textarea>
            </div>
          </div>
        </div>
        <div className="p-4 border-top d-flex justify-content-end gap-2">
          <button onClick={onClose} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            <Save size={13} className="me-1" />{saving ? 'Saving...' : 'Save Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PMSGuestDirectory({ currentUser, vendorBookings }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [viewGuest, setViewGuest] = useState(null);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await api.pmsListGuests(currentUser.id);
      setGuests(res.guests || []);
    } catch { setGuests([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGuests(); }, [currentUser.id]);

  const filtered = guests.filter(g => !search ||
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search) || g.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Guest Directory</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{guests.length} registered guests</p>
        </div>
        <button onClick={() => { setEditGuest(null); setShowModal(true); }} className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2" style={{ background: '#0D1B2E', color: '#fff' }}>
          <Plus size={15} /> Add Guest
        </button>
      </div>

      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4" style={{ background: '#fff' }}>
        <div className="position-relative">
          <Search size={14} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#adb5bd' }} />
          <input className="form-control form-control-sm rounded-pill ps-4" placeholder="Search by name, phone or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '400px' }} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ background: '#fff' }}>
          <Users size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-muted">No guests yet</h5>
          <p className="text-muted small mb-4">Guests who book through your property will appear here</p>
          <button onClick={() => setShowModal(true)} className="btn rounded-pill px-5 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>Add Guest Manually</button>
        </div>
      ) : (
        <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
          <table className="table table-hover mb-0">
            <thead style={{ background: '#f8f9fa' }}>
              <tr>{['Guest', 'Contact', 'Location', 'ID', 'Stays', 'Status', 'Actions'].map(h => (
                <th key={h} className="py-3 px-4" style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', border: 'none' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td className="py-3 px-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '36px', height: '36px', background: '#6c5ce7', fontSize: '14px', flexShrink: 0 }}>
                        {g.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{g.name}</div>
                        {g.is_restricted && <span className="badge" style={{ background: '#fff0f0', color: '#d63031', fontSize: '0.65rem' }}>Restricted</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div style={{ fontSize: '0.8rem' }}><Phone size={11} className="me-1 text-muted" />{g.phone}</div>
                    {g.email && <div style={{ fontSize: '0.75rem' }} className="text-muted"><Mail size={10} className="me-1" />{g.email}</div>}
                  </td>
                  <td className="py-3 px-4 text-muted" style={{ fontSize: '0.8rem' }}>{g.city || '—'}, {g.country || 'India'}</td>
                  <td className="py-3 px-4 text-muted" style={{ fontSize: '0.8rem' }}>{g.id_type || '—'}</td>
                  <td className="py-3 px-4 text-center fw-bold" style={{ fontSize: '0.85rem' }}>{g.total_stays || 0}</td>
                  <td className="py-3 px-4"><span className="badge rounded-pill" style={{ background: '#edf7f0', color: '#00b894', fontSize: '0.7rem' }}>Active</span></td>
                  <td className="py-3 px-4">
                    <div className="d-flex gap-1">
                      <button onClick={() => setViewGuest(g)} className="btn btn-sm rounded-pill px-2 py-0" style={{ background: '#f0f2f5', fontSize: '0.75rem' }}><Eye size={12} /></button>
                      <button onClick={() => { setEditGuest(g); setShowModal(true); }} className="btn btn-sm rounded-pill px-2 py-0" style={{ background: '#f0f2f5', fontSize: '0.75rem' }}><Edit size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <GuestModal guest={editGuest} vendorId={currentUser.id} onSave={() => { setShowModal(false); fetchGuests(); }} onClose={() => setShowModal(false)} />
      )}

      {viewGuest && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white rounded-4 shadow-lg p-4" style={{ width: '480px', maxWidth: '95vw' }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h5 className="fw-bold mb-0">Guest Profile</h5>
              <button onClick={() => setViewGuest(null)} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
            </div>
            <div className="text-center mb-4">
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mx-auto mb-2" style={{ width: '60px', height: '60px', background: '#6c5ce7', fontSize: '24px' }}>{viewGuest.name[0].toUpperCase()}</div>
              <h5 className="fw-bold mb-0">{viewGuest.name}</h5>
              <span className="text-muted" style={{ fontSize: '0.82rem' }}>{viewGuest.phone}</span>
            </div>
            {[['Email', viewGuest.email || '—'], ['City', `${viewGuest.city || '—'}, ${viewGuest.country}`], ['ID', viewGuest.id_type || '—'], ['Preferences', viewGuest.preferences || '—'], ['Total Stays', viewGuest.total_stays || 0]].map(([l, v]) => (
              <div key={l} className="d-flex py-2 border-bottom" style={{ fontSize: '0.85rem', borderColor: '#f0f2f5 !important' }}>
                <span className="text-muted fw-semibold" style={{ width: '130px', flexShrink: 0 }}>{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="d-flex justify-content-end mt-4">
              <button onClick={() => setViewGuest(null)} className="btn rounded-pill px-4" style={{ background: '#f0f2f5' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
