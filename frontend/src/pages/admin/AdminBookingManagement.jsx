import React, { useState, useEffect } from 'react';
import {
  Calendar, Search, Filter, Plus, Edit2, Trash2, Eye, CheckCircle2,
  XCircle, Clock, AlertCircle, RefreshCw, DollarSign, User, Phone,
  MapPin, ChevronRight, X, Shield, FileText, Download
} from 'lucide-react';
import * as api from '../../services/api';

function StatusBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  if (s === 'confirmed') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-success border border-success-subtle" style={{ background: '#dcfce7', fontSize: '0.72rem' }}>Confirmed</span>;
  }
  if (s === 'completed') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-primary border border-primary-subtle" style={{ background: '#dbeafe', fontSize: '0.72rem' }}>Completed</span>;
  }
  if (s === 'cancelled' || s === 'rejected') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-danger border border-danger-subtle" style={{ background: '#fee2e2', fontSize: '0.72rem' }}>Cancelled</span>;
  }
  return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-warning border border-warning-subtle" style={{ background: '#fef9c3', color: '#854d0e', fontSize: '0.72rem' }}>Pending</span>;
}

function PaymentBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  if (s === 'paid' || s === 'full' || s === 'completed') {
    return <span className="badge rounded-pill px-2 py-0.5 fw-bold text-success bg-success-subtle" style={{ fontSize: '0.68rem' }}>Paid</span>;
  }
  if (s === 'partial' || s === 'advance') {
    return <span className="badge rounded-pill px-2 py-0.5 fw-bold text-info bg-info-subtle" style={{ fontSize: '0.68rem' }}>Partial</span>;
  }
  return <span className="badge rounded-pill px-2 py-0.5 fw-bold text-secondary bg-secondary-subtle" style={{ fontSize: '0.68rem' }}>Unpaid</span>;
}

