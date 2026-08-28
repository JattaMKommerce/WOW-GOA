import React from 'react';

// ─── DYNAMIC HOTELS SECTION ───────────────────────────────────────────────────
// Displays live hotel data from booking system — NO fake/placeholder data
export default function FeaturedHotelsSection({ section, liveData = {}, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  
  // Dynamic Filtering Logic
  let hotels = liveData.hotels || [];
  const source = p.dataSource || 'featured';
  
  if (source === 'featured') {
    hotels = hotels.filter(h => h.featured);
    // If no featured, fallback to all
    if (hotels.length === 0) hotels = liveData.hotels || [];
  } else if (source === 'latest') {
    hotels = [...hotels].reverse(); // Simple approximation for latest
  } else if (source === 'popular') {
    hotels = [...hotels].sort((a, b) => (b.bookings || 0) - (a.bookings || 0));
  } else if (source === 'category' && p.dataCategory) {
    hotels = hotels.filter(h => h.type?.toLowerCase() === p.dataCategory.toLowerCase() || h.category?.toLowerCase() === p.dataCategory.toLowerCase());
  } else if (source === 'location' && p.dataLocation) {
    hotels = hotels.filter(h => h.location?.toLowerCase().includes(p.dataLocation.toLowerCase()) || h.city?.toLowerCase().includes(p.dataLocation.toLowerCase()));
  } else if (source === 'manual' && p.dataManualIds) {
    const ids = p.dataManualIds.split(',').map(id => id.trim());
    hotels = hotels.filter(h => ids.includes(h.id.toString()));
  }

  hotels = hotels.slice(0, p.limit || 6);

  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  const bgStyle = p.sectionBg
    ? { background: p.sectionBg }
    : { background: p.darkBg ? '#0D1B2E' : '#f8fafc' };

  return (
    <section style={{ padding: p.padding || '80px 24px', ...bgStyle, ...s }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <SectionHeader
          heading={p.heading || 'Featured Hotels'}
          subheading={p.subheading}
          align={p.textAlign || 'center'}
          primary={primary}
          dark={p.darkBg}
          cta={{ label: p.ctaLabel, action: 'hotels' }}
          onAction={onAction}
        />

        {hotels.length === 0 ? (
          <EmptyState message="No hotels added yet. Add hotels from the Hotel Management panel." />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: p.layout === 'list'
              ? '1fr'
              : p.layout === '2col'
              ? 'repeat(auto-fill, minmax(480px, 1fr))'
              : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px',
            marginTop: '48px'
          }}>
            {hotels.map(hotel => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                primary={primary}
                layout={p.layout}
                onBook={() => onAction && onAction('hotel-booking', hotel)}
                onView={() => onAction && onAction('hotel-view', hotel)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HotelCard({ hotel, primary, layout, onBook, onView }) {
  const stars = parseInt(hotel.stars) || 3;
  const price = hotel.price_per_night || hotel.pricePerNight || 0;
  const image = hotel.image_url || hotel.imageUrl || hotel.image || `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80`;

  if (layout === 'list') {
    return (
      <div style={{
        display: 'flex', gap: '20px', background: '#fff', borderRadius: '16px',
        overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'transform 0.3s, box-shadow 0.3s'
      }}>
        <img src={image} alt={hotel.name} style={{ width: '240px', objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ padding: '20px', flex: 1 }}>
          <HotelCardContent hotel={hotel} stars={stars} price={price} primary={primary} onBook={onBook} onView={onView} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
    >
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
        <img src={image} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          color: '#fff', padding: '4px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600
        }}>
          {'⭐'.repeat(Math.min(stars, 5))}
        </div>
        {hotel.featured && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'linear-gradient(135deg, #FF6333, #FF8A00)',
            color: '#fff', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700
          }}>
            FEATURED
          </div>
        )}
      </div>
      <div style={{ padding: '20px' }}>
        <HotelCardContent hotel={hotel} stars={stars} price={price} primary={primary} onBook={onBook} onView={onView} />
      </div>
    </div>
  );
}

function HotelCardContent({ hotel, stars, price, primary, onBook, onView }) {
  return (
    <>
      <div style={{ fontSize: '18px', fontWeight: 700, color: '#0D1B2E', marginBottom: '4px' }}>{hotel.name}</div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
        📍 {hotel.location || hotel.destination || 'Goa, India'}
      </div>
      {hotel.amenities && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {String(hotel.amenities).split(',').slice(0, 3).map((a, i) => (
            <span key={i} style={{
              background: '#f1f5f9', color: '#475569', padding: '3px 10px',
              borderRadius: '100px', fontSize: '11px', fontWeight: 500
            }}>{a.trim()}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
        <div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: primary }}>
            ₹{Number(price).toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>/night</span>
        </div>
        <button
          onClick={onBook}
          style={{
            padding: '9px 20px', background: `linear-gradient(135deg, ${primary}, #FF8A00)`,
            color: '#fff', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          Book Now
        </button>
      </div>
    </>
  );
}

// ─── DYNAMIC VEHICLES SECTION ───────────────────────────────────────────────────
export function FeaturedVehiclesSection({ section, liveData = {}, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  
  // Dynamic Filtering Logic
  let vehicles = [
    ...(liveData.cars || []).map(c => ({ ...c, vehicleType: 'car' })),
    ...(liveData.bikes || []).map(b => ({ ...b, vehicleType: 'bike' }))
  ];
  const source = p.dataSource || 'featured';
  
  if (source === 'featured') {
    vehicles = vehicles.filter(v => v.featured);
    if (vehicles.length === 0) vehicles = [
      ...(liveData.cars || []).map(c => ({ ...c, vehicleType: 'car' })),
      ...(liveData.bikes || []).map(b => ({ ...b, vehicleType: 'bike' }))
    ];
  } else if (source === 'latest') {
    vehicles = [...vehicles].reverse();
  } else if (source === 'popular') {
    vehicles = [...vehicles].sort((a, b) => (b.bookings || 0) - (a.bookings || 0));
  } else if (source === 'category' && p.dataCategory) {
    vehicles = vehicles.filter(v => v.type?.toLowerCase() === p.dataCategory.toLowerCase() || v.category?.toLowerCase() === p.dataCategory.toLowerCase());
  } else if (source === 'location' && p.dataLocation) {
    vehicles = vehicles.filter(v => v.location?.toLowerCase().includes(p.dataLocation.toLowerCase()) || v.city?.toLowerCase().includes(p.dataLocation.toLowerCase()));
  } else if (source === 'manual' && p.dataManualIds) {
    const ids = p.dataManualIds.split(',').map(id => id.trim());
    vehicles = vehicles.filter(v => ids.includes(v.id.toString()));
  }

  vehicles = vehicles.slice(0, p.limit || 8);
  
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  const bgStyle = p.sectionBg
    ? { background: p.sectionBg }
    : { background: p.darkBg ? '#0D1B2E' : '#ffffff' };

  return (
    <section style={{ padding: p.padding || '80px 24px', ...bgStyle, ...s }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <SectionHeader
          heading={p.heading || 'Our Fleet'}
          subheading={p.subheading}
          align={p.textAlign || 'center'}
          primary={primary}
          dark={p.darkBg}
          onAction={onAction}
          cta={{ label: p.ctaLabel, action: 'vehicles' }}
        />
        {vehicles.length === 0 ? (
          <EmptyState message="No vehicles added yet. Add vehicles from the Vehicle Management panel." />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px', marginTop: '48px'
          }}>
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} primary={primary} onBook={() => onAction && onAction('vehicle-booking', v)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function VehicleCard({ vehicle, primary, onBook }) {
  const price = vehicle.price_per_day || vehicle.pricePerDay || vehicle.daily_rate || 0;
  const image = vehicle.image_url || vehicle.imageUrl || vehicle.image || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80`;
  const type = vehicle.vehicleType === 'bike' ? '🏍️' : '🚗';

  return (
    <div style={{
      background: '#fff', borderRadius: '16px', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #f1f5f9',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
    >
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#f8fafc' }}>
        <img src={image} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <span style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: '100px', fontSize: '12px'
        }}>{type} {vehicle.vehicleType === 'bike' ? 'Bike' : 'Car'}</span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', color: '#0D1B2E', marginBottom: '4px' }}>{vehicle.name || vehicle.model}</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          {vehicle.fuel_type || vehicle.transmission || 'Auto'} • {vehicle.seats || '5'} seats
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: primary }}>₹{Number(price).toLocaleString('en-IN')}</span>
            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '3px' }}>/day</span>
          </div>
          <button onClick={onBook} style={{
            padding: '8px 16px', background: `linear-gradient(135deg, ${primary}, #FF8A00)`,
            color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
          }}>Book</button>
        </div>
      </div>
    </div>
  );
}

// ─── DYNAMIC PACKAGES SECTION ─────────────────────────────────────────────────
export function PackagesSection({ section, liveData = {}, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  
  // Dynamic Filtering Logic
  let packages = liveData.packages || [];
  const source = p.dataSource || 'featured';
  
  if (source === 'featured') {
    packages = packages.filter(pkg => pkg.featured);
    if (packages.length === 0) packages = liveData.packages || [];
  } else if (source === 'latest') {
    packages = [...packages].reverse();
  } else if (source === 'popular') {
    packages = [...packages].sort((a, b) => (b.bookings || 0) - (a.bookings || 0));
  } else if (source === 'category' && p.dataCategory) {
    packages = packages.filter(pkg => pkg.type?.toLowerCase() === p.dataCategory.toLowerCase() || pkg.category?.toLowerCase() === p.dataCategory.toLowerCase());
  } else if (source === 'location' && p.dataLocation) {
    packages = packages.filter(pkg => pkg.location?.toLowerCase().includes(p.dataLocation.toLowerCase()) || pkg.destination?.toLowerCase().includes(p.dataLocation.toLowerCase()));
  } else if (source === 'manual' && p.dataManualIds) {
    const ids = p.dataManualIds.split(',').map(id => id.trim());
    packages = packages.filter(pkg => ids.includes(pkg.id.toString()));
  }

  packages = packages.slice(0, p.limit || 6);

  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  const bgStyle = p.sectionBg
    ? { background: p.sectionBg }
    : { background: p.darkBg ? '#0D1B2E' : '#f8fafc' };

  return (
    <section style={{ padding: p.padding || '80px 24px', ...bgStyle, ...s }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <SectionHeader
          heading={p.heading || 'Popular Packages'}
          subheading={p.subheading}
          align={p.textAlign || 'center'}
          primary={primary}
          dark={p.darkBg}
          onAction={onAction}
          cta={{ label: p.ctaLabel, action: 'packages' }}
        />
        {packages.length === 0 ? (
          <EmptyState message="No packages added yet. Add packages from the Package Management panel." />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px', marginTop: '48px'
          }}>
            {packages.map(pkg => (
              <PackageCard key={pkg.id} pkg={pkg} primary={primary} onBook={() => onAction && onAction('package-booking', pkg)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PackageCard({ pkg, primary, onBook }) {
  const price = pkg.price || pkg.total_price || 0;
  const image = pkg.image_url || pkg.imageUrl || pkg.image || `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80`;

  return (
    <div style={{
      background: '#fff', borderRadius: '20px', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
    >
      <div style={{ position: 'relative', height: '220px' }}>
        <img src={image} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        {pkg.duration && (
          <div style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(255,99,51,0.9)', color: '#fff',
            padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700
          }}>
            {pkg.duration}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '12px', left: '16px', right: '16px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{pkg.name}</div>
          {pkg.destination && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>📍 {pkg.destination}</div>}
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        {pkg.description && (
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '16px' }}>
            {String(pkg.description).slice(0, 120)}{pkg.description?.length > 120 ? '...' : ''}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Starting from</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: primary }}>₹{Number(price).toLocaleString('en-IN')}</div>
          </div>
          <button onClick={onBook} style={{
            padding: '10px 24px', background: `linear-gradient(135deg, ${primary}, #FF8A00)`,
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
          }}>Book Now</button>
        </div>
      </div>
    </div>
  );
}

// ─── SHARED UTILITIES ─────────────────────────────────────────────────────────
export function SectionHeader({ heading, subheading, align = 'center', primary, dark, cta, onAction }) {
  return (
    <div style={{ textAlign: align, marginBottom: '8px' }}>
      <h2 style={{
        fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
        color: dark ? '#fff' : '#0D1B2E',
        marginBottom: '14px', lineHeight: 1.2
      }}>
        {heading}
      </h2>
      {subheading && (
        <p style={{
          fontSize: '17px', color: dark ? 'rgba(255,255,255,0.7)' : '#64748b',
          lineHeight: 1.6, maxWidth: '600px',
          margin: align === 'center' ? '0 auto' : '0',
          marginBottom: cta?.label ? '20px' : '0'
        }}>
          {subheading}
        </p>
      )}
      {cta?.label && (
        <button
          onClick={() => onAction && onAction(cta.action)}
          style={{
            marginTop: '16px', padding: '10px 28px',
            background: primary, color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 24px', marginTop: '40px',
      background: 'rgba(241,245,249,0.8)', borderRadius: '16px',
      border: '2px dashed #cbd5e1'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
      <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>{message}</p>
    </div>
  );
}

// FeaturedHotelsSection is already the default export at the top of this file
