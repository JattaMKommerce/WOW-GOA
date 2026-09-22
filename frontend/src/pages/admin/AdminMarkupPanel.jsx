import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Save, Percent, IndianRupee, PieChart, Users, Plane, Hotel, 
  Search, Filter, Plus, Edit2, Trash2, CheckCircle2, XCircle, Tag, Building2,
  Compass, Shield, MapPin, Eye, RefreshCw, AlertCircle
} from 'lucide-react';
import * as api from '../../services/api';

export default function AdminMarkupPanel({ 
  markups = [], 
  onSaveMarkup, 
  vendors = [], 
  bookings = [], 
  flights = [], 
  hotels = [], 
  cars = [], 
  bikes = [], 
  packages = [],
  currentUser
}) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [markupTypeFilter, setMarkupTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    id: 0,
    rule_name: '',
    vendor_id: 'all',
    service_type: 'vehicle',
    target_channel: 'b2b',
    markup_type: 'fixed',
    markup_value: 500,
    is_active: 1,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Load rules from backend
  const loadRules = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.fetchPricingRules({
        search: searchQuery,
        vendor_id: vendorFilter,
        service_type: serviceFilter,
        target_channel: channelFilter,
        status: statusFilter
      });
      if (res && res.success) {
        setRules(res.rules || []);
      } else {
        setRules(Array.isArray(markups) ? markups : []);
      }
    } catch (err) {
      console.warn('Fallback to prop markups:', err);
      setRules(Array.isArray(markups) ? markups : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [vendorFilter, serviceFilter, channelFilter, markupTypeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRules();
  };

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      id: 0,
      rule_name: '',
      vendor_id: 'all',
      service_type: 'vehicle',
      target_channel: 'b2b',
      markup_type: 'fixed',
      markup_value: 500,
      is_active: 1,
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      id: rule.id,
      rule_name: rule.rule_name || '',
      vendor_id: rule.vendor_id || 'all',
      service_type: rule.service_type || rule.entity_type || 'vehicle',
      target_channel: rule.target_channel || 'b2b',
      markup_type: rule.markup_type || (rule.amount > 0 ? 'fixed' : 'percentage'),
      markup_value: rule.markup_value || (rule.markup_type === 'percentage' ? rule.percentage : rule.amount) || 0,
      is_active: rule.is_active !== undefined ? rule.is_active : (rule.status === 'Active' ? 1 : 0),
      notes: rule.notes || ''
    });
    setModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.markup_value) < 0) {
      alert('Markup value cannot be negative.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await api.savePricingRule(formData);
      if (res && res.success) {
        setSuccessMsg(editingRule ? 'Rule updated successfully!' : 'Pricing rule created successfully!');
        setModalOpen(false);
        loadRules();
        if (onSaveMarkup) onSaveMarkup(formData);
      } else {
        alert(res.error || 'Failed to save rule.');
      }
    } catch (err) {
      alert(err.message || 'Error saving rule.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      const res = await api.deletePricingRule(id);
      if (res && res.success) {
        setRules(prev => prev.filter(r => r.id !== id));
        setSuccessMsg('Rule deleted successfully.');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete rule.');
    }
  };

  const handleToggleActive = async (rule) => {
    const newActive = (rule.is_active === 1 || rule.status === 'Active') ? 0 : 1;
    try {
      await api.savePricingRule({
        ...rule,
        is_active: newActive,
        status: newActive ? 'Active' : 'Inactive'
      });
      loadRules();
    } catch (err) {
      alert(err.message);
    }
  };

  // Sales report helper
  const getSales = (type) => {
    const filtered = bookings.filter(b => {
      if (!b.item_name) return false;
      if (type === 'flights') return b.item_name.includes('Flight') || b.item_id?.startsWith('FL-');
      if (type === 'hotels') return b.item_name.includes('Hotel') || b.item_id?.startsWith('hotel-');
      if (type === 'cars') return b.item_id?.startsWith('car-') && !b.item_id?.includes('bike');
      if (type === 'bikes') return b.item_id?.startsWith('bike-');
      if (type === 'packages') return !b.item_id?.startsWith('FL-') && !b.item_id?.startsWith('hotel-') && !b.item_id?.startsWith('car-') && !b.item_id?.startsWith('bike-') && !b.item_id?.startsWith('off_');
      return false;
    });
    const totalSales = filtered.reduce((sum, b) => sum + parseInt(b.total_paid || b.total_amount || 0), 0);
    return { count: filtered.length, total: totalSales };
  };

  const flightSales = getSales('flights');
  const hotelSales = getSales('hotels');
  const carSales = getSales('cars');
  const bikeSales = getSales('bikes');
  const packageSales = getSales('packages');
  const totalPlatformSales = flightSales.total + hotelSales.total + carSales.total + bikeSales.total + packageSales.total;

  return (
    <div className="animate-fade-in p-2">
      {/* Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary text-white text-xxs fw-bold px-2.5 py-0.5 rounded-pill">
                SUPER ADMIN &amp; ADMIN ACCESS
              </span>
              <span className="badge bg-light text-muted border text-xxs">
                Level 1 Wow Goa Markups
              </span>
            </div>
            <h4 className="fw-black mb-1 font-heading text-dark">
              Pricing &amp; Markup Management
            </h4>
            <p className="text-muted text-xs mb-0">
              Configure service-wise and vendor-specific markups for B2B Wholesale and B2C Retail channels.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn-warning text-dark btn-sm rounded-pill px-4 py-2 text-xs fw-bold font-heading shadow-sm d-inline-flex align-items-center gap-1.5"
          >
            <Plus size={16} /> Add Pricing Rule
          </button>
        </div>

        {successMsg && (
          <div className="alert alert-success py-2 px-3 rounded-3 text-xs mt-3 mb-0 d-flex align-items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <form onSubmit={handleSearchSubmit} className="mt-4 pt-3 border-top">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-3">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search rules, vendors..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm bg-light"
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value)}
              >
                <option value="all">All Services</option>
                <option value="hotel">Hotel</option>
                <option value="vehicle">Vehicle (Cars/Bikes)</option>
                <option value="driver">Driver / Chauffeur</option>
                <option value="flight">Flight</option>
                <option value="activity">Sightseeing / Activity</option>
                <option value="package">Tour Package</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm bg-light"
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value)}
              >
                <option value="all">All Channels</option>
                <option value="b2b">B2B Wholesale</option>
                <option value="b2c">B2C Retail</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm bg-light"
                value={vendorFilter}
                onChange={e => setVendorFilter(e.target.value)}
              >
                <option value="all">All Vendors (Global)</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.company_name || v.name || v.username} ({v.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm bg-light"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-12 col-md-1 text-end">
              <button type="submit" className="btn btn-dark btn-sm rounded-pill w-100 text-xs fw-bold">
                Filter
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Rules Table & Sales Highlights */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-dark font-heading">
                Configured Pricing Rules ({rules.length})
              </h6>
              <button type="button" onClick={loadRules} className="btn btn-link text-muted btn-sm p-0 text-decoration-none">
                <RefreshCw size={13} className="me-1" /> Refresh
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-xs">
                <thead className="table-light text-xxs text-muted text-uppercase">
                  <tr>
                    <th className="ps-3 py-3">Rule Name</th>
                    <th>Vendor Target</th>
                    <th>Service</th>
                    <th>Channel</th>
                    <th>Markup</th>
                    <th>Status</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Loading pricing rules...
                      </td>
                    </tr>
                  ) : rules.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No pricing rules found matching criteria. Click <strong>Add Pricing Rule</strong> to create one.
                      </td>
                    </tr>
                  ) : (
                    rules.map(r => {
                      const isActive = (r.is_active === 1 || r.status === 'Active');
                      const mType = r.markup_type || (r.amount > 0 ? 'fixed' : 'percentage');
                      const mVal = r.markup_value || (mType === 'percentage' ? r.percentage : r.amount) || 0;

                      return (
                        <tr key={r.id}>
                          <td className="ps-3 py-3">
                            <strong className="text-dark d-block">{r.rule_name || 'Service Markup'}</strong>
                            {r.notes && <span className="text-muted text-xxs">{r.notes}</span>}
                          </td>

                          <td>
                            {r.vendor_id && r.vendor_id !== 'all' && r.vendor_id !== 'global' ? (
                              <span className="badge bg-light text-dark border text-xxs">
                                {r.vendor_company || r.vendor_name || r.vendor_id}
                              </span>
                            ) : (
                              <span className="badge bg-secondary bg-opacity-10 text-secondary text-xxs">
                                Global (All Vendors)
                              </span>
                            )}
                          </td>

                          <td>
                            <span className="badge bg-light text-dark border text-xxs text-capitalize">
                              {r.service_type || r.entity_type || 'All'}
                            </span>
                          </td>

                          <td>
                            <span className={`badge ${r.target_channel === 'b2b' ? 'bg-primary text-white' : (r.target_channel === 'b2c' ? 'bg-info text-white' : 'bg-dark text-white')} text-xxs`}>
                              {String(r.target_channel || 'All').toUpperCase()}
                            </span>
                          </td>

                          <td>
                            <strong className="text-dark">
                              {mType === 'percentage' ? `+${mVal}%` : `+₹${parseFloat(mVal).toLocaleString('en-IN')}`}
                            </strong>
                            <span className="text-muted text-3xs d-block">
                              {mType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(r)}
                              className={`badge border-0 rounded-pill px-2.5 py-1 text-3xs fw-bold ${isActive ? 'bg-success text-white' : 'bg-secondary text-white'}`}
                              style={{ cursor: 'pointer' }}
                              title="Click to toggle status"
                            >
                              {isActive ? '✓ Active' : '✕ Inactive'}
                            </button>
                          </td>

                          <td className="pe-3 text-end">
                            <div className="d-inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(r)}
                                className="btn btn-outline-dark btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold"
                                title="Edit Rule"
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(r.id)}
                                className="btn btn-outline-danger btn-xs rounded-circle p-1"
                                title="Delete Rule"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sales & Revenue Overview Column */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 font-heading text-dark">
              <PieChart size={18} className="text-warning" /> Sales &amp; Platform Revenue
            </h6>

            <div className="d-flex flex-column gap-2.5">
              <div className="p-3 bg-light rounded-3 border-start border-4 border-primary">
                <div className="text-muted text-xxs fw-bold text-uppercase"><Plane size={12} className="me-1" /> Flight Revenue</div>
                <h4 className="mb-0 text-dark fw-bold font-monospace">₹{flightSales.total.toLocaleString()}</h4>
                <small className="text-muted text-xxs">{flightSales.count} bookings</small>
              </div>

              <div className="p-3 bg-light rounded-3 border-start border-4 border-success">
                <div className="text-muted text-xxs fw-bold text-uppercase"><Hotel size={12} className="me-1" /> Hotel Revenue</div>
                <h4 className="mb-0 text-dark fw-bold font-monospace">₹{hotelSales.total.toLocaleString()}</h4>
                <small className="text-muted text-xxs">{hotelSales.count} bookings</small>
              </div>

              <div className="p-3 bg-light rounded-3 border-start border-4 border-info">
                <div className="text-muted text-xxs fw-bold text-uppercase"><Shield size={12} className="me-1" /> Vehicle &amp; Bike Rentals</div>
                <h4 className="mb-0 text-dark fw-bold font-monospace">₹{(carSales.total + bikeSales.total).toLocaleString()}</h4>
                <small className="text-muted text-xxs">{carSales.count + bikeSales.count} bookings</small>
              </div>

              <div className="p-3 bg-light rounded-3 border-start border-4 border-warning">
                <div className="text-muted text-xxs fw-bold text-uppercase"><Compass size={12} className="me-1" /> Tour Packages</div>
                <h4 className="mb-0 text-dark fw-bold font-monospace">₹{packageSales.total.toLocaleString()}</h4>
                <small className="text-muted text-xxs">{packageSales.count} bookings</small>
              </div>

              <div className="p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-30 mt-2">
                <div className="text-muted text-xxs fw-bold text-uppercase">Total Platform Volume</div>
                <h3 className="mb-0 text-dark fw-black font-monospace">₹{totalPlatformSales.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Pricing Rule Modal */}
      {modalOpen && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 99999 }}>
          <div className="card border-0 rounded-4 shadow-2xl p-4 bg-white" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
              <h6 className="fw-bold mb-0 font-heading text-dark">
                {editingRule ? 'Edit Pricing & Markup Rule' : 'Create New Pricing Rule'}
              </h6>
              <button type="button" className="btn btn-link text-muted p-0" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule}>
              <div className="row g-3 text-start">
                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Goa Vehicle B2B Standard Markup"
                    className="form-control form-control-sm"
                    value={formData.rule_name}
                    onChange={e => setFormData({ ...formData, rule_name: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Service Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.service_type}
                    onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                  >
                    <option value="hotel">Hotel</option>
                    <option value="vehicle">Vehicle (Car &amp; Bike)</option>
                    <option value="driver">Driver / Chauffeur</option>
                    <option value="flight">Flight</option>
                    <option value="activity">Sightseeing / Activity</option>
                    <option value="package">Package</option>
                    <option value="all">All Services (Global)</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Target Channel</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.target_channel}
                    onChange={e => setFormData({ ...formData, target_channel: e.target.value })}
                  >
                    <option value="b2b">B2B Wholesale</option>
                    <option value="b2c">B2C Retail</option>
                    <option value="all">All Channels</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Target Vendor</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.vendor_id}
                    onChange={e => setFormData({ ...formData, vendor_id: e.target.value })}
                  >
                    <option value="all">All Vendors (Global Default Rule)</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.company_name || v.name || v.username} — {v.role}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted text-3xs mt-1 d-block">
                    * Specific vendor rules take precedence over global rules during price calculation.
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Markup Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={formData.markup_type}
                    onChange={e => setFormData({ ...formData, markup_type: e.target.value })}
                  >
                    <option value="fixed">Fixed Amount (+ ₹)</option>
                    <option value="percentage">Percentage (+ %)</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Markup Value</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0">
                      {formData.markup_type === 'fixed' ? '₹' : '%'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step={formData.markup_type === 'percentage' ? '0.5' : '50'}
                      required
                      placeholder={formData.markup_type === 'fixed' ? "e.g. 500" : "e.g. 5"}
                      className="form-control"
                      value={formData.markup_value}
                      onChange={e => setFormData({ ...formData, markup_value: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-2.5 bg-light rounded-3 border text-xxs text-muted">
                    <strong className="text-dark d-block mb-1">Calculation Example:</strong>
                    If Vendor Base Price is ₹10,000:
                    <div className="fw-bold text-primary mt-0.5">
                      {formData.markup_type === 'percentage'
                        ? `Markup = ₹${(10000 * (parseFloat(formData.markup_value || 0) / 100)).toLocaleString('en-IN')} → B2B Wholesale Price = ₹${(10000 + (10000 * (parseFloat(formData.markup_value || 0) / 100))).toLocaleString('en-IN')}`
                        : `Markup = ₹${parseFloat(formData.markup_value || 0).toLocaleString('en-IN')} → B2B Wholesale Price = ₹${(10000 + parseFloat(formData.markup_value || 0)).toLocaleString('en-IN')}`
                      }
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Notes / Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Internal memo or reason for markup rate"
                    className="form-control form-control-sm"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="col-12">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="ruleActiveSwitch"
                      checked={formData.is_active === 1}
                      onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    />
                    <label className="form-check-label text-xs fw-semibold text-dark" htmlFor="ruleActiveSwitch">
                      Rule Active and Operational
                    </label>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3 text-xs" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-warning text-dark btn-sm rounded-pill px-4 text-xs fw-bold">
                  {submitting ? 'Saving...' : 'Save Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
