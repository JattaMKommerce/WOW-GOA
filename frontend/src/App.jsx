import React, { useState, useEffect } from 'react';
import './App.css';
import { useSiteConfig } from './context/SiteConfigContext';

// Import Shared Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CustomTripEnquiryPage from './pages/customer/CustomTripEnquiryPage';
import SearchWidget from './components/SearchWidget';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import BookingModal from './components/BookingModal';
import HotelBookingModal from './components/HotelBookingModal';
import PackageDetailsModal from './components/PackageDetailsModal';
import DynamicFeaturedHotels from './components/widgets/DynamicFeaturedHotels';
import DynamicFeaturedVehicles from './components/widgets/DynamicFeaturedVehicles';
import DynamicPopularPackages from './components/widgets/DynamicPopularPackages';
import FeaturesGrid from './components/widgets/FeaturesGrid';
import {
  FlightBookingFlow,
  AdminPortalPage,
  VendorPortalPage,
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
  FlightVendorPortalPage,
  HotelVendorPortalPage,
  CustomerDashboard
} from './pages';
import AIChatbot from './components/AIChatbot';
import WhatsAppWidget from './components/WhatsAppWidget';
import WebsiteRenderer from './components/website/WebsiteRenderer';
import PopupRenderer from './components/website/PopupRenderer';

