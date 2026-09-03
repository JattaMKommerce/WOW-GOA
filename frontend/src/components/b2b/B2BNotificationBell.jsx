import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, CheckCircle2, AlertCircle, Info, Check, Trash2, X, ExternalLink, Clock, ShieldCheck, Tag
} from 'lucide-react';
import * as api from '../../services/api';

export default function B2BNotificationBell({ partner, onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread'
  const [toasts, setToasts] = useState([]); // List of active floating toasts

  const partnerId = partner?.id || partner?.username || '';
  const prevNotifsRef = useRef([]);
  const isFirstLoad = useRef(true);
  const dropdownRef = useRef(null);

  // Helper to format time ago
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  // Helper to get notification icon
  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'b2b_booking_created':
        return <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />;
      case 'mode_approved':
      case 'registration_approved':
        return <ShieldCheck size={16} className="text-warning flex-shrink-0 mt-0.5" />;
      case 'mode_rejected':
      case 'registration_rejected':
        return <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />;
      default:
        return <Info size={16} className="text-info flex-shrink-0 mt-0.5" />;
    }
  };

  // Poll notifications
  const loadNotifications = async () => {
    if (!partnerId) return;
    try {
      const res = await api.fetchB2BNotifications(partnerId);
      if (res && res.success) {
        const fetched = Array.isArray(res.notifications) ? res.notifications : [];
        setNotifications(fetched);
        setUnreadCount(res.unread_count || 0);

        // Detect new unread notification for toast alert
        if (!isFirstLoad.current && fetched.length > 0) {
          const prevIds = new Set(prevNotifsRef.current.map(n => n.id));
          const newItems = fetched.filter(n => !prevIds.has(n.id) && !n.is_read);
          if (newItems.length > 0) {
            newItems.forEach(item => {
              triggerToast(item);
            });
          }
        }
        prevNotifsRef.current = fetched;
        isFirstLoad.current = false;
      }
    } catch (err) {
      console.warn('[B2B Notifications] fetch error:', err);
    }
  };

  const triggerToast = (item) => {
    const toastId = 'toast_' + Date.now() + '_' + Math.random();
    const newToast = { ...item, toastId };
    setToasts(prev => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.toastId !== toastId));
    }, 6000);
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 3500);
    return () => clearInterval(interval);
  }, [partnerId]);

  // Close dropdown on click outside
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

  const handleMarkRead = async (notifId, e) => {
    e?.stopPropagation();
    await api.markB2BNotificationRead(notifId, partnerId, false);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await api.markB2BNotificationRead('', partnerId, true);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const handleClearAll = async () => {
    await api.clearB2BNotifications(partnerId);
    setNotifications([]);
    setUnreadCount(0);
  };

  const filteredNotifications = activeFilter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <>
      {/* Real-time Floating Toasts in Top-Right */}
      <div 
        className="position-fixed"
        style={{
          top: '20px',
          right: '20px',
          zIndex: 9999,
          maxWidth: '360px',
          width: '100%',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(toast => (
          <div
            key={toast.toastId}
            className="card border-0 shadow-lg mb-2.5 overflow-hidden animate-fade-in-down"
            style={{
              background: '#0D1B2E',
              color: '#ffffff',
              borderRadius: '12px',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              pointerEvents: 'auto',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="p-3 d-flex align-items-start gap-2.5">
              <div className="p-2 rounded-circle bg-warning bg-opacity-20 text-warning">
                <Bell size={18} />
              </div>
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="fw-bold text-white text-xs text-truncate pe-2">{toast.title}</span>
                  <button
                    onClick={() => removeToast(toast.toastId)}
                    className="btn btn-link text-white-50 p-0 border-0"
                    style={{ textDecoration: 'none' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-white-50 text-xs mb-1.5 leading-snug" style={{ fontSize: '0.75rem' }}>
                  {toast.message}
                </p>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="text-white-50 text-xxs" style={{ fontSize: '0.65rem' }}>Just now</span>
                  <button
                    onClick={() => {
                      removeToast(toast.toastId);
                      setIsOpen(true);
                      if (onNotificationClick) onNotificationClick(toast);
                    }}
                    className="btn btn-warning btn-xs py-0.5 px-2 rounded-pill fw-bold text-dark"
                    style={{ fontSize: '0.65rem' }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bell Button and Dropdown Container */}
      <div className="position-relative" ref={dropdownRef}>
        <button
          type="button"
          className="btn p-0 d-flex align-items-center justify-content-center rounded-circle border-0 position-relative transition-all"
          style={{
            background: isOpen ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.08)',
            width: '38px',
            height: '38px',
            color: unreadCount > 0 ? '#FFC107' : 'rgba(255,255,255,0.75)'
          }}
          onClick={() => setIsOpen(!isOpen)}
          title="B2B Notifications"
          aria-label="View notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-dark"
              style={{ fontSize: '0.62rem', padding: '0.25em 0.5em' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div
            className="position-absolute shadow-2xl animate-fade-in-up"
            style={{
              right: 0,
              top: '48px',
              width: '380px',
              maxWidth: '92vw',
              background: '#10243A',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              zIndex: 1060,
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 border-bottom" style={{ background: '#0D1B2E', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <Bell size={16} className="text-warning" />
                  <span className="fw-bold text-white small">Live Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge bg-danger rounded-pill px-2 py-0.5" style={{ fontSize: '0.62rem' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm p-0 text-white-50 border-0"
                      style={{ fontSize: '0.7rem', textDecoration: 'underline' }}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm px-1.5 py-0.5 text-danger border border-danger border-opacity-25 rounded"
                      style={{ fontSize: '0.65rem', background: 'rgba(220,38,38,0.1)' }}
                      onClick={handleClearAll}
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="d-flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`btn btn-xs py-1 px-2.5 rounded-pill border-0 text-xxs fw-semibold ${
                    activeFilter === 'all' ? 'bg-warning text-dark' : 'bg-dark bg-opacity-50 text-white-50'
                  }`}
                  style={{ fontSize: '0.7rem' }}
                >
                  All ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('unread')}
                  className={`btn btn-xs py-1 px-2.5 rounded-pill border-0 text-xxs fw-semibold ${
                    activeFilter === 'unread' ? 'bg-warning text-dark' : 'bg-dark bg-opacity-50 text-white-50'
                  }`}
                  style={{ fontSize: '0.7rem' }}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {filteredNotifications.length === 0 ? (
                <div className="py-5 px-4 text-center text-white-50 small">
                  <Bell size={28} className="text-white-50 opacity-25 mb-2 d-block mx-auto" />
                  <p className="mb-0 fw-medium">No notifications {activeFilter === 'unread' ? 'marked unread' : 'yet'}.</p>
                  <span className="text-xxs opacity-75">You will receive live updates on bookings & approvals here.</span>
                </div>
              ) : (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border-bottom transition-all ${
                      !item.is_read ? 'bg-white bg-opacity-5' : ''
                    }`}
                    style={{
                      borderColor: 'rgba(255,255,255,0.06)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (!item.is_read) handleMarkRead(item.id);
                      if (onNotificationClick) onNotificationClick(item);
                    }}
                  >
                    <div className="d-flex align-items-start gap-2.5">
                      {getIcon(item.type)}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                          <h6 className={`mb-0 text-xs text-white ${!item.is_read ? 'fw-bold' : 'fw-semibold'}`}>
                            {item.title}
                          </h6>
                          {!item.is_read && (
                            <span 
                              className="rounded-circle bg-warning flex-shrink-0"
                              style={{ width: '7px', height: '7px', marginTop: '4px' }}
                              title="Unread"
                            />
                          )}
                        </div>
                        <p className="text-white-50 text-xs mb-1.5 leading-snug" style={{ fontSize: '0.74rem' }}>
                          {item.message}
                        </p>
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="text-white-50 text-xxs d-flex align-items-center gap-1" style={{ fontSize: '0.66rem' }}>
                            <Clock size={11} /> {formatTimeAgo(item.created_at)}
                          </span>
                          {!item.is_read && (
                            <button
                              type="button"
                              className="btn btn-link text-warning p-0 border-0 text-xxs text-decoration-none"
                              style={{ fontSize: '0.68rem' }}
                              onClick={(e) => handleMarkRead(item.id, e)}
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 text-center border-top" style={{ background: '#0D1B2E', borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-white-50 text-xxs" style={{ fontSize: '0.68rem' }}>
                WOW GOA B2B Real-Time Notification Stream
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
