import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plane, Car, Hotel, MapPin, X, Info, Tag, ExternalLink, CheckCircle, Sparkles, Clock } from 'lucide-react';
import * as api from '../../services/api';
import PackageCheckoutStep2 from './PackageCheckoutStep2';
import PackageCheckoutStep3 from './PackageCheckoutStep3';

export default function PackageCustomizationPage({
  pkg,
  allCars,
  allBikes,
  onBack,
  onConfirmBooking,
  pickupDate,
  dropDate,
  bookings = []
}) {
  const isSelfDrivePackage = pkg?.package_type === 'Self Drive Package';
  const [cabType, setCabType] = useState(isSelfDrivePackage ? 'self-drive' : 'company');
  const [selectedSelfDriveVehicle, setSelectedSelfDriveVehicle] = useState(null);
  const [withFlight, setWithFlight] = useState(pkg?.selectedWithFlight || false);
  
  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState('');
  const [vehicleGuests, setVehicleGuests] = useState(1);
  const [selectedSightseeing, setSelectedSightseeing] = useState(null); // For Sightseeing Modal
  const [airportTransit, setAirportTransit] = useState(false);
  
  // Sightseeing Customization State
  const [sightseeingPrefs, setSightseeingPrefs] = useState({});

  // Dynamic Coupons & Add-ons
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponInput, setCouponInput] = useState('');
  
  const [availableAddOns, setAvailableAddOns] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState({}); // { [dayIndex]: [addonId1, addonId2] }
  const [showAddOnModalForDay, setShowAddOnModalForDay] = useState(null); // day index
  const [addOnModalTab, setAddOnModalTab] = useState('Activity'); // Activity | Transfer | Meal
  
  // Hotel Swapping State
  const [masterHotels, setMasterHotels] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState({}); // { [dayIndex]: hotelObject }
  const [showHotelModalForDay, setShowHotelModalForDay] = useState(null);

  // Transfer Swapping State
  const [masterCars, setMasterCars] = useState([]);
  const [selectedTransfers, setSelectedTransfers] = useState({}); // { [dayIndex]: carObject }
  const [showTransferModalForDay, setShowTransferModalForDay] = useState(null);

  const [totalPrice, setTotalPrice] = useState(pkg?.price || 0);

  // Booking Flow State
  const [currentStep, setCurrentStep] = useState(1); // 1 = Customize, 2 = Travellers, 3 = Review & Pay
  
  // Traveller Details State
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);
  const [travellers, setTravellers] = useState([{ type: 'Adult', firstName: '', lastName: '', gender: '', age: '', idType: 'Aadhaar' }, { type: 'Adult', firstName: '', lastName: '', gender: '', age: '', idType: 'Aadhaar' }]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Self-Drive Extra Details State
  const [drivingLicense, setDrivingLicense] = useState('');
  const [vehiclePickupLoc, setVehiclePickupLoc] = useState('');
  const [vehicleDropLoc, setVehicleDropLoc] = useState('');

  // Payment Options State
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'advance'
  const [serverPriceData, setServerPriceData] = useState(null);

  // Vehicle Filtering Logic
  const availableCars = allCars.filter(c => Number(c.is_available) !== 0);
  const availableBikes = allBikes.filter(b => Number(b.is_available) !== 0);
  const allAvailableVehicles = [...availableCars, ...availableBikes];
  
  const isDateOverlap = (start1, end1, start2, end2) => {
    if (!start1 || !end1 || !start2 || !end2) return false;
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    return s1 <= e2 && s2 <= e1;
  };

  const bookedVehicleIds = bookings
    .filter(b => isDateOverlap(b.pickup_date, b.drop_date, pickupDate, dropDate))
    .map(b => {
      let vid = null;
      if (b.item_id && (b.item_id.startsWith('car-') || b.item_id.startsWith('bike-'))) {
        vid = b.item_id;
      } else if (b.customizations) {
        try {
          const cust = JSON.parse(b.customizations);
          if (cust.selectedSelfDriveVehicle) vid = cust.selectedSelfDriveVehicle;
        } catch (e) {}
      }
      return vid;
    }).filter(id => id !== null);
  
  const filteredVehicles = allAvailableVehicles.filter(veh => {
    let match = true;
    if (bookedVehicleIds.includes(veh.id)) match = false;
    if (vehicleLocation && veh.location && veh.location.toLowerCase() !== vehicleLocation.toLowerCase()) match = false;
    if (vehicleGuests > 1) {
      if (veh.seating) {
        const seats = parseInt(veh.seating, 10);
        if (!isNaN(seats) && seats < vehicleGuests) match = false;
      } else {
        if (vehicleGuests > 2) match = false;
      }
    }
    return match;
  });

  // Default select vehicle if list is available
  useEffect(() => {
    if (cabType === 'self-drive' && !selectedSelfDriveVehicle && filteredVehicles.length > 0) {
      setSelectedSelfDriveVehicle(filteredVehicles[0]);
    }
  }, [cabType, filteredVehicles, selectedSelfDriveVehicle]);

  // Itinerary Parsing
  let parsedItinerary = [];
  try {
    if (pkg?.day_wise_itinerary) {
      parsedItinerary = typeof pkg.day_wise_itinerary === 'string' ? JSON.parse(pkg.day_wise_itinerary) : pkg.day_wise_itinerary;
    }
  } catch (e) {
    console.error("Error parsing itinerary JSON", e);
  }

  // Initialize Sightseeing Preferences
  useEffect(() => {
    if (parsedItinerary.length > 0 && Object.keys(sightseeingPrefs).length === 0) {
      const initialPrefs = {};
      parsedItinerary.forEach((day, idx) => {
        const locs = day.sightseeing_locations || (day.location ? [{name: day.location, tips: day.tips}] : []);
        initialPrefs[idx] = {
          included: true,
          locations: locs.map(l => l.name).filter(Boolean)
        };
      });
      setSightseeingPrefs(initialPrefs);
    }
  }, [parsedItinerary]);

  const toggleDaySightseeing = (dayIdx, included) => {
    setSightseeingPrefs(prev => ({
      ...prev,
      [dayIdx]: { ...prev[dayIdx], included }
    }));
  };

  const toggleSightseeingLocation = (dayIdx, locName) => {
    setSightseeingPrefs(prev => {
      const current = prev[dayIdx]?.locations || [];
      const newLocs = current.includes(locName) 
        ? current.filter(l => l !== locName)
        : [...current, locName];
      return { ...prev, [dayIdx]: { ...prev[dayIdx], locations: newLocs } };
    });
  };

  const numHotels = parsedItinerary.filter(d => d.hotel).length;
  const numActivities = parsedItinerary.length * 2; // Rough estimate
  const numMeals = parsedItinerary.filter(d => d.meals).length;

  // Timeline Scroll Logic
  const handleScrollToDay = (dayNum) => {
    document.getElementById(`day-${dayNum}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Fetch Coupons, AddOns, Hotels, Cars
  useEffect(() => {
    api.getCoupons().then(res => setAvailableCoupons(res.filter(c => c.is_active)));
    
    let parsedAddons = [];
    try {
      if (pkg?.package_addons_json) {
        parsedAddons = typeof pkg.package_addons_json === 'string' ? JSON.parse(pkg.package_addons_json) : pkg.package_addons_json;
      }
    } catch(e) {}
    setAvailableAddOns(parsedAddons || []);

    api.fetchHotels().then(res => setMasterHotels(res));
    api.fetchCars().then(res => setMasterCars(res));
  }, [pkg]);

  const handleApplyCoupon = () => {
    const coupon = availableCoupons.find(c => c.code === couponInput.toUpperCase());
    if (coupon) setAppliedCoupon(coupon);
    else alert('Invalid Coupon Code');
  };

  // Pricing
  useEffect(() => {
    if (!pkg) return;
    let price = withFlight ? (Number(pkg.price_with_flight) || Number(pkg.price)) : Number(pkg.price);
    if (cabType === 'company') {
      if (isSelfDrivePackage) price += Number(pkg.company_cab_price) || 0;
    } else if (cabType === 'self-drive' && selectedSelfDriveVehicle) {
      price += Number(selectedSelfDriveVehicle.price);
    } else if (cabType === 'none' && !isSelfDrivePackage) {
      price -= Number(pkg.company_cab_price) || 0;
    }

    if (airportTransit) {
      price += Number(pkg.pickup_drop_price) || 0;
    }

    // Add selected add-ons price
    Object.values(selectedAddOns).forEach(addonIds => {
      addonIds.forEach(id => {
        const addon = availableAddOns.find(a => a.id === id);
        if (addon) price += Number(addon.price);
      });
    });

    // Add Hotel Swapping price differences (assuming default hotel is 0 baseline for now)
    Object.values(selectedHotels).forEach(hotel => {
      price += Number(hotel.price);
    });

    // Add Transfer Swapping price differences
    Object.values(selectedTransfers).forEach(car => {
      price += Number(car.price);
    });

    // Sightseeing Exclusions Discount
    let sightseeingDiscount = 0;
    (parsedItinerary || []).forEach((day, idx) => {
      const prefs = sightseeingPrefs[idx];
      if (prefs?.included === false) {
        sightseeingDiscount += 1500; // Rs 1500 discount for fully dropping a day's sightseeing
      } else {
        const totalLocs = (day.sightseeing_locations || (day.location ? [{name: day.location}] : [])).length;
        const selectedLocs = prefs?.locations?.length ?? totalLocs;
        if (selectedLocs < totalLocs) {
          sightseeingDiscount += (totalLocs - selectedLocs) * 300; // Rs 300 discount per dropped location
        }
      }
    });
    price -= sightseeingDiscount;

    // Apply Coupon
    if (appliedCoupon) {
      price -= Number(appliedCoupon.discount_value);
    }

    setTotalPrice(Math.max(0, price));
  }, [cabType, selectedSelfDriveVehicle, airportTransit, pkg, selectedAddOns, appliedCoupon, availableAddOns, withFlight, sightseeingPrefs, selectedHotels, selectedTransfers]);

  const customizations = {
    withFlight: withFlight,
    cabType,
    selectedSelfDriveVehicle: selectedSelfDriveVehicle ? selectedSelfDriveVehicle.id : null,
    airportTransit,
    sightseeingPrefs,
    selectedAddOns,
    selectedHotels,
    selectedTransfers,
    appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
    drivingLicense,
    vehiclePickupLoc,
    vehicleDropLoc
  };

  const handleProceedToTravellers = () => {
    setCurrentStep(2);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleProceedToReview = async () => {
    // Validate Traveller form
    for (let i = 0; i < travellers.length; i++) {
        const t = travellers[i];
        if (!t.firstName || !t.lastName || !t.age) {
            alert('Please fill all mandatory traveller details (First Name, Last Name, Age).');
            return;
        }
    }
    if (!contactEmail || !contactPhone) {
        alert('Please provide contact details.');
        return;
    }
    
    if (cabType === 'self-drive') {
        if (!drivingLicense) {
            alert('Please upload your Driving License image.');
            return;
        }
        if (!vehiclePickupLoc || !vehicleDropLoc) {
            alert('Please select vehicle pickup and drop locations.');
            return;
        }
    }

    try {
        // Skip server calculation since endpoint doesn't exist yet, use our reliable local calculation
        const priceRes = {
            base_price: pkg.price,
            total_price: totalPrice,
            breakdown: customizations
        };
        setServerPriceData(priceRes);
        setCurrentStep(3);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } catch (err) {
        alert("Failed to calculate price on server. Please try again.");
    }
  };

  const handleCheckout = () => {
    // Final booking triggered after Review
    if (!serverPriceData) return;
    
    // We pass the new payload shape to onConfirmBooking
    const bookingPayload = {
      ...pkg,
      traveller_details: { adults: numAdults, children: numChildren, list: travellers, contactEmail, contactPhone },
      price_breakdown: serverPriceData,
      payment_mode: paymentMode
    };
    
    onConfirmBooking(bookingPayload, customizations, serverPriceData.total_price);
  };

  if (!pkg) return null;

  if (currentStep === 2) {
    return (
      <PackageCheckoutStep2 
          pkg={pkg} 
          isSelfDrivePackage={cabType === 'self-drive'}
          travellers={travellers} 
          setTravellers={setTravellers} 
          numAdults={numAdults} 
          setNumAdults={setNumAdults} 
          numChildren={numChildren} 
          setNumChildren={setNumChildren}
          contactEmail={contactEmail}
          setContactEmail={setContactEmail}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          drivingLicense={drivingLicense}
          setDrivingLicense={setDrivingLicense}
          vehiclePickupLoc={vehiclePickupLoc}
          setVehiclePickupLoc={setVehiclePickupLoc}
          vehicleDropLoc={vehicleDropLoc}
          setVehicleDropLoc={setVehicleDropLoc}
          onBack={() => setCurrentStep(1)}
          onProceed={() => setCurrentStep(3)}
      />
    );
  }

  if (currentStep === 3) {
      return (
          <PackageCheckoutStep3 
              pkg={pkg} 
              serverPriceData={serverPriceData} 
              paymentMode={paymentMode} 
              setPaymentMode={setPaymentMode} 
              onBack={() => setCurrentStep(2)} 
              onCheckout={handleCheckout} 
          />
      );
  }

  return (
    <div className="container py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <button onClick={onBack} className="btn btn-link text-dark text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 fw-bold">
        <ArrowLeft size={18} /> Back
      </button>

      {/* Package Header */}
      <div className="mb-4">
        <h2 className="fw-extrabold text-dark mb-2">{pkg.name}</h2>
        <div className="d-flex gap-3 text-muted small fw-bold">
          <span className="border rounded px-2 py-1 bg-light text-dark"><Plane size={14} className="me-1"/> {withFlight ? 'With Flight' : 'Without Flight'}</span>
          <span className="border rounded px-2 py-1 bg-light text-dark">{Math.max(1, parsedItinerary.length - 1)}N/{parsedItinerary.length}D</span>
          {parsedItinerary.map((d, i) => (
             <span key={i}>{i+1}N {d.location || 'Location'} {i < parsedItinerary.length-1 && '•'}</span>
          ))}
        </div>
      </div>



      <div className="row g-4 text-start">
        {/* Left Column: Itinerary Details */}
        <div className="col-lg-8">
          
          {/* Top Tabs (MMT Style) */}
          <div className="bg-light rounded-top border d-flex justify-content-between p-3 align-items-center">
            <div className="d-flex gap-4">
              <div className="text-center">
                <span className="d-block fw-bold text-primary px-3 py-1 bg-white border rounded-pill">{parsedItinerary.length} DAY PLAN</span>
              </div>
              <div className="text-center text-muted small fw-bold d-flex flex-column justify-content-center">
                 <span>{parsedItinerary.length} TRANSFERS</span>
              </div>
              <div className="text-center text-muted small fw-bold d-flex flex-column justify-content-center">
                 <span>{numHotels} HOTELS</span>
              </div>
              <div className="text-center text-muted small fw-bold d-flex flex-column justify-content-center">
                 <span>{numActivities} ACTIVITIES</span>
              </div>
              <div className="text-center text-muted small fw-bold d-flex flex-column justify-content-center">
                 <span>{numMeals} MEALS</span>
              </div>
            </div>
          </div>

          {/* Master Toggles: Flight and Cab */}
          <div className="bg-white border border-top-0 p-4 pb-3">
            <h5 className="fw-bold mb-3">Trip Options</h5>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="fw-bold small text-muted mb-2 d-block">Flight Options</label>
                <div className="d-flex gap-2">
                  <div className={`flex-grow-1 p-2 border rounded cursor-pointer text-center ${!withFlight ? 'border-primary bg-primary bg-opacity-10' : ''}`} onClick={() => setWithFlight(false)}>
                    <Plane size={20} className={`mb-1 ${!withFlight ? 'text-primary' : 'text-muted'}`} />
                    <div className="small fw-bold">Without Flight</div>
                  </div>
                  <div className={`flex-grow-1 p-2 border rounded cursor-pointer text-center ${withFlight ? 'border-primary bg-primary bg-opacity-10' : ''}`} onClick={() => setWithFlight(true)}>
                    <Plane size={20} className={`mb-1 ${withFlight ? 'text-primary' : 'text-muted'}`} />
                    <div className="small fw-bold">With Flight</div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <label className="fw-bold small text-muted mb-2 d-block">Transportation (Cab)</label>
                <div className="d-flex gap-2">
                  {(!isSelfDrivePackage || Number(pkg.is_cab_customizable) === 1) && (
                    <div className={`flex-grow-1 p-2 border rounded cursor-pointer text-center ${cabType === 'company' ? 'border-primary bg-primary bg-opacity-10' : ''}`} onClick={() => setCabType(cabType === 'company' ? 'none' : 'company')}>
                      <Car size={20} className={`mb-1 ${cabType === 'company' ? 'text-primary' : 'text-muted'}`} />
                      <div className="small fw-bold">Company Cab</div>
                    </div>
                  )}
                  {isSelfDrivePackage && (
                    <div className={`flex-grow-1 p-2 border rounded cursor-pointer text-center ${cabType === 'self-drive' ? 'border-primary bg-primary bg-opacity-10' : ''}`} onClick={() => {
                      if (cabType === 'self-drive') {
                        setCabType(Number(pkg.is_cab_customizable) === 1 ? 'company' : 'none');
                        setSelectedSelfDriveVehicle(null);
                      } else {
                        setCabType('self-drive');
                      }
                    }}>
                      <Car size={20} className={`mb-1 ${cabType === 'self-drive' ? 'text-primary' : 'text-muted'}`} />
                      <div className="small fw-bold">Self-Drive</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {cabType === 'self-drive' && (
               <div className="mt-2 border-top pt-3">
                 <label className="fw-bold small text-muted mb-2 d-block">Select Self-Drive Vehicle</label>
                 {filteredVehicles.length === 0 ? (
                    <p className="text-danger small">No self-drive vehicles available.</p>
                 ) : (
                    <div className="d-flex gap-2 overflow-auto pb-2" style={{ whiteSpace: 'nowrap' }}>
                      {filteredVehicles.map(veh => (
                        <div key={veh.id} className={`p-2 border rounded cursor-pointer d-inline-block ${selectedSelfDriveVehicle?.id === veh.id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : ''}`} style={{ minWidth: '200px' }} onClick={() => setSelectedSelfDriveVehicle(veh)}>
                          <div className="d-flex align-items-center gap-2">
                            <img src={veh.image} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} alt={veh.name} />
                            <div>
                              <div className="fw-bold small text-truncate" style={{ maxWidth: '120px' }}>{veh.name}</div>
                              <div className="text-success fw-bold text-xxs">+₹{veh.price}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
            )}
          </div>

          <div className="bg-white border border-top-0 d-flex" style={{ minHeight: '600px' }}>
            {/* Timeline Sidebar */}
            <div className="bg-light border-end" style={{ width: '120px', padding: '20px 0' }}>
              <div className="position-sticky" style={{ top: '20px' }}>
                <div className="text-center mb-3">
                  <span className="fw-bold d-block">Day Plan</span>
                </div>
                <div className="d-flex flex-column position-relative" style={{ paddingLeft: '20px' }}>
                  {parsedItinerary.map((day, idx) => (
                    <div 
                      key={idx} 
                      className="mb-3 cursor-pointer d-flex align-items-center gap-2"
                      onClick={() => handleScrollToDay(day.day)}
                    >
                      <div className="rounded-circle bg-dark" style={{ width: '8px', height: '8px' }}></div>
                      <span className="small fw-bold text-dark">Day {day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Itinerary Blocks Area */}
            <div className="flex-grow-1 p-4">
              {parsedItinerary.map((day, idx) => (
                <div key={idx} id={`day-${day.day}`} className="mb-5">
                  
                  {/* Day Header */}
                  <div className="d-flex align-items-center gap-3 mb-4 bg-light p-2 rounded border">
                    <span className="badge bg-danger rounded-pill px-3 py-2">Day {day.day}</span>
                    <span className="fw-bold text-dark">{day.location || 'Goa'}</span>
                    <span className="text-muted small border-start ps-3">INCLUDED: {day.hotel ? '1 Hotel ' : ''} 1 Transfer 2 Activities {day.meals ? '1 Meal' : ''}</span>
                  </div>

                  {/* Flight Notice Block */}
                  {idx === 0 && withFlight && (
                    <div className="d-flex gap-3 mb-4">
                      <div className="text-muted"><Plane size={24} /></div>
                      <div className="flex-grow-1 pb-3 border-bottom border-light">
                         <h6 className="fw-bold text-dark mb-1">FLIGHT</h6>
                         <span className="d-block small text-dark mb-1">Arrival at Dabolim / Mopa</span>
                         <span className="d-block text-danger small fw-bold">Please Note: Flight schedules are subject to airline confirmation.</span>
                      </div>
                    </div>
                  )}

                  {/* Transfer / Self-Drive Block */}
                  <div className="d-flex gap-3 mb-4">
                    <div className="text-muted"><Car size={24} /></div>
                    <div className="flex-grow-1 pb-3 border-bottom border-light">
                       <div className="d-flex justify-content-between align-items-center mb-2">
                         <h6 className="fw-bold text-dark mb-0 text-uppercase">Transfer <span className="text-muted text-capitalize ms-1">({day.location || 'Goa'})</span></h6>
                         
                         {cabType === 'company' ? (
                           <button onClick={() => setCabType('none')} className="btn btn-link p-0 text-danger fw-bold text-decoration-none small text-uppercase">REMOVE</button>
                         ) : cabType === 'none' && (!isSelfDrivePackage || Number(pkg.is_cab_customizable) === 1) ? (
                           <button onClick={() => setCabType('company')} className="btn btn-link p-0 text-success fw-bold text-decoration-none small text-uppercase">ADD CAB</button>
                         ) : (
                           <button onClick={() => setShowTransferModal(true)} className="btn btn-link p-0 text-primary fw-bold text-decoration-none small text-uppercase">CHANGE</button>
                         )}
                       </div>
                       
                       {cabType === 'self-drive' && selectedSelfDriveVehicle ? (
                         <div className="d-flex gap-3 mt-3 bg-light p-3 rounded border">
                           <img src={selectedSelfDriveVehicle.image} alt="Vehicle" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                           <div>
                             <h6 className="fw-bold mb-1">{selectedSelfDriveVehicle.name} <span className="fw-normal text-muted small">(or Similar)</span></h6>
                             <span className="d-block small text-muted mb-2">Self-Drive / {selectedSelfDriveVehicle.category}</span>
                             <div className="d-flex gap-3 small text-muted flex-wrap mt-1">
                               <span><Car size={14} className="me-1"/> {selectedSelfDriveVehicle.seating || '4'} Seater</span>
                               <span><Info size={14} className="me-1"/> AC</span>
                               {selectedSelfDriveVehicle.fuel && <span>⛽ {selectedSelfDriveVehicle.fuel}</span>}
                               {selectedSelfDriveVehicle.transmission && <span>⚙️ {selectedSelfDriveVehicle.transmission}</span>}
                               {selectedSelfDriveVehicle.engine && <span>⚡ {selectedSelfDriveVehicle.engine}</span>}
                               {selectedSelfDriveVehicle.mileage && <span>🛣️ {selectedSelfDriveVehicle.mileage}</span>}
                             </div>
                           </div>
                         </div>
                       ) : cabType === 'company' ? (
                         <div className="d-flex gap-3 mt-3 bg-light p-3 rounded border align-items-center">
                           <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><Car size={20}/></div>
                           <div>
                             <h6 className="fw-bold mb-0">Company Standard Transfer</h6>
                             <span className="d-block small text-muted">Private Cab Included</span>
                           </div>
                         </div>
                       ) : (
                         <div className="d-flex gap-3 mt-3 bg-light p-3 rounded border align-items-center opacity-75">
                           <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><X size={20}/></div>
                           <div>
                             <h6 className="fw-bold mb-0 text-danger">No Cab Selected</h6>
                             <span className="d-block small text-muted">You will travel on your own.</span>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>



                  {/* Selected Add-ons for this day */}
                  {(selectedAddOns[idx] || []).length > 0 && (
                    <div className="mb-4 pt-3 border-top border-light">
                      <h6 className="fw-bold text-dark mb-3 text-uppercase" style={{ fontSize: '13px' }}>Added to Itinerary</h6>
                      <div className="d-flex flex-column gap-2">
                        {(selectedAddOns[idx] || []).map(addonId => {
                           const addon = availableAddOns.find(a => a.id === addonId);
                           if (!addon) return null;
                           return (
                             <div key={addonId} className="bg-white border rounded p-2 d-flex gap-3 align-items-center shadow-sm">
                               {addon.image_url ? (
                                 <img src={addon.image_url} alt={addon.title} className="rounded object-fit-cover" style={{ width: '60px', height: '60px' }} />
                               ) : (
                                 <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                                   <Sparkles size={20} className="text-muted" />
                                 </div>
                               )}
                               <div className="flex-grow-1">
                                 <span className="badge bg-primary bg-opacity-10 text-primary mb-1">{addon.type}</span>
                                 <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>{addon.title}</h6>
                                 <span className="text-muted small">{addon.duration}</span>
                               </div>
                               <div className="text-end me-2">
                                 <div className="fw-bold text-success mb-1">+ ₹{addon.price}</div>
                                 <button 
                                   className="btn btn-sm btn-outline-danger py-0 px-2" style={{ fontSize: '12px' }}
                                   onClick={() => {
                                      setSelectedAddOns(prev => ({
                                        ...prev,
                                        [idx]: prev[idx].filter(id => id !== addonId)
                                      }));
                                   }}
                                 >Remove</button>
                               </div>
                             </div>
                           )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Activities Button (MMT Style) */}
                  <div className="mt-4 pt-3 border-top border-light">
                    <button 
                      className="btn w-100 py-3 rounded-3 d-flex flex-column align-items-center justify-content-center hover-shadow transition-all" 
                      style={{ backgroundColor: '#F0F5FA', border: '1px dashed #A0C3E8', color: '#0054A6' }}
                      onClick={() => setShowAddOnModalForDay(idx)}
                    >
                      <div className="bg-white rounded-circle p-2 mb-2 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        <Sparkles size={20} className="text-primary" />
                      </div>
                      <span className="fw-bold mb-1">Add Activities to your day</span>
                      <span className="small opacity-75">Spend the day at leisure or add an activity, transfer or meal</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Checkout */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded position-sticky" style={{ top: '20px' }}>
            <div className="p-4 border-bottom">
              <span className="text-danger small fw-bold d-block text-decoration-line-through mb-1">₹{Math.round(totalPrice * 1.15)}</span>
              <h3 className="fw-extrabold text-dark d-flex align-items-baseline gap-1 mb-1">
                ₹{totalPrice} <span className="small text-muted fw-normal" style={{ fontSize: '14px' }}>/Adult</span>
              </h3>
              <span className="text-muted text-xxs d-block">Excluding applicable taxes</span>
              
              <button 
                className="btn btn-primary w-100 py-3 rounded fw-bold text-white shadow-sm mt-4 text-uppercase tracking-wider"
                onClick={handleProceedToTravellers}
                disabled={isSelfDrivePackage && cabType === 'self-drive' && !selectedSelfDriveVehicle}
              >
                Proceed to Traveller Details
              </button>
            </div>
            
            <div className="p-4 bg-light rounded-bottom">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><Tag size={16} className="text-primary"/> Coupons & Offers</h6>
              
              {!appliedCoupon ? (
                <div className="mb-3">
                  <div className="input-group mb-2 shadow-sm rounded overflow-hidden">
                    <input 
                      type="text" 
                      className="form-control border-0" 
                      placeholder="Enter Coupon Code" 
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value)}
                    />
                    <button className="btn btn-primary px-4 fw-bold" onClick={handleApplyCoupon}>APPLY</button>
                  </div>
                  {availableCoupons.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      {availableCoupons.map(c => (
                        <div key={c.id} className="border border-primary border-opacity-25 bg-white px-3 py-2 rounded cursor-pointer hover-bg-light" onClick={() => setAppliedCoupon(c)}>
                          <span className="fw-bold text-primary d-block mb-1">{c.code}</span>
                          <span className="small text-muted">Save ₹{c.discount_value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-success p-3 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f0fdf4' }}>
                  <div>
                    <span className="fw-bold text-success d-flex align-items-center mb-1">
                      <Tag size={14} className="me-1"/> {appliedCoupon.code}
                    </span>
                    <span className="text-success small d-block">Coupon Applied Successfully</span>
                  </div>
                  <div className="text-end">
                    <span className="text-success fw-bold d-block mb-1"> - ₹{appliedCoupon.discount_value}</span>
                    <button className="btn btn-link p-0 text-danger text-decoration-none small fw-bold" onClick={() => setAppliedCoupon(null)}>REMOVE</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SIGHTSEEING MODAL */}
      {selectedSightseeing && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 overflow-hidden shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Sightseeing in {selectedSightseeing.location || 'Goa'}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedSightseeing(null)}></button>
              </div>
              <div className="modal-body p-4 pt-2">
                <div className="d-flex gap-3 text-muted small fw-bold border-bottom pb-3 mb-3">
                  <span>Day {selectedSightseeing.day}</span>
                  <span>Duration: Flexible</span>
                  <span>Places Covered: {selectedSightseeing.images?.length || 1}</span>
                </div>
                
                {/* Live Google Map iframe */}
                <div className="bg-light rounded mb-4 overflow-hidden position-relative d-flex align-items-center justify-content-center" style={{ height: '250px', border: '1px solid #e2e8f0' }}>
                  {selectedSightseeing.sightseeing_locations && selectedSightseeing.sightseeing_locations.length > 0 ? (
                     <iframe 
                       width="100%" 
                       height="100%" 
                       frameBorder="0" 
                       style={{ border: 0 }} 
                       referrerPolicy="no-referrer-when-downgrade" 
                       src={`https://www.google.com/maps?q=${encodeURIComponent(selectedSightseeing.sightseeing_locations[0].map_query || selectedSightseeing.sightseeing_locations[0].name || selectedSightseeing.location || 'Goa')}&output=embed`}
                       allowFullScreen>
                     </iframe>
                  ) : (
                    <iframe 
                       width="100%" 
                       height="100%" 
                       frameBorder="0" 
                       style={{ border: 0 }} 
                       referrerPolicy="no-referrer-when-downgrade" 
                       src={`https://www.google.com/maps?q=${encodeURIComponent(selectedSightseeing.location || 'Goa')}&output=embed`}
                       allowFullScreen>
                    </iframe>
                  )}
                  <div className="position-absolute top-0 end-0 bg-white px-3 py-1 rounded-bottom-start shadow-sm fw-bold text-primary d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                    <MapPin size={12} className="text-danger" /> LIVE MAP
                  </div>
                </div>

                <div className="d-flex gap-4">
                   <div style={{ width: '250px', flexShrink: 0 }}>
                     <img src={(selectedSightseeing.images && selectedSightseeing.images.length > 0) ? selectedSightseeing.images[0] : 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80'} alt="Sightseeing" className="w-100 rounded object-fit-cover shadow-sm" style={{ height: '180px' }} />
                   </div>
                   <div className="flex-grow-1">
                     <h6 className="fw-bold mb-2">Location 1: {selectedSightseeing.title}</h6>
                     <p className="text-muted small mb-4">{selectedSightseeing.activities}</p>
                     
                     <h6 className="fw-bold mb-2 text-uppercase text-muted" style={{ fontSize: '12px' }}>TIPS & LOCATIONS:</h6>
                     <ul className="text-muted small ps-3">
                       {(selectedSightseeing.sightseeing_locations || (selectedSightseeing.location ? [{name: selectedSightseeing.location, tips: selectedSightseeing.tips}] : [])).map((loc, i) => (
                         <li key={i} className="mb-2">
                           <span className="fw-bold text-dark">{loc.name}</span>
                           {loc.tips && <span className="d-block text-muted">{loc.tips}</span>}
                         </li>
                       ))}
                     </ul>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED TRANSFER CUSTOMIZATION MODAL */}
      {showTransferModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-lg" style={{ backgroundColor: '#F4F7F9', maxHeight: '85vh' }}>
              <div className="modal-header bg-white border-bottom pt-4 px-4 position-relative">
                <div className="w-100">
                  <h4 className="fw-bold mb-1">Customize Transportation</h4>
                  <p className="text-muted small mb-0">Choose how you want to travel during your trip.</p>
                </div>
                <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={() => setShowTransferModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                
                {/* 1. Admin Default Transfer (Company Cab) */}
                {!isSelfDrivePackage && (
                  <div className="mb-4">
                    <h6 className="fw-bold text-uppercase text-secondary mb-3" style={{ fontSize: '12px', letterSpacing: '1px' }}>Included Transfer Option</h6>
                    <div className={`bg-white rounded-4 p-3 d-flex gap-4 align-items-center shadow-sm border ${cabType === 'company' ? 'border-primary border-opacity-50 bg-primary bg-opacity-10' : 'border-white'}`}>
                      <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ width: '120px', height: '80px', flexShrink: 0 }}>
                        <Car size={30} className={cabType === 'company' ? "text-primary" : "text-muted"} />
                      </div>
                      <div className="flex-grow-1 py-1">
                        <h5 className="fw-bold mb-1 text-dark">Company Standard Cab</h5>
                        <p className="text-muted small mb-0">Private chauffeur-driven transfer provided by our company for your entire trip.</p>
                      </div>
                      <div className="text-end pe-2" style={{ minWidth: '120px' }}>
                        {isSelfDrivePackage && (
                          <div className="fw-extrabold text-success mb-2" style={{ fontSize: '18px' }}>+ ₹{pkg.company_cab_price || 0}</div>
                        )}
                        {!isSelfDrivePackage && (
                          <div className="fw-bold text-danger small mb-2">- ₹{pkg.company_cab_price || 0} (if removed)</div>
                        )}
                        {cabType === 'company' ? (
                          <button className="btn btn-outline-danger rounded-pill px-4 py-2 fw-bold w-100" onClick={() => {
                             setCabType('none');
                          }}>REMOVE</button>
                        ) : (
                          <button className="btn btn-primary rounded-pill px-4 py-2 fw-bold w-100" onClick={() => {
                             setCabType('company');
                          }}>SELECT</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Vendor Self-Drive Vehicles */}
                <div>
                  <h6 className="fw-bold text-uppercase text-secondary mb-3" style={{ fontSize: '12px', letterSpacing: '1px' }}>Self-Drive Vehicles (By Vendors)</h6>
                  <div className="row g-3">
                    {filteredVehicles.length === 0 ? (
                      <div className="col-12 text-center py-4 text-muted border rounded bg-white">No self-drive vehicles currently available.</div>
                    ) : (
                      filteredVehicles.map(veh => {
                        const isSelected = cabType === 'self-drive' && selectedSelfDriveVehicle?.id === veh.id;
                        return (
                          <div key={veh.id} className="col-md-6">
                            <div className={`card h-100 cursor-pointer transition-all ${isSelected ? 'border-primary border-2 shadow bg-primary bg-opacity-10' : 'border-white shadow-sm'}`}>
                              <img src={veh.image} className="card-img-top object-fit-cover" style={{ height: '140px' }} alt={veh.name} />
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <h6 className="fw-bold mb-0 text-dark">{veh.name}</h6>
                                    <span className="badge bg-light text-dark border mt-1">{veh.category}</span>
                                  </div>
                                  {isSelected && <span className="badge bg-primary rounded-pill px-2">SELECTED</span>}
                                </div>
                                <div className="d-flex gap-2 text-muted small mt-2">
                                  <span><Car size={13} className="me-1"/>{veh.seating || '4'} Seater</span>
                                  <span>AC</span>
                                </div>
                                <div className="mt-3 border-top pt-3 d-flex justify-content-between align-items-center">
                                   <div className="fw-extrabold text-success fs-5">+₹{veh.price}</div>
                                   {isSelected ? (
                                      <button className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-3" onClick={(e) => {
                                        e.stopPropagation();
                                        setCabType('none');
                                        setSelectedSelfDriveVehicle(null);
                                      }}>REMOVE</button>
                                   ) : (
                                      <button className="btn btn-sm btn-primary fw-bold rounded-pill px-3" onClick={() => {
                                        setCabType('self-drive');
                                        setSelectedSelfDriveVehicle(veh);
                                      }}>SELECT</button>
                                   )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD-ON MODAL (MMT STYLE) */}
      {showAddOnModalForDay !== null && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg" style={{ height: '80vh', backgroundColor: '#F4F7F9' }}>
              
              {/* Modal Header */}
              <div className="modal-header bg-white border-bottom pb-0 pt-4 px-4 position-relative" style={{ zIndex: 10 }}>
                <div className="w-100">
                  <h4 className="fw-bold mb-1">Add Activity, Meal or Transfer</h4>
                  <p className="text-muted small mb-4">Day {showAddOnModalForDay + 1} • {parsedItinerary[showAddOnModalForDay]?.location || 'Goa'}</p>
                  
                  {/* Tabs */}
                  <div className="d-flex gap-4 border-bottom w-100 overflow-auto no-scrollbar">
                    {['Activity', 'Transfer', 'Meal', 'Sightseeing'].map(tab => (
                      <div 
                        key={tab} 
                        className={`pb-3 fw-bold cursor-pointer transition-all flex-shrink-0 ${addOnModalTab === tab ? 'text-primary border-primary' : 'text-muted'}`}
                        style={{ borderBottom: addOnModalTab === tab ? '3px solid' : '3px solid transparent', fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}
                        onClick={() => setAddOnModalTab(tab)}
                      >
                        {tab}{tab === 'Transfer' ? 'S' : tab === 'Meal' ? 'S' : ''}
                      </div>
                    ))}
                  </div>
                </div>
                <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={() => setShowAddOnModalForDay(null)}></button>
              </div>

              {/* Modal Body (List of Add-ons) */}
              <div className="modal-body p-4">
                <div className="d-flex flex-column gap-3">
                  
                  {addOnModalTab === 'Sightseeing' && parsedItinerary[showAddOnModalForDay] ? (
                    <div className="bg-white rounded-4 p-4 shadow-sm border border-light">
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                         <div>
                           <h5 className="fw-bold text-dark mb-1">Daily Sightseeing Bundle</h5>
                           <p className="text-muted small mb-0">Includes private driver for all selected locations below.</p>
                         </div>
                         <div className="form-check form-switch fs-5">
                           <input 
                             className="form-check-input cursor-pointer" 
                             type="checkbox" 
                             checked={sightseeingPrefs[showAddOnModalForDay]?.included !== false} 
                             onChange={(e) => toggleDaySightseeing(showAddOnModalForDay, e.target.checked)} 
                           />
                         </div>
                      </div>
                      
                      {sightseeingPrefs[showAddOnModalForDay]?.included !== false ? (
                        <div>
                          <h6 className="fw-bold text-dark mb-3">Customise Locations:</h6>
                          <div className="d-flex flex-column gap-3">
                            {(parsedItinerary[showAddOnModalForDay].sightseeing_locations || (parsedItinerary[showAddOnModalForDay].location ? [{name: parsedItinerary[showAddOnModalForDay].location, tips: parsedItinerary[showAddOnModalForDay].tips}] : [])).map((loc, lIdx) => {
                              const isChecked = sightseeingPrefs[showAddOnModalForDay]?.locations?.includes(loc.name);
                              return (
                                <div key={lIdx} className={`p-3 rounded border ${isChecked ? 'bg-primary bg-opacity-10 border-primary' : 'bg-light border-light'}`}>
                                  <div className="form-check d-flex align-items-center m-0">
                                    <input 
                                      className="form-check-input cursor-pointer me-3" 
                                      type="checkbox" 
                                      style={{ width: '20px', height: '20px' }}
                                      checked={isChecked} 
                                      onChange={() => toggleSightseeingLocation(showAddOnModalForDay, loc.name)} 
                                      id={`modal-loc-${showAddOnModalForDay}-${lIdx}`}
                                    />
                                    <label className="form-check-label w-100 cursor-pointer d-flex justify-content-between align-items-center" htmlFor={`modal-loc-${showAddOnModalForDay}-${lIdx}`}>
                                      <div>
                                        <span className="fw-bold text-dark d-block">{loc.name || 'Activity'}</span>
                                        {loc.tips && <span className="text-muted small">{loc.tips}</span>}
                                      </div>
                                      {!isChecked && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger ms-2">-₹300 off</span>}
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-2 fs-6 mb-2">Sightseeing Excluded</span>
                          <p className="text-muted mb-0">You have removed sightseeing for this day. (-₹1500 discount applied)</p>
                        </div>
                      )}
                    </div>
                  ) : availableAddOns.filter(a => a.type === addOnModalTab).length > 0 ? (
                    availableAddOns.filter(a => a.type === addOnModalTab).map(addon => {
                      const isSelected = (selectedAddOns[showAddOnModalForDay] || []).includes(addon.id);
                      return (
                        <div key={addon.id} className={`bg-white rounded-4 p-3 d-flex gap-4 align-items-center shadow-sm transition-all border ${isSelected ? 'border-primary border-opacity-50 bg-primary bg-opacity-10' : 'border-white'}`}>
                          {addon.image_url ? (
                            <img src={addon.image_url} alt={addon.title} className="rounded-3 object-fit-cover" style={{ width: '180px', height: '120px', flexShrink: 0 }} />
                          ) : (
                            <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ width: '180px', height: '120px', flexShrink: 0 }}>
                              <Sparkles size={30} className="text-muted" />
                            </div>
                          )}
                          
                          <div className="flex-grow-1 py-1">
                            <span className="badge bg-primary bg-opacity-10 text-primary mb-2 px-2 py-1">Most Popular</span>
                            <h5 className="fw-bold mb-2 text-dark">{addon.title}</h5>
                            <p className="text-muted small mb-3 line-clamp-2">{addon.description}</p>
                            <div className="d-flex align-items-center gap-1 text-muted small fw-bold">
                              <Clock size={14} /> Duration {addon.duration || 'Flexible'} • Anytime
                            </div>
                          </div>

                          <div className="d-flex flex-column align-items-end justify-content-center pe-2" style={{ minWidth: '120px' }}>
                            <div className="fw-extrabold text-dark mb-1" style={{ fontSize: '18px' }}>+ ₹{addon.price}</div>
                            <span className="text-muted small mb-3">per person</span>
                            
                            {isSelected ? (
                              <button 
                                className="btn btn-primary rounded-pill px-4 py-2 fw-bold w-100"
                                onClick={() => {
                                  setSelectedAddOns(prev => ({
                                    ...prev,
                                    [showAddOnModalForDay]: prev[showAddOnModalForDay].filter(id => id !== addon.id)
                                  }));
                                }}
                              >
                                REMOVE
                              </button>
                            ) : (
                              <button 
                                className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold w-100"
                                onClick={() => {
                                  setSelectedAddOns(prev => ({
                                    ...prev,
                                    [showAddOnModalForDay]: [...(prev[showAddOnModalForDay] || []), addon.id]
                                  }));
                                }}
                              >
                                SELECT
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center text-muted py-5 mt-5">
                      <Sparkles size={40} className="mb-3 opacity-25" />
                      <h5>No {addOnModalTab}s available for this location.</h5>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* HOTEL SWAPPING MODAL */}
      {showHotelModalForDay !== null && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-lg" style={{ height: '80vh', backgroundColor: '#F4F7F9' }}>
              <div className="modal-header bg-white border-bottom pt-4 px-4 position-relative">
                <div className="w-100">
                  <h4 className="fw-bold mb-1">Change Hotel</h4>
                  <p className="text-muted small mb-0">Select an alternative hotel for Day {showHotelModalForDay + 1}</p>
                </div>
                <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={() => setShowHotelModalForDay(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex flex-column gap-3">
                  {masterHotels.length > 0 ? masterHotels.map(hotel => {
                    const isSelected = selectedHotels[showHotelModalForDay]?.id === hotel.id;
                    return (
                      <div key={hotel.id} className={`bg-white rounded-4 p-3 d-flex gap-4 align-items-center shadow-sm border ${isSelected ? 'border-primary border-opacity-50 bg-primary bg-opacity-10' : 'border-white'}`}>
                        {hotel.image_url ? (
                          <img src={hotel.image_url} alt={hotel.name} className="rounded-3 object-fit-cover" style={{ width: '160px', height: '120px' }} />
                        ) : (
                          <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ width: '160px', height: '120px' }}>
                            <Hotel size={30} className="text-muted" />
                          </div>
                        )}
                        <div className="flex-grow-1">
                          <h5 className="fw-bold mb-1 text-dark">{hotel.name}</h5>
                          <p className="text-muted small mb-2">{hotel.location}</p>
                          <div className="d-flex gap-1 mb-2">
                            {Array.from({ length: hotel.rating }).map((_, i) => (
                              <Sparkles key={i} size={12} className="text-warning fill-warning" />
                            ))}
                          </div>
                          <span className="badge bg-light text-dark border small">{hotel.amenities?.join(', ') || 'Standard Amenities'}</span>
                        </div>
                        <div className="text-end pe-2" style={{ minWidth: '120px' }}>
                          <div className="fw-extrabold text-success mb-2" style={{ fontSize: '18px' }}>+ ₹{hotel.price}</div>
                          {isSelected ? (
                            <button className="btn btn-outline-danger rounded-pill px-4 py-2 fw-bold w-100" onClick={() => {
                               setSelectedHotels(prev => { const next = {...prev}; delete next[showHotelModalForDay]; return next; });
                            }}>REMOVE</button>
                          ) : (
                            <button className="btn btn-primary rounded-pill px-4 py-2 fw-bold w-100" onClick={() => {
                               setSelectedHotels(prev => ({...prev, [showHotelModalForDay]: hotel}));
                               setShowHotelModalForDay(null);
                            }}>SELECT</button>
                          )}
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-center text-muted">No alternative hotels available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
