import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plane, Car, Hotel, MapPin, X, Info, Tag, ExternalLink, CheckCircle, Sparkles, Clock, Utensils, Sunrise, Sun, Sunset, Moon, Compass, Calendar, ChevronRight, Shield } from 'lucide-react';
import * as api from '../../services/api';
import PackageCheckoutStep2 from './PackageCheckoutStep2';
import PackageCheckoutStep3 from './PackageCheckoutStep3';
import PackageCheckoutStep4 from './PackageCheckoutStep4';

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

  // Itinerary Parsing with complete default fallback
  const getResolvedItinerary = () => {
    const rawItinerary = pkg?.day_wise_itinerary || pkg?.itinerary || pkg?.day_plan || pkg?.dayPlan || pkg?.dayWiseItinerary;
    let parsed = [];
    if (rawItinerary) {
      if (typeof rawItinerary === 'string') {
        try {
          parsed = JSON.parse(rawItinerary);
        } catch (e) {
          console.error("Error parsing itinerary JSON", e);
        }
      } else if (Array.isArray(rawItinerary)) {
        parsed = rawItinerary;
      }
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, index) => ({
        day: item.day || item.day_number || index + 1,
        title: item.title || item.heading || `Day ${index + 1}: ${item.location || pkg?.destination || 'Goa Discovery'}`,
        description: item.description || item.desc || '',
        location: item.location || pkg?.destination || 'Goa',
        hotel: item.hotel || pkg?.hotel_included || 'Luxury Beach Resort',
        meals: item.meals || pkg?.food_included || 'Breakfast Included',
        transfers: item.transfers || pkg?.car_included || 'Dedicated Transfer',
        morning: item.morning || '',
        afternoon: item.afternoon || '',
        evening: item.evening || '',
        night: item.night || '',
        activities: item.activities || '',
        tips: item.tips || '',
        images: Array.isArray(item.images) ? item.images : [],
        inclusions: Array.isArray(item.inclusions) ? item.inclusions : [item.hotel || 'Resort Stay', item.meals || 'Breakfast Included', 'Sightseeing Pass'].filter(Boolean),
        sightseeing_locations: Array.isArray(item.sightseeing_locations) 
          ? item.sightseeing_locations 
          : (item.location ? [{ name: item.location, tips: item.tips || 'Beach exploration & sunset views' }] : [{ name: 'Coastal Goa', tips: 'Sightseeing & relaxation' }])
      }));
    }

    // Determine duration
    let nights = 3;
    if (pkg?.duration) {
      const nMatch = String(pkg.duration).match(/(\d+)\s*Nights?/i);
      if (nMatch) nights = parseInt(nMatch[1]);
      else {
        const dMatch = String(pkg.duration).match(/(\d+)\s*Days?/i);
        if (dMatch) nights = Math.max(1, parseInt(dMatch[1]) - 1);
        else {
          const shortMatch = String(pkg.duration).match(/(\d+)\s*N/i);
          if (shortMatch) nights = parseInt(shortMatch[1]);
        }
      }
    }
    const daysCount = nights + 1;
    const destName = pkg?.destination || 'Goa';
    const hotelName = pkg?.hotel_included || '4-Star Candolim Beach Resort';
    const carName = pkg?.car_included || 'Dedicated Vehicle / Self-Drive';
    const places = (pkg?.places_included || 'Calangute, Baga, Fort Aguada, Panaji Latin Quarter, Vagator, Miramar').split(',').map(s => s.trim()).filter(Boolean);

    const defaultDays = [
      {
        day: 1,
        title: `Arrival in ${destName}, Private Airport Transfer & Hotel Check-in`,
        description: `Welcome greeting by your private chauffeur at ${destName} Airport / Railway Station. Enjoy a scenic private transfer to ${hotelName}, welcome drinks on arrival, and evening leisure by the beach or pool.`,
        location: places[0] || `${destName} Coast`,
        hotel: hotelName,
        meals: 'Welcome Drink & Buffet Dinner',
        transfers: carName,
        inclusions: ['Airport Pickup', 'Resort Check-in', 'Welcome Drink', 'Buffet Dinner'],
        sightseeing_locations: [{ name: places[0] || 'Beachfront Check-in', tips: 'Relax and unwind after your arrival' }]
      },
      {
        day: 2,
        title: `North ${destName} Coastal Tour, Fort Aguada & Water Sports`,
        description: `Embark on an exciting coastal tour visiting ${places[1] || 'Calangute'}, ${places[2] || 'Baga Beach'}, and historical Fort Aguada lighthouse with sweeping sea panoramas. Enjoy thrilling water sport activities.`,
        location: places[1] || 'North Goa Beaches',
        hotel: hotelName,
        meals: 'Buffet Breakfast & Dinner',
        transfers: carName,
        inclusions: ['Breakfast', carName, 'Fort Aguada Pass', 'Water Sports Pass'],
        sightseeing_locations: [
          { name: places[1] || 'Calangute Beach', tips: 'Bustling beach with beach shacks and shopping' },
          { name: places[2] || 'Fort Aguada', tips: '17th-century Portuguese fort and lighthouse' }
        ]
      },
      {
        day: 3,
        title: `South ${destName} Heritage Trail, Latin Quarter & Sunset River Cruise`,
        description: `Discover the colorful Portuguese villas of Fontainhas Latin Quarter, visit the historic Basilica of Bom Jesus, and embark on a mesmerizing 1-hour sunset cruise along the Mandovi river with cultural performances.`,
        location: places[3] || 'South Goa & Heritage',
        hotel: hotelName,
        meals: 'Buffet Breakfast & Dinner',
        transfers: carName,
        inclusions: ['Breakfast', 'Heritage Guide Pass', 'Sunset Cruise Ticket', 'Dinner'],
        sightseeing_locations: [
          { name: places[3] || 'Fontainhas Latin Quarter', tips: 'Picturesque colorful Portuguese heritage lanes' },
          { name: 'Mandovi River Sunset Cruise', tips: 'Scenic 1-hour river cruise with Goan folk dance' }
        ]
      }
    ];

    if (daysCount >= 4) {
      defaultDays.push({
        day: 4,
        title: `Leisure Morning, Souvenir Shopping & Departure Transfer`,
        description: `Savor a leisurely breakfast by the pool. Enjoy last-minute shopping at local markets before your private drop-off transfer to ${destName} Airport or Railway Station with memorable experiences.`,
        location: `${destName} Departure`,
        hotel: hotelName,
        meals: 'Buffet Breakfast',
        transfers: 'Airport Drop Transfer',
        inclusions: ['Buffet Breakfast', 'Airport Drop Transfer', '24x7 Assistance'],
        sightseeing_locations: [{ name: 'Goa Flea Market', tips: 'Local spices, handicrafts, and souvenirs' }]
      });
    }

    while (defaultDays.length < daysCount) {
      const dNum = defaultDays.length + 1;
      defaultDays.splice(defaultDays.length - 1, 0, {
        day: dNum,
        title: `Day ${dNum}: Island Excursion & Coastal Exploration`,
        description: `Take a scenic day excursion along tropical coastal shores with dolphin sighting and local cuisine experience.`,
        location: places[dNum % places.length] || 'Goa Excursions',
        hotel: hotelName,
        meals: 'Buffet Breakfast & Lunch',
        transfers: carName,
        inclusions: ['Breakfast', 'Sightseeing Pass', 'Lunch'],
        sightseeing_locations: [{ name: 'Coastal Waters & Shacks', tips: 'Stunning natural scenery & relaxation' }]
      });
    }

    return defaultDays.slice(0, daysCount).map((d, i) => ({ ...d, day: i + 1 }));
  };

  const parsedItinerary = useMemo(() => getResolvedItinerary(), [pkg]);

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

  const numHotels = Math.max(1, parsedItinerary.filter(d => d.hotel).length || 1);
  const numTransfers = Math.max(1, parsedItinerary.length > 1 ? 2 : 1);
  const numActivities = Math.max(2, parsedItinerary.reduce((acc, d) => acc + (d.inclusions?.length || 2), 0));
  const numMeals = Math.max(1, parsedItinerary.filter(d => d.meals).length || parsedItinerary.length);
  const durationDisplay = pkg?.duration || `${Math.max(1, parsedItinerary.length - 1)}N / ${parsedItinerary.length}D`;

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

  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceedToTravellers = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCurrentStep(2);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleProceedToReview = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Validate Traveller form
    const lead = travellers[0];
    if (!lead || !lead.firstName?.trim() || !lead.lastName?.trim()) {
      alert('Please fill all mandatory lead traveller details (First Name, Last Name).');
      return;
    }
    if (!contactEmail || !contactPhone) {
      alert('Please provide contact email and mobile phone number.');
      return;
    }

    const priceRes = {
      base_price: pkg.price,
      total_price: totalPrice,
      breakdown: customizations,
      advance_percentage: pkg.advance_percentage || 25,
      advance_amount: Math.round((totalPrice * (pkg.advance_percentage || 25)) / 100)
    };
    setServerPriceData(priceRes);
    setCurrentStep(3);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleCheckout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);

    const priceData = serverPriceData || {
      base_price: pkg.price,
      total_price: totalPrice,
      breakdown: customizations,
      advance_percentage: pkg.advance_percentage || 25,
      advance_amount: Math.round((totalPrice * (pkg.advance_percentage || 25)) / 100)
    };

    const lead = travellers[0] || {};
    const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Valued Guest';
    const actualTotal = Number(priceData.total_price || totalPrice || pkg.price || 0);
    const isAdvance = paymentMode === 'advance';
    const actualPaid = isAdvance ? Number(priceData.advance_amount || Math.round((actualTotal * 25) / 100)) : actualTotal;

    const activeNights = Math.max(1, (parsedItinerary?.length || 4) - 1);
    const activeDays = activeNights + 1;
    const activeDepDate = pkg?.departureDate || pkg?.pickup_date || pkg?.pickupDate || pickupDate || new Date().toISOString().slice(0, 10);
    const activeRetDate = pkg?.returnDate || pkg?.drop_date || pkg?.dropDate || dropDate || new Date(Date.now() + 86400000 * activeNights).toISOString().slice(0, 10);
    const durationStr = pkg?.duration || `${activeNights} Nights / ${activeDays} Days`;

    const cleanPhone = String(contactPhone || '9876543210').replace(/\D/g, '');
    const isSelfDrive = cabType === 'self-drive' || (pkg.name && pkg.name.toLowerCase().includes('self drive')) || (pkg.package_type === 'Self Drive Package');

    const bookingPayload = {
      name: leadName,
      customer_name: leadName,
      phone: contactPhone || '9876543210',
      customer_phone: contactPhone || '9876543210',
      email: contactEmail || '',
      customer_email: contactEmail || '',
      customer_id: `c_${cleanPhone || Date.now()}`,
      license: drivingLicense || '',
      pickup_loc: vehiclePickupLoc || 'Goa Airport',
      pickup_location: vehiclePickupLoc || 'Goa Airport',
      drop_loc: vehicleDropLoc || 'Goa Airport',
      drop_location: vehicleDropLoc || 'Goa Airport',
      pickup_date: activeDepDate,
      drop_date: activeRetDate,
      departure_date: activeDepDate,
      return_date: activeRetDate,
      check_in_date: activeDepDate,
      check_out_date: activeRetDate,
      duration: durationStr,
      item_id: pkg.id,
      item_name: pkg.name,
      package_name: pkg.name,
      package_type: isSelfDrive ? 'Self Drive Package' : (pkg.package_type || 'Trip Package'),
      type: isSelfDrive ? 'selfdrive' : 'package',
      vehicle_name: customizations?.cab?.name || pkg.car_included || (isSelfDrive ? 'Self Drive Vehicle' : ''),
      vehicle_image: customizations?.cab?.image || pkg.image || pkg.image_url || '',
      image: pkg.image || pkg.image_url || '',
      hotel_name: customizations?.hotel?.name || pkg.hotel_included || '',
      booking_days: activeNights,
      total_paid: actualPaid,
      total_amount: actualTotal,
      amount_paid: actualPaid,
      paid_amount: actualPaid,
      remaining_amount: actualTotal - actualPaid,
      pending_amount: actualTotal - actualPaid,
      status: 'Confirmed',
      payment_status: isAdvance ? 'Partial' : 'Full',
      payment_mode: paymentMode,
      payment_method: 'Direct / UPI',
      traveller_details_json: { adults: numAdults, children: numChildren, list: travellers, contactEmail, contactPhone },
      price_breakdown_json: priceData,
      customizations: JSON.stringify(customizations)
    };

    try {
      const res = await api.createBooking(bookingPayload);
      const createdRecord = res.booking || { ...bookingPayload, id: res.booking_id || res.id || `TG-${Math.floor(100000 + Math.random() * 900000)}` };
      setConfirmedBooking(createdRecord);

      try {
        sessionStorage.setItem('customer_login_phone', contactPhone);
        sessionStorage.setItem('last_created_booking', JSON.stringify(createdRecord));
      } catch (e) {}

      if (onConfirmBooking) {
        onConfirmBooking(createdRecord, customizations, actualTotal);
      }
      setCurrentStep(4);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } catch (err) {
      console.error("Booking error:", err);
      const fallbackRecord = { ...bookingPayload, id: `TG-${Math.floor(100000 + Math.random() * 900000)}` };
      setConfirmedBooking(fallbackRecord);
      try {
        sessionStorage.setItem('customer_login_phone', contactPhone);
        sessionStorage.setItem('last_created_booking', JSON.stringify(fallbackRecord));
      } catch (e) {}
      if (onConfirmBooking) {
        onConfirmBooking(fallbackRecord, customizations, actualTotal);
      }
      setCurrentStep(4);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!pkg) return null;

  const activeNights = Math.max(1, (parsedItinerary?.length || 4) - 1);
  const activeDays = activeNights + 1;
  const activeDepDate = pkg?.departureDate || pkg?.pickup_date || pkg?.pickupDate || pickupDate || new Date().toISOString().slice(0, 10);
  const activeRetDate = pkg?.returnDate || pkg?.drop_date || pkg?.dropDate || dropDate || new Date(Date.now() + 86400000 * activeNights).toISOString().slice(0, 10);

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
          onProceed={handleProceedToReview}
      />
    );
  }

  if (currentStep === 3) {
      return (
          <PackageCheckoutStep3 
              pkg={pkg} 
              serverPriceData={serverPriceData || { total_price: totalPrice, advance_percentage: 25, advance_amount: Math.round(totalPrice * 0.25) }} 
              paymentMode={paymentMode} 
              setPaymentMode={setPaymentMode} 
              onBack={() => setCurrentStep(2)} 
              onCheckout={handleCheckout} 
          />
      );
  }

  if (currentStep === 4) {
      return (
          <PackageCheckoutStep4 
              pkg={pkg}
              bookingRecord={confirmedBooking}
              serverPriceData={serverPriceData || { total_price: totalPrice, advance_percentage: 25, advance_amount: Math.round(totalPrice * 0.25) }}
              paymentMode={paymentMode}
              travellers={travellers}
              contactEmail={contactEmail}
              contactPhone={contactPhone}
              pickupDate={activeDepDate}
              dropDate={activeRetDate}
              onDone={onBack}
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
        <div className="d-flex flex-wrap gap-2 align-items-center text-muted small fw-bold">
          <span className="border rounded-pill px-3 py-1 bg-light text-dark d-flex align-items-center gap-1">
            <Plane size={14} className="text-primary" /> {withFlight ? 'With Flight' : 'Without Flight'}
          </span>
          <span className="border rounded-pill px-3 py-1 bg-light text-dark fw-bold" style={{ color: '#FF6333' }}>
            <Clock size={14} className="me-1 text-primary d-inline" /> {durationDisplay}
          </span>
          <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill d-flex align-items-center gap-1">
            <MapPin size={13} className="text-danger" /> {pkg.destination || 'Goa, India'}
          </span>
          {parsedItinerary.slice(0, 3).map((d, i) => (
             <span key={i} className="text-muted small">
               Day {d.day}: {d.location || 'Goa'} {i < Math.min(2, parsedItinerary.length - 1) && '•'}
             </span>
          ))}
        </div>
      </div>

      <div className="row g-4 text-start">
        {/* Left Column: Itinerary Details */}
        <div className="col-lg-8">
          
          {/* Top Tabs (MMT Style) */}
          <div className="bg-light rounded-top border d-flex justify-content-between p-3 align-items-center">
            <div className="d-flex gap-3 gap-md-4 flex-wrap align-items-center">
              <div className="text-center">
                <span className="d-block fw-bold text-primary px-3 py-1 bg-white border rounded-pill shadow-xs" style={{ fontSize: '0.85rem' }}>
                  {parsedItinerary.length} DAY PLAN
                </span>
              </div>
              <div className="text-center text-muted small fw-bold d-flex flex-column justify-content-center">
                 <span>{numTransfers} TRANSFER{numTransfers > 1 ? 'S' : ''}</span>
              </div>
              <div className="text-center text-muted small fw-bold d-flex flex-column justify-content-center">
                 <span>{numHotels} HOTEL{numHotels > 1 ? 'S' : ''}</span>
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
              {parsedItinerary.map((day, idx) => {
                const dayActivityCount = (() => {
                  let cnt = 0;
                  if (day.morning) cnt++;
                  if (day.afternoon) cnt++;
                  if (day.evening) cnt++;
                  if (day.night) cnt++;
                  if (day.activities && !day.morning && !day.afternoon) cnt++;
                  if (day.sightseeing_locations && day.sightseeing_locations.length > 0 && !day.morning) cnt += day.sightseeing_locations.length;
                  return cnt || (day.inclusions?.length || 2);
                })();

                return (
                <div key={idx} id={`day-${day.day}`} className="mb-5 bg-white rounded-4 p-4 border shadow-sm">
                  
                  {/* Day Header */}
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4 bg-light p-3 rounded-3 border">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-danger rounded-pill px-3 py-2 fw-bold fs-6">Day {day.day}</span>
                      <span className="fw-bold text-dark fs-6">{day.location || pkg?.destination || 'Goa'}</span>
                    </div>
                    <span className="text-muted small fw-semibold">
                      INCLUDED: {day.hotel || pkg?.hotel_included ? '1 Hotel • ' : ''} 1 Transfer • {dayActivityCount} Activities {day.meals || pkg?.food_included ? '• 1 Meal' : ''}
                    </span>
                  </div>

                  {/* Flight Notice Block */}
                  {idx === 0 && withFlight && (
                    <div className="d-flex gap-3 mb-4">
                      <div className="text-muted p-2 rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}><Plane size={22} className="text-primary" /></div>
                      <div className="flex-grow-1 pb-3 border-bottom border-light">
                         <h6 className="fw-bold text-dark mb-1">FLIGHT</h6>
                         <span className="d-block small text-dark mb-1">Arrival at Dabolim / Mopa (Round Trip Included)</span>
                         <span className="d-block text-danger small fw-bold">Please Note: Flight schedules are subject to airline confirmation.</span>
                      </div>
                    </div>
                  )}

                  {/* Hotel / Stay Block */}
                  <div className="d-flex gap-3 mb-4">
                    <div className="text-primary p-2 rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}><Hotel size={22} /></div>
                    <div className="flex-grow-1 pb-3 border-bottom border-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-dark mb-0 text-uppercase">Hotel / Stay <span className="text-muted text-capitalize ms-1">({day.location || pkg?.destination || 'Goa'})</span></h6>
                        <button 
                          type="button" 
                          onClick={() => setShowHotelModalForDay(idx)} 
                          className="btn btn-link p-0 text-primary fw-bold text-decoration-none small text-uppercase"
                        >
                          CHANGE HOTEL
                        </button>
                      </div>
                      <div className="d-flex gap-3 mt-2 bg-light p-3 rounded-3 border align-items-center">
                        <div className="rounded-3 bg-white p-2 text-primary shadow-sm">
                          <Hotel size={24} />
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-1 text-dark">{selectedHotels[idx]?.name || day.hotel || pkg?.hotel_included || 'Luxury Beach Resort'}</h6>
                          <div className="d-flex gap-2 flex-wrap text-muted small">
                            <span className="badge bg-white text-dark border">Standard Room</span>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">✓ Breakfast Included</span>
                            <span className="badge bg-white text-muted border">Free Cancellation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transfer / Self-Drive Block */}
                  <div className="d-flex gap-3 mb-4">
                    <div className="text-muted p-2 rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}><Car size={22} className="text-secondary" /></div>
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
                         <div className="d-flex gap-3 mt-2 bg-light p-3 rounded-3 border">
                           <img src={selectedSelfDriveVehicle.image} alt="Vehicle" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                           <div>
                             <h6 className="fw-bold mb-1">{selectedSelfDriveVehicle.name} <span className="fw-normal text-muted small">(or Similar)</span></h6>
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
                         <div className="d-flex gap-3 mt-2 bg-light p-3 rounded-3 border align-items-center">
                           <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><Car size={20}/></div>
                           <div>
                             <h6 className="fw-bold mb-0">Company Standard Transfer</h6>
                             <span className="d-block small text-muted">Private Cab Included</span>
                           </div>
                         </div>
                       ) : (
                         <div className="d-flex gap-3 mt-2 bg-light p-3 rounded-3 border align-items-center opacity-75">
                           <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}><X size={20}/></div>
                           <div>
                             <h6 className="fw-bold mb-0 text-danger">No Cab Selected</h6>
                             <span className="d-block small text-muted">You will travel on your own.</span>
                           </div>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Day Activities & Sightseeing Timeline Block */}
                  {(day.morning || day.afternoon || day.evening || day.night || day.activities || (day.sightseeing_locations && day.sightseeing_locations.length > 0) || day.description) && (
                    <div className="d-flex gap-3 mb-4">
                      <div className="text-warning p-2 rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}><Sparkles size={22} className="text-warning" /></div>
                      <div className="flex-grow-1 pb-3 border-bottom border-light">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-dark mb-0 text-uppercase">Day Activities & Sightseeing</h6>
                          <span className="badge bg-warning bg-opacity-10 text-dark border px-2.5 py-1 small fw-bold">
                            Included in Plan
                          </span>
                        </div>

                        {day.title && (
                          <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>{day.title}</h6>
                        )}

                        {day.description && !day.morning && !day.afternoon && (
                          <p className="text-muted small mb-3 lh-base bg-light p-3 rounded-3 border">{day.description}</p>
                        )}

                        {/* Structured Activities: Morning, Afternoon, Evening, Night */}
                        <div className="d-flex flex-column gap-2.5 mb-3">
                          {day.morning && (
                            <div className="p-3 bg-white rounded-3 border shadow-xs d-flex gap-3 align-items-start" style={{ borderLeft: '4px solid #f59e0b' }}>
                              <div className="p-2 rounded-circle bg-warning bg-opacity-10 text-warning flex-shrink-0 mt-0.5">
                                <Sunrise size={18} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>MORNING</span>
                                  <span className="fw-bold text-dark small">Morning Exploration</span>
                                </div>
                                <p className="text-dark small mb-0 lh-base">{day.morning}</p>
                              </div>
                            </div>
                          )}

                          {day.afternoon && (
                            <div className="p-3 bg-white rounded-3 border shadow-xs d-flex gap-3 align-items-start" style={{ borderLeft: '4px solid #3b82f6' }}>
                              <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary flex-shrink-0 mt-0.5">
                                <Sun size={18} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge bg-primary text-white fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>AFTERNOON</span>
                                  <span className="fw-bold text-dark small">Afternoon Tour & Sightseeing</span>
                                </div>
                                <p className="text-dark small mb-0 lh-base">{day.afternoon}</p>
                              </div>
                            </div>
                          )}

                          {day.evening && (
                            <div className="p-3 bg-white rounded-3 border shadow-xs d-flex gap-3 align-items-start" style={{ borderLeft: '4px solid #8b5cf6' }}>
                              <div className="p-2 rounded-circle bg-info bg-opacity-10 text-info flex-shrink-0 mt-0.5">
                                <Sunset size={18} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge text-white fw-bold" style={{ background: '#7c3aed', fontSize: '10px', letterSpacing: '0.5px' }}>EVENING</span>
                                  <span className="fw-bold text-dark small">Sunset & Coastal Views</span>
                                </div>
                                <p className="text-dark small mb-0 lh-base">{day.evening}</p>
                              </div>
                            </div>
                          )}

                          {day.night && (
                            <div className="p-3 bg-white rounded-3 border shadow-xs d-flex gap-3 align-items-start" style={{ borderLeft: '4px solid #1e293b' }}>
                              <div className="p-2 rounded-circle bg-dark bg-opacity-10 text-dark flex-shrink-0 mt-0.5">
                                <Moon size={18} />
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge bg-dark text-white fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>NIGHT</span>
                                  <span className="fw-bold text-dark small">Dinner & Night Experiences</span>
                                </div>
                                <p className="text-dark small mb-0 lh-base">{day.night}</p>
                              </div>
                            </div>
                          )}

                          {day.activities && !day.morning && !day.afternoon && (
                            <div className="p-3 bg-white rounded-3 border shadow-xs d-flex gap-3 align-items-start" style={{ borderLeft: '4px solid #10b981' }}>
                              <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success flex-shrink-0 mt-0.5">
                                <Sparkles size={18} />
                              </div>
                              <div className="flex-grow-1">
                                <span className="badge bg-success text-white fw-bold mb-1" style={{ fontSize: '10px' }}>ACTIVITIES</span>
                                <p className="text-dark small mb-0 lh-base">{day.activities}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sightseeing Locations Chips */}
                        {day.sightseeing_locations && day.sightseeing_locations.length > 0 && (
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {day.sightseeing_locations.map((loc, i) => (
                              <div key={i} className="badge bg-light text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-1.5 shadow-xs">
                                <MapPin size={12} className="text-danger" />
                                <span className="fw-semibold">{typeof loc === 'string' ? loc : loc.name}</span>
                                {loc.tips && <span className="text-muted fw-normal small">({loc.tips})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meals Plan Section */}
                  {(day.meals || pkg?.food_included) && (
                    <div className="d-flex gap-3 mb-4">
                      <div className="text-success p-2 rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}><Utensils size={22} /></div>
                      <div className="flex-grow-1 pb-3 border-bottom border-light">
                        <h6 className="fw-bold text-dark mb-1 text-uppercase">Dining & Meals</h6>
                        <span className="small text-muted">{day.meals || pkg?.food_included || 'Buffet Breakfast Included'}</span>
                      </div>
                    </div>
                  )}

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
                           );
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
                      <span className="fw-bold mb-1">Add Extra Activities to your day</span>
                      <span className="small opacity-75">Spend the day at leisure or add customized tours, extra transfers or special meals</span>
                    </button>
                  </div>

                </div>
              );
            })}
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
