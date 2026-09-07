import React, { useState, useEffect } from 'react';
import {
  Map as MapIcon, Plus, Search, Trash2, Edit2, CheckCircle2,
  XCircle, Clock, MapPin, DollarSign, X, RefreshCw,
  Compass, Eye, Tag, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import * as api from '../../services/api';

const CATEGORIES = [
  'All',
  'Water Sports',
  'Adventure',
  'Sightseeing & Tours',
  'Island Trips',
  'Heritage & Culture',
  'Cruises & Waterways',
  'Nightlife & Events'
];

export default function AdminActivitiesManagement({ currentUser }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'Water Sports',
    location: 'North Goa',
    price: '',
    duration: '2-3 Hours',
    description: '',
    image_url: '',
    is_active: 1
  });

  const loadActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getActivities();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Unable to fetch sightseeing & activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      type: 'Water Sports',
      location: 'North Goa',
      price: '',
      duration: '2-3 Hours',
      description: '',
      image_url: '',
      is_active: 1
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title || item.name || '',
      type: item.type || item.category || 'Sightseeing & Tours',
      location: item.location || 'Goa',
      price: item.price || '',
      duration: item.duration || '2-3 Hours',
      description: item.description || '',
      image_url: item.image_url || item.image || '',
      is_active: item.is_active !== undefined ? item.is_active : 1
    });
    setError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Activity title is required.');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      setError('Valid price is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: formData.title.trim(),
        name: formData.title.trim(),
        type: formData.type,
        category: formData.type,
        location: formData.location.trim(),
        price: parseInt(formData.price, 10),
        duration: formData.duration.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim(),
        image: formData.image_url.trim(),
        is_active: formData.is_active ? 1 : 0
      };

      if (editingItem) {
        await api.updateActivity(editingItem.id, payload);
      } else {
        await api.createActivity(payload);
      }

      setShowModal(false);
      await loadActivities();
    } catch (err) {
      console.error('Failed to save activity:', err);
      setError(err.message || 'Failed to save activity.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || 'this item'}"?`)) return;
    try {
      await api.deleteActivity(id);
      await loadActivities();
    } catch (err) {
      alert('Failed to delete activity: ' + err.message);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const newStatus = item.is_active ? 0 : 1;
      await api.updateActivity(item.id, { is_active: newStatus });
      await loadActivities();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Filter items
  const filteredActivities = activities.filter(a => {
    const title = (a.title || a.name || '').toLowerCase();
    const loc = (a.location || '').toLowerCase();
    const type = (a.type || a.category || '').toLowerCase();
    const desc = (a.description || '').toLowerCase();
    const q = search.toLowerCase().trim();

    const matchesSearch = !q || title.includes(q) || loc.includes(q) || type.includes(q) || desc.includes(q);

    if (selectedCategory === 'All') return matchesSearch;
    const matchesCat = type.includes(selectedCategory.toLowerCase()) || selectedCategory.toLowerCase().includes(type);
    return matchesSearch && matchesCat;
  });

  const activeCount = activities.filter(a => a.is_active !== 0).length;
  const avgPrice = activities.length > 0
    ? Math.round(activities.reduce((sum, a) => sum + parseInt(a.price || 0, 10), 0) / activities.length)
    : 0;

  return (
    <div className="p-4">
      {/* Top Header Card */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1" style={{ color: '#0D1B2E', letterSpacing: '0.3px' }}>
            Manage Sightseeing & Activity
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Curate, price, and publish top attractions, water sports, and guided excursions across Goa.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={loadActivities}
            className="btn btn-outline-secondary btn-sm rounded-3 d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="btn btn-sm rounded-3 d-flex align-items-center gap-2 px-3.5 py-2 fw-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', border: 'none' }}
          >
            <Plus size={16} /> Add Activity
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rounded-3 p-3 shadow-xs border" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Activities</span>
              <span className="p-2 rounded-2" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333' }}><MapIcon size={16} /></span>
            </div>
            <div className="fs-4 fw-extrabold" style={{ color: '#0D1B2E' }}>{activities.length}</div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>In catalog</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rounded-3 p-3 shadow-xs border" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Active & Live</span>
              <span className="p-2 rounded-2" style={{ background: '#ecfdf5', color: '#10b981' }}><CheckCircle2 size={16} /></span>
            </div>
            <div className="fs-4 fw-extrabold" style={{ color: '#10b981' }}>{activeCount}</div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>Available for booking</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rounded-3 p-3 shadow-xs border" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Average Price</span>
              <span className="p-2 rounded-2" style={{ background: '#eff6ff', color: '#3b82f6' }}><DollarSign size={16} /></span>
            </div>
            <div className="fs-4 fw-extrabold" style={{ color: '#0D1B2E' }}>₹{avgPrice.toLocaleString('en-IN')}</div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>Per participant / tour</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="rounded-3 p-3 shadow-xs border" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</span>
              <span className="p-2 rounded-2" style={{ background: '#f5f3ff', color: '#8b5cf6' }}><Compass size={16} /></span>
            </div>
            <div className="fs-4 fw-extrabold" style={{ color: '#0D1B2E' }}>Inventory</div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>Direct Authoritative</div>
          </div>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="rounded-3 p-3 mb-4 shadow-sm border" style={{ background: '#fff' }}>
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
          <div className="position-relative flex-grow-1" style={{ maxWidth: '480px' }}>
            <Search size={16} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, location, category..."
              style={{ paddingLeft: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="d-flex align-items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn btn-sm px-3 py-1 rounded-pill fw-bold"
              style={{
                fontSize: '0.74rem',
                background: selectedCategory === cat ? '#0D1B2E' : '#f8fafc',
                color: selectedCategory === cat ? '#fff' : '#475569',
                border: '1px solid ' + (selectedCategory === cat ? '#0D1B2E' : '#e2e8f0'),
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Table / Cards */}
      <div className="rounded-3 shadow-sm border overflow-hidden" style={{ background: '#fff' }}>
        {loading ? (
          <div className="text-center py-5 text-muted">
            <RefreshCw size={24} className="spin mb-2" />
            <p className="mb-0 small">Loading activities & sightseeing inventory...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-5 px-3">
            <div className="rounded-circle d-inline-flex p-3 mb-3" style={{ background: 'rgba(255,99,51,0.08)', color: '#FF6333' }}>
              <Compass size={32} />
            </div>
            <h6 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>No Activities Found</h6>
            <p className="text-muted small mb-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
              {search || selectedCategory !== 'All'
                ? 'No activities match the search filter. Clear your filter to view all.'
                : 'No sightseeing or activities have been added yet. Click "+ Add Activity" to publish your first Goan attraction.'}
            </p>
            <button
              onClick={openAddModal}
              className="btn btn-sm rounded-3 fw-bold text-white px-3 py-2"
              style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', border: 'none' }}
            >
              <Plus size={15} className="me-1" /> Add New Activity
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle table-hover mb-0" style={{ fontSize: '0.85rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569', width: '60px' }}>Image</th>
                  <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Activity Details</th>
                  <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Category</th>
                  <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Location & Duration</th>
                  <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Price</th>
                  <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Status</th>
                  <th className="py-3 px-3 fw-bold text-end" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td className="py-2.5 px-3">
                      <div
                        className="rounded-2 overflow-hidden shadow-xs d-flex align-items-center justify-content-center"
                        style={{
                          width: '48px',
                          height: '48px',
                          background: item.image_url ? `url(${item.image_url}) center/cover no-repeat` : 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
                          color: '#fff',
                          fontSize: '0.7rem'
                        }}
                      >
                        {!item.image_url && <Compass size={20} />}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="fw-bold text-dark mb-0.5" style={{ fontSize: '0.88rem' }}>
                        {item.title || item.name}
                      </div>
                      {item.description && (
                        <div className="text-muted text-truncate" style={{ maxWidth: '320px', fontSize: '0.75rem' }}>
                          {item.description}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="badge rounded-pill px-2.5 py-1 fw-bold border border-teal-subtle" style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.72rem' }}>
                        🎯 {item.type || item.category || 'Activity'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="d-flex align-items-center gap-1 text-dark fw-medium" style={{ fontSize: '0.8rem' }}>
                        <MapPin size={13} className="text-danger flex-shrink-0" />
                        <span>{item.location || 'Goa'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.74rem' }}>
                        <Clock size={12} className="flex-shrink-0" />
                        <span>{item.duration || '2-3 Hours'}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="fw-extrabold text-success" style={{ fontSize: '0.92rem' }}>
                        ₹{parseInt(item.price || 0, 10).toLocaleString('en-IN')}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.68rem' }}>per person</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className="btn btn-sm p-0 border-0 d-inline-flex align-items-center gap-1"
                        title="Click to toggle status"
                      >
                        {item.is_active !== 0 ? (
                          <span className="badge rounded-pill px-2.5 py-1 fw-bold text-success border border-success-subtle" style={{ background: '#dcfce7', fontSize: '0.7rem' }}>
                            ● Active
                          </span>
                        ) : (
                          <span className="badge rounded-pill px-2.5 py-1 fw-bold text-secondary border border-secondary-subtle" style={{ background: '#f1f5f9', fontSize: '0.7rem' }}>
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 text-end">
                      <div className="d-inline-flex align-items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="btn btn-sm btn-light border p-1.5 rounded-2 text-dark"
                          title="Edit Activity"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.title || item.name)}
                          className="btn btn-sm btn-light border p-1.5 rounded-2 text-danger"
                          title="Delete Activity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Activity Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(13,27,46,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header py-3 px-4" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-2" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333' }}>
                    <MapIcon size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '1rem' }}>
                      {editingItem ? 'Edit Sightseeing & Activity' : 'Add New Sightseeing & Activity'}
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                      Enter the experience details, pricing, and showcase information.
                    </p>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body p-4">
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>
                      <AlertCircle size={15} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label fw-bold small text-secondary">Activity Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Scuba Diving at Grand Island with Photos & Videos"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-secondary">Category *</label>
                      <select
                        className="form-select"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="Water Sports">Water Sports</option>
                        <option value="Adventure">Adventure</option>
                        <option value="Sightseeing & Tours">Sightseeing & Tours</option>
                        <option value="Island Trips">Island Trips</option>
                        <option value="Heritage & Culture">Heritage & Culture</option>
                        <option value="Cruises & Waterways">Cruises & Waterways</option>
                        <option value="Nightlife & Events">Nightlife & Events</option>
                        <option value="Activity">General Activity</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-secondary">Price (₹ per person) *</label>
                      <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 2499"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          required
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-secondary">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. North Goa / Grand Island"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small text-secondary">Duration</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 3 Hours / Full Day"
                        value={formData.duration}
                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-bold small text-secondary">Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label fw-bold small text-secondary">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Detailed itinerary, inclusions, equipment provided, departure point, safety instructions..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-md-12">
                      <div className="form-check form-switch mt-1">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="activeSwitch"
                          checked={formData.is_active === 1}
                          onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                        />
                        <label className="form-check-label fw-semibold small" htmlFor="activeSwitch">
                          Active & Bookable by Customers & B2B Partners
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer py-2.5 px-4" style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary px-3 py-1.5 rounded-3 fw-semibold"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm px-4 py-1.5 rounded-3 fw-bold text-white shadow-sm"
                    style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', border: 'none' }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingItem ? 'Update Activity' : 'Publish Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
