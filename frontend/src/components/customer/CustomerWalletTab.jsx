import React, { useState } from 'react';
import {
  Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Plus,
  ShieldCheck, Clock, CheckCircle2, AlertCircle, RefreshCw, X
} from 'lucide-react';

export default function CustomerWalletTab({
  currentUser,
  walletBalance = 0,
  transactions = []
}) {
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addAmount, setAddAmount] = useState('1000');

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            My Wallet
          </h4>
          <p className="text-muted text-xs mb-0">
            Use your wallet balance for instant bookings, security deposit adjustments, and cashback redemptions.
          </p>
        </div>

        <button 
          onClick={() => setShowAddMoneyModal(true)}
          className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2 text-xs d-flex align-items-center gap-1.5 shadow-sm"
        >
          <Plus size={15} />
          <span>Add Money to Wallet</span>
        </button>
      </div>

      {/* ─── Wallet Balance Overview Card ─── */}
      <div className="row g-4 mb-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 text-white p-4 h-100 overflow-hidden position-relative" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="badge bg-white bg-opacity-10 text-warning text-xxs px-2.5 py-1 rounded-pill fw-bold">
                  WOW GOA DIGITAL WALLET
                </span>
                <div className="text-white-50 text-xs mt-2">Available Balance</div>
                <div className="fs-1 fw-black text-white font-heading mt-1">
                  ₹{Number(walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="rounded-circle p-3 bg-white bg-opacity-10 text-warning">
                <Wallet size={28} />
              </div>
            </div>

            <div className="pt-3 border-top border-white border-opacity-10 d-flex justify-content-between align-items-center text-xs text-white-50">
              <span className="d-flex align-items-center gap-1.5 text-success">
                <ShieldCheck size={14} /> Verified & Protected
              </span>
              <span>Account: {currentUser?.phone || currentUser?.email || 'Registered User'}</span>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white" style={{ border: '1px solid #eef2f6' }}>
            <h6 className="fw-bold text-dark mb-3 font-heading">Wallet Benefits & Security</h6>
            
            <div className="row g-3">
              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="fw-bold text-dark text-xs mb-1">⚡ 1-Click Instant Booking</div>
                  <p className="text-muted text-xxs mb-0">Skip payment gateway delays. Vehicles and holiday packages are reserved instantly.</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="fw-bold text-dark text-xs mb-1">🎁 Instant Cashback Credit</div>
                  <p className="text-muted text-xxs mb-0">Promotional refunds and trip reward points are credited directly to your wallet.</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="fw-bold text-dark text-xs mb-1">🔄 Fast Refund Settlement</div>
                  <p className="text-muted text-xxs mb-0">Security deposits and cancellations are refunded within 2 hours to your wallet.</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <div className="fw-bold text-dark text-xs mb-1">🛡️ Zero Transaction Fees</div>
                  <p className="text-muted text-xxs mb-0">Pay directly with wallet balance without bank convenience charges.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Wallet Transactions Ledger ─── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white" style={{ border: '1px solid #eef2f6' }}>
        <div className="card-header bg-white py-3 px-4 d-flex justify-content-between align-items-center border-bottom">
          <h6 className="fw-bold text-dark mb-0 font-heading">Wallet Transaction History</h6>
          <span className="text-muted text-xxs">{transactions.length} record(s)</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
            <thead className="bg-light text-muted text-xs text-uppercase">
              <tr>
                <th className="ps-4">Transaction ID</th>
                <th>Description</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th className="text-end pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => {
                const isCredit = tx.type?.toLowerCase() === 'credit' || parseFloat(tx.amount || 0) > 0;
                return (
                  <tr key={tx.id || idx}>
                    <td className="ps-4 fw-bold text-dark font-heading">
                      #{tx.id || `TX-${1000 + idx}`}
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{tx.description || tx.reason || 'Wallet Settlement'}</div>
                      {tx.booking_id && <div className="text-muted text-xxs">Ref Booking: #{tx.booking_id}</div>}
                    </td>
                    <td>
                      <span className={`badge px-2 py-0.5 rounded text-xxs fw-bold ${isCredit ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        {isCredit ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td className="text-xs text-muted">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </td>
                    <td className={`fw-black ${isCredit ? 'text-success' : 'text-danger'}`}>
                      {isCredit ? '+' : '-'}₹{Math.abs(parseFloat(tx.amount || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="text-end pe-4">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 rounded-pill text-xxs fw-bold">
                        {tx.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <Wallet size={36} className="mb-2 text-muted opacity-50" />
                    <div>No wallet transactions recorded yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Money Modal ─── */}
      {showAddMoneyModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11, 25, 44, 0.6)', backdropFilter: 'blur(6px)', zIndex: 1060 }}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '92%', maxWidth: '460px' }}>
            <div className="card-header bg-dark text-white p-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <Wallet size={20} className="text-warning" />
                <h5 className="fw-black mb-0 text-white font-heading">Add Money to Wallet</h5>
              </div>
              <button onClick={() => setShowAddMoneyModal(false)} className="btn btn-sm text-white-50 hover-text-white border-0">
                <X size={20} />
              </button>
            </div>

            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label text-xs fw-bold text-muted">Enter Amount (₹)</label>
                <div className="input-group">
                  <span className="input-group-text bg-light fw-bold">₹</span>
                  <input 
                    type="number" 
                    className="form-control form-control-lg fw-black font-heading text-dark"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="1000"
                    min="100"
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mb-4">
                {['500', '1000', '2000', '5000'].map(amt => (
                  <button 
                    key={amt} 
                    type="button"
                    onClick={() => setAddAmount(amt)}
                    className="btn btn-sm btn-light border rounded-pill flex-fill fw-bold text-xs"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-3 bg-light border text-xs text-muted mb-3">
                🔒 Secure 256-bit SSL encrypted payment. Supports UPI, Netbanking, Debit/Credit Cards.
              </div>

              <button 
                onClick={() => {
                  alert(`Payment gateway initiated for ₹${addAmount}. Your wallet will be updated upon authorization.`);
                  setShowAddMoneyModal(false);
                }}
                className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2.5 shadow-sm"
              >
                Proceed to Pay ₹{addAmount}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
