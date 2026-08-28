import React, { useState } from 'react';
import { CreditCard, Landmark, FileText, DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';

export default function PMSPayments({ mode = 'payments', currentUser, vendorHotels, vendorBookings }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const totalRevenue = vendorBookings.reduce((s, b) => s + parseInt(b.total_amount || b.total_paid || 0), 0);
  const totalReceived = vendorBookings.reduce((s, b) => s + parseInt(b.amount_paid || 0), 0);
  const totalPending = totalRevenue - totalReceived;
  const commission = Math.round(totalReceived * 0.10);
  const vendorPayable = totalReceived - commission;

  const filteredBookings = vendorBookings.filter(b => {
    const matchStatus = statusFilter === 'All' || b.payment_status === statusFilter;
    const matchFrom = !dateFrom || b.pickup_date >= dateFrom;
    const matchTo = !dateTo || b.pickup_date <= dateTo;
    return matchStatus && matchFrom && matchTo;
  });

  const exportCSV = () => {
    const rows = [['ID','Guest','Hotel','Checkin','Total','Paid','Status']];
    filteredBookings.forEach(b => rows.push([b.id,b.name,b.item_name,b.pickup_date,b.total_amount||b.total_paid,b.amount_paid||0,b.payment_status]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${mode}_report.csv`; a.click();
  };

  if (mode === 'settlements') {
    const months = {};
    vendorBookings.forEach(b => {
      if (!b.amount_paid) return;
      const m = b.pickup_date?.slice(0, 7) || 'Unknown';
      if (!months[m]) months[m] = { received: 0, commission: 0, payable: 0, count: 0 };
      const rec = parseInt(b.amount_paid || 0);
      const comm = Math.round(rec * 0.10);
      months[m].received += rec;
      months[m].commission += comm;
      months[m].payable += rec - comm;
      months[m].count++;
    });

    return (
      <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Settlements</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Monthly revenue and commission breakdown</p></div>
        </div>
        <div className="row g-3 mb-4">
          {[['Total Received', `₹${totalReceived.toLocaleString('en-IN')}`, '#00b894', <DollarSign size={20}/>], ['Platform Commission (10%)', `₹${commission.toLocaleString('en-IN')}`, '#e17055', <TrendingUp size={20}/>], ['Vendor Payable', `₹${vendorPayable.toLocaleString('en-IN')}`, '#6c5ce7', <Landmark size={20}/>]].map(([l, v, c, icon]) => (
            <div key={l} className="col-12 col-md-4">
              <div className="card border-0 rounded-4 p-4 shadow-sm" style={{ background: '#fff' }}>
                <div className="rounded-3 p-2 mb-3 d-flex align-items-center justify-content-center" style={{ background: `${c}15`, width: '44px', height: '44px' }}>
                  <span style={{ color: c }}>{icon}</span>
                </div>
                <div className="fw-bold" style={{ fontSize: '1.5rem', color: c }}>{v}</div>
                <div className="text-muted" style={{ fontSize: '0.78rem' }}>{l}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
          <table className="table mb-0">
            <thead style={{ background: '#f8f9fa' }}>
              <tr>{['Month', 'Bookings', 'Received', 'Commission (10%)', 'Net Payable', 'Status'].map(h => (
                <th key={h} className="py-3 px-4" style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', border: 'none' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).map(([m, d]) => (
                <tr key={m}>
                  <td className="py-3 px-4 fw-bold">{m}</td>
                  <td className="py-3 px-4">{d.count}</td>
                  <td className="py-3 px-4 fw-bold text-success">₹{d.received.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-danger">₹{d.commission.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 fw-bold" style={{ color: '#6c5ce7' }}>₹{d.payable.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4"><span className="badge rounded-pill" style={{ background: '#fff9e6', color: '#e17055', fontSize: '0.7rem' }}>Pending</span></td>
                </tr>
              ))}
              {Object.keys(months).length === 0 && <tr><td colSpan={6} className="text-center py-5 text-muted">No payment records yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (mode === 'billing') {
    return (
      <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
        <div className="mb-4"><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Subscription & Billing</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Your platform subscription details</p></div>
        <div className="card border-0 rounded-4 shadow-sm p-4 mb-4" style={{ background: '#fff' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Hotel Vendor Plan — Standard</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Manage unlimited hotels, 10% commission per booking</p>
            </div>
            <span className="badge rounded-pill px-3 py-2" style={{ background: '#edf7f0', color: '#00b894', fontSize: '0.82rem' }}>Active</span>
          </div>
          <div className="row g-3">
            {[['Monthly Commission', '10% per booking'], ['Support', 'Email & Chat'], ['Hotels Listed', 'Unlimited'], ['Dashboard Access', 'Full PMS'], ['Reporting', 'Monthly statements'], ['Settlement', 'Monthly']].map(([l, v]) => (
              <div key={l} className="col-6 col-md-4">
                <div className="p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>{l}</div>
                  <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="alert py-3 px-4 rounded-4" style={{ background: '#fff9e6', border: '1px solid #fdcb6e', fontSize: '0.85rem' }}>
          💡 To upgrade your plan or discuss custom commission rates, contact our partner support team.
        </div>
      </div>
    );
  }

  // mode === 'payments'
  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Booking Payments</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Track all payment receipts and pending amounts</p></div>
        <button onClick={exportCSV} className="btn rounded-pill px-4 d-flex align-items-center gap-2" style={{ background: '#fff', border: '1px solid #dee2e6', fontSize: '0.85rem' }}><Download size={15} /> Export</button>
      </div>

      <div className="row g-3 mb-4">
        {[['Total Booking Value', `₹${totalRevenue.toLocaleString('en-IN')}`, '#0984e3'], ['Amount Received', `₹${totalReceived.toLocaleString('en-IN')}`, '#00b894'], ['Pending', `₹${totalPending.toLocaleString('en-IN')}`, '#e17055']].map(([l, v, c]) => (
          <div key={l} className="col-12 col-md-4">
            <div className="card border-0 rounded-4 p-4 shadow-sm text-center" style={{ background: '#fff' }}>
              <div className="fw-bold" style={{ fontSize: '1.4rem', color: c }}>{v}</div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 rounded-4 shadow-sm p-3 mb-4" style={{ background: '#fff' }}>
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <select className="form-select form-select-sm rounded-pill" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {['All', 'Paid', 'Partially Paid', 'Unpaid', 'Refunded'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-4"><input type="date" className="form-control form-control-sm rounded-pill" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
          <div className="col-12 col-md-4"><input type="date" className="form-control form-control-sm rounded-pill" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
        </div>
      </div>

      <div className="card border-0 rounded-4 shadow-sm overflow-hidden" style={{ background: '#fff' }}>
        <table className="table table-hover mb-0">
          <thead style={{ background: '#f8f9fa' }}>
            <tr>{['Booking ID', 'Guest', 'Hotel', 'Check-in', 'Total', 'Paid', 'Balance', 'Method', 'Status'].map(h => (
              <th key={h} className="py-3 px-4" style={{ fontSize: '0.73rem', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', border: 'none' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-5 text-muted">No payment records found</td></tr>
            ) : filteredBookings.map(b => {
              const total = parseInt(b.total_amount || b.total_paid || 0);
              const paid = parseInt(b.amount_paid || 0);
              const balance = total - paid;
              const pColors = { 'Paid': '#00b894', 'Partially Paid': '#fdcb6e', 'Unpaid': '#d63031', 'Refunded': '#6c5ce7' };
              return (
                <tr key={b.id} style={{ fontSize: '0.82rem' }}>
                  <td className="py-3 px-4 fw-bold">#{(b.id || '').slice(-6)}</td>
                  <td className="py-3 px-4">{b.name}</td>
                  <td className="py-3 px-4">{b.item_name}</td>
                  <td className="py-3 px-4">{b.pickup_date}</td>
                  <td className="py-3 px-4 fw-bold">₹{total.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-success fw-bold">₹{paid.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4" style={{ color: balance > 0 ? '#d63031' : '#00b894' }}>₹{balance.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-muted">{b.payment_method || '—'}</td>
                  <td className="py-3 px-4"><span className="badge rounded-pill" style={{ background: `${pColors[b.payment_status] || '#6c757d'}20`, color: pColors[b.payment_status] || '#6c757d', fontSize: '0.7rem' }}>{b.payment_status || 'Unpaid'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
