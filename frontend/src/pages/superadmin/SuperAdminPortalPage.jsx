import React, { useState, useEffect } from 'react';
import {
  Compass, LogOut, Users, Settings, Shield, LayoutDashboard,
  Building, Car, Hotel, Plane, CalendarDays, Wallet, CreditCard,
  Percent, BarChart2, Globe, ChevronDown, ChevronRight,
  Bell, Menu, X, UserCog, CheckCircle
} from 'lucide-react';
import SuperAdminDashboard from './SuperAdminDashboard';
import * as api from '../../services/api';
import { 
  aiLeadsData as defaultAiLeads, 
  customEnquiriesData as defaultCustomEnquiries,
  bookingsData as defaultBookings,
  vendorsData as defaultVendors,
  usersData as defaultUsers
} from '../../data/mockData';
import NotificationSoundToggle from '../../components/common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications } from '../../utils/notificationSound';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> }]
  },
  {
    label: 'Administration',
    items: [
      { id: 'admin_management', label: 'Admin Management', icon: <UserCog size={15} /> },
      { id: 'user_management', label: 'Global User Management', icon: <Users size={15} /> },
    ]
  },
  {
    label: 'Vendors',
    items: [
      { id: 'vendor_management', label: 'Vendor Management', icon: <Building size={15} /> },
      { id: 'vendor_verification', label: 'KYC & Verification', icon: <CheckCircle size={15} /> },
      { id: 'lead_management', label: 'Lead Management', icon: <Users size={15} /> },
    ]
  },
  {
    label: 'Operations',
    items: [
      { id: 'hotel_bookings', label: 'Hotel Booking', icon: <Hotel size={15} /> },
      { id: 'trip_bookings', label: 'Trip Booking', icon: <CalendarDays size={15} /> },
      { id: 'vehicle_bookings', label: 'Vehicle Booking', icon: <Car size={15} /> },
    ]
  },
  {
    label: 'Finance & Monetization',
    items: [
      { id: 'subscription_plans', label: 'Subscription Plans', icon: <CreditCard size={15} /> },
      { id: 'payment_gateway', label: 'Payment Gateways', icon: <Globe size={15} /> },
      { id: 'wallet', label: 'Wallet & Approvals', icon: <Wallet size={15} /> },
      { id: 'commission', label: 'Commission Rules', icon: <Percent size={15} /> },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'reports', label: 'Reports & Analytics', icon: <BarChart2 size={15} /> },
    ]
  },
  {
    label: 'Platform',
    items: [
      { id: 'global_settings', label: 'Global Settings', icon: <Globe size={15} /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
    ]
  },
];

const PAGE_TITLES = {
  dashboard: 'ERP Dashboard',
  admin_management: 'Admin Management',
  user_management: 'Global User Management',
  vendor_management: 'Vendor Management',
  vendor_verification: 'KYC & Verification',
  lead_management: 'Lead Management',
  hotel_bookings: 'Hotel Booking',
  trip_bookings: 'Trip Booking',
  vehicle_bookings: 'Vehicle Booking',
  wallet: 'Wallet & Approvals',
  payment_gateway: 'Payment Gateways',
  subscription_plans: 'Subscription Plans',
  commission: 'Commission Rules',
  reports: 'Reports & Analytics',
  global_settings: 'Global Settings',
  notifications: 'Notifications',
};

