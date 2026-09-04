import React, { useState, useEffect } from 'react';
import './App.css';
import { useSiteConfig } from './context/SiteConfigContext';

// Import Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SearchWidget from './components/SearchWidget';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import BookingModal from './components/BookingModal';
import HotelBookingModal from './components/HotelBookingModal';
import PackageDetailsModal from './components/PackageDetailsModal';
import AIChatbot from './components/AIChatbot';
import WhatsAppWidget from './components/WhatsAppWidget';
import PopupRenderer from './components/website/PopupRenderer';

import DynamicFeaturedHotels from './components/widgets/DynamicFeaturedHotels';
import DynamicFeaturedVehicles from './components/widgets/DynamicFeaturedVehicles';
import DynamicPopularPackages from './components/widgets/DynamicPopularPackages';
import FeaturesGrid from './components/widgets/FeaturesGrid';
import SelfDriveCategoryShowcase from './components/widgets/SelfDriveCategoryShowcase';

// Import Pages
import {
  FlightBookingFlow,
  AdminPortalPage,
  VendorPortalPage,
  FlightVendorPortalPage,
  HotelVendorPortalPage,
  SuperAdminPortalPage,
  HotelsPage,
  CarsPage,
  BikesPage,
  FlightsPage,
  HotelDetailsPage,
  VehicleDetailsPage,
  PackageDetailsPage,
  ExplorePage,
  SelfDrivePage,
  PackageCustomizationPage,
  CraftMyTripPage,
  AIPlannerPage,
  CustomerDashboard,
  SubAdminPortalPage,
  DriverPortalPage,
  DriverLoginPage,
  CustomerPortalPage
} from './pages';
import CustomTripEnquiryPage from './pages/customer/CustomTripEnquiryPage';
import B2BPortalPage from './pages/b2b/B2BPortalPage';

// Import Mock Data & API Service
import { 
  locationsList, 
  hotelsData as defaultHotels, 
  packagesData as defaultPackages, 
  carsData as defaultCars, 
  bikesData as defaultBikes, 
  exploreDestinations as defaultDestinations,
  usersData as defaultUsers,
  bookingsData as defaultBookings,
  vendorsData as defaultVendors
} from './data/mockData';
import * as api from './services/api';
import { getTodayDateStr, addDays, validateBookingDates } from './utils/dateUtils';

