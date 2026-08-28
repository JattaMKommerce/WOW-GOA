import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';
import * as api from '../../../services/api';

export default function PMSWallet({ currentUser }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [referenceId, setReferenceId] = useState('');
  const [showRecharge, setShowRecharge] = useState(false);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const wRes = await api.makeApiCall('/api.php?resource=vendor_wallets');
      // Compare as strings to handle MySQL returning numeric ids as strings
      const myWallet = wRes.find(w => String(w.vendor_id) === String(currentUser.id));
      if (myWallet) {
        setWallet({
          ...myWallet,
          balance: parseInt(myWallet.balance) || 0,
          reserved_commission: parseInt(myWallet.reserved_commission) || 0,
          negative_limit: parseInt(myWallet.negative_limit) || -1000,
        });
      } else {
        setWallet({ balance: 0, reserved_commission: 0, negative_limit: -1000 });
      }
      
      const tRes = await api.makeApiCall('/api.php?resource=wallet_transactions');
      setTransactions(
        tRes
          .filter(t => String(t.vendor_id) === String(currentUser.id))
          .map(t => ({ ...t, amount: parseInt(t.amount) || 0 }))
          .reverse()
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [currentUser.id]);

  const handleRecharge = async (e) => {
    e.preventDefault();
    try {
      await api.makeApiCall('/api.php', {
        method: 'POST',
        body: JSON.stringify({
          action: 'recharge_wallet',
          vendor_id: currentUser.id,
          amount: parseInt(rechargeAmount),
          payment_method: paymentMethod,
          reference_id: referenceId
        })
      });
      setShowRecharge(false);
      setRechargeAmount('');
      setReferenceId('');
      fetchWallet(); // refresh immediately
      alert("Recharge request submitted. It will reflect in your wallet after admin verification.");
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };


  return (
    <div className="p-4" style={{ minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Platform Wallet</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage your commission balance and top-ups</p>
        </div>
        <button onClick={() => setShowRecharge(true)} className="btn text-white fw-bold px-4 py-2 rounded-pill" style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)' }}>
          + Add Money
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 rounded-4 p-4 h-100 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #0D1B2E, #1A2B4A)' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="p-2 rounded-circle" style={{ background: 'rgba(255,255,255,0.1)' }}><Landmark size={24} /></div>
                <span className="badge bg-success">Active</span>
              </div>
              <h2 className="fw-bold mb-1">₹{wallet?.balance?.toLocaleString() || 0}</h2>
              <div className="text-white-50 small fw-bold">Available Balance</div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card border-0 rounded-4 p-4 h-100 shadow-sm bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="p-2 rounded-circle" style={{ background: 'rgba(255,99,51,0.1)', color: '#FF6333' }}><AlertCircle size={24} /></div>
              </div>
              <h2 className="fw-bold mb-1 text-dark">₹{wallet?.reserved_commission?.toLocaleString() || 0}</h2>
              <div className="text-muted small fw-bold">Reserved Commission</div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card border-0 rounded-4 p-4 h-100 shadow-sm bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="p-2 rounded-circle" style={{ background: 'rgba(0,184,217,0.1)', color: '#00B8D9' }}><RefreshCw size={24} /></div>
              </div>
              <h2 className="fw-bold mb-1 text-dark">₹{wallet?.negative_limit?.toLocaleString() || -1000}</h2>
              <div className="text-muted small fw-bold">Credit Limit</div>
            </div>
          </div>
        </div>
      )}

      {showRecharge && (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">Add Money to Wallet</h5>
            <form onSubmit={handleRecharge}>
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="Enter amount (₹)"
                    value={rechargeAmount}
                    onChange={e => setRechargeAmount(e.target.value)}
                    required
                    min="100"
                  />
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Transaction Reference ID"
                    value={referenceId}
                    onChange={e => setReferenceId(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary fw-bold px-4">Submit Recharge Request</button>
                <button type="button" onClick={() => setShowRecharge(false)} className="btn btn-light fw-bold px-4">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
          <h5 className="fw-bold mb-0">Transaction History</h5>
        </div>
        <div className="card-body p-4">
          {transactions.length === 0 ? (
            <div className="text-muted text-center py-4">No transactions found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontSize: '0.9rem' }}>{new Date(t.created_at).toLocaleString()}</td>
                      <td style={{ fontSize: '0.9rem' }}>{t.reference_id}</td>
                      <td>
                        <span className={`badge bg-${t.type === 'Top-up' ? 'success' : 'warning'}-subtle text-${t.type === 'Top-up' ? 'success' : 'warning'} rounded-pill`}>
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.9rem' }} className="text-muted">{t.description}</td>
                      <td className={`text-end fw-bold text-${t.amount >= 0 ? 'success' : 'danger'}`}>
                        {t.amount >= 0 ? '+' : ''}₹{Math.abs(t.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
