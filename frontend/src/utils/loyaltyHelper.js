// frontend/src/utils/loyaltyHelper.js

/**
 * Authoritative Client-Side Mirror of Loyalty Tier Calculation for WOW GOA
 * Categories: Car Tier (Cars/Bikes), Hotel Tier (Hotel Stays), Trip Tier (Packages/Tours)
 * Only Completed bookings count.
 * Progression: Bronze (1-3) -> Silver (4-6) -> Gold (7-9) -> Platinum (10+)
 */

export function calculateLoyaltyTiers(bookings = []) {
  const completedList = (bookings || []).filter(b => (b.status || '').toLowerCase() === 'completed');

  let carCount = 0;
  let hotelCount = 0;
  let tripCount = 0;

  completedList.forEach(b => {
    const type = (b.type || '').toLowerCase();
    const pkgType = (b.package_type || '').toLowerCase();
    const itemName = (b.item_name || '').toLowerCase();
    const hotelName = (b.hotel_name || '').toLowerCase();
    const vehicleName = (b.vehicle_name || '').toLowerCase();

    if (type === 'hotel' || Boolean(hotelName) || pkgType.includes('hotel') || itemName.includes('hotel') || itemName.includes('resort')) {
      hotelCount++;
    } else if (type === 'car' || type === 'bike' || Boolean(vehicleName) || pkgType.includes('rental') || pkgType.includes('car') || pkgType.includes('bike') || pkgType.includes('vehicle')) {
      carCount++;
    } else {
      tripCount++;
    }
  });

  const getTierData = (count, categoryName) => {
    if (count >= 10) {
      return {
        category: categoryName,
        count: count,
        tier: 'Platinum',
        tier_name: 'Platinum',
        badge: '💎 Platinum',
        icon: '💎',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
        target: 10,
        remaining: 0,
        progress: 100,
        is_platinum: true,
        description: '10+ Completed Bookings (Highest Tier)'
      };
    } else if (count >= 7) {
      const remaining = 10 - count;
      return {
        category: categoryName,
        count: count,
        tier: 'Gold',
        tier_name: 'Gold',
        badge: '🥇 Gold',
        icon: '🥇',
        color: '#eab308',
        gradient: 'linear-gradient(135deg, #ca8a04 0%, #eab308 100%)',
        target: 10,
        remaining: remaining,
        progress: Math.round((count / 10) * 100),
        is_platinum: false,
        description: `${remaining} more completed booking${remaining > 1 ? 's' : ''} to reach Platinum`
      };
    } else if (count >= 4) {
      const remaining = 7 - count;
      return {
        category: categoryName,
        count: count,
        tier: 'Silver',
        tier_name: 'Silver',
        badge: '🥈 Silver',
        icon: '🥈',
        color: '#94a3b8',
        gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)',
        target: 7,
        remaining: remaining,
        progress: Math.round((count / 7) * 100),
        is_platinum: false,
        description: `${remaining} more completed booking${remaining > 1 ? 's' : ''} to reach Gold`
      };
    } else if (count >= 1) {
      const remaining = 4 - count;
      return {
        category: categoryName,
        count: count,
        tier: 'Bronze',
        tier_name: 'Bronze',
        badge: '🥉 Bronze',
        icon: '🥉',
        color: '#cd7f32',
        gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
        target: 4,
        remaining: remaining,
        progress: Math.round((count / 4) * 100),
        is_platinum: false,
        description: `${remaining} more completed booking${remaining > 1 ? 's' : ''} to reach Silver`
      };
    } else {
      return {
        category: categoryName,
        count: 0,
        tier: 'Bronze',
        tier_name: 'Bronze',
        badge: '🥉 Bronze (New Member)',
        icon: '🥉',
        color: '#94a3b8',
        gradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)',
        target: 1,
        remaining: 1,
        progress: 0,
        is_platinum: false,
        description: '1 completed booking to activate Bronze'
      };
    }
  };

  const carTier = getTierData(carCount, 'Car Tier');
  const hotelTier = getTierData(hotelCount, 'Hotel Tier');
  const tripTier = getTierData(tripCount, 'Trip Tier');

  const tierRanks = { 'Bronze': 1, 'Silver': 2, 'Gold': 3, 'Platinum': 4 };
  let highestTier = 'Bronze';
  let maxRank = 1;
  [carTier.tier, hotelTier.tier, tripTier.tier].forEach(t => {
    if ((tierRanks[t] || 1) > maxRank) {
      maxRank = tierRanks[t];
      highestTier = t;
    }
  });

  return {
    car: carTier,
    hotel: hotelTier,
    trip: tripTier,
    highest_tier: highestTier,
    total_completed: completedList.length
  };
}

export function formatBirthdayDisplay(dateOfBirth) {
  if (!dateOfBirth) return 'Not set';
  try {
    const d = new Date(dateOfBirth);
    if (!isNaN(d.getTime())) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }
    const parts = dateOfBirth.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const day = parts[0].length === 4 ? parts[2] : parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      if (mIdx >= 0 && mIdx < 12) {
        return `${parseInt(day, 10)} ${months[mIdx]}`;
      }
    }
  } catch (e) {}
  return dateOfBirth;
}
