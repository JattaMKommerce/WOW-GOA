import React, { useState } from 'react';
import {
  Bell, CheckCircle2, Car, Users, Gift, Clock,
  AlertCircle, ShieldCheck, ChevronRight, Check
} from 'lucide-react';

export default function CustomerNotificationsTab({
  currentUser,
  bookings = [],
  onNavigateTab
}) {
  // Generate real dynamic notifications based on customer's real bookings
  const [readIds, setReadIds] = useState([]);

  const notifications = [
    {
      id: 'notif-welcome',
      title: 'Welcome to WOW GOA Holidays!',
      message: 'Your customer portal is active. You can now track your Self Drive rentals, hotel vouchers, and driver assignments in real time.',
      time: 'Just now',
      type: 'info',
      icon: <CheckCircle2 size={16} className="text-primary" />
    },
    ...bookings.slice(0, 5).map((b, idx) => ({
      id: `notif-book-${b.id || idx}`,
      title: `Booking #${b.id || b.booking_id || `WOW-${idx}`} Confirmed`,
      message: `Your reservation for "${b.item_name || b.package_name || 'Self Drive'}" is confirmed for ${b.pickup_date || b.travel_date || 'your upcoming trip'}.`,
      time: b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent',
      type: 'booking',
      icon: <Car size={16} className="text-warning" />,
      tab: 'selfdrive'
    })),
    {
      id: 'notif-reward',
      title: 'Self Drive Reward Program',
      message: 'Earn 5% cashback on all completed holiday rentals in Goa directly into your digital wallet.',
      time: '1 day ago',
      type: 'reward',
      icon: <Gift size={16} className="text-success" />,
      tab: 'cashback'
    }
  ];

  const markAllRead = () => {
    setReadIds(notifications.map(n => n.id));
  };

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            Notifications & Updates
          </h4>
          <p className="text-muted text-xs mb-0">
            Real-time status alerts for your trips, driver dispatches, cashback rewards, and payment receipts.
          </p>
        </div>

        <button 
          onClick={markAllRead}
          className="btn btn-light btn-sm text-dark border rounded-pill px-3 py-1.5 fw-bold text-xs d-flex align-items-center gap-1"
        >
          <Check size={14} />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* ─── Notifications List ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="list-group list-group-flush">
          {notifications.map(n => {
            const isRead = readIds.includes(n.id);
            return (
              <div 
                key={n.id}
                className={`list-group-item p-4 d-flex align-items-start gap-3 transition-all ${isRead ? 'bg-white' : 'bg-light bg-opacity-50'}`}
                style={{ borderBottom: '1px solid #f1f5f9' }}
              >
                <div className="p-2.5 rounded-circle bg-white shadow-sm border flex-shrink-0">
                  {n.icon}
                </div>

                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="fw-bold text-dark mb-0 font-heading" style={{ fontSize: '15px' }}>
                      {n.title}
                    </h6>
                    <span className="text-muted text-xxs">{n.time}</span>
                  </div>

                  <p className="text-muted text-xs mb-2">{n.message}</p>

                  {n.tab && (
                    <button 
                      onClick={() => onNavigateTab(n.tab)}
                      className="btn btn-sm btn-link text-warning text-decoration-none fw-bold p-0 text-xs d-inline-flex align-items-center gap-1"
                    >
                      <span>View related details</span>
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
