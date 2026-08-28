import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, X, Save, Shield, AlertCircle } from 'lucide-react';
import * as api from '../../../services/api';

const ROLES = ['Manager', 'Front Desk Staff', 'Reservation Agent', 'Accountant', 'Maintenance', 'Supervisor'];
const PERMISSIONS = ['View Bookings', 'Create Bookings', 'Cancel Bookings', 'View Payments', 'Edit Hotel Info', 'Manage Rooms', 'View Reports', 'Manage Staff'];

function StaffModal({ vendorId, vendorHotels, staff, onSave, onClose }) {
  const [form, setForm] = useState(staff || { name: '', email: '', phone: '', role: 'Front Desk Staff', hotel_ids: [], permissions: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleHotel = (id) => set('hotel_ids', form.hotel_ids.includes(id) ? form.hotel_ids.filter(x => x !== id) : [...form.hotel_ids, id]);
  const togglePerm = (p) => set('permissions', form.permissions.includes(p) ? form.permissions.filter(x => x !== p) : [...form.permissions, p]);

  const handleSave = async () => {
    if (!form.name || !form.email) { setError('Name and email required'); return; }
    setSaving(true); setError('');
    try {
      if (staff?.id) await api.pmsUpdateStaff({ ...form, id: staff.id, vendor_id: vendorId });
      else await api.pmsCreateStaff({ ...form, vendor_id: vendorId });
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="bg-white rounded-4 shadow-lg overflow-auto" style={{ width: '560px', maxWidth: '95vw', maxHeight: '90vh' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">{staff ? 'Edit Staff Member' : 'Add Staff Member'}</h5>
          <button onClick={onClose} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
        </div>
        <div className="p-4">
          {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}><AlertCircle size={13} className="me-1" />{error}</div>}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Full Name *</label>
              <input className="form-control form-control-sm" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Email *</label>
              <input type="email" className="form-control form-control-sm" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Phone</label>
              <input type="tel" className="form-control form-control-sm" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Role</label>
              <select className="form-select form-select-sm" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {vendorHotels.length > 1 && (
            <div className="mt-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Assign Hotels</label>
              <div className="d-flex flex-wrap gap-2">
                {vendorHotels.map(h => (
                  <button key={h.id} type="button" onClick={() => toggleHotel(h.id)} className="btn btn-sm rounded-pill px-3"
                    style={{ background: form.hotel_ids.includes(h.id) ? '#0D1B2E' : '#f0f2f5', color: form.hotel_ids.includes(h.id) ? '#fff' : '#495057', border: 'none', fontSize: '0.78rem' }}>
                    {h.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Permissions</label>
            <div className="d-flex flex-wrap gap-2">
              {PERMISSIONS.map(p => (
                <button key={p} type="button" onClick={() => togglePerm(p)} className="btn btn-sm rounded-pill px-3"
                  style={{ background: form.permissions.includes(p) ? '#6c5ce7' : '#f0f2f5', color: form.permissions.includes(p) ? '#fff' : '#495057', border: 'none', fontSize: '0.78rem' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-top d-flex justify-content-end gap-2">
          <button onClick={onClose} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            <Save size={13} className="me-1" />{saving ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PMSStaff({ currentUser, vendorHotels }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.pmsListStaff(currentUser.id);
      setStaff(res.staff || []);
    } catch { setStaff([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, [currentUser.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    await api.pmsDeleteStaff(id, currentUser.id);
    fetchStaff();
  };

  const ROLE_COLORS = { Manager: '#6c5ce7', 'Front Desk Staff': '#0984e3', 'Reservation Agent': '#00b894', Accountant: '#fdcb6e', Maintenance: '#e17055', Supervisor: '#fd79a8' };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Staff & Permissions</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{staff.length} staff members</p></div>
        <button onClick={() => { setEditStaff(null); setShowModal(true); }} className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2" style={{ background: '#0D1B2E', color: '#fff' }}>
          <Plus size={15} /> Add Staff Member
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : staff.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ background: '#fff' }}>
          <Users size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-muted">No staff members yet</h5>
          <p className="text-muted small mb-4">Add staff members and configure their access permissions</p>
          <button onClick={() => setShowModal(true)} className="btn rounded-pill px-5 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>Add First Staff Member</button>
        </div>
      ) : (
        <div className="row g-3">
          {staff.map(s => {
            const permissions = (() => { try { return JSON.parse(s.permissions_json || '[]'); } catch { return []; } })();
            const roleColor = ROLE_COLORS[s.role] || '#6c757d';
            return (
              <div key={s.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 rounded-4 shadow-sm h-100 p-4" style={{ background: '#fff' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '46px', height: '46px', background: roleColor, fontSize: '18px', flexShrink: 0 }}>
                      {s.name[0].toUpperCase()}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>{s.name}</h6>
                      <div className="text-muted" style={{ fontSize: '0.73rem' }}>{s.email}</div>
                    </div>
                    <span className="badge rounded-pill" style={{ background: `${roleColor}20`, color: roleColor, fontSize: '0.68rem', fontWeight: 700 }}>{s.role}</span>
                  </div>
                  {s.phone && <div className="text-muted mb-3" style={{ fontSize: '0.78rem' }}>📞 {s.phone}</div>}
                  {permissions.length > 0 && (
                    <div className="mb-3">
                      <div className="text-muted mb-1" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Permissions</div>
                      <div className="d-flex flex-wrap gap-1">
                        {permissions.slice(0, 4).map(p => <span key={p} className="badge rounded-pill" style={{ background: '#f0f2f5', color: '#6c757d', fontSize: '0.68rem' }}><Shield size={8} className="me-1" />{p}</span>)}
                        {permissions.length > 4 && <span className="badge rounded-pill" style={{ background: '#f0f2f5', color: '#6c757d', fontSize: '0.68rem' }}>+{permissions.length - 4} more</span>}
                      </div>
                    </div>
                  )}
                  <div className="d-flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid #f0f2f5' }}>
                    <button onClick={() => { setEditStaff(s); setShowModal(true); }} className="btn btn-sm flex-grow-1 rounded-pill" style={{ background: '#f0f2f5', color: '#495057', fontSize: '0.78rem' }}>
                      <Edit size={12} className="me-1" /> Edit
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="btn btn-sm rounded-pill" style={{ background: '#fff0f0', color: '#d63031', fontSize: '0.78rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <StaffModal vendorId={currentUser.id} vendorHotels={vendorHotels} staff={editStaff}
          onSave={() => { setShowModal(false); fetchStaff(); }} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
