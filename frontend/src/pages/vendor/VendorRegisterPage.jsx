import React, { useState } from 'react';
import { 
  Building2, User, Phone, Mail, Globe, MapPin, Lock, 
  CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Compass, ArrowLeft,
  Car, Hotel, Plane
} from 'lucide-react';
import * as api from '../../services/api';

const VENDOR_CONFIG = {
  hotel_vendor: {
    role: 'hotel_vendor',
    title: 'Hotel & Resort Partner Registration',
    subtitle: 'Register your property to list rooms, suites, and boutique stays on WOW GOA',
    badge: 'HOTEL VENDOR',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: Hotel,
    loginRoute: '/hotel/login',
    loginLabel: 'Go to Hotel Vendor Login'
  },
  vendor: {
    role: 'vendor',
    title: 'Vehicle Fleet Operator Registration',
    subtitle: 'Register your commercial fleet to manage and list rental cars and bikes on WOW GOA',
    badge: 'VEHICLE VENDOR',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Car,
    loginRoute: '/vehicle/login',
    loginLabel: 'Go to Vehicle Vendor Login'
  },
  flight_vendor: {
    role: 'flight_vendor',
    title: 'Flight & Air Charter Partner Registration',
    subtitle: 'Register your aviation enterprise to list flight schedules and air charters on WOW GOA',
    badge: 'FLIGHT VENDOR',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Plane,
    loginRoute: '/flight/login',
    loginLabel: 'Go to Flight Vendor Login'
  }
};

