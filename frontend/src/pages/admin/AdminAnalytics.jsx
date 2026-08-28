import React, { useState } from 'react';
import { TrendingUp, BarChart2, Users, Hotel, Car, DollarSign, ArrowUpRight, ArrowDownRight, Download, Calendar } from 'lucide-react';

function MiniBar({ data, color, labels }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <div className="d-flex align-items-end gap-1" style={{ height: '100px' }}>
        {data.map((v, i) => (
          <div key={i} className="d-flex flex-column align-items-center flex-grow-1" style={{ gap: '4px' }}>
            <div style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700 }}>
              {v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
            </div>
            <div className="rounded-1 w-100" style={{ height: `${Math.max((v / max) * 80, 4)}px`, background: color, minWidth: '20px', transition: 'height 0.5s ease' }} />
          </div>
        ))}
      </div>
      {labels && (
        <div className="d-flex gap-1 mt-1">
          {labels.map(l => <div key={l} className="flex-grow-1 text-center" style={{ fontSize: '0.58rem', color: '#94a3b8' }}>{l}</div>)}
        </div>
      )}
    </div>
  );
}

function DonutChart({ segments = [], labels = [] }) {
  // Simple CSS donut
  const total = segments.reduce((s, v) => s + (Number(v) || 0), 0);
  const colors = ['#FF6333', '#2563eb', '#16a34a', '#7c3aed', '#d97706'];
  const safeTotal = total > 0 ? total : 1;
  return (
    <div className="d-flex align-items-center gap-4">
      <div className="position-relative flex-shrink-0" style={{ width: '100px', height: '100px' }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          {segments.reduce((acc, v, i) => {
            const pct = (Number(v) || 0) / safeTotal;
            const start = acc.offset;
            acc.offset += pct;
            const r = 15.9155;
            const circumference = 2 * Math.PI * r;
            acc.els.push(
              <circle key={i} cx="18" cy="18" r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth="3.5"
                strokeDasharray={`${pct * circumference} ${circumference}`}
                strokeDashoffset={`${-start * circumference}`} />
            );
            return acc;
          }, { offset: 0, els: [] }).els}
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#0D1B2E' }}>{total}</div>
          <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>Total</div>
        </div>
      </div>
      <div className="flex-grow-1">
        {labels.map((l, i) => (
          <div key={l} className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', background: colors[i % colors.length] }} />
            <div style={{ fontSize: '0.72rem', color: '#475569', flex: 1 }}>{l}</div>
            <div className="fw-bold" style={{ fontSize: '0.72rem', color: '#0D1B2E' }}>{segments[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalytics({ bookings, hotels, cars, bikes, vendors, allPackages }) {
  const [dateRange, setDateRange] = useState('7d');
  
  const handleExportBookings = () => {
    if (!bookings || bookings.length === 0) return alert('No bookings to export.');
    const headers = ['Booking ID', 'Customer Name', 'Customer Email', 'Customer Phone', 'Item Name', 'Amount Paid', 'Status', 'Date'];
    const csvContent = [
      headers.join(','),
      ...bookings.map(b => [
        b.id,
        `"${b.name || b.customer_name || ''}"`,
        `"${b.email || ''}"`,
        `"${b.phone || ''}"`,
        `"${b.item_name || ''}"`,
        b.total_paid || b.amount_paid || 0,
        b.status || 'pending',
        b.created_at || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Platform_Bookings_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportHotels = () => {
    if (!hotels || hotels.length === 0) return alert('No hotels to export.');
    const headers = ['Hotel Name', 'Location', 'Bookings', 'Revenue (INR)', 'Rating'];
    const csvContent = [
      headers.join(','),
      ...topHotelsList.map(h => [
        `"${h.name}"`,
        `"${h.location}"`,
        h.bookings,
        h.revenue,
        h.rating
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'Top_Hotels_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const b = bookings || [];

  const totalRevenue = b.reduce((s, bk) => s + parseFloat(bk.total_paid || bk.amount_paid || 0), 0);
  const confirmedBookings = b.filter(bk => bk.status === 'Confirmed' || bk.status === 'confirmed').length;
  const conversionRate = b.length > 0 ? Math.round((confirmedBookings / b.length) * 100) : 0;

  // Weekly data (calculating from actual bookings)
  const weekRevenue = [0, 0, 0, 0, 0, 0, 0];
  const weekBookings = [0, 0, 0, 0, 0, 0, 0];
  b.forEach(bk => {
    if (!bk.created_at) return;
    const date = new Date(bk.created_at);
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    // Map to Mon-Sun (0-6)
    const index = day === 0 ? 6 : day - 1;
    weekBookings[index] += 1;
    weekRevenue[index] += parseFloat(bk.total_paid || bk.amount_paid || 0);
  });
  
  const weekVisitors = [120, 185, 145, 230, 178, 298, 210]; // Requires external analytics integration

  const bookingsByStatus = [
    b.filter(bk => bk.status === 'Confirmed' || bk.status === 'confirmed').length || 0,
    b.filter(bk => bk.status === 'Pending' || bk.status === 'pending').length || 0,
    b.filter(bk => bk.status === 'Cancelled' || bk.status === 'cancelled').length || 0,
    b.filter(bk => bk.status === 'Completed' || bk.status === 'completed').length || 0,
  ];

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const kpiCards = [
    { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, trend: 12, icon: <DollarSign size={16} />, color: '#16a34a' },
    { label: 'Booking Conversion', value: `${conversionRate}%`, trend: 3, icon: <TrendingUp size={16} />, color: '#2563eb' },
    { label: 'Avg Booking Value', value: b.length > 0 ? `₹${Math.round(totalRevenue / b.length).toLocaleString()}` : '₹0', trend: 7, icon: <BarChart2 size={16} />, color: '#7c3aed' },
    { label: 'Total Vendors', value: vendors.length, trend: 18, icon: <Users size={16} />, color: '#d97706' },
  ];

  const topHotelsList = (hotels || []).slice(0, 5).map((h, i) => ({
    name: h.name, location: h.location || 'Goa', bookings: b.filter(bk => bk.hotel_id === h.id || bk.item_id === h.id).length, revenue: b.filter(bk => bk.hotel_id === h.id || bk.item_id === h.id).reduce((sum, bk) => sum + parseFloat(bk.total_paid || bk.amount_paid || 0), 0), rating: h.rating || 0
  }));

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Analytics & Reports</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Platform performance insights and trends</p>
        </div>
        <div className="d-flex gap-2">
          {['7d', '30d', '90d', '1y'].map(r => (
            <button key={r} onClick={() => setDateRange(r)} className="btn btn-sm px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.72rem', background: dateRange === r ? '#0D1B2E' : '#fff', color: dateRange === r ? '#fff' : '#475569', border: '1px solid rgba(0,0,0,0.1)' }}>
              {r}
            </button>
          ))}
          <button onClick={handleExportBookings} className="btn btn-sm px-3 py-1 rounded-pill fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#16a34a', border: 'none' }}>
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="row g-3 mb-4">
        {kpiCards.map((k, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="rounded-2 p-2 d-flex align-items-center justify-content-center" style={{ background: `${k.color}18`, width: '34px', height: '34px' }}>
                  <span style={{ color: k.color }}>{k.icon}</span>
                </div>
                <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 700 }}>
                  <ArrowUpRight size={11} />{k.trend}%
                </span>
              </div>
              <div className="fw-bold" style={{ fontSize: '1.3rem', color: '#0D1B2E', lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Revenue vs Bookings</div>
              <div className="d-flex gap-3">
                <div className="d-flex align-items-center gap-1"><div className="rounded-circle" style={{ width: '8px', height: '8px', background: '#FF6333' }} /><span style={{ fontSize: '0.68rem', color: '#64748b' }}>Revenue</span></div>
                <div className="d-flex align-items-center gap-1"><div className="rounded-circle" style={{ width: '8px', height: '8px', background: '#2563eb' }} /><span style={{ fontSize: '0.68rem', color: '#64748b' }}>Bookings</span></div>
              </div>
            </div>
            <MiniBar data={weekRevenue} color="#FF6333" labels={DAYS} />
          </div>
        </div>
        <div className="col-md-4">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px' }}>Booking Status</div>
            <DonutChart segments={bookingsByStatus} labels={['Confirmed', 'Pending', 'Cancelled', 'Completed']} />
          </div>
        </div>
      </div>

      {/* Visitors Chart */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px' }}>Daily Visitors</div>
            <MiniBar data={weekVisitors} color="#2563eb" labels={DAYS} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px' }}>Platform Summary</div>
            {[
              { label: 'Total Hotels', value: (hotels || []).length, color: '#059669' },
              { label: 'Total Vehicles', value: (cars?.length || 0) + (bikes?.length || 0), color: '#d97706' },
              { label: 'Total Packages', value: (allPackages || []).length, color: '#7c3aed' },
              { label: 'Active Vendors', value: (vendors || []).length, color: '#2563eb' },
              { label: 'Total Bookings', value: b.length, color: '#FF6333' },
            ].map(s => (
              <div key={s.label} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle" style={{ width: '8px', height: '8px', background: s.color }} />
                  <span style={{ fontSize: '0.82rem', color: '#475569' }}>{s.label}</span>
                </div>
                <span className="fw-bold" style={{ fontSize: '0.88rem', color: '#0D1B2E' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Hotels Table */}
      <div className="rounded-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Top Performing Hotels</div>
          <button onClick={handleExportHotels} className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem' }}>
            <Download size={12} /> Export CSV
          </button>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['#', 'Hotel', 'Location', 'Bookings', 'Revenue', 'Rating'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topHotelsList.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-3 text-muted">{i + 1}</td>
                  <td className="px-3 py-3 fw-bold" style={{ color: '#0D1B2E' }}>{h.name}</td>
                  <td className="px-3 py-3 text-muted">{h.location}</td>
                  <td className="px-3 py-3 fw-bold" style={{ color: '#2563eb' }}>{h.bookings}</td>
                  <td className="px-3 py-3 fw-bold" style={{ color: '#16a34a' }}>₹{h.revenue.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <span className="fw-bold" style={{ color: '#d97706' }}>⭐ {h.rating}</span>
                  </td>
                </tr>
              ))}
              {topHotelsList.length === 0 && (
                <tr><td colSpan="6" className="px-3 py-4 text-center text-muted">No hotels data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