export default function AdminBookingManagement({
  bookings: initialBookings = [],
  onRefreshBookings,
  currentUser,
  hotels = [],
  cars = [],
  bikes = []
}) {
  const [bookingsList, setBookingsList] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewBooking, setViewBooking] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Driver Assignment State
  const [driversList, setDriversList] = useState([]);
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [driverAssignMsg, setDriverAssignMsg] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceType: 'hotel',
    item_id: '',
    item_name: '',
    pickup_date: '',
    drop_date: '',
    pickup_loc: 'Goa',
    total_amount: '',
    amount_paid: '',
    payment_method: 'Cash',
    status: 'Confirmed',
    payment_status: 'Paid',
    customizations: '',
    driver_required: 0
  });

  const fetchLatestBookings = async () => {
    setLoading(true);
    try {
      const fresh = await api.fetchBookings();
      setBookingsList(fresh || []);
      if (onRefreshBookings) onRefreshBookings();
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDriversList = async () => {
    try {
      const drvs = await api.fetchDrivers();
      setDriversList(drvs || []);
    } catch (e) {
      console.error('Failed to fetch drivers in bookings:', e);
    }
  };

  useEffect(() => {
    fetchLatestBookings();
    loadDriversList();
  }, []);

  useEffect(() => {
    if (initialBookings && initialBookings.length > 0) {
      setBookingsList(initialBookings);
    }
  }, [initialBookings]);

  const handleAssignDriverSubmit = async (e) => {
    e.preventDefault();
    if (!assigningBooking || !selectedDriverId) return;
    setActionLoading(true);
    setFormError('');
    try {
      await api.assignDriver(assigningBooking.id, selectedDriverId, assignNotes);
      setDriverAssignMsg(`Driver successfully assigned to booking #${assigningBooking.id}!`);
      setTimeout(() => setDriverAssignMsg(''), 4000);
      setAssigningBooking(null);
      setSelectedDriverId('');
      setAssignNotes('');
      await fetchLatestBookings();
    } catch (err) {
      setFormError(err.message || 'Failed to assign driver.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Bookings
  const filteredBookings = (bookingsList || []).filter(b => {
    const s = (b.status || 'pending').toLowerCase();
    const matchStatus = statusFilter === 'all' || s === statusFilter.toLowerCase();
    
    // Channel filter
    const ch = (b.booking_channel || 'D2C').toUpperCase();
    const mode = (b.b2b_mode || '').toUpperCase();
    let matchChannel = true;
    if (channelFilter === 'D2C') matchChannel = ch === 'D2C';
    else if (channelFilter === 'B2B') matchChannel = ch === 'B2B';
    else if (channelFilter === 'COMMISSION') matchChannel = ch === 'B2B' && mode === 'COMMISSION';
    else if (channelFilter === 'NON_COMMISSION') matchChannel = ch === 'B2B' && mode === 'NON_COMMISSION';

    const query = search.toLowerCase();
    const matchSearch =
      String(b.id || '').toLowerCase().includes(query) ||
      String(b.name || b.customer_name || '').toLowerCase().includes(query) ||
      String(b.phone || '').toLowerCase().includes(query) ||
      String(b.item_name || '').toLowerCase().includes(query) ||
      String(b.b2b_partner_name || '').toLowerCase().includes(query) ||
      String(b.email || '').toLowerCase().includes(query);
    return matchStatus && matchChannel && matchSearch;
  });

  // Calculate Metrics
  const totalCount = bookingsList.length;
  const confirmedCount = bookingsList.filter(b => (b.status || '').toLowerCase() === 'confirmed').length;
  const pendingCount = bookingsList.filter(b => (b.status || '').toLowerCase() === 'pending').length;
  const totalRevenue = bookingsList.reduce((sum, b) => sum + Number(b.total_amount || b.total_paid || b.price || 0), 0);

  // Handle Create Booking
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.item_name) {
      setFormError('Please fill in required fields (Customer Name, Phone, and Item).');
      return;
    }

    setActionLoading(true);
    setFormError('');
    try {
      const isPkg = formData.serviceType === 'package' || formData.serviceType === 'custom';
      const isSd = formData.serviceType === 'selfdrive';
      const isCar = formData.serviceType === 'car';
      const isBike = formData.serviceType === 'bike';
      const isHotel = formData.serviceType === 'hotel';

      const payload = {
        name: formData.name,
        customer_name: formData.name,
        phone: formData.phone,
        customer_phone: formData.phone,
        email: formData.email || null,
        customer_email: formData.email || null,
        item_id: formData.item_id || `item-${Date.now()}`,
        item_name: formData.item_name,
        package_name: formData.item_name,
        package_type: isPkg ? 'Trip Package' : (isSd ? 'Self Drive Package' : (isCar ? 'Car Rental' : (isBike ? 'Bike Rental' : (isHotel ? 'Hotel Stay' : 'Trip Package')))),
        type: isPkg ? 'package' : (isSd ? 'selfdrive' : (isCar ? 'car' : (isBike ? 'bike' : (isHotel ? 'hotel' : 'package')))),
        pickup_date: formData.pickup_date || null,
        drop_date: formData.drop_date || null,
        pickup_loc: formData.pickup_loc || 'Goa',
        total_amount: Number(formData.total_amount || 0),
        total_paid: Number(formData.amount_paid || formData.total_amount || 0),
        amount_paid: Number(formData.amount_paid || 0),
        remaining_amount: Math.max(0, Number(formData.total_amount || 0) - Number(formData.amount_paid || 0)),
        payment_method: formData.payment_method || 'Cash',
        status: formData.status || 'Confirmed',
        payment_status: formData.payment_status || 'Paid',
        customizations: formData.customizations || null,
        booking_days: 1
      };

      await api.createBooking(payload);
      setShowCreateModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        serviceType: 'hotel',
        item_id: '',
        item_name: '',
        pickup_date: '',
        drop_date: '',
        pickup_loc: 'Goa',
        total_amount: '',
        amount_paid: '',
        payment_method: 'Cash',
        status: 'Confirmed',
        payment_status: 'Paid',
        customizations: ''
      });
      await fetchLatestBookings();
      alert('Booking created successfully and saved to database!');
    } catch (err) {
      setFormError(err.message || 'Failed to create booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Update Status
  const handleQuickStatusChange = async (bookingId, newStatus, currentPaymentStatus = null) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus, currentPaymentStatus);
      setBookingsList(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      if (editBooking && editBooking.id === bookingId) {
        setEditBooking(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editBooking) return;
    setActionLoading(true);
    try {
      await api.updateBookingStatus(editBooking.id, editBooking.status, editBooking.payment_status);
      setEditBooking(null);
      await fetchLatestBookings();
      alert('Booking updated successfully!');
    } catch (err) {
      alert('Failed to update booking: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Booking
  const handleDeleteBooking = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Booking #${id}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteBooking(id);
      setBookingsList(prev => prev.filter(b => b.id !== id));
      if (viewBooking?.id === id) setViewBooking(null);
      if (editBooking?.id === id) setEditBooking(null);
      await fetchLatestBookings();
    } catch (err) {
      alert('Failed to delete booking: ' + err.message);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '18px' }}>
            Booking Management
          </h5>
          <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>
            Track, create, update, and manage all customer reservations across hotels, vehicles, and trips.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1.5 bg-white shadow-sm"
            onClick={fetchLatestBookings}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm px-3.5 py-2 rounded-3 d-flex align-items-center gap-2 fw-bold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1e3a8a 100%)', border: 'none' }}
            onClick={() => { setFormError(''); setShowCreateModal(true); }}
          >
            <Plus size={16} />
            Create Booking
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #3b82f6' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Total Bookings</div>
                <div className="fs-4 fw-bold text-dark mt-1">{totalCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #10b981' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Confirmed</div>
                <div className="fs-4 fw-bold text-success mt-1">{confirmedCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-success-subtle text-success">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Pending Approval</div>
                <div className="fs-4 fw-bold text-warning mt-1">{pendingCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #8b5cf6' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Revenue Volume</div>
                <div className="fs-4 fw-bold text-dark mt-1">₹{totalRevenue.toLocaleString()}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-purple-subtle text-purple" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <DollarSign size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-3" style={{ background: '#fff' }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={15} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search booking ID, customer name, phone, item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-7 d-flex justify-content-md-end align-items-center gap-1.5 flex-wrap">
            <select
              className="form-select form-select-sm bg-light"
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              style={{ width: 'auto', fontSize: '0.75rem', fontWeight: '600' }}
            >
              <option value="all">🌐 All Channels</option>
              <option value="D2C">🔵 D2C Website</option>
              <option value="B2B">💼 All B2B Partners</option>
              <option value="COMMISSION">💰 B2B Commission</option>
              <option value="NON_COMMISSION">🏷️ B2B Non-Commission</option>
            </select>

            {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(tab => (
              <button
                key={tab}
                type="button"
                className={`btn btn-sm px-3 py-1 rounded-pill fw-semibold text-capitalize ${statusFilter === tab ? 'btn-dark' : 'btn-light border'}`}
                style={{ fontSize: '0.75rem' }}
                onClick={() => setStatusFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ background: '#fff' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.83rem' }}>
            <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <tr>
                <th className="ps-3 py-3">Booking ID</th>
                <th className="py-3">Channel</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Service / Item</th>
                <th className="py-3">Travel Dates</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Payment</th>
                <th className="pe-3 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <Calendar size={36} className="text-muted opacity-50 mb-2" />
                    <div>No bookings found matching the current filters.</div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const bId = b.id || b.booking_id;
                  const cName = b.name || b.customer_name || 'Customer';
                  const cPhone = b.phone || '—';
                  const itemName = b.item_name || b.service_name || 'Package / Stay';
                  const amount = Number(b.total_amount || b.total_paid || b.price || 0);
                  const isB2B = (b.booking_channel || '').toUpperCase() === 'B2B';
                  const b2bMode = (b.b2b_mode || '').toUpperCase();
                  
                  return (
                    <tr key={bId}>
                      <td className="ps-3 fw-bold text-dark font-monospace" style={{ fontSize: '0.8rem' }}>
                        #{bId}
                      </td>
                      <td>
                        {isB2B ? (
                          <div>
                            <span className={`badge rounded-pill px-2 py-0.5 fw-bold ${b2bMode === 'COMMISSION' ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary'}`} style={{ fontSize: '0.68rem' }}>
                              {b2bMode === 'COMMISSION' ? '💰 B2B Comm' : '🏷️ B2B Net'}
                            </span>
                            {b.b2b_partner_name && (
                              <div className="text-muted text-xxs mt-0.5 text-truncate" style={{ maxWidth: '110px' }} title={b.b2b_partner_name}>
                                {b.b2b_partner_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-2 py-0.5 fw-bold text-xxs">
                            🔵 D2C
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{cName}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{cPhone}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: '200px' }} title={itemName}>
                          {itemName}
                        </div>
                        {b.pickup_loc && (
                          <div className="text-muted small d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                            <MapPin size={11} /> {b.pickup_loc}
                          </div>
                        )}
                        {(['PICKUP', 'DROP', 'FULL'].includes(String(b.driver_service_type || '').toUpperCase()) || b.driver_required == 1 || b.driver_required === 'yes' || b.driver_required === true) && (
                          <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
                            <span className="badge rounded-pill bg-warning bg-opacity-25 text-dark fw-bold border border-warning" style={{ fontSize: '0.66rem' }}>
                              🚗 Driver: {b.driver_service_type || 'FULL'} (₹{b.driver_charge || (String(b.driver_service_type).toUpperCase() === 'FULL' ? (800 * Math.max(1, parseInt(b.driver_days || b.booking_days || 1))) : 400)})
                            </span>
                            {b.assigned_driver_id ? (
                              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle fw-semibold" style={{ fontSize: '0.66rem' }}>
                                🟢 Driver: {b.assigned_driver_name || b.assigned_driver_id} {b.assigned_driver_phone ? `(${b.assigned_driver_phone})` : ''} • {b.driver_job_status || 'Accepted'}
                              </span>
                            ) : (
                              <div className="d-flex align-items-center gap-1">
                                <span className="badge rounded-pill bg-warning-subtle text-dark border border-warning-subtle fw-bold" style={{ fontSize: '0.64rem' }}>
                                  ⚡ Open for Driver First-Accept
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-xs py-0 px-2 fw-bold text-white rounded-pill"
                                  style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.65rem' }}
                                  onClick={() => {
                                    setAssigningBooking(b);
                                    setSelectedDriverId('');
                                    setAssignNotes('');
                                  }}
                                >
                                  + Manual Assign
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="small fw-semibold">{b.pickup_date || '—'}</div>
                        {b.drop_date && <div className="text-muted small" style={{ fontSize: '0.72rem' }}>to {b.drop_date}</div>}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">₹{amount.toLocaleString()}</div>
                        {b.amount_paid !== undefined && (
                          <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                            Paid: ₹{Number(b.amount_paid || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm py-0.5 px-2 fw-semibold rounded-pill border-0 shadow-none"
                          style={{
                            width: 'auto',
                            fontSize: '0.75rem',
                            background: b.status === 'Confirmed' ? '#dcfce7' : b.status === 'Cancelled' ? '#fee2e2' : '#fef9c3',
                            color: b.status === 'Confirmed' ? '#166534' : b.status === 'Cancelled' ? '#991b1b' : '#854d0e',
                            cursor: 'pointer'
                          }}
                          value={b.status || 'Pending'}
                          onChange={e => handleQuickStatusChange(bId, e.target.value, b.payment_status)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <PaymentBadge status={b.payment_status} />
                      </td>
                      <td className="pe-3 text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-light btn-sm text-secondary"
                            title="View Details"
                            onClick={() => setViewBooking(b)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm text-primary"
                            title="Edit Booking"
                            onClick={() => setEditBooking({ ...b })}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-light btn-sm text-danger"
                            title="Delete Booking"
                            onClick={() => handleDeleteBooking(bId)}
                          >
                            <Trash2 size={14} />
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

      {/* CREATE BOOKING MODAL */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom py-3 px-4" style={{ background: '#f8fafc' }}>
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  Create New Manual Booking
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                      <AlertCircle size={16} /> {formError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-2"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Kulkarni"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-2"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-sm rounded-2"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="customer@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Pickup Location</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-2"
                        value={formData.pickup_loc}
                        onChange={e => setFormData({ ...formData, pickup_loc: e.target.value })}
                        placeholder="e.g. Dabolim Airport, Goa"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Service Type</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.serviceType}
                        onChange={e => {
                          const type = e.target.value;
                          setFormData({ ...formData, serviceType: type, item_name: '', item_id: '' });
                        }}
                      >
                        <option value="package">Trip Package</option>
                        <option value="selfdrive">Self-Drive Holiday</option>
                        <option value="hotel">Hotel Stay</option>
                        <option value="car">Self-Drive Car Rental</option>
                        <option value="bike">Rental Bike</option>
                        <option value="custom">Custom Trip Package</option>
                      </select>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-secondary">Select / Enter Item Name *</label>
                      {formData.serviceType === 'hotel' && hotels.length > 0 ? (
                        <select
                          className="form-select form-select-sm rounded-2"
                          value={formData.item_id}
                          onChange={e => {
                            const h = hotels.find(x => x.id === e.target.value);
                            setFormData({
                              ...formData,
                              item_id: e.target.value,
                              item_name: h ? h.name : '',
                              total_amount: h ? String(h.price || '') : formData.total_amount
                            });
                          }}
                          required
                        >
                          <option value="">-- Choose Hotel Property --</option>
                          {hotels.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (₹{h.price}/night)</option>
                          ))}
                        </select>
                      ) : formData.serviceType === 'car' && cars.length > 0 ? (
                        <select
                          className="form-select form-select-sm rounded-2"
                          value={formData.item_id}
                          onChange={e => {
                            const c = cars.find(x => x.id === e.target.value);
                            setFormData({
                              ...formData,
                              item_id: e.target.value,
                              item_name: c ? c.name : '',
                              total_amount: c ? String(c.price || '') : formData.total_amount
                            });
                          }}
                          required
                        >
                          <option value="">-- Choose Rental Car --</option>
                          {cars.map(c => (
                            <option key={c.id} value={c.id}>{c.name} (₹{c.price}/day)</option>
                          ))}
                        </select>
                      ) : formData.serviceType === 'bike' && bikes.length > 0 ? (
                        <select
                          className="form-select form-select-sm rounded-2"
                          value={formData.item_id}
                          onChange={e => {
                            const b = bikes.find(x => x.id === e.target.value);
                            setFormData({
                              ...formData,
                              item_id: e.target.value,
                              item_name: b ? b.name : '',
                              total_amount: b ? String(b.price || '') : formData.total_amount
                            });
                          }}
                          required
                        >
                          <option value="">-- Choose Rental Bike --</option>
                          {bikes.map(b => (
                            <option key={b.id} value={b.id}>{b.name} (₹{b.price}/day)</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-control form-control-sm rounded-2"
                          value={formData.item_name}
                          onChange={e => setFormData({ ...formData, item_name: e.target.value, item_id: 'custom-' + Date.now() })}
                          placeholder="e.g. 4D3N Luxury Goa Tour"
                          required
                        />
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Pickup / Check-in Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm rounded-2"
                        value={formData.pickup_date}
                        onChange={e => setFormData({ ...formData, pickup_date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Drop / Check-out Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm rounded-2"
                        value={formData.drop_date}
                        onChange={e => setFormData({ ...formData, drop_date: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Total Amount (₹) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm rounded-2"
                        value={formData.total_amount}
                        onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                        placeholder="e.g. 15000"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Amount Paid (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm rounded-2"
                        value={formData.amount_paid}
                        onChange={e => setFormData({ ...formData, amount_paid: e.target.value })}
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Payment Method</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.payment_method}
                        onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                      >
                        <option value="Cash">Cash on Delivery</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Razorpay">Razorpay Gateway</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Initial Booking Status</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Payment Status</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.payment_status}
                        onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                      >
                        <option value="Paid">Paid (Full)</option>
                        <option value="Partial">Partial (Advance)</option>
                        <option value="Pending">Pending / Unpaid</option>
                      </select>
                    </div>
                    <div className="col-12 mt-1">
                      <div className="form-check p-2 rounded bg-light border">
                        <input
                          type="checkbox"
                          className="form-check-input ms-0 me-2"
                          id="admin_drv_req"
                          checked={formData.driver_required == 1}
                          onChange={e => setFormData({ ...formData, driver_required: e.target.checked ? 1 : 0 })}
                        />
                        <label className="form-check-label small fw-bold text-dark" htmlFor="admin_drv_req">
                          🚗 Require Private Driver / Chauffeur for this booking
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-4 fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Create Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BOOKING DETAILS MODAL */}
      {viewBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white py-3 px-4">
                <h5 className="modal-title fw-bold fs-6">Booking #{viewBooking.id || viewBooking.booking_id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewBooking(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Status:</span>
                  <StatusBadge status={viewBooking.status} />
                </div>
                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Payment:</span>
                  <PaymentBadge status={viewBooking.payment_status} />
                </div>
                <hr className="my-2 text-muted opacity-25" />
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="text-muted small">Customer Name</div>
                    <div className="fw-bold">{viewBooking.name || viewBooking.customer_name || '—'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Phone</div>
                    <div className="fw-bold">{viewBooking.phone || '—'}</div>
                  </div>
                  <div className="col-12 mt-2">
                    <div className="text-muted small">Service / Item</div>
                    <div className="fw-semibold text-primary">{viewBooking.item_name || '—'}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Dates</div>
                    <div className="small fw-semibold">{viewBooking.pickup_date || '—'} to {viewBooking.drop_date || '—'}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Pickup Location</div>
                    <div className="small">{viewBooking.pickup_loc || 'Goa'}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Total Price</div>
                    <div className="fw-bold fs-6 text-dark">₹{Number(viewBooking.total_amount || viewBooking.total_paid || 0).toLocaleString()}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Payment Method</div>
                    <div className="small fw-semibold">{viewBooking.payment_method || 'Cash / Offline'}</div>
                  </div>
                </div>

                {/* Driver Requirement Info */}
                <div className="p-3 rounded-3 bg-light border mt-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small fw-bold text-dark">
                      Driver Requirement:
                    </span>
                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${(['PICKUP', 'DROP', 'FULL'].includes(String(viewBooking.driver_service_type || '').toUpperCase()) || viewBooking.driver_required == 1 || viewBooking.driver_required === 'yes') ? 'bg-warning text-dark' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.72rem' }}>
                      {viewBooking.driver_service_type ? `🚗 YES (${viewBooking.driver_service_type})` : ((viewBooking.driver_required == 1 || viewBooking.driver_required === 'yes') ? '🚗 YES (Driver Required)' : 'NO (Self Drive / Unrequested)')}
                    </span>
                  </div>
                  {(['PICKUP', 'DROP', 'FULL'].includes(String(viewBooking.driver_service_type || '').toUpperCase()) || viewBooking.driver_required == 1 || viewBooking.driver_required === 'yes') && (
                    <div className="mt-2 pt-2 border-top">
                      {viewBooking.assigned_driver_id ? (
                        <div className="small">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Assigned Driver:</span>
                            <span className="fw-bold text-success">
                              {viewBooking.assigned_driver_name || viewBooking.assigned_driver_id} ({viewBooking.driver_job_status || 'Accepted'})
                            </span>
                          </div>
                          {viewBooking.assigned_driver_phone && (
                            <div className="d-flex justify-content-between align-items-center mt-1">
                              <span className="text-muted">Driver Contact:</span>
                              <span className="fw-semibold text-dark">{viewBooking.assigned_driver_phone}</span>
                            </div>
                          )}
                          {viewBooking.assigned_driver_vehicle && (
                            <div className="d-flex justify-content-between align-items-center mt-1">
                              <span className="text-muted">Assigned Vehicle:</span>
                              <span className="text-dark">{viewBooking.assigned_driver_vehicle}</span>
                            </div>
                          )}
                          <div className="d-flex justify-content-between align-items-center mt-1 border-top pt-1">
                            <span className="text-muted">Driver Service & Fee:</span>
                            <span className="fw-bold text-dark">{viewBooking.driver_service_type || 'FULL'} • ₹{Number(viewBooking.driver_charge || (String(viewBooking.driver_service_type).toUpperCase() === 'FULL' ? (800 * Math.max(1, parseInt(viewBooking.driver_days || viewBooking.booking_days || 1))) : 400)).toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <span className="text-muted">Driver Earning Payout:</span>
                            <span className="fw-bold text-success">₹{Number(viewBooking.driver_earning || viewBooking.driver_charge || (String(viewBooking.driver_service_type).toUpperCase() === 'FULL' ? (800 * Math.max(1, parseInt(viewBooking.driver_days || viewBooking.booking_days || 1))) : 400)).toLocaleString()} • {viewBooking.driver_payment_status || (viewBooking.driver_job_status === 'Completed' ? 'Payable' : 'Pending')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">No driver assigned yet.</span>
                          <button
                            type="button"
                            className="btn btn-sm text-white fw-bold px-3 py-1 rounded-pill shadow-sm"
                            style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.75rem' }}
                            onClick={() => {
                              setAssigningBooking(viewBooking);
                              setViewBooking(null);
                            }}
                          >
                            Assign Driver Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top py-2 px-4 bg-light">
                <button type="button" className="btn btn-sm btn-secondary px-3" onClick={() => setViewBooking(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom py-3 px-4 bg-light">
                <h5 className="modal-title fw-bold fs-6">Edit Booking #{editBooking.id}</h5>
                <button type="button" className="btn-close" onClick={() => setEditBooking(null)} />
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Booking Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={editBooking.status || 'Pending'}
                      onChange={e => setEditBooking({ ...editBooking, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Payment Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={editBooking.payment_status || 'Pending'}
                      onChange={e => setEditBooking({ ...editBooking, payment_status: e.target.value })}
                    >
                      <option value="Paid">Paid (Full)</option>
                      <option value="Partial">Partial (Advance)</option>
                      <option value="Pending">Pending / Unpaid</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top py-2 px-4 bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditBooking(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-4 fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN DRIVER MODAL */}
      {assigningBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(11,25,44,0.6)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header text-white py-3 px-4" style={{ background: '#0D1B2E' }}>
                <h5 className="modal-title fw-bold fs-6">Assign Driver — Booking #{assigningBooking.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setAssigningBooking(null)} />
              </div>
              <form onSubmit={handleAssignDriverSubmit}>
                <div className="modal-body p-4">
                  <div className="p-3 rounded bg-light border mb-3 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Customer:</span>
                      <span className="fw-bold">{assigningBooking.name || assigningBooking.customer_name} ({assigningBooking.phone})</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Pickup Location:</span>
                      <span className="fw-bold">{assigningBooking.pickup_loc || 'Goa'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Service / Item:</span>
                      <span className="fw-bold">{assigningBooking.item_name}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Select Approved / Active Driver *
                    </label>
                    <select
                      className="form-select form-select-sm fw-semibold"
                      value={selectedDriverId}
                      onChange={e => setSelectedDriverId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Approved Driver --</option>
                      {driversList.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active').map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.phone} • {d.vehicle_details || 'Commercial'} • Status: {d.status})
                        </option>
                      ))}
                    </select>
                    {driversList.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active').length === 0 && (
                      <div className="text-danger small mt-1">
                        No approved drivers available. Please approve drivers in Driver Management.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Assignment Notes / Instructions (Optional)
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="e.g. Airport pickup at arrival gate 2..."
                      value={assignNotes}
                      onChange={e => setAssignNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAssigningBooking(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm px-4 fw-bold text-white shadow-sm"
                    style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}
                    disabled={actionLoading || !selectedDriverId}
                  >
                    {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
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
