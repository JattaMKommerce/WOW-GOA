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
else setBookingsList(defaultBookings);
203:         if (flightsData) setFlights(flightsData);
if (markupsData) setMarkups(markupsData);
} catch (err) {
console.warn("Using default verified inventory data:", err);
} finally {
clearTimeout(safetyTimer);
setDataLoaded(true);
}
}
loadAllData();
214:     const handleNewBooking = (e) => {
if (e.detail) {
setBookingsList(prev => [e.detail, ...prev.filter(b => String(b.id) !== String(e.detail.id))]);
}
};
window.addEventListener('new-booking-created', handleNewBooking);
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
}, []);
223:   // ==========================================
// AUTH HANDLERS (Database-driven)
// ==========================================
const handleLogin = async (identifier, password) => {
try {
const user = await api.loginUser(identifier, password);
setCurrentUser(user);
localStorage.setItem('currentUser', JSON.stringify(user));
}
};
403:   const handleUpdateCar = async (updatedCar) => {
try {
await api.updateVehicle({ action: 'update_vehicle', type: 'car', ...updatedCar });
const freshCars = await api.fetchCars();
setCars(freshCars);
} catch (err) {
console.error("Failed to update car:", err.message);
throw err;
}
};
414:   const handleDeleteCar = async (carId) => {
try {
await api.deleteVehicle(carId, 'car');
setCars(cars.filter(c => c.id !== carId));
} catch (err) {
console.error("Failed to delete car:", err.message);
throw err;
}
};
424:   const handleUpdateBike = async (updatedBike) => {
try {
await api.updateVehicle({ action: 'update_vehicle', type: 'bike', ...updatedBike });
const freshBikes = await api.fetchBikes();
setBikes(freshBikes);
} catch (err) {
console.error("Failed to update bike:", err.message);
throw err;
}
};
435:   const handleDeleteBike = async (bikeId) => {
try {
await api.deleteVehicle(bikeId, 'bike');
setBikes(bikes.filter(b => b.id !== bikeId));
} catch (err) {
console.error("Failed to delete bike:", err.message);
throw err;
}
};
445:   const handleAddPackage = async (newPkg) => {
try {
await api.addPackage(newPkg);
const freshPackages = await api.fetchPackages();
setPackages(freshPackages);
} catch (err) {
console.error("Failed to add package:", err.message);
}
};
455:   const handleUpdatePackage = async (pkg) => {
try {
await api.updatePackage(pkg);
const freshPackages = await api.fetchPackages();
setPackages(freshPackages);
} catch (err) {
console.error("Failed to update package:", err.message);
throw err;
}
};
466:   const handleDeletePackage = async (pkgId) => {
try {
await api.deletePackage(pkgId);
const freshPackages = await api.fetchPackages();
setPackages(freshPackages);
} catch (err) {
console.error("Failed to delete package:", err.message);
throw err;
}
} catch (err) {
console.error("Failed to delete bike:", err.message);
throw err;
}
};
481:   const handleAddPackage = async (newPkg) => {
setHotels(freshHotels);
try {
await api.addPackage(newPkg);
const freshPackages = await api.fetchPackages();
setPackages(freshPackages);
} catch (err) {
console.error("Failed to add package:", err.message);
}
};
491:   const handleUpdatePackage = async (pkg) => {
const freshHotels = await api.fetchHotels();
try {
await api.updatePackage(pkg);
const freshPackages = await api.fetchPackages();
setPackages(freshPackages);
} catch (err) {
console.error("Failed to update package:", err.message);
throw err;
}
const ch = new BroadcastChannel('tripgalileo_packages_sync');
ch.postMessage({ type: 'PACKAGES_CHANGED' });
ch.close();
}
} catch (e) {}
return savedPkg;
} catch (err) {
console.error("Failed to add package:", err.message);
const rollback = await api.fetchPackages();
setPackages(rollback);
throw err;
}
};
514:   const handleUpdatePackage = async (pkg) => {
try {
try {
// 1. Optimistic local state update
setPackages(prev => prev.map(p => (p.id === pkg.id ? { ...p, ...pkg } : p)));
519:       // 2. Persist to backend database
console.error("Failed to add hotel:", err.message);
const res = await api.updatePackage(pkg);
const updatedPkg = res.package || pkg;
523:       // 3. Re-fetch fresh list from backend
await api.updateFlight(flightData);
const freshPackages = await api.fetchPackages();
if (Array.isArray(freshPackages) && freshPackages.length > 0) {
setPackages(freshPackages);
}
529:       // 4. Dispatch event and broadcast cross-tab
}
window.dispatchEvent(new CustomEvent('tripPackagesUpdated', { detail: freshPackages || updatedPkg }));
try {
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
const ch = new BroadcastChannel('tripgalileo_packages_sync');
ch.postMessage({ type: 'PACKAGES_CHANGED' });
ch.close();
}
} catch (e) {}
return updatedPkg;
} catch (err) {
console.error("Failed to update package:", err.message);
const rollback = await api.fetchPackages();
setPackages(rollback);
throw err;
}
};
547:   const handleDeletePackage = async (pkgId) => {
try {
try {
// 1. Optimistic local state update
setPackages(prev => prev.filter(p => p.id !== pkgId));
552:       // 2. Persist deletion to backend database
console.error("Failed to save markup:", err.message);
await api.deletePackage(pkgId);
555:       // 3. Re-fetch fresh list from backend
};
const freshPackages = await api.fetchPackages();
setPackages(Array.isArray(freshPackages) ? freshPackages : []);
559:       // 4. Dispatch event and broadcast cross-tab
// ==========================================
window.dispatchEvent(new CustomEvent('tripPackagesUpdated', { detail: freshPackages }));
try {
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
const ch = new BroadcastChannel('tripgalileo_packages_sync');
ch.postMessage({ type: 'PACKAGES_CHANGED' });
ch.close();
}
} catch (e) {}
} catch (err) {
console.error("Failed to delete package:", err.message);
const rollback = await api.fetchPackages();
setPackages(rollback);
throw err;
}
};
576:   const handleAddHotel = async (hotelData) => {
setUserName(currentUser.name || currentUser.username);
try {
await api.addMasterHotel(hotelData);
const freshHotels = await api.fetchHotels();
setHotels(freshHotels);
} catch (err) {
console.error("Failed to add hotel:", err.message);
throw err;
}
};
587:   const handleUpdateHotel = async (hotelData) => {
const isCar = String(item?.id).startsWith('car-') || item.type === 'car' || item.vehicle_type === 'car' || 
try {
await api.updateHotel(hotelData);
const freshHotels = await api.fetchHotels();
setHotels(freshHotels);
} catch (err) {
console.error("Failed to update hotel:", err.message);
throw err;
}
};
598:   const handleDeleteHotel = async (hotelId) => {
try {
await api.deleteHotel(hotelId);
const sDate = new Date(start);
const eDate = new Date(end);
const diffTime = Math.abs(eDate - sDate);
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
return diffDays > 0 ? diffDays : 1;
};
667:   const handleOpenBooking = (item, withFlight = false) => {
if (!item) return;
setShowSuccess(false);
setSearchTriggered(true);
672:     // If logged in, prefill user details if not yet entered
if (currentUser) {
if (!userName && (currentUser.name || currentUser.username)) {
setUserName(currentUser.name || currentUser.username);
}
if (!userPhone && currentUser.phone) {
setUserPhone(currentUser.phone);
}
}
682:     // Determine item type
let finalItem = { ...item };
685:     // Robust type detection for cars, bikes, flights, hotels, and packages
const isCar = String(item?.id).startsWith('car-') || item.type === 'car' || item.vehicle_type === 'car' || 
item.category === 'Hatchback' || item.category === 'SUV' || item.category === 'Sedan' || 
item.category === 'Luxury SUV' || item.category === 'MUV / 7-Seater' || item.seating || Boolean(item.transmission);
690:     const isBike = String(item?.id).startsWith('bike-') || item.type === 'bike' || item.vehicle_type === 'bike' || 
item.category === 'Scooter' || item.category === 'Cruiser' || item.category === 'Sports' || 
item.category === 'Adventure' || item.engine || item.mileage;
694:     const isFlight = String(item?.id).startsWith('FL-') || String(item?.id).startsWith('fl-') || String(item?.id).startsWith('flt-') || 
item.type === 'flight' || Boolean(item.airline) || Boolean(item.flight_number);
697:     const isOffer = String(item?.id).startsWith('off_');
const isHotel = String(item?.id).startsWith('hotel-') || String(item?.id).startsWith('HTL-') || item.property_type || item.stars;
700:     if (!isCar && !isBike && !isFlight && !isHotel && !isOffer) {
// Package
finalItem.isCustomized = false;
finalItem.selectedWithFlight = withFlight;
setSelectedBookingItem(finalItem);
setActiveTab('customize');
window.scrollTo({ top: 0, behavior: 'smooth' });
} else {
// Direct car/bike/hotel/flight
finalItem.isCustomized = false;
setSelectedBookingItem(finalItem);
}
};
714:   const handleConfirmBooking = async (e, paymentMethod = null, overrides = {}) => {
if (e && e.preventDefault) e.preventDefault();
if (!userName || !userPhone) {
alert("Please fill in your name and contact details to complete the booking.");
return;
}
721:     const actualPickupDate = overrides.pickupDate || pickupDate || new Date().toISOString().slice(0, 10);
const actualDropDate = overrides.dropDate || dropDate || new Date().toISOString().slice(0, 10);
const actualPickupTime = overrides.pickupTime || pickupTime || '10:00 AM';
const actualDropTime = overrides.dropTime || dropTime || '10:00 AM';
const actualPickupLoc = overrides.pickupLoc || pickupLoc || 'Goa Airport';
const actualDays = Number(overrides.bookingDays || bookingDays || 1);
728:     let finalAmountPaid = 0;
let finalTotalAmount = 0;
731:     if (overrides.total) {
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
744:     try {
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
770:       setShowSuccess(true);
onAddPackage={handleAddPackage}
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
782:   const handleSearchSubmit = (e) => {
onUpdateFlight={handleUpdateFlight}
if (e && e.preventDefault) e.preventDefault();
const todayStr = getTodayDateStr();
786:     if (activeTab === 'hotels' || activeTab === 'packages' || activeTab === 'craftmytrip') {
onUpdateHotel={handleUpdateHotel}
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
811:     console.log('[TripGalileo Search Submit]', {
onDeleteCar={handleDeleteCar}
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
834:   if (!dataLoaded) {
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
848:   const path = window.location.pathname;
850:   if (path === '/admin' || path.startsWith('/admin/')) {
const adminTab = 
path === '/admin/leads' ? 'leads' :
path === '/admin/custom-enquiries' ? 'enquiries' :
path === '/admin/customers' ? 'customers' :
path === '/admin/add-users' ? 'add_users' :
path === '/admin/bookings' ? 'bookings' :
path === '/admin/hotels' ? 'admin_hotels' :
path === '/admin/vehicles' ? 'admin_vehicles' :
null;
861:     return (
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
903:   if (path === '/vendor') {
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
927:   // --- Dynamic Route Matching ---
const dynamicPage = Object.values(liveConfig?.pages || {}).find(p => p.slug === path);
930:   if (path === '/superadmin') {
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
1238:           
onViewDetails={(item) => handleOpenDetails(item, 'package')}
{activeTab === 'packages' && (
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
/>
)}
1254:           {activeTab === 'selfdrive' && (
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
1269:           {activeTab === 'craftmytrip' && (
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
1281:           {activeTab === 'cars' && (
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
/>
)}
1298:           {activeTab === 'bikes' && (
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
/>
)}
1313:           {activeTab === 'custom-trip' && (
pkg={selectedBookingItem}
<CustomTripEnquiryPage setActiveTab={setActiveTab} currentUser={currentUser} />
)}
1317:           {activeTab === 'customize' && (
dropDate={dropDate}
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
onConfirmBooking={(createdRecord, customizations, totalPrice) => {
// Refresh bookings list so Admin & Customer dashboards have the new booking immediately
api.fetchBookings().then(fresh => {
if (Array.isArray(fresh) && fresh.length > 0) {
setBookingsList(fresh);
}
}).catch(console.error);
}}
/>
)}
1344:           {activeTab === 'hotels' && (
setActiveTab('packages'); // Go back to original tab but BookingModal will popup
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
1364:           {activeTab === 'hotel-details' && selectedDetailItem && (
setHotelPriceRange={setHotelPriceRange}
<HotelDetailsPage
hotel={selectedDetailItem}
onBack={() => {
setSelectedDetailItem(null);
setActiveTab('hotels');
}}
onBook={handleOpenBooking}
/>
)}
1375:           {activeTab === 'vehicle-details' && selectedDetailItem && (
}}
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
1387:           {activeTab === 'package-details' && selectedDetailItem && (
}}
<PackageDetailsPage
pkg={selectedDetailItem}
onBack={() => {
setSelectedDetailItem(null);
setActiveTab(selectedDetailItem.package_type === 'Self Drive Package' ? 'selfdrive' : 'packages');
}}
onBook={handleOpenBooking}
/>
)}
1398:           {activeTab === 'flights' && (
}}
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
1415:           {activeTab === 'flight-booking' && selectedFlightOffer && (
onSelectFlight={handleOpenBooking}
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
1428:         </div>
</main>
</>
)}
1433:       {/* Footer */}
<Footer setActiveTab={handleTabChange} />
1436:       {/* Booking Checkout Modal */}
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
1471:       {/* Package Details Interactive Modal */}
allBikes={bikes}
<PackageDetailsModal
pkg={selectedPackageModal}
isOpen={Boolean(selectedPackageModal)}
onClose={() => setSelectedPackageModal(null)}
onBook={(pkg) => {
setSelectedPackageModal(null);
handleOpenBooking(pkg, false);
}}
/>
1482:       {/* Role-Based Authentication Sign-In Modal */}
setSelectedPackageModal(null);
<LoginModal
isOpen={showLoginModal}
onClose={() => setShowLoginModal(false)}
onLogin={handleLogin}
/>
1489:       {/* Floating AI Chatbot Widget */}
isOpen={showLoginModal}
{activeTab !== 'portal' && <WhatsAppWidget />}
<AIChatbot />
<PopupRenderer popups={liveConfig?.popups || []} onAction={handleBuilderAction} />
</div>
);
}
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
<PopupRenderer popups={liveConfig?.popups || []} onAction={handleBuilderAction} />
</div>
);
}
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.