function SidebarGroup({ group, activeTab, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || group.items.some(i => i.id === activeTab));

  useEffect(() => {
    if (group.items.some(i => i.id === activeTab)) {
      setOpen(true);
    }
  }, [activeTab, group.items]);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="btn w-100 d-flex align-items-center justify-content-between px-3 py-1 border-0"
        style={{ background: 'transparent', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.35)' }}
      >
        <span>{group.label}</span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>
      {open && (
        <div className="d-flex flex-column gap-0 px-1">
          {group.items.map(item => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-1"
              style={{
                fontSize: '0.83rem',
                background: activeTab === item.id ? 'linear-gradient(90deg, #FF6333, #FF8A00)' : 'transparent',
                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.65)',
                boxShadow: activeTab === item.id ? '0 4px 12px rgba(255,99,51,0.3)' : 'none',
                fontWeight: activeTab === item.id ? 700 : 400,
              }}
            >
              <span style={{ color: activeTab === item.id ? '#fff' : '#00B8D9', flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminPortalPage({
  currentUser,
  triggerOpenLogin,
  usersList,
  vendors,
  cars,
  bikes,
  hotels,
  bookings,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onLogout
}) {
  const getInitialTab = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTab = urlParams.get('tab');
      if (queryTab && PAGE_TITLES[queryTab]) return queryTab;

      const hash = window.location.hash.replace('#', '');
      if (hash && PAGE_TITLES[hash]) return hash;

      const pathPart = window.location.pathname.replace(/^\/(superadmin|super-admin)\/?/, '');
      if (pathPart && PAGE_TITLES[pathPart]) return pathPart;
      if (pathPart === 'admins' || pathPart === 'admin-management') return 'admin_management';
      if (pathPart === 'users' || pathPart === 'user-management') return 'user_management';

      const saved = localStorage.getItem('superAdminActiveTab');
      if (saved && PAGE_TITLES[saved]) return saved;
    } catch (e) {}
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('superAdminActiveTab', tabId);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch (e) {}
  };

  useEffect(() => {
    const handlePopState = () => {
      const tab = getInitialTab();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveUsers, setLiveUsers] = useState(usersList?.length ? usersList : defaultUsers);
  const [liveBookings, setLiveBookings] = useState(bookings?.length ? bookings : defaultBookings);
  const [liveVendors, setLiveVendors] = useState(vendors?.length ? vendors : defaultVendors);
  const [aiLeads, setAiLeads] = useState(defaultAiLeads);
  const [customEnquiries, setCustomEnquiries] = useState(defaultCustomEnquiries);

  useEffect(() => {
    if (usersList?.length) {
      setLiveUsers(prev => {
        if (!prev || !prev.length) return usersList;
        const incomingUsernames = new Set(usersList.map(u => (u.username || '').toLowerCase().trim()));
        const incomingIds = new Set(usersList.map(u => String(u.id)));
        const missingFromIncoming = prev.filter(u => 
          !incomingUsernames.has((u.username || '').toLowerCase().trim()) && 
          !incomingIds.has(String(u.id))
        );
        return missingFromIncoming.length ? [...missingFromIncoming, ...usersList] : usersList;
      });
    }
  }, [usersList]);

  useEffect(() => {
    if (bookings?.length) setLiveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    if (vendors?.length) setLiveVendors(vendors);
  }, [vendors]);

  const isInitialLoadRef = React.useRef(true);

  // Fetch real leads, custom enquiries, bookings, vendors, and users in real-time
  const loadAllPortalData = async () => {
    try {
      const [leadsData, enquiriesData, bookingsData, vendorsData, freshUsers] = await Promise.all([
        api.fetchAiLeads(),
        api.fetchCustomEnquiries(),
        api.fetchBookings(),
        api.fetchVendors(),
        api.fetchUsers()
      ]);
      if (leadsData && leadsData.length) setAiLeads(leadsData);
      if (enquiriesData && enquiriesData.length) setCustomEnquiries(enquiriesData);
      if (bookingsData && bookingsData.length) {
        setLiveBookings(bookingsData);
        const rawNotifs = bookingsData.map(b => ({
          id: `b-${b.id}`,
          is_read: b.status === 'Completed' ? 1 : 0
        }));
        if (isInitialLoadRef.current) {
          registerSeenNotifications(rawNotifs);
        } else {
          handleIncomingNotifications(rawNotifs, { isInitialLoad: false });
        }
      }
      isInitialLoadRef.current = false;
      if (vendorsData && vendorsData.length) setLiveVendors(vendorsData);
      if (freshUsers && freshUsers.length) {
        setLiveUsers(prev => {
          if (!prev || !prev.length) return freshUsers;
          const freshUsernames = new Set(freshUsers.map(u => (u.username || '').toLowerCase().trim()));
          const freshIds = new Set(freshUsers.map(u => String(u.id)));
          const missing = prev.filter(u => 
            !freshUsernames.has((u.username || '').toLowerCase().trim()) && 
            !freshIds.has(String(u.id))
          );
          return missing.length ? [...missing, ...freshUsers] : freshUsers;
        });
      }
    } catch (e) {
      console.warn('Portal real-time refresh:', e);
    }
  };

  const handlePortalAddUser = async (newUser) => {
    // 1. Instant optimistic update to local state so administrator shows immediately
    const optimisticUser = {
      id: newUser.id || `u-${Date.now()}`,
      username: newUser.username,
      name: newUser.name || newUser.username,
      email: newUser.email,
      phone: newUser.phone || '',
      city: newUser.city || '',
      role: (newUser.role || 'admin').toLowerCase().trim(),
      billing_price: Number(newUser.billing_price) || 0,
      status: newUser.status || 'active',
      plain_password: newUser.password || newUser.plain_password || 'admin@2026',
      password: newUser.password || newUser.plain_password || 'admin@2026',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    // Cache locally immediately so reload also preserves it
    try {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
      const filtered = localUsers.filter(u => (u.username || '').toLowerCase() !== optimisticUser.username.toLowerCase());
      filtered.unshift(optimisticUser);
      localStorage.setItem('local_users', JSON.stringify(filtered));

      const passMap = JSON.parse(localStorage.getItem('user_passwords') || '{}');
      passMap[optimisticUser.id] = optimisticUser.plain_password;
      passMap[optimisticUser.username] = optimisticUser.plain_password;
      passMap[optimisticUser.email] = optimisticUser.plain_password;
      localStorage.setItem('user_passwords', JSON.stringify(passMap));
    } catch (e) {}

    setLiveUsers(prev => [optimisticUser, ...prev.filter(u => (u.username || '').toLowerCase() !== (newUser.username || '').toLowerCase() && (u.email || '').toLowerCase() !== (newUser.email || '').toLowerCase())]);

    try {
      let created = null;
      if (onAddUser) created = await onAddUser(newUser);
      else created = await api.registerUser(newUser);
      const userObj = created?.user || (created && created.username ? created : optimisticUser);
      setLiveUsers(prev => [userObj, ...prev.filter(u => (u.username || '').toLowerCase() !== (userObj.username || '').toLowerCase() && (u.email || '').toLowerCase() !== (userObj.email || '').toLowerCase())]);
      
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) {
        const hasUser = fresh.some(u => 
          (u.username && u.username.toLowerCase() === userObj.username?.toLowerCase()) || 
          (u.email && u.email.toLowerCase() === userObj.email?.toLowerCase()) ||
          String(u.id) === String(userObj.id)
        );
        setLiveUsers(hasUser ? fresh : [userObj, ...fresh]);
      }
    } catch (e) {
      console.warn('Add user:', e);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) {
        const hasUser = fresh.some(u => 
          (u.username && u.username.toLowerCase() === optimisticUser.username?.toLowerCase()) || 
          (u.email && u.email.toLowerCase() === optimisticUser.email?.toLowerCase()) ||
          String(u.id) === String(optimisticUser.id)
        );
        setLiveUsers(hasUser ? fresh : [optimisticUser, ...fresh]);
      }
    }
  };

  const handlePortalUpdateUser = async (user) => {
    setLiveUsers(prev => prev.map(u => String(u.id) === String(user.id) ? { ...u, ...user } : u));
    try {
      if (onUpdateUser) await onUpdateUser(user);
      else await api.updateUser(user);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) setLiveUsers(fresh);
    } catch (e) {
      console.warn('Update user:', e);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) setLiveUsers(fresh);
    }
  };

  const handlePortalDeleteUser = async (userId) => {
    setLiveUsers(prev => prev.filter(u => String(u.id) !== String(userId)));
    try {
      if (onDeleteUser) await onDeleteUser(userId);
      else await api.deleteUser(userId);
      const fresh = await api.fetchUsers();
      if (fresh) setLiveUsers(fresh);
    } catch (e) {
      console.warn('Delete user:', e);
      const fresh = await api.fetchUsers();
      if (fresh) setLiveUsers(fresh);
    }
  };

  useEffect(() => {
    loadAllPortalData();
    const interval = setInterval(loadAllPortalData, 6000); // 6s real-time periodic polling
    
    const handleNewBooking = (e) => {
      if (e.detail) {
        setLiveBookings(prev => [e.detail, ...prev.filter(b => String(b.id) !== String(e.detail.id))]);
      }
      loadAllPortalData();
    };

    const handleSync = () => {
      loadAllPortalData();
    };

    window.addEventListener('new-booking-created', handleNewBooking);
    window.addEventListener('booking-status-updated', handleSync);
    window.addEventListener('booking-updated', handleSync);
    window.addEventListener('booking-deleted', handleSync);
    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('tripgalileo-booking-sync', handleSync);
    window.addEventListener('authoritative-notification-received', handleSync);

    let bcBookings;
    let bcNotifs;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bcBookings = new BroadcastChannel('tripgalileo_bookings_sync');
        bcBookings.onmessage = handleSync;
        bcNotifs = new BroadcastChannel('tripgalileo_notifications_sync');
        bcNotifs.onmessage = handleSync;
      }
    } catch (e) {}

    return () => {
      clearInterval(interval);
      window.removeEventListener('new-booking-created', handleNewBooking);
      window.removeEventListener('booking-status-updated', handleSync);
      window.removeEventListener('booking-updated', handleSync);
      window.removeEventListener('booking-deleted', handleSync);
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('tripgalileo-booking-sync', handleSync);
      window.removeEventListener('authoritative-notification-received', handleSync);
      if (bcBookings) bcBookings.close();
      if (bcNotifs) bcNotifs.close();
    };
  }, []);

  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Helper to determine booking category accurately
  const getBookingCategory = (b) => {
    const itemId = String(b.item_id || '').toLowerCase();
    const itemName = String(b.item_name || b.name || '').toLowerCase();
    const type = String(b.type || b.item_type || '').toLowerCase();
    const pkgType = String(b.package_type || '').toLowerCase();

    // 1. Standalone Flight
    if (type === 'flight' || b.flight_id || b.flight_number || itemId.startsWith('fl-') || itemId.startsWith('flt-') || itemId.startsWith('flight-') ||
        itemName.includes('flight') || itemName.includes('air india') || itemName.includes('indigo') || itemName.includes('vistara') || itemName.includes('akasa')) {
      return { tab: 'flight_bookings', type: 'Flight Booking', color: '#6366f1' };
    }

    // Custom packages / Craft My Trip are strictly Trip Bookings
    const isMultiItemOrPackage = itemName.includes('craft my trip') || itemName.includes('custom trip') || 
                                 itemName.includes('package') || itemName.includes('tour') || 
                                 itemName.includes('experience') || itemName.includes('self drive') ||
                                 pkgType.includes('package') || pkgType.includes('self_drive');

    if (isMultiItemOrPackage) {
      return { tab: 'trip_bookings', type: 'Package / Holiday Booking', color: '#f97316' };
    }

    // 2. Standalone Hotel
    if (type === 'hotel' || b.hotel_id || b.room_id || b.room_type || itemId.startsWith('hotel-') || itemId.startsWith('htl-') || 
        (!itemId.startsWith('car-') && !itemId.startsWith('bike-') && !itemId.startsWith('veh-') && !itemId.startsWith('pkg-') && (
          itemName.includes('marriott') || itemName.includes('taj') || itemName.includes('resort') || 
          itemName.includes('hotel') || itemName.includes('stay') || itemName.includes('villa') || 
          itemName.includes('suite') || itemName.includes('palms') || itemName.includes('inn') || 
          itemName.includes('cidade') || itemName.includes('leela') || itemName.includes('alila') || 
          itemName.includes('moustache') || itemName.includes('exotica')
        ))) {
      return { tab: 'hotel_bookings', type: 'Hotel Stay Booking', color: '#0284c7' };
    }

    // 3. Standalone Vehicle
    if (['vehicle', 'car', 'bike', 'rental'].includes(type) || b.vehicle_id || b.car_id || b.bike_id || 
        itemId.startsWith('car-') || itemId.startsWith('bike-') || itemId.startsWith('veh-') || 
        itemName.includes('thar') || itemName.includes('swift') || itemName.includes('creta') || itemName.includes('scooter') || itemName.includes('activa')) {
      return { tab: 'vehicle_bookings', type: 'Vehicle Rental Booking', color: '#ea580c' };
    }

    return { tab: 'trip_bookings', type: 'Package / Holiday Booking', color: '#f97316' };
  };

  // Compute unified notifications from real data
  const bookingNotifs = (liveBookings || []).map(b => {
    const cat = getBookingCategory(b);
    const isActionable = b.status === 'Draft' || b.status === 'Pending' || b.status === 'Payment Verification Pending' || b.status === 'New' || b.status === 'CONFIRMED' || b.status === 'Confirmed';
    return {
      id: `b-${b.id}`,
      type: 'booking',
      title: `${cat.type} #${b.id}`,
      message: `${b.name || b.customer_name || 'Customer'} — ${b.item_name || 'Item'} (${b.status || 'Enquiry'} • ₹${parseFloat(b.total_paid || b.total_amount || b.amount_paid || 0).toLocaleString('en-IN')})`,
      time: b.created_at?.slice(0, 16) || 'Recent',
      color: cat.color,
      tab: cat.tab,
      isActionable
    };
  });

  const enquiryNotifs = (customEnquiries || []).map(e => ({
    id: `e-${e.enquiry_id || e.id}`,
    type: 'enquiry',
    title: `Custom Trip Enquiry #${e.enquiry_id || e.id}`,
    message: `${e.customer_name || 'Customer'} inquired for ${e.destinations || 'Goa Custom Trip'} (${e.travel_dates || 'Flexible Dates'})`,
    time: e.created_at?.slice(0, 16) || 'Recent',
    color: '#8b5cf6',
    tab: 'trip_bookings',
    isActionable: e.status === 'New Enquiry' || !e.status || e.status === 'Pending'
  }));

  const leadNotifs = (aiLeads || []).map(l => ({
    id: `l-${l.id}`,
    type: 'lead',
    title: `Sophia AI Lead: ${l.name}`,
    message: `Customer ${l.name} (${l.phone || 'No phone'}) chatted with Sophia AI`,
    time: l.created_at?.slice(0, 16) || 'Recent',
    color: '#059669',
    tab: 'lead_management',
    isActionable: true
  }));

  const kycNotifs = (liveVendors || []).filter(v => !v.verified).map(v => ({
    id: `v-${v.id}`,
    type: 'kyc',
    title: 'Vendor KYC Pending',
    message: `${v.name || v.username} (${v.vendor_type || 'Vendor'}) is awaiting KYC verification`,
    time: 'Action Required',
    color: '#ca8a04',
    tab: 'vendor_verification',
    isActionable: true
  }));

  const [clearedNotifIds, setClearedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cleared_notifs') || '[]');
    } catch (e) {
      return [];
    }
  });

  // Combine and sort by date descending
  const notificationsList = [...kycNotifs, ...bookingNotifs, ...enquiryNotifs, ...leadNotifs].sort((a, b) => {
    if (a.time === 'Action Required') return -1;
    if (b.time === 'Action Required') return 1;
    return (b.time || '').localeCompare(a.time || '');
  });

  const activeNotifications = notificationsList.filter(n => !clearedNotifIds.includes(n.id));
  const unreadCount = activeNotifications.filter(n => n.isActionable && !readNotifIds.includes(n.id)).length;

  const handleMarkAllRead = (e) => {
    if (e) e.stopPropagation();
    const allIds = activeNotifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('read_notifs', JSON.stringify(allIds));
    } catch (err) {}
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    const allIds = [...clearedNotifIds, ...notificationsList.map(n => n.id)];
    setClearedNotifIds(allIds);
    try {
      localStorage.setItem('cleared_notifs', JSON.stringify(allIds));
    } catch (err) {}
  };

  const handleDismissNotification = (e, id) => {
    e.stopPropagation();
    const updated = [...clearedNotifIds, id];
    setClearedNotifIds(updated);
    try {
      localStorage.setItem('cleared_notifs', JSON.stringify(updated));
    } catch (err) {}
  };

  const handleNotificationClick = (n) => {
    if (!readNotifIds.includes(n.id)) {
      const updated = [...readNotifIds, n.id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('read_notifs', JSON.stringify(updated));
      } catch (err) {}
    }
    handleTabChange(n.tab);
    setShowNotificationDropdown(false);
  };

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0D1B2E 0%, #1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px', background: 'rgba(255,99,51,0.15)', border: '2px solid rgba(255,99,51,0.3)' }}>
            <Shield size={42} style={{ color: '#FF6333' }} />
          </div>
          <h3 className="fw-bold text-white mb-2">Master Console Access</h3>
          <p className="mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>This area requires Superadmin credentials</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }} onClick={triggerOpenLogin}>
            Sign In to Master Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex w-100" style={{ height: '100vh', background: '#0f1923', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        className="d-flex flex-column flex-shrink-0"
        style={{
          width: sidebarOpen ? '260px' : '0px',
          minWidth: sidebarOpen ? '260px' : '0px',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#0D1B2E',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Brand */}
        <div className="px-4 py-3 d-flex align-items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Compass size={24} style={{ color: '#FF6333' }} />
          <div>
            <div className="fw-extrabold text-white" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>TRIPGALILEO</div>
            <div className="fw-bold text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '2px', color: '#FF6333' }}>Superadmin ERP</div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-grow-1 py-2">
          {SIDEBAR_GROUPS.map((group, idx) => (
            <SidebarGroup key={group.label} group={group} activeTab={activeTab} onSelect={handleTabChange} defaultOpen={idx < 2} />
          ))}
        </div>

        {/* Logout */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onLogout} className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333', fontSize: '0.85rem', fontWeight: 600 }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header className="d-flex align-items-center justify-content-between px-4 flex-shrink-0" style={{ height: '56px', backgroundColor: '#0D1B2E', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-sm p-1 border-0 text-white-50" style={{ background: 'transparent' }} aria-label="Toggle sidebar">
              <Menu size={20} />
            </button>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{PAGE_TITLES[activeTab] || 'Dashboard'}</div>
              <div className="text-white-50" style={{ fontSize: '0.68rem' }}>TripGalileo Master Control Panel</div>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill d-none d-sm-flex" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.7rem', fontWeight: 700 }}>
              <span className="rounded-circle" style={{ width: '6px', height: '6px', background: '#00e676', display: 'inline-block' }}></span>
              System Online
            </span>

            {/* Notification Bell with Badge */}
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
                <Bell size={18} style={{ color: unreadCount > 0 ? '#FF6333' : 'rgba(255,255,255,0.7)' }} />
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-dark"
                    style={{ fontSize: '0.6rem', padding: '0.25em 0.45em' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
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
                    width: '380px',
                    maxWidth: '94vw',
                    background: '#10243A',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    zIndex: 1060,
                    overflow: 'hidden'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center justify-content-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0D1B2E' }}>
                    {/* Left: Title + Badge */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <Bell size={15} className="text-warning flex-shrink-0" />
                      <span className="fw-bold text-white small text-nowrap">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="badge bg-danger rounded-pill text-nowrap" style={{ fontSize: '0.62rem', padding: '0.25em 0.5em', fontWeight: 700 }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    {/* Right: Sound Control + Actions */}
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <NotificationSoundToggle variant="dark" />
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm p-0 text-white-50 border-0 text-nowrap"
                          style={{ fontSize: '0.70rem', textDecoration: 'underline' }}
                          onClick={handleMarkAllRead}
                        >
                          Mark read
                        </button>
                      )}
                      {activeNotifications.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm px-2 py-0.5 text-danger border border-danger border-opacity-40 rounded text-nowrap fw-semibold"
                          style={{ fontSize: '0.68rem', background: 'rgba(220,38,38,0.1)' }}
                          onClick={handleClearAll}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {activeNotifications.length === 0 ? (
                      <div className="p-4 text-center text-white-50 small">
                        No active notifications
                      </div>
                    ) : (
                      activeNotifications.slice(0, 7).map((n) => {
                        const isUnread = !readNotifIds.includes(n.id) && n.isActionable;
                        return (
                          <div
                            key={n.id}
                            className="px-3 py-2.5 border-bottom border-secondary border-opacity-10 cursor-pointer d-flex align-items-start justify-content-between gap-2"
                            style={{ background: isUnread ? 'rgba(255,99,51,0.08)' : 'transparent', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'rgba(255,99,51,0.08)' : 'transparent'}
                            onClick={() => handleNotificationClick(n)}
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
                              onClick={(e) => handleDismissNotification(e, n.id)}
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
                        handleTabChange('notifications');
                        setShowNotificationDropdown(false);
                      }}
                    >
                      View All Notifications ({activeNotifications.length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

              {/* Profile Menu */}
              {(() => {
                const displayName = currentUser?.username || currentUser?.name || currentUser?.email || 'Superadmin';
                const initial = (displayName[0] || 'S').toUpperCase();
                return (
                  <div className="position-relative">
                    <button
                      className="btn p-0 rounded-circle d-flex align-items-center justify-content-center"
                      style={{ width: '36px', height: '36px', border: '2px solid #FF6333', background: 'linear-gradient(135deg,#FFC107,#FF8A00)' }}
                      onClick={() => {
                        setShowProfileDropdown(!showProfileDropdown);
                        setShowNotificationDropdown(false);
                      }}
                      aria-label="Profile menu"
                    >
                      <span className="fw-bold text-dark" style={{ fontSize: '14px' }}>{initial}</span>
                    </button>
                    {showProfileDropdown && (
                      <div className="position-absolute shadow-lg" style={{ right: 0, top: '48px', minWidth: '200px', background: '#10243A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1050 }} onClick={e => e.stopPropagation()}>
                        <div className="text-center px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-2" style={{ width: '44px', height: '44px', fontSize: '18px', background: 'linear-gradient(135deg,#FFC107,#FF8A00)', color: '#000' }}>
                            {initial}
                          </div>
                          <div className="fw-bold text-white" style={{ fontSize: '14px' }}>{displayName}</div>
                          <span className="badge mt-1" style={{ background: 'rgba(255,99,51,0.15)', color: '#FF6333', fontSize: '0.6rem' }}>SUPERADMIN</span>
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
        <div className="flex-grow-1 overflow-auto" style={{ background: '#f0f2f5' }}>
          <SuperAdminDashboard
            activeTab={activeTab}
            onNavigate={handleTabChange}
            usersList={Array.isArray(liveUsers) ? liveUsers : []}
            vendors={Array.isArray(liveVendors) ? liveVendors : []}
            cars={cars || []}
            bikes={bikes || []}
            hotels={hotels || []}
            bookings={Array.isArray(liveBookings) ? liveBookings : []}
            aiLeads={Array.isArray(aiLeads) ? aiLeads : []}
            customEnquiries={Array.isArray(customEnquiries) ? customEnquiries : []}
            onRefreshLeads={loadAllPortalData}
            onAddUser={handlePortalAddUser}
            onUpdateUser={handlePortalUpdateUser}
            onDeleteUser={handlePortalDeleteUser}
          />
        </div>
      </div>
    </div>
  );
}
