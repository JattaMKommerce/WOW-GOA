/**
 * vehicleHelper.js
 * Canonical vehicle type normalization and determination utility for WOW GOA.
 * 
 * Rules:
 * - Does NOT use incidental heuristics like engine, seating, or AC.
 * - Inspects explicit type / vehicle_type fields first.
 * - Uses canonical database ID prefixes ('bike-' vs 'car-').
 * - Uses official vehicle category values from the database.
 */

export function normalizeVehicleType(item) {
  if (!item) return 'car';

  // 1. Explicit vehicle type indicators
  if (item.type === 'bike' || item.vehicle_type === 'bike' || item._type === 'bike') {
    return 'bike';
  }
  if (item.type === 'car' || item.vehicle_type === 'car' || item._type === 'car') {
    return 'car';
  }

  // 2. Canonical database primary key prefix
  const idStr = String(item.id || '').toLowerCase();
  if (idStr.startsWith('bike-') || idStr.startsWith('bike_')) {
    return 'bike';
  }
  if (idStr.startsWith('car-') || idStr.startsWith('car_')) {
    return 'car';
  }

  // 3. Official vehicle category from database/API
  const cat = String(item.category || '').toLowerCase();
  if (
    cat.includes('scooter') || 
    cat.includes('moped') || 
    cat.includes('cruiser') || 
    cat.includes('bike') || 
    cat.includes('motorcycle') ||
    cat.includes('two wheeler')
  ) {
    return 'bike';
  }
  if (
    cat.includes('hatchback') || 
    cat.includes('sedan') || 
    cat.includes('suv') || 
    cat.includes('muv') || 
    cat.includes('car') || 
    cat.includes('convertible') ||
    cat.includes('four wheeler')
  ) {
    return 'car';
  }

  // 4. Default fallback
  return 'car';
}

export function isBikeVehicle(item) {
  return normalizeVehicleType(item) === 'bike';
}

export function isCarVehicle(item) {
  return normalizeVehicleType(item) === 'car';
}
