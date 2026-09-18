import React from 'react';
import { ShieldAlert, ArrowRight, LogOut, Home } from 'lucide-react';

export default function RoleAccessDeniedModal({ 
  currentUser, 
  expectedRole, 
  onLogout, 
  onNavigateHome 
}) {
  const getAuthorizedDestination = () => {
    const role = (currentUser?.role || '').toLowerCase();
    if (role === 'hotel_vendor') return { path: '/hotel-vendor', label: 'Hotel Vendor Portal' };
    if (role === 'flight_vendor') return { path: '/flight-vendor', label: 'Flight Vendor Portal' };
    if (role === 'vendor' || role === 'vehicle_vendor') return { path: '/vendor', label: 'Vehicle Vendor Portal' };
    if (role === 'b2b' || role === 'agent') return { path: '/b2b', label: 'B2B Partner Portal' };
    if (role === 'admin' || role === 'superadmin') return { path: '/admin', label: 'Admin Portal' };
    return { path: '/', label: 'Home Page' };
  };

  const dest = getAuthorizedDestination();

  const handleNavigateAuthorized = () => {
    if (typeof window !== 'undefined') {
      window.location.href = dest.path;
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 50%, #000000 100%)' }}>
      <div className="card border-0 rounded-4 shadow-lg p-4 p-md-5 text-center" style={{ maxWidth: '480px', width: '100%', background: '#ffffff' }}>
        <div className="rounded-circle mx-auto mb-3 p-3 bg-danger bg-opacity-10 text-danger d-inline-flex align-items-center justify-content-center" style={{ width: '68px', height: '68px' }}>
          <ShieldAlert size={36} />
        </div>

        <h3 className="fw-bold font-heading text-dark mb-1">
          Access Restricted
        </h3>
        <p className="text-muted text-xs mb-3">
          This portal is reserved exclusively for authenticated <strong className="text-dark">{expectedRole}</strong> accounts.
        </p>

        <div className="alert alert-warning py-2.5 px-3 rounded-3 text-xs mb-4 text-start border-warning border-opacity-50">
          <div className="mb-1">
            <strong>Logged-in Account:</strong> {currentUser?.username || currentUser?.email || 'Authenticated User'}
          </div>
          <div>
            <strong>Assigned Role:</strong> <span className="badge bg-dark text-warning ms-1">{currentUser?.role || 'unknown'}</span>
          </div>
        </div>

        <div className="d-grid gap-2">
          <button 
            type="button" 
            className="btn btn-warning text-dark fw-bold rounded-pill py-2.5 text-xs font-heading d-flex align-items-center justify-content-center gap-2 shadow-sm"
            onClick={handleNavigateAuthorized}
          >
            <span>Go to My Portal ({dest.label})</span>
            <ArrowRight size={15} />
          </button>

          <button 
            type="button" 
            className="btn btn-outline-danger rounded-pill py-2 text-xs font-heading d-flex align-items-center justify-content-center gap-2"
            onClick={onLogout}
          >
            <LogOut size={14} />
            <span>Logout &amp; Switch Operator Account</span>
          </button>

          {onNavigateHome && (
            <button 
              type="button" 
              className="btn btn-link text-muted text-xs p-1 mt-1 text-decoration-none"
              onClick={onNavigateHome}
            >
              ← Back to Main Website
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
