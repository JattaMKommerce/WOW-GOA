import React, { useState, useEffect } from 'react';
import {
  Wallet, CheckCircle, XCircle, Clock, AlertTriangle, Eye, X,
  RefreshCw, Users, ArrowUpRight, ArrowDownRight, Filter, Download
} from 'lucide-react';
import { apiFetch, API_BASE } from '../../services/api';

const COLORS = { primary: '#FF6333', dark: '#0D1B2E', success: '#16a34a', danger: '#dc2626', warn: '#ca8a04' };

function StatusBadge({ status }) {
  const map = {
    pending: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
    pending_verification: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending Verification' },
    approved: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
    Completed: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
    rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    Rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    active: { bg: '#dcfce7', color: '#16a34a', label: 'Active' },
    expired: { bg: '#fee2e2', color: '#dc2626', label: 'Expired' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: s.bg, color: s.color, fontSize: '0.65rem', textTransform: 'uppercase' }}>{s.label}</span>;
}

function ProofModal({ url, onClose }) {
  if (!url) return null;
  return (
    <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 2000 }} onClick={onClose}>
      <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button className="btn btn-dark position-absolute" style={{ top: -40, right: 0 }} onClick={onClose}><X size={18} /></button>
        <img src={url} alt="Payment Proof" style={{ maxWidth: '80vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

function WalletRechargeTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [proofUrl, setProofUrl] = useState(null);
  const [remarks, setRemarks] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=wallet_transactions&status_filter=${filter}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data.filter(t => t.type === 'credit') : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleAction = async (id, status) => {
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_recharge', id, status, remarks: remarks[id] || '' })
      });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error || 'Failed');
    } catch (e) { alert(e.message); }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status?.toLowerCase() === filter || (filter === 'pending' && r.status === 'Pending Verification'));

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        {['pending', 'Completed', 'Rejected', 'all'].map(f => (
          <button key={f} className="btn btn-sm px-3 fw-bold rounded-pill" style={{ fontSize: '0.78rem', background: filter === f ? COLORS.primary : '#f1f5f9', color: filter === f ? '#fff' : '#475569' }} onClick={() => setFilter(f)}>
            {f === 'pending' ? 'Pending' : f === 'Completed' ? 'Approved' : f === 'Rejected' ? 'Rejected' : 'All'}
          </button>
        ))}
        <button className="btn btn-sm ms-auto" onClick={load}><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                <div className="d-flex gap-3">
                  <div className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px', background: '#dbeafe' }}>
                    <ArrowUpRight size={18} style={{ color: '#2563eb' }} />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '14px' }}>₹{Number(r.amount).toLocaleString()} Recharge</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Vendor: <span className="fw-bold">{r.vendor_id}</span></div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.description} · {new Date(r.created_at).toLocaleString()}</div>
                    {r.reference_id && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>UTR/Ref: <span className="fw-bold">{r.reference_id}</span></div>}
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  {r.payment_proof && (
                    <button className="btn btn-sm px-3 d-flex align-items-center gap-1 fw-bold" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem' }} onClick={() => setProofUrl(r.payment_proof)}>
                      <Eye size={12} /> View Proof
                    </button>
                  )}
                  {(r.status === 'Pending Verification' || r.status?.toLowerCase() === 'pending') && (
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem' }} onClick={() => handleAction(r.id, 'Completed')}>
                        <CheckCircle size={12} className="me-1" /> Approve
                      </button>
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }} onClick={() => handleAction(r.id, 'Rejected')}>
                        <XCircle size={12} className="me-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-5 text-muted">
              <Wallet size={32} className="mb-2 opacity-50" />
              <p className="mb-0">No {filter === 'all' ? '' : filter} recharge requests found</p>
            </div>
          )}
        </div>
      )}
      {proofUrl && <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />}
    </div>
  );
}

function SubscriptionApprovalsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending_verification');
  const [proofUrl, setProofUrl] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}?resource=admin_subscriptions`);
      setSubs(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, status) => {
    try {
      const res = await apiFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_subscription', id, status })
      });
      const data = await res.json();
      if (data.success) load();
      else alert(data.error);
    } catch (e) { alert(e.message); }
  };

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        {['pending_verification', 'active', 'rejected', 'all'].map(f => (
          <button key={f} className="btn btn-sm px-3 fw-bold rounded-pill" style={{ fontSize: '0.78rem', background: filter === f ? COLORS.primary : '#f1f5f9', color: filter === f ? '#fff' : '#475569' }} onClick={() => setFilter(f)}>
            {f === 'pending_verification' ? 'Pending' : f === 'active' ? 'Active' : f === 'rejected' ? 'Rejected' : 'All'}
          </button>
        ))}
        <button className="btn btn-sm ms-auto" onClick={load}><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(s => (
            <div key={s.id} className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                <div>
                  <div className="fw-bold" style={{ color: COLORS.dark, fontSize: '14px' }}>{s.admin_id}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Plan: <span className="fw-bold">{s.plan_name || `Plan #${s.plan_id}`}</span></div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Method: {s.payment_method} · {new Date(s.created_at).toLocaleString()}</div>
                  {s.payment_reference && <div style={{ fontSize: '0.72rem' }}>Ref: <span className="fw-bold">{s.payment_reference}</span></div>}
                  <div className="mt-1"><StatusBadge status={s.status} /></div>
                </div>
                <div className="d-flex flex-column gap-2 align-items-end">
                  {s.payment_proof && (
                    <button className="btn btn-sm px-3 fw-bold" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.75rem' }} onClick={() => setProofUrl(s.payment_proof)}>
                      <Eye size={12} className="me-1" /> View Proof
                    </button>
                  )}
                  {s.status === 'pending_verification' && (
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.75rem' }} onClick={() => handleAction(s.id, 'active')}>
                        <CheckCircle size={12} className="me-1" /> Approve
                      </button>
                      <button className="btn btn-sm px-3 fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.75rem' }} onClick={() => handleAction(s.id, 'rejected')}>
                        <XCircle size={12} className="me-1" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-5 text-muted">
              <CheckCircle size={32} className="mb-2 opacity-50" />
              <p className="mb-0">No {filter === 'all' ? '' : filter} subscription requests</p>
            </div>
          )}
        </div>
      )}
      {proofUrl && <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />}
    </div>
  );
}

