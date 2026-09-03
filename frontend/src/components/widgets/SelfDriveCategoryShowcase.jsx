import React, { useRef, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Bike, Car, Crown, Sparkles, Star } from 'lucide-react';

// ─── CURATED VEHICLE FLEET DATA (Matching Reference Layout & Fallbacks) ────────
const DEFAULT_TWO_WHEELERS = [
  {
    id: 'bike-def-1',
    name: 'Royal Enfield Classic 350',
    category: 'Cruiser',
    price: 500,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '350cc',
    type: 'bike'
  },
  {
    id: 'bike-def-2',
    name: 'Yamaha R15 V4',
    category: 'Sports',
    price: 450,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '155cc',
    type: 'bike'
  },
  {
    id: 'bike-def-3',
    name: 'Honda Activa 6G',
    category: 'Scooter',
    price: 300,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '110cc',
    type: 'bike'
  },
  {
    id: 'bike-def-4',
    name: 'TVS Jupiter 125',
    category: 'Scooter',
    price: 350,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '125cc',
    type: 'bike'
  },
  {
    id: 'bike-def-5',
    name: 'Suzuki Access 125',
    category: 'Scooter',
    price: 350,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '125cc',
    type: 'bike'
  },
  {
    id: 'bike-def-6',
    name: 'Bajaj Pulsar NS200',
    category: 'Sports',
    price: 400,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '200cc',
    type: 'bike'
  },
  {
    id: 'bike-def-7',
    name: 'Royal Enfield Himalayan 450',
    category: 'Adventure',
    price: 1100,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '450cc',
    type: 'bike'
  },
  {
    id: 'bike-def-8',
    name: 'Kawasaki Ninja H2R',
    category: 'Superbike',
    price: 4000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    engine: '1000cc',
    type: 'bike'
  }
];

const DEFAULT_FOUR_WHEELERS = [
  {
    id: 'car-def-1',
    name: 'Maruti Swift',
    category: 'Hatchback',
    price: 1200,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Manual',
    type: 'car'
  },
  {
    id: 'car-def-2',
    name: 'Hyundai i20',
    category: 'Hatchback',
    price: 1400,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Manual',
    type: 'car'
  },
  {
    id: 'car-def-3',
    name: 'Tata Nexon',
    category: 'Compact SUV',
    price: 1600,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    fuel: 'Diesel',
    seating: '5 Seater',
    transmission: 'Manual',
    type: 'car'
  },
  {
    id: 'car-def-4',
    name: 'Kia Sonet',
    category: 'Compact SUV',
    price: 1800,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'car-def-5',
    name: 'Hyundai Creta',
    category: 'SUV',
    price: 2200,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
    fuel: 'Diesel',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'car-def-6',
    name: 'Toyota Innova Crysta',
    category: 'MUV',
    price: 2800,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
    fuel: 'Diesel',
    seating: '7 Seater',
    transmission: 'Manual',
    type: 'car'
  },
  {
    id: 'car-def-7',
    name: 'Mahindra Thar 4x4',
    category: 'SUV / 4x4',
    price: 3200,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    fuel: 'Diesel',
    seating: '4 Seater',
    transmission: 'Manual',
    type: 'car'
  },
  {
    id: 'car-def-8',
    name: 'Maruti Suzuki Ertiga',
    category: 'MUV',
    price: 2800,
    rating: 4.75,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '7 Seater',
    transmission: 'Manual',
    type: 'car'
  }
];

const DEFAULT_LUXURY_CARS = [
  {
    id: 'lux-def-1',
    name: 'BMW 3 Series',
    category: 'Luxury Sedan',
    price: 4500,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'lux-def-2',
    name: 'Mercedes-Benz C-Class',
    category: 'Luxury Sedan',
    price: 5500,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'lux-def-3',
    name: 'Audi A4',
    category: 'Luxury Sedan',
    price: 5000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'lux-def-4',
    name: 'BMW X1',
    category: 'Luxury SUV',
    price: 6000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=600&q=80',
    fuel: 'Diesel',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'lux-def-5',
    name: 'Mercedes-Benz CLA',
    category: 'Luxury Coupe',
    price: 6000,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'lux-def-6',
    name: 'Audi Q3',
    category: 'Luxury SUV',
    price: 5800,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'lux-def-7',
    name: 'Toyota Fortuner 4x4 AT',
    category: 'Luxury SUV',
    price: 5500,
    rating: 4.95,
    image: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?auto=format&fit=crop&w=600&q=80',
    fuel: 'Diesel',
    seating: '7 Seater',
    transmission: 'Automatic',
    type: 'car'
  },
  {
    id: 'lux-def-8',
    name: 'Land Rover Defender',
    category: 'Luxury 4x4',
    price: 10000,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    fuel: 'Petrol',
    seating: '5 Seater',
    transmission: 'Automatic',
    type: 'car'
  }
];

