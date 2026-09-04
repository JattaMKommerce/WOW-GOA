import React, { useState, useEffect } from 'react';
import {
  Car, Shield, CheckCircle2, Clock, MapPin, Phone, Mail, FileText,
  AlertCircle, RefreshCw, Calendar, User, LogOut, Check, X, Navigation,
  Award, Eye, ExternalLink, ShieldCheck, ChevronRight, AlertTriangle
} from 'lucide-react';
import * as api from '../../services/api';

function DriverJobStatusBadge({ status }) {
  const s = (status || 'assigned').toLowerCase();
  if (s === 'completed') {
    return <span className="badge rounded-pill px-3 py-1.5 fw-bold text-success border border-success-subtle d-inline-flex align-items-center gap-1.5" style={{ background: '#dcfce7', fontSize: '0.78rem' }}>🟢 Completed</span>;
  }
  if (s === 'in progress' || s === 'in_progress') {
    return <span className="badge rounded-pill px-3 py-1.5 fw-bold border d-inline-flex align-items-center gap-1.5" style={{ background: '#ffedd5', color: '#c2410c', borderColor: '#fdba74', fontSize: '0.78rem' }}>🟠 In Progress</span>;
  }
  if (s === 'accepted') {
    return <span className="badge rounded-pill px-3 py-1.5 fw-bold border d-inline-flex align-items-center gap-1.5" style={{ background: '#fef9c3', color: '#854d0e', borderColor: '#fde047', fontSize: '0.78rem' }}>🟡 Accepted</span>;
  }
  if (s === 'rejected') {
    return <span className="badge rounded-pill px-3 py-1.5 fw-bold text-danger border border-danger-subtle d-inline-flex align-items-center gap-1.5" style={{ background: '#fee2e2', fontSize: '0.78rem' }}>🔴 Rejected</span>;
  }
  if (s === 'cancelled') {
    return <span className="badge rounded-pill px-3 py-1.5 fw-bold text-secondary border border-secondary-subtle d-inline-flex align-items-center gap-1.5" style={{ background: '#e2e8f0', color: '#334155', fontSize: '0.78rem' }}>⚫ Cancelled</span>;
  }
  return <span className="badge rounded-pill px-3 py-1.5 fw-bold border d-inline-flex align-items-center gap-1.5" style={{ background: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd', fontSize: '0.78rem' }}>🔵 New Assignment</span>;
}

export default function DriverPortalPage({ currentUser, onLogout, onNavigateHome }) {
  const driverUser = currentUser || JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('current_user') || '{}');
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'assigned', 'accepted', 'in_progress', 'completed', 'profile'
  const [jobs, setJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [driverProfile, setDriverProfile] = useState(driverUser);
  const [monthlySalary, setMonthlySalary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  const driverId = driverProfile.id || driverUser.id || 'drv-1';

  const loadDriverData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // 1. Fetch details (returns driver profile, assignments, available unassigned jobs, and monthly attendance salary)
      const details = await api.fetchDriverDetails(driverId);
      if (details) {
        if (details.driver) setDriverProfile(details.driver);
        if (details.assignments) setJobs(details.assignments);
        if (details.available_jobs) setAvailableJobs(details.available_jobs);
        if (details.monthly_salary) setMonthlySalary(details.monthly_salary);
      } else {
        // Fallback fetch jobs
        const [jobList, availList] = await Promise.all([
          api.fetchDriverJobs(driverId),
          api.fetchAvailableDriverJobs()
        ]);
        setJobs(jobList || []);
        setAvailableJobs(availList || []);
      }
    } catch (e) {
      if (!isBackground) console.error('Error fetching driver jobs:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
    // 8-second real-time periodic background polling
    const interval = setInterval(() => {
      loadDriverData(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [driverId]);

  const handleAcceptAvailableJob = async (bookingId) => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      const res = await api.acceptAvailableJob(bookingId, driverId);
      setSuccessMsg(res.message || `Congratulations! You have successfully accepted Job #${bookingId}.`);
      setTimeout(() => setSuccessMsg(''), 4500);
      setActiveTab('accepted');
      await loadDriverData();
    } catch (e) {
      // If another driver clicked first, show the exact message and refresh immediately
      setErrorMsg(e.message || 'This job has already been accepted by another driver.');
      setTimeout(() => setErrorMsg(''), 5000);
      await loadDriverData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateJobStatus = async (bookingId, newStatus, notes = '') => {
    setActionLoading(true);
    setErrorMsg('');
    try {
      await api.updateDriverJobStatus(bookingId, driverId, newStatus, notes);
      setSuccessMsg(`Trip status successfully updated to "${newStatus}"!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadDriverData();
    } catch (e) {
      setErrorMsg(e.message || 'Failed to update trip status.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  // Grouped Jobs
  const assignedJobs = jobs.filter(j => {
    const s = (j.driver_job_status || 'assigned').toLowerCase();
    return s === 'assigned';
  });

  const acceptedJobs = jobs.filter(j => {
    const s = (j.driver_job_status || '').toLowerCase();
    return s === 'accepted';
  });

  const inProgressJobs = jobs.filter(j => {
    const s = (j.driver_job_status || '').toLowerCase();
    return s === 'in progress' || s === 'in_progress';
  });

  const completedJobs = jobs.filter(j => {
    const s = (j.driver_job_status || '').toLowerCase();
    return s === 'completed';
  });

  const cancelledJobs = jobs.filter(j => {
    const s = (j.driver_job_status || '').toLowerCase();
    return s === 'cancelled' || s === 'rejected';
  });

  const displayedJobs = 
    activeTab === 'available' ? availableJobs :
    activeTab === 'assigned' ? assignedJobs :
    activeTab === 'accepted' ? acceptedJobs :
    activeTab === 'in_progress' ? inProgressJobs :
    activeTab === 'completed' ? completedJobs : [];

  const isApproved = (driverProfile.status || '').toLowerCase() === 'approved' || (driverProfile.status || '').toLowerCase() === 'active';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B' }}>
      {/* Top Navbar */}
      <header className="navbar navbar-dark sticky-top px-3 px-md-4 py-2 shadow-sm" style={{ background: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2.5" style={{ cursor: 'pointer' }} onClick={onNavigateHome}>
              <img
                src="/wowgoa-logo-white.png"
                alt="wowgoa.in"
                style={{
                  height: '38px',
                  width: 'auto',
                  maxWidth: '165px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
                onError={(e) => { e.target.src = '/wowgoa-logo.png'; }}
              />
              <span className="badge rounded-pill bg-warning text-dark fw-bold px-2.5 py-1" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                DRIVER PORTAL
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-light btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1 text-white-50"
              style={{ fontSize: '0.78rem' }}
              onClick={loadDriverData}
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>

            <div className="d-flex align-items-center gap-2.5 ps-2 border-start border-secondary border-opacity-50">
              {driverProfile.profile_photo ? (
                <img
                  src={driverProfile.profile_photo}
                  alt={driverProfile.name || 'Driver'}
                  className="rounded-circle object-fit-cover"
                  style={{ width: '36px', height: '36px', border: '2px solid #FF6333' }}
                />
              ) : (
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark"
                  style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', fontSize: '14px' }}
                >
                  {((driverProfile.name || driverUser.name || driverProfile.username || 'D')[0]).toUpperCase()}
                </div>
              )}
              <div className="d-none d-sm-block text-start">
                <div className="fw-bold text-white small leading-tight">{driverProfile.name || driverUser.name || driverProfile.username || 'Rajesh Naik'}</div>
                <div className="text-white-50" style={{ fontSize: '0.68rem' }}>
                  {isApproved ? '🟢 Active Chauffeur' : '🟡 Pending Approval'}
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm p-1.5 rounded-circle ms-1"
                title="Log Out"
                onClick={onLogout}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: '1200px' }}>
        {/* Status Alerts */}
        {successMsg && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 mb-3 animate-fade-in" style={{ fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} className="text-success flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2.5 px-3 rounded-3 mb-3 animate-fade-in" style={{ fontSize: '0.85rem' }}>
            <AlertCircle size={16} className="text-danger flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Verification Status Banner if pending */}
        {!isApproved && (
          <div className="alert alert-warning d-flex align-items-center gap-3 p-3 rounded-3 mb-4 shadow-sm" style={{ borderLeft: '5px solid #f59e0b', background: '#fffbeb' }}>
            <AlertTriangle size={24} className="text-warning flex-shrink-0" />
            <div>
              <div className="fw-bold text-dark mb-0.5">Account Status: PENDING ADMIN APPROVAL</div>
              <div className="small text-secondary" style={{ fontSize: '0.8rem' }}>
                Your submitted documents (Aadhaar Card, PAN Card, Driving Licence) are currently being reviewed by the WOW GOA Operations Team. Once approved, you will receive customer trip assignments.
              </div>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #172a45 100%)', position: 'relative' }}>
          <div className="row align-items-center g-3">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge rounded-pill bg-warning text-dark fw-bold px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                  WOW GOA OFFICIAL DRIVER
                </span>
                <span className="text-white-50 small">• ID: {driverProfile.id}</span>
              </div>
              <h3 className="fw-bold text-white mb-1">
                Welcome back, <span style={{ color: '#FF6333' }}>{driverProfile.name || driverUser.name || driverProfile.username || 'Driver'}</span>!
              </h3>
              <p className="text-white-50 mb-0" style={{ fontSize: '0.85rem' }}>
                {driverProfile.vehicle_details || 'Commercial Tourist Vehicle'} • {driverProfile.phone || '+91 98221 23456'}
              </p>
            </div>

            <div className="col-md-6 d-flex justify-content-md-end gap-2 flex-wrap">
              <div 
                className={`p-2.5 rounded-3 text-center px-3 backdrop-blur cursor-pointer ${activeTab === 'available' ? 'border border-warning' : ''}`}
                style={{ background: availableJobs.length > 0 ? 'rgba(255, 90, 31, 0.25)' : 'rgba(255, 255, 255, 0.1)' }}
                onClick={() => setActiveTab('available')}
              >
                <div className="text-white-50 small" style={{ fontSize: '0.7rem' }}>Available Requests</div>
                <div className="fs-5 fw-bold" style={{ color: '#FF8A00' }}>{availableJobs.length}</div>
              </div>
              <div className="bg-white bg-opacity-10 p-2.5 rounded-3 text-center px-3 backdrop-blur">
                <div className="text-white-50 small" style={{ fontSize: '0.7rem' }}>My Trips</div>
                <div className="fs-5 fw-bold text-white">{jobs.length}</div>
              </div>
              <div className="bg-white bg-opacity-10 p-2.5 rounded-3 text-center px-3 backdrop-blur">
                <div className="text-white-50 small" style={{ fontSize: '0.7rem' }}>Completed</div>
                <div className="fs-5 fw-bold text-success">{completedJobs.length}</div>
              </div>
              <div className="bg-white bg-opacity-10 p-2.5 rounded-3 text-center px-3 backdrop-blur">
                <div className="text-white-50 small" style={{ fontSize: '0.7rem' }}>Monthly Pay ({monthlySalary?.working_days || 0}d)</div>
                <div className="fs-5 fw-bold text-warning">
                  ₹{(monthlySalary?.monthly_pay || (monthlySalary?.payable_days * 800) || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Salary & Earnings Card (Attendance / Unique Working Days Based) */}
        {monthlySalary && (
          <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4" style={{ background: '#fff', borderLeft: '4px solid #16a34a' }}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h6 className="fw-bold mb-0 text-dark">
                    🗓️ Monthly Salary & Earnings — {monthlySalary.month_label || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h6>
                  <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                    Fixed: ₹800 / Working Day
                  </span>
                </div>
                <div className="text-muted small mt-0.5" style={{ fontSize: '0.73rem' }}>
                  Your salary is calculated strictly at <strong>₹800 per unique working day</strong>. Completed bookings ({jobs.length}) do NOT multiply salary.
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold">Payment Status:</span>
                <span className={`badge rounded-pill px-3 py-1 fw-bold ${monthlySalary.payment_status?.toUpperCase() === 'PAID' ? 'bg-success text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '0.75rem' }}>
                  {monthlySalary.payment_status?.toUpperCase() === 'PAID' 
                    ? `PAID (${monthlySalary.paid_date || 'Processed'} • Ref: ${monthlySalary.payment_reference || 'SAL-OFFICIAL'})` 
                    : 'PENDING (Processed at Month-End)'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="row g-2 text-center align-items-center">
                <div className="col-6 col-md-2 border-end">
                  <div className="text-muted small fw-semibold" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Daily Rate</div>
                  <div className="fs-5 fw-bold text-dark mt-0.5">₹{monthlySalary.daily_rate || 800}</div>
                </div>
                <div className="col-6 col-md-2 border-end">
                  <div className="text-muted small fw-semibold" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Working Days</div>
                  <div className="fs-5 fw-bold text-primary mt-0.5">{monthlySalary.working_days || 0}</div>
                </div>
                <div className="col-4 col-md-1.5 border-end">
                  <div className="text-muted small fw-semibold" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Paid Leave</div>
                  <div className="fs-5 fw-bold text-success mt-0.5">{monthlySalary.paid_leave || 0}</div>
                </div>
                <div className="col-4 col-md-1.5 border-end">
                  <div className="text-muted small fw-semibold" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Unpaid Leave</div>
                  <div className="fs-5 fw-bold text-muted mt-0.5">{monthlySalary.unpaid_leave || 0}</div>
                </div>
                <div className="col-4 col-md-2 border-end">
                  <div className="text-muted small fw-semibold" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Payable Days</div>
                  <div className="fs-5 fw-bold text-dark mt-0.5">{monthlySalary.payable_days || 0}</div>
                </div>
                <div className="col-4 col-md-1.5 border-end">
                  <div className="text-muted small fw-semibold" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Bookings Done</div>
                  <div className="fs-5 fw-bold text-secondary mt-0.5">{monthlySalary.total_bookings || jobs.length} <span className="small text-muted fw-normal" style={{ fontSize: '0.62rem' }}>(Info)</span></div>
                </div>
                <div className="col-12 col-md-1.5">
                  <div className="text-muted small fw-semibold" style={{ fontSize: '0.66rem', textTransform: 'uppercase' }}>Monthly Pay</div>
                  <div className="fs-5 fw-bold text-success mt-0.5">₹{(monthlySalary.monthly_pay || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="d-flex align-items-center gap-2 mb-4 overflow-auto pb-2">
          {[
            { id: 'available', label: `Available Requests (${availableJobs.length})`, icon: <AlertCircle size={14} />, badge: availableJobs.length > 0, highlight: availableJobs.length > 0 },
            { id: 'assigned', label: `Assigned Trips (${assignedJobs.length})`, icon: <Car size={14} /> },
            { id: 'accepted', label: `Accepted Trips (${acceptedJobs.length})`, icon: <Clock size={14} /> },
            { id: 'in_progress', label: `In Progress (${inProgressJobs.length})`, icon: <Navigation size={14} />, pulse: inProgressJobs.length > 0 },
            { id: 'completed', label: `Completed Trips (${completedJobs.length})`, icon: <CheckCircle2 size={14} /> },
            { id: 'profile', label: 'My Profile & Documents', icon: <User size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm px-3.5 py-2 rounded-pill fw-bold d-flex align-items-center gap-1.5 flex-shrink-0 shadow-sm ${
                activeTab === tab.id
                  ? 'btn-dark text-white'
                  : tab.highlight
                  ? 'btn-outline-warning text-dark border-warning bg-warning bg-opacity-10'
                  : 'btn-white bg-white text-secondary border'
              }`}
              style={{
                fontSize: '0.82rem',
                border: activeTab === tab.id ? 'none' : tab.highlight ? '1.5px solid #FF8A00' : '1px solid #e2e8f0',
                background: activeTab === tab.id ? '#0D1B2E' : tab.highlight ? '#fffbeb' : '#fff'
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.pulse && <span className="rounded-circle bg-warning animate-ping" style={{ width: '8px', height: '8px' }}></span>}
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* TAB CONTENT: PROFILE & DOCUMENTS                                       */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'profile' ? (
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: '#fff' }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0D1B2E' }}>
              <ShieldCheck size={20} className="text-primary" /> Driver Registration & Verified Documents
            </h5>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="p-3.5 rounded-3 bg-light border">
                  <h6 className="fw-bold text-dark mb-3">Driver Personal Details</h6>
                  
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">Full Name:</span>
                    <span className="fw-bold text-dark small">{driverProfile.name}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">Mobile Phone:</span>
                    <span className="fw-bold text-dark small">{driverProfile.phone}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">Email Address:</span>
                    <span className="fw-bold text-dark small">{driverProfile.email}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">Residential Address:</span>
                    <span className="fw-bold text-dark small text-end" style={{ maxWidth: '60%' }}>{driverProfile.address || 'Goa, India'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <span className="text-muted small">Driving Experience:</span>
                    <span className="fw-bold text-dark small text-end">{driverProfile.experience_years || 'Experienced'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-2">
                    <span className="text-muted small">Assigned Vehicle:</span>
                    <span className="fw-bold text-dark small text-end">{driverProfile.vehicle_details || 'Commercial Fleet'}</span>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3.5 rounded-3 bg-light border">
                  <h6 className="fw-bold text-dark mb-3">Verified Verification Documents</h6>

                  <div className="d-flex flex-column gap-2.5">
                    {/* Aadhaar Card */}
                    <div className="p-2.5 rounded bg-white border d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <div>
                          <div className="fw-semibold small">Aadhaar Card Document</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Identity Verification</div>
                        </div>
                      </div>
                      {driverProfile.aadhaar_card ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-0.5 px-2.5 fw-bold"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setPreviewDoc({ title: 'Aadhaar Card', url: driverProfile.aadhaar_card, driverName: driverProfile.name })}
                        >
                          <Eye size={12} className="me-1" /> View Image
                        </button>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.7rem' }}>Missing</span>
                      )}
                    </div>

                    {/* PAN Card */}
                    <div className="p-2.5 rounded bg-white border d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <div>
                          <div className="fw-semibold small">PAN Card Document</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Tax / Government ID</div>
                        </div>
                      </div>
                      {driverProfile.pan_card ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-0.5 px-2.5 fw-bold"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setPreviewDoc({ title: 'PAN Card', url: driverProfile.pan_card, driverName: driverProfile.name })}
                        >
                          <Eye size={12} className="me-1" /> View Image
                        </button>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.7rem' }}>Missing</span>
                      )}
                    </div>

                    {/* DL */}
                    <div className="p-2.5 rounded bg-white border d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <div>
                          <div className="fw-semibold small">Commercial Driving Licence</div>
                          <div className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{driverProfile.license_number || 'Verified DL'}</div>
                        </div>
                      </div>
                      {driverProfile.license_card ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-0.5 px-2.5 fw-bold"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setPreviewDoc({ title: 'Driving Licence', url: driverProfile.license_card, driverName: driverProfile.name, licenseNumber: driverProfile.license_number })}
                        >
                          <Eye size={12} className="me-1" /> View Image
                        </button>
                      ) : (
                        <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.7rem' }}>Missing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────────────── */
          /* TAB CONTENT: TRIP JOBS LISTING                                          */
          /* ─────────────────────────────────────────────────────────────────────── */
          <div>
            {displayedJobs.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center" style={{ background: '#fff' }}>
                <Car size={48} className="mx-auto text-muted opacity-30 mb-2" />
                <h5 className="fw-bold text-dark">
                  {activeTab === 'available' ? 'No open job requests at the moment' : 'No trips found in this category'}
                </h5>
                <p className="text-muted small mb-0">
                  {activeTab === 'available'
                    ? 'When customers create bookings with "Driver Required", new trip requests appear here in real time for first-acceptance.'
                    : activeTab === 'assigned'
                    ? 'No new assignments pending acceptance. When Admin assigns a customer-requested trip, it will appear here.'
                    : activeTab === 'accepted'
                    ? 'No upcoming accepted trips.'
                    : activeTab === 'in_progress'
                    ? 'No trips currently in progress.'
                    : 'No completed trips recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="row g-3">
                {displayedJobs.map(job => {
                  const isAvailableCard = activeTab === 'available';
                  const currentStatus = (job.driver_job_status || (isAvailableCard ? 'available' : 'assigned')).toLowerCase();

                  return (
                    <div key={job.booking_id || job.id} className="col-12 col-lg-6">
                      <div 
                        className="card border-0 shadow-sm rounded-4 p-4 h-100 d-flex flex-column justify-content-between" 
                        style={{ 
                          background: '#fff', 
                          borderLeft: isAvailableCard ? '5px solid #FF8A00' : '4px solid #FF6333' 
                        }}
                      >
                        <div>
                          {/* Card Top */}
                          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold fs-6 text-dark">
                                  {isAvailableCard ? 'Trip Request' : 'Booking'} #{job.booking_id || job.id}
                                </span>
                                <span className="badge bg-warning bg-opacity-20 text-dark fw-bold" style={{ fontSize: '0.68rem' }}>
                                  🚗 Service: {job.driver_service_type || 'FULL'}
                                </span>
                              </div>
                              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                {isAvailableCard
                                  ? `Requested on: ${job.booking_created_at ? String(job.booking_created_at).slice(0, 16) : 'Recent'}`
                                  : `Assigned on: ${job.driver_assigned_at ? String(job.driver_assigned_at).slice(0, 16) : 'Recent'}`}
                              </div>
                            </div>
                            {isAvailableCard ? (
                              <span className="badge rounded-pill bg-warning-subtle text-dark border border-warning-subtle px-2.5 py-1 fw-bold" style={{ fontSize: '0.72rem' }}>
                                ⚡ First-Accept Wins
                              </span>
                            ) : (
                              <DriverJobStatusBadge status={job.driver_job_status} />
                            )}
                          </div>

                          {/* Customer & Trip Details */}
                          <div className="p-3 rounded-3 bg-light mb-3">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="d-flex align-items-center gap-2">
                                <User size={15} className="text-primary" />
                                <span className="fw-bold text-dark small">{job.customer_name || 'Customer'}</span>
                              </div>
                              {job.customer_phone && (
                                <a
                                  href={`tel:${job.customer_phone}`}
                                  className="btn btn-xs btn-outline-success fw-bold d-flex align-items-center gap-1 py-0.5 px-2 rounded-pill"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  <Phone size={12} /> Call Customer
                                </a>
                              )}
                            </div>

                            <div className="d-flex align-items-start gap-2 mb-1.5">
                              <MapPin size={15} className="text-danger flex-shrink-0 mt-0.5" />
                              <div className="small">
                                <span className="text-muted">Pickup Location: </span>
                                <span className="fw-bold text-dark">{job.pickup_loc || 'Goa Delivery'}</span>
                                {job.pickup_loc && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.pickup_loc + ', Goa')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary ms-1 fw-semibold text-decoration-none"
                                    style={{ fontSize: '0.72rem' }}
                                  >
                                    <ExternalLink size={10} className="me-0.5" /> Open Maps
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="d-flex align-items-start gap-2 mb-1.5">
                              <Car size={15} className="text-primary flex-shrink-0 mt-0.5" />
                              <div className="small">
                                <span className="text-muted">Trip / Service: </span>
                                <span className="fw-bold text-dark">{job.item_name || 'Sightseeing Package'}</span>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                              <Calendar size={15} className="text-warning flex-shrink-0" />
                              <div className="small">
                                <span className="text-muted">Pickup Date & Time: </span>
                                <span className="fw-bold text-dark">{job.pickup_date || '—'} {job.pickup_time ? `@ ${job.pickup_time}` : ''}</span>
                              </div>
                            </div>

                            {/* Driver Fixed Earning */}
                            {(() => {
                              const sType = String(job.driver_service_type || '').toUpperCase();
                              const isFull = sType === 'FULL';
                              const dCount = Math.max(1, parseInt(job.driver_days || job.booking_days || 1));
                              const dEarn = parseInt(job.driver_earning || (sType === 'PICKUP' || sType === 'DROP' ? 400 : 800 * dCount));
                              const pStatus = job.driver_payment_status || (currentStatus === 'completed' ? 'Payable' : 'Pending');

                              return (
                                <div className="mt-2.5 p-2.5 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                  <div>
                                    <div className="text-muted" style={{ fontSize: '0.66rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                      Driver Earnings ({sType === 'PICKUP' || sType === 'DROP' ? '₹400 Fixed' : '₹800 / day'})
                                    </div>
                                    <div className="fw-bold text-success" style={{ fontSize: '0.92rem' }}>
                                      ₹{dEarn.toLocaleString()} {isFull && <span className="small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>({dCount} {dCount === 1 ? 'day' : 'days'})</span>}
                                    </div>
                                  </div>
                                  <div className="text-end">
                                    <div className="text-muted" style={{ fontSize: '0.66rem', fontWeight: '600' }}>Payout</div>
                                    <span className={`badge rounded-pill fw-bold ${pStatus === 'Payable' ? 'bg-success text-white' : 'bg-warning-subtle text-dark border border-warning-subtle'}`} style={{ fontSize: '0.68rem' }}>
                                      {pStatus === 'Payable' ? '💰 Payable' : '⏳ Pending Trip'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}

                            {job.driver_notes && (
                              <div className="mt-2 pt-2 border-top small text-muted">
                                <span className="fw-semibold text-dark">Admin Notes: </span>
                                <span>{job.driver_notes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons based on lifecycle */}
                        <div className="d-flex gap-2 pt-2 border-top">
                          {isAvailableCard && (
                            <div className="w-100">
                              <button
                                type="button"
                                className="btn btn-sm text-white w-100 fw-bold d-flex align-items-center justify-content-center gap-2 py-2.5 shadow-sm rounded-3"
                                style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.88rem' }}
                                disabled={actionLoading || !isApproved}
                                onClick={() => handleAcceptAvailableJob(job.booking_id || job.id)}
                              >
                                <Check size={18} />
                                <span>{actionLoading ? 'Claiming Job...' : 'ACCEPT JOB (First Driver Wins)'}</span>
                              </button>
                              {!isApproved && (
                                <div className="text-danger small text-center mt-1" style={{ fontSize: '0.72rem' }}>
                                  ⚠️ Account approval required to accept trips
                                </div>
                              )}
                            </div>
                          )}

                          {!isAvailableCard && currentStatus === 'assigned' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-success flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-2 shadow-sm rounded-3"
                                disabled={actionLoading}
                                onClick={() => handleUpdateJobStatus(job.booking_id || job.id, 'Accepted')}
                              >
                                <Check size={16} /> Accept Trip
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger fw-bold d-flex align-items-center gap-1 py-2 rounded-3"
                                disabled={actionLoading}
                                onClick={() => handleUpdateJobStatus(job.booking_id || job.id, 'Rejected', 'Driver unavailable for slot')}
                              >
                                <X size={15} /> Reject
                              </button>
                            </>
                          )}

                          {!isAvailableCard && currentStatus === 'accepted' && (
                            <button
                              type="button"
                              className="btn btn-sm text-white flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-2 shadow-sm rounded-3"
                              style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}
                              disabled={actionLoading}
                              onClick={() => handleUpdateJobStatus(job.booking_id || job.id, 'In Progress')}
                            >
                              <Navigation size={16} /> Start Trip (In Progress)
                            </button>
                          )}

                          {!isAvailableCard && currentStatus === 'in progress' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success flex-grow-1 fw-bold d-flex align-items-center justify-content-center gap-1.5 py-2 shadow-sm rounded-3"
                              disabled={actionLoading}
                              onClick={() => handleUpdateJobStatus(job.booking_id || job.id, 'Completed')}
                            >
                              <CheckCircle2 size={16} /> Complete Trip
                            </button>
                          )}

                          {!isAvailableCard && currentStatus === 'completed' && (
                            <div className="text-success small fw-bold d-flex align-items-center gap-1 py-1">
                              <CheckCircle2 size={16} /> Trip Successfully Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div
          className="modal-backdrop-custom d-flex align-items-center justify-content-center"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 1080 }}
          onClick={() => setPreviewDoc(null)}
        >
          <div className="bg-white rounded-3 shadow-lg p-3 text-center animate-fade-in" style={{ maxWidth: '600px', width: '90vw' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
              <div className="text-start">
                <h6 className="fw-bold mb-0 text-dark">{previewDoc.title} Verification</h6>
                <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{previewDoc.driverName} {previewDoc.licenseNumber ? `• ${previewDoc.licenseNumber}` : ''}</div>
              </div>
              <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setPreviewDoc(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-2 rounded bg-light mb-3" style={{ maxHeight: '420px', overflow: 'hidden' }}>
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="img-fluid rounded object-fit-contain"
                style={{ maxHeight: '400px', width: '100%' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary fw-semibold">
                <ExternalLink size={13} className="me-1" /> Open Original
              </a>
              <button type="button" className="btn btn-sm btn-dark px-3 fw-bold" onClick={() => setPreviewDoc(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