function VendorWalletsTab() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}?resource=wallets`)
      .then(r => r.json()).then(d => setWallets(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
          <table className="table align-middle mb-0" style={{ fontSize: '0.83rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Vendor ID', 'Balance', 'Min Balance', 'Last Updated'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wallets.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-3 fw-bold" style={{ color: '#2563eb' }}>{w.vendor_id}</td>
                  <td className="px-3 py-3">
                    <span className="fw-bold" style={{ color: Number(w.balance) < 1000 ? COLORS.danger : COLORS.success, fontSize: '1rem' }}>₹{Number(w.balance).toLocaleString()}</span>
                    {Number(w.balance) < 1000 && <span className="ms-2 px-1 py-0 rounded" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.65rem', fontWeight: 700 }}>LOW</span>}
                  </td>
                  <td className="px-3 py-3 text-muted">₹{Number(w.minimum_balance || 5000).toLocaleString()}</td>
                  <td className="px-3 py-3 text-muted" style={{ fontSize: '0.75rem' }}>{new Date(w.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {wallets.length === 0 && <tr><td colSpan={4} className="text-center py-5 text-muted">No vendor wallets found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransactionHistoryTab() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`${API_BASE}?resource=wallet_transactions`)
      .then(r => r.json()).then(d => setTxns(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: COLORS.primary, width: '1.5rem', height: '1.5rem' }} /></div>
      ) : (
        <div className="rounded-3 overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Txn ID', 'Vendor', 'Type', 'Amount', 'Description', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.slice(0, 100).map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#2563eb', fontSize: '0.72rem' }}>#{t.id}</td>
                  <td className="px-3 py-2 fw-bold">{t.vendor_id}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: t.type === 'credit' ? '#dcfce7' : '#fee2e2', color: t.type === 'credit' ? '#16a34a' : '#dc2626', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {t.type === 'credit' ? <ArrowUpRight size={10} className="me-1" /> : <ArrowDownRight size={10} className="me-1" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 fw-bold" style={{ color: t.type === 'credit' ? '#16a34a' : '#dc2626' }}>
                    {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                  </td>
                  <td className="px-3 py-2" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                  <td className="px-3 py-2"><StatusBadge status={t.status || 'Completed'} /></td>
                  <td className="px-3 py-2 text-muted" style={{ fontSize: '0.72rem' }}>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {txns.length === 0 && <tr><td colSpan={7} className="text-center py-5 text-muted">No transactions yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'recharge', label: 'Wallet Recharge Approvals', icon: <Wallet size={14} /> },
  { id: 'subscriptions', label: 'Subscription Approvals', icon: <CheckCircle size={14} /> },
  { id: 'wallets', label: 'All Vendor Wallets', icon: <Users size={14} /> },
  { id: 'history', label: 'Transaction History', icon: <Clock size={14} /> },
];

export default function WalletApprovalCenter() {
  const [activeTab, setActiveTab] = useState('recharge');

  return (
    <div className="p-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-0" style={{ color: COLORS.dark, fontSize: '16px' }}>Wallet & Approval Center</h5>
        <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Review and approve vendor wallet recharges, admin subscription payments, and monitor all wallet activity</p>
      </div>

      {/* Tab Bar */}
      <div className="d-flex gap-1 mb-4 p-1 rounded-3" style={{ background: '#f1f5f9', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-2 fw-bold flex-shrink-0" style={{ fontSize: '0.8rem', background: activeTab === t.id ? '#fff' : 'transparent', color: activeTab === t.id ? COLORS.dark : '#64748b', boxShadow: activeTab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'recharge' && <WalletRechargeTab />}
      {activeTab === 'subscriptions' && <SubscriptionApprovalsTab />}
      {activeTab === 'wallets' && <VendorWalletsTab />}
      {activeTab === 'history' && <TransactionHistoryTab />}
    </div>
  );
}
