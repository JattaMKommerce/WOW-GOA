import React, { useState, useEffect } from 'react';
import {
  Globe, Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight,
  Landmark, Smartphone, Zap, CreditCard, ChevronDown, ChevronUp, Save
} from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

const COLORS = { primary: '#FF6333', dark: '#0D1B2E' };

const GATEWAY_TYPES = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: <Landmark size={16} />, color: '#2563eb' },
  { id: 'upi', label: 'UPI', icon: <Smartphone size={16} />, color: '#7c3aed' },
  { id: 'razorpay', label: 'Razorpay', icon: <Zap size={16} />, color: '#0f766e' },
  { id: 'manual', label: 'Manual / Custom', icon: <CreditCard size={16} />, color: '#ca8a04' },
];

const TYPE_FIELDS = {
  bank_transfer: [
    { key: 'account_name', label: 'Account Holder Name', type: 'text' },
    { key: 'bank_name', label: 'Bank Name', type: 'text' },
    { key: 'account_number', label: 'Account Number', type: 'text' },
    { key: 'ifsc', label: 'IFSC / SWIFT Code', type: 'text' },
    { key: 'branch', label: 'Branch', type: 'text' },
    { key: 'qr_url', label: 'QR Code URL (Optional)', type: 'text' },
  ],
  upi: [
    { key: 'upi_id', label: 'UPI ID', type: 'text' },
    { key: 'qr_url', label: 'QR Code URL (Optional)', type: 'text' },
  ],
  razorpay: [
    { key: 'key_id', label: 'Razorpay Key ID', type: 'text' },
    { key: 'key_secret', label: 'Razorpay Key Secret', type: 'password' },
    { key: 'webhook_secret', label: 'Webhook Secret (Optional)', type: 'text' },
  ],
  manual: [
    { key: 'display_name', label: 'Display Name', type: 'text' },
    { key: 'payment_link', label: 'Payment Link / Instructions URL', type: 'text' },
  ],
};

