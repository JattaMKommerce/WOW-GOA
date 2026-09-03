import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Gift, Tag, Clock, CheckCircle2, XCircle, AlertCircle, 
  Search, Filter, ShieldCheck, Check, X, FileText, ArrowRight, Settings,
  Eye, RefreshCw, DollarSign, Calendar, TrendingUp
} from 'lucide-react';
import * as api from '../../../services/api';

export default function AdminB2BPortal({ activeSubTab = 'b2b_dashboard', onNavigateSubTab }) {
  const [partners, setPartners] = useState([]);
  const [modeRequests, setModeRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalTarget, setRejectModalTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('Application does not meet requirements.');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [partnersData, modeReqsData, bookingsData, rulesData] = await Promise.all([
        api.fetchB2BPartners(),
        api.fetchB2BModeRequests(),
        api.fetchB2BBookings('all', { mode: '' }),
        api.fetchB2BPricingRules()
      ]);
      setPartners(Array.isArray(partnersData) ? partnersData : []);
      setModeRequests(Array.isArray(modeReqsData) ? modeReqsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setPricingRules(Array.isArray(rulesData) ? rulesData : []);
    } catch (err) {
      console.warn('Error loading Admin B2B data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const handleApprovePartner = async (partnerId) => {
    setActionLoading(true);
    setFeedbackMsg('');
    setFeedbackError('');
    try {
      const res = await api.b2bApprovePartner(partnerId);
      if (res && res.success) {
        setFeedbackMsg(`Partner #${partnerId} approved successfully! Initial mode is now enabled.`);
        await loadData();
      } else {
        setFeedbackError(res.error || 'Failed to approve partner.');
      }
    } catch (err) {
      setFeedbackError(err.message || 'Error approving partner.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTarget) return;
    setActionLoading(true);
    try {
      if (rejectModalTarget.isModeRequest) {
        const res = await api.b2bRejectModeRequest(rejectModalTarget.id, rejectReason);
        if (res && res.success) {
          setFeedbackMsg(`Mode request for ${rejectModalTarget.company_name} rejected.`);
        }
      } else {
        const res = await api.b2bRejectPartner(rejectModalTarget.id, rejectReason);
        if (res && res.success) {
          setFeedbackMsg(`Partner application for ${rejectModalTarget.company_name} rejected.`);
        }
      }
      setRejectModalTarget(null);
      await loadData();
    } catch (err) {
      setFeedbackError(err.message || 'Error rejecting request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveModeRequest = async (partnerId) => {
    setActionLoading(true);
    setFeedbackMsg('');
    setFeedbackError('');
    try {
      const res = await api.b2bApproveModeRequest(partnerId);
      if (res && res.success) {
        setFeedbackMsg(`Additional mode approved successfully! Partner now has access to both modes.`);
        await loadData();
      } else {
        setFeedbackError(res.error || 'Failed to approve mode request.');
      }
    } catch (err) {
      setFeedbackError(err.message || 'Error approving mode request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter helpers
  const pendingApplications = partners.filter(p => p.status === 'pending');
  const commissionPartners = partners.filter(p => p.allow_commission == 1);
  const nonCommissionPartners = partners.filter(p => p.allow_non_commission == 1);
  const commissionBookings = bookings.filter(b => b.b2b_mode === 'COMMISSION');
  const nonCommissionBookings = bookings.filter(b => b.b2b_mode === 'NON_COMMISSION');

  const filteredPartnersList = () => {
    let list = partners;
    if (activeSubTab === 'b2b_applications') list = pendingApplications;
    else if (activeSubTab === 'b2b_commission_partners') list = commissionPartners;
    else if (activeSubTab === 'b2b_non_commission_partners') list = nonCommissionPartners;

    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(p => 
      (p.company_name || '').toLowerCase().includes(q) ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q)
    );
  };

  return (
    <div className="animate-fade-in p-2 p-md-3">
      {/* Subnav Pills for B2B First-Class Section */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4" style={{ background: '#10243A', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-3 bg-warning text-dark fw-bold">
              <Building2 size={20} />
            </div>
            <div>
              <h5 className="fw-black text-white font-heading mb-0">B2B Distribution Management</h5>
              <span className="text-white-50 text-xxs">Official WOW GOA Travel Agent & Agency Distribution Hub</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              onClick={loadData} 
              disabled={loading}
              className="btn btn-outline-light btn-xs rounded-pill px-3 py-1 text-xxs d-flex align-items-center gap-1"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Sub-tab buttons */}
        <div className="d-flex gap-1.5 flex-wrap mt-3 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {[
            { id: 'b2b_dashboard', label: 'B2B Dashboard', count: null },
            { id: 'b2b_applications', label: 'Partner Applications', count: pendingApplications.length, badgeBg: 'bg-warning text-dark' },
            { id: 'b2b_all_partners', label: 'All Partners', count: partners.length },
            { id: 'b2b_commission_partners', label: 'Commission Partners', count: commissionPartners.length },
            { id: 'b2b_non_commission_partners', label: 'Non-Commission Partners', count: nonCommissionPartners.length },
            { id: 'b2b_mode_requests', label: 'Mode Change Requests', count: modeRequests.length, badgeBg: 'bg-danger text-white' },
            { id: 'b2b_commission_bookings', label: 'Commission Bookings', count: commissionBookings.length },
            { id: 'b2b_non_commission_bookings', label: 'Non-Commission Bookings', count: nonCommissionBookings.length },
            { id: 'b2b_settings', label: 'B2B Settings & Rules', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigateSubTab ? onNavigateSubTab(tab.id) : null}
              className={`btn btn-xs py-1.5 px-3 rounded-pill fw-semibold text-xxs d-flex align-items-center gap-1.5 transition-all ${
                activeSubTab === tab.id
                  ? 'btn-warning text-dark shadow-sm fw-bold'
                  : 'btn-dark text-white-50 border-0'
              }`}
              style={{ background: activeSubTab === tab.id ? '#FFC107' : 'rgba(255,255,255,0.06)' }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`badge rounded-pill ${tab.badgeBg || 'bg-light text-dark'} text-3xs px-1.5 py-0.5`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications / Feedback */}
      {feedbackMsg && (
        <div className="alert alert-success py-2.5 px-3 rounded-3 text-xs mb-3 d-flex align-items-center justify-content-between shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={16} className="text-success" />
            <span>{feedbackMsg}</span>
          </div>
          <button className="btn btn-link p-0 text-muted" onClick={() => setFeedbackMsg('')}><X size={14} /></button>
        </div>
      )}
      {feedbackError && (
        <div className="alert alert-danger py-2.5 px-3 rounded-3 text-xs mb-3 d-flex align-items-center justify-content-between shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <AlertCircle size={16} className="text-danger" />
            <span>{feedbackError}</span>
          </div>
          <button className="btn btn-link p-0 text-muted" onClick={() => setFeedbackError('')}><X size={14} /></button>
        </div>
      )}

      {/* SUB-VIEW 1: B2B DASHBOARD */}
      {activeSubTab === 'b2b_dashboard' && (
        <div className="animate-fade-in">
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-warning h-100">
                <div className="text-muted text-xxs fw-bold text-uppercase">Pending Applications</div>
                <div className="fs-3 fw-black text-dark font-heading mt-1">{pendingApplications.length}</div>
                <span className="text-xxs text-muted">Awaiting Admin Verification</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-danger h-100">
                <div className="text-muted text-xxs fw-bold text-uppercase">Mode Change Requests</div>
                <div className="fs-3 fw-black text-danger font-heading mt-1">{modeRequests.length}</div>
                <span className="text-xxs text-muted">Agents requesting 2nd mode</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-success h-100">
                <div className="text-muted text-xxs fw-bold text-uppercase">Active Commission Partners</div>
                <div className="fs-3 fw-black text-success font-heading mt-1">{commissionPartners.length}</div>
                <span className="text-xxs text-muted">Selling at retail with commission</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-primary h-100">
                <div className="text-muted text-xxs fw-bold text-uppercase">Active Net Rate Partners</div>
                <div className="fs-3 fw-black text-primary font-heading mt-1">{nonCommissionPartners.length}</div>
                <span className="text-xxs text-muted">Buying at wholesale B2B rates</span>
              </div>
            </div>
          </div>

          {/* Quick Pending Items alert cards */}
          {pendingApplications.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-start border-4 border-warning">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <Clock size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading">
                    {pendingApplications.length} Partner Application{pendingApplications.length > 1 ? 's' : ''} Require Review
                  </h6>
                </div>
                <button
                  onClick={() => onNavigateSubTab ? onNavigateSubTab('b2b_applications') : null}
                  className="btn btn-warning text-dark btn-xs rounded-pill px-3 py-1 fw-bold"
                >
                  Review Applications
                </button>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 text-xs">
                  <thead className="table-light text-xxs text-muted">
                    <tr>
                      <th>Agency</th>
                      <th>Contact</th>
                      <th>Requested Mode</th>
                      <th>Submitted</th>
                      <th className="text-end">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApplications.slice(0, 3).map(p => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.company_name}</strong>
                          <span className="d-block text-xxs text-muted">{p.city}, {p.state}</span>
                        </td>
                        <td>{p.name || p.contact_name} ({p.phone})</td>
                        <td>
                          <span className={`badge ${p.initial_mode === 'NON_COMMISSION' ? 'bg-primary' : 'bg-warning text-dark'} text-xxs`}>
                            {p.initial_mode || 'COMMISSION'}
                          </span>
                        </td>
                        <td className="text-muted text-xxs">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="text-end">
                          <button
                            onClick={() => handleApprovePartner(p.id)}
                            disabled={actionLoading}
                            className="btn btn-success btn-xs rounded-pill px-2.5 py-0.5 text-xxs me-1"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => setRejectModalTarget({ ...p, isModeRequest: false })}
                            className="btn btn-outline-danger btn-xs rounded-pill px-2.5 py-0.5 text-xxs"
                          >
                            ✕ Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {modeRequests.length > 0 && (
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-start border-4 border-danger">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <AlertCircle size={18} className="text-danger" />
                  <h6 className="fw-bold mb-0 text-dark font-heading">
                    {modeRequests.length} Mode Change Request{modeRequests.length > 1 ? 's' : ''} Pending
                  </h6>
                </div>
                <button
                  onClick={() => onNavigateSubTab ? onNavigateSubTab('b2b_mode_requests') : null}
                  className="btn btn-danger text-white btn-xs rounded-pill px-3 py-1 fw-bold"
                >
                  Review Mode Requests
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: PARTNER APPLICATIONS & PARTNER LISTS */}
      {(activeSubTab === 'b2b_applications' || 
        activeSubTab === 'b2b_all_partners' || 
        activeSubTab === 'b2b_commission_partners' || 
        activeSubTab === 'b2b_non_commission_partners') && (
        <div className="animate-fade-in">
          {/* Filter / Search Bar */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="input-group input-group-sm" style={{ maxWidth: '350px' }}>
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search partner by agency, name, email, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <span className="text-xxs text-muted">
                Showing <strong>{filteredPartnersList().length}</strong> partners in view
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-xs">
                <thead className="table-light text-xxs text-muted text-uppercase">
                  <tr>
                    <th className="ps-3 py-3">Agency Name & ID</th>
                    <th>Contact Person</th>
                    <th>Location</th>
                    <th>Initial Mode</th>
                    <th>Approved Access</th>
                    <th>Status</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartnersList().length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No partner records found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPartnersList().map(p => {
                      const commActive = Boolean(p.allow_commission);
                      const nonCommActive = Boolean(p.allow_non_commission);
                      return (
                        <tr key={p.id}>
                          <td className="ps-3 py-3">
                            <strong className="text-dark d-block">{p.company_name || p.name}</strong>
                            <span className="text-xxs font-monospace text-muted">#{p.id}</span>
                          </td>

                          <td>
                            <span className="text-dark d-block">{p.contact_name || p.name || '—'}</span>
                            <span className="text-xxs text-muted">{p.phone} • {p.email}</span>
                          </td>

                          <td>
                            <span className="text-dark">{p.city || 'Goa'}, {p.state || 'India'}</span>
                          </td>

                          <td>
                            <span className={`badge ${p.initial_mode === 'NON_COMMISSION' ? 'bg-primary' : 'bg-warning text-dark'} text-xxs`}>
                              {p.initial_mode || 'COMMISSION'}
                            </span>
                          </td>

                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              {commActive && (
                                <span className="badge bg-warning text-dark text-3xs px-2 py-0.5 rounded-pill">
                                  ✓ Commission
                                </span>
                              )}
                              {nonCommActive && (
                                <span className="badge bg-primary text-white text-3xs px-2 py-0.5 rounded-pill">
                                  ✓ Net Wholesale
                                </span>
                              )}
                              {!commActive && !nonCommActive && (
                                <span className="badge bg-light text-muted border text-3xs">None</span>
                              )}
                            </div>
                          </td>

                          <td>
                            {p.status === 'active' ? (
                              <span className="badge bg-success bg-opacity-15 text-success border border-success text-xxs px-2.5 py-1 rounded-pill">
                                Active
                              </span>
                            ) : p.status === 'pending' ? (
                              <span className="badge bg-warning bg-opacity-20 text-dark border border-warning text-xxs px-2.5 py-1 rounded-pill">
                                ⏳ Pending
                              </span>
                            ) : (
                              <span className="badge bg-danger bg-opacity-15 text-danger border border-danger text-xxs px-2.5 py-1 rounded-pill">
                                Rejected
                              </span>
                            )}
                          </td>

                          <td className="pe-3 text-end">
                            {p.status === 'pending' ? (
                              <div className="d-flex justify-content-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleApprovePartner(p.id)}
                                  disabled={actionLoading}
                                  className="btn btn-success btn-xs rounded-pill px-2.5 py-1 text-xxs fw-semibold d-inline-flex align-items-center gap-1"
                                >
                                  <Check size={12} /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectModalTarget({ ...p, isModeRequest: false })}
                                  className="btn btn-outline-danger btn-xs rounded-pill px-2.5 py-1 text-xxs"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xxs text-muted">
                                {p.approved_at ? `Approved ${new Date(p.approved_at).toLocaleDateString()}` : '—'}
                              </span>
                            )}
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
      )}

      {/* SUB-VIEW 3: MODE CHANGE REQUESTS (Requirements 5 & 7) */}
      {activeSubTab === 'b2b_mode_requests' && (
        <div className="animate-fade-in">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white">
            <h5 className="fw-bold mb-1 text-dark font-heading">Partner Mode Change Requests</h5>
            <p className="text-muted text-xs mb-0">
              When an active agency requests authorization for the secondary pricing mode, review and approve here.
              Approving grants them simultaneous access to both Commission and Net Wholesale modes.
            </p>
          </div>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-xs">
                <thead className="table-light text-xxs text-muted text-uppercase">
                  <tr>
                    <th className="ps-3 py-3">Agency Name</th>
                    <th>Current Mode(s)</th>
                    <th>Requested Secondary Mode</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th className="pe-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {modeRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <CheckCircle2 size={32} className="mx-auto text-success mb-2 opacity-75 d-block" />
                        <p className="mb-0 fw-semibold text-dark">No pending mode change requests</p>
                        <span className="text-xxs">All agency mode requests have been processed.</span>
                      </td>
                    </tr>
                  ) : (
                    modeRequests.map(r => (
                      <tr key={r.id}>
                        <td className="ps-3 py-3">
                          <strong className="text-dark d-block">{r.company_name}</strong>
                          <span className="text-xxs text-muted">{r.city} • ID: #{r.id}</span>
                        </td>

                        <td>
                          {r.allow_commission == 1 && <span className="badge bg-warning text-dark text-3xs me-1">Commission</span>}
                          {r.allow_non_commission == 1 && <span className="badge bg-primary text-white text-3xs">Net Wholesale</span>}
                        </td>

                        <td>
                          <span className={`badge ${r.requested_mode === 'NON_COMMISSION' ? 'bg-primary' : 'bg-warning text-dark'} text-xxs fw-bold px-2 py-1`}>
                            {r.requested_mode === 'NON_COMMISSION' ? '🏷️ Non-Commission (Net Wholesale)' : '💰 Commission Mode'}
                          </span>
                        </td>

                        <td className="text-muted text-xxs">
                          {r.mode_requested_at ? new Date(r.mode_requested_at).toLocaleString() : 'Recent'}
                        </td>

                        <td>
                          <span className="badge bg-warning bg-opacity-20 text-dark border border-warning text-xxs px-2.5 py-1 rounded-pill">
                            ⏳ PENDING
                          </span>
                        </td>

                        <td className="pe-3 text-end">
                          <button
                            type="button"
                            onClick={() => handleApproveModeRequest(r.id)}
                            disabled={actionLoading}
                            className="btn btn-success btn-xs rounded-pill px-3 py-1 text-xxs fw-semibold me-1"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectModalTarget({ ...r, isModeRequest: true })}
                            className="btn btn-outline-danger btn-xs rounded-pill px-2.5 py-1 text-xxs"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: COMMISSION BOOKINGS */}
      {activeSubTab === 'b2b_commission_bookings' && (
        <div className="animate-fade-in">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white">
            <h5 className="fw-bold mb-1 text-dark font-heading">Admin: B2B Commission Bookings Ledger</h5>
            <p className="text-muted text-xs mb-0">
              All bookings placed by B2B partners in Commission Mode. Customer pays retail rate; agent receives commission payout.
            </p>
          </div>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-xs">
                <thead className="table-light text-xxs text-muted text-uppercase">
                  <tr>
                    <th className="ps-3 py-3">Booking ID</th>
                    <th>Partner Agency</th>
                    <th>Service Reserved</th>
                    <th>Guest Details</th>
                    <th>Retail Amount</th>
                    <th>Agent Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No commission bookings found.
                      </td>
                    </tr>
                  ) : (
                    commissionBookings.map(b => (
                      <tr key={b.id}>
                        <td className="ps-3 py-3 font-monospace fw-bold text-dark">#{b.id}</td>
                        <td>
                          <strong>{b.b2b_partner_name || b.b2b_partner_id}</strong>
                        </td>
                        <td>{b.item_name}</td>
                        <td>{b.name} ({b.phone})</td>
                        <td><strong>₹{parseFloat(b.total_amount || 0).toLocaleString()}</strong></td>
                        <td className="text-success fw-bold">
                          +₹{parseFloat(b.b2b_commission_amount || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className="badge bg-success bg-opacity-15 text-success border border-success text-xxs px-2 py-0.5 rounded-pill">
                            {b.status || 'Confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: NON-COMMISSION BOOKINGS */}
      {activeSubTab === 'b2b_non_commission_bookings' && (
        <div className="animate-fade-in">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white">
            <h5 className="fw-bold mb-1 text-dark font-heading">Admin: B2B Net Wholesale Bookings Ledger</h5>
            <p className="text-muted text-xs mb-0">
              All bookings placed by B2B partners in Non-Commission Net Mode. Partner purchased at wholesale net rates.
            </p>
          </div>

          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-xs">
                <thead className="table-light text-xxs text-muted text-uppercase">
                  <tr>
                    <th className="ps-3 py-3">Booking ID</th>
                    <th>Partner Agency</th>
                    <th>Service Reserved</th>
                    <th>Guest Details</th>
                    <th>D2C Price</th>
                    <th>B2B Net Discount</th>
                    <th>Net Rate Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nonCommissionBookings.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No net wholesale bookings found.
                      </td>
                    </tr>
                  ) : (
                    nonCommissionBookings.map(b => (
                      <tr key={b.id}>
                        <td className="ps-3 py-3 font-monospace fw-bold text-dark">#{b.id}</td>
                        <td>
                          <strong>{b.b2b_partner_name || b.b2b_partner_id}</strong>
                        </td>
                        <td>{b.item_name}</td>
                        <td>{b.name} ({b.phone})</td>
                        <td className="text-muted">₹{parseFloat(b.total_amount || 0).toLocaleString()}</td>
                        <td className="text-primary fw-semibold">
                          {b.b2b_net_discount_percentage || 10}% OFF
                        </td>
                        <td className="fw-bold text-dark">
                          ₹{parseFloat(b.b2b_net_price || b.total_amount || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className="badge bg-success bg-opacity-15 text-success border border-success text-xxs px-2 py-0.5 rounded-pill">
                            {b.status || 'Confirmed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: B2B SETTINGS */}
      {activeSubTab === 'b2b_settings' && (
        <div className="animate-fade-in">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-3 bg-white">
            <h5 className="fw-bold mb-1 text-dark font-heading">Global B2B Rules & Commission Rates</h5>
            <p className="text-muted text-xs mb-3">
              Configure baseline default commission percentages and net discount rates across service types.
            </p>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-xs">
                <thead className="table-light text-xxs text-muted text-uppercase">
                  <tr>
                    <th>Service Scope</th>
                    <th>Default Commission %</th>
                    <th>Default Net Discount %</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingRules.map(r => (
                    <tr key={r.id}>
                      <td className="fw-bold text-dark text-capitalize">{r.service_type || 'All Services'}</td>
                      <td className="text-success fw-bold">{r.commission_percent}%</td>
                      <td className="text-primary fw-bold">{r.net_discount_percent}%</td>
                      <td>
                        <span className="badge bg-success bg-opacity-15 text-success text-xxs">Active</span>
                      </td>
                      <td className="text-muted text-xxs">{r.notes || 'Global default rule'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalTarget && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: 'rgba(13, 27, 46, 0.75)', zIndex: 1060, backdropFilter: 'blur(3px)' }}
        >
          <div className="card border-0 shadow-2xl rounded-4 p-4 bg-white" style={{ maxWidth: '480px', width: '100%' }}>
            <h5 className="fw-bold text-dark font-heading mb-1">
              Reject {rejectModalTarget.isModeRequest ? 'Mode Request' : 'Partner Application'}
            </h5>
            <p className="text-muted text-xs mb-3">
              Agency: <strong>{rejectModalTarget.company_name}</strong>
            </p>

            <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">Reason for Rejection *</label>
            <textarea
              className="form-control form-control-sm mb-3"
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejection (partner will be notified)..."
            />

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light btn-sm rounded-pill px-3 text-xs"
                onClick={() => setRejectModalTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                className="btn btn-danger btn-sm rounded-pill px-3.5 text-xs fw-bold"
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
