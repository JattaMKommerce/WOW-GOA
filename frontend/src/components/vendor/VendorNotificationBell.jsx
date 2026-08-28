import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import * as api from '../../services/api';

export default function VendorNotificationBell({
  currentUser,
  vendorType = 'hotel', // 'hotel' or 'vehicle'
  bookings = [],
  onNavigate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch real-time notifications strictly scoped to this portal type
  const refreshNotifications = async () => {
    try {
      if (!currentUser?.id) return;
      const res = await api.pmsListNotifications(currentUser.id, vendorType);
      let notifs = (res && Array.isArray(res.notifications)) ? res.notifications : [];
      
      // Filter bookings strictly by portal type
      const isForCurrentPortal = (b) => {
        const isHotelItem = String(b.item_id || '').toLowerCase().startsWith('hotel') ||
                            b.property_type || b.stars || b.room_type ||
                            b.item_type === 'hotel' ||
                            String(b.item_name || '').toLowerCase().includes('hotel') ||
                            String(b.title || '').toLowerCase().includes('hotel');
        return vendorType === 'hotel' ? isHotelItem : !isHotelItem;
      };

      const portalBookings = (bookings || []).filter(isForCurrentPortal);

      const recentBookings = portalBookings.slice(0, 8).map(b => {
        const isHotel = vendorType === 'hotel';
        const typeLabel = isHotel ? 'Hotel Booking' : 'Vehicle Rental';
        const bId = b.booking_id || b.id || (isHotel ? 'BK-1000' : 'TG-1000');
        const code = String(bId).startsWith('#') ? bId : `#${bId}`;
        const price = b.total_price || b.amount || b.price || 0;
        const cust = b.customer_name || b.guest_name || b.name || 'Customer';
        const item = b.item_name || b.hotel_name || b.vehicle_name || (isHotel ? 'Deluxe Room' : 'Car/Bike');
        const status = b.status || 'Confirmed';

        return {
          id: `bk-${b.id || b.booking_id}`,
          isBookingItem: true,
          bookingData: b,
          type: vendorType,
          title: `${typeLabel} ${code}`,
          message: `${cust} — ${item} (${status} • ₹${Number(price).toLocaleString('en-IN')})`,
          is_read: b.status === 'Completed' ? 1 : 0,
          created_at: b.created_at || b.date || 'Recent'
        };
      });

      // Filter incoming backend notifications strictly
      const filteredNotifs = notifs.filter(n => {
        const t = (n.type || '').toLowerCase();
        const title = (n.title || '').toLowerCase();
        const msg = (n.message || '').toLowerCase();

        if (vendorType === 'vehicle') {
          // Reject anything hotel-related
          if (t === 'hotel' || title.includes('hotel') || msg.includes('hotel') || title.includes('resort') || msg.includes('resort')) {
            return false;
          }
          return true;
        } else if (vendorType === 'hotel') {
          // Reject anything vehicle-related
          if (t === 'vehicle' || title.includes('vehicle') || msg.includes('vehicle') || title.includes('rental') || title.includes('car ') || title.includes('bike ')) {
            return false;
          }
          return true;
        }
        return true;
      });

      // Merge backend notifications and portal bookings
      const mergedMap = new Map();
      recentBookings.forEach(rb => mergedMap.set(rb.id, rb));
      filteredNotifs.forEach(n => {
        mergedMap.set(n.id, {
          ...n,
          type: vendorType
        });
      });

      let finalItems = Array.from(mergedMap.values());

      // If empty for Vehicle Vendor, provide clean fallback vehicle notifications
      if (finalItems.length === 0 && vendorType === 'vehicle') {
        finalItems = [
          {
            id: 'v-notif-1',
            type: 'vehicle',
            title: 'Vehicle Fleet Active',
            message: 'Your vehicle console is connected with live reservation monitoring.',
            is_read: 0,
            created_at: 'Recent'
          }
        ];
      }

      setNotifications(finalItems);
      const unread = finalItems.filter(x => !x.is_read).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 10000);
    window.addEventListener('pms-notification-updated', refreshNotifications);
    window.addEventListener('new-booking-created', refreshNotifications);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pms-notification-updated', refreshNotifications);
      window.removeEventListener('new-booking-created', refreshNotifications);
    };
  }, [currentUser?.id, bookings?.length]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await api.pmsMarkNotificationRead(null, currentUser.id, true);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    try {
      await api.pmsDeleteNotification(null, currentUser.id, true);
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSingle = async (id, e) => {
    e.stopPropagation();
    try {
      await api.pmsDeleteNotification(id, currentUser.id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('pms-notification-updated'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (n) => {
    setIsOpen(false);
    if (!n.is_read) {
      try {
        await api.pmsMarkNotificationRead(n.id, currentUser.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
        window.dispatchEvent(new CustomEvent('pms-notification-updated'));
      } catch (err) {}
    }

    if (onNavigate) {
      const targetTab = vendorType === 'hotel' ? 'all_bookings' : 'bookings';
      onNavigate(targetTab);
    }
  };

  const handleViewAllBookings = () => {
    setIsOpen(false);
    if (onNavigate) {
      const targetTab = vendorType === 'hotel' ? 'all_bookings' : 'bookings';
      onNavigate(targetTab);
    }
  };

  const formatTime = (ts) => {
    if (!ts || ts === 'Recent') return 'Recent';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } catch {
      return ts;
    }
  };

  const portalBookingsCount = (bookings || []).filter(b => {
    const isHotelItem = String(b.item_id || '').toLowerCase().startsWith('hotel') ||
                        b.property_type || b.stars || b.room_type ||
                        b.item_type === 'hotel' ||
                        String(b.item_name || '').toLowerCase().includes('hotel');
    return vendorType === 'hotel' ? isHotelItem : !isHotelItem;
  }).length;

  const totalBookingsCount = portalBookingsCount || notifications.length;

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          refreshNotifications();
        }}
        className="btn btn-sm border-0 p-2 position-relative rounded-circle d-flex align-items-center justify-content-center"
        style={{
          background: isOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: isOpen ? '#FFB800' : 'rgba(255,255,255,0.75)',
          transition: 'all 0.2s',
          width: '38px',
          height: '38px'
        }}
        title="Live Notifications"
      >
        <Bell size={19} color={isOpen ? '#FFB800' : 'rgba(255,255,255,0.8)'} />
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger"
            style={{
              top: '2px',
              right: '2px',
              fontSize: '0.62rem',
              padding: '2px 5px',
              fontWeight: 'bold',
              boxShadow: '0 0 8px rgba(220,53,69,0.8)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Pop-up Dropdown matching user mockup */}
      {isOpen && (
        <div
          className="position-absolute shadow-lg"
          style={{
            right: 0,
            top: '46px',
            width: '365px',
            maxWidth: '92vw',
            zIndex: 1080,
            backgroundColor: '#0D1B2E',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.65)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-3 border-bottom d-flex align-items-center justify-content-between"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#091422' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.2rem', color: '#FFB800' }}>🔔</span>
              <div>
                <div className="fw-bold text-white lh-1" style={{ fontSize: '0.9rem' }}>Live</div>
                <div className="fw-bold text-white lh-1" style={{ fontSize: '0.9rem' }}>Notifications</div>
              </div>
              {unreadCount > 0 && (
                <span
                  className="badge rounded-pill bg-danger ms-1 px-2 py-1"
                  style={{ fontSize: '0.65rem', fontWeight: 700 }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="btn btn-link p-0 text-white-50 text-decoration-underline border-0"
                style={{ fontSize: '0.72rem', background: 'transparent' }}
              >
                Mark read
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="btn btn-sm px-2.5 py-1 rounded-3 fw-semibold"
                style={{
                  fontSize: '0.72rem',
                  color: '#FF6B6B',
                  border: '1px solid rgba(229,57,53,0.5)',
                  background: 'rgba(229,57,53,0.12)'
                }}
              >
                Clear all
              </button>
            </div>
          </div>

          {/* List Items */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 px-3">
                <Bell size={26} className="text-white-50 opacity-25 mb-2 mx-auto" />
                <div className="text-white-50 small">No notifications right now</div>
                <div className="text-white-50 opacity-50" style={{ fontSize: '0.7rem' }}>You're all caught up!</div>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const isUnread = !n.is_read;
                const isHotel = n.type === 'hotel';
                const dotColor = isHotel ? '#00B8D9' : '#FF6333';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="px-3 py-2.5 border-bottom d-flex align-items-start gap-2.5 position-relative"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: isUnread ? 'rgba(255,255,255,0.03)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = isUnread ? 'rgba(255,255,255,0.03)' : 'transparent')
                    }
                  >
                    {/* Cyan / Orange Status Dot */}
                    <span
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: dotColor,
                        marginTop: '6px',
                        boxShadow: `0 0 6px ${dotColor}`
                      }}
                    ></span>

                    {/* Notification Text Details */}
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between mb-0.5">
                        <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.82rem' }}>
                          {n.title}
                        </div>
                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0 ms-1">
                          {isUnread && (
                            <span
                              className="badge rounded-pill bg-danger px-1.5 py-0.5"
                              style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.5px' }}
                            >
                              NEW
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSingle(n.id, e)}
                            className="btn btn-sm p-0 text-white-50 border-0 d-flex align-items-center justify-content-center"
                            style={{ width: '18px', height: '18px', background: 'transparent', opacity: 0.6 }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '1';
                              e.currentTarget.style.color = '#FF5252';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = '0.6';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                            }}
                            title="Dismiss"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="text-white-50 text-truncate" style={{ fontSize: '0.74rem', lineHeight: 1.3 }}>
                        {n.message}
                      </div>

                      <div className="text-white-50 opacity-50 mt-1" style={{ fontSize: '0.66rem' }}>
                        {formatTime(n.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Gold button */}
          <div
            className="p-2.5 border-top text-center"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#091422' }}
          >
            <button
              type="button"
              onClick={handleViewAllBookings}
              className="btn btn-sm w-100 fw-bold py-2 rounded-3"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#FFB800',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.8rem',
                letterSpacing: '0.3px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,184,0,0.15)';
                e.currentTarget.style.color = '#FFC820';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#FFB800';
              }}
            >
              View All Bookings ({totalBookingsCount}) &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
