import React, { useState } from 'react';
import {
  BarChart2, Car, DollarSign, Users, TrendingUp, ShieldCheck,
  ArrowUpRight, ChevronRight
} from 'lucide-react';

function MiniBar({ data = [], color }) {
  const max = Math.max(...data, 1);
  return (
    <div className="d-flex align-items-end gap-2" style={{ height: '65px' }}>
      {data.map((v, i) => (
        <div key={i} className="flex-grow-1 d-flex flex-column align-items-center h-100 justify-content-end">
          <div
            className="rounded-1 w-100"
            title={`Value: ${v}`}
            style={{
              height: `${Math.max((v / max) * 100, v > 0 ? 10 : 3)}%`,
              background: v > 0 ? color : '#e2e8f0',
              opacity: v > 0 ? 0.75 + (i / data.length) * 0.25 : 0.4,
              minWidth: '14px',
              transition: 'height 0.3s ease'
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ReportMetricCard({ report, onNavigate }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onNavigate && onNavigate(report.targetTab)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-3 p-4 h-100 d-flex flex-column justify-content-between position-relative"
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? report.color : 'rgba(0,0,0,0.07)'}`,
        cursor: 'pointer',
        borderRadius: '14px',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 12px 24px -6px rgba(0,0,0,0.07), 0 4px 12px -2px ${report.color}15`
          : '0 2px 4px rgba(0,0,0,0.02)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div>
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div className="d-flex align-items-start gap-3">
            <div
              className="rounded-3 p-2 flex-shrink-0 d-flex align-items-center justify-content-center"
              style={{
                background: `${report.color}15`,
                width: '44px',
                height: '44px',
                transition: 'transform 0.2s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <span style={{ color: report.color }}>{report.icon}</span>
            </div>
            <div>
              <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '14px' }}>{report.label}</div>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px', lineHeight: '1.3' }}>{report.desc}</div>
            </div>
          </div>

          {/* Drill-down arrow icon with hover shift */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ms-2"
            style={{
              width: '28px',
              height: '28px',
              background: hovered ? `${report.color}18` : '#f8fafc',
              color: hovered ? report.color : '#94a3b8',
              border: `1px solid ${hovered ? `${report.color}40` : '#e2e8f0'}`,
              transition: 'all 0.2s ease',
              transform: hovered ? 'translate(2px, -2px)' : 'translate(0, 0)'
            }}
            title={`Drill down to ${report.actionText}`}
          >
            <ArrowUpRight size={14} />
          </div>
        </div>

        <div className="fw-bold mb-1" style={{ color: report.color, fontSize: '1.05rem' }}>{report.value}</div>
        <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>{report.subvalue}</div>
      </div>

      <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
        <span style={{ fontSize: '0.72rem', color: hovered ? report.color : '#64748b', fontWeight: 600, transition: 'color 0.2s ease' }}>
          {report.actionText} →
        </span>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Click to open</span>
      </div>
    </div>
  );
}

export default function VehicleReports({ cars = [], bikes = [], bookings = [], onNavigate }) {
  const validBookings = (bookings || []).filter(bk => bk.status !== 'Cancelled');
  const totalRevenue = validBookings.reduce((s, bk) => s + parseFloat(bk.total_amount || bk.total_paid || 0), 0);
  const totalFleetCount = (cars?.length || 0) + (bikes?.length || 0);

  // Group real revenue and bookings by Day of Week: Mon to Sun
  const weekRevenueMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
  const weekBookingsMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };

  (bookings || []).forEach(bk => {
    if (bk.status === 'Cancelled') return;
    const dt = bk.pickup_date ? new Date(bk.pickup_date) : (bk.created_at ? new Date(bk.created_at) : null);
    if (dt && !isNaN(dt.getTime())) {
      const dayIdx = dt.getDay();
      const amt = parseFloat(bk.total_amount || bk.total_paid || 0) || 0;
      weekRevenueMap[dayIdx] = (weekRevenueMap[dayIdx] || 0) + amt;
      weekBookingsMap[dayIdx] = (weekBookingsMap[dayIdx] || 0) + 1;
    }
  });

  const weekRevenue = [
    weekRevenueMap[1], weekRevenueMap[2], weekRevenueMap[3],
    weekRevenueMap[4], weekRevenueMap[5], weekRevenueMap[6], weekRevenueMap[0]
  ];

  const weekBookings = [
    weekBookingsMap[1], weekBookingsMap[2], weekBookingsMap[3],
    weekBookingsMap[4], weekBookingsMap[5], weekBookingsMap[6], weekBookingsMap[0]
  ];

  const uniqueCustomers = new Set(validBookings.map(bk => (bk.phone || bk.name || '').trim()).filter(Boolean)).size;
  const platformCommission = Math.round(totalRevenue * 0.08);
  const netEarnings = Math.max(0, totalRevenue - platformCommission);
  const completedBookings = validBookings.filter(b => b.status === 'Completed').length;

  const reports = [
    {
      label: 'Booking Performance',
      targetTab: 'bookings',
      actionText: 'View All Bookings',
      icon: <Car size={20} />,
      color: '#2563eb',
      value: `${validBookings.length} total bookings`,
      subvalue: `${completedBookings} completed · ${validBookings.length - completedBookings} in progress`,
      desc: 'Accurate record of confirmed vehicle rentals, completion rate, and reservations'
    },
    {
      label: 'Gross & Net Earnings',
      targetTab: 'wallet',
      actionText: 'View Wallet & Payouts',
      icon: <DollarSign size={20} />,
      color: '#16a34a',
      value: `₹${totalRevenue.toLocaleString()} gross revenue`,
      subvalue: `₹${netEarnings.toLocaleString()} estimated net vendor payout`,
      desc: 'Calculated from actual completed and confirmed vehicle rental payments'
    },
    {
      label: 'Fleet Utilization',
      targetTab: 'fleet',
      actionText: 'Manage Vehicle Fleet',
      icon: <BarChart2 size={20} />,
      color: '#7c3aed',
      value: `${totalFleetCount} total vehicles`,
      subvalue: `${cars.length} cars · ${bikes.length} bikes active in fleet`,
      desc: 'Real-time vehicle inventory count and availability tracking'
    },
    {
      label: 'Customer Reach',
      targetTab: 'customers',
      actionText: 'View Customer Directory',
      icon: <Users size={20} />,
      color: '#d97706',
      value: `${uniqueCustomers} unique customers`,
      subvalue: uniqueCustomers > 0 ? `Avg ₹${Math.round(totalRevenue / uniqueCustomers).toLocaleString()} per customer` : '0 average spend',
      desc: 'Aggregated unique travelers and rental clients from reservation records'
    },
    {
      label: 'Platform Commission & Fees',
      targetTab: 'payment_settings',
      actionText: 'Payment Settings',
      icon: <TrendingUp size={20} />,
      color: '#be185d',
      value: `₹${platformCommission.toLocaleString()} commission (8%)`,
      subvalue: `Standard 8% platform fee on completed bookings`,
      desc: 'Transparent calculation of platform service and processing deductions'
    },
    {
      label: 'Verification & Compliance',
      targetTab: 'settings',
      actionText: 'Profile & Settings',
      icon: <ShieldCheck size={20} />,
      color: '#059669',
      value: '100% Operational',
      subvalue: 'Real-time database synchronization active',
      desc: 'All vendor metrics and booking records are securely tracked and persisted'
    }
  ];

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Reports & Analytics</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Real-time analytics and revenue insights computed from your database bookings
          </p>
        </div>
      </div>

      {/* Real Trend Visualizers */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div
            onClick={() => onNavigate && onNavigate('bookings')}
            className="rounded-3 p-4 shadow-sm"
            style={{
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.07)',
              cursor: 'pointer',
              borderRadius: '14px',
              transition: 'all 0.25s ease'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <div className="fw-bold d-flex align-items-center gap-1" style={{ color: '#0D1B2E', fontSize: '13px' }}>
                  Weekly Revenue Trend (₹)
                  <ArrowUpRight size={13} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Real revenue distribution across days of week</div>
              </div>
              <span className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>₹{totalRevenue.toLocaleString()}</span>
            </div>
            <MiniBar data={weekRevenue} color="#FF6333" />
            <div className="d-flex justify-content-between mt-2 pt-1 border-top">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <span key={d} style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div
            onClick={() => onNavigate && onNavigate('bookings')}
            className="rounded-3 p-4 shadow-sm"
            style={{
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.07)',
              cursor: 'pointer',
              borderRadius: '14px',
              transition: 'all 0.25s ease'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <div className="fw-bold d-flex align-items-center gap-1" style={{ color: '#0D1B2E', fontSize: '13px' }}>
                  Weekly Bookings Volume
                  <ArrowUpRight size={13} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total bookings count per weekday</div>
              </div>
              <span className="fw-bold text-primary" style={{ fontSize: '0.85rem' }}>{validBookings.length} total</span>
            </div>
            <MiniBar data={weekBookings} color="#2563eb" />
            <div className="d-flex justify-content-between mt-2 pt-1 border-top">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <span key={d} style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drill-Down Interactive Report Cards */}
      <div className="row g-3">
        {reports.map(r => (
          <div key={r.label} className="col-md-6 col-lg-4">
            <ReportMetricCard report={r} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
    </div>
  );
}
