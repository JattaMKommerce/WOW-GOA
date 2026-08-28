import React, { useState, useEffect } from 'react';
import { UserCircle, Building, Mail, Phone, MapPin, Save, CheckCircle, Landmark } from 'lucide-react';
import * as api from '../../../services/api';

export default function PMSVendorProfile({ currentUser, vendorHotels = [], mode = 'profile' }) {
  const [form, setForm] = useState({
    name: currentUser?.username || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    city: 'Goa',
    state: 'Goa',
    country: 'India',
    pincode: '',
    company_name: '',
    gst_number: '',
    // Bank
    account_holder: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'Current',
    upi_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (currentUser) {
      setForm(prev => ({
        ...prev,
        name: currentUser.name || currentUser.username || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        city: currentUser.city || 'Goa'
      }));

      // Fetch existing bank details if in bank mode
      if (mode === 'bank' && currentUser.id) {
        api.getVendorPaymentMethods(currentUser.id).then(res => {
          if (Array.isArray(res) && res.length > 0) {
            const bank = res.find(m => m.method_type === 'Bank Transfer') || res[0];
            if (bank) {
              setForm(prev => ({
                ...prev,
                account_holder: bank.account_name || prev.account_holder,
                bank_name: bank.bank_name || prev.bank_name,
                account_number: bank.account_number || prev.account_number,
                ifsc_code: bank.ifsc_code || prev.ifsc_code,
                upi_id: bank.upi_id || prev.upi_id
              }));
            }
          }
        }).catch(err => console.error('Failed to load bank details:', err));
      }
    }
  }, [currentUser, mode]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'bank') {
        await api.addVendorPaymentMethod({
          vendor_id: currentUser.id,
          method_type: 'Bank Transfer',
          display_name: `${form.bank_name || 'Bank'} Account`,
          account_name: form.account_holder,
          bank_name: form.bank_name,
          account_number: form.account_number,
          ifsc_code: form.ifsc_code,
          upi_id: form.upi_id
        });
      } else {
        await api.updateUser({
          id: currentUser.id,
          username: currentUser.username,
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          role: currentUser.role || 'hotel_vendor'
        });
      }
      setSuccess(mode === 'bank' ? 'Bank details saved successfully!' : 'Profile saved successfully!');
      await api.pmsLogActivity({
        vendor_id: currentUser.id,
        action: mode === 'bank' ? 'Updated Bank Details' : 'Updated Profile',
        module: 'Account',
        details: 'Settings updated'
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = (label, key, type = 'text', placeholder = '') => (
    <div className="mb-3">
      <label className="form-label fw-semibold" style={{ fontSize: '0.82rem', color: '#495057' }}>{label}</label>
      <input type={type} className="form-control form-control-sm rounded-3" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
    </div>
  );

  if (mode === 'bank') {
    return (
      <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
        <div className="mb-4"><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Bank Details</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Settlement payments will be transferred to this account</p></div>
        {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>✅ {success}</div>}
        <div className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff', maxWidth: '600px' }}>
          <div className="alert py-2 px-3 mb-4 d-flex align-items-start gap-2" style={{ background: '#fff9e6', border: '1px solid #fdcb6e', fontSize: '0.82rem', borderRadius: '10px' }}>
            <span>🔒</span>
            <span>Your bank details are encrypted and securely stored. Only used for settlement transfers.</span>
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-6">{inp('Account Holder Name', 'account_holder', 'text', 'As per bank records')}</div>
            <div className="col-12 col-md-6">{inp('Bank Name', 'bank_name', 'text', 'e.g. HDFC Bank')}</div>
            <div className="col-12 col-md-6">{inp('Account Number', 'account_number', 'text', 'Enter account number')}</div>
            <div className="col-12 col-md-6">{inp('IFSC Code', 'ifsc_code', 'text', 'e.g. HDFC0001234')}</div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Account Type</label>
              <select className="form-select form-select-sm rounded-3" value={form.account_type} onChange={e => set('account_type', e.target.value)}>
                {['Current', 'Savings'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">{inp('UPI ID (Optional)', 'upi_id', 'text', 'e.g. name@paytm')}</div>
          </div>
          <div className="mt-4 d-flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn rounded-pill px-5 fw-bold d-flex align-items-center gap-2" style={{ background: '#0D1B2E', color: '#fff' }}>
              <Save size={15} />{saving ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="mb-4"><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Vendor Profile</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Update your contact information and business details</p></div>
      {success && <div className="alert alert-success py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}>✅ {success}</div>}

      <div className="row g-4">
        <div className="col-12 col-lg-3">
          <div className="card border-0 rounded-4 shadow-sm p-4 text-center" style={{ background: '#fff' }}>
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark mx-auto mb-3" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #FFC107, #FF8A00)', fontSize: '32px' }}>
              {(currentUser.username || 'V')[0].toUpperCase()}
            </div>
            <h5 className="fw-bold mb-1">{currentUser.username}</h5>
            <span className="badge rounded-pill" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9', fontSize: '0.75rem' }}>Hotel Vendor</span>
            <hr className="my-3" />
            <div className="text-start">
              <div className="text-muted mb-1" style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Summary</div>
              {[['Hotels', vendorHotels.length], ['Active', vendorHotels.filter(h => h.hotel_status === 'Live').length], ['Account ID', '#' + currentUser.id?.slice(-6)]].map(([l, v]) => (
                <div key={l} className="d-flex justify-content-between py-1" style={{ fontSize: '0.82rem' }}>
                  <span className="text-muted">{l}</span>
                  <span className="fw-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-9">
          <div className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff' }}>
            <h6 className="fw-bold mb-4" style={{ color: '#1a2b4a', borderBottom: '2px solid #FF6333', paddingBottom: '8px', display: 'inline-block' }}>Personal Information</h6>
            <div className="row g-3">
              <div className="col-12 col-md-6">{inp('Full Name', 'name', 'text', 'Your full name')}</div>
              <div className="col-12 col-md-6">{inp('Email Address', 'email', 'email', 'your@email.com')}</div>
              <div className="col-12 col-md-6">{inp('Phone Number', 'phone', 'tel', '+91 9876543210')}</div>
              <div className="col-12 col-md-6">{inp('Company / Business Name', 'company_name', 'text', 'Your business name')}</div>
              <div className="col-12">{inp('Address', 'address', 'text', 'Street, Area')}</div>
              <div className="col-6 col-md-4">{inp('City', 'city')}</div>
              <div className="col-6 col-md-4">{inp('State', 'state')}</div>
              <div className="col-12 col-md-4">{inp('PIN Code', 'pincode')}</div>
              <div className="col-12 col-md-6">{inp('GST Number', 'gst_number', 'text', 'e.g. 30AABCT1332L1ZT')}</div>
            </div>
            <div className="mt-4">
              <button onClick={handleSave} disabled={saving} className="btn rounded-pill px-5 fw-bold d-flex align-items-center gap-2" style={{ background: '#0D1B2E', color: '#fff' }}>
                <Save size={15} />{saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
