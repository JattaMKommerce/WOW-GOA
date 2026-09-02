/**
 * Resolves the accurate image for any booking record, looking up matched vehicle/package/hotel data.
 */
export function getBookingDisplayImage(booking, allCars = [], allBikes = [], allPackages = [], allHotels = [], allFlights = []) {
  if (!booking) {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
  }

  // 1. Direct explicit image on booking (if present and not the generic Thar placeholder)
  const rawImg = booking.vehicle_image || booking.image || booking.image_url || '';
  if (rawImg && typeof rawImg === 'string' && rawImg.trim().length > 0 && !rawImg.includes('photo-1533473359331-0135ef1b58bf')) {
    return rawImg;
  }

  const itemId = String(booking.item_id || '').toLowerCase().trim();
  const itemName = String(booking.item_name || booking.name || booking.package_name || booking.vehicle_name || '').toLowerCase().trim();

  // 2. Search in bikes list (covers GT, Ninja, Activa, Classic 350, Himalayan, etc.)
  const matchedBike = (allBikes || []).find(b => 
    (b.id && String(b.id).toLowerCase().trim() === itemId) ||
    (b.name && String(b.name).toLowerCase().trim() === itemName) ||
    (itemName && b.name && (itemName.includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(itemName)))
  );
  if (matchedBike && (matchedBike.image || matchedBike.image_url || (matchedBike.images_json && matchedBike.images_json[0]))) {
    return matchedBike.image || matchedBike.image_url || matchedBike.images_json[0];
  }

  // 3. Search in cars list (covers DEFENDAR, Swift, Thar, Fortuner, Ertiga, etc.)
  const matchedCar = (allCars || []).find(c => 
    (c.id && String(c.id).toLowerCase().trim() === itemId) ||
    (c.name && String(c.name).toLowerCase().trim() === itemName) ||
    (itemName && c.name && (itemName.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(itemName)))
  );
  if (matchedCar && (matchedCar.image || matchedCar.image_url || (matchedCar.images_json && matchedCar.images_json[0]))) {
    return matchedCar.image || matchedCar.image_url || matchedCar.images_json[0];
  }

  // 4. Search in packages list
  const matchedPkg = (allPackages || []).find(p => 
    (p.id && String(p.id).toLowerCase().trim() === itemId) ||
    (p.name && String(p.name).toLowerCase().trim() === itemName) ||
    (itemName && p.name && (itemName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(itemName)))
  );
  if (matchedPkg && (matchedPkg.image || matchedPkg.image_url || matchedPkg.imageUrl)) {
    return matchedPkg.image || matchedPkg.image_url || matchedPkg.imageUrl;
  }

  // 5. Search in hotels list
  const matchedHotel = (allHotels || []).find(h => 
    (h.id && String(h.id).toLowerCase().trim() === itemId) ||
    (h.name && String(h.name).toLowerCase().trim() === itemName)
  );
  if (matchedHotel && (matchedHotel.image || matchedHotel.image_url || (matchedHotel.images && matchedHotel.images[0]))) {
    return matchedHotel.image || matchedHotel.image_url || matchedHotel.images[0];
  }

  // 6. Use rawImg if available
  if (rawImg && rawImg.trim().length > 0) {
    return rawImg;
  }

  // 7. Contextual intelligent fallback based on vehicle keywords
  if (itemName.includes('gt') || itemName.includes('activa') || itemName.includes('ninja') || itemName.includes('jupiter') || itemName.includes('bullet') || itemName.includes('scooter') || itemName.includes('bike') || itemName.includes('himalayan') || itemName.includes('pulsar') || itemName.includes('r15') || itemName.includes('two wheeler')) {
    return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'; // Bike
  }

  if (itemName.includes('swift') || itemName.includes('i20') || itemName.includes('creta') || itemName.includes('car') || itemName.includes('thar') || itemName.includes('defender') || itemName.includes('bmw') || itemName.includes('audi') || itemName.includes('mercedes') || itemName.includes('fortuner') || itemName.includes('four wheeler') || itemName.includes('luxury')) {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'; // Car
  }

  return 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80';
}
