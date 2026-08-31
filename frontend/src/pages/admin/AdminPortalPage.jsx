import React, { useState } from 'react';
import {
  Compass, LogOut, Box, Building, MessageSquare, CreditCard, Calendar,
  Plane, Hotel, Shield, LayoutDashboard, Globe, Users, Tag, BarChart2,
  ChevronDown, ChevronRight, Menu, Bell, Layers, FileText, Star, PlusCircle, Settings, X, UserPlus
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminDashboardOverview from './AdminDashboardOverview';

import AdminCMS from './AdminCMS';
import AdminCustomerManagement from './AdminCustomerManagement';
import AdminBookingManagement from './AdminBookingManagement';
import AdminPromotions from './AdminPromotions';
import AdminAnalytics from './AdminAnalytics';
import FlightVendorDashboard from '../vendor/FlightVendorDashboard';
import HotelVendorDashboard from '../vendor/HotelVendorDashboard';
import VendorDashboard from '../vendor/VendorDashboard';
import PMSAvailabilityCalendar from '../vendor/pms/PMSAvailabilityCalendar';
import AdminPlatformSettings from './AdminPlatformSettings';
import AdminWalletRecharges from './AdminWalletRecharges';
import AdminMarkupPanel from './AdminMarkupPanel';
import PMSPaymentSettings from '../vendor/pms/PMSPaymentSettings';
import AdminEnquiryCRM from './AdminEnquiryCRM';
import LeadManagement from './LeadManagement';
import AdminSubscriptionPanel from '../../components/admin/AdminSubscriptionPanel';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    ]
  },

  {
    label: 'Inventory',
    items: [
      { id: 'packages', label: 'Manage Packages', icon: <Compass size={15} /> },
      { id: 'admin_hotels', label: 'Manage Hotel', icon: <Hotel size={15} /> },
      { id: 'admin_vehicles', label: 'Manage Vehicle', icon: <Shield size={15} /> },
      { id: 'availability', label: 'Availability Calendar', icon: <Calendar size={15} /> },
    ]
  },
  {
    label: 'Partners',
    items: [
      { id: 'vendors', label: 'Vendor Management', icon: <Building size={15} /> },
      { id: 'wallets', label: 'Vendor Wallets & Payouts', icon: <CreditCard size={15} /> },
    ]
  },
  {
    label: 'Customers',
    items: [
      { id: 'customers', label: 'Customer Management', icon: <Users size={15} /> },
      { id: 'bookings', label: 'Booking Management', icon: <Calendar size={15} /> },
      { id: 'leads', label: 'Lead Management', icon: <Users size={15} /> },
      { id: 'enquiries', label: 'Custom Enquiries', icon: <FileText size={15} /> },
      { id: 'add_users', label: 'Create Sub-Admin / Add Users', icon: <UserPlus size={15} /> },
    ]
  },
  {
    label: 'Revenue',
    items: [
      { id: 'promotions', label: 'Promotions & Offers', icon: <Tag size={15} /> },
      { id: 'markup_reports', label: 'Markup & Reports', icon: <CreditCard size={15} /> },
      { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} /> },
    ]
  },
  {
    label: 'Settings',
    items: [
      { id: 'platform_settings', label: 'Platform Settings', icon: <Settings size={15} /> },
      { id: 'payment_settings', label: 'Payment Gateways', icon: <CreditCard size={15} /> },
      { id: 'wallet_recharges', label: 'Wallet Recharges', icon: <CreditCard size={15} /> },
    ]
  },
  {
    label: 'Subscription',
    items: [
      { id: 'subscription', label: 'My Subscription', icon: <Star size={15} /> },
    ]
  },
  {
    label: 'Legacy',
    items: [
      { id: 'coupons', label: 'Coupons Master', icon: <Box size={15} /> },
    ]
  },
];

