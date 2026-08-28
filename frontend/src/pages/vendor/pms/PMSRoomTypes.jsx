import React, { useState, useEffect } from 'react';
import {
  BedDouble, Plus, Edit, Trash2, CheckCircle, XCircle, Hash,
  Users, DollarSign, Building, ChevronDown, Save, AlertCircle,
  Wifi, Wind, Tv, Coffee, Lock, Bath, X, Upload
} from 'lucide-react';
import * as api from '../../../services/api';

const ROOM_AMENITIES = ['Television', 'Wi-Fi', 'Air Conditioning', 'Fan', 'Wardrobe', 'Work Desk', 'Safe', 'Electric Kettle', 'Refrigerator', 'Balcony', 'Telephone', 'Hair Dryer', 'Toiletries', 'Hot Water', 'Iron', 'Room Heater', 'Soundproofing'];
const BED_TYPES = ['King', 'Queen', 'Twin', 'Single', 'Double', 'Bunk', 'Sofa Bed'];
const VIEW_TYPES = ['Garden View', 'Pool View', 'Sea View', 'City View', 'Mountain View', 'No View'];
const ROOM_STATUSES = ['Available', 'Occupied', 'Reserved', 'Blocked', 'Under Maintenance', 'Out of Service'];

function BulkUploadModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const handleUploadClick = () => {
    if (!file) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      onUpload(file);
    }, 1500); // Simulate upload delay
  }

  const downloadTemplate = (e) => {
    e.preventDefault();
    const csvContent = "data:text/csv;charset=utf-8,Room Number,Floor,Room Type ID,Status,Internal Note\n101,1,type_id_here,Available,Sea facing";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bulk_rooms_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="bg-white rounded-4 shadow-lg overflow-auto" style={{ width: '500px', maxWidth: '95vw' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">Bulk Upload Physical Rooms</h5>
          <button onClick={onClose} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
        </div>
        <div className="p-4">
          <div className="alert alert-info py-2 px-3 mb-4" style={{ fontSize: '0.82rem' }}>
            Upload a CSV or Excel file containing your physical room numbers. 
            <strong> Ensure your columns match the required template.</strong>
          </div>
          
          <div className="mb-4 text-center">
            <button className="btn btn-sm rounded-pill fw-bold" style={{ background: '#e3f2fd', color: '#0984e3' }} onClick={downloadTemplate}>
              ⬇ Download Room Template (.csv)
            </button>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Select File</label>
            <input type="file" className="form-control form-control-sm" accept=".csv,.xlsx" onChange={e => setFile(e.target.files[0])} />
          </div>
        </div>
        <div className="p-4 border-top d-flex justify-content-end gap-2">
          <button onClick={onClose} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Cancel</button>
          <button onClick={handleUploadClick} disabled={!file || uploading} className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            {uploading ? 'Uploading...' : 'Upload Rooms'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomTypeModal({ hotel, vendorId, existing, onSave, onClose }) {
  const [form, setForm] = useState(existing || {
    hotel_id: hotel?.id || '',
    vendor_id: vendorId,
    name: '', internal_code: '', description: '',
    total_rooms: 1, max_adults: 2, max_children: 1, max_occupancy: 3, base_occupancy: 2,
    bed_type: 'King', num_beds: 1, room_size: '', room_size_unit: 'sqft',
    view_type: 'Garden View', smoking: false, air_conditioned: true,
    private_bathroom: true, extra_bed_available: false,
    base_price: '', selling_price: '', weekend_price: '',
    extra_adult_charge: '', extra_bed_charge: '',
    amenities: [], status: 'Active'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a) => set('amenities', form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]);

  const handleSave = async () => {
    if (!form.name || !form.selling_price) { setError('Room type name and selling price are required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, vendor_id: vendorId, hotel_id: hotel.id };
      if (existing?.id) {
        await api.pmsUpdateRoomType({ ...payload, id: existing.id });
      } else {
        await api.pmsCreateRoomType(payload);
      }
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="bg-white rounded-4 shadow-lg overflow-auto" style={{ width: '700px', maxWidth: '95vw', maxHeight: '90vh' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">{existing ? 'Edit' : 'Add'} Room Type</h5>
          <button onClick={onClose} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
        </div>
        <div className="p-4">
          {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}><AlertCircle size={13} className="me-1" />{error}</div>}

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Room Type Name *</label>
              <input className="form-control form-control-sm" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Deluxe Room" />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Internal Code</label>
              <input className="form-control form-control-sm" value={form.internal_code} onChange={e => set('internal_code', e.target.value)} placeholder="e.g. DLX" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Description</label>
              <textarea className="form-control form-control-sm" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe this room type..."></textarea>
            </div>
            <div className="col-4"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Total Rooms</label><input type="number" className="form-control form-control-sm" value={form.total_rooms} onChange={e => set('total_rooms', parseInt(e.target.value))} /></div>
            <div className="col-4"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Max Adults</label><input type="number" className="form-control form-control-sm" value={form.max_adults} onChange={e => set('max_adults', parseInt(e.target.value))} /></div>
            <div className="col-4"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Max Occupancy</label><input type="number" className="form-control form-control-sm" value={form.max_occupancy} onChange={e => set('max_occupancy', parseInt(e.target.value))} /></div>
            <div className="col-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Bed Type</label>
              <select className="form-select form-select-sm" value={form.bed_type} onChange={e => set('bed_type', e.target.value)}>
                {BED_TYPES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="col-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>View Type</label>
              <select className="form-select form-select-sm" value={form.view_type} onChange={e => set('view_type', e.target.value)}>
                {VIEW_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-4"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Room Size (sq ft)</label><input type="number" className="form-control form-control-sm" value={form.room_size} onChange={e => set('room_size', e.target.value)} placeholder="250" /></div>
            <div className="col-4"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Selling Price (₹/night) *</label><input type="number" className="form-control form-control-sm" value={form.selling_price} onChange={e => set('selling_price', parseInt(e.target.value))} placeholder="5500" /></div>
            <div className="col-4"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Weekend Price (₹)</label><input type="number" className="form-control form-control-sm" value={form.weekend_price} onChange={e => set('weekend_price', parseInt(e.target.value))} placeholder="6500" /></div>
            <div className="col-4"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Extra Adult (₹)</label><input type="number" className="form-control form-control-sm" value={form.extra_adult_charge} onChange={e => set('extra_adult_charge', parseInt(e.target.value))} placeholder="1500" /></div>
          </div>

          {/* Toggles */}
          <div className="d-flex flex-wrap gap-3 mt-3">
            {[['air_conditioned', 'Air Conditioned'], ['private_bathroom', 'Private Bathroom'], ['smoking', 'Smoking Allowed'], ['extra_bed_available', 'Extra Bed Available']].map(([k, l]) => (
              <div key={k} className="d-flex align-items-center gap-2">
                <input type="checkbox" className="form-check-input" id={k} checked={!!form[k]} onChange={e => set(k, e.target.checked)} />
                <label htmlFor={k} className="form-check-label" style={{ fontSize: '0.82rem' }}>{l}</label>
              </div>
            ))}
          </div>

          {/* Amenities */}
          <div className="mt-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Room Amenities</label>
            <div className="d-flex flex-wrap gap-2">
              {ROOM_AMENITIES.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)} className="btn btn-sm rounded-pill px-2 py-1"
                  style={{ background: form.amenities.includes(a) ? '#0D1B2E' : '#f0f2f5', color: form.amenities.includes(a) ? '#fff' : '#495057', border: 'none', fontSize: '0.75rem' }}>
                  {form.amenities.includes(a) && <CheckCircle size={10} className="me-1" />}{a}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-top d-flex justify-content-end gap-2">
          <button onClick={onClose} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            <Save size={13} className="me-1" />{saving ? 'Saving...' : 'Save Room Type'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddRoomModal({ hotel, roomTypes, vendorId, onSave, onClose }) {
  const [form, setForm] = useState({ room_number: '', floor: '1', room_type_id: roomTypes[0]?.id || '', status: 'Available', internal_note: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.room_number || !form.room_type_id) return;
    setSaving(true);
    try {
      await api.pmsCreateRoom({ ...form, hotel_id: hotel.id, vendor_id: vendorId });
      onSave();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="bg-white rounded-4 shadow-lg p-4" style={{ width: '480px', maxWidth: '95vw' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h5 className="fw-bold mb-0">Add Room Number</h5>
          <button onClick={onClose} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
        </div>
        <div className="row g-3">
          <div className="col-6"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Room Number *</label><input className="form-control form-control-sm" placeholder="e.g. 101" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} /></div>
          <div className="col-6"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Floor</label><input className="form-control form-control-sm" placeholder="1" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} /></div>
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Room Type *</label>
            <select className="form-select form-select-sm" value={form.room_type_id} onChange={e => setForm(f => ({ ...f, room_type_id: e.target.value }))}>
              {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Status</label>
            <select className="form-select form-select-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {ROOM_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-12"><label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Internal Note</label><input className="form-control form-control-sm" placeholder="Optional note" value={form.internal_note} onChange={e => setForm(f => ({ ...f, internal_note: e.target.value }))} /></div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button onClick={onClose} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            {saving ? 'Adding...' : 'Add Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PMSRoomTypes({ currentUser, vendorHotels, mode }) {
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState((vendorHotels || [])[0]?.id || '');
  const [activeTab, setActiveTab] = useState(mode === 'restrictions' ? 'restrictions' : 'types');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [savingRestriction, setSavingRestriction] = useState(null);

  const hotel = (vendorHotels || []).find(h => h.id === selectedHotel) || (vendorHotels || [])[0];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rt, rm] = await Promise.all([
        api.pmsListRoomTypes(currentUser.id),
        hotel ? api.pmsListRooms(hotel.id, currentUser.id) : Promise.resolve({ rooms: [] })
      ]);
      setRoomTypes((rt.room_types || []).filter(r => !selectedHotel || r.hotel_id === selectedHotel));
      setRooms(rm.rooms || []);
    } catch (e) {
      setRoomTypes([]); setRooms([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedHotel, currentUser.id]);

  const handleDeleteType = async (id) => {
    if (!window.confirm('Delete this room type?')) return;
    try { await api.pmsDeleteRoomType(id, currentUser.id); fetchData(); } catch (e) { alert(e.message); }
  };

  const handleUpdateRestriction = async (rt, key, val) => {
    setSavingRestriction(rt.id);
    try {
      const updated = { ...rt, [key]: val, vendor_id: currentUser.id };
      await api.pmsUpdateRoomType(updated);
      setRoomTypes(prev => prev.map(r => r.id === rt.id ? { ...r, [key]: val } : r));
    } catch (err) {
      alert('Failed to update restriction: ' + err.message);
    } finally {
      setSavingRestriction(null);
    }
  };

  const STATUS_BADGE = { Available: ['#edf7f0', '#00b894'], Occupied: ['#fff0f0', '#d63031'], Reserved: ['#e3f2fd', '#0984e3'], Blocked: ['#fff9e6', '#e17055'], 'Under Maintenance': ['#f3f0ff', '#6c5ce7'], 'Out of Service': ['#f8f9fa', '#6c757d'] };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>
            {mode === 'restrictions' ? 'Booking Restrictions' : 'Rooms & Room Types'}
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            {mode === 'restrictions' 
              ? 'Configure minimum/maximum stay rules, Closed to Arrival/Departure, and Stop Sell per room type.'
              : `${roomTypes.length} room types • ${rooms.length} physical rooms`}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {vendorHotels && vendorHotels.length > 1 && (
            <select className="form-select form-select-sm rounded-pill" style={{ width: '200px' }} value={selectedHotel} onChange={e => setSelectedHotel(e.target.value)}>
              {vendorHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
          {mode !== 'restrictions' && (
            <>
              <button onClick={() => { setEditingType(null); setShowTypeModal(true); }} className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-1" style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.85rem' }}>
                <Plus size={15} /> Add Room Type
              </button>
              <button onClick={() => setShowRoomModal(true)} className="btn rounded-pill px-4 d-flex align-items-center gap-1" style={{ background: '#fff', color: '#0D1B2E', border: '1px solid #dee2e6', fontSize: '0.85rem' }}>
                <Hash size={15} /> Add Room Number
              </button>
              <button onClick={() => setShowBulkModal(true)} className="btn rounded-pill px-4 d-flex align-items-center gap-1" style={{ background: '#fff', color: '#00b894', border: '1px solid #dee2e6', fontSize: '0.85rem' }}>
                <Upload size={15} /> Bulk Upload
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs if not in restrictions mode */}
      {mode !== 'restrictions' && (
        <div className="d-flex gap-2 mb-4">
          {[['types', 'Room Types'], ['numbers', 'Physical Rooms']].map(([t, l]) => (
            <button key={t} onClick={() => setActiveTab(t)} className="btn btn-sm rounded-pill px-4"
              style={{ background: activeTab === t ? '#0D1B2E' : '#fff', color: activeTab === t ? '#fff' : '#6c757d', border: '1px solid #dee2e6' }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (mode === 'restrictions' || activeTab === 'restrictions') ? (
        /* Restrictions Table */
        <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
          <table className="table table-hover mb-0">
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                {['Room Type', 'Min Stay (Nights)', 'Max Stay (Nights)', 'Closed to Arrival (CTA)', 'Closed to Departure (CTD)', 'Stop Sell'].map(h => (
                  <th key={h} className="fw-bold py-3 px-4" style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roomTypes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No room types available to set restrictions.</td></tr>
              ) : roomTypes.map(rt => (
                <tr key={rt.id}>
                  <td className="py-3 px-4 fw-bold">
                    <div>{rt.name}</div>
                    <span className="text-muted small">{rt.internal_code || 'STD'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm rounded-pill"
                      style={{ width: '90px' }}
                      defaultValue={rt.min_stay || 1}
                      onBlur={e => handleUpdateRestriction(rt, 'min_stay', parseInt(e.target.value) || 1)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm rounded-pill"
                      style={{ width: '90px' }}
                      defaultValue={rt.max_stay || 30}
                      onBlur={e => handleUpdateRestriction(rt, 'max_stay', parseInt(e.target.value) || 30)}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!rt.closed_to_arrival}
                        onChange={e => handleUpdateRestriction(rt, 'closed_to_arrival', e.target.checked ? 1 : 0)}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!rt.closed_to_departure}
                        onChange={e => handleUpdateRestriction(rt, 'closed_to_departure', e.target.checked ? 1 : 0)}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!rt.stop_sell}
                        onChange={e => handleUpdateRestriction(rt, 'stop_sell', e.target.checked ? 1 : 0)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'types' ? (
        roomTypes.length === 0 ? (
          <div className="card border-0 rounded-4 p-5 text-center" style={{ background: '#fff' }}>
            <BedDouble size={48} className="text-muted opacity-25 mb-3 mx-auto" />
            <h5 className="text-muted">No room types yet</h5>
            <p className="text-muted small mb-4">Create room types to configure pricing, availability and rooms</p>
            <button onClick={() => setShowTypeModal(true)} className="btn rounded-pill px-5 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
              <Plus size={15} className="me-1" /> Add First Room Type
            </button>
          </div>
        ) : (
          <div className="row g-3">
            {roomTypes.map(rt => {
              const amenities = (() => { try { return Array.isArray(rt.amenities) ? rt.amenities : JSON.parse(rt.amenities_json || '[]'); } catch { return []; } })();
              return (
                <div key={rt.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card border-0 rounded-4 shadow-sm h-100 p-4" style={{ background: '#fff' }}>
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div>
                        <h6 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>{rt.name}</h6>
                        {rt.hotel_name && <div className="text-muted" style={{ fontSize: '0.73rem' }}>{rt.hotel_name}</div>}
                      </div>
                      <span className="badge rounded-pill" style={{ background: rt.status === 'Active' ? '#edf7f0' : '#f8f9fa', color: rt.status === 'Active' ? '#00b894' : '#6c757d', fontSize: '0.7rem' }}>
                        {rt.status}
                      </span>
                    </div>

                    <div className="row g-2 mb-3">
                      {[
                        ['Total Rooms', rt.total_rooms], ['Max Adults', rt.max_adults],
                        ['Bed Type', rt.bed_type], ['View', rt.view_type]
                      ].map(([l, v]) => (
                        <div key={l} className="col-6">
                          <div className="p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                            <div className="text-muted" style={{ fontSize: '0.65rem' }}>{l}</div>
                            <div className="fw-bold" style={{ fontSize: '0.82rem' }}>{v}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex align-items-baseline gap-1 mb-2">
                      <span className="fw-bold" style={{ fontSize: '1.1rem', color: '#0D1B2E' }}>₹{parseInt(rt.selling_price || rt.price || 0).toLocaleString('en-IN')}</span>
                      <span className="text-muted" style={{ fontSize: '0.72rem' }}>/night</span>
                    </div>

                    {amenities.length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {amenities.slice(0, 4).map(a => <span key={a} className="badge rounded-pill" style={{ background: '#f0f2f5', color: '#6c757d', fontSize: '0.68rem' }}>{a}</span>)}
                        {amenities.length > 4 && <span className="badge rounded-pill" style={{ background: '#f0f2f5', color: '#6c757d', fontSize: '0.68rem' }}>+{amenities.length - 4}</span>}
                      </div>
                    )}

                    <div className="d-flex gap-2 mt-auto pt-3" style={{ borderTop: '1px solid #f0f2f5' }}>
                      <button onClick={() => { setEditingType(rt); setShowTypeModal(true); }} className="btn btn-sm flex-grow-1 rounded-pill" style={{ background: '#f0f2f5', color: '#495057', fontSize: '0.78rem' }}>
                        <Edit size={12} className="me-1" /> Edit
                      </button>
                      <button onClick={() => handleDeleteType(rt.id)} className="btn btn-sm rounded-pill" style={{ background: '#fff0f0', color: '#d63031', fontSize: '0.78rem' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Physical Rooms Table */
        <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
          <table className="table table-hover mb-0">
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                {['Room No.', 'Floor', 'Type', 'Status', 'Note', 'Actions'].map(h => (
                  <th key={h} className="fw-bold py-3 px-4" style={{ fontSize: '0.78rem', color: '#6c757d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', border: 'none' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-5 text-muted">No physical rooms added yet. Click "Add Room Number" to get started.</td></tr>
              ) : rooms.map(room => {
                const [sbg, sclr] = STATUS_BADGE[room.status] || ['#f8f9fa', '#6c757d'];
                return (
                  <tr key={room.id}>
                    <td className="py-3 px-4 fw-bold">{room.room_number}</td>
                    <td className="py-3 px-4">Floor {room.floor}</td>
                    <td className="py-3 px-4" style={{ fontSize: '0.85rem' }}>{room.room_type_name || room.type_name || '—'}</td>
                    <td className="py-3 px-4"><span className="badge rounded-pill" style={{ background: sbg, color: sclr, fontSize: '0.75rem' }}>{room.status}</span></td>
                    <td className="py-3 px-4 text-muted" style={{ fontSize: '0.82rem' }}>{room.internal_note || '—'}</td>
                    <td className="py-3 px-4">
                      <select className="form-select form-select-sm rounded-pill" style={{ width: '160px', fontSize: '0.78rem' }}
                        value={room.status}
                        onChange={async e => { await api.pmsUpdateRoom({ id: room.id, vendor_id: currentUser.id, floor: room.floor, status: e.target.value, internal_note: room.internal_note }); fetchData(); }}
                      >
                        {ROOM_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showTypeModal && hotel && (
        <RoomTypeModal hotel={hotel} vendorId={currentUser.id} existing={editingType} onSave={() => { setShowTypeModal(false); fetchData(); }} onClose={() => setShowTypeModal(false)} />
      )}
      {showRoomModal && hotel && (
        <AddRoomModal hotel={hotel} roomTypes={roomTypes} vendorId={currentUser.id} onSave={() => { setShowRoomModal(false); fetchData(); }} onClose={() => setShowRoomModal(false)} />
      )}
      {showBulkModal && hotel && (
        <BulkUploadModal 
          onClose={() => setShowBulkModal(false)} 
          onUpload={(file) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const text = e.target.result;
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                const roomsToAdd = [];
                for (let i = 1; i < lines.length; i++) {
                  const parts = lines[i].split(',').map(p => p.trim());
                  if (parts[0]) {
                    roomsToAdd.push({
                      room_number: parts[0],
                      floor: parts[1] || '1',
                      room_type_id: parts[2] || (roomTypes[0]?.id || ''),
                      status: parts[3] || 'Available',
                      internal_note: parts[4] || ''
                    });
                  }
                }
                if (roomsToAdd.length > 0) {
                  await api.pmsBulkRooms({
                    hotel_id: hotel.id,
                    vendor_id: currentUser.id,
                    rooms: roomsToAdd
                  });
                }
                setShowBulkModal(false);
                fetchData();
              } catch (err) {
                alert('Upload failed: ' + err.message);
              }
            };
            reader.readAsText(file);
          }} 
        />
      )}
    </div>
  );
}
