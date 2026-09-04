selectedBookingItem={selectedBookingItem}
552:       // 2. Persist deletion to backend database
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
const [appliedFilters, setAppliedFilters] = us
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
// 1. Optimistic local state update
setPackages(prev => prev.map(p => (p.id === pkg.id ? { ...p, ...pkg } : p)));
519:       // 2. Persist to backend database
const res = await api.updatePackage(pkg);
const updatedPkg = res.package || pkg;
523:       // 3. Re-fetch fresh list from backend
const freshPackages = await api.fetchPackages();
if (Array.isArray(freshPackages) && freshPackages.length > 0) {
setPackages(freshPackages);
}
529:       // 4. Dispatch event and broadcast cross-tab
window.dispatchEvent(new CustomEvent('tripPackagesUpdated', { detail: freshPackages || updatedPkg }));
try {
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
const ch = new BroadcastChannel('tripgalileo_packages_sync');
ch.postMessage({ type: 'PACKAGES_CHANGED' });
ch.close();
}
await api.deletePackage(pkgId);
555:       // 3. Re-fetch fresh list from backend
const freshPackages = await api.fetchPackages();
setPackages(Array.isArray(freshPackages) ? freshPackages : []);
559:       // 4. Dispatch event and broadcast cross-tab
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
<p className="text-muted small">Loading packages and
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
<truncated 9559 bytes>
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
<LoginModal
isOpen={showLoginModal}
onClose={() => setShowLoginModal(false)}
onLogin={handleLogin}
/>
1489:       {/* Floating AI Chatbot Widget */}
{activeTab !== 'portal' && <WhatsAppWidget />}
<AIChatbot />
<PopupRenderer popups={liveConfig?.popups || []} onAction={handleBuilderAction} />
</div>
);
}
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.