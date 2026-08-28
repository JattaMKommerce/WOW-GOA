import React, { useState } from 'react';
import { DollarSign, Car, Activity, Wallet, Bell, TrendingUp, ArrowUpRight, Clock, CheckCircle, AlertCircle, Calendar, Users, BarChart2 } from 'lucide-react';

function StatCard({ label, value, icon, color, trend, sub }) {
  return (
    <div className="rounded-3 p-3 h-100" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="d-flex align-items-start justify-content-between mb-2">
        <div className="rounded-2 p-2 d-flex align-items-center justify-content-center" style={{ background: `${color}18`, width: '36px', height: '36px' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
            <ArrowUpRight size={11} />{trend}%
          </span>
        )}
      </div>
      <div className="fw-bold mt-1" style={{ fontSize: '1.3rem', color: '#0D1B2E', lineHeight: 1.1 }}>{value}</div>
      <div className="mt-1" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ data, color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="d-flex align-items-end gap-1" style={{ height: '60px' }}>
      {data.map((v, i) => (
        <div key={i} className="rounded-1 flex-grow-1" style={{ height: `${Math.max((v / max) * 100, 5)}%`, background: color, opacity: 0.6 + (i / data.length) * 0.4, minWidth: '12px' }} />
      ))}
    </div>
  );
}

export default function VehiclePMSDashboard({ currentUser, cars, bikes, bookings, onNavigate }) {
  const allVehicles = [...(cars || []), ...(bikes || [])];
  const myVehicles = allVehicles.filter(v => v.vendor_id === currentUser?.id || v.vendorId === currentUser?.id);
  const displayVehicles = myVehicles.length > 0 ? myVehicles : allVehicles.slice(0, 5); // fallback for demo

  const myBookings = (bookings || []).filter(b =>
    displayVehicles.some(v => String(v.id) === String(b.item_id) || b.item_id?.toString().startsWith('car-') || b.item_id?.toString().startsWith('bike-'))
  );

  const totalRevenue = myBookings.reduce((s, b) => s + parseFloat(b.total_paid || b.amount_paid || 0), 0);
  const activeRentals = myBookings.filter(b => b.status === 'Confirmed' || b.status === 'confirmed').length;
  const pendingBookings = myBookings.filter(b => b.status === 'Pending' || b.status === 'pending').length;
  const availableVehicles = displayVehicles.filter(v => v.is_available !== 0).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRentals = myBookings.filter(b => b.created_at?.slice(0, 10) === todayStr).length;

  const weekRevenue = [12000, 18000, 9000, 24000, 15000, 32000, totalRevenue % 50000 || 18000];

  const recentBookings = myBookings.slice(0, 6);

  return (
    <div className="p-4">
      {/* Welcome */}
      <div className="rounded-3 p-4 mb-4 d-flex align-items-center justify-content-between" style={{ background: 'linear-gradient(135deg,#0D1B2E 0%,#1e3a5f 100%)' }}>
        <div>
          <h5 className="fw-bold text-white mb-1">Fleet Dashboard 🚗</h5>
          <p className="mb-0" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-end d-none d-md-block">
          <div className="fw-bold text-white" style={{ fontSize: '1.8rem' }}>₹{(totalRevenue / 1000).toFixed(1)}K</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.72rem' }}>Total Revenue</div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><StatCard label="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}K`} icon={<DollarSign size={16} />} color="#16a34a" trend={8} /></div>
        <div className="col-6 col-md-3"><StatCard label="Today's Rentals" value={todayRentals} icon={<Calendar size={16} />} color="#2563eb" /></div>
        <div className="col-6 col-md-3"><StatCard label="Active Rentals" value={activeRentals} icon={<Activity size={16} />} color="#7c3aed" /></div>
        <div className="col-6 col-md-3"><StatCard label="Available Vehicles" value={availableVehicles} icon={<Car size={16} />} color="#059669" sub={`of ${displayVehicles.length} total`} /></div>
        <div className="col-6 col-md-3"><StatCard label="Pending Approval" value={pendingBookings} icon={<Clock size={16} />} color="#ca8a04" /></div>
        <div className="col-6 col-md-3"><StatCard label="Total Fleet" value={displayVehicles.length} icon={<Car size={16} />} color="#d97706" sub={`${(cars || []).length} cars · ${(bikes || []).length} bikes`} /></div>
        <div className="col-6 col-md-3"><StatCard label="Wallet Balance" value="₹0" icon={<Wallet size={16} />} color="#0891b2" /></div>
        <div className="col-6 col-md-3"><StatCard label="Commission" value="8%" icon={<TrendingUp size={16} />} color="#be185d" sub="Platform deduction" /></div>
      </div>

      {/* Charts + Fleet Status */}
      <div className="row g-3 mb-4">
        <div className="col-md-7">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Weekly Revenue</div>
              <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 700 }}>↑ 8% this week</span>
            </div>
            <MiniBar data={weekRevenue} color="#FF6333" />
            <div className="d-flex justify-content-between mt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <span key={d} style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px' }}>Fleet Status</div>
            <div className="d-flex flex-column gap-2">
              {[
                { label: 'Available', count: availableVehicles, color: '#16a34a', icon: <CheckCircle size={14} /> },
                { label: 'On Rent', count: activeRentals, color: '#2563eb', icon: <Activity size={14} /> },
                { label: 'Pending', count: pendingBookings, color: '#ca8a04', icon: <Clock size={14} /> },
                { label: 'Maintenance', count: 0, color: '#dc2626', icon: <AlertCircle size={14} /> },
              ].map(s => (
                <div key={s.label} className="d-flex align-items-center gap-3 py-2 px-3 rounded-2" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span className="flex-grow-1 fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>{s.label}</span>
                  <span className="fw-bold" style={{ color: s.color, fontSize: '1.1rem' }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="rounded-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Recent Bookings</div>
          <button onClick={() => onNavigate('bookings')} className="btn btn-sm px-3 py-1 rounded-2 fw-bold" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem' }}>View All</button>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['ID', 'Customer', 'Vehicle', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.length > 0 ? recentBookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#2563eb', fontSize: '0.78rem' }}>#{b.id}</td>
                  <td className="px-3 py-2">{b.name || '—'}</td>
                  <td className="px-3 py-2" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.item_name || '—'}</td>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#16a34a' }}>₹{parseFloat(b.total_paid || b.amount_paid || 0).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded-pill fw-bold" style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: b.status === 'Confirmed' ? '#dcfce7' : '#fef9c3', color: b.status === 'Confirmed' ? '#16a34a' : '#ca8a04' }}>
                      {b.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted" style={{ fontSize: '0.75rem' }}>{b.created_at?.slice(0, 10) || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-3 py-5 text-center text-muted">No bookings yet — Add vehicles and start accepting rentals</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px' }}>Quick Actions</div>
        <div className="row g-2">
          {[
            { label: 'Add Vehicle', color: '#FF6333', action: 'fleet' },
            { label: 'View Bookings', color: '#2563eb', action: 'bookings' },
            { label: 'Fleet Calendar', color: '#7c3aed', action: 'calendar' },
            { label: 'Update Pricing', color: '#16a34a', action: 'pricing' },
          ].map(a => (
            <div key={a.label} className="col-6 col-md-3">
              <button onClick={() => onNavigate(a.action)} className="btn w-100 py-2 px-3 rounded-3 fw-bold" style={{ background: `${a.color}12`, color: a.color, border: `1px solid ${a.color}30`, fontSize: '0.82rem' }}>
                {a.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
