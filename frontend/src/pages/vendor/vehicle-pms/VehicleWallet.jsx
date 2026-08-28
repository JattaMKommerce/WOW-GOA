import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Download, TrendingUp, Clock, RefreshCw } from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 'TXN001', type: 'credit', description: 'Booking #V001 — Swift Dzire', amount: 2500, commission: 200, net: 2300, date: '2026-07-31', status: 'completed' },
  { id: 'TXN002', type: 'credit', description: 'Booking #V002 — Royal Enfield', amount: 1800, commission: 144, net: 1656, date: '2026-07-30', status: 'completed' },
  { id: 'TXN003', type: 'debit', description: 'Wallet Withdrawal to Bank', amount: 5000, commission: 0, net: -5000, date: '2026-07-29', status: 'completed' },
  { id: 'TXN004', type: 'credit', description: 'Booking #V003 — Honda City', amount: 4500, commission: 360, net: 4140, date: '2026-07-28', status: 'completed' },
  { id: 'TXN005', type: 'pending', description: 'Recharge Request', amount: 0, commission: 0, net: 0, date: '2026-07-27', status: 'pending' },
];

export default function VehicleWallet() {
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeNote, setRechargeNote] = useState('');

  const totalEarned = MOCK_TRANSACTIONS.filter(t => t.type === 'credit').reduce((s, t) => s + t.net, 0);
  const totalCommission = MOCK_TRANSACTIONS.filter(t => t.type === 'credit').reduce((s, t) => s + t.commission, 0);
  const balance = MOCK_TRANSACTIONS.reduce((s, t) => s + (t.type === 'credit' ? t.net : t.type === 'debit' ? -t.amount : 0), 0);

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>Wallet & Payments</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Track earnings, commissions and wallet balance</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => setShowRecharge(true)} className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
            <RefreshCw size={14} /> Request Recharge
          </button>
          <button className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-1" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.82rem' }}>
            <Download size={14} /> Statement
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="rounded-3 p-4 text-center" style={{ background: 'linear-gradient(135deg,#0D1B2E,#1e3a5f)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Wallet size={28} style={{ color: '#FF6333' }} className="mb-2" />
            <div className="fw-bold text-white" style={{ fontSize: '2rem' }}>₹{balance.toLocaleString()}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Available Balance</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <ArrowUpRight size={18} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Total Earnings</span>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#16a34a' }}>₹{totalEarned.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>After commission deduction</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="rounded-3 p-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <TrendingUp size={18} style={{ color: '#7c3aed' }} />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Commission Paid</span>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.5rem', color: '#7c3aed' }}>₹{totalCommission.toLocaleString()}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>8% platform commission</div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Transaction History</div>
        </div>
        <table className="table align-middle mb-0" style={{ fontSize: '0.83rem' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Transaction', 'Description', 'Gross Amount', 'Commission', 'Net Amount', 'Date', 'Status'].map(h => (
                <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_TRANSACTIONS.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td className="px-3 py-3 fw-bold" style={{ color: '#2563eb', fontSize: '0.78rem' }}>{t.id}</td>
                <td className="px-3 py-3" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                <td className="px-3 py-3 fw-bold">₹{t.amount.toLocaleString()}</td>
                <td className="px-3 py-3" style={{ color: '#dc2626' }}>{t.commission > 0 ? `-₹${t.commission}` : '—'}</td>
                <td className="px-3 py-3 fw-bold" style={{ color: t.net >= 0 ? '#16a34a' : '#dc2626' }}>
                  {t.type === 'debit' ? `-₹${Math.abs(t.net)}` : t.net > 0 ? `+₹${t.net}` : '—'}
                </td>
                <td className="px-3 py-3 text-muted" style={{ fontSize: '0.75rem' }}>{t.date}</td>
                <td className="px-3 py-3">
                  <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: t.status === 'completed' ? '#dcfce7' : '#fef9c3', color: t.status === 'completed' ? '#16a34a' : '#ca8a04', fontSize: '0.65rem', textTransform: 'uppercase' }}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={() => setShowRecharge(false)}>
          <div className="rounded-4 overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: '420px', background: '#fff', margin: '0 16px' }} onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3" style={{ background: '#0D1B2E' }}>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>Request Wallet Recharge</h6>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Amount (₹)</label>
                <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} placeholder="Enter amount to request..." />
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Note (optional)</label>
                <textarea className="form-control" rows={2} style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={rechargeNote} onChange={e => setRechargeNote(e.target.value)} placeholder="Add a note for the admin..." />
              </div>
              <div className="d-flex gap-2">
                <button onClick={() => setShowRecharge(false)} className="btn flex-grow-1 py-2 rounded-3" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>Cancel</button>
                <button onClick={() => { alert('Recharge request submitted to admin!'); setShowRecharge(false); }} className="btn flex-grow-1 py-2 rounded-3 fw-bold text-white" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
