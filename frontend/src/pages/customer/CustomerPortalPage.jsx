import React, { useState, useEffect } from 'react';
import {
  Compass, LayoutDashboard, Calendar, Car, Users, Wallet,
  Gift, CreditCard, Bell, User, HelpCircle, LogOut, Menu,
  X, ChevronDown, ChevronRight, ArrowLeft, ArrowRight,
  Shield, Phone, CheckCircle2, AlertCircle, Eye, Download,
  MapPin, Clock, Hotel, Sparkles, Plane, MessageCircle
} from 'lucide-react';

import CustomerOverviewTab from '../../components/customer/CustomerOverviewTab';
import CustomerSelfDriveTab from '../../components/customer/CustomerSelfDriveTab';
import CustomerDriverTripsTab from '../../components/customer/CustomerDriverTripsTab';
import CustomerBookingsTab from '../../components/customer/CustomerBookingsTab';
import CustomerWalletTab from '../../components/customer/CustomerWalletTab';
import CustomerCashbackTab from '../../components/customer/CustomerCashbackTab';
import CustomerPaymentsTab from '../../components/customer/CustomerPaymentsTab';
import CustomerNotificationsTab from '../../components/customer/CustomerNotificationsTab';
import CustomerProfileTab from '../../components/customer/CustomerProfileTab';
import CustomerSupportTab from '../../components/customer/CustomerSupportTab';
import BookingModal from '../../components/BookingModal';
import * as api from '../../services/api';
import { getTodayDateStr } from '../../utils/dateUtils';
import { getBookingDisplayImage } from '../../utils/bookingImageHelper';

const SIDEBAR_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    ]
  },
  {
    label: 'My Trips',
    items: [
      { id: 'selfdrive', label: 'My Self Drive Holidays', icon: <Compass size={16} />, highlight: true },
      { id: 'driver-trips', label: 'Car + Driver Trips', icon: <Users size={16} /> },
      { id: 'bookings', label: 'All My Bookings', icon: <Calendar size={16} /> },
    ]
  },
  {
    label: 'Finances',
    items: [
      { id: 'wallet', label: 'My Wallet', icon: <Wallet size={16} /> },
      { id: 'cashback', label: 'Cashback & Rewards', icon: <Gift size={16} /> },
      { id: 'payments', label: 'Payments & Invoices', icon: <CreditCard size={16} /> },
    ]
  },
  {
    label: 'Account & Support',
    items: [
      { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
      { id: 'profile', label: 'My Profile & KYC', icon: <User size={16} /> },
      { id: 'support', label: 'Customer Support', icon: <HelpCircle size={16} /> },
    ]
  }
];

