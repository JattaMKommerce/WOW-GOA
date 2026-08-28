import React, { useState } from 'react';
import { CreditCard, Save, Percent, IndianRupee, PieChart, Users, Plane, Hotel } from 'lucide-react';

export default function AdminMarkupPanel({ markups = [], onSaveMarkup, vendors = [], bookings = [], flights = [], hotels = [], cars = [], bikes = [], packages = [] }) {
  const [entityType, setEntityType] = useState('flights');
  const [vendorId, setVendorId] = useState('global');
  const [itemId, setItemId] = useState('all');
  const [markupType, setMarkupType] = useState('flat');
  const [markupValue, setMarkupValue] = useState('');

  const handleEntityTypeChange = (type) => {
    setEntityType(type);
    setItemId('all');
  };

  const currentMarkup = (markups || []).find(m => m.entity_type === entityType && m.vendor_id === vendorId && (m.item_id || 'all') === itemId);

  React.useEffect(() => {
    if (currentMarkup) {
      setMarkupType(currentMarkup.markup_type || 'flat');
      setMarkupValue(currentMarkup.markup_value || '');
    } else {
      setMarkupType('flat');
      setMarkupValue('');
    }
  }, [currentMarkup]);
  
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (markupValue === '') return;
    setSubmitting(true);
    try {
      await onSaveMarkup({
        entity_type: entityType,
        vendor_id: vendorId,
        item_id: itemId,
        markup_type: markupType,
        markup_value: markupValue
      });
      alert('Markup saved successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Simple reports calculation
  const getSales = (type) => {
    // Filter bookings by type: flight or hotel or car or bike or package
    const filteredBookings = bookings.filter(b => {
      if (!b.item_name) return false;
      if (type === 'flights') return b.item_name.includes('Flight') || b.item_id?.startsWith('FL-');
      if (type === 'hotels') return b.item_name.includes('Hotel') || b.item_id?.startsWith('hotel-');
      if (type === 'cars') return b.item_id?.startsWith('car-') && !b.item_id?.includes('bike');
      if (type === 'bikes') return b.item_id?.startsWith('bike-');
      if (type === 'packages') return !b.item_id?.startsWith('FL-') && !b.item_id?.startsWith('hotel-') && !b.item_id?.startsWith('car-') && !b.item_id?.startsWith('bike-') && !b.item_id?.startsWith('off_');
      return false;
    });
    const totalSales = filteredBookings.reduce((sum, b) => sum + parseInt(b.total_paid || 0), 0);
    return { count: filteredBookings.length, total: totalSales };
  };

  const flightSales = getSales('flights');
  const hotelSales = getSales('hotels');
  const carSales = getSales('cars');
  const bikeSales = getSales('bikes');
  const packageSales = getSales('packages');

  return (
    <div className="row g-4 animate-fade-in-up">
      <div className="col-12">
        <h4 className="fw-extrabold mb-3 text-dark font-heading">Markup & Revenue Management</h4>
        <p className="text-secondary mb-4">Set pricing markups on vendor items and track your sales performance.</p>
      </div>

      <div className="col-lg-7">
        <div className="card luxury-card p-4">
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
            <CreditCard size={20} className="text-primary" /> Set Markups
          </h5>
          <form onSubmit={handleSave}>
            <div className="row g-3">
              <div className="col-md-6 mb-3">
                <label className="form-label small fw-bold text-secondary">Service Type</label>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className={`btn flex-grow-1 ${entityType === 'flights' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => handleEntityTypeChange('flights')}>
                    Flights
                  </button>
                  <button type="button" className={`btn flex-grow-1 ${entityType === 'hotels' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleEntityTypeChange('hotels')}>
                    Hotels
                  </button>
                  <button type="button" className={`btn flex-grow-1 ${entityType === 'cars' ? 'btn-info text-white' : 'btn-outline-info'}`} onClick={() => handleEntityTypeChange('cars')}>
                    Cars
                  </button>
                  <button type="button" className={`btn flex-grow-1 ${entityType === 'bikes' ? 'btn-warning text-white' : 'btn-outline-warning'}`} onClick={() => handleEntityTypeChange('bikes')}>
                    Bikes
                  </button>
                  <button type="button" className={`btn flex-grow-1 ${entityType === 'packages' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => handleEntityTypeChange('packages')}>
                    Packages
                  </button>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small fw-bold text-secondary">Apply To</label>
                <select className="form-select premium-input-field" value={vendorId} onChange={e => setVendorId(e.target.value)}>
                  <option value="global">All Vendors (Global Default)</option>
                  {vendors.filter(v => v.role === (entityType === 'flights' ? 'flight_vendor' : (entityType === 'hotels' ? 'hotel_vendor' : 'vendor'))).map(v => (
                    <option key={v.id} value={v.id}>{v.username} (Specific Vendor)</option>
                  ))}
                </select>
              </div>

              <div className="col-md-12 mb-3">
                <label className="form-label small fw-bold text-secondary">Apply To Specific Item</label>
                <select className="form-select premium-input-field" value={itemId} onChange={e => setItemId(e.target.value)}>
                  <option value="all">All Items (Global for this Vendor)</option>
                  {entityType === 'hotels' && hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name} - ₹{h.price}</option>
                  ))}
                  {entityType === 'flights' && flights.map(f => (
                    <option key={f.id} value={f.id}>{f.airline} - {f.flight_number} ({f.from_loc} to {f.to_loc})</option>
                  ))}
                  {entityType === 'cars' && cars.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - ₹{c.price}</option>
                  ))}
                  {entityType === 'bikes' && bikes.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - ₹{b.price}</option>
                  ))}
                  {entityType === 'packages' && packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.package_type})</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small fw-bold text-secondary">Markup Type</label>
                <select className="form-select premium-input-field" value={markupType} onChange={e => setMarkupType(e.target.value)}>
                  <option value="flat">Flat Amount (+ ₹)</option>
                  <option value="percentage">Percentage (+ %)</option>
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label small fw-bold text-secondary">Markup Value</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">{markupType === 'flat' ? '₹' : '%'}</span>
                  <input type="number" className="form-control premium-input-field border-start-0" value={markupValue} onChange={e => setMarkupValue(e.target.value)} placeholder={currentMarkup ? currentMarkup.markup_value : "e.g. 500"} required />
                </div>
                {currentMarkup && (
                  <small className="text-success mt-1 d-block">Current Saved Value: {currentMarkup.markup_value} {currentMarkup.markup_type === 'flat' ? '₹' : '%'}</small>
                )}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-100 py-2 mt-2 fw-bold rounded-3">
              <Save size={18} className="me-2" /> {submitting ? 'Saving...' : 'Save Markup Settings'}
            </button>
          </form>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card luxury-card p-4 h-100" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
          <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
            <PieChart size={20} className="text-warning" /> Sales & Revenue Report
          </h5>
          
          <div className="d-flex flex-column gap-3">
            <div className="p-3 bg-white rounded-3 shadow-sm border-start border-4 border-primary">
              <div className="text-muted small fw-bold mb-1"><Plane size={14} className="me-1" /> Flight Sales</div>
              <h3 className="mb-0 text-dark">₹{flightSales.total.toLocaleString()}</h3>
              <small className="text-secondary">{flightSales.count} bookings</small>
            </div>

            <div className="p-3 bg-white rounded-3 shadow-sm border-start border-4 border-success">
              <div className="text-muted small fw-bold mb-1"><Hotel size={14} className="me-1" /> Hotel Sales</div>
              <h3 className="mb-0 text-dark">₹{hotelSales.total.toLocaleString()}</h3>
              <small className="text-secondary">{hotelSales.count} bookings</small>
            </div>
            
            <div className="mt-3 p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold text-primary mb-0">Total Platform Sales</h6>
                  <small className="text-muted">Combined revenue from vendors</small>
                </div>
                <h4 className="fw-bold text-primary mb-0">₹{(flightSales.total + hotelSales.total + carSales.total + bikeSales.total + packageSales.total).toLocaleString()}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
