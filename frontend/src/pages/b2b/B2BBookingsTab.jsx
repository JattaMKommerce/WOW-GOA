import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, Gift, Tag, CheckCircle2, Clock, XCircle, 
  Eye, FileText, Download, Building2, User, Phone, MapPin, Printer, X
} from 'lucide-react';
import * as api from '../../services/api';

export default function B2BBookingsTab({ partnerUser, forcedMode = null }) {
  // If forcedMode is passed ('COMMISSION' or 'NON_COMMISSION'), it locks strictly to that mode
  const [activeMode, setActiveMode] = useState(
    forcedMode || (partnerUser?.allow_commission ? 'COMMISSION' : 'NON_COMMISSION')
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (forcedMode) {
      setActiveMode(forcedMode);
    }
  }, [forcedMode]);

  const loadBookings = async () => {
    if (!partnerUser?.id) return;
    setLoading(true);
    try {
      const data = await api.fetchB2BBookings(partnerUser.id, {
        mode: activeMode,
        status: statusFilter,
        search: searchQuery
      });
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load B2B bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [partnerUser, activeMode, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBookings();
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();
    switch (s) {
      case 'confirmed':
      case 'completed':
        return <span className="badge bg-success bg-opacity-15 text-success border border-success text-xxs px-2.5 py-1 rounded-pill">✓ Confirmed</span>;
      case 'cancelled':
        return <span className="badge bg-danger bg-opacity-15 text-danger border border-danger text-xxs px-2.5 py-1 rounded-pill">✕ Cancelled</span>;
      default:
        return <span className="badge bg-warning bg-opacity-20 text-dark border border-warning text-xxs px-2.5 py-1 rounded-pill">⏳ Pending</span>;
    }
  };

  const getCommStatusBadge = (commStatus) => {
    const cs = (commStatus || 'pending').toLowerCase();
    switch (cs) {
      case 'credited':
      case 'settled':
      case 'paid':
        return <span className="badge bg-success text-white text-xxs px-2 py-0.5 rounded-pill">Credited</span>;
      default:
        return <span className="badge bg-secondary text-white text-xxs px-2 py-0.5 rounded-pill">Accrued (Pending)</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className={`badge ${activeMode === 'COMMISSION' ? 'bg-warning text-dark' : 'bg-primary text-white'} text-xxs fw-bold px-2.5 py-0.5 rounded-pill`}>
                {activeMode === 'COMMISSION' ? 'COMMISSION BOOKINGS' : 'NET WHOLESALE BOOKINGS'}
              </span>
              <span className="badge bg-light text-muted border text-xxs">
                Isolated B2B Channel
              </span>
            </div>
            <h4 className="fw-bold mb-0 font-heading text-dark">
              {activeMode === 'COMMISSION' ? 'Agent Commission Bookings' : 'Net Wholesale Bookings'}
            </h4>
            <p className="text-muted text-xs mb-0 mt-1">
              {activeMode === 'COMMISSION' 
                ? 'Review bookings where customer paid retail selling price and commission is earned by your agency.'
                : 'Review bookings purchased directly at net wholesale B2B rates for your clients.'}
            </p>
          </div>

          {/* If not forced to a single mode, allow switching between the two database-approved tabs */}
          {!forcedMode && partnerUser?.allow_commission && partnerUser?.allow_non_commission && (
            <div className="d-flex p-1 bg-light rounded-pill border">
              <button
                type="button"
                onClick={() => setActiveMode('COMMISSION')}
                className={`btn btn-xs py-1.5 px-3 rounded-pill fw-bold text-xs d-flex align-items-center gap-1.5 ${
                  activeMode === 'COMMISSION' ? 'btn-warning text-dark shadow-sm' : 'btn-link text-muted text-decoration-none'
                }`}
              >
                <Gift size={13} /> Commission Bookings
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('NON_COMMISSION')}
                className={`btn btn-xs py-1.5 px-3 rounded-pill fw-bold text-xs d-flex align-items-center gap-1.5 ${
                  activeMode === 'NON_COMMISSION' ? 'btn-primary text-white shadow-sm' : 'btn-link text-muted text-decoration-none'
                }`}
              >
                <Tag size={13} /> Net Bookings
              </button>
            </div>
          )}
        </div>

        {/* Filter controls */}
        <form onSubmit={handleSearchSubmit} className="mt-3 pt-3 border-top">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by booking ID, guest name, phone, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm bg-light"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Booking Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-6 col-md-3 text-end">
              <button type="submit" className="btn btn-dark btn-sm rounded-pill px-3 w-100 fw-bold text-xs">
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bookings Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-xs">
            <thead className="table-light text-muted text-uppercase text-xxs">
              <tr>
                <th className="ps-3 py-3">Booking ID</th>
                <th>Service / Itinerary</th>
                <th>Guest Details</th>
                <th>Schedule</th>
                <th>Retail Amount</th>
                {activeMode === 'COMMISSION' ? (
                  <>
                    <th>Commission</th>
                    <th>Comm. Status</th>
                  </>
                ) : (
                  <>
                    <th>Net Discount</th>
                    <th>Net Paid</th>
                  </>
                )}
                <th>Status</th>
                <th className="pe-3 text-end">Voucher</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-warning me-2" role="status" />
                    Loading {activeMode} bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <FileText size={32} className="mx-auto text-muted opacity-50 mb-2 d-block" />
                    <p className="mb-0 fw-semibold text-dark">No {activeMode} bookings recorded</p>
                    <span className="text-xxs">Bookings created under this mode will appear here with full vouchers.</span>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const totalAmt = parseFloat(b.total_amount || 0);
                  const commAmt = parseFloat(b.b2b_commission_amount || 0);
                  const commPct = parseFloat(b.b2b_commission_percentage || partnerUser?.default_commission_rate || 10);
                  const netDiscountPct = parseFloat(b.b2b_net_discount_percentage || partnerUser?.default_net_discount_rate || 10);
                  const netPrice = parseFloat(b.b2b_net_price || totalAmt - (totalAmt * (netDiscountPct / 100)));

                  return (
                    <tr key={b.id}>
                      <td className="ps-3 py-3">
                        <strong className="text-dark font-monospace">#{b.id}</strong>
                        <span className="d-block text-xxs text-muted">
                          {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </td>

                      <td>
                        <strong className="text-dark d-block text-truncate" style={{ maxWidth: '180px' }}>
                          {b.item_name || 'WOW Goa Service'}
                        </strong>
                        <span className="badge bg-light text-muted border text-xxs">
                          {b.type ? b.type.toUpperCase() : 'B2B'}
                        </span>
                      </td>

                      <td>
                        <strong className="text-dark d-block">{b.name || 'Valued Guest'}</strong>
                        <span className="text-muted text-xxs">{b.phone || '—'}</span>
                      </td>

                      <td>
                        <span className="text-dark d-block">{b.pickup_date || b.departure_date || 'Date scheduled'}</span>
                        <span className="text-muted text-xxs">{b.days_count || b.days || '1 Day'}</span>
                      </td>

                      <td>
                        <strong className="text-dark">₹{totalAmt.toLocaleString()}</strong>
                      </td>

                      {activeMode === 'COMMISSION' ? (
                        <>
                          <td className="text-success fw-bold">
                            +₹{commAmt.toLocaleString()}
                            <span className="text-xxs text-muted d-block">({commPct}%)</span>
                          </td>
                          <td>
                            {getCommStatusBadge(b.b2b_commission_status)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="text-primary fw-semibold">
                            {netDiscountPct}% OFF
                          </td>
                          <td className="text-dark fw-bold">
                            ₹{netPrice.toLocaleString()}
                          </td>
                        </>
                      )}

                      <td>
                        {getStatusBadge(b.status)}
                      </td>

                      <td className="pe-3 text-end">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="btn btn-outline-dark btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold d-inline-flex align-items-center gap-1"
                        >
                          <Eye size={12} /> Voucher
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Voucher Modal */}
      {selectedBooking && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(13, 27, 46, 0.75)', zIndex: 1050, backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in"
            style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}
          >
            {/* Voucher Header */}
            <div className="p-3.5 text-white d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E' }}>
              <div>
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill mb-1">
                  OFFICIAL B2B CONFIRMATION VOUCHER
                </span>
                <h5 className="fw-bold mb-0 text-white font-heading">Booking #{selectedBooking.id}</h5>
              </div>
              <button 
                className="btn btn-link text-white-50 p-0 border-0" 
                onClick={() => setSelectedBooking(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Voucher Body */}
            <div className="p-4 overflow-y-auto flex-grow-1" id="printable-voucher">
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
                <div>
                  <h6 className="fw-bold text-dark mb-0 font-heading">WOW GOA B2B CHANNEL</h6>
                  <span className="text-muted text-xxs">Partner: {partnerUser?.company_name || 'Agency'}</span>
                </div>
                <div className="text-end">
                  <span className="badge bg-dark text-white text-xxs px-2 py-1">
                    {selectedBooking.b2b_mode || activeMode}
                  </span>
                  <span className="d-block text-muted text-xxs mt-1">
                    {new Date(selectedBooking.created_at || Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Service Details */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <span className="text-xxs text-muted text-uppercase fw-bold d-block mb-1">Reserved Service</span>
                <h6 className="fw-bold text-dark mb-1 font-heading">{selectedBooking.item_name}</h6>
                <div className="text-xs text-muted">
                  Schedule: <strong>{selectedBooking.pickup_date || selectedBooking.departure_date}</strong>
                  {selectedBooking.drop_date && ` → ${selectedBooking.drop_date}`}
                </div>
                {selectedBooking.pickup_location && (
                  <div className="text-xs text-muted mt-1">
                    Pickup: {selectedBooking.pickup_location}
                  </div>
                )}
              </div>

              {/* Guest Details */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <span className="text-xxs text-muted text-uppercase fw-bold d-block mb-1">Guest Information</span>
                <div className="row g-2 text-xs">
                  <div className="col-6">
                    <span className="text-muted d-block text-xxs">Name:</span>
                    <strong className="text-dark">{selectedBooking.name}</strong>
                  </div>
                  <div className="col-6">
                    <span className="text-muted d-block text-xxs">Phone:</span>
                    <strong className="text-dark">{selectedBooking.phone}</strong>
                  </div>
                  {selectedBooking.email && (
                    <div className="col-12">
                      <span className="text-muted d-block text-xxs">Email:</span>
                      <strong className="text-dark">{selectedBooking.email}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="p-3 rounded-3 border mb-3">
                <span className="text-xxs text-muted text-uppercase fw-bold d-block mb-2">Financial Breakdown</span>
                <div className="text-xs">
                  <div className="d-flex justify-content-between py-1 text-muted">
                    <span>Selling Retail Price:</span>
                    <span>₹{parseFloat(selectedBooking.total_amount || 0).toLocaleString()}</span>
                  </div>

                  {selectedBooking.b2b_mode === 'COMMISSION' || activeMode === 'COMMISSION' ? (
                    <>
                      <div className="d-flex justify-content-between py-1 text-success fw-semibold">
                        <span>Agent Commission Earned:</span>
                        <span>+₹{parseFloat(selectedBooking.b2b_commission_amount || 0).toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-dark fs-6 mt-1">
                        <span>Payout to WOW Goa:</span>
                        <span>₹{(parseFloat(selectedBooking.total_amount || 0) - parseFloat(selectedBooking.b2b_commission_amount || 0)).toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between py-1 text-primary fw-semibold">
                        <span>B2B Net Discount:</span>
                        <span>{selectedBooking.b2b_net_discount_percentage || 10}% OFF</span>
                      </div>
                      <div className="d-flex justify-content-between py-1.5 border-top fw-bold text-primary fs-6 mt-1">
                        <span>Total Net Rate Paid:</span>
                        <span>₹{parseFloat(selectedBooking.b2b_net_price || selectedBooking.total_amount || 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-center text-muted text-xxs">
                <span>Verified WOW GOA B2B Reservation • 24/7 Agent Support Available</span>
              </div>
            </div>

            {/* Voucher Footer */}
            <div className="p-3 border-top bg-light d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm rounded-pill px-3 d-flex align-items-center gap-1 text-xs"
                onClick={() => window.print()}
              >
                <Printer size={13} /> Print Voucher
              </button>
              <button
                type="button"
                className="btn btn-dark btn-sm rounded-pill px-3 text-xs"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
