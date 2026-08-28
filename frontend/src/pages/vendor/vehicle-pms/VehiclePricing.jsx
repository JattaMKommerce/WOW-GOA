import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { updateVehicle } from '../../../services/api';

const PRICE_TYPES = ['Hourly', 'Daily', 'Weekly', 'Monthly'];

export default function VehiclePricing({ cars = [], bikes = [], onUpdateCar, onUpdateBike }) {
  const allVehicles = [
    ...(cars || []).map(c => ({ ...c, _type: 'car' })),
    ...(bikes || []).map(b => ({ ...b, _type: 'bike' })),
  ];

  const [basePricing, setBasePricing] = useState(() => {
    try {
      const saved = localStorage.getItem('vendor_vehicle_base_pricing');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { hourly: 200, daily: 1500, weekly: 9000, monthly: 32000 };
  });

  const [vehiclePricing, setVehiclePricing] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Initialize vehicle pricing map from real vehicle data
  useEffect(() => {
    const initialMap = {};
    allVehicles.forEach(v => {
      const dailyPrice = parseInt(v.price, 10) || 1500;
      initialMap[v.id] = {
        daily: dailyPrice,
        hourly: Math.round(dailyPrice / 8),
        weekly: Math.round(dailyPrice * 6),
        monthly: Math.round(dailyPrice * 24)
      };
    });
    setVehiclePricing(initialMap);
  }, [cars, bikes]);

  const [seasonalRules, setSeasonalRules] = useState(() => {
    try {
      const saved = localStorage.getItem('vendor_vehicle_seasonal_rules');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { id: 1, name: 'Peak Season (Oct–Mar)', type: 'add', value: 25, unit: '%', start: '2026-10-01', end: '2027-03-31' },
      { id: 2, name: 'Monsoon Off-Season (Jun–Sep)', type: 'subtract', value: 20, unit: '%', start: '2026-06-01', end: '2026-09-30' },
    ];
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // 1. Save base pricing and seasonal rules to localStorage
      localStorage.setItem('vendor_vehicle_base_pricing', JSON.stringify(basePricing));
      localStorage.setItem('vendor_vehicle_seasonal_rules', JSON.stringify(seasonalRules));

      // 2. Persist updated daily pricing for each vehicle to backend database
      for (const v of allVehicles) {
        const vp = vehiclePricing[v.id];
        if (vp && vp.daily) {
          const newPrice = parseInt(vp.daily, 10);
          if (newPrice !== v.price) {
            const updatePayload = {
              ...v,
              id: v.id,
              type: v._type,
              price: newPrice
            };
            if (v._type === 'car' && onUpdateCar) {
              await onUpdateCar(updatePayload);
            } else if (v._type === 'bike' && onUpdateBike) {
              await onUpdateBike(updatePayload);
            } else {
              await updateVehicle(updatePayload);
            }
          }
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save pricing: ' + (err.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  const removeRule = (id) => {
    const updated = seasonalRules.filter(x => x.id !== id);
    setSeasonalRules(updated);
    localStorage.setItem('vendor_vehicle_seasonal_rules', JSON.stringify(updated));
  };

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Pricing Management</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Configure vehicle daily rates, base pricing, and seasonal adjustments</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3"
          style={{ background: saved ? '#16a34a' : 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}
        >
          {saving ? (
            <><Loader2 size={14} className="spinner-border spinner-border-sm" /> Saving...</>
          ) : saved ? (
            <><CheckCircle2 size={14} /> Saved Successfully!</>
          ) : (
            <><Save size={14} /> Save All Pricing</>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4 rounded-3 d-flex align-items-center gap-2" style={{ fontSize: '0.82rem' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Base Pricing */}
      <div className="rounded-3 p-4 mb-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <h6 className="fw-bold mb-3" style={{ color: '#0D1B2E', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Default Base Pricing</h6>
        <div className="row g-3">
          {PRICE_TYPES.map(type => {
            const key = type.toLowerCase();
            return (
              <div key={key} className="col-6 col-md-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>{type} Rate (₹)</label>
                <div className="input-group">
                  <span className="input-group-text fw-bold" style={{ background: '#f8fafc', color: '#94a3b8', fontSize: '0.85rem' }}>₹</span>
                  <input
                    type="number"
                    className="form-control"
                    style={{ fontSize: '0.85rem', borderRadius: '0 8px 8px 0' }}
                    value={basePricing[key] || ''}
                    onChange={e => setBasePricing(p => ({ ...p, [key]: parseInt(e.target.value, 10) || 0 }))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-Vehicle Pricing */}
      <div className="rounded-3 overflow-hidden mb-4 shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Vehicle Pricing (Saved to Database)</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Configure daily rental price for each vehicle in your fleet</div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.83rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Vehicle', 'Type', 'Hourly (₹)', 'Daily Rate (₹) *', 'Weekly (₹)'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allVehicles.map(v => {
                const vp = vehiclePricing[v.id] || { daily: v.price || 1500, hourly: Math.round((v.price || 1500) / 8), weekly: (v.price || 1500) * 6 };
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td className="px-3 py-2 fw-bold" style={{ color: '#0D1B2E' }}>{v.name}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: v._type === 'car' ? '#dbeafe' : '#ede9fe', color: v._type === 'car' ? '#2563eb' : '#7c3aed', fontSize: '0.65rem', textTransform: 'uppercase' }}>{v._type}</span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '90px', fontSize: '0.82rem', borderRadius: '8px' }}
                        value={vp.hourly || ''}
                        onChange={e => setVehiclePricing(p => ({ ...p, [v.id]: { ...p[v.id], hourly: parseInt(e.target.value, 10) || 0 } }))}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="form-control form-control-sm fw-bold text-primary"
                        style={{ width: '110px', fontSize: '0.85rem', borderRadius: '8px', border: '1.5px solid #93c5fd' }}
                        value={vp.daily || ''}
                        onChange={e => {
                          const daily = parseInt(e.target.value, 10) || 0;
                          setVehiclePricing(p => ({
                            ...p,
                            [v.id]: {
                              ...p[v.id],
                              daily,
                              hourly: Math.round(daily / 8),
                              weekly: Math.round(daily * 6)
                            }
                          }));
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: '100px', fontSize: '0.82rem', borderRadius: '8px' }}
                        value={vp.weekly || ''}
                        onChange={e => setVehiclePricing(p => ({ ...p, [v.id]: { ...p[v.id], weekly: parseInt(e.target.value, 10) || 0 } }))}
                      />
                    </td>
                  </tr>
                );
              })}
              {allVehicles.length === 0 && <tr><td colSpan="5" className="px-3 py-4 text-center text-muted">No vehicles found. Add vehicles in Fleet Management to set pricing.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonal Pricing */}
      <div className="rounded-3 p-4 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Seasonal Pricing Rules</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Apply percentage-based price adjustments for peak/off-peak dates</div>
          </div>
          <button onClick={() => setSeasonalRules(r => [...r, { id: Date.now(), name: 'New Season Rule', type: 'add', value: 15, unit: '%', start: '', end: '' }])} className="btn btn-sm px-3 py-1 rounded-2 fw-bold d-flex align-items-center gap-1" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.78rem' }}>
            <Plus size={12} /> Add Rule
          </button>
        </div>
        <div className="d-flex flex-column gap-3">
          {seasonalRules.map(rule => (
            <div key={rule.id} className="rounded-3 p-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>Rule Name</label>
                  <input type="text" className="form-control form-control-sm" style={{ fontSize: '0.82rem', borderRadius: '8px' }} value={rule.name} onChange={e => setSeasonalRules(r => r.map(x => x.id === rule.id ? { ...x, name: e.target.value } : x))} />
                </div>
                <div className="col-md-1">
                  <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>Type</label>
                  <select className="form-select form-select-sm" style={{ fontSize: '0.82rem', borderRadius: '8px' }} value={rule.type} onChange={e => setSeasonalRules(r => r.map(x => x.id === rule.id ? { ...x, type: e.target.value } : x))}>
                    <option value="add">+</option>
                    <option value="subtract">-</option>
                  </select>
                </div>
                <div className="col-md-1">
                  <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>Value (%)</label>
                  <input type="number" className="form-control form-control-sm" style={{ fontSize: '0.82rem', borderRadius: '8px' }} value={rule.value} onChange={e => setSeasonalRules(r => r.map(x => x.id === rule.id ? { ...x, value: e.target.value } : x))} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>Start Date</label>
                  <input type="date" className="form-control form-control-sm" style={{ fontSize: '0.82rem', borderRadius: '8px' }} value={rule.start} onChange={e => setSeasonalRules(r => r.map(x => x.id === rule.id ? { ...x, start: e.target.value } : x))} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold" style={{ fontSize: '0.75rem', color: '#475569' }}>End Date</label>
                  <input type="date" className="form-control form-control-sm" style={{ fontSize: '0.82rem', borderRadius: '8px' }} value={rule.end} onChange={e => setSeasonalRules(r => r.map(x => x.id === rule.id ? { ...x, end: e.target.value } : x))} />
                </div>
                <div className="col-md-2">
                  <div className="d-flex align-items-end h-100 pb-1">
                    <span className="px-3 py-1 rounded-pill fw-bold" style={{ background: rule.type === 'add' ? '#dcfce7' : '#fee2e2', color: rule.type === 'add' ? '#16a34a' : '#dc2626', fontSize: '0.8rem' }}>
                      {rule.type === 'add' ? '+' : '-'}{rule.value}% price
                    </span>
                  </div>
                </div>
                <div className="col-md-1">
                  <button onClick={() => removeRule(rule.id)} className="btn btn-sm p-1 border-0" style={{ color: '#dc2626', background: 'transparent' }}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