function SidebarGroup({ group, activeTab, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(group.label === 'Customers' || group.label === 'Overview' || defaultOpen || group.items.some(i => i.id === activeTab));
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)} className="btn w-100 d-flex align-items-center justify-content-between px-3 py-1 border-0" style={{ background: 'transparent', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)' }}>
        <span>{group.label}</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      {open && (
        <div className="d-flex flex-column gap-0 px-1">
          {group.items.map(item => (
            <button key={item.id} onClick={() => onSelect(item.id)} className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-1" style={{ fontSize: '0.83rem', background: activeTab === item.id ? 'linear-gradient(90deg,#FF6333,#FF8A00)' : 'transparent', color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.65)', boxShadow: activeTab === item.id ? '0 4px 12px rgba(255,99,51,0.3)' : 'none', fontWeight: activeTab === item.id ? 700 : 400 }}>
              <span style={{ color: activeTab === item.id ? '#fff' : '#00B8D9', flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN HOTELS VIEW (with Add Hotel button) ───────────────────────────────
function AdminHotelsView({ hotels, onAddHotel, onUpdateHotel, onDeleteHotel, bookings, currentUser }) {
  const [innerTab, setInnerTab] = React.useState('hotels');
  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E' }}>Manage Hotels</h5>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>{hotels.length} hotels in inventory</p>
        </div>
        <button
          className="btn fw-bold text-white d-flex align-items-center gap-2"
          style={{ background: innerTab === 'add_hotel' ? '#64748b' : 'linear-gradient(90deg,#FF6333,#FF8A00)', borderRadius: '8px', fontSize: '0.85rem' }}
          onClick={() => setInnerTab(innerTab === 'add_hotel' ? 'hotels' : 'add_hotel')}>
          <PlusCircle size={16} /> {innerTab === 'add_hotel' ? 'Back to List' : 'Add Hotel'}
        </button>
      </div>
      <div className="rounded-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <HotelVendorDashboard activeTab={innerTab} hotels={hotels} onAddHotel={async (data) => { await onAddHotel(data); setInnerTab('hotels'); }} onUpdateHotel={async (id, data) => { await onUpdateHotel(id, data); setInnerTab('hotels'); }} onDeleteHotel={onDeleteHotel} bookings={bookings} currentUser={currentUser} onEditRequest={() => setInnerTab('add_hotel')} />
      </div>
    </div>
  );
}

export default function AdminPortalPage({
  initialTab,
  currentUser,
  triggerOpenLogin,
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onSetVendorPassword,
  onAddPackage,
  allPackages,
  cars = [],
  bikes = [],
  onUpdatePackage,
  onDeletePackage,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
  onAddBike,
  onUpdateBike,
  onDeleteBike,
  onLogout,
  flights = [],
  onAddFlight,
  onUpdateFlight,
  onDeleteFlight,
  hotels = [],
  onAddHotel,
  onUpdateHotel,
  onDeleteHotel,
  markups = [],
  onSaveMarkup,
  bookings = [],
  usersList = []
}) {
  const [adminActiveTab, setAdminActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    const currentPath = window.location.pathname;
    if (currentPath === '/admin/leads') return 'leads';
    if (currentPath === '/admin/custom-enquiries') return 'enquiries';
    if (currentPath === '/admin/customers') return 'customers';
    if (currentPath === '/admin/add-users') return 'add_users';
    if (currentPath === '/admin/bookings') return 'bookings';
    return localStorage.getItem('adminActiveTab') || 'overview';
  });

  const handleTabChange = (tabId) => {
    setAdminActiveTab(tabId);
    try {
      localStorage.setItem('adminActiveTab', tabId);
      if (tabId === 'leads') {
        window.history.replaceState(null, '', '/admin/leads');
      } else if (tabId === 'enquiries') {
        window.history.replaceState(null, '', '/admin/custom-enquiries');
      } else if (tabId === 'customers') {
        window.history.replaceState(null, '', '/admin/customers');
      } else if (tabId === 'add_users') {
        window.history.replaceState(null, '', '/admin/add-users');
      } else if (tabId === 'bookings') {
        window.history.replaceState(null, '', '/admin/bookings');
      } else if (tabId === 'overview') {
        window.history.replaceState(null, '', '/admin');
      }
    } catch (e) {}
  };
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminVehiclesInnerTab, setAdminVehiclesInnerTab] = useState('fleet');
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_read_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  const getAdminBookingCategory = (b) => {
    const itemId = String(b.item_id || '').toLowerCase();
    const itemName = String(b.item_name || '').toLowerCase();
    const type = String(b.type || b.item_type || '').toLowerCase();

    if (type === 'hotel' || b.hotel_id || itemId.startsWith('hotel-') || itemId.startsWith('htl-') || 
        itemName.includes('marriott') || itemName.includes('taj') || itemName.includes('resort') || itemName.includes('hotel') || itemName.includes('stay')) {
      return { tab: 'admin_hotels', type: 'Hotel Booking', color: '#0284c7' };
    }

    if (['vehicle', 'car', 'bike', 'rental'].includes(type) || b.vehicle_id || itemId.startsWith('car-') || itemId.startsWith('bike-') || itemId.startsWith('veh-') || 
        itemName.includes('thar') || itemName.includes('swift') || itemName.includes('creta') || itemName.includes('activa')) {
      return { tab: 'admin_vehicles', type: 'Vehicle Rental', color: '#ea580c' };
    }

    return { tab: 'bookings', type: 'Holiday Package Booking', color: '#f97316' };
  };

  const adminNotificationsList = (bookings || []).map(b => {
    const cat = getAdminBookingCategory(b);
    const isActionable = b.status === 'Draft' || b.status === 'Pending' || b.status === 'Payment Verification Pending' || b.status === 'New' || b.status === 'CONFIRMED' || b.status === 'Confirmed';
    return {
      id: `b-${b.id}`,
      title: `${cat.type} #${b.id}`,
      message: `${b.name || b.customer_name || 'Customer'} — ${b.item_name || 'Item'} (${b.status || 'Enquiry'} • ₹${parseFloat(b.total_paid || b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')})`,
      time: b.created_at ? String(b.created_at).slice(0, 16) : 'Recent',
      color: cat.color,
      tab: cat.tab,
      isActionable
    };
  });

  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_cleared_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  const activeAdminNotifications = adminNotificationsList.filter(n => !clearedNotifIds.includes(n.id));
  const adminUnreadCount = activeAdminNotifications.filter(n => n.isActionable && !readNotifIds.includes(n.id)).length;

  const handleAdminMarkAllRead = (e) => {
    if (e) e.stopPropagation();
    const allIds = activeAdminNotifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('admin_read_notifs', JSON.stringify(allIds));
    } catch (err) {}
  };

  const handleAdminClearAll = (e) => {
    if (e) e.stopPropagation();
    const allIds = [...clearedNotifIds, ...adminNotificationsList.map(n => n.id)];
    setClearedNotifIds(allIds);
    try {
      localStorage.setItem('admin_cleared_notifs', JSON.stringify(allIds));
    } catch (err) {}
  };

  const handleAdminDismissNotification = (e, id) => {
    e.stopPropagation();
    const updated = [...clearedNotifIds, id];
    setClearedNotifIds(updated);
    try {
      localStorage.setItem('admin_cleared_notifs', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleAdminNotificationClick = (n) => {
    if (!readNotifIds.includes(n.id)) {
      const updated = [...readNotifIds, n.id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('admin_read_notifs', JSON.stringify(updated));
      } catch (err) {}
    }
    setAdminActiveTab(n.tab);
    setShowNotificationDropdown(false);
  };

  React.useEffect(() => {
    localStorage.setItem('adminActiveTab', adminActiveTab);
  }, [adminActiveTab]);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== 'subadmin' && currentUser.role !== 'agent')) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', background: 'rgba(255,99,51,0.15)', border: '2px solid rgba(255,99,51,0.3)' }}>
            <Shield size={42} style={{ color: '#FF6333' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Admin Console</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Please sign in with an admin or sub-admin account to continue</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={triggerOpenLogin}>
            Sign In to Admin Console
          </button>
        </div>
      </div>
    );
  }

  // Force subscription tab if suspended
  if (currentUser?.status === 'suspended' && adminActiveTab !== 'subscription') {
    setAdminActiveTab('subscription');
  }

  const NEW_TABS = ['overview', 'cms', 'customers', 'promotions', 'analytics', 'admin_flights', 'admin_hotels', 'markup_reports'];

  const renderContent = () => {
    switch (adminActiveTab) {
      case 'overview':
        return <AdminDashboardOverview vendors={vendors} allPackages={allPackages} hotels={hotels} cars={cars} bikes={bikes} bookings={bookings} currentUser={currentUser} />;

      case 'subscription':
        return <AdminSubscriptionPanel currentUser={currentUser} />;
      case 'cms':
        return <AdminCMS />;
      case 'customers':
        return <AdminCustomerManagement usersList={usersList} bookings={bookings} currentUser={currentUser} />;
      case 'add_users':
        return <AdminCustomerManagement usersList={usersList} bookings={bookings} initialOpenAddUser={true} currentUser={currentUser} />;
      case 'bookings':
        return <AdminBookingManagement bookings={bookings} currentUser={currentUser} hotels={hotels} cars={cars} bikes={bikes} />;
      case 'leads':
      case 'lead_management':
        return <LeadManagement usersList={usersList} currentUser={currentUser} />;
      case 'enquiries':
      case 'custom_enquiries':
        return <AdminEnquiryCRM usersList={usersList} currentUser={currentUser} />;
      case 'promotions':
        return <AdminPromotions />;
      case 'analytics':
        return <AdminAnalytics bookings={bookings} hotels={hotels} cars={cars} bikes={bikes} vendors={vendors} allPackages={allPackages} />;
      case 'admin_flights':
        return <div className="p-4"><div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}><FlightVendorDashboard activeTab="flights" flights={flights} onAddFlight={onAddFlight} onUpdateFlight={onUpdateFlight} onDeleteFlight={onDeleteFlight} bookings={bookings} currentUser={currentUser} /></div></div>;
      case 'admin_hotels':
        return <AdminHotelsView hotels={hotels} onAddHotel={onAddHotel} onUpdateHotel={onUpdateHotel} onDeleteHotel={onDeleteHotel} bookings={bookings} currentUser={currentUser} />;
      case 'admin_vehicles':
        return <div className="p-4"><div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}><VendorDashboard activeTab={adminVehiclesInnerTab} setActiveTab={setAdminVehiclesInnerTab} vendors={vendors} cars={cars} bikes={bikes} onAddCar={onAddCar} onUpdateCar={onUpdateCar} onDeleteCar={onDeleteCar} onAddBike={onAddBike} onUpdateBike={onUpdateBike} onDeleteBike={onDeleteBike} bookings={bookings} currentUser={currentUser} /></div></div>;
      case 'availability':
        return <div className="p-4"><div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}><PMSAvailabilityCalendar currentUser={currentUser} vendorHotels={hotels} /></div></div>;
      case 'markup_reports':
        return <div className="p-4"><div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}><AdminMarkupPanel markups={markups} onSaveMarkup={onSaveMarkup} vendors={vendors} bookings={bookings} flights={flights} hotels={hotels} cars={cars} bikes={bikes} packages={allPackages} /></div></div>;
      case 'platform_settings':
        return <AdminPlatformSettings />;
      case 'payment_settings':
        return <div className="p-4"><div className="rounded-3 shadow-sm border" style={{ background: '#fff' }}><PMSPaymentSettings currentUser={currentUser} /></div></div>;
      case 'wallet_recharges':
        return <AdminWalletRecharges vendors={vendors} />;
      case 'payment':
        return (
          <div className="p-4">
            <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E' }}>Payment Management</h5>
              <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Customer booking payments and submitted proof images.</p>
              {bookings.filter(b => b.payment_proof || b.payment_screenshot).length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <CreditCard size={40} className="mb-3 opacity-25" />
                  <p className="mb-0">No payment proofs submitted yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle" style={{ fontSize: '0.85rem' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Booking ID</th>
                        <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Customer</th>
                        <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Item</th>
                        <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Amount</th>
                        <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Status</th>
                        <th className="py-3 px-3 fw-bold" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#475569' }}>Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.filter(b => b.payment_proof || b.payment_screenshot).map((b, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 fw-bold" style={{ color: '#0D1B2E' }}>#{b.id}</td>
                          <td className="px-3 py-2">
                            <div className="fw-bold">{b.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.phone}</div>
                          </td>
                          <td className="px-3 py-2">{b.item_name || '—'}</td>
                          <td className="px-3 py-2 fw-bold" style={{ color: '#16a34a' }}>₹{b.total_paid || b.amount_paid || 0}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: b.status === 'Confirmed' ? '#dcfce7' : '#fef9c3', color: b.status === 'Confirmed' ? '#16a34a' : '#ca8a04', fontSize: '0.7rem' }}>{b.status || 'Pending'}</span>
                          </td>
                          <td className="px-3 py-2">
                            {(b.payment_proof || b.payment_screenshot) ? (
                              <a href={b.payment_proof || b.payment_screenshot} target="_blank" rel="noopener noreferrer"
                                className="btn btn-sm fw-bold d-inline-flex align-items-center gap-1"
                                style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.72rem', borderRadius: '6px' }}>
                                <CreditCard size={12} /> View Proof
                              </a>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4">
            <AdminDashboard
              vendors={vendors}
              allPackages={allPackages}
              onAddVendor={onAddVendor}
              onUpdateVendor={onUpdateVendor}
              onDeleteVendor={onDeleteVendor}
              onSetVendorPassword={onSetVendorPassword}
              onAddPackage={onAddPackage}
              onUpdatePackage={onUpdatePackage}
              onDeletePackage={onDeletePackage}
              activeTab={adminActiveTab}
              currentUser={currentUser}
            />
          </div>
        );
    }
  };

  return (
    <div className="d-flex w-100" style={{ height: '100vh', background: '#f0f2f5', overflow: 'hidden' }}>
      {/* Sidebar */}
      {currentUser?.status !== 'suspended' && (
        <div className="d-flex flex-column flex-shrink-0" style={{ width: sidebarOpen ? '256px' : '0px', minWidth: sidebarOpen ? '256px' : '0px', height: '100vh', overflowY: 'auto', overflowX: 'hidden', backgroundColor: '#0D1B2E', borderRight: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s ease' }}>
          <div className="px-3 py-3 d-flex align-items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <Compass size={22} style={{ color: '#FF6333' }} />
            <div>
              <div className="fw-extrabold text-white" style={{ fontSize: '15px' }}>TRIPGALILEO</div>
              <div className="fw-bold text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '2px', color: '#00B8D9' }}>Admin Panel</div>
            </div>
          </div>
          <div className="flex-grow-1 py-2">
            {SIDEBAR_GROUPS.map((group, idx) => (
              <SidebarGroup key={group.label} group={group} activeTab={adminActiveTab} onSelect={handleTabChange} defaultOpen={idx < 3} />
            ))}
          </div>
          <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={onLogout} className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333', fontSize: '0.85rem', fontWeight: 600 }}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Topbar */}
        <header className="d-flex align-items-center justify-content-between px-4 flex-shrink-0" style={{ height: '56px', backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            {currentUser?.status !== 'suspended' && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }}><Menu size={20} /></button>
            )}
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '14px' }}>
                {SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === adminActiveTab)?.label || 'Admin Panel'}
              </div>
              <div className="text-white-50" style={{ fontSize: '0.68rem' }}>TripGalileo Admin Console</div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.7rem', fontWeight: 700 }}>
              <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#00e676', display: 'inline-block' }}></span>
              Online
            </span>

            {/* Admin Notification Bell with Badge */}
            <div className="position-relative">
              <button
                type="button"
                className="btn p-2 rounded-circle border-0 d-flex align-items-center justify-content-center text-white"
                style={{
                  background: showNotificationDropdown ? 'rgba(255,99,51,0.2)' : 'rgba(255,255,255,0.08)',
                  width: '36px',
                  height: '36px',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowProfileDropdown(false);
                }}
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell size={18} style={{ color: adminUnreadCount > 0 ? '#FF6333' : 'rgba(255,255,255,0.7)' }} />
                {adminUnreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-dark"
                    style={{ fontSize: '0.6rem', padding: '0.25em 0.45em' }}
                  >
                    {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationDropdown && (
                <div
                  className="position-absolute shadow-lg animate-fade-in-up"
                  style={{
                    right: 0,
                    top: '46px',
                    width: '340px',
                    maxWidth: '90vw',
                    background: '#10243A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    zIndex: 1060,
                    overflow: 'hidden'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center justify-content-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0D1B2E' }}>
                    <div className="d-flex align-items-center gap-2">
                      <Bell size={15} className="text-warning" />
                      <span className="fw-bold text-white small">Live Notifications</span>
                      {adminUnreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill" style={{ fontSize: '0.62rem' }}>
                          {adminUnreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {adminUnreadCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm p-0 text-white-50 border-0"
                          style={{ fontSize: '0.68rem', textDecoration: 'underline' }}
                          onClick={handleAdminMarkAllRead}
                        >
                          Mark read
                        </button>
                      )}
                      {activeAdminNotifications.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm px-1.5 py-0.5 text-danger border border-danger border-opacity-25 rounded"
                          style={{ fontSize: '0.65rem', background: 'rgba(220,38,38,0.1)' }}
                          onClick={handleAdminClearAll}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {activeAdminNotifications.length === 0 ? (
                      <div className="p-4 text-center text-white-50 small">
                        No active notifications
                      </div>
                    ) : (
                      activeAdminNotifications.slice(0, 7).map((n) => {
                        const isUnread = !readNotifIds.includes(n.id) && n.isActionable;
                        return (
                          <div
                            key={n.id}
                            className="px-3 py-2.5 border-bottom border-secondary border-opacity-10 cursor-pointer d-flex align-items-start justify-content-between gap-2"
                            style={{ background: isUnread ? 'rgba(255,99,51,0.08)' : 'transparent', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'rgba(255,99,51,0.08)' : 'transparent'}
                            onClick={() => handleAdminNotificationClick(n)}
                          >
                            <div className="d-flex align-items-start gap-2 flex-grow-1 overflow-hidden">
                              <div className="rounded-circle mt-1 flex-shrink-0" style={{ width: '8px', height: '8px', background: n.color }}></div>
                              <div className="flex-grow-1 overflow-hidden">
                                <div className="d-flex align-items-center justify-content-between">
                                  <span className="fw-bold text-white text-truncate" style={{ fontSize: '0.78rem' }}>{n.title}</span>
                                  {isUnread && <span className="badge bg-danger rounded-pill ms-1" style={{ fontSize: '0.55rem' }}>NEW</span>}
                                </div>
                                <div className="text-white-50 text-truncate" style={{ fontSize: '0.72rem' }}>{n.message}</div>
                                <div className="text-white-50 mt-0.5" style={{ fontSize: '0.65rem' }}>{n.time}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm p-0 text-white-50 border-0 flex-shrink-0 ms-1 opacity-75"
                              style={{ background: 'transparent' }}
                              title="Dismiss notification"
                              onClick={(e) => handleAdminDismissNotification(e, n.id)}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0D1B2E' }}>
                    <button
                      type="button"
                      className="btn btn-sm w-100 text-warning fw-bold py-1 border-0"
                      style={{ fontSize: '0.75rem', background: 'rgba(255,159,28,0.08)' }}
                      onClick={() => {
                        setAdminActiveTab('bookings');
                        setShowNotificationDropdown(false);
                      }}
                    >
                      View All Bookings ({activeAdminNotifications.length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const displayName = currentUser?.username || currentUser?.name || currentUser?.email || 'Admin';
              const initial = (displayName[0] || 'A').toUpperCase();
              return (
                <div className="position-relative">
                  <button className="btn p-0 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', border: '2px solid #FF6333', background: 'linear-gradient(135deg,#FFC107,#FF8A00)' }} onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotificationDropdown(false); }}>
                    <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{initial}</span>
                  </button>
                  {showProfileDropdown && (
                    <div className="position-absolute shadow-lg" style={{ right: 0, top: '48px', minWidth: '200px', background: '#10243A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1050 }}>
                      <div className="text-center px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-2" style={{ width: '44px', height: '44px', fontSize: '18px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', color: '#000' }}>{initial}</div>
                        <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{displayName}</div>
                        <span className="badge mt-1" style={{ background: 'rgba(0,184,217,0.15)', color: '#00B8D9', fontSize: '0.6rem' }}>{String(currentUser?.role || 'admin').toUpperCase()}</span>
                      </div>
                      <div className="p-2">
                        <button className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 rounded fw-bold" style={{ color: '#FF6333', background: 'rgba(255,99,51,0.1)', fontSize: '0.85rem' }} onClick={onLogout}>
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </header>

        {/* Content */}
        <div className="flex-grow-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
