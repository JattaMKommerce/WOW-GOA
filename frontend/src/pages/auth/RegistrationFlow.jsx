import React, { useState, useEffect } from 'react';
import { 
  Building2, Briefcase, Hotel, Car, Plane, ArrowRight, ArrowLeft, 
  Compass, ShieldCheck, CheckCircle2, User, ChevronRight, Lock
} from 'lucide-react';
import B2BRegisterPage from '../b2b/B2BRegisterPage';
import VendorRegisterPage from '../vendor/VendorRegisterPage';

export default function RegistrationFlow({ 
  onNavigateLogin, 
  onNavigateHome 
}) {
  // Determine initial step and vendorType from URL parameters if present
  const getInitialState = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vendorParam = params.get('vendor');
      const typeParam = params.get('type');

      if (vendorParam) {
        let vType = 'vendor';
        if (vendorParam === 'hotel' || vendorParam === 'hotel_vendor') vType = 'hotel_vendor';
        else if (vendorParam === 'flight' || vendorParam === 'flight_vendor') vType = 'flight_vendor';
        return { step: 'vendor_form', vendorType: vType };
      }
      if (typeParam === 'b2b') {
        return { step: 'b2b_form', vendorType: null };
      }
    }
    // Default entry point MUST be business_type selection
    return { step: 'business_type', vendorType: null };
  };

  const [state, setState] = useState(getInitialState);
  const { step, vendorType } = state;

  const setStep = (newStep, newVendorType = vendorType) => {
    setState({ step: newStep, vendorType: newVendorType });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If in B2B form step, render B2BRegisterPage directly
  if (step === 'b2b_form') {
    return (
      <B2BRegisterPage
        onNavigateLogin={() => {
          if (onNavigateLogin) onNavigateLogin();
          else if (typeof window !== 'undefined') {
            window.history.pushState(null, '', '/b2b/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }}
        onNavigateHome={onNavigateHome}
        onNavigateBack={() => setStep('business_type')}
      />
    );
  }

  // If in Vendor form step, render VendorRegisterPage directly
  if (step === 'vendor_form' && vendorType) {
    return (
      <VendorRegisterPage
        vendorType={vendorType}
        onNavigateLogin={() => {
          const loginRoutes = {
            hotel_vendor: '/hotel/login',
            vendor: '/vehicle/login',
            flight_vendor: '/flight/login'
          };
          const target = loginRoutes[vendorType] || '/vehicle/login';
          if (typeof window !== 'undefined') {
            window.history.pushState(null, '', target);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }}
        onNavigateHome={onNavigateHome}
        onNavigateBack={() => setStep('vendor_type')}
      />
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 50%, #000000 100%)', color: '#ffffff' }}>
      {/* Top Navigation Bar */}
      <header className="border-bottom border-white-10 py-3" style={{ background: 'rgba(11, 25, 44, 0.75)', backdropFilter: 'blur(10px)' }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={onNavigateHome}>
            <div className="rounded-3 p-2 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center shadow-sm" style={{ width: '38px', height: '38px' }}>
              <Compass size={22} />
            </div>
            <div>
              <span className="fw-black fs-5 tracking-wider text-white font-heading">WOW GOA</span>
              <span className="badge bg-warning text-dark text-xxs fw-bold ms-2 px-2 py-0.5 rounded-pill">
                REGISTRATION PORTAL
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-outline-light btn-sm rounded-pill px-3 text-xs"
              onClick={onNavigateHome}
            >
              ← Back to Website
            </button>
            <button
              className="btn btn-warning text-dark btn-sm fw-bold rounded-pill px-3 text-xs font-heading"
              onClick={() => {
                if (onNavigateLogin) onNavigateLogin();
                else if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/b2b/login');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
            >
              Existing Partner Login
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container py-5 flex-grow-1 d-flex flex-column justify-content-center">
        {step === 'business_type' && (
          <div className="row justify-content-center animate-fade-in">
            <div className="col-12 col-xl-10 text-center mb-4">
              <span className="badge bg-warning text-dark text-xs px-3 py-1 rounded-pill fw-bold text-uppercase tracking-wider mb-3">
                Partner Onboarding Step 1 of 2
              </span>
              <h1 className="fw-black display-6 text-white font-heading mb-2">
                Choose Business Type
              </h1>
              <p className="text-white-50 fs-6 mx-auto mb-4" style={{ maxWidth: '640px' }}>
                Select how your enterprise will collaborate with the WOW GOA travel ecosystem.
              </p>
            </div>

            <div className="col-12 col-xl-10">
              <div className="row g-4 justify-content-center">
                {/* OPTION 1: B2B PARTNER */}
                <div className="col-12 col-md-6">
                  <div 
                    className="card h-100 border-0 rounded-4 shadow-lg text-white p-4 d-flex flex-column justify-content-between transition-all"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onClick={() => setStep('b2b_form')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(245, 158, 11, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="p-3 rounded-4 bg-warning text-dark d-inline-flex align-items-center justify-content-center shadow">
                          <Building2 size={32} />
                        </div>
                        <span className="badge bg-white-10 text-white border border-white-20 px-3 py-1 rounded-pill text-xxs tracking-wider">
                          TRAVEL CHANNEL
                        </span>
                      </div>

                      <h3 className="fw-bold fs-4 text-white font-heading mb-2">
                        B2B Partner
                      </h3>
                      <p className="text-white-50 text-sm mb-4">
                        For Travel Agents, Tour Operators, Corporate Planners &amp; OTAs seeking wholesale net rates or commission earnings.
                      </p>

                      <div className="d-flex flex-column gap-2 mb-4 pt-2 border-top border-white-10">
                        <div className="d-flex align-items-center gap-2 text-xs text-white-75">
                          <CheckCircle2 size={15} className="text-warning flex-shrink-0" />
                          <span>Wholesale Net &amp; Commission Pricing Modes</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-xs text-white-75">
                          <CheckCircle2 size={15} className="text-warning flex-shrink-0" />
                          <span>Multi-Service Booking Engine (Hotels, Fleets, Flights)</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-xs text-white-75">
                          <CheckCircle2 size={15} className="text-warning flex-shrink-0" />
                          <span>Dedicated B2B Wallet &amp; Instant Agency Vouchers</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 font-heading shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStep('b2b_form');
                      }}
                    >
                      <span>Register as B2B Partner</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>

                {/* OPTION 2: VENDOR */}
                <div className="col-12 col-md-6">
                  <div 
                    className="card h-100 border-0 rounded-4 shadow-lg text-white p-4 d-flex flex-column justify-content-between transition-all"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onClick={() => setStep('vendor_type')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.borderColor = '#38bdf8';
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(56, 189, 248, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="p-3 rounded-4 bg-info text-dark d-inline-flex align-items-center justify-content-center shadow">
                          <Briefcase size={32} />
                        </div>
                        <span className="badge bg-white-10 text-white border border-white-20 px-3 py-1 rounded-pill text-xxs tracking-wider">
                          SUPPLY CHANNEL
                        </span>
                      </div>

                      <h3 className="fw-bold fs-4 text-white font-heading mb-2">
                        Vendor
                      </h3>
                      <p className="text-white-50 text-sm mb-4">
                        For Property Owners, Vehicle Fleet Operators, and Aviation Carriers providing verified inventory to WOW GOA.
                      </p>

                      <div className="d-flex flex-column gap-2 mb-4 pt-2 border-top border-white-10">
                        <div className="d-flex align-items-center gap-2 text-xs text-white-75">
                          <CheckCircle2 size={15} className="text-info flex-shrink-0" />
                          <span>Dedicated Vendor Management Portal &amp; PMS</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-xs text-white-75">
                          <CheckCircle2 size={15} className="text-info flex-shrink-0" />
                          <span>Direct Inventory, Pricing &amp; Availability Control</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-xs text-white-75">
                          <CheckCircle2 size={15} className="text-info flex-shrink-0" />
                          <span>Live Booking Dispatch &amp; Operator Settlements</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-info text-dark fw-bold rounded-pill w-100 py-2.5 d-flex align-items-center justify-content-center gap-2 font-heading shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStep('vendor_type');
                      }}
                    >
                      <span>Continue to Vendor Options</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: VENDOR TYPE SELECTION (ONLY Hotel, Vehicle, Flight) */}
        {step === 'vendor_type' && (
          <div className="row justify-content-center animate-fade-in">
            <div className="col-12 col-xl-10 text-center mb-4">
              <div className="d-inline-flex align-items-center gap-2 mb-3">
                <button 
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 text-xs d-inline-flex align-items-center gap-1.5"
                  onClick={() => setStep('business_type')}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Business Type</span>
                </button>
                <span className="badge bg-info text-dark text-xs px-3 py-1 rounded-pill fw-bold text-uppercase tracking-wider">
                  Vendor Category Selection
                </span>
              </div>

              <h1 className="fw-black display-6 text-white font-heading mb-2">
                Choose Vendor Type
              </h1>
              <p className="text-white-50 fs-6 mx-auto mb-4" style={{ maxWidth: '640px' }}>
                Select your specialized service vertical to open the tailored operator registration application.
              </p>
            </div>

            <div className="col-12 col-xl-11">
              <div className="row g-4 justify-content-center">
                {/* 1. HOTEL VENDOR */}
                <div className="col-12 col-md-4">
                  <div 
                    className="card h-100 border-0 rounded-4 shadow-lg text-white p-4 d-flex flex-column justify-content-between transition-all"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onClick={() => setStep('vendor_form', 'hotel_vendor')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.borderColor = '#10b981';
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(16, 185, 129, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="p-3 rounded-4 bg-emerald-500 text-white d-inline-flex align-items-center justify-content-center shadow" style={{ background: '#10b981' }}>
                          <Hotel size={28} />
                        </div>
                        <span className="badge bg-emerald-500 bg-opacity-20 text-emerald-300 border border-emerald-500 border-opacity-30 px-2.5 py-1 rounded-pill text-xxs">
                          PMS PORTAL
                        </span>
                      </div>

                      <h4 className="fw-bold fs-5 text-white font-heading mb-2">
                        Hotel Vendor
                      </h4>
                      <p className="text-white-50 text-xs mb-3">
                        Hotels, Luxury Beach Resorts, Private Pool Villas, Boutique Stays &amp; Homestays.
                      </p>

                      <div className="pt-2 border-top border-white-10 text-xxs text-white-50 mb-3">
                        Assigned Role: <code className="text-warning">hotel_vendor</code>
                        <br />
                        Access Route: <code className="text-info">/hotel/login</code>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-success fw-bold rounded-pill w-100 py-2 text-xs d-flex align-items-center justify-content-center gap-2 font-heading shadow-sm"
                      style={{ background: '#10b981', borderColor: '#10b981' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStep('vendor_form', 'hotel_vendor');
                      }}
                    >
                      <span>Register as Hotel Vendor</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* 2. VEHICLE VENDOR */}
                <div className="col-12 col-md-4">
                  <div 
                    className="card h-100 border-0 rounded-4 shadow-lg text-white p-4 d-flex flex-column justify-content-between transition-all"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onClick={() => setStep('vendor_form', 'vendor')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(245, 158, 11, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="p-3 rounded-4 bg-warning text-dark d-inline-flex align-items-center justify-content-center shadow">
                          <Car size={28} />
                        </div>
                        <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 px-2.5 py-1 rounded-pill text-xxs">
                          FLEET PORTAL
                        </span>
                      </div>

                      <h4 className="fw-bold fs-5 text-white font-heading mb-2">
                        Vehicle Vendor
                      </h4>
                      <p className="text-white-50 text-xs mb-3">
                        Self-Drive Cars, Rental Bikes, Scooters &amp; Commercial Transport Fleets.
                      </p>

                      <div className="pt-2 border-top border-white-10 text-xxs text-white-50 mb-3">
                        Assigned Role: <code className="text-warning">vendor</code>
                        <br />
                        Access Route: <code className="text-info">/vehicle/login</code>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2 text-xs d-flex align-items-center justify-content-center gap-2 font-heading shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStep('vendor_form', 'vendor');
                      }}
                    >
                      <span>Register as Vehicle Vendor</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* 3. FLIGHT VENDOR */}
                <div className="col-12 col-md-4">
                  <div 
                    className="card h-100 border-0 rounded-4 shadow-lg text-white p-4 d-flex flex-column justify-content-between transition-all"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.06)', 
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease'
                    }}
                    onClick={() => setStep('vendor_form', 'flight_vendor')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.borderColor = '#0284c7';
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(2, 132, 199, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="p-3 rounded-4 bg-sky-500 text-white d-inline-flex align-items-center justify-content-center shadow" style={{ background: '#0284c7' }}>
                          <Plane size={28} />
                        </div>
                        <span className="badge bg-sky-500 bg-opacity-20 text-sky-300 border border-sky-500 border-opacity-30 px-2.5 py-1 rounded-pill text-xxs">
                          AVIATION PORTAL
                        </span>
                      </div>

                      <h4 className="fw-bold fs-5 text-white font-heading mb-2">
                        Flight Vendor
                      </h4>
                      <p className="text-white-50 text-xs mb-3">
                        Commercial Airlines, Regional Carriers, Helicopter &amp; Air Charter Operators.
                      </p>

                      <div className="pt-2 border-top border-white-10 text-xxs text-white-50 mb-3">
                        Assigned Role: <code className="text-warning">flight_vendor</code>
                        <br />
                        Access Route: <code className="text-info">/flight/login</code>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-primary fw-bold rounded-pill w-100 py-2 text-xs d-flex align-items-center justify-content-center gap-2 font-heading shadow-sm"
                      style={{ background: '#0284c7', borderColor: '#0284c7' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStep('vendor_form', 'flight_vendor');
                      }}
                    >
                      <span>Register as Flight Vendor</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-top border-white-10 py-3 text-center text-white-50 text-xxs" style={{ background: 'rgba(11, 25, 44, 0.75)' }}>
        <div className="container">
          &copy; {new Date().getFullYear()} WOW GOA Enterprise Network. Verified B2B &amp; Vendor Ecosystem.
        </div>
      </footer>
    </div>
  );
}
