import React, { useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '../../services/api';

export default function AdminWalletSettlements({ currentUser }) {
  const [wallets, setWallets] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [wRes, sRes] = await Promise.all([
        apiFetch(`${API_BASE}?resource=vendor_wallets`),
        apiFetch(`${API_BASE}?resource=wallet_settlements`)
      ]);
      const wData = wRes.ok ? await wRes.json() : [];
      const sData = sRes.ok ? await sRes.json() : [];
      setWallets(Array.isArray(wData) ? wData : []);
      setSettlements(Array.isArray(sData) ? sData : []);
    } catch (e) {
      console.error(e);
      setWallets([]);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (settleId) => {
    try {
      await apiFetch(API_BASE, {
        method: 'POST',
        body: JSON.stringify({ action: 'approve_settlement', settle_id: settleId })
      });
      alert('Settlement approved');
      fetchData();
    } catch (e) {
      alert('Error approving settlement');
    }
  };

  const safeSettlements = Array.isArray(settlements) ? settlements : [];
  const safeWallets = Array.isArray(wallets) ? wallets : [];
  const pendingSettlements = safeSettlements.filter(s => s?.status === 'pending');

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h5 className="fw-bold mb-4">Vendor Wallets & Settlements</h5>

      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-white fw-bold">Pending Settlement Requests</div>
        <div className="card-body p-0">
          <table className="table mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th>Vendor ID</th>
                <th>Amount</th>
                <th>Bank Details</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingSettlements.map(s => (
                <tr key={s.id}>
                  <td>{s.vendor_id}</td>
                  <td className="fw-bold text-success">₹{Number(s.amount || 0).toLocaleString()}</td>
                  <td>{s.bank_details || '—'}</td>
                  <td><span className="badge bg-warning text-dark">{s.status || 'Pending'}</span></td>
                  <td>
                    <button className="btn btn-sm btn-success fw-bold" onClick={() => handleApprove(s.id)}>Approve Payout</button>
                  </td>
                </tr>
              ))}
              {pendingSettlements.length === 0 && (
                <tr><td colSpan="5" className="text-center py-4 text-muted">No pending requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-bold">All Vendor Wallets</div>
        <div className="card-body p-0">
          <table className="table mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th>Vendor ID</th>
                <th>Current Balance</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {safeWallets.map(w => (
                <tr key={w.id || w.vendor_id}>
                  <td className="fw-bold">{w.vendor_id}</td>
                  <td className="fw-bold fs-5 text-primary">₹{Number(w.balance || 0).toLocaleString()}</td>
                  <td className="text-muted">{w.updated_at ? new Date(w.updated_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {safeWallets.length === 0 && (
                <tr><td colSpan="3" className="text-center py-4 text-muted">No wallets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
