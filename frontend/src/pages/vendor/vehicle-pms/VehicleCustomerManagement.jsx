import React, { useState } from 'react';
import { Users, Search, Phone, Mail, Eye, Calendar, DollarSign, Car, X, User, MapPin } from 'lucide-react';

export default function VehicleCustomerManagement({ bookings = [] }) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Aggregate unique customers from real database bookings
  const customerMap = {};
  (bookings || []).forEach(b => {
    const rawPhone = (b.phone || '').trim();
    const rawName = (b.name || b.customer_name || 'Customer').trim();
    const rawEmail = (b.email || '').trim();
    const customerKey = rawPhone || rawEmail || rawName;

    if (!customerKey) return;

    if (!customerMap[customerKey]) {
      customerMap[customerKey] = {
        id: `CUST-${rawPhone.replace(/\D/g, '').slice(-6) || Math.floor(1000 + Math.random() * 9000)}`,
        name: rawName,
        phone: rawPhone || '—',
        email: rawEmail || '—',
        license: b.license || '—',
        city: b.pickup_loc || b.pickup_location || 'Goa',
        total_bookings: 0,
        total_spent: 0,
        last_booking_date: b.pickup_date || b.created_at || '—',
        bookings: []
      };
    }

    const c = customerMap[customerKey];
    c.total_bookings += 1;
    const amt = parseFloat(b.total_amount || b.total_paid || 0) || 0;
    c.total_spent += amt;
    if (b.pickup_date && b.pickup_date > (c.last_booking_date || '')) {
      c.last_booking_date = b.pickup_date;
    }
    c.bookings.push(b);
  });

  const customersList = Object.values(customerMap);

  const filtered = customersList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Customer Directory</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>
            {customersList.length} unique customers associated with rental bookings
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="rounded-3 p-3 text-center shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold" style={{ fontSize: '1.4rem', color: '#2563eb' }}>{customersList.length}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Customers</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="rounded-3 p-3 text-center shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold" style={{ fontSize: '1.4rem', color: '#16a34a' }}>
              {(bookings || []).filter(b => b.status !== 'Cancelled').length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Active Bookings</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="rounded-3 p-3 text-center shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold" style={{ fontSize: '1.4rem', color: '#FF6333' }}>
              ₹{customersList.reduce((acc, c) => acc + c.total_spent, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Total Customer Revenue</div>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4" style={{ background: '#fff' }}>
        <div className="position-relative" style={{ maxWidth: '420px' }}>
          <Search size={14} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-control form-control-sm rounded-pill ps-4"
            placeholder="Search by customer name, phone, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Customer', 'Contact Info', 'Location / License', 'Total Bookings', 'Total Spent', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td className="px-3 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg,#FF6333,#FF8A00)', fontSize: '14px', flexShrink: 0 }}>
                      {(c.name || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '0.85rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ID: #{c.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: '#0D1B2E' }}>
                    <Phone size={11} className="text-muted" /> {c.phone}
                  </div>
                  {c.email && c.email !== '—' && (
                    <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.72rem' }}>
                      <Mail size={11} /> {c.email}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>📍 {c.city}</div>
                  {c.license && c.license !== '—' && (
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>DL: {c.license}</div>
                  )}
                </td>
                <td className="px-3 py-3 text-center fw-bold" style={{ color: '#2563eb', fontSize: '0.88rem' }}>
                  {c.total_bookings}
                </td>
                <td className="px-3 py-3 fw-bold" style={{ color: '#16a34a', fontSize: '0.85rem' }}>
                  ₹{c.total_spent.toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <span className="badge rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.65rem' }}>
                    Active
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="btn btn-sm px-2 py-1 rounded-2 d-flex align-items-center gap-1"
                    style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    <Eye size={12} /> View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-5 text-muted" style={{ fontSize: '0.85rem' }}>
            No customers found. Customers will automatically appear here when bookings are created.
          </div>
        )}
      </div>

      {/* Customer Detail & Booking History Drawer */}
      {selectedCustomer && (
        <div className="position-fixed top-0 end-0 bottom-0 shadow-lg d-flex flex-column" style={{ width: '440px', maxWidth: '95vw', background: '#fff', zIndex: 1050, borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
          <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E' }}>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '14px' }}>Customer Profile</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>{selectedCustomer.name}</div>
            </div>
            <button className="btn p-1 border-0 text-white-50" onClick={() => setSelectedCustomer(null)}><X size={16} /></button>
          </div>

          <div className="flex-grow-1 overflow-auto p-4">
            {/* Header Profile */}
            <div className="text-center mb-4 pb-3 border-bottom">
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mx-auto mb-2" style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg,#FF6333,#FF8A00)', fontSize: '22px' }}>
                {(selectedCustomer.name || 'C')[0].toUpperCase()}
              </div>
              <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E' }}>{selectedCustomer.name}</h5>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedCustomer.phone}</div>
              {selectedCustomer.email && selectedCustomer.email !== '—' && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selectedCustomer.email}</div>
              )}
            </div>

            {/* Stats Summary */}
            <div className="row g-2 mb-4">
              <div className="col-6">
                <div className="p-2 rounded-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#2563eb' }}>{selectedCustomer.total_bookings}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Total Bookings</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 rounded-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#16a34a' }}>₹{selectedCustomer.total_spent.toLocaleString()}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Total Spent</div>
                </div>
              </div>
            </div>

            {/* Booking History */}
            <div className="fw-bold mb-3" style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Booking History ({selectedCustomer.bookings.length})
            </div>
            <div className="d-flex flex-column gap-2">
              {selectedCustomer.bookings.map((b, idx) => (
                <div key={b.id || idx} className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>
                      #{b.id} — {b.item_name || 'Vehicle'}
                    </span>
                    <span className="badge rounded-pill" style={{ background: b.status === 'Completed' ? '#dcfce7' : b.status === 'Cancelled' ? '#fee2e2' : '#dbeafe', color: b.status === 'Completed' ? '#16a34a' : b.status === 'Cancelled' ? '#dc2626' : '#2563eb', fontSize: '0.62rem' }}>
                      {b.status || 'Confirmed'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    <span>📅 {b.pickup_date} → {b.drop_date || b.return_date}</span>
                    <span className="fw-bold text-dark">₹{parseFloat(b.total_amount || b.total_paid || 0).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '3px' }}>
                    📍 {b.pickup_loc || b.pickup_location || 'Goa'} · {b.payment_method || b.payment_mode || 'Cash'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: '#f8fafc' }}>
            <button onClick={() => setSelectedCustomer(null)} className="btn w-100 py-2 rounded-3 fw-bold" style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.82rem' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
