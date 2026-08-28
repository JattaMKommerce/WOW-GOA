import React, { useState, useEffect } from 'react';
import {
  Building, TrendingUp, Users, Calendar, DollarSign, CheckCircle, XCircle,
  ArrowUp, Clock, Plus, CalendarDays, BedDouble, LogIn, LogOut, RefreshCw,
  BarChart2, AlertCircle, ArrowRight, CreditCard, Star, FileText
} from 'lucide-react';
import * as api from '../../../services/api';

const KPICard = ({ label, value, sub, icon, color, onClick }) => (
  <div
    className="card border-0 rounded-4 p-4 h-100 shadow-sm"
    style={{ background: '#fff', cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.2s' }}
    onClick={onClick}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { if (onClick) e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div className="d-flex align-items-start justify-content-between mb-3">
      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ background: `${color}15`, width: '44px', height: '44px' }}>
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
    <div className="fw-bold" style={{ fontSize: '1.6rem', color: '#1a2b4a', lineHeight: 1 }}>{value}</div>
    <div className="text-muted mt-1" style={{ fontSize: '0.78rem', fontWeight: 600 }}>{label}</div>
    {sub && <div className="mt-1" style={{ fontSize: '0.7rem', color }}>{sub}</div>}
  </div>
);

const QuickAction = ({ label, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="btn rounded-4 p-3 h-100 d-flex flex-column align-items-center justify-content-center gap-2 border-0 w-100"
    style={{ background: `${color}12`, transition: 'all 0.2s', minHeight: '90px' }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; }}
  >
    <span style={{ color }}>{icon}</span>
    <span style={{ fontSize: '0.78rem', color: '#2d3748', fontWeight: 600, textAlign: 'center' }}>{label}</span>
  </button>
);

export default function PMSDashboard({ currentUser, vendorHotels, vendorBookings, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.pmsGetStats(currentUser.id),
        api.pmsGetDashboardActivity(currentUser.id)
      ]);
      setStats(statsRes.stats);
      setActivity(activityRes.activity);
    } catch (e) {
      // Use local calculations as fallback
      const today = new Date().toISOString().split('T')[0];
      const checkins = vendorBookings.filter(b => b.pickup_date === today).length;
      const checkouts = vendorBookings.filter(b => b.drop_date === today).length;
      const totalRev = vendorBookings.reduce((s, b) => s + (parseInt(b.total_amount) || 0), 0);
      const amtRec = vendorBookings.reduce((s, b) => s + (parseInt(b.amount_paid) || 0), 0);
      setStats({
        total_hotels: vendorHotels.length,
        active_hotels: vendorHotels.filter(h => h.hotel_status === 'Live').length,
        pending_hotels: vendorHotels.filter(h => ['Submitted', 'Under Review'].includes(h.hotel_status)).length,
        new_bookings: vendorBookings.length,
        cancelled: vendorBookings.filter(b => b.status === 'Cancelled').length,
        todays_checkins: checkins,
        todays_checkouts: checkouts,
        total_revenue: totalRev,
        amount_received: amtRec,
        pending_payments: totalRev - amtRec,
        commission: Math.round(amtRec * 0.10),
        vendor_payable: Math.round(amtRec * 0.90)
      });
      const today2 = today;
      setActivity({
        checkins: vendorBookings.filter(b => b.pickup_date === today2).slice(0, 5),
        checkouts: vendorBookings.filter(b => b.drop_date === today2).slice(0, 5),
        recent_bookings: [...vendorBookings].reverse().slice(0, 8)
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentUser.id]);

  const fmt = (n) => (parseInt(n) || 0).toLocaleString('en-IN');
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      {/* Header Row */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {currentUser.username}!</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{today} • {vendorHotels.length} Properties</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          {['today', 'yesterday', '7days', '30days'].map(f => (
            <button key={f} onClick={() => setDateFilter(f)} className="btn btn-sm rounded-pill px-3" style={{ background: dateFilter === f ? '#0D1B2E' : '#fff', color: dateFilter === f ? '#fff' : '#6c757d', border: '1px solid #dee2e6', fontSize: '0.78rem' }}>
              {f === 'today' ? 'Today' : f === 'yesterday' ? 'Yesterday' : f === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
          <button onClick={fetchData} className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1" style={{ background: '#fff', border: '1px solid #dee2e6' }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }}></div>
          <p className="mt-2 text-muted">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI Row 1 — Properties */}
          <div className="row g-3 mb-3">
            <div className="col-6 col-md-3 col-lg-2">
              <KPICard label="Total Hotels" value={stats?.total_hotels ?? '-'} icon={<Building size={20} />} color="#0D1B2E" onClick={() => onNavigate('my_hotels')} />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <KPICard label="Active / Live" value={stats?.active_hotels ?? '-'} sub="Live on site" icon={<CheckCircle size={20} />} color="#00b894" onClick={() => onNavigate('my_hotels')} />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <KPICard label="Pending Approval" value={stats?.pending_hotels ?? '-'} icon={<Clock size={20} />} color="#fdcb6e" onClick={() => onNavigate('my_hotels')} />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <KPICard label="Today Check-ins" value={stats?.todays_checkins ?? '-'} icon={<LogIn size={20} />} color="#6c5ce7" onClick={() => onNavigate('arrivals')} />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <KPICard label="Today Check-outs" value={stats?.todays_checkouts ?? '-'} icon={<LogOut size={20} />} color="#fd79a8" onClick={() => onNavigate('departures')} />
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <KPICard label="Total Bookings" value={stats?.new_bookings ?? '-'} sub={`${stats?.cancelled ?? 0} cancelled`} icon={<CalendarDays size={20} />} color="#0984e3" onClick={() => onNavigate('all_bookings')} />
            </div>
          </div>

          {/* KPI Row 2 — Finance */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-lg-2">
              <KPICard label="Total Booking Value" value={`₹${fmt(stats?.total_revenue)}`} icon={<TrendingUp size={20} />} color="#00b894" />
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <KPICard label="Amount Received" value={`₹${fmt(stats?.amount_received)}`} icon={<CreditCard size={20} />} color="#0984e3" onClick={() => onNavigate('payments')} />
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <KPICard label="Pending Payments" value={`₹${fmt(stats?.pending_payments)}`} icon={<AlertCircle size={20} />} color="#e17055" onClick={() => onNavigate('payments')} />
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <KPICard label="Platform Commission" value={`₹${fmt(stats?.commission)}`} sub="10% of received" icon={<BarChart2 size={20} />} color="#a29bfe" />
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <KPICard label="Vendor Payable" value={`₹${fmt(stats?.vendor_payable)}`} sub="After commission" icon={<DollarSign size={20} />} color="#00b894" onClick={() => onNavigate('settlements')} />
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <KPICard label="Cancelled" value={stats?.cancelled ?? '-'} icon={<XCircle size={20} />} color="#d63031" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card border-0 rounded-4 p-4 mb-4 shadow-sm" style={{ background: '#fff' }}>
            <h6 className="fw-bold mb-3" style={{ color: '#1a2b4a' }}>⚡ Quick Actions</h6>
            <div className="row g-2">
              {[
                ...(vendorHotels.length === 0 ? [{ label: 'Add Hotel', icon: <Building size={20} />, color: '#0D1B2E', tab: 'add_hotel' }] : []),
                { label: 'Add Room Type', icon: <BedDouble size={20} />, color: '#6c5ce7', tab: 'room_types' },
                { label: 'Create Booking', icon: <Plus size={20} />, color: '#00b894', tab: 'create_booking' },
                { label: 'Block Dates', icon: <Calendar size={20} />, color: '#fdcb6e', tab: 'availability' },
                { label: 'Check-in Guest', icon: <LogIn size={20} />, color: '#0984e3', tab: 'arrivals' },
                { label: 'Check-out Guest', icon: <LogOut size={20} />, color: '#fd79a8', tab: 'departures' },
                { label: 'View Calendar', icon: <CalendarDays size={20} />, color: '#e17055', tab: 'availability' },
                { label: 'Update Prices', icon: <DollarSign size={20} />, color: '#a29bfe', tab: 'rate_plans' },
                { label: 'Download Report', icon: <FileText size={20} />, color: '#74b9ff', tab: 'reports' }
              ].map(a => (
                <div key={a.label} className="col-6 col-md-4 col-lg-3" style={{ maxWidth: '160px' }}>
                  <QuickAction label={a.label} icon={a.icon} color={a.color} onClick={() => onNavigate(a.tab)} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="row g-3">
            {/* Today's Arrivals */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 rounded-4 shadow-sm h-100" style={{ background: '#fff' }}>
                <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-4 px-4 pb-0">
                  <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>
                    <LogIn size={16} className="me-2 text-primary" />Today's Arrivals ({activity?.checkins?.length ?? 0})
                  </h6>
                  <button onClick={() => onNavigate('arrivals')} className="btn btn-sm btn-link text-decoration-none p-0" style={{ fontSize: '0.78rem', color: '#0984e3' }}>
                    View All <ArrowRight size={12} />
                  </button>
                </div>
                <div className="card-body px-4 pt-3">
                  {(!activity?.checkins || activity.checkins.length === 0) ? (
                    <div className="text-center py-4">
                      <LogIn size={32} className="text-muted opacity-25 mb-2" />
                      <p className="text-muted small mb-0">No arrivals today</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {activity.checkins.slice(0, 5).map((b, i) => (
                        <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '36px', height: '36px', background: '#6c5ce7', fontSize: '14px', flexShrink: 0 }}>
                              {(b.name || 'G')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{b.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.73rem' }}>{b.phone} • #{b.id?.slice(-6)}</div>
                            </div>
                          </div>
                          <span className="badge" style={{ background: '#edf7f0', color: '#00b894', fontSize: '0.7rem' }}>Check-in Today</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="col-12 col-lg-6">
              <div className="card border-0 rounded-4 shadow-sm h-100" style={{ background: '#fff' }}>
                <div className="card-header bg-transparent border-0 d-flex align-items-center justify-content-between pt-4 px-4 pb-0">
                  <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>
                    <CalendarDays size={16} className="me-2 text-primary" />Recent Bookings
                  </h6>
                  <button onClick={() => onNavigate('all_bookings')} className="btn btn-sm btn-link text-decoration-none p-0" style={{ fontSize: '0.78rem', color: '#0984e3' }}>
                    View All <ArrowRight size={12} />
                  </button>
                </div>
                <div className="card-body px-4 pt-3">
                  {(!activity?.recent_bookings || activity.recent_bookings.length === 0) ? (
                    <div className="text-center py-4">
                      <CalendarDays size={32} className="text-muted opacity-25 mb-2" />
                      <p className="text-muted small mb-0">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {activity.recent_bookings.slice(0, 6).map((b, i) => {
                        const statusColors = {
                          'Confirmed': { bg: '#edf7f0', color: '#00b894' },
                          'Cancelled': { bg: '#fff0f0', color: '#d63031' },
                          'Draft': { bg: '#fff3cd', color: '#856404' },
                          'Pending': { bg: '#e3f2fd', color: '#0984e3' }
                        };
                        const sc = statusColors[b.status] || { bg: '#f8f9fa', color: '#6c757d' };
                        return (
                          <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: '#f8f9fa' }}>
                            <div>
                              <div className="fw-bold" style={{ fontSize: '0.84rem' }}>{b.name}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{b.pickup_date} → {b.drop_date}</div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold" style={{ fontSize: '0.85rem', color: '#0D1B2E' }}>₹{parseInt(b.total_amount || b.total_paid || 0).toLocaleString('en-IN')}</div>
                              <span className="badge" style={{ background: sc.bg, color: sc.color, fontSize: '0.68rem' }}>{b.status || 'Draft'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
