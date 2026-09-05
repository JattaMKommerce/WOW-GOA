import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import * as api from '../../services/api';
import NotificationSoundToggle from '../common/NotificationSoundToggle';
import { handleIncomingNotifications, registerSeenNotifications, getRelativeTimeString, parseNotificationTitleAndStatus } from '../../utils/notificationSound';

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
  const isInitialLoadRef = useRef(true);

  // Fetch real-time notifications strictly scoped to this portal type
  const refreshNotifications = async () => {
    try {
      if (!currentUser?.id) return;
      const [res, authRes] = await Promise.all([
        api.pmsListNotifications(currentUser.id, vendorType).catch(() => ({ notifications: [] })),
        api.fetchNotifications({ role: vendorType === 'hotel' ? 'hotel_vendor' : 'vendor', userId: currentUser.id }).catch(() => ({ notifications: [] }))
      ]);
      let notifs = (res && Array.isArray(res.notifications)) ? res.notifications : [];
      let authNotifs = (authRes && Array.isArray(authRes.notifications)) ? authRes.notifications : [];
      
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
      const allIncomingNotifs = [...authNotifs, ...notifs];
      const filteredNotifs = allIncomingNotifs.filter(n => {
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
        mergedMap.set(String(n.id), {
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

      // Trigger notification sound only for genuinely new unread notifications
      if (isInitialLoadRef.current) {
        registerSeenNotifications(finalItems);
        isInitialLoadRef.current = false;
      } else {
        handleIncomingNotifications(finalItems, { isInitialLoad: false });
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const timer = setInterval(refreshNotifications, 5000);
    window.addEventListener('pms-notification-updated', refreshNotifications);
    window.addEventListener('new-booking-created', refreshNotifications);
    window.addEventListener('booking-status-updated', refreshNotifications);
    window.addEventListener('booking-updated', refreshNotifications);
    window.addEventListener('tripgalileo-notification-sync', refreshNotifications);
    window.addEventListener('tripgalileo-booking-sync', refreshNotifications);

    let bcBookings;
    let bcNotifs;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bcBookings = new BroadcastChannel('tripgalileo_bookings_sync');
        bcBookings.onmessage = refreshNotifications;
        bcNotifs = new BroadcastChannel('tripgalileo_notifications_sync');
        bcNotifs.onmessage = refreshNotifications;
      }
    } catch (e) {}

    return () => {
      clearInterval(timer);
      window.removeEventListener('pms-notification-updated', refreshNotifications);
      window.removeEventListener('new-booking-created', refreshNotifications);
      window.removeEventListener('booking-status-updated', refreshNotifications);
      window.removeEventListener('booking-updated', refreshNotifications);
      window.removeEventListener('tripgalileo-notification-sync', refreshNotifications);
      window.removeEventListener('tripgalileo-booking-sync', refreshNotifications);
      if (bcBookings) bcBookings.close();
      if (bcNotifs) bcNotifs.close();
    };
  }, [currentUser?.id, bookings?.length, vendorType]);

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
          className="position-absolute shadow-lg animate-fade-in-up"
          style={{
            right: 0,
            top: '46px',
            width: '410px',
            maxWidth: 'calc(100vw - 20px)',
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
            className="px-3 py-2.5 border-bottom d-flex align-items-center justify-content-between gap-2"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#091422' }}
          >
            {/* Left: Title + Badge */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <Bell size={15} className="text-warning flex-shrink-0" />
              <span className="fw-bold text-white small text-nowrap">Live Notifications</span>
              {unreadCount > 0 && (
                <span
                  className="badge rounded-pill bg-danger text-nowrap"
                  style={{ fontSize: '0.62rem', padding: '0.22em 0.5em', fontWeight: 700 }}
                >
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Right: Sound Control + Mark Read + Clear All */}
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              <NotificationSoundToggle variant="dark" />
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="btn btn-link p-0 text-white-50 text-decoration-underline border-0 text-nowrap"
                  style={{ fontSize: '0.68rem', background: 'transparent' }}
                >
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                className="btn btn-sm px-2 py-0.5 rounded text-nowrap fw-semibold"
                style={{
                  fontSize: '0.66rem',
                  color: '#FF6B6B',
                  border: '1px solid rgba(229,57,53,0.4)',
                  background: 'rgba(229,57,53,0.1)'
                }}
              >
                Clear all
              </button>
            </div>
          </div>

          {/* List Items with scrollbar clearance */}
          <div style={{ maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
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
                const { cleanTitle, status, badgeStyle } = parseNotificationTitleAndStatus(n.title, n.message);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className="px-3 py-2.5 border-bottom d-flex align-items-start gap-2.5 position-relative"
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      background: isUnread ? 'rgba(255,255,255,0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = isUnread ? 'rgba(255,255,255,0.04)' : 'transparent')
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
                        boxShadow: isUnread ? `0 0 6px ${dotColor}` : 'none',
                        opacity: isUnread ? 1 : 0.4
                      }}
                    ></span>

                    {/* Notification Text Details */}
                    <div className="flex-grow-1 overflow-hidden pe-1">
                      <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                        <div className="d-flex flex-wrap align-items-center gap-1.5 flex-grow-1">
                          <span
                            className="fw-bold text-white"
                            style={{
                              fontSize: '0.82rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3
                            }}
                          >
                            {cleanTitle}
                          </span>
                          {status && (
                            <span
                              className="badge px-1.5 py-0.5 rounded-1 fw-semibold"
                              style={{
                                fontSize: '0.60rem',
                                background: badgeStyle?.bg || 'rgba(255,255,255,0.1)',
                                color: badgeStyle?.text || '#fff',
                                border: `1px solid ${badgeStyle?.border || 'rgba(255,255,255,0.2)'}`
                              }}
                            >
                              {status}
                            </span>
                          )}
                        </div>

                        {/* Dismiss button */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSingle(n.id, e)}
                          className="btn btn-sm p-0 text-white-50 border-0 d-flex align-items-center justify-content-center flex-shrink-0 ms-1"
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

                      <div className="text-white-50" style={{ fontSize: '0.74rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.message}
                      </div>

                      <div className="text-white-50 opacity-50 mt-1" style={{ fontSize: '0.66rem' }}>
                        {getRelativeTimeString(n.created_at)}
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
