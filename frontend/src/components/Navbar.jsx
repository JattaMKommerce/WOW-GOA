import React from 'react';
import { Compass, LogOut, User } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function Navbar({ activeTab, setActiveTab, currentUser, triggerOpenLogin, onOpenLogin, onLogout }) {
  const { liveConfig } = useSiteConfig();
  const headerLinks = liveConfig?.menus?.header || [];
  const handleOpenLogin = triggerOpenLogin || onOpenLogin;
  return (
    <nav className="navbar navbar-expand-lg navbar-dark premium-navbar">
      <div className="container-fluid px-xl-5 px-lg-4 px-3" style={{ maxWidth: '1440px' }}>
        <a className="navbar-brand d-flex align-items-center" href="/" onClick={(e) => { e.preventDefault(); setActiveTab('selfdrive'); }}>
          <div className="me-2 text-warning d-flex align-items-center">
            <Compass size={22} className="float-animation" />
          </div>
          <div>
            <span className="text-white">WOW </span>
            <span className="brand-accent">GOA</span>
            <span className="brand-sub">Self Drive Holidays</span>
          </div>
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center gap-1">
            {headerLinks.map(link => {
              // Strip leading slash for active tab matching if needed, or exact match
              const isActive = activeTab === link.id || activeTab === link.href.replace('/', '');
              return (
                <li key={link.id} className="nav-item">
                  <a 
                    className={`nav-link ${isActive ? 'active' : ''}`} 
                    href={link.href} 
                    onClick={(e) => {
                      if(link.href.startsWith('/')) {
                        e.preventDefault();
                        setActiveTab(link.id);
                        // Also push state so URL updates correctly
                        window.history.pushState({}, '', link.href);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}

            {/* Customer Portal My Trips Link */}
            <li className="nav-item">
              <a 
                className={`nav-link ${activeTab === 'customer' ? 'active' : ''}`} 
                href="/customer" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('customer');
                  window.history.pushState({}, '', '/customer');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              >
                <span>🎫 Track Booking</span>
              </a>
            </li>

            {/* Custom Trip Enquiry Button */}
            <li className="nav-item ms-lg-2 me-1">
              <button 
                type="button" 
                className="btn btn-enquire-nav" 
                onClick={() => setActiveTab('custom-trip')}
              >
                Enquire Your Own Package
              </button>
            </li>

            {/* Conditional Authentication Display */}
            {currentUser ? (
              <li className="nav-item ms-lg-2 dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center gap-2 text-white py-1 px-2" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                    <User size={15} />
                  </div>
                </a>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="profileDropdown">
                  <li className="px-3 py-2 border-bottom mb-2 bg-light">
                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '13px' }}>{currentUser.username}</div>
                    <span className="badge bg-primary text-uppercase" style={{ fontSize: '9px' }}>{currentUser.role}</span>
                  </li>
                  <li>
                    <button 
                      className="dropdown-item text-danger d-flex align-items-center gap-2 py-2 fw-bold" 
                      style={{ fontSize: '13px' }}
                      onClick={onLogout}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item ms-lg-1">
                <button
                  type="button"
                  className="btn btn-premium-nav"
                  onClick={handleOpenLogin}
                >
                  Sign In
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