function GatewayModal({ gateway, onClose, onSave }) {
  const getInitialConfig = (gw) => {
    if (!gw) return {};
    if (typeof gw.config_json === 'string') {
      try { return JSON.parse(gw.config_json || '{}'); } catch (e) { return {}; }
    }
    return gw.config || gw.config_json || {};
  };

  const [form, setForm] = useState(gateway
    ? { ...gateway, config: getInitialConfig(gateway) }
    : { name: '', type: 'bank_transfer', config: {}, instructions: '', is_active: 1 }
  );
  const [saving, setSaving] = useState(false);

  const selectedType = GATEWAY_TYPES.find(t => t.id === form.type) || GATEWAY_TYPES[0];
  const fields = TYPE_FIELDS[form.type] || [];

  const handleConfigChange = (key, val) => setForm(f => ({ ...f, config: { ...f.config, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const action = form.id ? 'update_payment_gateway' : 'create_payment_gateway';
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...form, config_json: JSON.stringify(form.config || {}) })
      });
      const data = await res.json();
      if (data.success) { onSave(); onClose(); }
      else alert(data.error || 'Failed');
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div
      className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(13,27,46,0.7)', backdropFilter: 'blur(6px)', zIndex: 1060, padding: '16px' }}
      onClick={onClose}
    >
      <div
        className="rounded-4 overflow-hidden shadow-lg d-flex flex-column"
        style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', background: '#fff' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0"
          style={{ background: COLORS.dark, borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '15px' }}>
            {form.id ? 'Edit Payment Gateway' : 'Add Payment Gateway'}
          </h6>
          <button className="btn p-1 border-0 text-white-50" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Scrollable Body */}
        <form id="gateway-form" onSubmit={handleSubmit} className="p-4 flex-grow-1" style={{ overflowY: 'auto' }}>
          <div className="mb-3">
            <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Gateway Name *</label>
            <input
              className="form-control"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              placeholder="e.g. HDFC Bank Transfer"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Gateway Type *</label>
            <div className="d-flex flex-wrap gap-2">
              {GATEWAY_TYPES.map(t => (
                <button
                  type="button"
                  key={t.id}
                  className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-bold"
                  style={{
                    fontSize: '0.8rem',
                    background: form.type === t.id ? t.color : '#f8fafc',
                    color: form.type === t.id ? '#fff' : '#475569',
                    border: `1.5px solid ${form.type === t.id ? t.color : '#e2e8f0'}`
                  }}
                  onClick={() => setForm(f => ({
                    ...f,
                    type: t.id,
                    config: (gateway && gateway.type === t.id) ? getInitialConfig(gateway) : {}
                  }))}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic config fields */}
          {fields.length > 0 && (
            <div className="mb-3 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="fw-bold mb-2" style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {selectedType.label} Configuration
              </div>
              <div className="row g-2">
                {fields.map(f => (
                  <div key={f.key} className={form.type === 'bank_transfer' ? 'col-md-6' : 'col-12'}>
                    <label className="form-label mb-1" style={{ fontSize: '0.75rem', color: '#475569' }}>{f.label}</label>
                    <input
                      type={f.type}
                      className="form-control form-control-sm"
                      value={form.config?.[f.key] || ''}
                      onChange={e => handleConfigChange(f.key, e.target.value)}
                      placeholder={f.label}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Instructions (shown to users)</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.instructions}
              onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
              placeholder="Transfer to the above account and upload payment proof..."
            />
          </div>

          <div className="mb-2 d-flex align-items-center gap-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="gw_active"
              checked={form.is_active == 1}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))}
            />
            <label htmlFor="gw_active" className="form-check-label fw-bold" style={{ fontSize: '0.82rem', color: '#475569' }}>
              Gateway Active (visible to users)
            </label>
          </div>
        </form>

        {/* Fixed Footer */}
        <div
          className="d-flex gap-2 justify-content-end px-4 py-3 flex-shrink-0"
          style={{ background: '#fff', borderTop: '1px solid #e2e8f0' }}
        >
          <button type="button" className="btn btn-light fw-bold px-4" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="gateway-form"
            className="btn fw-bold px-5 text-white shadow-sm"
            style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }}
            disabled={saving}
          >
            {saving ? 'Saving...' : (form.id ? 'Update Gateway' : 'Add Gateway')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentGatewayManager() {
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editGateway, setEditGateway] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=payment_gateways`);
      const data = await res.json();
      setGateways(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setGateways([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment gateway?')) return;
    await apiFetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_payment_gateway', id }) });
    load();
  };

  const handleToggle = async (gw) => {
    const config = typeof gw.config_json === 'string' ? JSON.parse(gw.config_json || '{}') : (gw.config || {});
    await apiFetch(API_BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_payment_gateway', ...gw, config_json: JSON.stringify(config), is_active: gw.is_active ? 0 : 1 }) });
    load();
  };

  const gatewayList = Array.isArray(gateways) ? gateways : [];

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: COLORS.dark, fontSize: '16px' }}>Payment Gateways</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Configure payment methods available for Admin subscriptions and Vendor wallet recharges</p>
        </div>
        <button className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={() => { setEditGateway(null); setShowModal(true); }}>
          <Plus size={14} /> Add Gateway
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: COLORS.primary }} /></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {gatewayList.map(gw => {
            const typeInfo = GATEWAY_TYPES.find(t => t.id === gw.type) || GATEWAY_TYPES[3];
            const config = typeof gw.config_json === 'string' ? JSON.parse(gw.config_json || '{}') : (gw.config || {});
            const isExp = expanded === gw.id;
            return (
              <div key={gw.id} className="rounded-3 overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: `${typeInfo.color}15` }}>
                      <span style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                    </div>
                    <div>
                      <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '14px' }}>{gw.name}</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: `${typeInfo.color}15`, color: typeInfo.color, fontSize: '0.65rem' }}>{typeInfo.label}</span>
                        <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: gw.is_active ? '#dcfce7' : '#fee2e2', color: gw.is_active ? '#16a34a' : '#dc2626', fontSize: '0.65rem' }}>
                          {gw.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm p-1" style={{ color: gw.is_active ? '#16a34a' : '#94a3b8' }} onClick={() => handleToggle(gw)}>
                      {gw.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button className="btn btn-sm p-1" style={{ color: '#2563eb' }} onClick={() => { setEditGateway(gw); setShowModal(true); }}><Edit2 size={14} /></button>
                    <button className="btn btn-sm p-1" style={{ color: '#dc2626' }} onClick={() => handleDelete(gw.id)}><Trash2 size={14} /></button>
                    <button className="btn btn-sm p-1" style={{ color: '#94a3b8' }} onClick={() => setExpanded(isExp ? null : gw.id)}>
                      {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {isExp && (
                  <div className="px-4 pb-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="row g-2 mt-2">
                      {Object.entries(config).map(([k, v]) => v && (
                        <div key={k} className="col-md-6">
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: '0.82rem', color: COLORS.dark, fontWeight: 600 }}>{k.includes('secret') ? '••••••••' : String(v)}</div>
                        </div>
                      ))}
                    </div>
                    {gw.instructions && (
                      <div className="mt-3 p-3 rounded-2" style={{ background: '#f8fafc', fontSize: '0.82rem', color: '#475569' }}>
                        <div className="fw-bold mb-1" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PAYMENT INSTRUCTIONS</div>
                        {gw.instructions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {gatewayList.length === 0 && (
            <div className="rounded-3 text-center p-5" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <Globe size={40} className="mb-3" style={{ color: '#94a3b8' }} />
              <h6 className="fw-bold" style={{ color: COLORS.dark }}>No Payment Gateways Configured</h6>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Add at least one payment method to accept subscriptions and wallet recharges.</p>
              <button className="btn px-4 py-2 fw-bold text-white rounded-3" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={() => { setEditGateway(null); setShowModal(true); }}>
                <Plus size={14} className="me-1" /> Add First Gateway
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && <GatewayModal gateway={editGateway} onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
