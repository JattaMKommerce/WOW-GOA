import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ThumbsUp, Flag, Filter, X, Send, RefreshCw } from 'lucide-react';
import * as api from '../../../services/api';

export default function PMSReviews({ currentUser, vendorHotels }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [replyModal, setReplyModal] = useState(null);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.pmsListReviews(currentUser.id);
      setReviews(res.reviews || []);
    } catch {
      // Use demo reviews for now
      setReviews([
        { id: 'demo1', guest_name: 'Priya Sharma', hotel_id: vendorHotels[0]?.id, rating: 4.5, review: 'Excellent stay! The rooms were clean and the staff was very helpful. Will definitely visit again.', vendor_reply: null, review_date: new Date().toISOString().split('T')[0], status: 'Published', booking_id: null },
        { id: 'demo2', guest_name: 'Rahul Verma', hotel_id: vendorHotels[0]?.id, rating: 3.0, review: 'Good location but the pool was closed. Service could be better. Room was decent.', vendor_reply: null, review_date: new Date().toISOString().split('T')[0], status: 'Published', booking_id: null }
      ]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [currentUser.id]);

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + parseFloat(r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';

  const filtered = filter === 'All' ? reviews : filter === 'Replied' ? reviews.filter(r => r.reply || r.vendor_reply) : reviews.filter(r => !(r.reply || r.vendor_reply));

  const handleReply = async () => {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await api.pmsReplyReview(replyModal.id, currentUser.id, reply);
      setReplyModal(null); setReply('');
      fetchReviews();
    } catch (e) { alert(e.message); }
    finally { setReplying(false); }
  };

  const StarRow = ({ rating, size = 14 }) => (
    <div className="d-flex gap-0">
      {[1,2,3,4,5].map(i => <Star key={i} size={size} fill={rating >= i ? '#FFC107' : 'none'} color={rating >= i ? '#FFC107' : '#dee2e6'} />)}
    </div>
  );

  return (
    <div className="p-4" style={{ background: '#f0f2f5', minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Reviews & Ratings</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{reviews.length} total reviews • {avgRating} average rating</p>
        </div>
        <button onClick={fetchReviews} className="btn btn-sm rounded-pill px-3" style={{ background: '#fff', border: '1px solid #dee2e6' }}>
          <RefreshCw size={13} className="me-1" /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 rounded-4 p-4 shadow-sm text-center" style={{ background: '#fff' }}>
            <div className="fw-bold" style={{ fontSize: '2.5rem', color: '#FFC107' }}>{avgRating}</div>
            <StarRow rating={parseFloat(avgRating)} size={18} />
            <div className="text-muted mt-2" style={{ fontSize: '0.78rem' }}>Average Rating</div>
          </div>
        </div>
        {[[5,'#00b894'],[4,'#74b9ff'],[3,'#fdcb6e'],[2,'#fd79a8'],[1,'#d63031']].map(([n, c]) => {
          const count = reviews.filter(r => Math.round(parseFloat(r.rating)) === n).length;
          const pct = reviews.length > 0 ? (count / reviews.length * 100).toFixed(0) : 0;
          return (
            <div key={n} className="col-12 col-md">
              <div className="card border-0 rounded-4 p-3 shadow-sm text-center h-100" style={{ background: '#fff' }}>
                <StarRow rating={n} size={12} />
                <div className="fw-bold mt-1" style={{ color: c, fontSize: '1.1rem' }}>{count}</div>
                <div className="rounded-pill overflow-hidden mt-1" style={{ height: '4px', background: '#f0f2f5' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: c }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="d-flex gap-2 mb-4">
        {['All', 'Replied', 'Unreplied'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn btn-sm rounded-pill px-3"
            style={{ background: filter === f ? '#0D1B2E' : '#fff', color: filter === f ? '#fff' : '#6c757d', border: '1px solid #dee2e6' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : filtered.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center shadow-sm" style={{ background: '#fff' }}>
          <Star size={48} className="text-muted opacity-25 mb-3 mx-auto" />
          <h5 className="text-muted">No reviews yet</h5>
          <p className="text-muted small">Guest reviews will appear here after their stays</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filtered.map(r => {
            const hotel = (vendorHotels || []).find(h => h.id === r.hotel_id);
            const reviewComment = r.comment || r.review || 'Great experience!';
            const reviewReply = r.reply || r.vendor_reply;
            return (
              <div key={r.id} className="card border-0 rounded-4 shadow-sm p-4" style={{ background: '#fff' }}>
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: '42px', height: '42px', background: '#6c5ce7', fontSize: '16px', flexShrink: 0 }}>
                      {(r.guest_name || 'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{r.guest_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.73rem' }}>{hotel?.name || 'Hotel'} • {r.created_at || r.review_date || 'Recent'}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <StarRow rating={parseFloat(r.rating)} />
                    <span className="fw-bold" style={{ color: '#FFC107', fontSize: '0.9rem' }}>{parseFloat(r.rating).toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-muted mb-3" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>{reviewComment}</p>
                {reviewReply ? (
                  <div className="p-3 rounded-3" style={{ background: '#f0f2f5', borderLeft: '3px solid #0D1B2E' }}>
                    <div className="fw-bold mb-1" style={{ fontSize: '0.78rem', color: '#0D1B2E' }}>Your Reply:</div>
                    <p className="mb-0" style={{ fontSize: '0.82rem' }}>{reviewReply}</p>
                  </div>
                ) : (
                  <button onClick={() => { setReplyModal({ ...r, review: reviewComment }); setReply(''); }} className="btn btn-sm rounded-pill px-3 d-flex align-items-center gap-1" style={{ background: '#0D1B2E', color: '#fff', fontSize: '0.78rem' }}>
                    <MessageSquare size={12} /> Reply to Review
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {replyModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="bg-white rounded-4 shadow-lg p-4" style={{ width: '540px', maxWidth: '95vw' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0">Reply to Review</h5>
              <button onClick={() => setReplyModal(null)} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
            </div>
            <div className="p-3 rounded-3 mb-3" style={{ background: '#f8f9fa' }}>
              <div className="fw-bold mb-1" style={{ fontSize: '0.82rem' }}>{replyModal.guest_name}</div>
              <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>{replyModal.review}</p>
            </div>
            <textarea className="form-control form-control-sm rounded-3 mb-3" rows={4} placeholder="Write a professional, helpful reply..." value={reply} onChange={e => setReply(e.target.value)}></textarea>
            <div className="d-flex justify-content-end gap-2">
              <button onClick={() => setReplyModal(null)} className="btn btn-sm rounded-pill px-4" style={{ background: '#f0f2f5' }}>Cancel</button>
              <button onClick={handleReply} disabled={replying || !reply.trim()} className="btn btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-1" style={{ background: '#0D1B2E', color: '#fff' }}>
                <Send size={12} />{replying ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
