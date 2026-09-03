import React, { useState } from 'react';
import { 
  Building2, User, Phone, Mail, Globe, MapPin, Lock, 
  CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Compass, FileText, ArrowLeft,
  Percent, Tag, Check
} from 'lucide-react';
import * as api from '../../services/api';

export default function B2BRegisterPage({ onNavigateLogin, onNavigateHome }) {
  const [formData, setFormData] = useState({
    company_name: '',
    business_type: 'Travel Agency',
    initial_mode: 'COMMISSION', // 'COMMISSION' or 'NON_COMMISSION'
    email: '',
    phone: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: 'Goa',
    country: 'India',
    pincode: '',
    username: '',
    password: '',
    confirm_password: '',
    terms_accepted: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [registeredPartnerId, setRegisteredPartnerId] = useState('');

  const businessTypeOptions = [
    'Travel Agency',
    'Tour Operator',
    'Travel Consultant',
    'Corporate Travel',
    'Online Travel Agency',
    'Other'
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend Validations
    if (!formData.company_name.trim()) {
      setError('Agency / Company name is required.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid business email.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit business phone number.');
      return;
    }
    if (!formData.contact_name.trim()) {
      setError('Contact person name is required.');
      return;
    }
    if (!formData.contact_email.trim() || !formData.contact_email.includes('@')) {
      setError('Please enter a valid contact person email.');
      return;
    }
    if (!formData.contact_phone.trim() || formData.contact_phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit contact mobile number.');
      return;
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.pincode.trim()) {
      setError('Please complete the full business address details.');
      return;
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    if (!formData.terms_accepted) {
      setError('Please accept the WOW GOA B2B Partner Terms & Conditions to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.b2bRegister(formData);
      if (res && res.success) {
        setRegisteredPartnerId(res.partner_id || '');
        setSubmitted(true);
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState(null, '', '/b2b/registration-success');
        }
      } else {
        setError(res.error || 'Failed to submit registration application.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If successfully submitted, render the professional success page
  if (submitted) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 50%, #000000 100%)', color: '#ffffff' }}>
        {/* Top Header */}
        <div className="container py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={onNavigateHome}>
            <div className="rounded-3 p-2 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
              <Compass size={22} />
            </div>
            <div>
              <span className="fw-black fs-5 tracking-wider text-white font-heading">WOW GOA</span>
              <span className="badge bg-warning text-dark text-xxs fw-bold ms-2 px-2 py-0.5 rounded-pill">B2B PORTAL</span>
            </div>
          </div>
          <button className="btn btn-outline-light btn-sm rounded-pill px-3 text-xs" onClick={onNavigateHome}>
            ← Back to Main Website
          </button>
        </div>

        {/* Main Success Container */}
        <div className="container py-5 d-flex justify-content-center">
          <div className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in" style={{ maxWidth: '560px', width: '100%', background: '#ffffff', color: '#0D1B2E' }}>
            <div className="p-4 text-center border-bottom" style={{ background: '#0D1B2E', color: '#ffffff' }}>
              <div className="rounded-circle mx-auto mb-2 p-3 bg-warning text-dark d-inline-flex align-items-center justify-content-center shadow" style={{ width: '64px', height: '64px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 className="fw-bold mb-1 font-heading">Application Submitted Successfully</h4>
              <p className="text-white-50 text-xs mb-0">
                WOW GOA B2B Travel Partner Program
              </p>
            </div>

            <div className="card-body p-4 p-md-5 text-center">
              <div className="mb-4">
                <div className="p-3.5 rounded-4 bg-light border text-start mb-3">
                  <div className="text-muted text-xxs text-uppercase fw-bold mb-1">Agency Name</div>
                  <div className="fw-bold fs-6 text-dark font-heading">{formData.company_name}</div>
                  <div className="text-muted text-xs mt-0.5">{formData.city}, {formData.state} • {formData.business_type}</div>
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-warning bg-opacity-10 border border-warning mb-3">
                  <span className="text-xs fw-bold text-dark">Application Status:</span>
                  <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fw-black font-heading text-xs">
                    ⏳ PENDING VERIFICATION
                  </span>
                </div>

                <div className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded-3 bg-light border mb-3 text-start">
                  <div>
                    <span className="text-xxs text-muted text-uppercase fw-bold d-block">Requested Pricing Mode</span>
                    <span className="text-xs fw-bold text-dark">
                      {formData.initial_mode === 'NON_COMMISSION' ? 'Non-Commission (Net B2B)' : 'Commission Mode (Standard)'}
                    </span>
                  </div>
                  <span className={`badge ${formData.initial_mode === 'NON_COMMISSION' ? 'bg-primary' : 'bg-warning text-dark'} text-xxs fw-bold px-2.5 py-1 rounded-pill`}>
                    {formData.initial_mode}
                  </span>
                </div>

                <p className="text-muted text-xs leading-relaxed mb-0">
                  Thank you for registering as a WOW GOA B2B Partner. Your application has been submitted successfully and is currently under review.
                </p>
                <p className="text-muted text-xs mt-2 fw-semibold">
                  You will be able to access the WOW GOA B2B Portal once an Admin approves your application.
                </p>
              </div>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-dark text-white fw-bold py-2.5 rounded-pill shadow-sm font-heading d-flex align-items-center justify-content-center gap-2"
                  onClick={onNavigateLogin}
                >
                  <ArrowLeft size={16} /> Back to B2B Login
                </button>
              </div>

              <div className="mt-4 pt-3 border-top text-center">
                <div className="d-flex align-items-center justify-content-center gap-2 text-muted text-xxs">
                  <ShieldCheck size={14} className="text-success" />
                  <span>Your application details are secured with 256-Bit SSL encryption.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="container py-3 text-center text-white-50 text-xxs">
          © {new Date().getFullYear()} WOW GOA B2B Channel. All rights reserved.
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 50%, #000000 100%)', color: '#ffffff' }}>
      {/* Top Header */}
      <div className="container py-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={onNavigateHome}>
          <div className="rounded-3 p-2 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
            <Compass size={22} />
          </div>
          <div>
            <span className="fw-black fs-5 tracking-wider text-white font-heading">WOW GOA</span>
            <span className="badge bg-warning text-dark text-xxs fw-bold ms-2 px-2 py-0.5 rounded-pill">B2B PARTNER</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-warning btn-sm rounded-pill px-3 text-xs fw-bold" onClick={onNavigateLogin}>
            Login to B2B
          </button>
          <button className="btn btn-outline-light btn-sm rounded-pill px-3 text-xs" onClick={onNavigateHome}>
            Main Website
          </button>
        </div>
      </div>

      {/* Main Registration Form Container */}
      <div className="container py-4 d-flex justify-content-center">
        <div className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in" style={{ maxWidth: '780px', width: '100%', background: '#ffffff', color: '#0D1B2E' }}>
          {/* Header Banner */}
          <div className="p-4 text-center border-bottom" style={{ background: '#0D1B2E', color: '#ffffff' }}>
            <div className="rounded-circle mx-auto mb-2 p-2.5 bg-warning text-dark d-inline-flex align-items-center justify-content-center" style={{ width: '52px', height: '52px' }}>
              <Building2 size={26} />
            </div>
            <h3 className="fw-bold mb-1 font-heading">Become a WOW GOA B2B Partner</h3>
            <p className="text-white-50 text-xs mb-0">
              Register your travel business to access WOW GOA's B2B travel inventory.
            </p>
          </div>

          <div className="card-body p-4 p-md-5">
            {error && (
              <div className="alert alert-danger py-2.5 px-3 rounded-3 text-xs d-flex align-items-center gap-2 mb-4">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* SECTION 1: BUSINESS DETAILS */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <Building2 size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    1. Business Details
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-7">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Agency / Company Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Royal Goa Holidays Pvt Ltd"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-5">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Business Type *</label>
                    <select
                      className="form-select form-select-sm"
                      value={formData.business_type}
                      onChange={(e) => handleChange('business_type', e.target.value)}
                      required
                    >
                      {businessTypeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Business Email *</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="agency@company.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Business Phone *</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      placeholder="10-digit phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Website (Optional)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="https://agency.com"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: INITIAL PRICING MODE */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <Percent size={18} className="text-warning" />
                    <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                      2. Initial Pricing Mode *
                    </h6>
                  </div>
                  <span className="badge bg-light text-muted border text-xxs fw-semibold">Choose one initial mode</span>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div 
                      onClick={() => handleChange('initial_mode', 'COMMISSION')}
                      className={`p-3.5 rounded-4 border transition-all h-100 ${
                        formData.initial_mode === 'COMMISSION' 
                          ? 'border-warning bg-warning bg-opacity-10 shadow-sm' 
                          : 'border-light-subtle bg-white hover-shadow-sm'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <input 
                          type="radio" 
                          id="mode-comm"
                          name="initial_mode" 
                          checked={formData.initial_mode === 'COMMISSION'} 
                          onChange={() => handleChange('initial_mode', 'COMMISSION')}
                          className="mt-1 form-check-input flex-shrink-0"
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <label htmlFor="mode-comm" className="fw-bold text-dark text-sm mb-0 cursor-pointer" style={{ cursor: 'pointer' }}>
                              Commission Mode
                            </label>
                            <span className="badge bg-warning text-dark text-xxs fw-bold">Standard</span>
                          </div>
                          <p className="text-muted text-xs mb-2 leading-relaxed">
                            Sell travel services at WOW GOA retail prices and receive regular commission payouts.
                          </p>
                          <div className="text-xxs text-secondary d-flex flex-column gap-1">
                            <span>✓ Guest pays retail selling price</span>
                            <span>✓ Direct commission payout credited to your account</span>
                            <span>✓ Complete commission analytics & earning reports</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div 
                      onClick={() => handleChange('initial_mode', 'NON_COMMISSION')}
                      className={`p-3.5 rounded-4 border transition-all h-100 ${
                        formData.initial_mode === 'NON_COMMISSION' 
                          ? 'border-primary bg-primary bg-opacity-10 shadow-sm' 
                          : 'border-light-subtle bg-white hover-shadow-sm'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <input 
                          type="radio" 
                          id="mode-non-comm"
                          name="initial_mode" 
                          checked={formData.initial_mode === 'NON_COMMISSION'} 
                          onChange={() => handleChange('initial_mode', 'NON_COMMISSION')}
                          className="mt-1 form-check-input flex-shrink-0"
                          style={{ cursor: 'pointer' }}
                        />
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <label htmlFor="mode-non-comm" className="fw-bold text-dark text-sm mb-0 cursor-pointer" style={{ cursor: 'pointer' }}>
                              Non-Commission Mode
                            </label>
                            <span className="badge bg-primary text-white text-xxs fw-bold">B2B Net Rate</span>
                          </div>
                          <p className="text-muted text-xs mb-2 leading-relaxed">
                            Book services directly at discounted wholesale B2B net prices.
                          </p>
                          <div className="text-xxs text-secondary d-flex flex-column gap-1">
                            <span>✓ Pay discounted net wholesale rate upfront</span>
                            <span>✓ Apply your own markup to your travelers</span>
                            <span>✓ Dedicated net receipts and booking vouchers</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 text-xxs text-muted d-flex align-items-center gap-1.5">
                  <ShieldCheck size={14} className="text-success" />
                  <span>Access to the secondary mode can be requested anytime from your Partner Profile after account activation.</span>
                </div>
              </div>

              {/* SECTION 3: CONTACT PERSON */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <User size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    3. Primary Contact Person
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.contact_name}
                      onChange={(e) => handleChange('contact_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Contact Person Email *</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="rajesh@agency.com"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Contact Person Mobile *</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      placeholder="10-digit mobile"
                      value={formData.contact_phone}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: BUSINESS ADDRESS */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <MapPin size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    4. Business Address
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Registered Street Address *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Office No, Building, Street, Area"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">City *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Panaji / Mumbai"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label text-xs fw-bold text-muted mb-1">State *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Goa / Maharashtra"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-2">
                    <label className="form-label text-xs fw-bold text-muted mb-1">PIN Code *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="403001"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Country *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: LOGIN CREDENTIALS */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <Lock size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    5. B2B Account Login Details
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Username *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. royal_goa"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      required
                    />
                    <div className="text-muted text-xxs mt-0.5">Lowercase alphanumeric & underscores only.</div>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Password *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Confirm Password *</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      placeholder="Re-enter password"
                      value={formData.confirm_password}
                      onChange={(e) => handleChange('confirm_password', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* TERMS & CONDITIONS */}
              <div className="mb-4 p-3 bg-light rounded-3 border">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="terms_check"
                    checked={formData.terms_accepted}
                    onChange={(e) => handleChange('terms_accepted', e.target.checked)}
                    required
                  />
                  <label className="form-check-label text-xs text-dark" htmlFor="terms_check">
                    I agree to the <strong>WOW GOA B2B Partner Terms & Conditions and Privacy Policy</strong>. I understand my application is subject to verification by WOW GOA Admin prior to account activation.
                  </label>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-warning text-dark fw-bold w-100 py-2.5 rounded-pill d-flex align-items-center justify-content-center gap-2 shadow font-heading fs-6"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Submitting Partner Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Partner Application</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-top text-center">
              <span className="text-muted text-xs">Already have a WOW GOA B2B account? </span>
              <button
                type="button"
                className="btn btn-link p-0 text-xs fw-bold text-dark text-decoration-underline"
                onClick={onNavigateLogin}
              >
                Login here
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="container py-3 text-center text-white-50 text-xxs">
        © {new Date().getFullYear()} WOW GOA B2B Channel. All rights reserved.
      </div>
    </div>
  );
}
