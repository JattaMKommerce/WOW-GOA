import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MessageCircle, FileText, CheckCircle, XCircle, 
  Clock, Calendar, ChevronRight, User, Plus, Download, Edit, 
  MapPin, Bot, Sparkles, MessageSquare, ExternalLink, RefreshCw 
} from 'lucide-react';
import * as api from '../../services/api';

const PIPELINE_STAGES = [
  'New Enquiry', 'Hot Lead', 'Assigned', 'First Call Pending', 'First Call Completed', 
  'Customer Interested', 'Customer Not Interested', 'Destination Finalized', 
  'Travel Dates Confirmed', 'Budget Confirmed', 'Package Being Prepared', 
  'Quotation Ready', 'Quotation Sent', 'Follow-up 1', 'Follow-up 2', 'Follow-up 3', 
  'Follow-up 4', 'Follow-up 5', 'Negotiation', 'Customer Approved', 
  'Advance Payment Pending', 'Advance Payment Received', 'Booking In Progress', 
  'Hotels Confirmed', 'Flights Confirmed', 'Vehicles Confirmed', 
  'Final Itinerary Ready', 'Booking Confirmed', 'Trip Completed', 'Closed', 'Cancelled'
];

export default function AdminEnquiryCRM({ usersList = [], currentUser }) {
  const [enquiries, setEnquiries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'ai', 'crm'
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // New Note / Action state
  const [noteType, setNoteType] = useState('Note');
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const adminUsers = (usersList || []).filter(u => ['admin', 'superadmin'].includes(u.role));

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const [customData, aiData] = await Promise.all([
        api.fetchCustomEnquiries().catch(() => []),
        api.fetchAiLeads().catch(() => [])
      ]);

      const mappedAi = (Array.isArray(aiData) ? aiData : []).map(l => ({
        id: l.id,
        enquiry_id: l.id,
        source: 'Sophia AI Assistant',
        customer_name: l.name || 'AI Visitor',
        phone: l.phone || '',
        email: l.email || '',
        destinations: l.destination || l.service || 'Goa AI Inquiry',
        details: l.notes || 'Inquired via Sophia AI Chatbot',
        created_at: l.created_at,
        status: l.status || 'Hot Lead',
        assigned_to: l.assigned_to || null,
        type: 'ai',
        raw: l
      }));

      const mappedCrm = (Array.isArray(customData) ? customData : []).map(e => ({
        id: e.enquiry_id || e.id,
        enquiry_id: e.enquiry_id || e.id,
        source: 'Custom Trip CRM',
        customer_name: e.customer_name || 'Enquiry',
        phone: e.phone || '',
        email: e.email || '',
        destinations: e.destinations || 'Goa',
        details: `${e.destinations || 'Goa'} (${e.travel_dates || 'Flexible'}) - Budget: ${e.budget_range || 'Standard'}`,
        created_at: e.created_at,
        status: e.status || 'New Enquiry',
        assigned_to: e.assigned_to || null,
        type: 'crm',
        raw: e
      }));

      const combined = [...mappedAi, ...mappedCrm].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );

      setEnquiries(combined);

      // Refresh currently selected enquiry with fresh data if present
      if (selectedEnquiry) {
        const fresh = combined.find(c => c.id === selectedEnquiry.id);
        if (fresh) setSelectedEnquiry(fresh);
      }
    } catch (e) {
      console.error('[AdminEnquiryCRM] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async (enquiry_id) => {
    try {
      const data = await api.fetchEnquiryTimeline(enquiry_id);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (e) {
      setTimeline([]);
    }
  };

  useEffect(() => {
    fetchEnquiries();

    const handleSync = () => {
      fetchEnquiries();
    };

    window.addEventListener('tripgalileo-notification-sync', handleSync);
    window.addEventListener('tripgalileo-booking-sync', handleSync);
    window.addEventListener('authoritative-notification-received', handleSync);

    return () => {
      window.removeEventListener('tripgalileo-notification-sync', handleSync);
      window.removeEventListener('tripgalileo-booking-sync', handleSync);
      window.removeEventListener('authoritative-notification-received', handleSync);
    };
  }, []);

  const handleSelectEnquiry = (inq) => {
    setSelectedEnquiry(inq);
    fetchTimeline(inq.enquiry_id || inq.id);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedEnquiry) return;
    const enquiryId = selectedEnquiry.enquiry_id || selectedEnquiry.id;
    setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
    setEnquiries(prev => prev.map(e => ((e.enquiry_id || e.id) === enquiryId ? { ...e, status: newStatus } : e)));
    
    try {
      if (selectedEnquiry.type === 'ai') {
        await api.updateLead(enquiryId, { status: newStatus });
      } else {
        await api.updateEnquiryStatus(enquiryId, newStatus, selectedEnquiry.assigned_to);
      }
      await handleAddTimelineLog('Status Change', `Status updated to ${newStatus}`);
    } catch (e) {
      console.warn('Failed to update status on server, updated locally:', e.message);
    }
  };

  const handleUpdateAssignment = async (newAssignedTo) => {
    if (!selectedEnquiry) return;
    const enquiryId = selectedEnquiry.enquiry_id || selectedEnquiry.id;
    const val = newAssignedTo || null;
    setSelectedEnquiry(prev => ({ ...prev, assigned_to: val }));
    setEnquiries(prev => prev.map(e => ((e.enquiry_id || e.id) === enquiryId ? { ...e, assigned_to: val } : e)));
    
    try {
      if (selectedEnquiry.type === 'ai') {
        await api.updateLead(enquiryId, { assigned_to: val });
      } else {
        await api.updateEnquiryStatus(enquiryId, selectedEnquiry.status || 'New Enquiry', val);
      }
      await handleAddTimelineLog('Assignment', `Lead assigned to ${val || 'Unassigned'}`);
    } catch (e) {
      console.warn('Failed to update assignment on server, updated locally:', e.message);
    }
  };

  const handleAddTimelineLog = async (type = noteType, notes = noteText, attach = null) => {
    if (!selectedEnquiry) return;
    const enquiryId = selectedEnquiry.enquiry_id || selectedEnquiry.id;
    try {
      const creatorName = currentUser?.username || 'Admin';
      await api.addEnquiryTimeline(enquiryId, type, notes, followUpDate || null, attach, creatorName);
      fetchTimeline(enquiryId);
      setNoteText('');
      setFollowUpDate('');
    } catch (e) {
      console.warn('Timeline entry logged locally:', e.message);
    }
  };

  // Filtered entries
  const filtered = enquiries.filter(inq => {
    if (activeFilter === 'ai' && inq.type !== 'ai') return false;
    if (activeFilter === 'crm' && inq.type !== 'crm') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = (inq.customer_name || '').toLowerCase().includes(q) ||
        (inq.phone || '').includes(q) ||
        (inq.destinations || '').toLowerCase().includes(q) ||
        (inq.enquiry_id || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const aiCount = enquiries.filter(e => e.type === 'ai').length;
  const crmCount = enquiries.filter(e => e.type === 'crm').length;

  // Helper to parse AI chat history
  const getAiChatMessages = () => {
    if (!selectedEnquiry || selectedEnquiry.type !== 'ai') return [];
    const rawHist = selectedEnquiry.raw?.chat_history;
    if (!rawHist) return [];
    if (Array.isArray(rawHist)) return rawHist;
    try {
      const parsed = JSON.parse(rawHist);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const aiMessages = getAiChatMessages();

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <span>Customer Inquiries & AI Leads CRM</span>
            <span className="badge bg-primary bg-opacity-10 text-primary fs-6 px-3 py-1 rounded-pill">
              {enquiries.length} Total
            </span>
          </h2>
          <p className="text-muted mb-0 small">
            Live centralized dashboard for Sophia AI Chatbot leads and custom travel enquiries.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={fetchEnquiries} title="Refresh live leads">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: List with Filter Tabs */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
            {/* Filter Tabs */}
            <div className="card-header bg-white border-bottom p-3">
              <div className="d-flex gap-1 p-1 bg-light rounded-pill mb-3">
                <button
                  className={`btn btn-sm flex-fill rounded-pill fw-semibold ${activeFilter === 'all' ? 'btn-white bg-white text-dark shadow-xs' : 'text-muted border-0'}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All ({enquiries.length})
                </button>
                <button
                  className={`btn btn-sm flex-fill rounded-pill fw-semibold ${activeFilter === 'ai' ? 'btn-white bg-white text-primary shadow-xs' : 'text-muted border-0'}`}
                  onClick={() => setActiveFilter('ai')}
                >
                  <Bot size={13} className="me-1 inline-block" />
                  Sophia AI ({aiCount})
                </button>
                <button
                  className={`btn btn-sm flex-fill rounded-pill fw-semibold ${activeFilter === 'crm' ? 'btn-white bg-white text-dark shadow-xs' : 'text-muted border-0'}`}
                  onClick={() => setActiveFilter('crm')}
                >
                  Custom ({crmCount})
                </button>
              </div>

              {/* Search input */}
              <input 
                type="text" 
                className="form-control form-control-sm rounded-pill px-3" 
                placeholder="Search by name, phone, destination..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="card-body p-0" style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto' }}>
              {loading ? (
                <div className="p-4 text-center text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                  Loading inquiries & AI leads...
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-muted">No leads found in this view.</div>
              ) : filtered.map(inq => {
                const isSelected = selectedEnquiry?.id === inq.id;
                const isAi = inq.type === 'ai';
                return (
                  <div 
                    key={inq.id} 
                    className={`p-3 border-bottom cursor-pointer transition-all ${isSelected ? 'bg-light border-primary' : 'hover-bg-light'}`}
                    onClick={() => handleSelectEnquiry(inq)}
                    style={{ borderLeft: isSelected ? '4px solid #0d6efd' : '4px solid transparent' }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <div className="d-flex align-items-center gap-1.5">
                        {isAi ? (
                          <span className="badge rounded-pill" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontSize: '11px' }}>
                            <Bot size={11} className="me-1" /> Sophia AI
                          </span>
                        ) : (
                          <span className="badge rounded-pill bg-light text-secondary border" style={{ fontSize: '11px' }}>
                            <FileText size={11} className="me-1" /> Custom Trip
                          </span>
                        )}
                        <span className="text-muted font-monospace" style={{ fontSize: '11px' }}>{inq.enquiry_id}</span>
                      </div>
                      <span className={`badge ${inq.status === 'Hot Lead' || inq.status === 'New Enquiry' ? 'bg-danger' : inq.status === 'Closed' ? 'bg-secondary' : 'bg-primary'}`} style={{ fontSize: '10.5px' }}>
                        {inq.status}
                      </span>
                    </div>

                    <h6 className="fw-bold mb-1 text-dark">{inq.customer_name}</h6>
                    
                    <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                      <Phone size={12} className="text-secondary" />
                      <span className="fw-medium text-dark">{inq.phone || 'No phone'}</span>
                      {inq.destinations && (
                        <>
                          <span>•</span>
                          <span className="text-truncate" style={{ maxWidth: '160px' }}>{inq.destinations}</span>
                        </>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top" style={{ fontSize: '0.72rem' }}>
                      <span className="text-muted">
                        {inq.created_at ? new Date(inq.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                      <span className="fw-semibold" style={{ color: inq.assigned_to ? '#7c3aed' : '#94a3b8' }}>
                        {inq.assigned_to ? `Assigned: ${inq.assigned_to}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Enquiry / Lead Details & Timeline */}
        <div className="col-lg-8">
          {selectedEnquiry ? (
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
              {/* Header card with action badges */}
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h4 className="fw-bold mb-0 text-dark">{selectedEnquiry.customer_name}</h4>
                    {selectedEnquiry.type === 'ai' ? (
                      <span className="badge rounded-pill" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                        <Sparkles size={12} className="me-1" /> Sophia AI Chatbot Lead
                      </span>
                    ) : (
                      <span className="badge rounded-pill bg-light text-dark border">
                        Custom Trip Inquiry
                      </span>
                    )}
                  </div>
                  <div className="text-muted d-flex gap-3 small flex-wrap align-items-center mt-2">
                    <span className="d-flex align-items-center gap-1">
                      <Phone size={14} className="text-success"/> 
                      <strong>{selectedEnquiry.phone}</strong>
                    </span>
                    {selectedEnquiry.email && (
                      <span className="d-flex align-items-center gap-1">
                        <Mail size={14}/> {selectedEnquiry.email}
                      </span>
                    )}
                    {selectedEnquiry.phone && (
                      <a 
                        href={`https://wa.me/91${selectedEnquiry.phone.replace(/\D/g, '').slice(-10)}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-success py-0 px-2 rounded-pill d-inline-flex align-items-center gap-1"
                        style={{ fontSize: '11px' }}
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <div>
                    <span className="text-muted small d-block mb-1">Assigned Handler</span>
                    <select 
                      className="form-select form-select-sm fw-semibold border rounded-3" 
                      style={{ minWidth: '150px', fontSize: '0.82rem' }}
                      value={selectedEnquiry.assigned_to || ''} 
                      onChange={(e) => handleUpdateAssignment(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {adminUsers.map(u => (
                        <option key={u.id || u.username} value={u.username}>{u.username} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-muted small d-block mb-1">Lead Stage</span>
                    <select 
                      className="form-select form-select-sm fw-bold text-primary bg-primary bg-opacity-10 border-0 rounded-3" 
                      value={selectedEnquiry.status} 
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                    >
                      {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-4 row g-4">
                {/* Left Sub-Column: Requirements / AI Chat History */}
                <div className="col-md-5 border-end pe-md-4">
                  {selectedEnquiry.type === 'ai' ? (
                    <div>
                      <h6 className="fw-bold text-uppercase text-muted mb-3 d-flex align-items-center gap-1.5" style={{ fontSize: '12px' }}>
                        <Bot size={15} className="text-primary" /> Sophia AI Inquiry Summary
                      </h6>

                      <div className="mb-3 p-3 bg-light rounded-3">
                        <div className="small text-muted mb-1">Service / Item Requested</div>
                        <div className="fw-bold text-primary">{selectedEnquiry.raw?.service || selectedEnquiry.destinations || 'Goa Tour Assistance'}</div>
                      </div>

                      <div className="mb-3">
                        <div className="small text-muted mb-1">Customer Inquiry Notes</div>
                        <div className="p-3 bg-light rounded-3 small text-secondary">
                          {selectedEnquiry.raw?.notes || selectedEnquiry.details || 'Customer engaged with Sophia AI.'}
                        </div>
                      </div>

                      {/* Chat History Dialogue */}
                      <div className="mt-4">
                        <h6 className="fw-bold text-uppercase text-muted mb-2 d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                          <MessageSquare size={14} /> AI Conversation Transcript
                        </h6>
                        <div className="p-2 border rounded-3 bg-white" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                          {aiMessages.length === 0 ? (
                            <div className="text-muted small p-3 text-center">No chat messages recorded yet.</div>
                          ) : (
                            aiMessages.map((msg, idx) => {
                              const isUser = msg.role === 'user';
                              return (
                                <div key={idx} className={`d-flex mb-2 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}>
                                  <div 
                                    className={`p-2 rounded-3 small`}
                                    style={{
                                      maxWidth: '85%',
                                      fontSize: '11.5px',
                                      background: isUser ? '#FF6B35' : '#f1f5f9',
                                      color: isUser ? '#fff' : '#0f172a'
                                    }}
                                  >
                                    <div className="fw-bold" style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>
                                      {isUser ? selectedEnquiry.customer_name || 'Customer' : 'Sophia AI'}
                                    </div>
                                    <div>{msg.content}</div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '12px' }}>Trip Requirements</h6>
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Destinations</div>
                        <div className="fw-medium">{selectedEnquiry.raw?.destinations || selectedEnquiry.destinations}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Travel Dates</div>
                        <div className="fw-medium">{selectedEnquiry.raw?.travel_dates || 'Flexible'} {selectedEnquiry.raw?.flexible_dates == 1 && '(Flexible)'}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Travellers</div>
                        <div className="fw-medium">{selectedEnquiry.raw?.adults || 1} Adults, {selectedEnquiry.raw?.children || 0} Children, {selectedEnquiry.raw?.infants || 0} Infants</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Budget</div>
                        <div className="fw-medium">{selectedEnquiry.raw?.budget_range || 'Not specified'}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Accommodation</div>
                        <div className="fw-medium">{selectedEnquiry.raw?.hotel_category || 'Any'}, {selectedEnquiry.raw?.room_type || 'Any Room'}</div>
                      </div>
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Requirements</div>
                        <div className="d-flex flex-wrap gap-2 mt-1">
                          {selectedEnquiry.raw?.req_flight == 1 && <span className="badge bg-light text-dark border">Flight</span>}
                          {selectedEnquiry.raw?.req_train == 1 && <span className="badge bg-light text-dark border">Train</span>}
                          {selectedEnquiry.raw?.req_car == 1 && <span className="badge bg-light text-dark border">Self Drive Car</span>}
                          {selectedEnquiry.raw?.req_bike == 1 && <span className="badge bg-light text-dark border">Self Drive Bike</span>}
                          {selectedEnquiry.raw?.req_sightseeing == 1 && <span className="badge bg-light text-dark border">Sightseeing</span>}
                        </div>
                      </div>
                      {selectedEnquiry.raw?.special_requests && (
                        <div className="mb-3">
                          <div className="small text-muted mb-1">Special Requests</div>
                          <div className="p-3 bg-light rounded small">{selectedEnquiry.raw?.special_requests}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Sub-Column: Timeline & Actions */}
                <div className="col-md-7 ps-md-4">
                  <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '12px' }}>Timeline & Actions</h6>
                  
                  {/* Action Box */}
                  <div className="bg-light p-3 rounded-3 mb-4">
                    <div className="d-flex gap-2 mb-2">
                      {['Note', 'Call', 'Email', 'WhatsApp'].map(t => (
                        <button key={t} className={`btn btn-sm ${noteType === t ? 'btn-primary' : 'btn-outline-secondary bg-white'}`} onClick={() => setNoteType(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <textarea className="form-control border-0 mb-2" rows="2" placeholder={`Log a ${noteType.toLowerCase()}...`} value={noteText} onChange={e => setNoteText(e.target.value)}></textarea>
                    <div className="d-flex justify-content-between align-items-center">
                      <input type="date" className="form-control form-control-sm w-auto border-0 text-muted" title="Follow up date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                      <button className="btn btn-primary btn-sm px-3" onClick={() => handleAddTimelineLog()} disabled={!noteText}>Save {noteType}</button>
                    </div>
                  </div>

                  {/* Timeline Feed */}
                  <div className="timeline-feed pe-2" style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {timeline.length === 0 ? (
                      <div className="text-center text-muted py-3 small">No follow-up activity logged yet. Add a note or call update above.</div>
                    ) : timeline.map(log => (
                      <div key={log.id} className="d-flex gap-3 mb-3">
                        <div className="mt-1">
                          {log.action_type === 'Call' ? <div className="bg-success text-white rounded-circle p-2"><Phone size={13}/></div> :
                           log.action_type === 'Email' ? <div className="bg-info text-white rounded-circle p-2"><Mail size={13}/></div> :
                           log.action_type === 'WhatsApp' ? <div className="bg-success text-white rounded-circle p-2"><MessageCircle size={13}/></div> :
                           log.action_type === 'Status Change' ? <div className="bg-primary text-white rounded-circle p-2"><CheckCircle size={13}/></div> :
                           <div className="bg-secondary text-white rounded-circle p-2"><FileText size={13}/></div>}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold" style={{ fontSize: '13px' }}>{log.action_type}</span>
                            <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <div className="text-secondary mt-1 small">{log.notes}</div>
                          {log.follow_up_date && (
                            <div className="mt-1 small text-warning fw-bold d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                              <Clock size={11}/> Follow up on {new Date(log.follow_up_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card shadow-sm border-0 rounded-4 h-100 d-flex justify-content-center align-items-center text-muted p-5 text-center">
              <div>
                <User size={64} className="mb-3 opacity-25" />
                <h4>No Enquiry Selected</h4>
                <p>Select an enquiry or AI lead from the left to view details and manage the pipeline.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