// Import API Service & Icons
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
  // Navigation & Tabs state
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? 'portal' : 'packages';
    } catch (e) {
      return 'packages';
    }
  });
  
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
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout Modal state
  const [selectedBookingItem, setSelectedBookingItem] = useState(null);
  const [selectedPackageModal, setSelectedPackageModal] = useState(null);
  
  // Detail Modal state
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
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [bookingDays, setBookingDays] = useState(2);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userLicense, setUserLicense] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // ==========================================
  // USERS & ROLE-BASED AUTH STATES
  // ==========================================
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usersList, setUsersList] = useState(defaultUsers);

  // ==========================================
  // DATABASE-DRIVEN DATA STATES (WITH DEFAULT INVENTORY)
  // ==========================================
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

  // ==========================================
  // LOAD ALL DATA FROM BACKEND ON MOUNT
  // ==========================================
  useEffect(() => {
    let safetyTimer = setTimeout(() => {
      setDataLoaded(true);
    }, 1500);

    async function loadAllData() {
      // Check for unique tenant URL and persist it
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
        else setHotels(defaultHotels);

        if (Array.isArray(destinationsData)) setDestinations(destinationsData);
        else setDestinations(defaultDestinations);

        if (Array.isArray(packagesData)) setPackages(packagesData);
        else setPackages(defaultPackages);

        if (Array.isArray(vendorsData)) setVendors(vendorsData);
        else setVendors(defaultVendors);

        if (Array.isArray(usersData)) setUsersList(usersData);
        else setUsersList(defaultUsers);

        if (Array.isArray(carsData)) setCars(carsData);
        else setCars(defaultCars);

        if (Array.isArray(bikesData)) setBikes(bikesData);
        else setBikes(defaultBikes);

        if (Array.isArray(bookingsData)) setBookingsList(bookingsData);
        else setBookingsList(defaultBookings);

        if (flightsData) setFlights(flightsData);
        if (markupsData) setMarkups(markupsData);
      } catch (err) {
        console.warn("Using default verified inventory data:", err);
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
    window.addEventListener('new-booking-created', handleNewBooking);
    return () => window.removeEventListener('new-booking-created', handleNewBooking);
  }, []);

  // ==========================================
  // AUTH HANDLERS (Database-driven)
  // ==========================================
  const handleLogin = async (identifier, password) => {
    try {
      const user = await api.loginUser(identifier, password);
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Multi-tenancy: set tenant_id based on role
      let tenantId = 'admin';
      if (user.role === 'superadmin') {
        tenantId = 'superadmin';
      } else if (user.role === 'admin') {
        tenantId = user.username; // Admin is the tenant owner
      } else {
        tenantId = user.admin_id || 'admin'; // Vendors/Customers belong to an admin
      }
      localStorage.setItem('tenant_id', tenantId);
      
      if (user.role === 'admin') window.location.href = '/admin';
      else if (user.role === 'superadmin') window.location.href = '/superadmin';
      else if (user.role === 'vendor') window.location.href = '/vendor';
      else if (user.role === 'flight_vendor') window.location.href = '/flight-vendor';
      else if (user.role === 'hotel_vendor') window.location.href = '/hotel-vendor';
      else window.location.href = '/';
      
      return true;
    } catch (err) {
      console.error("Login failed:", err.message);
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const handleAddUser = async (newUser) => {
    try {
      await api.registerUser({
        username: newUser.username,
        email: newUser.email,
        password: newUser.password || 'Password123',
        role: newUser.role,
        billing_price: newUser.billingPrice
      });
      // Refresh users list from DB
      const freshUsers = await api.fetchUsers();
      setUsersList(freshUsers);
    } catch (err) {
      console.error("Failed to register user:", err.message);
    }
  };

  const handleUpdateUser = async (user) => {
    try {
      await api.updateUser(user);
      const freshUsers = await api.fetchUsers();
      setUsersList(freshUsers);
    } catch (err) {
      console.error("Failed to update user:", err.message);
      throw err;
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.deleteUser(userId);
      const freshUsers = await api.fetchUsers();
      setUsersList(freshUsers);
    } catch (err) {
      console.error("Failed to delete user:", err.message);
      throw err;
    }
  };

  // ==========================================
  // VENDOR & LISTING HANDLERS (Database-driven)
  // ==========================================
  const handleAddVendor = async (newVendor) => {
    try {
      await api.addVendor(newVendor);
      const freshVendors = await api.fetchVendors();
      setVendors(freshVendors);
    } catch (err) {
      console.error("Failed to add vendor:", err.message);
    }
  };

  const handleUpdateVendor = async (vendorData) => {
    try {
      await api.updateVendor(vendorData);
      const freshVendors = await api.fetchVendors();
      setVendors(freshVendors);
    } catch (err) {
      console.error("Failed to update vendor:", err.message);
    }
  };

  const handleDeleteVendor = async (id) => {
    try {
      await api.deleteVendor(id);
      const freshVendors = await api.fetchVendors();
      setVendors(freshVendors);
      alert("Vendor deleted successfully!");
    } catch (err) {
      console.error("Failed to delete vendor:", err.message);
      alert("Failed to delete vendor: " + err.message);
    }
  };

  const handleSetVendorPassword = async (id, password) => {
    try {
      await api.setVendorPassword(id, password);
      // We don't strictly need to refresh vendors here since password isn't displayed, but we can alert success in the UI.
    } catch (err) {
      console.error("Failed to set vendor password:", err.message);
      throw err;
    }
  };

  const handleAddCar = async (newCar) => {
    try {
      await api.addVehicle({
        type: 'car',
        id: newCar.id,
        vendorId: newCar.vendorId,
        name: newCar.name,
        category: newCar.category,
        price: newCar.price,
        seating: newCar.seating,
        fuel: newCar.fuel,
        transmission: newCar.transmission,
        image: newCar.image,
        images: newCar.images,
        images_json: newCar.images_json || (newCar.images ? JSON.stringify(newCar.images) : (newCar.mediaList ? JSON.stringify(newCar.mediaList.map(m => m.url || m)) : null)),
        mediaList: newCar.mediaList,
        documents: newCar.documents,
        location: newCar.location,
        mileage: newCar.mileage
      });
      // Refresh cars from DB
      const freshCars = await api.fetchCars();
      setCars(freshCars);
    } catch (err) {
      console.error("Failed to add car:", err.message);
      throw err;
    }
  };

  const handleAddBike = async (newBike) => {
    try {
      await api.addVehicle({
        type: 'bike',
        id: newBike.id,
        vendorId: newBike.vendorId,
        name: newBike.name,
        category: newBike.category,
        price: newBike.price,
        engine: newBike.engine,
        fuel: newBike.fuel,
        mileage: newBike.mileage,
        image: newBike.image,
        images: newBike.images,
        images_json: newBike.images_json || (newBike.images ? JSON.stringify(newBike.images) : (newBike.mediaList ? JSON.stringify(newBike.mediaList.map(m => m.url || m)) : null)),
        mediaList: newBike.mediaList,
        documents: newBike.documents,
        location: newBike.location
      });
      const freshBikes = await api.fetchBikes();
      setBikes(freshBikes);
    } catch (err) {
      console.error("Failed to add bike:", err.message);
      throw err;
    }
  };

  const handleUpdateCar = async (updatedCar) => {
    try {
      await api.updateVehicle({ action: 'update_vehicle', type: 'car', ...updatedCar });
      const freshCars = await api.fetchCars();
      setCars(freshCars);
    } catch (err) {
      console.error("Failed to update car:", err.message);
      throw err;
    }
  };

  const handleDeleteCar = async (carId) => {
    try {
      await api.deleteVehicle(carId, 'car');
      setCars(cars.filter(c => c.id !== carId));
    } catch (err) {
      console.error("Failed to delete car:", err.message);
      throw err;
    }
  };

  const handleUpdateBike = async (updatedBike) => {
    try {
      await api.updateVehicle({ action: 'update_vehicle', type: 'bike', ...updatedBike });
      const freshBikes = await api.fetchBikes();
      setBikes(freshBikes);
    } catch (err) {
      console.error("Failed to update bike:", err.message);
      throw err;
    }
  };

  const handleDeleteBike = async (bikeId) => {
    try {
      await api.deleteVehicle(bikeId, 'bike');
      setBikes(bikes.filter(b => b.id !== bikeId));
    } catch (err) {
      console.error("Failed to delete bike:", err.message);
      throw err;
    }
  };

  const handleAddPackage = async (newPkg) => {
    try {
      await api.addPackage(newPkg);
      const freshPackages = await api.fetchPackages();
      setPackages(freshPackages);
    } catch (err) {
      console.error("Failed to add package:", err.message);
    }
  };

  const handleUpdatePackage = async (pkg) => {
    try {
      await api.updatePackage(pkg);
      const freshPackages = await api.fetchPackages();
      setPackages(freshPackages);
    } catch (err) {
      console.error("Failed to update package:", err.message);
      throw err;
    }
  };

  const handleDeletePackage = async (pkgId) => {
    try {
      await api.deletePackage(pkgId);
      const freshPackages = await api.fetchPackages();
      setPackages(freshPackages);
    } catch (err) {
      console.error("Failed to delete package:", err.message);
      throw err;
    }
  };

  const handleAddHotel = async (hotelData) => {
    try {
      await api.addMasterHotel(hotelData);
      const freshHotels = await api.fetchHotels();
      setHotels(freshHotels);
    } catch (err) {
      console.error("Failed to add hotel:", err.message);
      throw err;
    }
  };

  const handleUpdateHotel = async (hotelData) => {
    try {
      await api.updateHotel(hotelData);
      const freshHotels = await api.fetchHotels();
      setHotels(freshHotels);
    } catch (err) {
      console.error("Failed to update hotel:", err.message);
      throw err;
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    try {
      await api.deleteHotel(hotelId);
      const freshHotels = await api.fetchHotels();
      setHotels(freshHotels);
    } catch (err) {
      console.error("Failed to delete hotel:", err.message);
      throw err;
    }
  };

  const handleAddFlight = async (flightData) => {
    try {
      await api.createFlight(flightData);
      const freshFlights = await api.fetchFlights();
      setFlights(freshFlights);
    } catch (err) {
      console.error("Failed to add flight:", err.message);
      throw err;
    }
  };

  const handleUpdateFlight = async (flightData) => {
    try {
      await api.updateFlight(flightData);
      const freshFlights = await api.fetchFlights();
      setFlights(freshFlights);
    } catch (err) {
      console.error("Failed to update flight:", err.message);
      throw err;
    }
  };

  const handleDeleteFlight = async (flightId) => {
    try {
      await api.deleteFlight(flightId);
      const freshFlights = await api.fetchFlights();
      setFlights(freshFlights);
    } catch (err) {
      console.error("Failed to delete flight:", err.message);
      throw err;
    }
  };




  const handleSaveMarkup = async (markupData) => {
    try {
      await api.saveMarkup(markupData);
      const freshMarkups = await api.fetchMarkups();
      setMarkups(freshMarkups);
    } catch (err) {
      console.error("Failed to save markup:", err.message);
      throw err;
    }
  };

  // ==========================================
  // BOOKING HANDLERS
  // ==========================================
  const calculateDays = (start, end) => {
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = Math.abs(eDate - sDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const handleOpenBooking = (item, withFlight = false) => {
    if (!item) return;
    setShowSuccess(false);

    // If logged in, prefill user details if not yet entered
    if (currentUser) {
      if (!userName && (currentUser.name || currentUser.username)) {
        setUserName(currentUser.name || currentUser.username);
      }
      if (!userPhone && currentUser.phone) {
        setUserPhone(currentUser.phone);
      }
    }

    // Determine item type
    let finalItem = { ...item };

    // Robust type detection for cars, bikes, flights, hotels, and packages
    const isCar = String(item?.id).startsWith('car-') || item.type === 'car' || item.vehicle_type === 'car' || 
                  item.category === 'Hatchback' || item.category === 'SUV' || item.category === 'Sedan' || 
                  item.category === 'Luxury SUV' || item.category === 'MUV / 7-Seater' || item.seating || Boolean(item.transmission);

    const isBike = String(item?.id).startsWith('bike-') || item.type === 'bike' || item.vehicle_type === 'bike' || 
                   item.category === 'Scooter' || item.category === 'Cruiser' || item.category === 'Sports' || 
                   item.category === 'Adventure' || item.engine || item.mileage;

    const isFlight = String(item?.id).startsWith('FL-') || String(item?.id).startsWith('fl-') || String(item?.id).startsWith('flt-') || 
                     item.type === 'flight' || Boolean(item.airline) || Boolean(item.flight_number);

    const isOffer = String(item?.id).startsWith('off_');
    const isHotel = String(item?.id).startsWith('hotel-') || String(item?.id).startsWith('HTL-') || item.property_type || item.stars;

    if (!isCar && !isBike && !isFlight && !isHotel && !isOffer) {
       // Package
       finalItem.isCustomized = false;
       finalItem.selectedWithFlight = withFlight;
       setActiveTab('customize');
       setSelectedBookingItem(finalItem);
    } else {
       // Direct car/bike/hotel/flight
       finalItem.isCustomized = false;
       setSelectedBookingItem(finalItem);
    }
  };

  const handleConfirmBooking = async (e, paymentMethod = null, overrides = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userName || !userPhone) {
      alert("Please fill in your name and contact details to complete the booking.");
      return;
    }

    const actualPickupDate = overrides.pickupDate || pickupDate || new Date().toISOString().slice(0, 10);
    const actualDropDate = overrides.dropDate || dropDate || new Date().toISOString().slice(0, 10);
    const actualPickupTime = overrides.pickupTime || pickupTime || '10:00 AM';
    const actualDropTime = overrides.dropTime || dropTime || '10:00 AM';
    const actualPickupLoc = overrides.pickupLoc || pickupLoc || 'Goa Airport';
    const actualDays = Number(overrides.bookingDays || bookingDays || 1);

    let finalAmountPaid = 0;
    let finalTotalAmount = 0;
    
    if (overrides.total) {
        finalTotalAmount = Number(overrides.total);
        finalAmountPaid = finalTotalAmount;
    } else if (selectedBookingItem.package_type && selectedBookingItem.traveller_details) {
        const serverPriceData = selectedBookingItem.price_breakdown || {};
        finalTotalAmount = serverPriceData.total_price || Number(selectedBookingItem.price || 0);
        finalAmountPaid = selectedBookingItem.payment_mode === 'advance' ? (serverPriceData.advance_amount || finalTotalAmount) : finalTotalAmount;
    } else {
        const itemPrice = Number(selectedBookingItem.price || 0);
        finalTotalAmount = Math.round((itemPrice * actualDays) * 1.18) + 250;
        finalAmountPaid = finalTotalAmount;
    }

    try {
      await api.createBooking({
        name: userName,
        phone: userPhone,
        license: userLicense,
        pickup_loc: actualPickupLoc,
        pickup_date: actualPickupDate,
        pickup_time: actualPickupTime,
        drop_date: actualDropDate,
        drop_time: actualDropTime,
        item_id: selectedBookingItem.id,
        item_name: selectedBookingItem.name,
        booking_days: actualDays,
        total_paid: finalAmountPaid,
        total_amount: finalTotalAmount,
        amount_paid: finalAmountPaid,
        remaining_amount: finalTotalAmount - finalAmountPaid,
        status: 'Confirmed',
        payment_status: finalAmountPaid < finalTotalAmount ? 'Partial' : 'Full',
        traveller_details_json: selectedBookingItem.traveller_details || null,
        price_breakdown_json: selectedBookingItem.price_breakdown || null,
        customizations: selectedBookingItem.customizations || null,
        payment_method: paymentMethod || 'Direct',
        payment_proof: null
      });
      
      setShowSuccess(true);
      // Refresh bookings after successful booking
      const newBookings = await api.fetchBookings();
      if (newBookings && newBookings.length > 0) {
        setBookingsList(newBookings);
      }
    } catch (err) {
      console.error("Failed to save booking:", err.message);
      setShowSuccess(true);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const todayStr = getTodayDateStr();

    if (activeTab === 'hotels' || activeTab === 'packages' || activeTab === 'craftmytrip') {
      const val = validateBookingDates(pickupDate, dropDate, { allowSameDay: false });
      if (!val.valid) {
        alert(val.error);
        return;
      }
    } else if (activeTab === 'selfdrive') {
      const val = validateBookingDates(pickupDate, dropDate, { allowSameDay: true });
      if (!val.valid) {
        alert(val.error);
        return;
      }
    } else if (activeTab === 'flights') {
      if (!pickupDate || pickupDate < todayStr) {
        alert("Flight departure date cannot be in the past.");
        return;
      }
    }

    console.log('[TripGalileo Search Submit]', {
      activeTab,
      pickupLoc,
      dropLoc,
      pickupDate,
      dropDate,
      hotelRooms,
      hotelAdults,
      hotelChildren,
      hotelPriceRange,
      flightAdults,
      flightChildren,
      flightInfants,
      flightClass,
      appliedFilters
    });
    setSearchTriggered(true);
    // Smooth scroll down to result anchor
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (!dataLoaded) {
    return (
      <div className="d-flex w-100 vh-100 align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold text-dark font-heading tracking-wider">Starting WOW GOA Platform...</h4>
          <p className="text-muted small">Loading packages and fleet data</p>
        </div>
      </div>
    );
  }

  const path = window.location.pathname;

  if (path === '/admin' || path.startsWith('/admin/')) {
    const adminTab = 
      path === '/admin/leads' ? 'leads' :
      path === '/admin/custom-enquiries' ? 'enquiries' :
      path === '/admin/customers' ? 'customers' :
      path === '/admin/add-users' ? 'add_users' :
      path === '/admin/bookings' ? 'bookings' :
      path === '/admin/hotels' ? 'admin_hotels' :
      path === '/admin/vehicles' ? 'admin_vehicles' :
      null;

    return (
      <>
        <AdminPortalPage
          initialTab={adminTab}
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

  if (path === '/vendor') {
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

  // --- Dynamic Route Matching ---
  const dynamicPage = Object.values(liveConfig?.pages || {}).find(p => p.slug === path);

  if (path === '/superadmin') {
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

  if (path === '/customer') {
    return (
      <>
        <CustomerDashboard
          currentUser={currentUser}
          triggerOpenLogin={() => setShowLoginModal(true)}
          bookings={bookings}
          hotels={hotels}
          cars={cars}
          bikes={bikes}
          onLogout={handleLogout}
        />
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      </>
    );
  }

  if (path === '/flight-vendor') {
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

  if (path === '/hotel-vendor') {
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

  const handleTabChange = (newTab) => {
    let normalizedTab = newTab;
    if (normalizedTab === 'self drive') normalizedTab = 'selfdrive';
    if (normalizedTab === 'trip packages') normalizedTab = 'packages';

    if (activeTab === 'customize' && normalizedTab !== 'customize') {
      setSelectedBookingItem(null);
    }
    setActiveTab(normalizedTab);
    
    // Ensure navbar links and tab changes trigger the respective page views, except for home
    if (normalizedTab === 'home' || normalizedTab === 'packages' || normalizedTab === 'cars') {
      // If we are navigating to home, we should set searchTriggered to false
      setSearchTriggered(false);
    } else {
      setSearchTriggered(true);
    }
  };

  // --- Builder Action Handler ---
  const handleBuilderAction = (action, data) => {
    if (!action) return;
    
    switch (action) {
      // Navigation
      case 'internal':
        if (data?.url) {
          if (data.url.startsWith('/')) {
            window.history.pushState({}, '', data.url);
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else {
            setActiveTab(data.url);
          }
        }
        break;
      case 'external':
        if (data?.url) window.open(data.url, data.newTab ? '_blank' : '_self');
        break;
      case 'scroll-to-search':
        document.getElementById('search-widget')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'scroll-to-section':
        if (data?.url) {
          const id = data.url.replace('#', '');
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      
      // Search Pages
      case 'hotel-search':
        if (data?.dest) setDropLoc(data.dest);
        setSearchTriggered(true);
        setActiveTab('hotels');
        break;
      case 'vehicle-search':
        if (data?.pickup) setPickupLoc(data.pickup);
        if (data?.pdate) setPickupDate(data.pdate);
        if (data?.ddate) setDropDate(data.ddate);
        setSearchTriggered(true);
        setActiveTab('cars');
        break;
      case 'package-search':
        if (data?.dest) setDropLoc(data.dest);
        setSearchTriggered(true);
        setActiveTab('packages');
        break;
      case 'flight-search':
        setSearchTriggered(true);
        setActiveTab('flights');
        break;
      
      // Details & Booking
      case 'hotel-details':
      case 'vehicle-details':
      case 'package-details':
      case 'book-now':
        if (data?.item) {
          handleOpenBooking(data.item);
        } else {
          // If no specific item, open search or generic modal
          setActiveTab('selfdrive');
        }
        break;
      
      // Portals
      case 'customer-dashboard': window.location.href = '/customer'; break;
      case 'vendor-login': window.location.href = '/vendor'; break;
      case 'admin-login': window.location.href = '/admin'; break;
      case 'customer-login': setShowLoginModal(true); break;
      
      // Static pages (routed via tabs)
      case 'contact': setActiveTab('contact'); break;
      case 'about': setActiveTab('about'); break;
      case 'faq': setActiveTab('faq'); break;
      case 'blog': setActiveTab('blog'); break;
      case 'privacy': setActiveTab('privacy'); break;
      case 'terms': setActiveTab('terms'); break;
      
      // Interaction
      case 'open-popup':
        // Popups will be handled globally by a PopupRenderer, but we can set active popup id
        if (data?.popupId) {
          window.dispatchEvent(new CustomEvent('open-builder-popup', { detail: data.popupId }));
        }
        break;
      case 'whatsapp':
        if (data?.phone) window.open(`https://wa.me/${data.phone}`, '_blank');
        break;
      case 'phone':
        if (data?.phone) window.location.href = `tel:${data.phone}`;
        break;
      case 'email':
        if (data?.email) window.location.href = `mailto:${data.email}`;
        break;
      case 'download':
        if (data?.fileUrl) {
          const a = document.createElement('a');
          a.href = data.fileUrl;
          a.download = data.url || 'download';
          a.click();
        }
        break;
      case 'dynamic-url':
        if (data?.url) window.location.href = data.url;
        break;
      default:
        console.warn('Unknown action:', action, data);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Premium Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        currentUser={currentUser}
        triggerOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Dynamic Layout Engine */}
      {!searchTriggered ? (
        <>
          <Hero setActiveTab={setActiveTab} />
          <SearchWidget 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
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
          <main>
            <DynamicPopularPackages packages={packages} onBook={handleOpenBooking} onViewDetails={(item) => handleOpenDetails(item, 'package')} />
            <DynamicFeaturedHotels hotels={hotels} onBook={handleOpenBooking} onViewDetails={(item) => handleOpenDetails(item, 'hotel')} />
            <DynamicFeaturedVehicles cars={cars} bikes={bikes} onBook={handleOpenBooking} />
            <FeaturesGrid />
          </main>
        </>
      ) : (
        <>
          <SearchWidget 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
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
          <main className="py-5" id="results-section">
            <div className="container">

          
          {activeTab === 'packages' && (
            <SelfDrivePage
              packageFilterDuration={packageFilterDuration}
              setPackageFilterDuration={setPackageFilterDuration}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'package')}
              packages={packages.filter(p => p.package_type === 'Trip Package' || p.package_type === 'FIT Package' || p.package_type === 'GIT Package').length > 0
                ? packages.filter(p => p.package_type === 'Trip Package' || p.package_type === 'FIT Package' || p.package_type === 'GIT Package')
                : packages}
              searchQuery={dropLoc || searchQuery}
              onClearSearch={() => { setDropLoc(''); setSearchQuery(''); }}
              markups={markups}
            />
          )}

          {activeTab === 'selfdrive' && (
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
            />
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
              searchQuery={searchQuery}
              markups={markups}
            />
          )}

          {activeTab === 'bikes' && (
            <BikesPage
              bikeFilterType={bikeFilterType}
              setBikeFilterType={setBikeFilterType}
              handleOpenBooking={handleOpenBooking}
              onViewDetails={(item) => handleOpenDetails(item, 'vehicle')}
              bikes={bikes}
              searchQuery={searchQuery}
              markups={markups}
            />
          )}

          {activeTab === 'custom-trip' && (
            <CustomTripEnquiryPage setActiveTab={setActiveTab} />
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
              onConfirmBooking={(pkg, customizations, totalPrice) => {
                const customizedPkg = {
                  ...pkg,
                  price: totalPrice,
                  customizations: JSON.stringify(customizations)
                };
                
                // Prefill user details from traveller details if available
                if (pkg.traveller_details) {
                    const lead = pkg.traveller_details.list[0];
                    setUserName(lead ? `${lead.firstName} ${lead.lastName}` : '');
                    setUserPhone(pkg.traveller_details.contactPhone || '');
                }

                setBookingDays(calculateDays(pickupDate, dropDate));
                setSelectedBookingItem(customizedPkg);
                setShowSuccess(false);
                setActiveTab('packages'); // Go back to original tab but BookingModal will popup
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
               onComplete={(data) => {
                 // Optionally route to a confirmation page here
               }}
             />
          )}

        </div>
      </main>
      </>
      )}

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

      {/* Floating AI Chatbot Widget */}
      {activeTab !== 'portal' && <WhatsAppWidget />}
      <AIChatbot />
      <PopupRenderer popups={liveConfig?.popups || []} onAction={handleBuilderAction} />
    </div>
  );
}
