import React, { useState } from 'react';
import { BarChart2, TrendingUp, Calendar, DollarSign, Users, Building, Download, PieChart } from 'lucide-react';

export default function PMSReports({ currentUser, vendorHotels, vendorBookings }) {
  const [period, setPeriod] = useState('30');

  const today = new Date();
  const periodStart = new Date(today.getTime() - parseInt(period) * 86400000).toISOString().split('T')[0];
  const periodBookings = vendorBookings.filter(b => b.pickup_date >= periodStart || b.created_at >= periodStart);

  const totalRevenue = periodBookings.reduce((s, b) => s + parseInt(b.total_amount || b.total_paid || 0), 0);
  const totalReceived = periodBookings.reduce((s, b) => s + parseInt(b.amount_paid || 0), 0);
  const confirmed = periodBookings.filter(b => ['Confirmed', 'Checked In', 'Checked Out'].includes(b.status)).length;
  const cancelled = periodBookings.filter(b => b.status === 'Cancelled').length;
  const conversionRate = periodBookings.length > 0 ? Math.round((confirmed / periodBookings.length) * 100) : 0;
  const avgValue = periodBookings.length > 0 ? Math.round(totalRevenue / periodBookings.length) : 0;

  // Monthly data
  const monthlyData = {};
  vendorBookings.forEach(b => {
    const m = b.pickup_date?.slice(0, 7) || '';
    if (!m) return;
    if (!monthlyData[m]) monthlyData[m] = { revenue: 0, bookings: 0, received: 0 };
    monthlyData[m].revenue += parseInt(b.total_amount || b.total_paid || 0);
    monthlyData[m].received += parseInt(b.amount_paid || 0);
    monthlyData[m].bookings++;
  });

  const months = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
  const maxRevenue = Math.max(...months.map(([, d]) => d.revenue), 1);

  const exportReport = () => {
    const rows = [['Month', 'Bookings', 'Revenue', 'Received']];
    months.forEach(([m, d]) => rows.push([m, d.bookings, d.revenue, d.received]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'revenue_report.csv'; a.click();
  };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Reports & Analytics</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Business performance overview and trend analysis</p></div>
        <div className="d-flex gap-2">
          {[['7', '7 Days'], ['30', '30 Days'], ['90', '90 Days'], ['365', '1 Year']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)} className="btn btn-sm rounded-pill px-3"
              style={{ background: period === v ? '#0D1B2E' : '#fff', color: period === v ? '#fff' : '#6c757d', border: '1px solid #dee2e6', fontSize: '0.78rem' }}>
              {l}
            </button>
          ))}
          <button onClick={exportReport} className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1" style={{ background: '#fff', border: '1px solid #dee2e6', fontSize: '0.78rem' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="row g-3 mb-4">
        {[
          ['Total Bookings', periodBookings.length, '#0984e3', <Calendar size={20}/>],
          ['Confirmed', confirmed, '#00b894', <Users size={20}/>],
          ['Cancelled', cancelled, '#d63031', <Building size={20}/>],
          ['Total Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`, '#6c5ce7', <TrendingUp size={20}/>],
          ['Amount Received', `₹${totalReceived.toLocaleString('en-IN')}`, '#00b894', <DollarSign size={20}/>],
          ['Avg Booking Value', `₹${avgValue.toLocaleString('en-IN')}`, '#fdcb6e', <BarChart2 size={20}/>],
          ['Conversion Rate', `${conversionRate}%`, '#0984e3', <PieChart size={20}/>],
          ['Properties', vendorHotels.length, '#fd79a8', <Building size={20}/>]
        ].map(([l, v, c, icon]) => (
          <div key={l} className="col-6 col-md-3">
            <div className="card border-0 rounded-4 p-3 shadow-sm" style={{ background: '#fff' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-3 p-1 d-flex" style={{ background: `${c}15` }}><span style={{ color: c }}>{icon}</span></div>
              </div>
              <div className="fw-bold" style={{ fontSize: '1.3rem', color: '#1a2b4a' }}>{v}</div>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff' }}>
        <h6 className="fw-bold mb-4" style={{ color: '#1a2b4a' }}>Monthly Revenue (Last 6 Months)</h6>
        {months.length === 0 ? (
          <div className="text-center py-4 text-muted">No data available for the selected period</div>
        ) : (
          <div className="d-flex align-items-end gap-3" style={{ height: '200px' }}>
            {months.map(([m, d]) => {
              const barHeight = Math.round((d.revenue / maxRevenue) * 160);
              const receivedHeight = Math.round((d.received / maxRevenue) * 160);
              return (
                <div key={m} className="flex-grow-1 d-flex flex-column align-items-center gap-1">
                  <div className="text-muted fw-bold" style={{ fontSize: '0.65rem' }}>₹{(d.revenue / 1000).toFixed(0)}K</div>
                  <div className="d-flex align-items-end gap-1 w-100">
                    <div className="flex-grow-1 rounded-top-2" style={{ height: `${barHeight}px`, background: 'linear-gradient(180deg, #6c5ce7, #a29bfe)', transition: 'height 0.5s', maxWidth: '50%' }} title={`Revenue: ₹${d.revenue.toLocaleString('en-IN')}`}></div>
                    <div className="flex-grow-1 rounded-top-2" style={{ height: `${receivedHeight}px`, background: 'linear-gradient(180deg, #00b894, #55efc4)', transition: 'height 0.5s', maxWidth: '50%' }} title={`Received: ₹${d.received.toLocaleString('en-IN')}`}></div>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>{m.slice(0, 7)}</div>
                  <div className="text-muted" style={{ fontSize: '0.62rem' }}>{d.bookings} bkgs</div>
                </div>
              );
            })}
          </div>
        )}
        <div className="d-flex gap-3 mt-3">
          <div className="d-flex align-items-center gap-1"><div className="rounded" style={{ width: '12px', height: '12px', background: '#6c5ce7' }}></div><span style={{ fontSize: '0.72rem', color: '#6c757d' }}>Total Booked</span></div>
          <div className="d-flex align-items-center gap-1"><div className="rounded" style={{ width: '12px', height: '12px', background: '#00b894' }}></div><span style={{ fontSize: '0.72rem', color: '#6c757d' }}>Amount Received</span></div>
        </div>
      </div>

      {/* Hotel Breakdown */}
      <div className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff' }}>
        <h6 className="fw-bold mb-4" style={{ color: '#1a2b4a' }}>Performance by Property</h6>
        {vendorHotels.length === 0 ? (
          <div className="text-center py-4 text-muted">No hotels to show</div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {vendorHotels.map(h => {
              const hotelBkgs = vendorBookings.filter(b => b.item_id === h.id);
              const hotelRevenue = hotelBkgs.reduce((s, b) => s + parseInt(b.total_amount || b.total_paid || 0), 0);
              const hotelReceived = hotelBkgs.reduce((s, b) => s + parseInt(b.amount_paid || 0), 0);
              const totalRev = vendorBookings.reduce((s, b) => s + parseInt(b.total_amount || b.total_paid || 0), 0) || 1;
              const pct = Math.round((hotelRevenue / totalRev) * 100);
              return (
                <div key={h.id} className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{h.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{hotelBkgs.length} bookings • ₹{hotelRevenue.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="rounded-pill overflow-hidden" style={{ height: '8px', background: '#dee2e6' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)' }}></div>
                  </div>
                  <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>{pct}% of total revenue</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
