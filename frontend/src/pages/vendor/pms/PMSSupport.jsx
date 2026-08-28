import React, { useState, useEffect } from 'react';
import { Headphones, Plus, ChevronDown, Send, X, AlertCircle } from 'lucide-react';
import * as api from '../../../services/api';

const CATEGORIES = ['Booking Issue', 'Payment Issue', 'Hotel Listing', 'Technical Problem', 'Account Issue', 'Commission/Settlement', 'Cancellation', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUS_COLORS = { Open: ['#e3f2fd', '#0984e3'], 'In Progress': ['#fff9e6', '#fdcb6e'], Resolved: ['#edf7f0', '#00b894'], Closed: ['#f8f9fa', '#6c757d'] };

function NewTicketModal({ vendorId, vendorHotels, onSave, onClose }) {
  const [form, setForm] = useState({ category: 'Booking Issue', hotel_id: '', booking_id: '', subject: '', description: '', priority: 'Medium' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.subject || !form.description) { setError('Subject and description are required'); return; }
    setSaving(true); setError('');
    try {
      await api.pmsCreateTicket({ ...form, vendor_id: vendorId });
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="bg-white rounded-4 shadow-lg overflow-auto" style={{ width: '560px', maxWidth: '95vw', maxHeight: '90vh' }}>
        <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">Create Support Ticket</h5>
          <button onClick={onClose} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
        </div>
        <div className="p-4">
          {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.82rem' }}><AlertCircle size={13} className="me-1" />{error}</div>}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Category *</label>
              <select className="form-select form-select-sm" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Priority</label>
              <select className="form-select form-select-sm" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Related Hotel</label>
              <select className="form-select form-select-sm" value={form.hotel_id} onChange={e => set('hotel_id', e.target.value)}>
                <option value="">None</option>
                {vendorHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Booking ID (optional)</label>
              <input className="form-control form-control-sm" placeholder="e.g. MB1234" value={form.booking_id} onChange={e => set('booking_id', e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Subject *</label>
              <input className="form-control form-control-sm" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Brief description of your issue" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold" style={{ fontSize: '0.82rem' }}>Description *</label>
              <textarea className="form-control form-control-sm" rows={5} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your issue in detail..."></textarea>
            </div>
          </div>
        </div>
        <div className="p-4 border-top d-flex justify-content-end gap-2">
          <button onClick={onClose} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5', color: '#495057' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-sm rounded-pill px-4 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>
            {saving ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PMSSupport({ currentUser, vendorHotels }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openTicket, setOpenTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.pmsListTickets(currentUser.id);
      setTickets(res.tickets || []);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); }, [currentUser.id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await api.pmsReplyTicket(openTicket.id, currentUser.id, reply);
      setReply('');
      fetchTickets();
    } catch (e) { alert(e.message); }
    finally { setReplying(false); }
  };

  const filtered = filter === 'All' ? tickets : tickets.filter(t => t.status === filter);

  const PRIORITY_COLORS = { Low: '#6c757d', Medium: '#fdcb6e', High: '#e17055', Urgent: '#d63031' };

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div><h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Support</h4><p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{tickets.length} support tickets</p></div>
        <button onClick={() => setShowModal(true)} className="btn rounded-pill fw-bold px-4 d-flex align-items-center gap-2" style={{ background: '#0D1B2E', color: '#fff' }}>
          <Plus size={15} /> New Ticket
        </button>
      </div>

      {/* Help Section */}
      <div className="row g-3 mb-4">
        {[['📧 Email Support', 'support@wowgoa.in', '#0984e3'], ['📞 Phone Support', '+91 80000 12345', '#00b894'], ['💬 Live Chat', 'Chat with us (9 AM–8 PM)', '#6c5ce7']].map(([l, v, c]) => (
          <div key={l} className="col-12 col-md-4">
            <div className="card border-0 rounded-4 p-3 shadow-sm text-center" style={{ background: '#fff' }}>
              <div className="fw-bold mb-1" style={{ color: c, fontSize: '0.85rem' }}>{l}</div>
              <div className="text-muted" style={{ fontSize: '0.82rem' }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex gap-2 mb-4">
        {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn btn-sm rounded-pill px-3"
            style={{ background: filter === f ? '#0D1B2E' : '#fff', color: filter === f ? '#fff' : '#6c757d', border: '1px solid #dee2e6', fontSize: '0.78rem' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ background: '#fff' }}>
          <Headphones size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-muted">No tickets</h5>
          <p className="text-muted small mb-4">Create a ticket to get help from our support team</p>
          <button onClick={() => setShowModal(true)} className="btn rounded-pill px-5 fw-bold" style={{ background: '#0D1B2E', color: '#fff' }}>Create First Ticket</button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(t => {
            const [sBg, sCl] = STATUS_COLORS[t.status] || ['#f8f9fa', '#6c757d'];
            const messages = (() => { try { return JSON.parse(t.messages_json || '[]'); } catch { return []; } })();
            return (
              <div key={t.id} className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff', cursor: 'pointer' }} onClick={() => setOpenTicket(t)}>
                <div className="d-flex align-items-start justify-content-between">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold" style={{ fontSize: '0.9rem', color: '#1a2b4a' }}>{t.subject}</span>
                      <span className="badge rounded-pill" style={{ background: sBg, color: sCl, fontSize: '0.68rem' }}>{t.status}</span>
                      <span className="badge rounded-pill" style={{ background: `${PRIORITY_COLORS[t.priority] || '#6c757d'}20`, color: PRIORITY_COLORS[t.priority] || '#6c757d', fontSize: '0.68rem' }}>{t.priority}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t.category} • {messages.length} message(s) • {new Date(t.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <ChevronDown size={16} className="text-muted ms-2" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openTicket && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white rounded-4 shadow-lg overflow-auto d-flex flex-column" style={{ width: '600px', maxWidth: '95vw', maxHeight: '90vh' }}>
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
              <div>
                <h5 className="fw-bold mb-0">{openTicket.subject}</h5>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{openTicket.category} • #{openTicket.id.slice(-6)}</span>
              </div>
              <button onClick={() => setOpenTicket(null)} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
            </div>
            <div className="flex-grow-1 overflow-auto p-4">
              {(() => {
                const messages = (() => { try { return JSON.parse(openTicket.messages_json || '[]'); } catch { return []; } })();
                return messages.map((m, i) => (
                  <div key={i} className={`mb-3 d-flex ${m.sender === 'vendor' ? 'justify-content-end' : 'justify-content-start'}`}>
                    <div className="p-3 rounded-4" style={{ maxWidth: '80%', background: m.sender === 'vendor' ? '#0D1B2E' : '#f8f9fa', color: m.sender === 'vendor' ? '#fff' : '#2d3748' }}>
                      <div style={{ fontSize: '0.82rem' }}>{m.message}</div>
                      <div style={{ fontSize: '0.65rem', color: m.sender === 'vendor' ? 'rgba(255,255,255,0.5)' : '#adb5bd', marginTop: '4px' }}>{m.time}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="p-4 border-top">
              <div className="d-flex gap-2">
                <textarea className="form-control form-control-sm rounded-3 flex-grow-1" rows={2} placeholder="Reply to this ticket..." value={reply} onChange={e => setReply(e.target.value)}></textarea>
                <button onClick={handleReply} disabled={replying || !reply.trim()} className="btn rounded-pill px-3 fw-bold d-flex align-items-center gap-1" style={{ background: '#0D1B2E', color: '#fff', alignSelf: 'flex-end' }}>
                  <Send size={14} />{replying ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <NewTicketModal vendorId={currentUser.id} vendorHotels={vendorHotels}
          onSave={() => { setShowModal(false); fetchTickets(); }} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
