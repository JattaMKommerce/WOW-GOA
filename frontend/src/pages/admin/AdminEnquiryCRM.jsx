import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageCircle, FileText, CheckCircle, XCircle, Clock, Calendar, ChevronRight, User, Plus, Download, Edit, MapPin } from 'lucide-react';
import * as api from '../../services/api';

const PIPELINE_STAGES = [
  'New Enquiry', 'Assigned', 'First Call Pending', 'First Call Completed', 
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
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Note / Action state
  const [noteType, setNoteType] = useState('Note');
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const adminUsers = (usersList || []).filter(u => ['admin', 'superadmin'].includes(u.role));

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const data = await api.fetchCustomEnquiries();
      setEnquiries(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchTimeline = async (enquiry_id) => {
    try {
      const data = await api.fetchEnquiryTimeline(enquiry_id);
      setTimeline(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchEnquiries();
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
      await api.updateEnquiryStatus(enquiryId, newStatus, selectedEnquiry.assigned_to);
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
      await api.updateEnquiryStatus(enquiryId, selectedEnquiry.status || 'New Enquiry', val);
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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Custom Trip CRM</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary"><Download size={18} className="me-2"/> Export Data</button>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Enquiries List */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="fw-bold mb-0">Enquiries ({enquiries.length})</h5>
            </div>
            <div className="card-body p-0" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {loading ? (
                <div className="p-4 text-center text-muted">Loading enquiries...</div>
              ) : enquiries.map(inq => (
                <div 
                  key={inq.id} 
                  className={`p-3 border-bottom cursor-pointer transition-all ${selectedEnquiry?.id === inq.id ? 'bg-light border-primary' : 'hover-bg-light'}`}
                  onClick={() => handleSelectEnquiry(inq)}
                  style={{ borderLeft: selectedEnquiry?.id === inq.id ? '4px solid #0d6efd' : '4px solid transparent' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="fw-bold text-dark">{inq.enquiry_id}</span>
                    <span className={`badge ${inq.status === 'New Enquiry' ? 'bg-danger' : inq.status === 'Closed' ? 'bg-secondary' : 'bg-primary'}`}>{inq.status}</span>
                  </div>
                  <h6 className="fw-bold mb-1">{inq.customer_name}</h6>
                  <div className="text-muted small d-flex align-items-center gap-2 mb-1">
                    <MapPin size={12}/> {inq.destinations}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2 pt-1 border-top" style={{ fontSize: '0.72rem' }}>
                    <span className="text-muted">Assigned To:</span>
                    <span className="fw-semibold" style={{ color: inq.assigned_to ? '#7c3aed' : '#94a3b8' }}>
                      {inq.assigned_to || 'Unassigned'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Enquiry Details & Pipeline */}
        <div className="col-lg-8">
          {selectedEnquiry ? (
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="fw-bold mb-1">{selectedEnquiry.customer_name}</h4>
                  <div className="text-muted d-flex gap-3 small">
                    <span><Phone size={14} className="me-1"/> {selectedEnquiry.phone}</span>
                    {selectedEnquiry.email && <span><Mail size={14} className="me-1"/> {selectedEnquiry.email}</span>}
                    {selectedEnquiry.whatsapp && <span><MessageCircle size={14} className="me-1"/> {selectedEnquiry.whatsapp}</span>}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div>
                    <span className="text-muted small d-block mb-1">Assigned Admin</span>
                    <select 
                      className="form-select form-select-sm fw-semibold border" 
                      style={{ minWidth: '140px', fontSize: '0.8rem' }}
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
                    <span className="text-muted small d-block mb-1">Current Stage</span>
                    <select 
                      className="form-select form-select-sm fw-bold text-primary bg-primary bg-opacity-10 border-0" 
                      value={selectedEnquiry.status} 
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                    >
                      {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-4 row">
                {/* Trip Requirements */}
                <div className="col-md-5 border-end pe-4">
                  <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '12px' }}>Trip Requirements</h6>
                  <div className="mb-3">
                    <div className="small text-muted mb-1">Destinations</div>
                    <div className="fw-medium">{selectedEnquiry.destinations}</div>
                  </div>
                  <div className="mb-3">
                    <div className="small text-muted mb-1">Travel Dates</div>
                    <div className="fw-medium">{selectedEnquiry.travel_dates} {selectedEnquiry.flexible_dates == 1 && '(Flexible)'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="small text-muted mb-1">Travellers</div>
                    <div className="fw-medium">{selectedEnquiry.adults} Adults, {selectedEnquiry.children} Children, {selectedEnquiry.infants} Infants</div>
                  </div>
                  <div className="mb-3">
                    <div className="small text-muted mb-1">Budget</div>
                    <div className="fw-medium">{selectedEnquiry.budget_range || 'Not specified'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="small text-muted mb-1">Accommodation</div>
                    <div className="fw-medium">{selectedEnquiry.hotel_category || 'Any'}, {selectedEnquiry.room_type || 'Any Room'}</div>
                  </div>
                  <div className="mb-3">
                    <div className="small text-muted mb-1">Requirements</div>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {selectedEnquiry.req_flight == 1 && <span className="badge bg-light text-dark border">Flight</span>}
                      {selectedEnquiry.req_train == 1 && <span className="badge bg-light text-dark border">Train</span>}
                      {selectedEnquiry.req_car == 1 && <span className="badge bg-light text-dark border">Self Drive Car</span>}
                      {selectedEnquiry.req_bike == 1 && <span className="badge bg-light text-dark border">Self Drive Bike</span>}
                      {selectedEnquiry.req_sightseeing == 1 && <span className="badge bg-light text-dark border">Sightseeing</span>}
                    </div>
                  </div>
                  {selectedEnquiry.special_requests && (
                    <div className="mb-3">
                      <div className="small text-muted mb-1">Special Requests</div>
                      <div className="p-3 bg-light rounded small">{selectedEnquiry.special_requests}</div>
                    </div>
                  )}
                </div>

                {/* Timeline & Actions */}
                <div className="col-md-7 ps-4">
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
                  <div className="timeline-feed pe-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {timeline.length === 0 ? (
                      <div className="text-center text-muted py-3">No activity logged yet.</div>
                    ) : timeline.map(log => (
                      <div key={log.id} className="d-flex gap-3 mb-4">
                        <div className="mt-1">
                          {log.action_type === 'Call' ? <div className="bg-success text-white rounded-circle p-2"><Phone size={14}/></div> :
                           log.action_type === 'Email' ? <div className="bg-info text-white rounded-circle p-2"><Mail size={14}/></div> :
                           log.action_type === 'WhatsApp' ? <div className="bg-success text-white rounded-circle p-2"><MessageCircle size={14}/></div> :
                           log.action_type === 'Status Change' ? <div className="bg-primary text-white rounded-circle p-2"><CheckCircle size={14}/></div> :
                           <div className="bg-secondary text-white rounded-circle p-2"><FileText size={14}/></div>}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <span className="fw-bold fs-6">{log.action_type}</span>
                            <span className="text-muted small">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <div className="text-secondary mt-1">{log.notes}</div>
                          {log.follow_up_date && (
                            <div className="mt-2 small text-warning fw-bold d-flex align-items-center gap-1">
                              <Clock size={12}/> Follow up on {new Date(log.follow_up_date).toLocaleDateString()}
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
                <p>Select an enquiry from the list to view details and manage the pipeline.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
