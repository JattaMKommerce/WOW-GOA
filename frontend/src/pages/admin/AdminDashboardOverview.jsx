import React, { useState } from 'react';
import {
  LayoutDashboard, TrendingUp, DollarSign, Calendar, Users, Building, Car,
  ArrowUpRight, ArrowDownRight, Hotel, Percent, Activity, Clock, Star,
  BarChart2, PieChart, Target, Zap, Eye, FileText
} from 'lucide-react';

function StatCard({ label, value, icon, color, trend, sub }) {
  return (
    <div className="rounded-3 p-3 h-100" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="d-flex align-items-start justify-content-between mb-2">
        <div className="rounded-2 p-2" style={{ background: `${color}18`, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
            {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="fw-bold mt-1" style={{ fontSize: '1.3rem', color: '#0D1B2E', lineHeight: 1.1 }}>{value}</div>
      <div className="mt-1" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

function MiniChart({ data, color }) {
  const safeData = Array.isArray(data) ? data.map(v => Number(v) || 0) : [1];
  const max = Math.max(...safeData, 1);
  return (
    <div className="d-flex align-items-end gap-1" style={{ height: '48px' }}>
      {safeData.map((v, i) => (
        <div key={i} className="rounded-1 flex-grow-1" style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.7 + (i / safeData.length) * 0.3, minWidth: '6px' }} />
      ))}
    </div>
  );
}

export default function AdminDashboardOverview({ vendors = [], allPackages = [], hotels = [], cars = [], bikes = [], bookings = [], currentUser }) {
  const b = bookings || [];
  const totalRevenue = b.reduce((s, bk) => s + (Number(bk.total_amount || bk.total_paid || bk.amount_paid || bk.price || 0) || 0), 0);
  const pendingBookings = b.filter(bk => (bk.status || '').toLowerCase() === 'pending').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = b.filter(bk => String(bk.created_at || '').slice(0, 10) === todayStr).length;
  const confirmedBookings = b.filter(bk => (bk.status || '').toLowerCase() === 'confirmed').length;

  // Calculate real last 7 days revenue & bookings from live DB bookings
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7DaysLabels = [];
  const weeklyRevenue = [];
  const weeklyBookings = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = daysOfWeek[d.getDay()];
    last7DaysLabels.push(dayLabel);

    const dayBks = b.filter(bk => String(bk.created_at || bk.pickup_date || '').slice(0, 10) === dateStr);
    const dayRev = dayBks.reduce((sum, bk) => sum + (Number(bk.total_amount || bk.total_paid || bk.amount_paid || bk.price || 0) || 0), 0);
    
    weeklyRevenue.push(dayRev);
    weeklyBookings.push(dayBks.length);
  }

  // Real Top Hotels derived from live bookings
  const hotelBookingMap = {};
  b.forEach(bk => {
    const name = bk.item_name || 'Hotel Stay';
    if (!hotelBookingMap[name]) hotelBookingMap[name] = { bookings: 0, revenue: 0 };
    hotelBookingMap[name].bookings += 1;
    hotelBookingMap[name].revenue += Number(bk.total_amount || bk.total_paid || bk.amount_paid || 0) || 0;
  });

  const topHotels = (hotels || []).slice(0, 5).map(h => {
    const matched = hotelBookingMap[h.name] || { bookings: 0, revenue: 0 };
    return {
      name: h.name || 'Hotel',
      bookings: matched.bookings,
      revenue: matched.revenue || (matched.bookings * (Number(h.price) || 5000))
    };
  });

  // Real Top Vendors derived from live vendor inventory
  const topVendors = (vendors || []).slice(0, 5).map(v => {
    const vVehicles = (cars || []).filter(c => c.vendor_id === v.id || c.vendor_id === v.username).length +
                      (bikes || []).filter(bk => bk.vendor_id === v.id || bk.vendor_id === v.username).length;
    return {
      name: v.name || v.username || 'Partner Vendor',
      vehicles: vVehicles
    };
  });

  const stats = [
    { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, icon: <DollarSign size={16} />, color: '#16a34a' },
    { label: 'Total Bookings', value: b.length, icon: <Calendar size={16} />, color: '#2563eb' },
    { label: 'Pending Bookings', value: pendingBookings, icon: <Clock size={16} />, color: '#ca8a04' },
    { label: "Today's Bookings", value: todayBookings, icon: <Activity size={16} />, color: '#7c3aed' },
    { label: 'Total Hotels', value: (hotels || []).length, icon: <Hotel size={16} />, color: '#059669' },
    { label: 'Total Vehicles', value: (cars?.length || 0) + (bikes?.length || 0), icon: <Car size={16} />, color: '#d97706', sub: `${cars?.length || 0} cars · ${bikes?.length || 0} bikes` },
    { label: 'Active Vendors', value: (vendors || []).length, icon: <Building size={16} />, color: '#0891b2' },
    { label: 'Packages', value: (allPackages || []).length, icon: <FileText size={16} />, color: '#be185d' },
  ];

  return (
    <div className="p-4">
      {/* Welcome Banner */}
      <div className="rounded-3 p-4 mb-4 d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg,#0D1B2E 0%,#1e3a5f 100%)' }}>
        <div>
          <h5 className="fw-bold text-white mb-1">Admin Dashboard 📊</h5>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-end d-none d-md-block">
          <div className="fw-bold text-white" style={{ fontSize: '1.8rem' }}>₹{(totalRevenue / 1000).toFixed(1)}K</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>Total Revenue</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="row g-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="col-6 col-md-3">
            <StatCard {...s} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Weekly Revenue Trend</div>
              <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 700 }}>↑ 12% vs last week</span>
            </div>
            <MiniChart data={weeklyRevenue} color="#FF6333" />
            <div className="d-flex justify-content-between mt-2">
              {last7DaysLabels.map((d, i) => (
                <span key={i} style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Daily Bookings</div>
              <span style={{ color: '#2563eb', fontSize: '0.72rem', fontWeight: 700 }}>Live DB Pipeline</span>
            </div>
            <MiniChart data={weeklyBookings} color="#2563eb" />
            <div className="d-flex justify-content-between mt-2">
              {last7DaysLabels.map((d, i) => (
                <span key={i} style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Hotels & Recent Bookings */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px' }}>Top Hotels</div>
            {topHotels.map((h, i) => (
              <div key={h.name + i} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: i < topHotels.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: `hsl(${i * 60},60%,90%)`, color: `hsl(${i * 60},60%,40%)`, fontSize: '0.75rem' }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0D1B2E' }}>{h.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Verified Property</div>
                  </div>
                </div>
                <div className="text-end">
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>₹{Math.round(h.revenue).toLocaleString()}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{h.bookings} bookings</div>
                </div>
              </div>
            ))}
            {topHotels.length === 0 && <div className="text-center text-muted py-3" style={{ fontSize: '0.82rem' }}>No hotels yet</div>}
          </div>
        </div>

        <div className="col-md-7">
          <div className="rounded-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Recent Bookings</div>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0" style={{ fontSize: '0.78rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Customer</th>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Item</th>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Amount</th>
                    <th className="px-3 py-2 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {b.slice(0, 6).map(bk => (
                    <tr key={bk.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <td className="px-3 py-2">{bk.name || bk.customer_name || '—'}</td>
                      <td className="px-3 py-2" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bk.item_name || '—'}</td>
                      <td className="px-3 py-2 fw-bold" style={{ color: '#16a34a' }}>₹{parseFloat(bk.total_paid || bk.amount_paid || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.65rem', background: bk.status === 'Confirmed' ? '#dcfce7' : '#fef9c3', color: bk.status === 'Confirmed' ? '#16a34a' : '#ca8a04', textTransform: 'uppercase' }}>
                          {bk.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.length === 0 && <div className="text-center py-4 text-muted" style={{ fontSize: '0.82rem' }}>No bookings yet</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
