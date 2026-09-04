import React, { useState, useEffect } from 'react';
import './App.css';
import { useSiteConfig } from './context/SiteConfigContext';
5: // Import Shared Components
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
45: // Import API Service & Icons
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
60: export default function App() {
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
72:   // Search Widget form fields
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
86:   // Flight Specific State
const [flightAdults, setFlightAdults] = useState(1);
const [flightChildren, setFlightChildren] = useState(0);
const [flightInfants, setFlightInfants] = useState(0);
const [flightClass, setFlightClass] = useState('economy');
92:   // Filters state
const [appliedFilters, setAppliedFilters] = useState({});
const [hotelFilterStars, setHotelFilterStars] = useState('All');
const [packageFilterDuration, setPackageFilterDuration] = useState('All');
const [searchQuery, setSearchQuery] = useState('');
98:   // Checkout Modal state
const [selectedBookingItem, setSelectedBookingItem] = useState(null);
const [selectedPackageModal, setSelectedPackageModal] = useState(null);
102:   // Detail Modal state
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
121:   // ==========================================
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
135:   // ==========================================
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
149:   // ==========================================
// LOAD ALL DATA FROM BACKEND ON MOUNT
// ==========================================
useEffect(() => {
let safetyTimer = setTimeout(() => {
setDataLoaded(true);
}, 1500);
157:     async function loadAllData() {
// Check for unique tenant URL and persist it
const urlParams = new URLSearchParams(window.location.search);
const urlTenant = urlParams.get('tenant');
if (urlTenant) {
localStorage.setItem('tenant_id', urlTenant);
}
165:       try {
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
179:         if (Array.isArray(hotelsData)) setHotels(hotelsData);
else setHotels(defaultHotels);
182:         if (Array.isArray(destinationsData)) setDestinations(destinationsData);
else setDestinations(defaultDestinations);
185:         if (Array.isArray(packagesData)) setPackages(packagesData);
else setPackages(defaultPackages);
188:         if (Array.isArray(vendorsData)) setVendors(vendorsData);
else setVendors(defaultVendors);
191:         if (Array.isArray(usersData)) setUsersList(usersData);
else setUsersList(defaultUsers);
194:         if (Array.isArray(carsData)) setCars(carsData);
else setCars(defaultCars);
197:         if (Array.isArray(bikesData)) setBikes(bikesData);
else setBikes(defaultBikes);
200:         if (Array.isArray(bookingsData)) setBookingsList(bookingsData);