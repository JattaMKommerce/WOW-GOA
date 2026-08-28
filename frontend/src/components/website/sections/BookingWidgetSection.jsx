import React, { useState } from 'react';

// ─── BOOKING WIDGET SECTION ───────────────────────────────────────────────────
// Connects to existing booking engine. Tabs: hotels, self-drive, packages, flights
export default function BookingWidgetSection({ section, liveData = {}, onAction }) {
  const p = section.props || {};
  const s = section.style || {};
  const [activeTab, setActiveTab] = useState(p.defaultTab || 'hotels');

  const tabs = [
    { id: 'hotels', label: '🏨 Hotels', icon: '🏨' },
    { id: 'selfdrive', label: '🚗 Self Drive', icon: '🚗' },
    { id: 'packages', label: '🧳 Packages', icon: '🧳' },
    { id: 'flights', label: '✈️ Flights', icon: '✈️' }
  ].filter(t => {
    if (!p.showTabs) return t.id === p.defaultTab;
    return true;
  });

  const tabBg = p.backgroundColor || '#ffffff';
  const primary = p.primaryColor || 'var(--wb-primary, #FF6333)';

  return (
    <section id="search-widget" style={{
      padding: p.padding || '40px 24px',
      background: p.sectionBg || 'transparent',
      ...s
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Glassmorphic search card */}
        <div style={{
          background: tabBg,
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          {/* Tab bar */}
          {p.showTabs !== false && (
            <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '16px 12px',
                    border: 'none',
                    background: activeTab === tab.id ? '#fff' : 'transparent',
                    color: activeTab === tab.id ? primary : '#64748b',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? `3px solid ${primary}` : '3px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Search form */}
          <div style={{ padding: '24px' }}>
            {activeTab === 'hotels' && <HotelSearchForm onAction={onAction} primary={primary} />}
            {activeTab === 'selfdrive' && <VehicleSearchForm onAction={onAction} primary={primary} />}
            {activeTab === 'packages' && <PackageSearchForm onAction={onAction} primary={primary} />}
            {activeTab === 'flights' && <FlightSearchForm onAction={onAction} primary={primary} />}
          </div>
        </div>
      </div>
    </section>
  );
}

import { getTodayDateStr, getNextDayDateStr, addDays, validateBookingDates } from '../../../utils/dateUtils';

function SearchInput({ label, placeholder, icon, value, onChange, type = 'text', min }) {
  return (
    <div style={{ flex: 1, minWidth: '140px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        {icon} {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value || ''}
        onChange={onChange}
        min={min}
        style={{
          width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0',
          borderRadius: '10px', fontSize: '14px', color: '#0D1B2E',
          background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
          fontFamily: 'inherit'
        }}
      />
    </div>
  );
}

function SearchBtn({ label, primary, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 28px', background: `linear-gradient(135deg, ${primary}, #FF8A00)`,
        color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px',
        fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        boxShadow: `0 4px 15px rgba(255,99,51,0.3)`, alignSelf: 'flex-end'
      }}
    >
      {label}
    </button>
  );
}

function HotelSearchForm({ onAction, primary }) {
  const todayStr = getTodayDateStr();
  const [dest, setDest] = useState(''); 
  const [cin, setCin] = useState(() => getTodayDateStr()); 
  const [cout, setCout] = useState(() => addDays(getTodayDateStr(), 2)); 
  const [rooms, setRooms] = useState('1');

  const handleCinChange = (val) => {
    setCin(val);
    if (!cout || cout <= val) {
      setCout(getNextDayDateStr(val));
    }
  };

  const handleCoutChange = (val) => {
    if (val <= cin) {
      alert("Check-out date must be after check-in date.");
      setCout(getNextDayDateStr(cin));
      return;
    }
    setCout(val);
  };

  const handleHotelSearch = () => {
    const val = validateBookingDates(cin, cout, { allowSameDay: false });
    if (!val.valid) {
      alert(val.error);
      return;
    }
    if (onAction) onAction('hotel-search', { dest, cin, cout, rooms });
  };

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <SearchInput label="Destination" placeholder="Where are you going?" icon="📍" value={dest} onChange={e => setDest(e.target.value)} />
      <SearchInput 
        label="Check-in" 
        placeholder="Select date" 
        icon="📅" 
        type="date" 
        min={todayStr}
        value={cin} 
        onChange={e => handleCinChange(e.target.value)} 
      />
      <SearchInput 
        label="Check-out" 
        placeholder="Select date" 
        icon="📅" 
        type="date" 
        min={getNextDayDateStr(cin || todayStr)}
        value={cout} 
        onChange={e => handleCoutChange(e.target.value)} 
      />
      <SearchInput label="Rooms" placeholder="1 Room, 2 Adults" icon="🛏️" value={rooms} onChange={e => setRooms(e.target.value)} />
      <SearchBtn label="Search Hotels" primary={primary} onClick={handleHotelSearch} />
    </div>
  );
}

function VehicleSearchForm({ onAction, primary }) {
  const todayStr = getTodayDateStr();
  const [pickup, setPickup] = useState(''); 
  const [pdate, setPdate] = useState(() => getTodayDateStr()); 
  const [ddate, setDdate] = useState(() => addDays(getTodayDateStr(), 2));

  const handlePdateChange = (val) => {
    setPdate(val);
    if (!ddate || ddate < val) {
      setDdate(val);
    }
  };

  const handleVehicleSearch = () => {
    const val = validateBookingDates(pdate, ddate, { allowSameDay: true });
    if (!val.valid) {
      alert(val.error);
      return;
    }
    if (onAction) onAction('vehicle-search', { pickup, pdate, ddate });
  };

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <SearchInput label="Pickup Location" placeholder="Select city" icon="📍" value={pickup} onChange={e => setPickup(e.target.value)} />
      <SearchInput 
        label="Pickup Date & Time" 
        placeholder="Date" 
        icon="📅" 
        type="date" 
        min={todayStr}
        value={pdate} 
        onChange={e => handlePdateChange(e.target.value)} 
      />
      <SearchInput 
        label="Return Date & Time" 
        placeholder="Date" 
        icon="📅" 
        type="date" 
        min={pdate || todayStr}
        value={ddate} 
        onChange={e => setDdate(e.target.value)} 
      />
      <SearchBtn label="Search Vehicles" primary={primary} onClick={handleVehicleSearch} />
    </div>
  );
}

function PackageSearchForm({ onAction, primary }) {
  const [dest, setDest] = useState(''); const [dur, setDur] = useState(''); const [people, setPeople] = useState('');
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <SearchInput label="Destination" placeholder="Where to?" icon="🌍" value={dest} onChange={e => setDest(e.target.value)} />
      <SearchInput label="Duration" placeholder="e.g. 3 nights" icon="🗓️" value={dur} onChange={e => setDur(e.target.value)} />
      <SearchInput label="Travelers" placeholder="2 Adults" icon="👥" value={people} onChange={e => setPeople(e.target.value)} />
      <SearchBtn label="Search Packages" primary={primary} onClick={() => onAction && onAction('package-search', { dest, dur, people })} />
    </div>
  );
}

function FlightSearchForm({ onAction, primary }) {
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [dep, setDep] = useState(''); const [pax, setPax] = useState('1');
  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <SearchInput label="From" placeholder="Origin city or airport" icon="🛫" value={from} onChange={e => setFrom(e.target.value)} />
      <SearchInput label="To" placeholder="Destination" icon="🛬" value={to} onChange={e => setTo(e.target.value)} />
      <SearchInput label="Departure" placeholder="Date" icon="📅" type="date" value={dep} onChange={e => setDep(e.target.value)} />
      <SearchInput label="Passengers" placeholder="1 Adult" icon="👤" value={pax} onChange={e => setPax(e.target.value)} />
      <SearchBtn label="Search Flights" primary={primary} onClick={() => onAction && onAction('flight-search', { from, to, dep, pax })} />
    </div>
  );
}