function isBike(item) {
  if (!item) return false;
  if (item._type === 'bike' || item.type === 'bike') return true;
  const cat = (item.category || '').toLowerCase();
  if (cat.includes('bike') || cat.includes('scooter') || cat.includes('moped') || cat.includes('cruiser') || cat.includes('superbike')) return true;
  const name = (item.name || '').toLowerCase();
  if (name.includes('ninja') || name.includes('activa') || name.includes('jupiter') || name.includes('bullet') || name.includes('ktm') || name.includes('duke') || name.includes('r15') || name.includes('pulsar') || name.includes('access') || name.includes('himalayan') || name.includes('gt')) return true;
  return false;
}

function isLuxuryCar(item) {
  if (!item || isBike(item)) return false;
  const price = parseFloat(item.price) || 0;
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  if (cat.includes('luxury') || cat.includes('vip') || cat.includes('premium') || cat.includes('supercar')) return true;
  if (name.includes('bmw') || name.includes('mercedes') || name.includes('audi') || name.includes('defender') || name.includes('fortuner') || name.includes('jaguar') || name.includes('range rover')) return true;
  if (price >= 4000) return true;
  return false;
}

// ─── INDIVIDUAL CATEGORY ROW ──────────────────────────────────────────────────
function CategoryRow({
  badgeGradient,
  badgeIcon: BadgeIcon,
  badgeTitle,
  badgeSubtitle,
  vehicles = [],
  onViewAll,
  onBookVehicle,
  onViewVehicle
}) {
  const scrollContainerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const pauseTimerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Triple the list to create a seamless, continuous 2-way infinite slide
  const loopVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    return [...vehicles, ...vehicles, ...vehicles];
  }, [vehicles]);

  const pauseAutoScroll = (duration = 3500) => {
    isInteractingRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, duration);
  };

  // Continuous auto-slide forward with seamless looping
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || loopVehicles.length === 0) return;

    // Set initial scroll position to middle set for smooth 2-way navigation
    const initTimer = setTimeout(() => {
      if (el && el.scrollWidth > el.clientWidth && el.scrollLeft < 10) {
        const singleSet = el.scrollWidth / 3;
        el.scrollLeft = singleSet;
      }
    }, 150);

    let animId;
    let lastTime = performance.now();
    const speed = 0.55; // buttery smooth steady glide

    const step = (now) => {
      const delta = now - lastTime;
      lastTime = now;

      if (!isInteractingRef.current && !isDraggingRef.current && el && el.scrollWidth > el.clientWidth) {
        const factor = Math.min(delta / 16.67, 2.0);
        el.scrollLeft += speed * factor;

        const singleSet = el.scrollWidth / 3;
        if (singleSet > 50) {
          if (el.scrollLeft >= singleSet * 2) {
            el.scrollLeft -= singleSet;
          } else if (el.scrollLeft <= 5) {
            el.scrollLeft += singleSet;
          }
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      clearTimeout(initTimer);
      if (animId) cancelAnimationFrame(animId);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [loopVehicles]);

  const handleScrollLeft = () => {
    pauseAutoScroll(4000);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    pauseAutoScroll(4000);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Mouse Drag to Scroll handlers
  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
    pauseAutoScroll(5000);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      pauseAutoScroll(3000);
    }
  };

  return (
    <div 
      className="sd-category-row-card shadow-sm mb-4"
      onMouseEnter={() => { isInteractingRef.current = true; }}
      onMouseLeave={() => { 
        handleMouseUpOrLeave();
        pauseAutoScroll(1500); 
      }}
    >
      {/* ─── Left Brand / Category Banner ─── */}
      <div 
        className="sd-category-banner"
        style={{ background: badgeGradient }}
      >
        <div className="sd-category-icon-wrap">
          <BadgeIcon size={36} strokeWidth={2.4} className="text-white" />
        </div>
        <div className="sd-category-info">
          <h3 className="sd-category-title">{badgeTitle}</h3>
          <p className="sd-category-subtitle mb-0">{badgeSubtitle}</p>
        </div>
      </div>

      {/* ─── Slider & Vehicle Cards Section ─── */}
      <div className="sd-slider-wrapper">
        {/* Left Arrow Button */}
        <button 
          type="button" 
          className="sd-nav-btn sd-nav-btn-left" 
          onClick={handleScrollLeft}
          aria-label={`Scroll ${badgeTitle} left`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Top-Right "View All >" Link */}
        <div className="sd-view-all-container">
          <button 
            type="button" 
            className="sd-view-all-link"
            onClick={onViewAll}
          >
            View All &gt;
          </button>
        </div>

        {/* Horizontal Vehicle Cards Track */}
        <div 
          className="sd-cards-scroll-track" 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onTouchStart={() => pauseAutoScroll(5000)}
          onTouchEnd={() => pauseAutoScroll(2500)}
          style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
        >
          {loopVehicles.map((v, idx) => (
            <div 
              key={`${v.id || 'v'}-${idx}`} 
              className="sd-vehicle-card"
              onClick={(e) => {
                if (hasDraggedRef.current) {
                  e.preventDefault();
                  return;
                }
                if (onBookVehicle) onBookVehicle(v);
                else if (onViewVehicle) onViewVehicle(v);
              }}
            >
              {/* Vehicle Image */}
              <div className="sd-card-img-wrap">
                <img 
                  src={v.image || (isBike(v) ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500' : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500')} 
                  alt={v.name}
                  className="sd-card-img"
                  loading="lazy"
                  draggable={false}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = isBike(v) ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500' : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500';
                  }}
                />
              </div>

              {/* Vehicle Name */}
              <div className="sd-card-title" title={v.name}>
                {v.name}
              </div>

              {/* Price and Rating Row */}
              <div className="sd-card-meta">
                <span className="sd-card-price">
                  ₹{Number(v.price || 0).toLocaleString('en-IN')} <span className="sd-card-per">/ day</span>
                </span>
                <span className="sd-card-rating">
                  <Star size={12} className="sd-star-icon" fill="#10B981" color="#10B981" />
                  <span className="sd-rating-num">{v.rating || 4.8}</span>
                </span>
              </div>

              {/* Little dash indicator */}
              <div className="sd-dash-indicator-wrap">
                <span className={`sd-dash ${idx % 3 === 0 ? 'active' : ''}`} />
                <span className={`sd-dash ${idx % 3 === 1 ? 'active' : ''}`} />
                <span className={`sd-dash ${idx % 3 === 2 ? 'active' : ''}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button 
          type="button" 
          className="sd-nav-btn sd-nav-btn-right" 
          onClick={handleScrollRight}
          aria-label={`Scroll ${badgeTitle} right`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── MAIN SELF DRIVE CATEGORY SHOWCASE COMPONENT ─────────────────────────────
export default function SelfDriveCategoryShowcase({
  cars = [],
  bikes = [],
  onBookVehicle,
  onViewVehicle,
  setActiveTab,
  searchQuery = ''
}) {
  // 1. Process Two Wheelers (incoming live bikes + curated defaults)
  const twoWheelers = useMemo(() => {
    const liveBikes = (bikes || []).map(b => ({ ...b, type: 'bike' }));
    const extraBikesFromCars = (cars || []).filter(c => isBike(c)).map(c => ({ ...c, type: 'bike' }));
    const combinedLive = [...liveBikes, ...extraBikesFromCars];
    
    // Merge live with defaults, ensuring no exact name duplicates
    const namesSeen = new Set();
    const result = [];
    
    combinedLive.forEach(b => {
      if (b.name && !namesSeen.has(b.name.toLowerCase().trim())) {
        namesSeen.add(b.name.toLowerCase().trim());
        result.push(b);
      }
    });

    DEFAULT_TWO_WHEELERS.forEach(b => {
      if (!namesSeen.has(b.name.toLowerCase().trim())) {
        namesSeen.add(b.name.toLowerCase().trim());
        result.push(b);
      }
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return result.filter(v => v.name.toLowerCase().includes(q) || (v.category || '').toLowerCase().includes(q));
    }
    return result;
  }, [bikes, cars, searchQuery]);

  // 2. Process Four Wheelers (Standard non-luxury cars + curated defaults)
  const fourWheelers = useMemo(() => {
    const liveStandardCars = (cars || []).filter(c => !isBike(c) && !isLuxuryCar(c)).map(c => ({ ...c, type: 'car' }));
    
    const namesSeen = new Set();
    const result = [];

    liveStandardCars.forEach(c => {
      if (c.name && !namesSeen.has(c.name.toLowerCase().trim())) {
        namesSeen.add(c.name.toLowerCase().trim());
        result.push(c);
      }
    });

    DEFAULT_FOUR_WHEELERS.forEach(c => {
      if (!namesSeen.has(c.name.toLowerCase().trim())) {
        namesSeen.add(c.name.toLowerCase().trim());
        result.push(c);
      }
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return result.filter(v => v.name.toLowerCase().includes(q) || (v.category || '').toLowerCase().includes(q));
    }
    return result;
  }, [cars, searchQuery]);

  // 3. Process Luxury Cars (Luxury cars + curated defaults)
  const luxuryCars = useMemo(() => {
    const liveLuxuryCars = (cars || []).filter(c => isLuxuryCar(c)).map(c => ({ ...c, type: 'car' }));
    
    const namesSeen = new Set();
    const result = [];

    liveLuxuryCars.forEach(c => {
      if (c.name && !namesSeen.has(c.name.toLowerCase().trim())) {
        namesSeen.add(c.name.toLowerCase().trim());
        result.push(c);
      }
    });

    DEFAULT_LUXURY_CARS.forEach(c => {
      if (!namesSeen.has(c.name.toLowerCase().trim())) {
        namesSeen.add(c.name.toLowerCase().trim());
        result.push(c);
      }
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      return result.filter(v => v.name.toLowerCase().includes(q) || (v.category || '').toLowerCase().includes(q));
    }
    return result;
  }, [cars, searchQuery]);

  const handleViewAllBikes = () => {
    if (setActiveTab) setActiveTab('bikes');
    else {
      const el = document.getElementById('results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewAllCars = () => {
    if (setActiveTab) setActiveTab('cars');
    else {
      const el = document.getElementById('results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleViewAllLuxury = () => {
    if (setActiveTab) setActiveTab('cars');
    else {
      const el = document.getElementById('results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="sd-category-showcase-section" id="self-drive-categories">
      <div className="container px-md-3">
        {/* Row 1: Two Wheelers (Orange gradient) */}
        <CategoryRow
          badgeGradient="linear-gradient(135deg, #FF6026 0%, #FF833E 100%)"
          badgeIcon={Bike}
          badgeTitle="Two Wheelers"
          badgeSubtitle="Ride in style"
          vehicles={twoWheelers}
          onViewAll={handleViewAllBikes}
          onBookVehicle={onBookVehicle}
          onViewVehicle={onViewVehicle}
        />

        {/* Row 2: Four Wheelers (Blue gradient) */}
        <CategoryRow
          badgeGradient="linear-gradient(135deg, #0284C7 0%, #2563EB 100%)"
          badgeIcon={Car}
          badgeTitle="Four Wheelers"
          badgeSubtitle="Comfort for every trip"
          vehicles={fourWheelers}
          onViewAll={handleViewAllCars}
          onBookVehicle={onBookVehicle}
          onViewVehicle={onViewVehicle}
        />

        {/* Row 3: Luxury Cars (Purple / Violet gradient) */}
        <CategoryRow
          badgeGradient="linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)"
          badgeIcon={Crown}
          badgeTitle="Luxury Cars"
          badgeSubtitle="Live the experience"
          vehicles={luxuryCars}
          onViewAll={handleViewAllLuxury}
          onBookVehicle={onBookVehicle}
          onViewVehicle={onViewVehicle}
        />
      </div>
    </section>
  );
}
