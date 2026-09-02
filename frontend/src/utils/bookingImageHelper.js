/**
 * Resolves all accurate images for any booking record, looking up matched vehicle/package/hotel data.
 */

export function getBookingDisplayImages(booking, allCars = [], allBikes = [], allPackages = [], allHotels = [], allFlights = []) {
  if (!booking) {
    return ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'];
  }

  const images = [];

  const addImage = (img) => {
    if (!img) return;
    if (typeof img === 'string' && img.trim().length > 0) {
      const clean = img.trim();
      if (!images.includes(clean)) images.push(clean);
    } else if (Array.isArray(img)) {
      img.forEach(addImage);
    } else if (typeof img === 'object' && img !== null) {
      if (img.url) addImage(img.url);
      else if (img.src) addImage(img.src);
      else if (img.image) addImage(img.image);
    }
  };

  // 1. Direct explicit images on booking object
  addImage(booking.vehicle_image);
  addImage(booking.image);
  addImage(booking.image_url);
  addImage(booking.hotel_image);
  addImage(booking.images);

  if (booking.images_json) {
    try {
      const parsed = typeof booking.images_json === 'string' ? JSON.parse(booking.images_json) : booking.images_json;
      addImage(parsed);
    } catch (e) {}
  }

  if (booking.documents_json) {
    try {
      const parsed = typeof booking.documents_json === 'string' ? JSON.parse(booking.documents_json) : booking.documents_json;
      addImage(parsed);
    } catch (e) {}
  }

  // 2. Extract from booking customizations
  if (booking.customizations) {
    try {
      const custom = typeof booking.customizations === 'string' ? JSON.parse(booking.customizations) : booking.customizations;
      if (custom) {
        if (custom.selectedSelfDriveVehicle) {
          const matchedCar = (allCars || []).find(c => c.id === custom.selectedSelfDriveVehicle);
          if (matchedCar) {
            addImage(matchedCar.image);
            addImage(matchedCar.image_url);
            if (matchedCar.images_json) {
              try { addImage(JSON.parse(matchedCar.images_json)); } catch (e) { addImage(matchedCar.images_json); }
            }
          }
        }
        if (custom.selectedHotels && typeof custom.selectedHotels === 'object') {
          Object.values(custom.selectedHotels).forEach(h => {
            if (h && typeof h === 'object') {
              addImage(h.image || h.image_url || h.images);
            }
          });
        }
      }
    } catch (e) {}
  }

  const itemId = String(booking.item_id || '').toLowerCase().trim();
  const itemName = String(booking.item_name || booking.name || booking.package_name || booking.vehicle_name || '').toLowerCase().trim();

  // 3. Search in bikes list
  const matchedBike = (allBikes || []).find(b => 
    (b.id && String(b.id).toLowerCase().trim() === itemId) ||
    (b.name && String(b.name).toLowerCase().trim() === itemName) ||
    (itemName && b.name && (itemName.includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(itemName)))
  );
  if (matchedBike) {
    addImage(matchedBike.image);
    addImage(matchedBike.image_url);
    if (matchedBike.images_json) {
      try { addImage(JSON.parse(matchedBike.images_json)); } catch (e) { addImage(matchedBike.images_json); }
    }
  }

  // 4. Search in cars list
  const matchedCar = (allCars || []).find(c => 
    (c.id && String(c.id).toLowerCase().trim() === itemId) ||
    (c.name && String(c.name).toLowerCase().trim() === itemName) ||
    (itemName && c.name && (itemName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(itemName)))
  );
  if (matchedCar) {
    addImage(matchedCar.image);
    addImage(matchedCar.image_url);
    if (matchedCar.images_json) {
      try { addImage(JSON.parse(matchedCar.images_json)); } catch (e) { addImage(matchedCar.images_json); }
    }
  }

  // 5. Search in packages list
  const matchedPkg = (allPackages || []).find(p => 
    (p.id && String(p.id).toLowerCase().trim() === itemId) ||
    (p.name && String(p.name).toLowerCase().trim() === itemName) ||
    (itemName && p.name && (itemName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(itemName)))
  );
  if (matchedPkg) {
    addImage(matchedPkg.image);
    addImage(matchedPkg.image_url);
    addImage(matchedPkg.imageUrl);
    if (matchedPkg.images_json) {
      try { addImage(JSON.parse(matchedPkg.images_json)); } catch (e) { addImage(matchedPkg.images_json); }
    }
  }

  // 6. Search in hotels list
  const matchedHotel = (allHotels || []).find(h => 
    (h.id && String(h.id).toLowerCase().trim() === itemId) ||
    (h.name && String(h.name).toLowerCase().trim() === itemName)
  );
  if (matchedHotel) {
    addImage(matchedHotel.image);
    addImage(matchedHotel.image_url);
    if (matchedHotel.images_json) {
      try { addImage(JSON.parse(matchedHotel.images_json)); } catch (e) { addImage(matchedHotel.images_json); }
    }
  }

  // Filter out invalid or broken URLs
  const validImages = images.filter(img => typeof img === 'string' && img.length > 5 && !img.includes('undefined') && !img.includes('null'));

  if (validImages.length > 0) {
    return Array.from(new Set(validImages));
  }

  // Fallback images based on keyword
  if (itemName.includes('gt') || itemName.includes('activa') || itemName.includes('ninja') || itemName.includes('jupiter') || itemName.includes('bullet') || itemName.includes('scooter') || itemName.includes('bike') || itemName.includes('himalayan') || itemName.includes('pulsar') || itemName.includes('r15')) {
    return [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80'
    ];
  }

  if (itemName.includes('swift') || itemName.includes('i20') || itemName.includes('creta') || itemName.includes('car') || itemName.includes('thar') || itemName.includes('defender') || itemName.includes('bmw') || itemName.includes('audi') || itemName.includes('mercedes') || itemName.includes('fortuner')) {
    return [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
    ];
  }

  return [
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
  ];
}

export function getBookingDisplayImage(booking, allCars = [], allBikes = [], allPackages = [], allHotels = [], allFlights = []) {
  const images = getBookingDisplayImages(booking, allCars, allBikes, allPackages, allHotels, allFlights);
  return images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
}
