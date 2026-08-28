import React, { useState, useEffect } from 'react';
import { UserCircle, Building, Mail, Phone, MapPin, Save, CheckCircle, Landmark, Settings, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { apiFetch, API_BASE } from '../../../services/api';

export default function VehicleVendorProfileSettings({ currentUser = {} }) {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [form, setForm] = useState({
    name: currentUser.name || currentUser.username || '',
    username: currentUser.username || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    address: '',
    city: currentUser.city || 'Goa',
    state: 'Goa',
    country: 'India',
    pincode: '',
    company_name: '',
    gst_number: '',
    // Fleet / Business settings
    default_location: 'Goa Delivery',
    operating_hours: '08:00 AM - 10:00 PM',
    instant_booking: true,
    // Bank & settlements
    account_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'Current',
    upi_id: '',
    // Security
    password: ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('vendor_vehicle_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setForm(f => ({ ...f, ...parsed }));
      }
    } catch (e) {}
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // 1. Update user profile in backend database
      const updatePayload = {
        action: 'update_user',
        id: currentUser.id,
        username: currentUser.username || form.username,
        name: form.name || form.username,
        email: form.email,
        phone: form.phone,
        city: form.city,
        role: 'vendor'
      };

      if (form.password) {
        updatePayload.password = form.password;
      }

      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to update profile');
      }

      // 2. Save settings to localStorage
      const updatedUser = {
        ...currentUser,
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('vendor_vehicle_settings', JSON.stringify(form));

      setSuccess('Profile & Settings saved successfully to database!');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError('Save failed: ' + (err.message || 'Server connection error'));
    } finally {
      setSaving(false);
    }
  };

  const inp = (label, key, type = 'text', placeholder = '', required = false) => (
    <div className="mb-3">
      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        className="form-control rounded-3"
        style={{ fontSize: '0.85rem' }}
        value={form[key] || ''}
        onChange={e => set(key, e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  return (
    <div className="p-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Profile & Settings</h5>
        <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Manage your vendor business profile, contact information, and payout settings
        </p>
      </div>

      {success && (
        <div className="alert alert-success py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
          <CheckCircle size={15} /> {success}
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {[
          { id: 'profile', label: 'Profile Details', icon: <UserCircle size={14} /> },
          { id: 'business', label: 'Fleet & Operations', icon: <Settings size={14} /> },
          { id: 'bank', label: 'Bank & Settlements', icon: <Landmark size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className="btn btn-sm px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2"
            style={{
              fontSize: '0.8rem',
              background: activeSubTab === tab.id ? '#0D1B2E' : '#fff',
              color: activeSubTab === tab.id ? '#fff' : '#475569',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="row g-4">
        {/* Left Profile Overview */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 rounded-4 shadow-sm p-4 text-center" style={{ background: '#fff' }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mx-auto mb-3 shadow-sm"
              style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #FF6333, #FF8A00)', fontSize: '32px' }}
            >
              {(form.name || form.username || 'V')[0].toUpperCase()}
            </div>
            <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>{form.name || form.username}</h5>
            <span className="badge rounded-pill px-3 py-1" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333', fontSize: '0.72rem' }}>
              Vehicle Vendor Partner
            </span>
            <hr className="my-3" />
            <div className="text-start">
              <div className="text-muted mb-2" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Account Summary
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.8rem' }}>
                <span className="text-muted">Username</span>
                <span className="fw-bold">{currentUser.username || 'vendor'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.8rem' }}>
                <span className="text-muted">Role</span>
                <span className="fw-bold text-capitalize">{currentUser.role || 'vendor'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '0.8rem' }}>
                <span className="text-muted">City</span>
                <span className="fw-bold">{form.city || 'Goa'}</span>
              </div>
              <div className="d-flex justify-content-between py-1" style={{ fontSize: '0.8rem' }}>
                <span className="text-muted">KYC Status</span>
                <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Tabs */}
        <div className="col-12 col-lg-8">
          <form onSubmit={handleSave} className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff' }}>
            {activeSubTab === 'profile' && (
              <>
                <h6 className="fw-bold mb-3" style={{ color: '#0D1B2E', borderBottom: '2px solid #FF6333', paddingBottom: '6px', display: 'inline-block' }}>
                  Personal & Contact Information
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">{inp('Full Name', 'name', 'text', 'Enter your full name', true)}</div>
                  <div className="col-12 col-md-6">{inp('Email Address', 'email', 'email', 'vendor@tripgalileo.com', true)}</div>
                  <div className="col-12 col-md-6">{inp('Phone Number', 'phone', 'tel', '+91 9876543210', true)}</div>
                  <div className="col-12 col-md-6">{inp('Company / Agency Name', 'company_name', 'text', 'e.g. Goa Holiday Rentals')}</div>
                  <div className="col-12">{inp('Address / Workshop', 'address', 'text', 'e.g. Near Calangute Beach Road')}</div>
                  <div className="col-6 col-md-4">{inp('City / Region', 'city', 'text', 'Goa')}</div>
                  <div className="col-6 col-md-4">{inp('State', 'state', 'text', 'Goa')}</div>
                  <div className="col-12 col-md-4">{inp('PIN Code', 'pincode', 'text', '403516')}</div>
                  <div className="col-12 col-md-6">{inp('GSTIN / Business Registration', 'gst_number', 'text', 'e.g. 30AABCT1332L1ZT')}</div>
                  <div className="col-12 col-md-6">{inp('Change Password (Optional)', 'password', 'password', 'Leave blank to keep unchanged')}</div>
                </div>
              </>
            )}

            {activeSubTab === 'business' && (
              <>
                <h6 className="fw-bold mb-3" style={{ color: '#0D1B2E', borderBottom: '2px solid #FF6333', paddingBottom: '6px', display: 'inline-block' }}>
                  Vehicle Fleet & Operational Settings
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">{inp('Default Delivery Location', 'default_location', 'text', 'e.g. Goa Airport / Panaji')}</div>
                  <div className="col-12 col-md-6">{inp('Operating Hours', 'operating_hours', 'text', '08:00 AM - 10:00 PM')}</div>
                  <div className="col-12">
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="instantBookingSwitch"
                        checked={form.instant_booking}
                        onChange={e => set('instant_booking', e.target.checked)}
                      />
                      <label className="form-check-label fw-bold" htmlFor="instantBookingSwitch" style={{ fontSize: '0.85rem' }}>
                        Enable Instant Booking Confirmation
                      </label>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Automatically confirm incoming vehicle bookings when the calendar is available
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSubTab === 'bank' && (
              <>
                <h6 className="fw-bold mb-3" style={{ color: '#0D1B2E', borderBottom: '2px solid #FF6333', paddingBottom: '6px', display: 'inline-block' }}>
                  Bank Account & Payout Details
                </h6>
                <div className="alert py-2 px-3 mb-3 d-flex align-items-center gap-2 rounded-3" style={{ background: '#fff9e6', border: '1px solid #fdcb6e', fontSize: '0.78rem' }}>
                  <span>🔒</span>
                  <span>Your settlement account details are securely encrypted and used for automated earnings payouts.</span>
                </div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">{inp('Account Holder Name', 'account_holder', 'text', 'As per bank account')}</div>
                  <div className="col-12 col-md-6">{inp('Bank Name', 'bank_name', 'text', 'e.g. HDFC Bank')}</div>
                  <div className="col-12 col-md-6">{inp('Account Number', 'account_number', 'text', 'Enter bank account number')}</div>
                  <div className="col-12 col-md-6">{inp('IFSC Code', 'ifsc_code', 'text', 'e.g. HDFC0001234')}</div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Account Type</label>
                    <select className="form-select" style={{ fontSize: '0.85rem' }} value={form.account_type} onChange={e => set('account_type', e.target.value)}>
                      {['Current', 'Savings'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">{inp('UPI ID for Settlements', 'upi_id', 'text', 'e.g. name@okhdfcbank')}</div>
                </div>
              </>
            )}

            <div className="mt-4 pt-3 border-top d-flex justify-content-end">
              <button
                type="submit"
                disabled={saving}
                className="btn px-5 py-2 fw-bold text-white rounded-3 d-flex align-items-center gap-2"
                style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.85rem' }}
              >
                {saving ? <Loader2 size={15} className="spinner-border spinner-border-sm" /> : <Save size={15} />}
                {saving ? 'Saving...' : 'Save Profile & Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
