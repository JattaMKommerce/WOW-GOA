import React, { useState, useEffect } from 'react';
import { 
  Building2, LayoutDashboard, Gift, Tag, Hotel, Car, Compass, 
  FileText, Users, TrendingUp, User, LogOut, Globe, Menu, X, ArrowLeft,
  Lock, Clock, ShieldCheck, Plane, Wand2, Wallet
} from 'lucide-react';
import * as api from '../../services/api';
import B2BLoginPage from './B2BLoginPage';
import B2BRegisterPage from './B2BRegisterPage';
import B2BDashboardTab from './B2BDashboardTab';
import B2BInventoryTab from './B2BInventoryTab';
import B2BBookingsTab from './B2BBookingsTab';
import B2BCustomersTab from './B2BCustomersTab';
import B2BReportsTab from './B2BReportsTab';
import B2BProfileTab from './B2BProfileTab';
import B2BWalletTab from './B2BWalletTab';
import B2BNotificationBell from '../../components/b2b/B2BNotificationBell';

export default function B2BPortalPage({ onNavigateHome }) {
  const [partnerUser, setPartnerUser] = useState(() => {
    try {
      const stored = localStorage.getItem('b2b_partner_user');
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed && parsed.status !== 'active') {
        localStorage.removeItem('b2b_partner_user');
        return null;
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const [authSubView, setAuthSubView] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/register') || path.includes('/registration-success')) {
        return 'register';
      }
    }
    return 'login';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeServiceTab, setActiveServiceTab] = useState('selfdrive');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine allowed modes from database values
  const hasCommission = Boolean(partnerUser?.allow_commission);
  const hasNonCommission = Boolean(partnerUser?.allow_non_commission);
  const isPendingMode = (partnerUser?.mode_request_status === 'PENDING');
  const requestedMode = partnerUser?.requested_mode;

  const handleLoginSuccess = (user) => {
    if (user.status !== 'active') {
      alert(user.status === 'pending' 
        ? 'Your B2B application is still under review. You will be able to access the B2B Portal after admin approval.'
        : 'Your B2B application was not approved. Please contact WOW GOA support.');
      return;
    }
    setPartnerUser(user);
    try {
      localStorage.setItem('b2b_partner_user', JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setPartnerUser(null);
    try {
      localStorage.removeItem('b2b_partner_user');
    } catch (e) {}
  };

  const loadDashboard = async () => {
    if (!partnerUser || partnerUser.status !== 'active') return;
    setLoadingDashboard(true);
    try {
      const data = await api.fetchB2BDashboard(partnerUser.id);
      setDashboardData(data);
      if (data?.partner) {
        setPartnerUser(prev => ({ ...prev, ...data.partner }));
        try {
          localStorage.setItem('b2b_partner_user', JSON.stringify({ ...partnerUser, ...data.partner }));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to load B2B dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (partnerUser) {
      loadDashboard();
    }
  }, [partnerUser?.id]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/register') || path.includes('/registration-success')) {
        setAuthSubView('register');
      } else {
        setAuthSubView('login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!partnerUser) {
    if (authSubView === 'register') {
      return (
        <B2BRegisterPage 
          onNavigateLogin={() => {
            if (typeof window !== 'undefined') window.history.pushState(null, '', '/b2b/login');
            setAuthSubView('login');
          }} 
          onNavigateHome={onNavigateHome} 
        />
      );
    }
    return (
      <B2BLoginPage 
        onLoginSuccess={handleLoginSuccess} 
        onNavigateHome={onNavigateHome}
        onNavigateRegister={() => {
          if (typeof window !== 'undefined') window.history.pushState(null, '', '/b2b/register');
          setAuthSubView('register');
        }} 
      />
    );
  }

  const handleSelectServiceFromHome = (serviceKey) => {
    setActiveServiceTab(serviceKey);
    // Route to appropriate active mode tab
    if (hasCommission) {
      setActiveTab('commission_services');
    } else {
      setActiveTab('non_commission_services');
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: '#f8fafc' }}>
      {/* Top Navbar */}
      <header className="sticky-top bg-white border-bottom shadow-xs" style={{ zIndex: 1040 }}>
        <div className="container-fluid px-3 px-lg-4 py-2.5 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button 
              className="btn btn-sm btn-light d-lg-none p-1.5 rounded-3 border"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <div 
              className="d-flex align-items-center gap-2" 
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="rounded-3 p-1.5 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px' }}>
                <Building2 size={19} />
              </div>
              <div>
                <span className="fw-black fs-6 tracking-wider text-dark font-heading">WOW GOA</span>
                <span className="badge bg-dark text-warning text-xxs ms-1.5 px-2 py-0.5 rounded-pill">B2B PORTAL</span>
              </div>
            </div>
          </div>

          {/* Right Header: Approved Mode Indicator + Notification Bell + Agency Profile */}
          <div className="d-flex align-items-center gap-2.5">
            {/* Database Approved Mode Indicator (No free switching) */}
            <div className="d-none d-md-flex align-items-center gap-1.5">
              {hasCommission && hasNonCommission ? (
                <span 
                  className="badge text-xxs px-2.5 py-1 rounded-pill fw-bold"
                  style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                >
                  ✓ Dual Mode Active (Commission + Net)
                </span>
              ) : hasCommission ? (
                <span 
                  className="badge text-xxs px-2.5 py-1 rounded-pill fw-bold"
                  style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}
                >
                  💰 Commission Mode Approved
                </span>
              ) : hasNonCommission ? (
                <span 
                  className="badge text-xxs px-2.5 py-1 rounded-pill fw-bold"
                  style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                >
                  🏷️ Non-Commission Net Mode Approved
                </span>
              ) : null}
            </div>

            {/* Main D2C Site Link */}
            <button 
              onClick={onNavigateHome}
              className="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-1 text-xxs d-none d-sm-flex align-items-center gap-1"
            >
              <Globe size={13} />
              <span>Main D2C Site</span>
            </button>

            {/* Prepaid Wallet Quick Balance Pill */}
            <div 
              onClick={() => setActiveTab('wallet')}
              className="cursor-pointer d-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-light border hover-bg-warning-subtle transition-all"
              style={{ cursor: 'pointer' }}
              title="Click to view Agent Prepaid Wallet & Statement"
            >
              <Wallet size={14} className="text-warning flex-shrink-0" />
              <span className="text-xxs text-muted fw-semibold d-none d-md-inline">Wallet:</span>
              <strong className="text-dark text-xs">
                ₹{parseFloat(partnerUser.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </strong>
            </div>

            {/* Real-Time Notification Bell Component (Requirements 18-23) */}
            <B2BNotificationBell 
              partner={partnerUser} 
              onNotificationClick={(notif) => {
                if (notif.type?.includes('mode')) {
                  setActiveTab('profile');
                } else if (notif.type?.includes('booking')) {
                  setActiveTab(hasCommission ? 'commission_bookings' : 'non_commission_bookings');
                }
              }} 
            />

            {/* Agency User Pill */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="d-flex align-items-center gap-2 p-1 pe-3 bg-light rounded-pill border"
              style={{ cursor: 'pointer' }}
            >
              <div className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                {(partnerUser.company_name || partnerUser.name || 'A')[0]?.toUpperCase()}
              </div>
              <div className="d-none d-sm-block text-start" style={{ lineHeight: '1.1' }}>
                <div className="fw-bold text-dark text-xxs text-truncate" style={{ maxWidth: '120px' }}>
                  {partnerUser.company_name || partnerUser.name}
                </div>
                <div className="text-muted text-xxs" style={{ fontSize: '0.62rem' }}>
                  Agent ID: {partnerUser.id?.substring(0, 10)}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm rounded-circle p-1.5 border-0"
              title="Logout Agency"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout: Dynamic Sidebar + Workspace */}
      <div className="container-fluid px-0 flex-grow-1 d-flex position-relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
            style={{ zIndex: 1025 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Dynamic Sidebar according to Requirements 4 & 27 */}
        <aside 
          className={`bg-white border-end d-flex flex-column justify-content-between p-3 ${
            sidebarOpen ? 'd-flex position-fixed shadow-lg' : 'd-none d-lg-flex position-sticky'
          }`}
          style={{ 
            width: '260px', 
            minWidth: '260px',
            maxWidth: '260px',
            flexShrink: 0,
            zIndex: 1030, 
            height: 'calc(100vh - 58px)', 
            top: '58px',
            left: 0
          }}
        >
          <div className="overflow-y-auto">
            {/* Dashboard Link */}
            <nav className="nav flex-column gap-1 mb-3">
              <button
                onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                  activeTab === 'dashboard' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                }`}
              >
                <LayoutDashboard size={16} />
                <span>B2B Dashboard</span>
              </button>
            </nav>

            {/* COMMISSION MODE SECTION (Case 1 & Case 3) */}
            {hasCommission && (
              <div className="mb-3">
                <div className="text-muted text-xxs fw-bold text-uppercase px-2 mb-1.5 d-flex align-items-center justify-content-between">
                  <span>💰 Commission Channel</span>
                  <span className="badge bg-warning text-dark text-3xs font-monospace">ACTIVE</span>
                </div>
                <nav className="nav flex-column gap-1">
                  <button
                    onClick={() => { setActiveTab('commission_services'); setSidebarOpen(false); }}
                    className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                      activeTab === 'commission_services' ? 'bg-warning text-dark fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                    }`}
                  >
                    <Compass size={15} />
                    <span>Commission Inventory</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('commission_bookings'); setSidebarOpen(false); }}
                    className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                      activeTab === 'commission_bookings' ? 'bg-warning text-dark fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                    }`}
                  >
                    <FileText size={15} />
                    <span>Commission Bookings</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('commission_reports'); setSidebarOpen(false); }}
                    className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                      activeTab === 'commission_reports' ? 'bg-warning text-dark fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                    }`}
                  >
                    <TrendingUp size={15} />
                    <span>Commission Earnings</span>
                  </button>
                </nav>
              </div>
            )}

            {/* NON-COMMISSION (NET) SECTION (Case 2 & Case 3) */}
            {hasNonCommission && (
              <div className="mb-3">
                <div className="text-muted text-xxs fw-bold text-uppercase px-2 mb-1.5 d-flex align-items-center justify-content-between">
                  <span>🏷️ Non-Commission Channel</span>
                  <span className="badge bg-primary text-white text-3xs font-monospace">ACTIVE</span>
                </div>
                <nav className="nav flex-column gap-1">
                  <button
                    onClick={() => { setActiveTab('non_commission_services'); setSidebarOpen(false); }}
                    className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                      activeTab === 'non_commission_services' ? 'bg-primary text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                    }`}
                  >
                    <Compass size={15} />
                    <span>Net Wholesale Inventory</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('non_commission_bookings'); setSidebarOpen(false); }}
                    className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                      activeTab === 'non_commission_bookings' ? 'bg-primary text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                    }`}
                  >
                    <FileText size={15} />
                    <span>Net Wholesale Bookings</span>
                  </button>
                </nav>
              </div>
            )}

            {/* CASE 4: ONE APPROVED, SECOND MODE PENDING REVIEW */}
            {!hasNonCommission && isPendingMode && requestedMode === 'NON_COMMISSION' && (
              <div className="mb-3">
                <div className="text-muted text-xxs fw-bold text-uppercase px-2 mb-1.5">
                  <span>🏷️ Non-Commission Channel</span>
                </div>
                <button
                  onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
                  className="nav-link text-start rounded-3 px-3 py-2 text-xs text-muted border border-dashed border-warning bg-warning bg-opacity-10 d-flex align-items-center gap-2 w-100"
                  title="Non-Commission Mode is pending admin review"
                >
                  <Clock size={14} className="text-warning flex-shrink-0" />
                  <span className="text-truncate">Pending Admin Review</span>
                </button>
              </div>
            )}

            {!hasCommission && isPendingMode && requestedMode === 'COMMISSION' && (
              <div className="mb-3">
                <div className="text-muted text-xxs fw-bold text-uppercase px-2 mb-1.5">
                  <span>💰 Commission Channel</span>
                </div>
                <button
                  onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
                  className="nav-link text-start rounded-3 px-3 py-2 text-xs text-muted border border-dashed border-warning bg-warning bg-opacity-10 d-flex align-items-center gap-2 w-100"
                  title="Commission Mode is pending admin review"
                >
                  <Clock size={14} className="text-warning flex-shrink-0" />
                  <span className="text-truncate">Pending Admin Review</span>
                </button>
              </div>
            )}

            {/* COMMON OPERATIONS */}
            <div className="text-muted text-xxs fw-bold text-uppercase px-2 mb-1.5">Agency Management</div>
            <nav className="nav flex-column gap-1">
              <button
                onClick={() => { setActiveTab('customers'); setSidebarOpen(false); }}
                className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                  activeTab === 'customers' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                }`}
              >
                <Users size={15} />
                <span>Guest Directory</span>
              </button>
              <button
                onClick={() => { setActiveTab('wallet'); setSidebarOpen(false); }}
                className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center justify-content-between ${
                  activeTab === 'wallet' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                }`}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <Wallet size={15} className="text-warning" />
                  <span>Agent Wallet</span>
                </div>
                <span className="badge bg-warning text-dark text-3xs font-monospace">
                  ₹{parseFloat(partnerUser?.wallet_balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </button>
              <button
                onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
                className={`nav-link text-start rounded-3 px-3 py-2 text-xs fw-semibold border-0 d-flex align-items-center gap-2.5 ${
                  activeTab === 'profile' ? 'bg-dark text-white fw-bold shadow-xs' : 'text-muted bg-transparent hover-bg-light'
                }`}
              >
                <User size={15} />
                <span>Partner Profile & Modes</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-3 border-top text-xxs text-muted text-center">
            <span>WOW GOA B2B Engine v2.6</span>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-grow-1 p-3 p-lg-4 overflow-y-auto" style={{ minWidth: 0 }}>
          {activeTab === 'dashboard' && (
            <B2BDashboardTab 
              dashboardData={dashboardData}
              partnerUser={partnerUser}
              onNavigateTab={(tabKey) => {
                if (tabKey === 'commission_services' || tabKey === 'commission') {
                  setActiveTab('commission_services');
                } else if (tabKey === 'non_commission_services' || tabKey === 'non-commission') {
                  setActiveTab('non_commission_services');
                } else if (tabKey === 'profile') {
                  setActiveTab('profile');
                } else {
                  setActiveTab(tabKey);
                }
              }}
              onSelectService={handleSelectServiceFromHome}
            />
          )}

          {/* Commission Services Workspace */}
          {activeTab === 'commission_services' && hasCommission && (
            <B2BInventoryTab 
              mode="COMMISSION"
              partnerUser={partnerUser}
              initialService={activeServiceTab}
              onInitiateBooking={() => loadDashboard()}
            />
          )}

          {/* Non-Commission (Net) Services Workspace */}
          {activeTab === 'non_commission_services' && hasNonCommission && (
            <B2BInventoryTab 
              mode="NON_COMMISSION"
              partnerUser={partnerUser}
              initialService={activeServiceTab}
              onInitiateBooking={() => loadDashboard()}
            />
          )}

          {/* Commission Bookings */}
          {activeTab === 'commission_bookings' && hasCommission && (
            <B2BBookingsTab 
              partnerUser={partnerUser} 
              forcedMode="COMMISSION"
            />
          )}

          {/* Non-Commission Net Bookings */}
          {activeTab === 'non_commission_bookings' && hasNonCommission && (
            <B2BBookingsTab 
              partnerUser={partnerUser} 
              forcedMode="NON_COMMISSION"
            />
          )}

          {/* Commission Reports */}
          {activeTab === 'commission_reports' && hasCommission && (
            <B2BReportsTab partnerUser={partnerUser} />
          )}

          {/* Customers Directory */}
          {activeTab === 'customers' && (
            <B2BCustomersTab partnerUser={partnerUser} />
          )}

          {/* Partner Profile */}
          {activeTab === 'profile' && (
            <B2BProfileTab 
              partnerUser={partnerUser} 
              onLogout={handleLogout} 
              onPartnerRefresh={loadDashboard}
            />
          )}

          {/* Agent Prepaid Wallet */}
          {activeTab === 'wallet' && (
            <B2BWalletTab 
              partnerUser={partnerUser} 
              onWalletUpdated={(newBal) => {
                setPartnerUser(prev => {
                  const updated = { ...prev, wallet_balance: newBal };
                  try { localStorage.setItem('b2b_partner_user', JSON.stringify(updated)); } catch (e) {}
                  return updated;
                });
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
