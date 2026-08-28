import React, { useState } from 'react';
import { Settings, Bell, Shield, Globe, Moon, Sun, Check } from 'lucide-react';
import * as api from '../../../services/api';

export default function PMSSettings({ currentUser }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`pms_settings_${currentUser?.id || 'default'}`);
      return saved ? JSON.parse(saved) : {
        email_bookings: true, email_payments: true, email_reviews: false, email_system: true,
        sms_bookings: true, sms_reminders: false,
        dark_mode: false, compact_view: false,
        booking_auto_confirm: false, checkin_reminder_days: 1, checkout_reminder_days: 0,
        default_currency: 'INR', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY'
      };
    } catch {
      return {
        email_bookings: true, email_payments: true, email_reviews: false, email_system: true,
        sms_bookings: true, sms_reminders: false,
        dark_mode: false, compact_view: false,
        booking_auto_confirm: false, checkin_reminder_days: 1, checkout_reminder_days: 0,
        default_currency: 'INR', timezone: 'Asia/Kolkata', date_format: 'DD/MM/YYYY'
      };
    }
  });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const toggle = (k) => setSettings(s => ({ ...s, [k]: !s[k] }));

  const handleSave = async () => {
    localStorage.setItem(`pms_settings_${currentUser?.id || 'default'}`, JSON.stringify(settings));
    await api.pmsLogActivity({
      vendor_id: currentUser?.id,
      action: 'Updated Preferences',
      module: 'Settings',
      details: 'PMS operational settings saved'
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const ToggleRow = ({ label, sub, stateKey }) => (
    <div className="d-flex align-items-center justify-content-between py-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
      <div>
        <div className="fw-semibold" style={{ fontSize: '0.85rem', color: '#2d3748' }}>{label}</div>
        {sub && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sub}</div>}
      </div>
      <div onClick={() => toggle(stateKey)} className="position-relative rounded-pill" style={{ width: '44px', height: '24px', background: settings[stateKey] ? '#0D1B2E' : '#dee2e6', cursor: 'pointer', transition: 'background 0.2s' }}>
        <div className="position-absolute rounded-circle bg-white" style={{ width: '18px', height: '18px', top: '3px', left: settings[stateKey] ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
      </div>
    </div>
  );

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="mb-4"><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Settings</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage your notification, booking and display preferences</p></div>
      {saved && <div className="alert alert-success py-2 px-3 mb-4 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}><Check size={14} /> Settings saved successfully!</div>}

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Bell size={18} className="text-primary" />
              <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>Email Notifications</h6>
            </div>
            <ToggleRow label="New Booking" sub="Email on every new reservation" stateKey="email_bookings" />
            <ToggleRow label="Payment Updates" sub="Paid/pending payment notifications" stateKey="email_payments" />
            <ToggleRow label="Guest Reviews" sub="New review notifications" stateKey="email_reviews" />
            <ToggleRow label="System Updates" sub="Platform news and announcements" stateKey="email_system" />
          </div>

          <div className="card border-0 rounded-4 shadow-sm p-4 mt-4" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Bell size={18} style={{ color: '#00b894' }} />
              <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>SMS Notifications</h6>
            </div>
            <ToggleRow label="SMS on New Booking" sub="Receive SMS for every booking" stateKey="sms_bookings" />
            <ToggleRow label="Check-in Reminders" sub="Reminder before guest arrives" stateKey="sms_reminders" />
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Settings size={18} style={{ color: '#6c5ce7' }} />
              <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>Booking Preferences</h6>
            </div>
            <ToggleRow label="Auto-confirm Bookings" sub="Automatically confirm all new bookings" stateKey="booking_auto_confirm" />
            <div className="py-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
              <label className="form-label fw-semibold d-block mb-1" style={{ fontSize: '0.82rem' }}>Check-in reminder (days before)</label>
              <input type="number" className="form-control form-control-sm rounded-3" style={{ maxWidth: '100px' }} value={settings.checkin_reminder_days} onChange={e => set('checkin_reminder_days', parseInt(e.target.value))} min="0" max="7" />
            </div>
          </div>

          <div className="card border-0 rounded-4 shadow-sm p-4 mt-4" style={{ background: '#fff' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Globe size={18} style={{ color: '#0984e3' }} />
              <h6 className="fw-bold mb-0" style={{ color: '#1a2b4a' }}>Regional Settings</h6>
            </div>
            {[['Currency', 'default_currency', ['INR'], 'select'], ['Timezone', 'timezone', ['Asia/Kolkata', 'Asia/Mumbai', 'UTC'], 'select'], ['Date Format', 'date_format', ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], 'select']].map(([l, k, opts, type]) => (
              <div key={k} className="d-flex align-items-center justify-content-between py-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
                <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{l}</span>
                <select className="form-select form-select-sm rounded-pill" style={{ width: '180px' }} value={settings[k]} onChange={e => set(k, e.target.value)}>
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button onClick={handleSave} className="btn rounded-pill px-5 fw-bold d-flex align-items-center gap-2" style={{ background: '#0D1B2E', color: '#fff' }}>
          <Check size={15} /> Save Settings
        </button>
      </div>
    </div>
  );
}