export default function VendorRegisterPage({ 
  vendorType = 'vendor', 
  onNavigateLogin, 
  onNavigateHome, 
  onNavigateBack 
}) {
  const config = VENDOR_CONFIG[vendorType] || VENDOR_CONFIG.vendor;
  const IconComponent = config.icon;

  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: 'Goa',
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
  const [registeredVendorId, setRegisteredVendorId] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend Validations
    if (!formData.company_name.trim()) {
      setError('Business / Company name is required.');
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
    if (!formData.city.trim() || !formData.pincode.trim()) {
      setError('Please provide city and PIN code.');
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
      setError('Please accept the WOW GOA Vendor Terms & Conditions to proceed.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.vendorRegister({
        vendor_type: config.role,
        ...formData
      });
      if (res && res.success) {
        setRegisteredVendorId(res.vendor_id || '');
        setSubmitted(true);
      } else {
        setError(res.error || 'Failed to submit vendor registration.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS VIEW
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
              <span className="badge bg-warning text-dark text-xxs fw-bold ms-2 px-2 py-0.5 rounded-pill">
                {config.badge}
              </span>
            </div>
          </div>
          <button className="btn btn-outline-light btn-sm rounded-pill px-3 text-xs" onClick={onNavigateHome}>
            ← Back to Main Website
          </button>
        </div>

        {/* Success Card */}
        <div className="container py-5 d-flex justify-content-center">
          <div className="card border-0 shadow-2xl rounded-4 overflow-hidden animate-fade-in" style={{ maxWidth: '560px', width: '100%', background: '#ffffff', color: '#0D1B2E' }}>
            <div className="p-4 text-center border-bottom" style={{ background: '#0D1B2E', color: '#ffffff' }}>
              <div className="rounded-circle mx-auto mb-2 p-3 bg-warning text-dark d-inline-flex align-items-center justify-content-center shadow" style={{ width: '64px', height: '64px' }}>
                <CheckCircle2 size={36} />
              </div>
              <h4 className="fw-bold mb-1 font-heading">Vendor Application Submitted</h4>
              <p className="text-white-50 text-xs mb-0">
                WOW GOA {config.badge} Onboarding
              </p>
            </div>

            <div className="card-body p-4 p-md-5 text-center">
              <div className="mb-4">
                <div className="p-3.5 rounded-4 bg-light border text-start mb-3">
                  <div className="text-muted text-xxs text-uppercase fw-bold mb-1">Company / Operator Name</div>
                  <div className="fw-bold fs-6 text-dark font-heading">{formData.company_name}</div>
                  <div className="text-muted text-xs mt-0.5">{formData.city}, {formData.state} • {config.badge}</div>
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-warning bg-opacity-10 border border-warning mb-3">
                  <span className="text-xs fw-bold text-dark">Verification Status:</span>
                  <span className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fw-black font-heading text-xs">
                    ⏳ PENDING APPROVAL
                  </span>
                </div>

                <p className="text-muted text-xs leading-relaxed mb-0">
                  Thank you for registering your company on WOW GOA. Your operator profile and application are now under review by our operations verification desk.
                </p>
                <p className="text-muted text-xs mt-2 fw-semibold">
                  Once your application is approved, you will be able to log in to your dedicated portal at <span className="font-monospace text-dark fw-bold">{config.loginRoute}</span>.
                </p>
              </div>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-dark text-white fw-bold py-2.5 rounded-pill shadow-sm font-heading d-flex align-items-center justify-content-center gap-2"
                  onClick={() => {
                    if (onNavigateLogin) {
                      onNavigateLogin(config.loginRoute);
                    } else if (typeof window !== 'undefined') {
                      window.history.pushState(null, '', config.loginRoute);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                >
                  <ArrowLeft size={16} /> {config.loginLabel}
                </button>
              </div>

              <div className="mt-4 pt-3 border-top text-center">
                <div className="d-flex align-items-center justify-content-center gap-2 text-muted text-xxs">
                  <ShieldCheck size={14} className="text-success" />
                  <span>Enterprise SSL 256-Bit verified registration.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="container py-3 text-center text-white-50 text-xxs">
          © {new Date().getFullYear()} WOW GOA Operator Network. All rights reserved.
        </div>
      </div>
    );
  }

  // REGISTRATION FORM
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
            <span className="badge bg-warning text-dark text-xxs fw-bold ms-2 px-2 py-0.5 rounded-pill">
              {config.badge}
            </span>
          </div>
        </div>
        <div className="d-flex gap-2">
          {onNavigateBack && (
            <button className="btn btn-outline-light btn-sm rounded-pill px-3 text-xs" onClick={onNavigateBack}>
              ← Change Vendor Type
            </button>
          )}
          <button 
            className="btn btn-outline-warning btn-sm rounded-pill px-3 text-xs fw-bold" 
            onClick={() => {
              if (onNavigateLogin) {
                onNavigateLogin(config.loginRoute);
              } else if (typeof window !== 'undefined') {
                window.history.pushState(null, '', config.loginRoute);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
          >
            Vendor Login
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
              <IconComponent size={26} />
            </div>
            <h3 className="fw-bold mb-1 font-heading">{config.title}</h3>
            <p className="text-white-50 text-xs mb-0">
              {config.subtitle}
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
                  <IconComponent size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    1. Operator & Business Profile
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Company / Fleet / Property Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={vendorType === 'hotel_vendor' ? 'e.g. Casa Baga Boutique Resort' : (vendorType === 'flight_vendor' ? 'e.g. Star Air Charters Pvt Ltd' : 'e.g. Royal Goa Self-Drive Rentals')}
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Business Email *</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="operator@company.com"
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
                      placeholder="https://company.com"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRIMARY CONTACT */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <User size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    2. Primary Contact Person
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Amit Patil"
                      value={formData.contact_name}
                      onChange={(e) => handleChange('contact_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Contact Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="amit@company.com"
                      value={formData.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Contact Mobile</label>
                    <input
                      type="tel"
                      className="form-control form-control-sm"
                      placeholder="10-digit mobile"
                      value={formData.contact_phone}
                      onChange={(e) => handleChange('contact_phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: OPERATING ADDRESS */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <MapPin size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    3. Operating Location & Address
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Office / Garage / Property Address</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Street, Landmark, Area"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Operating Hub / City *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Panaji / Calangute / Dabolim"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">State</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">PIN Code *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="403516"
                      value={formData.pincode}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: LOGIN CREDENTIALS */}
              <div className="mb-4">
                <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
                  <Lock size={18} className="text-warning" />
                  <h6 className="fw-bold mb-0 text-dark font-heading text-uppercase text-xs tracking-wider">
                    4. Vendor Portal Login Credentials
                  </h6>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label text-xs fw-bold text-muted mb-1">Username *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. goa_fleet_ops"
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
                    id="vendor_terms_check"
                    checked={formData.terms_accepted}
                    onChange={(e) => handleChange('terms_accepted', e.target.checked)}
                    required
                  />
                  <label className="form-check-label text-xs text-dark" htmlFor="vendor_terms_check">
                    I agree to the <strong>WOW GOA Vendor Partner Terms & Conditions and Inventory Listing Policy</strong>. I understand my account will be reviewed and verified by WOW GOA Operations before listing activation.
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
                    <span>Submitting Vendor Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Vendor Application</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-top text-center">
              <span className="text-muted text-xs">Already have a WOW GOA operator account? </span>
              <button
                type="button"
                className="btn btn-link p-0 text-xs fw-bold text-dark text-decoration-underline"
                onClick={() => {
                  if (onNavigateLogin) {
                    onNavigateLogin(config.loginRoute);
                  } else if (typeof window !== 'undefined') {
                    window.history.pushState(null, '', config.loginRoute);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
              >
                Login to {config.badge}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="container py-3 text-center text-white-50 text-xxs">
        © {new Date().getFullYear()} WOW GOA Operator Network. All rights reserved.
      </div>
    </div>
  );
}
