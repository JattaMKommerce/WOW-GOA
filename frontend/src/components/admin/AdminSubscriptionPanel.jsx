import React, { useState, useEffect } from 'react';
import {
  CreditCard, CheckCircle, Clock, AlertTriangle, X, Upload,
  Star, Zap, RefreshCw, Calendar, ChevronRight
} from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

const COLORS = { primary: '#FF6333', dark: '#0D1B2E' };

function StatusBadge({ status }) {
  const map = {
    active: { bg: '#dcfce7', color: '#16a34a', label: 'Active' },
    pending_verification: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending Verification' },
    rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    expired: { bg: '#fee2e2', color: '#dc2626', label: 'Expired' },
    trial: { bg: '#dbeafe', color: '#2563eb', label: 'Trial' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: s.bg, color: s.color, fontSize: '0.68rem', textTransform: 'uppercase' }}>{s.label}</span>;
}

const BILLING_OPTIONS = [
  { id: 'monthly', label: 'Monthly', priceKey: 'monthly_price', discount: null },
  { id: 'quarterly', label: 'Quarterly', priceKey: 'quarterly_price', discount: '10% off' },
  { id: 'yearly', label: 'Yearly', priceKey: 'yearly_price', discount: '30% off' },
];

export default function AdminSubscriptionPanel({ currentUser }) {
  const [plans, setPlans] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [utrRef, setUtrRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('plans'); // plans | checkout | submitted
  const [subHistory, setSubHistory] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [plansRes, gwRes, mySubRes, histRes] = await Promise.all([
        apiFetch(`${API_BASE}?resource=subscription_plans`),
        apiFetch(`${API_BASE}?resource=payment_gateways`),
        apiFetch(`${API_BASE}?resource=my_subscription`),
        apiFetch(`${API_BASE}?resource=admin_subscriptions`),
      ]);
      const plansData = await plansRes.json();
      const gwData = await gwRes.json();
      const mySubData = await mySubRes.json();
      const histData = await histRes.json();
      setPlans(Array.isArray(plansData) ? plansData.filter(p => p.status === 'active') : []);
      setGateways(Array.isArray(gwData) ? gwData.filter(g => g.is_active) : []);
      setMySub(mySubData && mySubData.id ? mySubData : null);
      setSubHistory(Array.isArray(histData) ? histData : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmitSubscription = async () => {
    if (!selectedPlan || !selectedGateway) return alert('Select a plan and payment gateway');
    if (['bank_transfer', 'upi', 'manual'].includes(selectedGateway.type) && !proofFile) return alert('Please upload payment proof');

    setSubmitting(true);
    try {
      // Upload proof first if manual payment
      let proofUrl = '';
      if (proofFile) {
        const fd = new FormData();
        fd.append('action', 'upload_image');
        fd.append('image', proofFile);
        const upRes = await apiFetch(`${API_BASE}?action=upload_image`, { method: 'POST', body: fd });
        const upData = await upRes.json();
        proofUrl = upData.url || '';
      }

      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase_subscription',
          plan_id: selectedPlan.id,
          payment_method: selectedGateway.name,
          payment_proof: proofUrl,
          payment_reference: utrRef,
          notes,
          billing_cycle: billing,
        })
      });
      const data = await res.json();
      if (data.success) {
        setStep('submitted');
        load();
      } else {
        alert(data.error || 'Submission failed');
      }
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const getPrice = (plan) => {
    const key = BILLING_OPTIONS.find(b => b.id === billing)?.priceKey || 'monthly_price';
    return Number(plan[key] || plan.monthly_price || 0);
  };

  const isExpired = mySub && mySub.status !== 'active';
  const isActive = mySub && mySub.status === 'active';

  if (loading) return <div className="p-4 text-center"><div className="spinner-border" style={{ color: COLORS.primary }} /></div>;

  return (
    <div className="p-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-0" style={{ color: COLORS.dark, fontSize: '16px' }}>My Subscription</h5>
        <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Manage your platform subscription to keep your account active</p>
      </div>

      {currentUser?.status === 'suspended' && (
        <div className="alert alert-danger d-flex align-items-center gap-3 mb-4 rounded-3 border-0" style={{ background: '#fef2f2', color: '#991b1b' }}>
          <AlertTriangle size={24} className="flex-shrink-0" />
          <div>
            <h6 className="fw-bold mb-1">Account Suspended</h6>
            <p className="mb-0" style={{ fontSize: '0.85rem' }}>Your admin account has been suspended or your subscription has expired. You cannot access the platform, manage vendors, or receive new bookings. Please renew your subscription below or contact the Superadmin.</p>
          </div>
        </div>
      )}

      {/* Current Subscription Card */}
      {mySub ? (
        <div className="rounded-3 p-4 mb-4" style={{ background: isActive ? 'linear-gradient(135deg,#dcfce7,#f0fdf4)' : 'linear-gradient(135deg,#fee2e2,#fef2f2)', border: `1.5px solid ${isActive ? '#16a34a' : '#dc2626'}33` }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: isActive ? '#16a34a' : '#dc2626' }}>
                {isActive ? <CheckCircle size={22} color="#fff" /> : <AlertTriangle size={22} color="#fff" />}
              </div>
              <div>
                <div className="fw-bold" style={{ fontSize: '15px', color: COLORS.dark }}>{mySub.plan_name || `Plan #${mySub.plan_id}`}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {mySub.start_date && `Valid: ${mySub.start_date} → ${mySub.end_date || 'Ongoing'}`}
                </div>
                <StatusBadge status={mySub.status} />
              </div>
            </div>
            {!isActive && (
              <button className="btn px-4 py-2 fw-bold text-white rounded-3" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={() => setStep('plans')}>
                Renew Subscription <ChevronRight size={14} className="ms-1" />
              </button>
            )}
            {isActive && (
              <button className="btn px-4 py-2 fw-bold rounded-3" style={{ background: '#fff', border: '1px solid #16a34a', color: '#16a34a' }} onClick={() => setStep('plans')}>
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3 p-4 mb-4 d-flex align-items-center gap-3" style={{ background: '#fef9c3', border: '1.5px solid #ca8a04' }}>
          <AlertTriangle size={24} style={{ color: '#ca8a04', flexShrink: 0 }} />
          <div>
            <div className="fw-bold" style={{ color: '#92400e' }}>No Active Subscription</div>
            <div style={{ fontSize: '0.82rem', color: '#92400e' }}>Subscribe to a plan to unlock full platform access for your vendors and customers.</div>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      {step === 'plans' && (
        <>
          {/* Billing Toggle */}
          <div className="d-flex align-items-center gap-2 mb-4">
            <span className="fw-bold" style={{ fontSize: '0.82rem', color: COLORS.dark }}>Billing Cycle:</span>
            <div className="d-flex gap-1 p-1 rounded-3" style={{ background: '#f1f5f9' }}>
              {BILLING_OPTIONS.map(b => (
                <button key={b.id} className="btn btn-sm px-3 rounded-2 fw-bold" style={{ fontSize: '0.78rem', background: billing === b.id ? '#fff' : 'transparent', color: billing === b.id ? COLORS.dark : '#64748b', boxShadow: billing === b.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }} onClick={() => setBilling(b.id)}>
                  {b.label} {b.discount && <span style={{ fontSize: '0.65rem', color: '#16a34a' }}>{b.discount}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="row g-4">
            {plans.map(plan => {
              const price = getPrice(plan);
              const features = Array.isArray(plan.features) ? plan.features : (typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : []);
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div key={plan.id} className="col-md-6 col-xl-4">
                  <div
                    className="rounded-3 h-100 p-4"
                    style={{
                      background: isSelected ? `linear-gradient(135deg,#fff7f5,#fff)` : '#fff',
                      border: isSelected ? `2px solid ${COLORS.primary}` : '1px solid rgba(0,0,0,0.07)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 8px 24px rgba(255,99,51,0.15)` : '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                    onClick={() => setSelectedPlan(isSelected ? null : plan)}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="fw-bold" style={{ fontSize: '16px', color: COLORS.dark }}>{plan.name}</div>
                      {isSelected && <CheckCircle size={20} style={{ color: COLORS.primary }} />}
                    </div>
                    <div className="mb-3">
                      <span className="fw-bold" style={{ fontSize: '2rem', color: COLORS.dark }}>₹{price.toLocaleString()}</span>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>/{billing === 'monthly' ? 'mo' : billing === 'quarterly' ? 'qtr' : 'yr'}</span>
                    </div>
                    {plan.trial_days > 0 && <div className="mb-2"><span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.65rem' }}>{plan.trial_days}-day free trial</span></div>}
                    <div className="d-flex flex-column gap-1 mt-3">
                      {features.slice(0, 5).map((f, i) => (
                        <div key={i} className="d-flex align-items-center gap-2" style={{ fontSize: '0.8rem', color: '#374151' }}>
                          <CheckCircle size={12} style={{ color: '#16a34a', flexShrink: 0 }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {plans.length === 0 && (
              <div className="col-12 text-center py-5 text-muted">No subscription plans available. Contact your superadmin.</div>
            )}
          </div>

          {selectedPlan && (
            <div className="mt-4">
              <button className="btn px-5 py-3 fw-bold text-white rounded-3 w-100" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)`, fontSize: '1rem' }} onClick={() => setStep('checkout')}>
                Proceed to Payment — ₹{getPrice(selectedPlan).toLocaleString()} <ChevronRight size={16} className="ms-1" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Checkout */}
      {step === 'checkout' && selectedPlan && (
        <div className="row g-4">
          <div className="col-md-7">
            <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <h6 className="fw-bold mb-3" style={{ color: COLORS.dark }}>Select Payment Method</h6>
              <div className="d-flex flex-column gap-2">
                {gateways.map(gw => (
                  <div
                    key={gw.id}
                    className="rounded-2 p-3 d-flex align-items-start gap-3"
                    style={{ border: `1.5px solid ${selectedGateway?.id === gw.id ? COLORS.primary : '#e2e8f0'}`, cursor: 'pointer', background: selectedGateway?.id === gw.id ? '#fff7f5' : '#fafafa' }}
                    onClick={() => setSelectedGateway(gw)}
                  >
                    <div className="mt-1"><input type="radio" readOnly checked={selectedGateway?.id === gw.id} /></div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.85rem', color: COLORS.dark }}>{gw.name}</div>
                      {gw.instructions && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{gw.instructions}</div>}
                      {/* Show config details */}
                      {(() => {
                        const cfg = typeof gw.config_json === 'string' ? JSON.parse(gw.config_json || '{}') : {};
                        return Object.entries(cfg).filter(([k]) => !k.includes('secret') && !k.includes('qr')).map(([k, v]) => v && (
                          <div key={k} style={{ fontSize: '0.75rem', color: '#374151', marginTop: '2px' }}>
                            <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem' }}>{k.replace(/_/g, ' ')}: </span>
                            <span className="fw-bold">{v}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ))}
                {gateways.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No payment gateways configured. Contact superadmin.</p>}
              </div>

              {/* Upload proof for manual gateways */}
              {selectedGateway && ['bank_transfer', 'upi', 'manual'].includes(selectedGateway.type) && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3" style={{ color: COLORS.dark }}>Upload Payment Proof</h6>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Screenshot / Receipt *</label>
                    <input type="file" className="form-control" accept="image/*" onChange={handleFileChange} />
                    {proofPreview && <img src={proofPreview} alt="proof" className="mt-2 rounded-2" style={{ maxHeight: '120px', objectFit: 'cover' }} />}
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#475569' }}>UTR / Reference Number</label>
                      <input className="form-control form-control-sm" value={utrRef} onChange={e => setUtrRef(e.target.value)} placeholder="Transaction reference..." />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Date</label>
                      <input type="date" className="form-control form-control-sm" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={{ fontSize: '0.78rem', color: '#475569' }}>Notes (Optional)</label>
                      <textarea className="form-control form-control-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-md-5">
            <div className="rounded-3 p-4 sticky-top" style={{ background: COLORS.dark, top: '16px' }}>
              <div className="fw-bold text-white mb-3" style={{ fontSize: '14px' }}>Order Summary</div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                <span>{selectedPlan.name}</span>
                <span className="text-white fw-bold">₹{getPrice(selectedPlan).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between mb-2" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                <span>Billing</span><span>{billing}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '12px 0' }} />
              <div className="d-flex justify-content-between mb-4" style={{ fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
                <span>Total</span><span>₹{getPrice(selectedPlan).toLocaleString()}</span>
              </div>
              <button className="btn w-100 fw-bold text-white py-3 rounded-3" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)`, fontSize: '0.9rem' }} onClick={handleSubmitSubscription} disabled={submitting || !selectedGateway}>
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>
              <button className="btn w-100 mt-2 fw-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }} onClick={() => setStep('plans')}>
                ← Change Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted */}
      {step === 'submitted' && (
        <div className="rounded-3 p-5 text-center" style={{ background: '#f0fdf4', border: '1.5px solid #16a34a' }}>
          <CheckCircle size={48} style={{ color: '#16a34a' }} className="mb-3" />
          <h5 className="fw-bold" style={{ color: COLORS.dark }}>Payment Submitted!</h5>
          <p style={{ color: '#374151', fontSize: '0.85rem' }}>Your subscription payment has been submitted for verification. You'll be notified once it's approved.</p>
          <button className="btn px-4 py-2 fw-bold text-white rounded-3 mt-2" style={{ background: `linear-gradient(90deg,${COLORS.primary},#FF8A00)` }} onClick={() => { setStep('plans'); load(); }}>
            View Plans
          </button>
        </div>
      )}

      {/* Subscription History */}
      {subHistory.length > 0 && step === 'plans' && (
        <div className="mt-5">
          <h6 className="fw-bold mb-3" style={{ color: COLORS.dark, fontSize: '14px' }}>Subscription History</h6>
          <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
            <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {['Plan', 'Method', 'Start', 'End', 'Status'].map(h => (
                    <th key={h} className="px-3 py-3 fw-bold" style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subHistory.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td className="px-3 py-2 fw-bold">{s.plan_name || `Plan #${s.plan_id}`}</td>
                    <td className="px-3 py-2 text-muted">{s.payment_method}</td>
                    <td className="px-3 py-2 text-muted">{s.start_date || '—'}</td>
                    <td className="px-3 py-2 text-muted">{s.end_date || '—'}</td>
                    <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
