/**
 * Canonical Pricing & Markup Helper for WOW GOA
 * Provides consistent package and vehicle pricing calculation across Listing, Details, Customization, and Checkout.
 */

export function getMarkupPrice(basePrice, vendorId, entityType, itemId = 'all', markups = []) {
  if (!markups || !Array.isArray(markups) || markups.length === 0) {
    return Number(basePrice) || 0;
  }
  const numBase = Number(basePrice) || 0;
  
  // Support both singular ('package', 'car') and plural ('packages', 'cars') forms
  const matchType = (mType) => {
    if (!mType) return false;
    const a = String(mType).toLowerCase().trim();
    const b = String(entityType).toLowerCase().trim();
    return a === b || a.replace(/s$/, '') === b.replace(/s$/, '');
  };

  // 1. Item-specific markup for this vendor
  let applicable = markups.find(m => matchType(m.entity_type) && String(m.vendor_id) === String(vendorId) && String(m.item_id) === String(itemId));
  
  // 2. Global markup for this vendor (item_id = 'all' or empty)
  if (!applicable) {
    applicable = markups.find(m => matchType(m.entity_type) && String(m.vendor_id) === String(vendorId) && (m.item_id === 'all' || !m.item_id));
  }
  
  // 3. Global markup for all vendors
  if (!applicable) {
    applicable = markups.find(m => matchType(m.entity_type) && (m.vendor_id === 'all' || !m.vendor_id || m.vendor_id === 'global') && (m.item_id === 'all' || !m.item_id));
  }

  if (applicable) {
    const val = parseFloat(applicable.markup_value);
    if (!isNaN(val)) {
      if (applicable.markup_type === 'flat' || applicable.markup_type === 'fixed') {
        return numBase + val;
      } else if (applicable.markup_type === 'percentage') {
        return numBase + (numBase * (val / 100));
      }
    }
  }
  return numBase;
}

/**
 * Resolves consistent package base price and flight price with markup.
 * Idempotent: Never applies markup twice if already marked up.
 */
export function resolvePackagePrices(pkg, markups = []) {
  if (!pkg) return { price: 0, price_with_flight: null, originalPrice: 0, is_markup_applied: true };

  const rawPrice = pkg.originalPrice !== undefined ? Number(pkg.originalPrice) : (Number(pkg.price) || 0);
  const rawFlightPrice = pkg.originalFlightPrice !== undefined 
    ? Number(pkg.originalFlightPrice) 
    : (pkg.price_with_flight ? Number(pkg.price_with_flight) : null);

  const finalPrice = getMarkupPrice(rawPrice, pkg.vendor_id || 'global', 'packages', pkg.id, markups);
  const finalFlightPrice = rawFlightPrice !== null 
    ? getMarkupPrice(rawFlightPrice, pkg.vendor_id || 'global', 'packages', pkg.id, markups) 
    : null;

  return {
    price: Math.round(finalPrice),
    price_with_flight: finalFlightPrice !== null ? Math.round(finalFlightPrice) : null,
    originalPrice: rawPrice,
    originalFlightPrice: rawFlightPrice,
    is_markup_applied: true
  };
}

/**
 * Identifies the authentic baseline vehicle included in a Self Drive package
 * based on `pkg.car_included` or package details.
 */
export function findBaselineVehicle(pkg, vehicles = []) {
  if (!pkg || !pkg.car_included || !Array.isArray(vehicles) || vehicles.length === 0) {
    return null;
  }
  const target = String(pkg.car_included).toLowerCase().trim();
  if (!target) return null;

  // 1. Exact or substring match on vehicle name
  let matched = vehicles.find(v => {
    const vName = (v.name || '').toLowerCase().trim();
    return vName === target || vName.includes(target) || target.includes(vName);
  });

  // 2. Word-level token match (e.g. "Thar", "Creta", "Audi")
  if (!matched) {
    const keywords = target.split(/[\s/,-]+/).filter(w => w.length >= 3 && !['self', 'drive', 'with', 'cars', 'car'].includes(w));
    if (keywords.length > 0) {
      matched = vehicles.find(v => {
        const vName = (v.name || '').toLowerCase();
        return keywords.some(kw => vName.includes(kw));
      });
    }
  }

  return matched || null;
}

/**
 * Calculates genuine upgrade difference for Self Drive vehicles.
 * Baseline vehicle included in the package costs ₹0 upgrade.
 * Only higher-priced upgrades charge the difference.
 */
export function calculateVehicleUpgradeCost(selectedVehicle, baselineVehicle, isSelfDrivePackage) {
  if (!selectedVehicle) return 0;
  if (!isSelfDrivePackage) {
    // If it's a regular tour package and user optionally adds self-drive
    return Number(selectedVehicle.price) || 0;
  }
  if (!baselineVehicle) {
    // Package includes a generic vehicle, default selected vehicle is included at no extra cost
    return 0;
  }
  if (String(selectedVehicle.id) === String(baselineVehicle.id)) {
    return 0;
  }
  const diff = (Number(selectedVehicle.price) || 0) - (Number(baselineVehicle.price) || 0);
  return Math.max(0, diff);
}