export default function App() {
  const { liveConfig } = useSiteConfig();
  
  // Navigation & Tabs state (Default to public storefront selfdrive view)
  const [activeTab, setActiveTab] = useState('selfdrive');
  const [currentPath, setCurrentPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/'));
  const path = currentPath;

  // Search Widget form fields
  const [pickupLoc, setPickupLoc] = useState('');
  const [dropLoc, setDropLoc] = useState('');
  const [pickupDate, setPickupDate] = useState(() => getTodayDateStr());
  const [dropDate, setDropDate] = useState(() => addDays(getTodayDateStr(), 2));
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropTime, setDropTime] = useState('10:00');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedFlightOffer, setSelectedFlightOffer] = useState(null);
  const [hotelRooms, setHotelRooms] = useState(1);
  const [hotelAdults, setHotelAdults] = useState(2);
  const [hotelChildren, setHotelChildren] = useState(0);
  const [hotelPriceRange, setHotelPriceRange] = useState('All');
  
  // Flight Specific State
  const [flightAdults, setFlightAdults] = useState(1);
  const [flightChildren, setFlightChildren] = useState(0);
  const [flightInfants, setFlightInfants] = useState(0);
  const [flightClass, setFlightClass] = useState('economy');

  // Filters state
  const [appliedFilters, setAppliedFilters] = useState({});
  const [hotelFilterStars, setHotelFilterStars] = useState('All');
  const [packageFilterDuration, setPackageFilterDuration] = useState('All');
  const [carFilterFuel, setCarFilterFuel] = useState('All');
  const [carFilterTrans, setCarFilterTrans] = useState('All');
  const [bikeFilterType, setBikeFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout Modal state
  const [selectedBookingItem, setSelectedBookingItem] = useState(null);
  const [selectedPackageModal, setSelectedPackageModal] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookingDays, setBookingDays] = useState(2);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userLicense, setUserLicense] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState(null);

  // Users & Role-Based Auth States
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [usersList, setUsersList] = useState(defaultUsers);

  // Database-driven data states
  const [vendors, setVendors] = useState(defaultVendors);
  const [hotels, setHotels] = useState(defaultHotels);
  const [destinations, setDestinations] = useState(defaultDestinations);
  const [packages, setPackages] = useState(defaultPackages);
  const [cars, setCars] = useState(defaultCars);
  const [bikes, setBikes] = useState(defaultBikes);
  const [bookings, setBookingsList] = useState(defaultBookings);
  const [flights, setFlights] = useState([]);
  const [markups, setMarkups] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load backend data on mount
  useEffect(() => {
    let safetyTimer = setTimeout(() => {
      setDataLoaded(true);
    }, 1500);

    async function loadAllData() {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTenant = urlParams.get('tenant');
      if (urlTenant) {
        localStorage.setItem('tenant_id', urlTenant);
      }

      try {
        const [hotelsData, destinationsData, packagesData, vendorsData, usersData, carsData, bikesData, bookingsData, flightsData, markupsData] = await Promise.all([
          api.fetchHotels(),
          api.fetchDestinations(),
          api.fetchPackages(),
          api.fetchVendors(),
          api.fetchUsers(),
          api.fetchCars(),
          api.fetchBikes(),
          api.fetchBookings(),
          api.fetchFlights(),
          api.fetchMarkups()
        ]);
        
        if (Array.isArray(hotelsData)) setHotels(hotelsData);
        if (Array.isArray(destinationsData)) setDestinations(destinationsData);
        if (Array.isArray(packagesData)) setPackages(packagesData);
        if (Array.isArray(vendorsData)) setVendors(vendorsData);
        if (Array.isArray(usersData)) setUsersList(usersData);
        if (Array.isArray(carsData)) setCars(carsData);
        if (Array.isArray(bikesData)) setBikes(bikesData);
        if (Array.isArray(bookingsData)) setBookingsList(bookingsData);
        if (flightsData) setFlights(flightsData);
        if (markupsData) setMarkups(markupsData);
      } catch (err) {
        console.warn("Using fallback inventory data:", err);
      } finally {
        clearTimeout(safetyTimer);
        setDataLoaded(true);
      }
    }
    loadAllData();

    const handleNewBooking = (e) => {
      if (e.detail) {
        setBookingsList(prev => [e.detail, ...prev.filter(b => String(b.id) !== String(e.detail.id))]);
      }
    };

    const handlePackagesSync = () => {
      api.fetchPackages().then(fresh => {
        if (Array.isArray(fresh) && fresh.length > 0) setPackages(fresh);
      }).catch(console.error);
    };

    const handleHotelsSync = () => {
      api.fetchHotels().then(fresh => {
        if (Array.isArray(fresh) && fresh.length > 0) setHotels(fresh);
      }).catch(console.error);
    };

    window.addEventListener('new-booking-created', handleNewBooking);
    window.addEventListener('tripPackagesUpdated', handlePackagesSync);
    window.addEventListener('hotelsUpdated', handleHotelsSync);

    let bc;
    let bcHotels;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo_packages_sync');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'PACKAGES_CHANGED') {
            api.fetchPackages().then(fresh => {
              if (Array.isArray(fresh) && fresh.length > 0) setPackages(fresh);
            }).catch(console.error);
          }
        };

        bcHotels = new BroadcastChannel('tripgalileo_hotels_sync');
        bcHotels.onmessage = (event) => {
          if (event.data && event.data.type === 'HOTELS_CHANGED') {
            api.fetchHotels().then(fresh => {
              if (Array.isArray(fresh) && fresh.length > 0) setHotels(fresh);
            }).catch(console.error);
          }
        };
      }
    } catch (e) {}

    return () => {
      window.removeEventListener('new-booking-created', handleNewBooking);
      window.removeEventListener('tripPackagesUpdated', handlePackagesSync);
      window.removeEventListener('hotelsUpdated', handleHotelsSync);
      if (bc) bc.close();
      if (bcHotels) bcHotels.close();
    };
  }, []);

  // Sync tab with browser URL and history navigation
  useEffect(() => {
    const syncTabFromUrl = () => {
      const p = window.location.pathname.toLowerCase();
      setCurrentPath(p);
      const cleanPath = p.replace(/^\//, '').split('/')[0];
      if (cleanPath === 'packages') setActiveTab('packages');
      else if (cleanPath === 'self-drive' || cleanPath === 'selfdrive' || cleanPath === '') setActiveTab('selfdrive');
      else if (cleanPath === 'hotels') setActiveTab('hotels');
      else if (cleanPath === 'cars') setActiveTab('cars');
      else if (cleanPath === 'bikes') setActiveTab('bikes');
      else if (cleanPath === 'flights') setActiveTab('flights');
      else if (cleanPath === 'craft' || cleanPath === 'craftmytrip') setActiveTab('craftmytrip');
      else if (cleanPath === 'custom-trip') setActiveTab('custom-trip');
      else if (cleanPath === 'customer' || cleanPath.startsWith('customer')) setActiveTab('customer');
      else if (cleanPath === 'admin' || cleanPath === 'portal' || cleanPath === 'superadmin' || cleanPath === 'vendor' || cleanPath === 'hotel-vendor' || cleanPath === 'hotel-pms' || cleanPath === 'flight-vendor' || cleanPath === 'sub-admin' || cleanPath === 'subadmin') setActiveTab('portal');
      else if (cleanPath === 'dashboard' || cleanPath === 'my-bookings') setActiveTab('dashboard');
      else if (cleanPath === 'b2b' || cleanPath.startsWith('b2b')) setActiveTab('b2b');
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  const handleTabChange = (newTab) => {
    let normalizedTab = newTab;
    if (normalizedTab === 'self drive') normalizedTab = 'selfdrive';
    if (normalizedTab === 'trip packages') normalizedTab = 'packages';
    if (normalizedTab === 'self-drive') normalizedTab = 'selfdrive';
    if (normalizedTab === 'craft' || normalizedTab === 'craft-my-trip') normalizedTab = 'craftmytrip';
    if (normalizedTab === 'my-trips' || normalizedTab === 'track-booking') normalizedTab = 'customer';

    if (activeTab === 'customize' && normalizedTab !== 'customize') {
      setSelectedBookingItem(null);
    }
    setActiveTab(normalizedTab);

    const pathMap = {
      'packages': '/packages',
      'selfdrive': '/self-drive',
      'hotels': '/hotels',
      'cars': '/cars',
      'bikes': '/bikes',
      'flights': '/flights',
      'craftmytrip': '/craft',
      'custom-trip': '/custom-trip',
      'customer': '/customer',
      'b2b': '/b2b',
      'portal': currentUser?.role === 'hotel_vendor' ? '/hotel-vendor' : (currentUser?.role === 'flight_vendor' ? '/flight-vendor' : (currentUser?.role === 'vendor' ? '/vendor' : (currentUser?.role === 'superadmin' ? '/superadmin' : '/admin'))),
      'dashboard': '/dashboard'
    };
    const targetPath = pathMap[normalizedTab] || `/${normalizedTab}`;
    window.history.pushState({}, '', targetPath);
    setCurrentPath(targetPath.toLowerCase());

    if (['hotels', 'flights', 'craftmytrip'].includes(normalizedTab)) {
      setSearchTriggered(true);
    } else if (['selfdrive', 'packages', 'cars', 'home'].includes(normalizedTab)) {
      setSearchTriggered(false);
    }

    // Slide and show directly that section
    setTimeout(() => {
      const el = document.getElementById('results-section');
      if (el) {
        const navbarHeight = 72;
        const targetPos = el.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        window.scrollTo({
          top: Math.max(0, targetPos),
          behavior: 'smooth'
        });
      }
    }, 40);
  };

  const handleOpenBooking = (item, isCustomization = false) => {
    if (item.pickupDate) setPickupDate(item.pickupDate);
    if (item.dropDate) setDropDate(item.dropDate);
    if (item.departureDate) setPickupDate(item.departureDate);
    if (item.returnDate) setDropDate(item.returnDate);

    if (item.package_type || item.duration || isCustomization) {
      setSelectedBookingItem(item);
      setActiveTab('customize');
      window.scrollTo(0, 0);
    } else {
      setSelectedBookingItem(item);
      setBookingDays(2);
    }
  };

  const handleOpenHotelBooking = (hotel) => {
    setSelectedBookingItem(hotel);
    setBookingDays(2);
  };

  const handleOpenDetails = (item, type = 'hotel') => {
    if (type === 'package') {
      setSelectedPackageModal(item);
    } else {
      setSelectedDetailItem(item);
      setSearchTriggered(true);
      if (type === 'hotel') setActiveTab('hotel-details');
      else if (type === 'vehicle') setActiveTab('vehicle-details');
      window.scrollTo(0, 0);
    }
  };

  const handleLogin = async (usernameOrUser, password) => {
    // If called with a user object directly
    if (typeof usernameOrUser === 'object' && usernameOrUser !== null) {
      const user = usernameOrUser;
      setCurrentUser(user);
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {}
      setShowLoginModal(false);
      if (user.role === 'driver') {
        setActiveTab('driver');
        window.history.pushState(null, '', '/driver');
      } else if (user.role === 'customer' || user.role === 'user') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('portal');
      }
      return true;
    }

    // If called with (username, password)
    try {
      const res = await api.loginUser(usernameOrUser, password);
      const user = (res && res.user) ? res.user : res;
      if (user && (user.id || user.username || user.role)) {
        setCurrentUser(user);
        try {
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {}
        setShowLoginModal(false);
        if (user.role === 'driver') {
          setActiveTab('driver');
          window.history.pushState(null, '', '/driver');
        } else if (user.role === 'customer' || user.role === 'user') {
          setActiveTab('dashboard');
        } else {
          setActiveTab('portal');
        }
        try {
          const userBookings = await api.fetchBookings();
          if (Array.isArray(userBookings)) setBookingsList(userBookings);
        } catch (be) {}
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setBookingsList([]);
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('b2b_partner_token');
      localStorage.removeItem('b2b_partner_user');
      localStorage.removeItem('driverUser');
    } catch (e) {}
    setActiveTab('packages');
  };

  // Inventory CRUD handlers
  const handleAddPackage = async (newPkg) => {
    const res = await api.addPackage(newPkg);
    const fresh = await api.fetchPackages();
    setPackages(fresh);
    return res;
  };

  const handleUpdatePackage = async (pkg) => {
    const res = await api.updatePackage(pkg);
    const fresh = await api.fetchPackages();
    setPackages(fresh);
    return res;
  };

  const handleDeletePackage = async (pkgId) => {
    await api.deletePackage(pkgId);
    const fresh = await api.fetchPackages();
    setPackages(fresh);
  };

  const handleAddHotel = async (hotelData) => {
    await api.addMasterHotel(hotelData);
    const fresh = await api.fetchHotels();
    setHotels(fresh);
  };

  const handleUpdateHotel = async (hotelData) => {
    await api.updateHotel(hotelData);
    const fresh = await api.fetchHotels();
    setHotels(fresh);
  };

  const handleDeleteHotel = async (hotelId) => {
    await api.deleteHotel(hotelId);
    const fresh = await api.fetchHotels();
    setHotels(fresh);
  };

  const handleAddCar = async (carData) => {
    await api.addCar(carData);
    const fresh = await api.fetchCars();
    setCars(fresh);
  };

  const handleUpdateCar = async (carData) => {
    await api.updateCar(carData);
    const fresh = await api.fetchCars();
    setCars(fresh);
  };

  const handleDeleteCar = async (carId) => {
    await api.deleteCar(carId);
    const fresh = await api.fetchCars();
    setCars(fresh);
  };

  const handleAddBike = async (bikeData) => {
    await api.addBike(bikeData);
    const fresh = await api.fetchBikes();
    setBikes(fresh);
  };

  const handleUpdateBike = async (bikeData) => {
    await api.updateBike(bikeData);
    const fresh = await api.fetchBikes();
    setBikes(fresh);
  };

  const handleDeleteBike = async (bikeId) => {
    await api.deleteBike(bikeId);
    const fresh = await api.fetchBikes();
    setBikes(fresh);
  };

  const handleAddVendor = async (v) => {
    await api.addVendor(v);
    const fresh = await api.fetchVendors();
    setVendors(fresh);
  };

  const handleUpdateVendor = async (v) => {
    await api.updateVendor(v);
    const fresh = await api.fetchVendors();
    setVendors(fresh);
  };

  const handleDeleteVendor = async (vId) => {
    await api.deleteVendor(vId);
    const fresh = await api.fetchVendors();
    setVendors(fresh);
  };

  const handleSetVendorPassword = async (vId, pwd) => {
    await api.setVendorPassword(vId, pwd);
  };

  const handleAddFlight = async (f) => {
    await api.addFlight(f);
    const fresh = await api.fetchFlights();
    setFlights(fresh);
  };

  const handleUpdateFlight = async (f) => {
    await api.updateFlight(f);
    const fresh = await api.fetchFlights();
    setFlights(fresh);
  };

  const handleDeleteFlight = async (fId) => {
    await api.deleteFlight(fId);
    const fresh = await api.fetchFlights();
    setFlights(fresh);
  };

  const handleSaveMarkup = async (m) => {
    await api.saveMarkup(m);
    const fresh = await api.fetchMarkups();
    setMarkups(fresh);
  };

  const handleAddUser = async (u) => {
    try {
      const created = await api.superadminCreateUser(u);
      const userObj = created?.user || (created && created.username ? created : u);
      setUsersList(prev => [userObj, ...prev.filter(x => (x.username || '').toLowerCase() !== (u.username || '').toLowerCase() && (x.email || '').toLowerCase() !== (u.email || '').toLowerCase())]);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) {
        const hasUser = fresh.some(x => 
          (x.username && x.username.toLowerCase() === userObj.username?.toLowerCase()) || 
          (x.email && x.email.toLowerCase() === userObj.email?.toLowerCase()) || 
          String(x.id) === String(userObj.id)
        );
        setUsersList(hasUser ? fresh : [userObj, ...fresh]);
      }
      return userObj;
    } catch (e) {
      console.warn('handleAddUser error:', e);
      const fallbackUser = { id: `u-${Date.now()}`, ...u, role: (u.role || 'admin').toLowerCase().trim(), status: u.status || 'active' };
      setUsersList(prev => [fallbackUser, ...prev.filter(x => (x.username || '').toLowerCase() !== (u.username || '').toLowerCase() && (x.email || '').toLowerCase() !== (u.email || '').toLowerCase())]);
      return fallbackUser;
    }
  };

  const handleUpdateUser = async (idOrUser, u) => {
    try {
      const payload = typeof idOrUser === 'object' ? idOrUser : { ...u, id: idOrUser };
      setUsersList(prev => prev.map(item => (String(item.id) === String(payload.id) || item.username === payload.username) ? { ...item, ...payload } : item));
      await api.superadminUpdateUser(payload);
      const fresh = await api.fetchUsers();
      if (fresh && fresh.length) setUsersList(fresh);
    } catch (e) {
      console.warn('handleUpdateUser error:', e);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      setUsersList(prev => prev.filter(x => String(x.id) !== String(id)));
      await api.superadminDeleteUser(id);
      const fresh = await api.fetchUsers();
      if (fresh) setUsersList(fresh);
    } catch (e) {
      console.warn('handleDeleteUser error:', e);
    }
  };

  const handleSearchSubmit = (tab) => {
    setSearchTriggered(true);
    const targetTab = (typeof tab === 'string' && tab) ? tab : (typeof activeTab === 'string' ? activeTab : 'packages');
    handleTabChange(targetTab);
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleConfirmBooking = async (e, paymentMethodId, extraDetails = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanPhone = String(userPhone || '').replace(/\D/g, '');
    if (!userName || cleanPhone.length < 10) {
      alert("Please enter your name and a valid 10-digit mobile phone number for booking confirmation & tracking.");
      return;
    }
    const pDate = extraDetails.pickupDate || pickupDate;
    const dDate = extraDetails.dropDate || dropDate;
    const val = validateBookingDates(pDate, dDate);
    if (!val.valid) {
      alert(val.error);
      return;
    }
    try {
      const days = extraDetails.bookingDays || bookingDays || val.days || 1;
      const totalCost = extraDetails.total || ((selectedBookingItem.price || 0) * days);
      
      const isSelfDrivePkg = selectedBookingItem.package_type === 'Self Drive Package' || selectedBookingItem.type === 'selfdrive' || (selectedBookingItem.name && selectedBookingItem.name.toLowerCase().includes('self drive'));
      const isTripPkg = !isSelfDrivePkg && (selectedBookingItem.package_type === 'Trip Package' || selectedBookingItem.type === 'package' || String(selectedBookingItem.id || '').startsWith('pkg-') || String(selectedBookingItem.id || '').startsWith('package-') || Boolean(selectedBookingItem.duration && !selectedBookingItem.seating && !selectedBookingItem.engine));
      const isHotel = selectedBookingItem.type === 'hotel' || Boolean(selectedBookingItem.stars || selectedBookingItem.hotel_name);
      const isFlight = selectedBookingItem.type === 'flight' || Boolean(selectedBookingItem.airline);
      const isCar = !isTripPkg && !isSelfDrivePkg && (selectedBookingItem.type === 'car' || String(selectedBookingItem.id || '').startsWith('car-') || Boolean(selectedBookingItem.seating));
      const isBike = !isTripPkg && !isSelfDrivePkg && (selectedBookingItem.type === 'bike' || String(selectedBookingItem.id || '').startsWith('bike-') || Boolean(selectedBookingItem.engine));

      let detectedType = 'selfdrive';
      let detectedPkgType = 'Self Drive Package';

      if (isTripPkg) {
        detectedType = 'package';
        detectedPkgType = selectedBookingItem.package_type || 'Trip Package';
      } else if (isSelfDrivePkg) {
        detectedType = 'selfdrive';
        detectedPkgType = 'Self Drive Package';
      } else if (isHotel) {
        detectedType = 'hotel';
        detectedPkgType = 'Hotel Stay';
      } else if (isFlight) {
        detectedType = 'flight';
        detectedPkgType = 'Flight Booking';
      } else if (isCar) {
        detectedType = 'car';
        detectedPkgType = 'Car Rental';
      } else if (isBike) {
        detectedType = 'bike';
        detectedPkgType = 'Bike Rental';
      }
      
      const customerId = currentUser?.id || `c_${cleanPhone || Date.now()}`;
      const customerEmail = currentUser?.email || `${cleanPhone || 'guest'}@guest.wowgoa.com`;

      const payload = {
        name: userName,
        customer_name: userName,
        phone: cleanPhone,
        customer_phone: cleanPhone,
        email: customerEmail,
        customer_email: customerEmail,
        customer_id: customerId,
        license: userLicense,
        pickup_loc: extraDetails.pickupLoc || pickupLoc || 'Goa Airport',
        pickup_location: extraDetails.pickupLoc || pickupLoc || 'Goa Airport',
        pickup_date: pDate,
        pickup_time: extraDetails.pickupTime || pickupTime || '10:00 AM',
        drop_date: dDate,
        drop_location: extraDetails.pickupLoc || pickupLoc || 'Goa Airport',
        drop_time: extraDetails.dropTime || dropTime || '10:00 AM',
        item_id: selectedBookingItem.id || 'custom',
        item_name: selectedBookingItem.name || (isTripPkg ? 'Trip Package' : 'Trip Booking'),
        package_name: selectedBookingItem.name || (isTripPkg ? 'Trip Package' : 'Self Drive Holiday'),
        package_type: detectedPkgType,
        type: detectedType,
        vehicle_name: selectedBookingItem.car_included || selectedBookingItem.name || (isTripPkg ? '' : 'Self Drive Vehicle'),
        vehicle_image: selectedBookingItem.image || selectedBookingItem.image_url || '',
        booking_days: days,
        duration: (isTripPkg || isSelfDrivePkg) ? (selectedBookingItem.duration || `${days} Days / ${Math.max(1, days - 1)} Nights`) : `${days} Days`,
        total_amount: totalCost,
        amount_paid: totalCost,
        total_paid: totalCost,
        driver_required: extraDetails.driver_required ? 1 : 0,
        driver_service_type: extraDetails.driver_service_type || null,
        driver_charge: typeof extraDetails.driver_charge === 'number' ? extraDetails.driver_charge : 0,
        driver_days: typeof extraDetails.driver_days === 'number' ? extraDetails.driver_days : 0,
        driver_earning: typeof extraDetails.driver_earning === 'number' ? extraDetails.driver_earning : (extraDetails.driver_charge || 0),
        driver_pickup_enabled: extraDetails.driver_pickup_enabled ? 1 : 0,
        driver_pickup_date: extraDetails.driver_pickup_date || '',
        driver_pickup_time: extraDetails.driver_pickup_time || '',
        driver_pickup_loc: extraDetails.driver_pickup_loc || '',
        driver_drop_enabled: extraDetails.driver_drop_enabled ? 1 : 0,
        driver_drop_date: extraDetails.driver_drop_date || '',
        driver_drop_time: extraDetails.driver_drop_time || '',
        driver_drop_loc: extraDetails.driver_drop_loc || '',
        driver_fullday_enabled: extraDetails.driver_fullday_enabled ? 1 : 0,
        driver_fullday_start: extraDetails.driver_fullday_start || '',
        driver_fullday_end: extraDetails.driver_fullday_end || '',
        driver_fullday_days: extraDetails.driver_fullday_days || 0,
        driver_details: extraDetails.driver_details ? JSON.stringify(extraDetails.driver_details) : '',
        status: 'Confirmed'
      };

      const res = await api.createBooking(payload);
      const confirmedBooking = (res && (res.id || res.booking_id)) 
        ? { ...payload, id: res.id || res.booking_id } 
        : { ...payload, id: `WG${Math.floor(1000 + Math.random() * 9000)}` };
      
      setLastConfirmedBooking(confirmedBooking);

      // Set customer phone and local bookings for instant Customer Portal access
      try {
        sessionStorage.setItem('customer_login_phone', cleanPhone);
        sessionStorage.setItem('last_created_booking', JSON.stringify(confirmedBooking));
        localStorage.setItem('customer_login_phone', cleanPhone);
        localStorage.setItem('last_created_booking', JSON.stringify(confirmedBooking));
        const existingLocal = JSON.parse(localStorage.getItem('local_bookings') || '[]');
        const updatedLocal = [confirmedBooking, ...existingLocal.filter(b => String(b.id) !== String(confirmedBooking.id))];
        localStorage.setItem('local_bookings', JSON.stringify(updatedLocal));
      } catch (e) {}

      setShowSuccess(true);
      const freshBookings = await api.fetchBookings();
      setBookingsList(freshBookings);
    } catch (e) {
      alert(e.message || "Failed to submit booking. Please try again.");
    }
  };

  if (!dataLoaded) {
    return (
      <div className="d-flex w-100 vh-100 align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold text-dark font-heading tracking-wider">Starting WOW GOA Platform...</h4>
          <p className="text-muted small">Loading packages and verified inventory</p>
        </div>
      </div>
    );
  }

  // ─── B2B TRAVEL AGENT / PARTNER PORTAL ROUTING ────────────────────────────
  if (path.startsWith('/b2b') || activeTab === 'b2b') {
    return (
      <B2BPortalPage
        onNavigateHome={() => {
          handleTabChange('selfdrive');
        }}
      />
    );
  }

  // ─── DRIVER PORTAL ROUTING ────────────────────────────────────────────────
  if (path.startsWith('/driver') || currentUser?.role === 'driver' || activeTab === 'driver') {
    if (!currentUser || currentUser.role !== 'driver') {
      return (
        <DriverLoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
            setActiveTab('driver');
            window.history.pushState(null, '', '/driver');
          }}
          onNavigateHome={() => {
            handleTabChange('selfdrive');
          }}
        />
      );
    }
    return (
      <DriverPortalPage
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateHome={() => {
          handleTabChange('selfdrive');
        }}
      />
    );
  }

  // ─── CUSTOMER PORTAL & DASHBOARD ─────────────────────────────────────────
  if (path.startsWith('/customer') || activeTab === 'customer') {
    return (
      <CustomerPortalPage
        currentUser={currentUser}
        onLogout={handleLogout}
        bookings={bookings}
        packages={packages}
        cars={cars}
        bikes={bikes}
        hotels={hotels}
        flights={flights}
        onNavigateHome={() => {
          handleTabChange('selfdrive');
        }}
      />
    );
  }

  // ─── ADMIN / SUPERADMIN / VENDOR / SUBADMIN PORTALS ───────────────────────
  if (activeTab === 'portal' || path.startsWith('/admin') || path === '/portal' || path.startsWith('/sub-admin') || path.startsWith('/subadmin') || path.startsWith('/superadmin') || path.startsWith('/super-admin') || path === '/vendor' || path === '/hotel-vendor' || path === '/flight-vendor') {
    // Superadmin route guard
    if (path.startsWith('/superadmin') || path.startsWith('/super-admin') || currentUser?.role === 'superadmin') {
      if (!currentUser || currentUser.role !== 'superadmin') {
        return (
          <>
            <LoginModal isOpen={true} onClose={() => { setShowLoginModal(false); handleTabChange('selfdrive'); }} onLogin={handleLogin} />
          </>
        );
      }
      return (
        <>
          <SuperAdminPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            usersList={usersList}
            vendors={vendors}
            cars={cars}
            bikes={bikes}
            hotels={hotels}
            bookings={bookings}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onLogout={handleLogout}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // SubAdmin route guard
    if (path.startsWith('/sub-admin') || path.startsWith('/subadmin') || currentUser?.role === 'subadmin') {
      if (!currentUser || !['subadmin', 'sub_admin'].includes(currentUser.role)) {
        return (
          <>
            <LoginModal isOpen={true} onClose={() => { setShowLoginModal(false); handleTabChange('selfdrive'); }} onLogin={handleLogin} />
          </>
        );
      }
      return (
        <>
          <SubAdminPortalPage
            currentUser={currentUser}
            onLogout={handleLogout}
            usersList={usersList}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // Hotel Vendor route guard
    if (path === '/hotel-vendor' || currentUser?.role === 'hotel_vendor') {
      if (!currentUser || currentUser.role !== 'hotel_vendor') {
        return (
          <>
            <LoginModal isOpen={true} onClose={() => { setShowLoginModal(false); handleTabChange('selfdrive'); }} onLogin={handleLogin} />
          </>
        );
      }
      return (
        <>
          <HotelVendorPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            hotels={hotels}
            onAddHotel={handleAddHotel}
            onUpdateHotel={handleUpdateHotel}
            onDeleteHotel={handleDeleteHotel}
            onLogout={handleLogout}
            bookings={bookings}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // Flight Vendor route guard
    if (path === '/flight-vendor' || currentUser?.role === 'flight_vendor') {
      if (!currentUser || currentUser.role !== 'flight_vendor') {
        return (
          <>
            <LoginModal isOpen={true} onClose={() => { setShowLoginModal(false); handleTabChange('selfdrive'); }} onLogin={handleLogin} />
          </>
        );
      }
      return (
        <>
          <FlightVendorPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            flights={flights}
            onAddFlight={handleAddFlight}
            onUpdateFlight={handleUpdateFlight}
            onDeleteFlight={handleDeleteFlight}
            onLogout={handleLogout}
            bookings={bookings}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }
    // Vehicle Vendor route guard
    if (path === '/vendor' || currentUser?.role === 'vendor') {
      if (!currentUser || currentUser.role !== 'vendor') {
        return (
          <>
            <LoginModal isOpen={true} onClose={() => { setShowLoginModal(false); handleTabChange('selfdrive'); }} onLogin={handleLogin} />
          </>
        );
      }
      return (
        <>
          <VendorPortalPage
            currentUser={currentUser}
            triggerOpenLogin={() => setShowLoginModal(true)}
            vendors={vendors}
            cars={cars}
            bikes={bikes}
            onAddCar={handleAddCar}
            onAddBike={handleAddBike}
            onUpdateCar={handleUpdateCar}
            onUpdateBike={handleUpdateBike}
            onDeleteCar={handleDeleteCar}
            onDeleteBike={handleDeleteBike}
            onLogout={handleLogout}
            bookings={bookings}
            setBookingsList={setBookingsList}
          />
          <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
        </>
      );
    }

    // Admin Portal — only for admin/superadmin roles
    if (currentUser && !['admin', 'superadmin'].includes(currentUser.role)) {
      // Non-admin user trying to access portal — redirect to storefront
      handleTabChange('selfdrive');
      return null;
    }

    // Default to Admin Portal (for admin role or login prompt)
    return (
      <>
        <AdminPortalPage
          currentUser={currentUser}
          triggerOpenLogin={() => setShowLoginModal(true)}
          vendors={vendors}
          allPackages={packages}
          cars={cars}
          bikes={bikes}
          onAddVendor={handleAddVendor}
          onUpdateVendor={handleUpdateVendor}
          onDeleteVendor={handleDeleteVendor}
          onSetVendorPassword={handleSetVendorPassword}
          onAddPackage={handleAddPackage}
          onUpdatePackage={handleUpdatePackage}
          onDeletePackage={handleDeletePackage}
          onAddCar={handleAddCar}
          onUpdateCar={handleUpdateCar}
          onDeleteCar={handleDeleteCar}
          onAddBike={handleAddBike}
          onUpdateBike={handleUpdateBike}
          onDeleteBike={handleDeleteBike}
          onLogout={handleLogout}
          flights={flights}
          onAddFlight={handleAddFlight}
          onUpdateFlight={handleUpdateFlight}
          onDeleteFlight={handleDeleteFlight}
          hotels={hotels}
          onAddHotel={handleAddHotel}
          onUpdateHotel={handleUpdateHotel}
          onDeleteHotel={handleDeleteHotel}
          markups={markups}
          onSaveMarkup={handleSaveMarkup}
          bookings={bookings}
          usersList={usersList}
        />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      </>
    );
  }

  // ─── CUSTOMER DASHBOARD ──────────────────────────────────────────────────
  if (activeTab === 'dashboard') {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          currentUser={currentUser}
          triggerOpenLogin={() => setShowLoginModal(true)}
          onOpenLogin={() => setShowLoginModal(true)}
          onLogout={handleLogout}
        />
        <CustomerDashboard
          currentUser={currentUser}
          bookings={bookings}
          onOpenLogin={() => setShowLoginModal(true)}
        />
        <Footer setActiveTab={handleTabChange} />
      </div>
    );
  }

  // ─── MAIN PUBLIC STOREFRONT VIEW ──────────────────────────────────────────
  return (
    <div className="d-flex flex-column min-vh-100 bg-white">
      {/* Public Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
        triggerOpenLogin={() => setShowLoginModal(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Hero and Search Widget Container */}
      <Hero />
      <SearchWidget
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pickupLoc={pickupLoc} 
        setPickupLoc={setPickupLoc} 
        dropLoc={dropLoc} 
        setDropLoc={setDropLoc} 
        pickupDate={pickupDate} 
        setPickupDate={setPickupDate} 
        dropDate={dropDate}
        setDropDate={setDropDate}
        pickupTime={pickupTime} 
        setPickupTime={setPickupTime} 
        dropTime={dropTime} 
        setDropTime={setDropTime} 
        handleSearchSubmit={handleSearchSubmit} 
        setSearchTriggered={setSearchTriggered}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        hotelRooms={hotelRooms}
        setHotelRooms={setHotelRooms}
        hotelAdults={hotelAdults}
        setHotelAdults={setHotelAdults}
        hotelChildren={hotelChildren}
        setHotelChildren={setHotelChildren}
        hotelPriceRange={hotelPriceRange}
        setHotelPriceRange={setHotelPriceRange}
        flightAdults={flightAdults}
        setFlightAdults={setFlightAdults}
        flightChildren={flightChildren}
        setFlightChildren={setFlightChildren}
        flightInfants={flightInfants}
        setFlightInfants={setFlightInfants}
        flightClass={flightClass}
        setFlightClass={setFlightClass}
        appliedFilters={appliedFilters}
        setAppliedFilters={setAppliedFilters}
      />

      {/* Dynamic Results & Content Section */}
      <main className="py-5" id="results-section" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div key={activeTab} className="tab-slide-enter">
          
          {activeTab === 'packages' && (
            <>
              <SelfDrivePage
                packageFilterDuration={packageFilterDuration}
                setPackageFilterDuration={setPackageFilterDuration}
                handleOpenBooking={handleOpenBooking}
                onViewDetails={(item) => handleOpenDetails(item, 'package')}
                packages={packages.filter(p => p.package_type !== 'Self Drive Package').length > 0
                  ? packages.filter(p => p.package_type !== 'Self Drive Package')
                  : packages}
                searchQuery={dropLoc || searchQuery}
                onClearSearch={() => { setDropLoc(''); setSearchQuery(''); }}
                markups={markups}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
              />
              <DynamicFeaturedHotels
                hotels={hotels}
                onBookHotel={handleOpenHotelBooking}
                onViewHotel={(hotel) => handleOpenDetails(hotel, 'hotel')}
                onBook={handleOpenHotelBooking}
                onViewDetails={(hotel) => handleOpenDetails(hotel, 'hotel')}
              />
              <DynamicFeaturedVehicles
                cars={cars}
                bikes={bikes}
                onBookVehicle={handleOpenBooking}
                onViewVehicle={(veh) => handleOpenDetails(veh, 'vehicle')}
                onBook={handleOpenBooking}
                onViewDetails={(veh) => handleOpenDetails(veh, 'vehicle')}
              />
              <FeaturesGrid />
            </>
          )}

          {activeTab === 'selfdrive' && (
            <>
              {/* Primary Showcase: 3-Category Self Drive Layout (Two Wheelers, Four Wheelers, Luxury Cars) */}
              <SelfDriveCategoryShowcase
                cars={cars}
                bikes={bikes}
                onBookVehicle={handleOpenBooking}
                onViewVehicle={(veh) => handleOpenDetails(veh, 'vehicle')}
                setActiveTab={handleTabChange}
                searchQuery={dropLoc || searchQuery}
              />

              {/* Self Drive Tour Itineraries & Bundles */}
              <SelfDrivePage
                packageFilterDuration={packageFilterDuration}
                setPackageFilterDuration={setPackageFilterDuration}
                handleOpenBooking={handleOpenBooking}
                onViewDetails={(item) => handleOpenDetails(item, 'package')}
                packages={packages.filter(p => p.package_type === 'Self Drive Package').length > 0
                  ? packages.filter(p => p.package_type === 'Self Drive Package')
                  : packages}
                searchQuery={dropLoc || searchQuery}
                onClearSearch={() => { setDropLoc(''); setSearchQuery(''); }}
                markups={markups}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
              />
              <FeaturesGrid />
            </>
          )}

          {activeTab === 'craftmytrip' && (
            <CraftMyTripPage
              allCars={cars}
              allBikes={bikes}
              allHotels={hotels}
              pickupDate={pickupDate}
              dropDate={dropDate}
              bookings={bookings}
              onBack={() => setActiveTab('selfdrive')}
            />
          )}

          {activeTab === 'cars' && (
            <CarsPage
              carFilterFuel={carFilterFuel}
              setCarFilterFuel={setCarFilterFuel}
              carFilterTrans={carFilterTrans}
              setCarFilterTrans={setCarFilterTrans}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'vehicle')}
              cars={cars}
              pickupDate={pickupDate}
              dropDate={dropDate}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              markups={markups}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          )}

          {activeTab === 'bikes' && (
            <BikesPage
              bikeFilterType={bikeFilterType}
              setBikeFilterType={setBikeFilterType}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'vehicle')}
              bikes={bikes}
              pickupDate={pickupDate}
              dropDate={dropDate}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              markups={markups}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          )}

          {activeTab === 'custom-trip' && (
            <CustomTripEnquiryPage setActiveTab={setActiveTab} currentUser={currentUser} />
          )}

          {activeTab === 'customize' && (
            <PackageCustomizationPage 
              pkg={selectedBookingItem}
              allCars={cars}
              allBikes={bikes}
              pickupDate={pickupDate}
              dropDate={dropDate}
              bookings={bookings}
              onBack={() => {
                if (selectedBookingItem?.package_type === 'Self Drive Package') {
                  setActiveTab('selfdrive');
                } else {
                  setActiveTab('packages');
                }
                setSelectedBookingItem(null);
              }}
              onConfirmBooking={(createdRecord) => {
                api.fetchBookings().then(fresh => {
                  if (Array.isArray(fresh) && fresh.length > 0) setBookingsList(fresh);
                }).catch(console.error);
              }}
            />
          )}

          {activeTab === 'hotels' && (
            <HotelsPage
              hotelFilterStars={hotelFilterStars}
              setHotelFilterStars={setHotelFilterStars}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'hotel')}
              hotels={hotels}
              searchQuery={searchQuery}
              searchTriggered={searchTriggered}
              setSearchTriggered={setSearchTriggered}
              pickupLoc={pickupLoc || dropLoc || 'Goa'}
              pickupDate={pickupDate}
              dropDate={dropDate}
              hotelAdults={hotelAdults}
              hotelPriceRange={hotelPriceRange}
              setHotelPriceRange={setHotelPriceRange}
              markups={markups}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
            />
          )}

          {activeTab === 'hotel-details' && selectedDetailItem && (
            <HotelDetailsPage
              hotel={selectedDetailItem}
              onBack={() => {
                setSelectedDetailItem(null);
                setActiveTab('hotels');
              }}
              onBook={handleOpenBooking}
            />
          )}

          {activeTab === 'vehicle-details' && selectedDetailItem && (
            <VehicleDetailsPage
              vehicle={selectedDetailItem}
              type={selectedDetailItem.seating ? 'car' : 'bike'}
              onBack={() => {
                setSelectedDetailItem(null);
                setActiveTab(selectedDetailItem.seating ? 'cars' : 'bikes');
              }}
              onBook={handleOpenBooking}
            />
          )}

          {activeTab === 'package-details' && selectedDetailItem && (
            <PackageDetailsPage
              pkg={selectedDetailItem}
              onBack={() => {
                setSelectedDetailItem(null);
                setActiveTab(selectedDetailItem.package_type === 'Self Drive Package' ? 'selfdrive' : 'packages');
              }}
              onBook={handleOpenBooking}
            />
          )}

          {activeTab === 'flights' && (
            <FlightsPage
              searchQuery={searchQuery}
              searchTriggered={searchTriggered}
              setSearchTriggered={setSearchTriggered}
              pickupLoc={pickupLoc}
              dropLoc={dropLoc}
              pickupDate={pickupDate}
              flightAdults={flightAdults}
              flightChildren={flightChildren}
              flightInfants={flightInfants}
              flightClass={flightClass}
              onSelectFlight={handleOpenBooking}
              markups={markups}
            />
          )}

          {activeTab === 'flight-booking' && selectedFlightOffer && (
            <FlightBookingFlow 
              offer={selectedFlightOffer} 
              onBack={() => {
                setSelectedFlightOffer(null);
                setActiveTab('flights');
              }}
              onComplete={() => {}}
            />
          )}

          {activeTab === 'explore' && (
            <ExplorePage 
              destinations={destinations} 
              onSelectDestination={(dest) => { 
                setDropLoc(dest.name); 
                setActiveTab('packages'); 
              }} 
            />
          )}

          {activeTab === 'ai-planner' && (
            <AIPlannerPage onNavigate={(t) => setActiveTab(t)} />
          )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer setActiveTab={handleTabChange} />

      {/* Booking Checkout Modal */}
      {activeTab !== 'customize' && selectedBookingItem && (
        (String(selectedBookingItem?.id).startsWith('hotel-') || selectedBookingItem.property_type || selectedBookingItem.stars) ? (
          <HotelBookingModal
            selectedBookingItem={selectedBookingItem}
            setSelectedBookingItem={setSelectedBookingItem}
            pickupDate={pickupDate}
            dropDate={dropDate}
            bookingDays={bookingDays}
          />
        ) : (
          <BookingModal
            selectedBookingItem={selectedBookingItem}
            setSelectedBookingItem={setSelectedBookingItem}
            showSuccess={showSuccess}
            userName={userName}
            setUserName={setUserName}
            userPhone={userPhone}
            setUserPhone={setUserPhone}
            userLicense={userLicense}
            setUserLicense={setUserLicense}
            pickupLoc={pickupLoc}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            dropDate={dropDate}
            dropTime={dropTime}
            bookingDays={bookingDays}
            handleConfirmBooking={handleConfirmBooking}
            lastConfirmedBooking={lastConfirmedBooking}
            allPackages={packages}
            allCars={cars}
            allBikes={bikes}
          />
        )
      )}

      {/* Package Details Interactive Modal */}
      <PackageDetailsModal
        pkg={selectedPackageModal}
        isOpen={Boolean(selectedPackageModal)}
        onClose={() => setSelectedPackageModal(null)}
        onBook={(pkg) => {
          setSelectedPackageModal(null);
          handleOpenBooking(pkg, false);
        }}
      />

      {/* Role-Based Authentication Sign-In Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      {/* Floating AI Chatbot & Widgets */}
      {activeTab !== 'portal' && <WhatsAppWidget />}
      <AIChatbot />
      <PopupRenderer popups={liveConfig?.popups || []} onAction={() => {}} />
    </div>
  );
}