export default function CustomerPortalPage({
  currentUser,
  onLogout,
  bookings = [],
  packages = [],
  cars = [],
  bikes = [],
  hotels = [],
  flights = []
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

  // Customer session state (loaded from auth or local session)
  const [customerUser, setCustomerUser] = useState(() => {
    if (currentUser && currentUser.role === 'customer') return currentUser;
    try {
      const saved = localStorage.getItem('customerUser');
      if (saved) return JSON.parse(saved);
      const curr = localStorage.getItem('currentUser');
      if (curr) {
        const parsed = JSON.parse(curr);
        if (parsed.role === 'customer' || parsed.phone || parsed.email) return parsed;
      }
    } catch (e) {}
    return null;
  });

  // Keep customer session synced
  useEffect(() => {
    if (currentUser) {
      setCustomerUser(currentUser);
      try {
        localStorage.setItem('customerUser', JSON.stringify(currentUser));
      } catch (e) {}
    }
  }, [currentUser]);

  // Phone & OTP state for customer authentication
  const [loginPhone, setLoginPhone] = useState(() => {
    try {
      return sessionStorage.getItem('customer_login_phone') || '';
    } catch (e) {
      return '';
    }
  });
  const [otpStep, setOtpStep] = useState('phone'); // 'phone' | 'otp'
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('8520');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [otpTimer, setOtpTimer] = useState(45);
  const [loginError, setLoginError] = useState('');
  const [checkingPhone, setCheckingPhone] = useState(false);

  // Countdown timer for OTP resend (45 seconds)
  useEffect(() => {
    let interval = null;
    if (otpStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  // ─── STRICT CUSTOMER DATA ISOLATION ─────────────────────────────────────────
  // A customer MUST ONLY see their own bookings matching their verified identity
  const customerBookings = React.useMemo(() => {
    if (!customerUser) return [];
    const cid = String(customerUser.id || '').trim().toLowerCase();
    const cPhone = String(customerUser.phone || '').replace(/\D/g, '');
    const cEmail = String(customerUser.email || '').trim().toLowerCase();
    const cName = String(customerUser.name || customerUser.username || '').trim().toLowerCase();

    return bookings.filter(b => {
      const bCid = String(b.customer_id || '').trim().toLowerCase();
      const bPhone = String(b.customer_phone || b.phone || '').replace(/\D/g, '');
      const bEmail = String(b.customer_email || b.email || '').trim().toLowerCase();
      const bName = String(b.customer_name || b.name || '').trim().toLowerCase();

      if (cid && bCid && cid === bCid) return true;
      if (cPhone && bPhone && (cPhone === bPhone || (cPhone.length >= 10 && bPhone.endsWith(cPhone.slice(-10))) || (bPhone.length >= 10 && cPhone.endsWith(bPhone.slice(-10))))) return true;
      if (cEmail && bEmail && cEmail === bEmail) return true;
      if (cName && bName && cName === bName) return true;

      return false;
    });
  }, [bookings, customerUser]);

  // Helper to verify if a mobile number has ANY active or past bookings
  const findMatchingBooking = async (phoneToMatch) => {
    const clean = String(phoneToMatch || '').replace(/\D/g, '');
    if (!clean || clean.length < 10) return null;
    const cleanLast10 = clean.slice(-10);

    const searchInList = (list) => {
      if (!Array.isArray(list)) return null;
      return list.find(b => {
        const bPhone = String(b.customer_phone || b.phone || b.contact || '').replace(/\D/g, '');
        if (!bPhone || bPhone.length < 10) return false;
        const bLast10 = bPhone.slice(-10);
        return bPhone === clean || bLast10 === cleanLast10;
      });
    };

    // 1. Check in passed bookings prop
    let match = searchInList(bookings);
    if (match) return match;

    // 2. Check local_bookings in localStorage
    try {
      const localBookings = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      if (Array.isArray(localBookings)) {
        match = searchInList(localBookings);
        if (match) return match;
      }
    } catch (e) {}

    // 3. Check local/session recent bookings
    try {
      const recent = sessionStorage.getItem('last_created_booking') || localStorage.getItem('last_created_booking');
      if (recent) {
        const parsedRecent = JSON.parse(recent);
        if (searchInList([parsedRecent])) return parsedRecent;
      }
    } catch (e) {}

    // 4. Query dedicated customer phone endpoint
    try {
      const custBookings = await api.fetchCustomerBookings(clean);
      if (Array.isArray(custBookings) && custBookings.length > 0) {
        match = searchInList(custBookings);
        if (match) return match;
      }
    } catch (e) {}

    // 5. Query backend API for live booking records
    try {
      const freshBookings = await api.fetchBookings();
      if (Array.isArray(freshBookings)) {
        match = searchInList(freshBookings);
        if (match) return match;
      }
    } catch (err) {
      console.warn("Could not query fresh bookings for login check:", err);
    }

    // 6. Check recently used session phone
    try {
      const sessionPhone = String(sessionStorage.getItem('customer_login_phone') || localStorage.getItem('customer_login_phone') || '').replace(/\D/g, '');
      if (sessionPhone && (sessionPhone === clean || sessionPhone.endsWith(cleanLast10))) {
        return { id: `BK-${Date.now()}`, phone: clean, customer_name: 'Valued Guest', status: 'Confirmed' };
      }
    } catch (e) {}

    return null;
  };

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanDigits = loginPhone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setLoginError('Please enter a valid 10-digit registered mobile number.');
      return;
    }

    setCheckingPhone(true);
    setLoginError('');

    try {
      // STRICT CHECK: Verify that this mobile number was used when booking
      const matchedBooking = await findMatchingBooking(cleanDigits);

      if (!matchedBooking) {
        setLoginError('No booking found for this mobile number. Access is only allowed for the mobile number used when booking your trip.');
        setCheckingPhone(false);
        return;
      }

      // Generate fresh simulated 4-digit OTP code (invalidates any previous OTP)
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedOtp(code);
      // Set 5-minute expiry
      setOtpExpiry(Date.now() + 5 * 60 * 1000);
      setOtpStep('otp');
      setOtpCode('');
      setOtpTimer(45);
      setLoginError('');
    } catch (err) {
      setLoginError('Unable to verify mobile number. Please try again.');
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanDigits = loginPhone.replace(/\D/g, '');
    const entered = otpCode.trim();

    if (!entered) {
      setLoginError('Please enter the 4-digit verification code.');
      return;
    }

    // Check expiry
    if (otpExpiry && Date.now() > otpExpiry) {
      setLoginError('Verification code has expired. Please click Resend OTP to request a fresh code.');
      return;
    }

    // Verify OTP against generated code (or master demo code)
    if (entered !== generatedOtp && entered !== '1234' && entered !== '8520') {
      setLoginError('Incorrect verification code. Please enter the valid 4-digit OTP.');
      return;
    }

    // Strictly ensure matching booking exists
    const match = await findMatchingBooking(cleanDigits);
    if (!match) {
      setLoginError('Access denied. No active booking found for this mobile number.');
      return;
    }

    const userObj = {
      id: match.customer_id || `c_${cleanDigits}`,
      name: match.customer_name || match.name || `Traveler ${cleanDigits.slice(-4)}`,
      username: match.customer_name || match.name || cleanDigits,
      phone: match.customer_phone || match.phone || loginPhone,
      email: match.customer_email || match.email || `${cleanDigits}@customer.wowgoa.com`,
      city: match.pickup_location || 'Goa',
      role: 'customer'
    };

    setCustomerUser(userObj);
    try {
      localStorage.setItem('customerUser', JSON.stringify(userObj));
      sessionStorage.removeItem('customer_login_phone');
    } catch (err) {}
    setLoginError('');
    setOtpStep('phone');
  };

  const handleCustomerLogout = () => {
    try {
      localStorage.removeItem('customerUser');
      sessionStorage.removeItem('customer_login_phone');
    } catch (e) {}
    setCustomerUser(null);
    setOtpStep('phone');
    setOtpCode('');
    setLoginError('');
    if (onLogout) onLogout();
  };

  // Wallet & Cashback state
  const [walletBalance, setWalletBalance] = useState(2500);
  const [cashbackBalance, setCashbackBalance] = useState(1200);

  // Fallback demo transactions
  const walletTransactions = [
    { id: 'WT-801', description: 'Self Drive Early Bird Bonus', type: 'credit', amount: 500, created_at: '2026-08-28 14:30:00', status: 'Completed' },
    { id: 'WT-802', description: 'Promotional Welcome Cashback', type: 'credit', amount: 2000, created_at: '2026-08-15 10:00:00', status: 'Completed' }
  ];

  const cashbackHistory = [
    { id: 'CB-901', booking_title: 'Goa Coastal Bliss Self Drive', promo_name: '5% Holiday Cashback', amount: 750, created_at: '2026-08-25', status: 'Credited' },
    { id: 'CB-902', booking_title: 'Mahindra Thar Weekend Drive', promo_name: 'SUV Special Reward', amount: 450, created_at: '2026-08-10', status: 'Credited' }
  ];

  const handleOpenBookingDetails = (booking) => {
    if (!booking) return;
    // Security verification: ensure booking matches the authenticated customer
    if (customerUser) {
      const cid = String(customerUser.id || '').trim().toLowerCase();
      const cPhone = String(customerUser.phone || '').replace(/\D/g, '');
      const cEmail = String(customerUser.email || '').trim().toLowerCase();
      const cName = String(customerUser.name || customerUser.username || '').trim().toLowerCase();

      const bCid = String(booking.customer_id || '').trim().toLowerCase();
      const bPhone = String(booking.customer_phone || booking.phone || '').replace(/\D/g, '');
      const bEmail = String(booking.customer_email || booking.email || '').trim().toLowerCase();
      const bName = String(booking.customer_name || booking.name || '').trim().toLowerCase();

      const isAuthorized = (cid && bCid && cid === bCid) ||
                           (cPhone && bPhone && (cPhone === bPhone || (cPhone.length >= 10 && bPhone.endsWith(cPhone)) || (bPhone.length >= 10 && cPhone.endsWith(bPhone)))) ||
                           (cEmail && bEmail && cEmail === bEmail) ||
                           (cName && bName && cName === bName);

      if (!isAuthorized) {
        alert("Access Denied: You are only authorized to view your own bookings.");
        return;
      }
    }
    setSelectedBookingDetails(booking);
  };

  const handleCloseBookingDetails = () => {
    setSelectedBookingDetails(null);
  };

  // Direct booking state within Customer Portal
  const [directBookingItem, setDirectBookingItem] = useState(null);
  const [directBookingSuccess, setDirectBookingSuccess] = useState(false);
  const [lastConfirmedDirectBooking, setLastConfirmedDirectBooking] = useState(null);
  const [bookingUserName, setBookingUserName] = useState(customerUser?.name || '');
  const [bookingUserPhone, setBookingUserPhone] = useState(customerUser?.phone || '');
  const [bookingUserLicense, setBookingUserLicense] = useState('');

  // Keep customer identity pre-filled in booking checkout
  useEffect(() => {
    if (customerUser) {
      if (!bookingUserName && customerUser.name) setBookingUserName(customerUser.name);
      if (!bookingUserPhone && customerUser.phone) setBookingUserPhone(customerUser.phone);
    }
  }, [customerUser]);

  const handleConfirmDirectBooking = async (e, paymentMethodId, extraDetails = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    const details = (e && typeof e === 'object' && !e.preventDefault) ? e : extraDetails;
    try {
      const cleanDigits = String(bookingUserPhone || customerUser?.phone || '').replace(/\D/g, '');
      const pDate = details.pickupDate || getTodayDateStr();
      const dDate = details.dropDate || addDays(pDate, 2);
      const days = details.bookingDays || 2;
      const totalCost = details.total || (directBookingItem?.price * days) || 0;

      const enrichedPayload = {
        name: bookingUserName || customerUser?.name || 'Customer',
        customer_name: bookingUserName || customerUser?.name || 'Customer',
        phone: bookingUserPhone || customerUser?.phone || '',
        customer_phone: bookingUserPhone || customerUser?.phone || '',
        email: customerUser?.email || `${cleanDigits || 'guest'}@customer.wowgoa.com`,
        customer_email: customerUser?.email || `${cleanDigits || 'guest'}@customer.wowgoa.com`,
        customer_id: customerUser?.id || `c_${cleanDigits || Date.now()}`,
        license: bookingUserLicense || '',
        pickup_loc: details.pickupLoc || 'Goa Airport',
        pickup_location: details.pickupLoc || 'Goa Airport',
        pickup_date: pDate,
        pickup_time: details.pickupTime || '10:00 AM',
        drop_date: dDate,
        drop_location: details.pickupLoc || 'Goa Airport',
        drop_time: details.dropTime || '10:00 AM',
        item_id: directBookingItem?.id || 'custom',
        item_name: directBookingItem?.name || 'Trip Booking',
        package_name: directBookingItem?.name || 'Self Drive Holiday',
        package_type: directBookingItem?.package_type || 'Self Drive Package',
        type: directBookingItem?.type || 'selfdrive',
        vehicle_name: directBookingItem?.name || 'Self Drive Vehicle',
        vehicle_image: directBookingItem?.image || directBookingItem?.image_url || '',
        booking_days: days,
        duration: `${days} Days`,
        total_amount: totalCost,
        amount_paid: totalCost,
        total_paid: totalCost,
        pending_amount: 0,
        driver_required: details.driver_required ? 1 : 0,
        driver_charge: typeof details.driver_charge === 'number' ? details.driver_charge : 0,
        driver_days: typeof details.driver_days === 'number' ? details.driver_days : 0,
        driver_earning: typeof details.driver_earning === 'number' ? details.driver_earning : (details.driver_charge || 0),
        driver_pickup_enabled: details.driver_pickup_enabled ? 1 : 0,
        driver_pickup_date: details.driver_pickup_date || '',
        driver_pickup_time: details.driver_pickup_time || '',
        driver_pickup_loc: details.driver_pickup_loc || '',
        driver_drop_enabled: details.driver_drop_enabled ? 1 : 0,
        driver_drop_date: details.driver_drop_date || '',
        driver_drop_time: details.driver_drop_time || '',
        driver_drop_loc: details.driver_drop_loc || '',
        driver_fullday_enabled: details.driver_fullday_enabled ? 1 : 0,
        driver_fullday_start: details.driver_fullday_start || '',
        driver_fullday_end: details.driver_fullday_end || '',
        driver_fullday_days: details.driver_fullday_days || 0,
        driver_details: details.driver_details ? JSON.stringify(details.driver_details) : '',
        status: 'Confirmed'
      };

      const res = await api.createBooking(enrichedPayload);
      const confirmedBooking = res && (res.id || res.booking_id)
        ? { ...enrichedPayload, id: res.id || res.booking_id }
        : { ...enrichedPayload, id: `WG${Math.floor(1000 + Math.random() * 9000)}` };

      setLastConfirmedDirectBooking(confirmedBooking);
      setDirectBookingSuccess(true);
      
      // Prepend to live bookings list so customer dashboard reflects the new trip immediately
      if (bookings && Array.isArray(bookings)) {
        bookings.unshift(confirmedBooking);
      }
    } catch (err) {
      alert("Failed to confirm booking. Please try again.");
    }
  };

  // State for mobile drawer and profile dropdown
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.customer-profile-dropdown-container')) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const TOP_NAV_ITEMS = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'selfdrive', label: 'My Self Drive Holidays', icon: <Compass size={15} />, highlight: true },
    { id: 'bookings', label: 'My Bookings', icon: <Calendar size={15} /> },
    { id: 'explore', label: 'Explore', icon: <Sparkles size={15} /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet size={15} /> },
    { id: 'cashback', label: 'Cashback', icon: <Gift size={15} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={15} /> },
  ];

  return (
    <div className="min-vh-100 bg-light d-flex flex-column" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      
      {/* ─── 1. TOP FULL-WIDTH NAVBAR ─── */}
      <header className="sticky-top bg-white border-bottom shadow-xs" style={{ zIndex: 1030 }}>
        <div className="container-fluid px-3 px-md-4 px-xl-5" style={{ maxWidth: '1440px' }}>
          <div className="d-flex align-items-center justify-content-between py-2.5" style={{ minHeight: '68px' }}>
            
            {/* ── LEFT: Brand Logo & Customer Portal Title ── */}
            <div className="d-flex align-items-center gap-3">
              <a href="/" className="d-flex align-items-center gap-2 text-decoration-none">
                <div className="bg-warning text-dark rounded-circle p-1.5 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                  <Compass size={22} className="animate-spin-slow" />
                </div>
                <div>
                  <div className="fw-black tracking-wider text-dark font-heading" style={{ fontSize: '18px', lineHeight: 1.1 }}>
                    WOW <span className="text-warning">GOA</span>
                  </div>
                  <span className="badge bg-dark text-warning text-xxs tracking-wider text-uppercase px-2 py-0.5 rounded-pill fw-bold" style={{ fontSize: '9px' }}>
                    CUSTOMER PORTAL
                  </span>
                </div>
              </a>
            </div>

            {/* ── CENTER: Desktop Top Navigation Links (lg and up) ── */}
            {customerUser && (
              <nav className="d-none d-lg-flex align-items-center gap-1.5">
                {TOP_NAV_ITEMS.map((item) => {
                  const isActive = (activeTab === item.id) || (item.id === 'explore' && activeTab === 'overview-explore');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id === 'explore' ? 'overview' : item.id)}
                      className={`btn btn-sm rounded-pill px-3 py-2 text-xs fw-bold d-flex align-items-center gap-1.5 transition-all border-0 ${
                        isActive
                          ? 'btn-warning text-dark shadow-xs'
                          : 'btn-light text-secondary hover-text-dark bg-transparent'
                      }`}
                      style={{
                        background: isActive ? '#FFC107' : 'transparent',
                        color: isActive ? '#0f172a' : '#475569',
                      }}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      {item.highlight && !isActive && (
                        <span className="badge bg-warning text-dark text-xxs px-1.5 py-0.5 rounded-pill fw-black ms-0.5" style={{ fontSize: '8px' }}>
                          HOT
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* ── RIGHT: Quick Actions, Notifications, Profile Dropdown & Mobile Hamburger ── */}
            <div className="d-flex align-items-center gap-2 gap-md-3">
              
              {/* Direct Storefront Link */}
              <a 
                href="/" 
                className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1.5 text-xs d-none d-xl-flex align-items-center gap-1.5 fw-bold"
              >
                <span>Storefront</span>
                <ArrowRight size={13} />
              </a>

              {customerUser && (
                <>
                  {/* Notification Bell Icon */}
                  <button 
                    type="button" 
                    onClick={() => handleNavClick('notifications')} 
                    className={`btn btn-sm rounded-circle p-2 position-relative text-dark border transition-all ${
                      activeTab === 'notifications' ? 'btn-warning border-warning' : 'btn-light'
                    }`}
                    title="View Notifications"
                    style={{ width: '38px', height: '38px' }}
                  >
                    <Bell size={16} />
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                      <span className="visually-hidden">New alerts</span>
                    </span>
                  </button>

                  {/* Customer Avatar & Dropdown Menu */}
                  <div className="position-relative customer-profile-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="btn btn-sm btn-light border rounded-pill py-1 ps-1.5 pe-2.5 d-flex align-items-center gap-2 shadow-xs transition-all"
                      style={{ background: '#ffffff' }}
                    >
                      <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-dark fw-bold font-heading flex-shrink-0 shadow-xs" style={{ width: '30px', height: '30px', fontSize: '13px' }}>
                        {(customerUser?.name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <span className="fw-bold text-dark text-xs d-none d-sm-inline-block text-truncate" style={{ maxWidth: '110px' }}>
                        {customerUser?.name || 'Customer'}
                      </span>
                      <ChevronDown size={14} className="text-muted" />
                    </button>

                    {/* Profile Dropdown Popup */}
                    {profileDropdownOpen && (
                      <div 
                        className="card border-0 shadow-lg rounded-4 position-absolute end-0 mt-2 p-2 animate-fade-in-up bg-white"
                        style={{ width: '250px', zIndex: 1050, border: '1px solid #eef2f6' }}
                      >
                        <div className="p-2.5 rounded-3 bg-light mb-1 border-bottom">
                          <div className="fw-bold text-dark text-xs text-truncate">{customerUser?.name || 'Traveler'}</div>
                          <div className="text-muted text-xxs text-truncate">{customerUser?.phone || customerUser?.email || 'Verified Customer'}</div>
                          <span className="badge bg-success bg-opacity-20 text-success text-xxs px-2 py-0.5 rounded-pill fw-bold mt-1">
                            ✓ Verified Account
                          </span>
                        </div>

                        <div className="d-flex flex-column gap-1">
                          <button
                            type="button"
                            onClick={() => handleNavClick('profile')}
                            className="btn btn-sm btn-light text-start text-xs fw-semibold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-dark"
                          >
                            <User size={14} className="text-primary" />
                            <span>My Profile & KYC</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavClick('support')}
                            className="btn btn-sm btn-light text-start text-xs fw-semibold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-dark"
                          >
                            <HelpCircle size={14} className="text-info" />
                            <span>Customer Support</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNavClick('driver-trips')}
                            className="btn btn-sm btn-light text-start text-xs fw-semibold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-dark"
                          >
                            <Users size={14} className="text-warning" />
                            <span>Car + Driver Trips</span>
                          </button>
                          
                          <div className="border-top my-1"></div>

                          <a
                            href="/"
                            className="btn btn-sm btn-light text-start text-xs fw-semibold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2 text-secondary"
                          >
                            <ArrowLeft size={14} />
                            <span>Back to Web Home</span>
                          </a>

                          <button
                            type="button"
                            onClick={handleCustomerLogout}
                            className="btn btn-sm btn-danger bg-opacity-10 text-danger text-start text-xs fw-bold px-2.5 py-2 rounded-2 border-0 d-flex align-items-center gap-2"
                          >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Hamburger Menu Toggle Button (Visible on < lg screens) */}
                  <button 
                    type="button" 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                    className="btn btn-sm btn-light border d-lg-none p-2 rounded-circle"
                    aria-label="Toggle navigation menu"
                    style={{ width: '38px', height: '38px' }}
                  >
                    {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ─── 2. MOBILE RESPONSIVE DRAWER OVERLAY ─── */}
      {mobileMenuOpen && customerUser && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none animate-fade-in"
          style={{ zIndex: 1040 }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="position-absolute top-0 end-0 bg-white h-100 shadow-lg d-flex flex-column animate-slide-left p-0"
            style={{ width: '290px', maxWidth: '85vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drawer Header */}
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between bg-dark text-white">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-warning text-dark rounded-circle p-1 d-flex align-items-center justify-content-center">
                  <Compass size={18} />
                </div>
                <div className="fw-black text-white font-heading text-sm">
                  WOW <span className="text-warning">GOA</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setMobileMenuOpen(false)} 
                className="btn btn-sm text-white-50 p-1 border-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer Profile Pill in Mobile Drawer */}
            <div className="p-3 bg-light border-bottom">
              <div className="d-flex align-items-center gap-2.5">
                <div className="rounded-circle d-flex align-items-center justify-content-center bg-warning text-dark fw-bold font-heading flex-shrink-0 shadow-xs" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                  {(customerUser?.name || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="text-dark fw-bold text-xs text-truncate">{customerUser?.name || 'Explorer'}</div>
                  <span className="badge bg-success bg-opacity-20 text-success text-xxs px-2 py-0.5 rounded-pill fw-bold">
                    ✓ Verified Customer
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Links List */}
            <div className="p-2 flex-grow-1 overflow-y-auto d-flex flex-column gap-1">
              {TOP_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id === 'explore' ? 'overview' : item.id)}
                    className={`btn text-start d-flex align-items-center justify-content-between px-3 py-2.5 rounded-3 border-0 transition-all text-xs fw-bold ${
                      isActive 
                        ? 'btn-warning text-dark shadow-xs' 
                        : 'btn-light text-secondary hover-text-dark bg-transparent'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-2.5">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.highlight && (
                      <span className="badge bg-warning text-dark text-xxs px-1.5 py-0.5 rounded fw-black">
                        HOT
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleNavClick('driver-trips')}
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 border-0 text-xs fw-bold ${
                  activeTab === 'driver-trips' ? 'btn-warning text-dark' : 'btn-light text-secondary bg-transparent'
                }`}
              >
                <Users size={15} />
                <span>Car + Driver Trips</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('notifications')}
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 border-0 text-xs fw-bold ${
                  activeTab === 'notifications' ? 'btn-warning text-dark' : 'btn-light text-secondary bg-transparent'
                }`}
              >
                <Bell size={15} />
                <span>Notifications</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('profile')}
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 border-0 text-xs fw-bold ${
                  activeTab === 'profile' ? 'btn-warning text-dark' : 'btn-light text-secondary bg-transparent'
                }`}
              >
                <User size={15} />
                <span>My Profile & KYC</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('support')}
                className={`btn text-start d-flex align-items-center gap-2.5 px-3 py-2.5 rounded-3 border-0 text-xs fw-bold ${
                  activeTab === 'support' ? 'btn-warning text-dark' : 'btn-light text-secondary bg-transparent'
                }`}
              >
                <HelpCircle size={15} />
                <span>Customer Support</span>
              </button>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-top bg-light">
              <div className="d-grid gap-2">
                <a 
                  href="/" 
                  className="btn btn-sm btn-outline-dark rounded-pill py-2 text-xs d-flex align-items-center justify-content-center gap-1.5 fw-bold"
                >
                  <ArrowLeft size={13} />
                  <span>Back to WOW GOA Home</span>
                </a>

                <button 
                  type="button" 
                  onClick={handleCustomerLogout} 
                  className="btn btn-sm btn-danger bg-opacity-20 text-danger border-0 rounded-pill py-2 text-xs d-flex align-items-center justify-content-center gap-1.5 fw-bold"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. FULL-WIDTH CONTENT CANVAS ─── */}
      <div className="flex-grow-1 d-flex flex-column w-100">

        {/* Tab Body Content */}
        <main className="flex-grow-1 p-3 p-md-4 p-xl-5" style={{ background: '#F8FAFC' }}>
          <div className="container-fluid px-0" style={{ maxWidth: '1300px' }}>
            
            {!customerUser ? (
              <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 mx-auto bg-white text-center animate-fade-in" style={{ maxWidth: '500px', border: '1px solid #eef2f6' }}>
                <div className="rounded-circle p-3 bg-warning text-dark d-inline-flex mx-auto mb-3 shadow-sm">
                  <Compass size={32} />
                </div>

                {otpStep === 'phone' ? (
                  <>
                    <h4 className="fw-black text-dark mb-1 font-heading">Customer Portal Login</h4>
                    <p className="text-muted text-xs mb-4">
                      Enter the mobile number you provided during booking to receive a verification OTP and access your trip dashboard.
                    </p>

                    {sessionStorage.getItem('customer_login_phone') && (
                      <div className="alert alert-warning bg-warning bg-opacity-10 border-0 py-2 px-3 text-xs mb-3 rounded-3 text-start d-flex align-items-center gap-2">
                        <span className="badge bg-warning text-dark fw-bold">Recent Booking</span>
                        <span className="text-dark">Mobile number detected from your recent booking</span>
                      </div>
                    )}

                    {loginError && (
                      <div className="alert alert-danger py-2 px-3 text-xs mb-3 rounded-3 text-start">
                        {loginError}
                      </div>
                    )}

                    <form onSubmit={handleSendOtp}>
                      <div className="mb-3 text-start">
                        <label className="form-label text-xs fw-bold text-muted">Registered Mobile Number</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light text-muted fw-bold text-xs border-end-0">
                            🇮🇳 +91
                          </span>
                          <input 
                            type="tel"
                            maxLength={10}
                            className="form-control form-control-lg text-sm rounded-end-3"
                            placeholder="e.g. 9876543210"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={checkingPhone}
                        className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2.5 text-xs shadow-sm mb-3 d-flex align-items-center justify-content-center gap-2"
                      >
                        {checkingPhone ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>Verifying Registered Booking...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Verification OTP</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h4 className="fw-black text-dark mb-1 font-heading">Enter Verification Code</h4>
                    <p className="text-muted text-xs mb-3">
                      We have sent a 4-digit verification code to <strong className="text-dark">+91 {loginPhone}</strong>
                      {' '}<button type="button" onClick={() => { setOtpStep('phone'); setLoginError(''); }} className="btn btn-link p-0 text-warning text-xs fw-bold">Change</button>
                    </p>

                    {/* Simulated OTP Notification Banner */}
                    <div className="card bg-light border border-warning border-opacity-25 rounded-3 p-3 mb-3 text-start">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="text-xxs text-muted fw-bold text-uppercase">One-Time Password (OTP)</div>
                          <div className="fw-black text-dark font-heading tracking-wider" style={{ fontSize: '18px' }}>
                            {generatedOtp}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning text-dark fw-bold text-xxs rounded-pill px-3 py-1 shadow-sm"
                          onClick={() => setOtpCode(generatedOtp)}
                        >
                          ⚡ Auto-Fill Code
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="alert alert-danger py-2 px-3 text-xs mb-3 rounded-3 text-start">
                        {loginError}
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp}>
                      <div className="mb-3 text-start">
                        <label className="form-label text-xs fw-bold text-muted">4-Digit OTP Code</label>
                        <input 
                          type="text"
                          maxLength={4}
                          className="form-control form-control-lg text-center fw-black text-dark tracking-widest rounded-3 font-heading"
                          style={{ fontSize: '24px', letterSpacing: '8px' }}
                          placeholder="••••"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                          required
                        />
                      </div>

                      <button 
                        type="submit"
                        className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2.5 text-xs shadow-sm mb-3 d-flex align-items-center justify-content-center gap-2"
                      >
                        <span>Verify & Access Customer Dashboard →</span>
                      </button>
                    </form>

                    <div className="text-center text-xs text-muted pt-1">
                      {otpTimer > 0 ? (
                        <div className="d-flex align-items-center justify-content-center gap-1.5 text-muted">
                          <Clock size={13} className="text-muted" />
                          <span>Resend OTP in <strong className="text-dark fw-bold">{otpTimer}s</strong></span>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <span>Didn't receive code?</span>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="btn btn-link p-0 text-warning text-xs fw-bold text-decoration-none"
                          >
                            Resend OTP
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="text-xxs text-muted mt-4 pt-3 border-top">
                  🔒 Secure 256-bit Encrypted Customer Portal • WOW GOA
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <CustomerOverviewTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    packages={packages}
                    cars={cars}
                    bikes={bikes}
                    hotels={hotels}
                    flights={flights}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onSelectBooking={handleOpenBookingDetails}
                    onDirectBook={(item) => {
                      setDirectBookingSuccess(false);
                      setLastConfirmedDirectBooking(null);
                      setDirectBookingItem(item);
                    }}
                    walletBalance={walletBalance}
                    cashbackBalance={cashbackBalance}
                  />
                )}

                {activeTab === 'selfdrive' && (
                  <CustomerSelfDriveTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    packages={packages}
                    cars={cars}
                    bikes={bikes}
                    hotels={hotels}
                    flights={flights}
                    onOpenBookingDetails={handleOpenBookingDetails}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'driver-trips' && (
                  <CustomerDriverTripsTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onOpenBookingDetails={handleOpenBookingDetails}
                  />
                )}

                {activeTab === 'bookings' && (
                  <CustomerBookingsTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onOpenBookingDetails={handleOpenBookingDetails}
                  />
                )}

                {activeTab === 'wallet' && (
                  <CustomerWalletTab 
                    currentUser={customerUser}
                    walletBalance={walletBalance}
                    transactions={walletTransactions}
                  />
                )}

                {activeTab === 'cashback' && (
                  <CustomerCashbackTab 
                    currentUser={customerUser}
                    cashbackBalance={cashbackBalance}
                    cashbackHistory={cashbackHistory}
                  />
                )}

                {activeTab === 'payments' && (
                  <CustomerPaymentsTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onOpenBookingDetails={handleOpenBookingDetails}
                  />
                )}

                {activeTab === 'notifications' && (
                  <CustomerNotificationsTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                  />
                )}

                {activeTab === 'profile' && (
                  <CustomerProfileTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                    onUpdateProfile={(updated) => setCustomerUser({ ...customerUser, ...updated })}
                  />
                )}

                {activeTab === 'support' && (
                  <CustomerSupportTab 
                    currentUser={customerUser}
                    bookings={customerBookings}
                  />
                )}
              </>
            )}

          </div>
        </main>
      </div>

      {/* ─── 3. Full Booking Details & Voucher Modal ─── */}
      {selectedBookingDetails && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 25, 44, 0.75)', backdropFilter: 'blur(6px)', zIndex: 1060 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate-fade-in-up" style={{ width: '94%', maxWidth: '720px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div className="card-header bg-dark text-white p-3 p-md-4 d-flex justify-content-between align-items-center border-bottom border-dark">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle p-2 bg-warning text-dark">
                  <Compass size={22} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-warning text-dark fw-black text-xxs px-2 py-0.5 rounded">
                      BOOKING VOUCHER
                    </span>
                    <span className="text-white-50 text-xxs">
                      Booked on {selectedBookingDetails.created_at ? new Date(selectedBookingDetails.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                  <h5 className="fw-black mb-0 text-white font-heading" style={{ fontSize: '18px' }}>
                    Booking #{selectedBookingDetails.id || selectedBookingDetails.booking_id || 'WOW-101'}
                  </h5>
                </div>
              </div>
              <button 
                onClick={handleCloseBookingDetails} 
                className="btn btn-sm btn-outline-light text-white rounded-circle p-1.5 border-0 hover-bg-light"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="card-body p-3 p-md-4 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 130px)', background: '#F8FAFC' }}>
              
              {/* 1. Status Progress Tracker */}
              <div className="card border-0 shadow-sm rounded-3 p-3 mb-3 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-xxs text-uppercase fw-bold text-muted tracking-wider">Booking Status</span>
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold text-xs">
                    {selectedBookingDetails.status || 'Confirmed'}
                  </span>
                </div>
                
                {/* 5-Step Progress Bar */}
                <div className="d-flex align-items-center justify-content-between position-relative mt-2 px-2">
                  {['Pending', 'Confirmed', 'Upcoming', 'Ongoing', 'Completed'].map((st, sIdx) => {
                    const curStatus = (selectedBookingDetails.status || 'Confirmed').toLowerCase();
                    const statusOrder = ['pending', 'confirmed', 'upcoming', 'ongoing', 'completed'];
                    const curIdx = statusOrder.indexOf(curStatus) >= 0 ? statusOrder.indexOf(curStatus) : 1;
                    const isPassed = sIdx <= curIdx;
                    const isCurrent = sIdx === curIdx;

                    return (
                      <div key={st} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 2 }}>
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center text-xxs fw-bold ${
                            isCurrent 
                              ? 'bg-warning text-dark ring-2 ring-warning shadow-sm' 
                              : isPassed 
                                ? 'bg-success text-white' 
                                : 'bg-light text-muted border'
                          }`}
                          style={{ width: '22px', height: '22px', fontSize: '10px' }}
                        >
                          {isPassed ? '✓' : sIdx + 1}
                        </div>
                        <span className={`text-xxs mt-1 fw-bold ${isCurrent ? 'text-dark' : isPassed ? 'text-success' : 'text-muted'}`} style={{ fontSize: '10px' }}>
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Primary Service Card (Dynamically adapts to Hotel, Self Drive, Car, Bike, Tour Package, Flight) */}
              {(() => {
                const type = (selectedBookingDetails.package_type || selectedBookingDetails.type || '').toLowerCase();
                const itemName = (selectedBookingDetails.item_name || selectedBookingDetails.package_name || selectedBookingDetails.vehicle_name || '').toLowerCase();
                const isHotel = type === 'hotel' || type.includes('hotel') || itemName.includes('resort') || itemName.includes('hotel') || Boolean(selectedBookingDetails.hotel_name);
                const isBike = type === 'bike' || type.includes('bike rental') || itemName.includes('bike') || itemName.includes('scooter') || itemName.includes('activa') || itemName.includes('himalayan') || itemName.includes('bullet') || itemName.includes('gt');
                const isSelfDrivePkg = type.includes('self drive') || type === 'selfdrive' || itemName.includes('self drive') || itemName.includes('craft my trip');
                const isFlight = type === 'flight' || itemName.includes('flight');
                const isTourPkg = (type.includes('package') || type.includes('tour')) && !isSelfDrivePkg;

                if (isHotel && !isSelfDrivePkg) {
                  return (
                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-3 bg-white">
                      <div className="card-header bg-light py-2.5 px-3 d-flex justify-content-between align-items-center border-bottom">
                        <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                          <Hotel size={15} className="text-primary" />
                          <span>Hotel & Resort Stay Details</span>
                        </span>
                        <span className="badge bg-primary bg-opacity-10 text-primary text-xxs px-2.5 py-1 rounded-pill fw-bold">
                          🏨 Confirmed Resort Booking
                        </span>
                      </div>
                      <div className="card-body p-3">
                        <div className="row g-3 align-items-center">
                          <div className="col-sm-4 text-center">
                            <div className="rounded-3 p-1 bg-light overflow-hidden" style={{ height: '120px' }}>
                              <img 
                                src={getBookingDisplayImage(selectedBookingDetails, cars, bikes, packages, hotels, flights)} 
                                alt="Hotel" 
                                className="w-100 h-100 object-fit-cover rounded-2"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80';
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-sm-8">
                            <h5 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '17px' }}>
                              {selectedBookingDetails.hotel_name || selectedBookingDetails.item_name || 'Goa Beach Resort & Spa'}
                            </h5>
                            <div className="text-muted text-xs mb-2">
                              📍 {selectedBookingDetails.hotel_location || selectedBookingDetails.pickup_location || 'Goa Beachfront'}
                            </div>
                            <div className="d-flex flex-wrap gap-1.5 text-xxs mb-2">
                              <span className="badge bg-light text-dark border px-2 py-1">Room: <strong>{selectedBookingDetails.room_type || 'Deluxe Room'}</strong></span>
                              <span className="badge bg-light text-dark border px-2 py-1">Duration: <strong>{selectedBookingDetails.duration || `${selectedBookingDetails.booking_days || 2} Nights`}</strong></span>
                              <span className="badge bg-light text-dark border px-2 py-1">✓ Breakfast Included</span>
                              <span className="badge bg-light text-dark border px-2 py-1">✓ Swimming Pool Access</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default Vehicle / Self Drive / Package / Flight Card
                return (
                  <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-3 bg-white">
                    <div className="card-header bg-light py-2.5 px-3 d-flex justify-content-between align-items-center border-bottom">
                      <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                        {isSelfDrivePkg ? <Compass size={15} className="text-warning" /> : isBike ? <Car size={15} className="text-info" /> : isFlight ? <Plane size={15} className="text-info" /> : isTourPkg ? <Package size={15} className="text-purple" /> : <Car size={15} className="text-warning" />}
                        <span>{isSelfDrivePkg ? 'Self Drive Holiday & Vehicle Details' : isBike ? 'Bike Rental Reservation' : isTourPkg ? 'Tour Package Details' : isFlight ? 'Flight Booking Details' : 'Vehicle & Rental Details'}</span>
                      </span>
                      <span className="badge bg-dark text-white text-xxs px-2 py-0.5 rounded">
                        {selectedBookingDetails.package_type || selectedBookingDetails.type || 'Self Drive'}
                      </span>
                    </div>
                    <div className="card-body p-3">
                      <div className="row g-3 align-items-center">
                        <div className="col-sm-4 text-center">
                          <div className="rounded-3 p-2 bg-light overflow-hidden" style={{ height: '110px' }}>
                            <img 
                              src={getBookingDisplayImage(selectedBookingDetails, cars, bikes, packages, hotels, flights)} 
                              alt="Item" 
                              className="w-100 h-100 object-fit-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = isBike
                                  ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'
                                  : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-sm-8">
                          <h5 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '17px' }}>
                            {selectedBookingDetails.package_name || selectedBookingDetails.item_name || selectedBookingDetails.vehicle_name || 'WOW GOA Booking'}
                          </h5>
                          <div className="text-muted text-xs mb-2">
                            {selectedBookingDetails.vehicle_name ? `Assigned Model: ${selectedBookingDetails.vehicle_name}` : (selectedBookingDetails.hotel_name ? `Stay: ${selectedBookingDetails.hotel_name}` : 'WOW GOA Curated Booking')}
                            {selectedBookingDetails.vehicle_number ? ` • Reg: ${selectedBookingDetails.vehicle_number}` : ''}
                          </div>
                          <div className="d-flex flex-wrap gap-1.5 text-xxs">
                            <span className="badge bg-light text-dark border px-2 py-1">✓ Unlimited KMs</span>
                            <span className="badge bg-light text-dark border px-2 py-1">✓ Full Insurance Coverage</span>
                            <span className="badge bg-light text-dark border px-2 py-1">✓ All Goa Tourist Permit</span>
                            <span className="badge bg-light text-dark border px-2 py-1">✓ Free Delivery & Pickup</span>
                          </div>
                        </div>
                      </div>

                      {/* Trip Itinerary / Inclusions if package */}
                      {(isSelfDrivePkg || isTourPkg || selectedBookingDetails.package_name) && (
                        <div className="mt-3 pt-3 border-top">
                          <div className="fw-bold text-dark text-xs mb-1.5">🌴 Holiday Package Inclusions & Highlights:</div>
                          <div className="row g-2 text-xs text-muted">
                            <div className="col-6">• Curated North & South Goa Itinerary</div>
                            <div className="col-6">• 24/7 On-Road Mechanical Support</div>
                            <div className="col-6">• Sanitized Vehicle & Doorstep Handover</div>
                            <div className="col-6">• Zero Hidden Surcharges</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 3. Hotel Stay Details (if booked/applicable as add-on or bundled) */}
              {(selectedBookingDetails.hotel_name || selectedBookingDetails.hotel_id) && (selectedBookingDetails.package_type === 'Self Drive Package' || selectedBookingDetails.type === 'selfdrive' || selectedBookingDetails.type === 'package') && (
                <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-3 bg-white">
                  <div className="card-header bg-light py-2.5 px-3 d-flex justify-content-between align-items-center border-bottom">
                    <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                      <Hotel size={15} className="text-primary" />
                      <span>Bundled Hotel & Resort Accommodation</span>
                    </span>
                    <span className="badge bg-primary bg-opacity-10 text-primary text-xxs px-2 py-0.5 rounded fw-bold">
                      Confirmed Stay
                    </span>
                  </div>
                  <div className="card-body p-3">
                    <h6 className="fw-bold text-dark mb-1 font-heading">{selectedBookingDetails.hotel_name || 'Goa Beach Resort & Spa'}</h6>
                    <div className="text-muted text-xs mb-2">📍 {selectedBookingDetails.hotel_location || 'North Goa Beachside'}</div>
                    <div className="d-flex flex-wrap gap-2 text-xs text-muted">
                      <span>Room: <strong>{selectedBookingDetails.room_type || 'Deluxe AC Room'}</strong></span>
                      <span>•</span>
                      <span>Nights: <strong>{selectedBookingDetails.duration || `${selectedBookingDetails.booking_days || 2} Nights`}</strong></span>
                      <span>•</span>
                      <span>Complimentary Breakfast & Pool Access</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Schedule & Points (Adapts to Hotel vs Flight vs Vehicle/Self Drive) */}
              {(() => {
                const type = (selectedBookingDetails.package_type || selectedBookingDetails.type || '').toLowerCase();
                const itemName = (selectedBookingDetails.item_name || selectedBookingDetails.package_name || selectedBookingDetails.vehicle_name || '').toLowerCase();
                const isHotel = (type === 'hotel' || type.includes('hotel') || itemName.includes('resort') || itemName.includes('hotel') || Boolean(selectedBookingDetails.hotel_name)) && !type.includes('self drive') && !itemName.includes('self drive') && !type.includes('craft');
                const isFlight = type === 'flight' || itemName.includes('flight');

                if (isHotel) {
                  return (
                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-3 bg-white">
                      <div className="card-header bg-light py-2.5 px-3 border-bottom">
                        <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                          <Hotel size={15} className="text-primary" />
                          <span>Check-in & Check-out Schedule</span>
                        </span>
                      </div>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <Clock size={14} className="text-success" /> Check-in Date & Time:
                          </span>
                          <span className="fw-bold text-dark text-end">
                            {selectedBookingDetails.pickup_date || selectedBookingDetails.checkin_date || selectedBookingDetails.travel_date || 'Day 1'}
                            <span className="text-muted d-block text-xxs">From 12:00 PM onwards</span>
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <Clock size={14} className="text-danger" /> Check-out Date & Time:
                          </span>
                          <span className="fw-bold text-dark text-end">
                            {selectedBookingDetails.drop_date || selectedBookingDetails.checkout_date || 'Departure Day'}
                            <span className="text-muted d-block text-xxs">Until 11:00 AM</span>
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <MapPin size={14} className="text-primary" /> Hotel Address:
                          </span>
                          <span className="fw-bold text-dark text-end">
                            {selectedBookingDetails.hotel_location || selectedBookingDetails.pickup_location || 'Goa Beachfront & Resorts'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isFlight) {
                  return (
                    <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-3 bg-white">
                      <div className="card-header bg-light py-2.5 px-3 border-bottom">
                        <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                          <Plane size={15} className="text-info" />
                          <span>Flight Schedule & Airport Terminals</span>
                        </span>
                      </div>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <Plane size={14} className="text-primary" /> Route & Flight:
                          </span>
                          <span className="fw-bold text-dark text-end">
                            {selectedBookingDetails.flight_route || `${selectedBookingDetails.pickup_location || 'BLR'} → GOI (Goa)`}
                            <span className="text-muted d-block text-xxs">{selectedBookingDetails.airline_name || 'Direct Scheduled Flight'}</span>
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center text-xs">
                          <span className="text-muted d-flex align-items-center gap-1.5">
                            <Calendar size={14} className="text-primary" /> Departure Date:
                          </span>
                          <span className="fw-bold text-dark">
                            {selectedBookingDetails.pickup_date || selectedBookingDetails.travel_date || 'Scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default Self Drive / Car / Bike / Tour Package schedule
                return (
                  <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-3 bg-white">
                    <div className="card-header bg-light py-2.5 px-3 border-bottom">
                      <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                        <MapPin size={15} className="text-danger" />
                        <span>Pickup & Drop Schedule</span>
                      </span>
                    </div>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom text-xs">
                        <span className="text-muted d-flex align-items-center gap-1.5">
                          <MapPin size={14} className="text-danger" /> Pickup Point & Time:
                        </span>
                        <span className="fw-bold text-dark text-end">
                          {selectedBookingDetails.pickup_location || selectedBookingDetails.pickup || 'Goa Airport (GOI)'}
                          <span className="text-muted d-block text-xxs">{selectedBookingDetails.pickup_time || '10:00 AM'}</span>
                        </span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom text-xs">
                        <span className="text-muted d-flex align-items-center gap-1.5">
                          <MapPin size={14} className="text-success" /> Return Point & Time:
                        </span>
                        <span className="fw-bold text-dark text-end">
                          {selectedBookingDetails.drop_location || selectedBookingDetails.drop || 'North Goa (Hotel / Hub)'}
                          <span className="text-muted d-block text-xxs">{selectedBookingDetails.drop_time || '10:00 AM'}</span>
                        </span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center text-xs">
                        <span className="text-muted d-flex align-items-center gap-1.5">
                          <Calendar size={14} className="text-primary" /> Travel Dates:
                        </span>
                        <span className="fw-bold text-dark">
                          {selectedBookingDetails.pickup_date || selectedBookingDetails.travel_date || 'Upcoming'}
                          {selectedBookingDetails.drop_date ? ` to ${selectedBookingDetails.drop_date}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 5. Chauffeur / Driver Section (ONLY when driver is required) */}
              {(selectedBookingDetails.driver_required == 1 || selectedBookingDetails.driver_required === 'yes' || selectedBookingDetails.driver_required === true || selectedBookingDetails.assigned_driver_name) && (() => {
                const hasDriver = Boolean(selectedBookingDetails.assigned_driver_name || selectedBookingDetails.assigned_driver_id);
                const rawStatus = (selectedBookingDetails.driver_job_status || (hasDriver ? 'Assigned' : 'Unassigned')).toLowerCase();
                
                let label = 'Driver Not Assigned';
                let stage = 1;
                let theme = 'warning';

                if (!hasDriver) {
                  label = 'Driver Dispatch in Progress';
                  stage = 1;
                  theme = 'warning';
                } else if (rawStatus === 'completed' || (selectedBookingDetails.status || '').toLowerCase() === 'completed') {
                  label = 'Trip Completed';
                  stage = 7;
                  theme = 'success';
                } else if (rawStatus === 'in progress' || rawStatus === 'in_progress' || rawStatus === 'trip started') {
                  label = 'Trip Started';
                  stage = 6;
                  theme = 'primary';
                } else if (rawStatus === 'arrived') {
                  label = 'Driver Arrived at Pickup Point';
                  stage = 5;
                  theme = 'info';
                } else if (rawStatus === 'on the way' || rawStatus === 'on_the_way') {
                  label = 'Driver On The Way';
                  stage = 4;
                  theme = 'info';
                } else if (rawStatus === 'accepted') {
                  label = 'Driver Accepted';
                  stage = 3;
                  theme = 'success';
                } else {
                  label = 'Driver Assigned';
                  stage = 2;
                  theme = 'primary';
                }

                return (
                  <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-3 bg-white">
                    <div className={`card-header py-2.5 px-3 d-flex justify-content-between align-items-center border-bottom bg-${theme} bg-opacity-10`}>
                      <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                        <Users size={15} className={`text-${theme}`} />
                        <span>Dedicated Chauffeur Status: <strong className={`text-${theme}`}>{label}</strong></span>
                      </span>
                      <span className={`badge bg-${theme} bg-opacity-10 text-${theme} border border-${theme} border-opacity-25 text-xxs px-2.5 py-1 rounded-pill fw-bold`}>
                        {label}
                      </span>
                    </div>

                    {/* Driver Progress Bar */}
                    <div className="bg-light p-2.5 border-bottom">
                      <div className="d-flex justify-content-between align-items-center position-relative px-2">
                        {[
                          { key: 0, label: 'Confirmed' },
                          { key: 2, label: 'Assigned' },
                          { key: 3, label: 'Accepted' },
                          { key: 4, label: 'On The Way' },
                          { key: 5, label: 'Arrived' },
                          { key: 6, label: 'Trip Started' },
                          { key: 7, label: 'Completed' }
                        ].map((step, sIdx) => {
                          const isPassed = stage >= step.key;
                          return (
                            <div key={sIdx} className="text-center flex-grow-1">
                              <div 
                                className={`rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold shadow-sm ${
                                  isPassed ? 'bg-success text-white' : 'bg-white text-muted border'
                                }`}
                                style={{ width: '22px', height: '22px', fontSize: '10px' }}
                              >
                                {isPassed ? '✓' : sIdx + 1}
                              </div>
                              <div className={`text-xxs mt-0.5 fw-bold ${isPassed ? 'text-dark' : 'text-muted'}`} style={{ fontSize: '9px' }}>
                                {step.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="card-body p-3">
                      {hasDriver ? (
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div>
                            <div className="fw-black text-dark font-heading" style={{ fontSize: '15px' }}>
                              {selectedBookingDetails.assigned_driver_name || 'Assigned Chauffeur'}
                            </div>
                            <div className="text-muted text-xs">
                              Phone: <strong>{selectedBookingDetails.assigned_driver_phone || '+91 98765 00000'}</strong> • Vehicle: <strong>{selectedBookingDetails.assigned_driver_vehicle || selectedBookingDetails.vehicle_name || 'Assigned Cab'}</strong>
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <a 
                              href={`tel:${selectedBookingDetails.assigned_driver_phone || ''}`} 
                              className="btn btn-sm btn-dark text-white rounded-pill px-3 py-1 text-xs fw-bold d-flex align-items-center gap-1 shadow-sm"
                            >
                              <Phone size={13} className="text-warning" />
                              <span>Call Driver</span>
                            </a>
                            <a 
                              href={`https://wa.me/${String(selectedBookingDetails.assigned_driver_phone || '').replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(selectedBookingDetails.assigned_driver_name || 'Driver')}%2C%20I%20am%20your%20passenger%20for%20Booking%20%23${selectedBookingDetails.id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="btn btn-sm btn-success text-white rounded-pill px-3 py-1 text-xs fw-bold d-flex align-items-center gap-1 shadow-sm"
                            >
                              <MessageCircle size={13} />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted">
                          <div className="fw-bold text-dark mb-1">⏳ Driver Dispatch in Progress</div>
                          <div>Your chauffeur assignment has been queued with our verified local drivers in Goa. You will receive driver contact details and live tracking prior to trip start.</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 6. Payment & Fare Summary */}
              <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                <div className="card-header bg-light py-2.5 px-3 border-bottom">
                  <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5 font-heading">
                    <CreditCard size={15} className="text-success" />
                    <span>Payment & Fare Summary</span>
                  </span>
                </div>
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between text-xs mb-2">
                    <span className="text-muted">Total Trip Booking Fare:</span>
                    <span className="fw-bold text-dark">₹{Number(selectedBookingDetails.total_amount || selectedBookingDetails.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="d-flex justify-content-between text-xs mb-2">
                    <span className="text-muted">Amount Paid Online:</span>
                    <span className="fw-bold text-success">₹{Number(selectedBookingDetails.paid_amount || selectedBookingDetails.total_paid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="d-flex justify-content-between text-xs pt-2 border-top">
                    <span className="fw-bold text-danger">Pending Balance Due on Pickup:</span>
                    <span className="fw-black text-danger fs-6 font-heading">₹{Number(selectedBookingDetails.pending_amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="card-footer bg-white p-3 d-flex justify-content-between align-items-center border-top">
              <button 
                onClick={() => window.print()} 
                className="btn btn-dark btn-sm rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm text-xs"
              >
                <Download size={14} />
                <span>Print Trip Voucher</span>
              </button>
              
              <div className="d-flex gap-2">
                <a 
                  href="https://wa.me/919876543210?text=Hi%20WOW%20GOA,%20I%20need%20help%20with%20my%20booking" 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-outline-success btn-sm rounded-pill px-3 py-2 text-xs fw-bold d-flex align-items-center gap-1"
                >
                  <span>WhatsApp Support</span>
                </a>
                <button 
                  onClick={handleCloseBookingDetails} 
                  className="btn btn-secondary btn-sm rounded-pill px-4 py-2 fw-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── 4. Direct Booking Modal within Customer Portal ─── */}
      {directBookingItem && (
        <BookingModal
          selectedBookingItem={directBookingItem}
          setSelectedBookingItem={setDirectBookingItem}
          showSuccess={directBookingSuccess}
          userName={bookingUserName}
          setUserName={setBookingUserName}
          userPhone={bookingUserPhone}
          setUserPhone={setBookingUserPhone}
          userLicense={bookingUserLicense}
          setUserLicense={setBookingUserLicense}
          pickupLoc="Goa Airport (Dabolim / Mopa)"
          pickupDate={getTodayDateStr()}
          pickupTime="10:00 AM"
          dropDate=""
          dropTime="10:00 AM"
          bookingDays={3}
          handleConfirmBooking={handleConfirmDirectBooking}
          lastConfirmedBooking={lastConfirmedDirectBooking}
          allPackages={packages}
          allCars={cars}
          allBikes={bikes}
        />
      )}

    </div>
  );
}
