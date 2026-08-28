import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Search, Filter, Download, Plus, Phone, Mail, MessageSquare, 
  Building, Car, CheckCircle, XCircle, Clock, Trash2, Eye, Edit3, 
  Shield, Tag, Calendar, MapPin, X, ArrowUpRight, PhoneCall, AlertCircle, 
  RefreshCw, Sparkles, UserCheck, Activity, Radio, Save, Send, UserPlus, CornerDownRight, Check
} from 'lucide-react';
import * as api from '../../services/api';

const SOURCE_TABS = [
  'All',
  'Hotel Enquiries',
  'Vehicle Rental',
  'Vendor Onboarding',
  'Custom Trips',
  'AI Planner',
  'Contact Us'
];

const STATUS_LIST = [
  'All Statuses',
  'New',
  'Contacted',
  'In Progress',
  'Qualified',
  'Closed-Won',
  'Closed-Lost'
];

function SourceBadge({ source }) {
  const configs = {
    'Hotel Enquiries': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: Building },
    'Vehicle Rental': { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', icon: Car },
    'Vendor Onboarding': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', icon: Shield },
    'Custom Trips': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', icon: Sparkles },
    'AI Planner': { bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff', icon: Sparkles },
    'Contact Us': { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', icon: MessageSquare }
  };
  const c = configs[source] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', icon: Tag };
  const Icon = c.icon;

  return (
    <span 
      className="px-2 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '0.68rem' }}
    >
      <Icon size={11} /> {source}
    </span>
  );
}

export default function LeadManagement({ usersList = [], currentUser }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [assignableUsers, setAssignableUsers] = useState([]);
  
  // Comments thread state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentsEndRef = useRef(null);

  // Next action editing
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [nextActionDraft, setNextActionDraft] = useState('');
  const [savingNextAction, setSavingNextAction] = useState(false);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // New Lead Form state
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Hotel Enquiries',
    service: '',
    assignedTo: 'Unassigned',
    status: 'New',
    budget: '',
    notes: '',
    nextAction: ''
  });

  const isSubAdmin = currentUser?.role === 'subadmin' || currentUser?.role === 'agent';
  const currentUserName = currentUser?.name || currentUser?.username || 'Admin';

  // Load assignable team members
  const loadAssignableUsers = useCallback(async () => {
    try {
      const users = await api.fetchAssignableUsers();
      if (Array.isArray(users) && users.length > 0) {
        setAssignableUsers(users);
      } else if (usersList && usersList.length > 0) {
        setAssignableUsers(usersList.filter(u => ['admin', 'subadmin', 'agent'].includes(u.role)));
      }
    } catch (e) {
      if (usersList && usersList.length > 0) {
        setAssignableUsers(usersList.filter(u => ['admin', 'subadmin', 'agent'].includes(u.role)));
      }
    }
  }, [usersList]);

  // Fetch leads live from backend database
  const loadLeads = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsSyncing(true);
    try {
      const data = await api.fetchLeads();
      if (Array.isArray(data)) {
        // If logged in as Sub-Admin/Agent, ensure client-side filtering as well
        const visibleLeads = isSubAdmin 
          ? data.filter(l => {
              const a = (l.assigned_to || l.assignedTo || '').toLowerCase();
              const u = (currentUser?.username || '').toLowerCase();
              const n = (currentUser?.name || '').toLowerCase();
              return a.includes(u) || a.includes(n) || a === u;
            })
          : data;

        setLeads(visibleLeads);
        setLastSyncedAt(Date.now());
        setSecondsAgo(0);

        // If a lead is currently selected, refresh its details
        if (selectedLead) {
          const fresh = data.find(l => l.id === selectedLead.id);
          if (fresh) {
            setSelectedLead(fresh);
          }
        }
      }
    } catch (err) {
      console.warn('[LeadManagement] Realtime fetch error:', err.message);
    } finally {
      setLoading(false);
      if (showIndicator) {
        setTimeout(() => setIsSyncing(false), 400);
      }
    }
  }, [isSubAdmin, currentUser, selectedLead]);

  // Fetch comments for selected lead
  const loadComments = useCallback(async (leadId) => {
    if (!leadId) return;
    setLoadingComments(true);
    try {
      const data = await api.fetchLeadComments(leadId, currentUser?.role, currentUser?.username);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load comments:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [currentUser]);

  // Initial fetch and Realtime sync loop (every 8 seconds)
  useEffect(() => {
    loadLeads();
    loadAssignableUsers();

    const pollInterval = setInterval(() => {
      loadLeads(false);
      if (selectedLead) {
        loadComments(selectedLead.id);
      }
    }, 8000);

    const handleFocus = () => {
      loadLeads(false);
      if (selectedLead) loadComments(selectedLead.id);
    };
    window.addEventListener('focus', handleFocus);

    const handleRealtimeLead = () => loadLeads(true);
    window.addEventListener('realtime-lead-created', handleRealtimeLead);
    window.addEventListener('new-booking-created', handleRealtimeLead);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('realtime-lead-created', handleRealtimeLead);
      window.removeEventListener('new-booking-created', handleRealtimeLead);
    };
  }, [loadLeads, loadAssignableUsers, selectedLead, loadComments]);

  // Load comments when selectedLead changes
  useEffect(() => {
    if (selectedLead) {
      setNextActionDraft(selectedLead.next_action || selectedLead.nextAction || '');
      setNotesDraft(selectedLead.notes || '');
      setEditingNextAction(false);
      setEditingNotes(false);
      loadComments(selectedLead.id);
    } else {
      setComments([]);
    }
  }, [selectedLead, loadComments]);

  // Scroll comments to bottom
  useEffect(() => {
    if (comments.length > 0 && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Track "seconds ago" timer
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - lastSyncedAt) / 1000);
      setSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncedAt]);

  // Filtered Leads
  const filteredLeads = leads.filter(item => {
    const matchSource = (activeSource === 'All') || (item.source === activeSource);
    const matchStatus = (selectedStatus === 'All Statuses') || (item.status === selectedStatus);
    const q = search.toLowerCase().trim();
    const matchSearch = !q || 
      String(item.name || '').toLowerCase().includes(q) ||
      String(item.id || '').toLowerCase().includes(q) ||
      String(item.phone || '').toLowerCase().includes(q) ||
      String(item.email || '').toLowerCase().includes(q) ||
      String(item.service || '').toLowerCase().includes(q) ||
      String(item.assigned_to || item.assignedTo || '').toLowerCase().includes(q) ||
      String(item.next_action || item.nextAction || '').toLowerCase().includes(q);

    return matchSource && matchStatus && matchSearch;
  });

  // KPI Calculations
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'New' || !l.assigned_to || l.assigned_to === 'Unassigned' || l.assignedTo === 'Unassigned').length;
  const convertedCount = leads.filter(l => l.status === 'Closed-Won').length;
  const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0';
  const lostCount = leads.filter(l => l.status === 'Closed-Lost').length;

  const handleExportCSV = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      alert("No lead records available to export.");
      return;
    }
    const headers = ["Lead ID", "Customer Name", "Phone", "Email", "Lead Source", "Service / Property", "Assigned Agent", "Assigned On", "Status", "Next Action", "Budget", "Created At", "Notes"];
    const rows = filteredLeads.map(l => [
      `"${l.id || ''}"`,
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.source || ''}"`,
      `"${l.service || ''}"`,
      `"${l.assigned_to || l.assignedTo || 'Unassigned'}"`,
      `"${l.assigned_at || l.assignedAt || ''}"`,
      `"${l.status || ''}"`,
      `"${(l.next_action || l.nextAction || '').replace(/"/g, '""')}"`,
      `"${l.budget || ''}"`,
      `"${l.created_at || l.createdAt || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tripgalileo_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      alert("Please enter customer name and phone number.");
      return;
    }

    const payload = {
      id: 'LD-' + Math.floor(1000 + Math.random() * 9000),
      name: newLead.name.trim(),
      phone: newLead.phone.trim(),
      email: newLead.email.trim(),
      source: newLead.source,
      service: newLead.service.trim() || 'General Trip Consultation',
      assigned_to: newLead.assignedTo || 'Unassigned',
      assigned_by: currentUserName,
      assigned_at: newLead.assignedTo !== 'Unassigned' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
      status: newLead.status || 'New',
      budget: newLead.budget.trim() || 'Not specified',
      notes: newLead.notes.trim(),
      next_action: newLead.nextAction.trim()
    };

    try {
      await api.createLead(payload);
      await loadLeads(true);
      setShowAddModal(false);
      setNewLead({
        name: '',
        phone: '',
        email: '',
        source: 'Hotel Enquiries',
        service: '',
        assignedTo: 'Unassigned',
        status: 'New',
        budget: '',
        notes: '',
        nextAction: ''
      });
    } catch (err) {
      alert("Failed to save lead: " + err.message);
    }
  };

  const handleOpenAssignModal = (lead) => {
    setAssignModalLead(lead);
    setSelectedAssignee(lead.assigned_to || lead.assignedTo || 'Unassigned');
  };

  const handleConfirmAssignment = async (e) => {
    if (e) e.preventDefault();
    if (!assignModalLead) return;

    setAssigning(true);
    try {
      const res = await api.assignLead(assignModalLead.id, selectedAssignee, currentUserName);
      const nowStr = res.assigned_at || new Date().toISOString().replace('T', ' ').slice(0, 19);

      // Optimistic update
      setLeads(prev => prev.map(l => l.id === assignModalLead.id ? { 
        ...l, 
        assigned_to: selectedAssignee, 
        assignedTo: selectedAssignee, 
        assigned_by: currentUserName,
        assigned_at: nowStr 
      } : l));

      if (selectedLead && selectedLead.id === assignModalLead.id) {
        setSelectedLead(prev => ({ 
          ...prev, 
          assigned_to: selectedAssignee, 
          assignedTo: selectedAssignee,
          assigned_by: currentUserName,
          assigned_at: nowStr 
        }));
        await loadComments(assignModalLead.id);
      }

      setAssignModalLead(null);
    } catch (err) {
      alert("Failed to assign lead: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId, nextStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, status: nextStatus }));
    }

    try {
      await api.updateLeadStatus(leadId, nextStatus);
    } catch (err) {
      console.error("Failed to update status on server:", err);
      loadLeads(false);
    }
  };

  const handleSaveNextAction = async () => {
    if (!selectedLead) return;
    setSavingNextAction(true);
    try {
      await api.updateNextAction(selectedLead.id, nextActionDraft);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, next_action: nextActionDraft, nextAction: nextActionDraft } : l));
      setSelectedLead(prev => ({ ...prev, next_action: nextActionDraft, nextAction: nextActionDraft }));
      setEditingNextAction(false);
    } catch (err) {
      alert("Failed to save next action: " + err.message);
    } finally {
      setSavingNextAction(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      await api.updateLead(selectedLead.id, { notes: notesDraft });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: notesDraft } : l));
      setSelectedLead(prev => ({ ...prev, notes: notesDraft }));
      setEditingNotes(false);
    } catch (err) {
      alert("Failed to save notes: " + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSendComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || !selectedLead) return;

    setSendingComment(true);
    const draftText = newCommentText.trim();
    setNewCommentText('');

    try {
      const res = await api.addLeadComment(selectedLead.id, draftText, currentUser || { id: 'admin', name: currentUserName, role: 'admin' });
      if (res.comment) {
        setComments(prev => [...prev, res.comment]);
      } else {
        await loadComments(selectedLead.id);
      }
    } catch (err) {
      alert("Failed to post comment: " + err.message);
      setNewCommentText(draftText);
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.deleteLeadComment(commentId, selectedLead.id);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert("Failed to delete comment: " + err.message);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm(`Are you sure you want to permanently delete lead #${leadId}?`)) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(null);
      }

      try {
        await api.deleteLead(leadId);
      } catch (err) {
        console.error("Failed to delete lead from server:", err);
        loadLeads(false);
      }
    }
  };

  return (
    <div className="p-4">
      {/* Top Header & Live Sync Status */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '20px' }}>
              Enterprise Lead Management Hub
            </h4>
            
            {/* Realtime Live Pulse Badge */}
            <span 
              className="badge rounded-pill px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5 fw-bold"
              style={{ 
                background: '#ecfdf5', 
                color: '#059669', 
                border: '1px solid #a7f3d0',
                fontSize: '0.68rem',
                letterSpacing: '0.3px'
              }}
              title="Real-time synchronized with backend database"
            >
              <span 
                className="rounded-circle" 
                style={{ 
                  width: '7px', 
                  height: '7px', 
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981'
                }} 
              />
              LIVE REAL-TIME SYNC
            </span>
          </div>

          <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: '#64748b' }}>
            {isSubAdmin 
              ? `Assigned Lead Queue for ${currentUserName} (${currentUser?.role})` 
              : 'Multi-channel pipeline tracking hotel queries, fleet rentals, custom packages & team dispatch'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Manual Refresh / Sync Button */}
          <button 
            onClick={() => loadLeads(true)}
            disabled={isSyncing}
            className="btn btn-light px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm border" 
            style={{ fontSize: '0.82rem', color: '#475569' }}
            title="Fetch latest leads immediately"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} style={{ color: '#FF6333' }} />
            <span>{isSyncing ? 'Syncing...' : (secondsAgo <= 3 ? 'Synced just now' : `Synced ${secondsAgo}s ago`)}</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm" 
            style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.82rem', border: '1px solid #bbf7d0' }}
          >
            <Download size={14} /> Export CSV
          </button>
          
          {!isSubAdmin && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm text-white" 
              style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem', border: 'none' }}
            >
              <Plus size={16} /> + Add Manual Lead
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards (Grid of 4) */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="rounded-3 p-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {isSubAdmin ? 'My Assigned Leads' : 'Total Inbound Leads'}
              </span>
              <div className="rounded-2 p-1 bg-light text-muted"><Users size={16} /></div>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.6rem', color: '#0D1B2E' }}>{totalLeads}</div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>Active pipeline records</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="rounded-3 p-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>New / Unassigned</span>
              <div className="rounded-2 p-1" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertCircle size={16} /></div>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.6rem', color: '#dc2626' }}>{newLeadsCount}</div>
            <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>Requires agent dispatch</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="rounded-3 p-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Converted (Won)</span>
              <div className="rounded-2 p-1" style={{ background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={16} /></div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <div className="fw-bold" style={{ fontSize: '1.6rem', color: '#16a34a' }}>{convertedCount}</div>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold" style={{ fontSize: '0.75rem' }}>{conversionRate}% Win Rate</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>Closed booking revenues</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="rounded-3 p-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Lost / Dropped</span>
              <div className="rounded-2 p-1 bg-light text-muted"><XCircle size={16} /></div>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.6rem', color: '#64748b' }}>{lostCount}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Price or schedule mismatches</div>
          </div>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="card shadow-sm border-0 rounded-4 mb-4" style={{ background: '#fff' }}>
        <div className="card-body p-3">
          {/* Source Tabs */}
          <div className="d-flex gap-1 overflow-auto pb-2 mb-3 border-bottom" style={{ scrollbarWidth: 'none' }}>
            {SOURCE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSource(tab)}
                className="btn btn-sm px-3 py-1 rounded-pill fw-bold text-nowrap"
                style={{
                  fontSize: '0.76rem',
                  background: activeSource === tab ? '#0D1B2E' : '#f8fafc',
                  color: activeSource === tab ? '#fff' : '#64748b',
                  border: activeSource === tab ? '1px solid #0D1B2E' : '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search, Status & Controls */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="position-relative flex-grow-1" style={{ minWidth: '240px', maxWidth: '450px' }}>
              <Search size={15} className="position-absolute" style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px', borderRadius: '10px', fontSize: '0.84rem' }}
                placeholder="Search leads by name, phone, email, service, ID, next action..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Stage:</span>
              <select
                className="form-select form-select-sm fw-bold"
                style={{ width: '150px', fontSize: '0.8rem', borderRadius: '8px' }}
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                {STATUS_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Master Leads Table */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden" style={{ background: '#fff' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.83rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Lead ID', 'Customer Contact', 'Source & Service', 'Assignment State', 'Next Actionable Step', 'Pipeline Status', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(item => {
                const assignee = item.assigned_to || item.assignedTo || 'Unassigned';
                const isAssigned = assignee && assignee !== 'Unassigned';
                const nextAct = item.next_action || item.nextAction || '';

                return (
                  <tr 
                    key={item.id} 
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                    className="hover-bg-light"
                    onClick={() => {
                      setSelectedLead(item);
                    }}
                  >
                    {/* Lead ID */}
                    <td className="px-3 py-3">
                      <span className="fw-bold font-monospace text-primary" style={{ fontSize: '0.78rem' }}>
                        #{item.id}
                      </span>
                      <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                        {(item.created_at || item.createdAt || '').slice(0, 10)}
                      </div>
                    </td>

                    {/* Customer Contact */}
                    <td className="px-3 py-3">
                      <div className="fw-bold" style={{ color: '#0D1B2E' }}>{item.name}</div>
                      <div className="d-flex align-items-center gap-2 mt-0.5" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <span>{item.phone}</span>
                        {item.email && <span className="text-muted">· {item.email}</span>}
                      </div>
                    </td>

                    {/* Lead Source & Service */}
                    <td className="px-3 py-3" style={{ maxWidth: '240px' }}>
                      <div className="mb-1"><SourceBadge source={item.source || 'Hotel Enquiries'} /></div>
                      <div className="fw-semibold text-truncate" title={item.service} style={{ color: '#0D1B2E', fontSize: '0.78rem' }}>
                        {item.service || 'General Trip Consultation'}
                      </div>
                      {item.budget && (
                        <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                          Est. Budget: {item.budget}
                        </div>
                      )}
                    </td>

                    {/* Assignment State & Action */}
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      {isAssigned ? (
                        <div>
                          <div className="d-flex align-items-center gap-1.5">
                            <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', fontSize: '0.72rem' }}>
                              <UserCheck size={11} className="me-1 inline" /> {assignee}
                            </span>
                            {!isSubAdmin && (
                              <button 
                                onClick={() => handleOpenAssignModal(item)}
                                className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                                style={{ fontSize: '0.72rem', color: '#7c3aed' }}
                              >
                                Reassign
                              </button>
                            )}
                          </div>
                          {item.assigned_at && (
                            <div className="text-muted mt-0.5" style={{ fontSize: '0.66rem' }}>
                              Assigned: {String(item.assigned_at).slice(0, 16)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.7rem' }}>
                            Unassigned
                          </span>
                          {!isSubAdmin && (
                            <button 
                              onClick={() => handleOpenAssignModal(item)}
                              className="btn btn-sm px-2 py-0.5 rounded-pill fw-bold text-white shadow-none"
                              style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.7rem' }}
                            >
                              Assign Lead
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Next Actionable Step */}
                    <td className="px-3 py-3" style={{ maxWidth: '220px' }}>
                      {nextAct ? (
                        <div className="d-flex align-items-start gap-1">
                          <CornerDownRight size={13} className="text-warning flex-shrink-0 mt-0.5" />
                          <span className="fw-semibold text-dark text-truncate" title={nextAct} style={{ fontSize: '0.76rem' }}>
                            {nextAct}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted fst-italic" style={{ fontSize: '0.72rem' }}>No next action set</span>
                      )}
                    </td>

                    {/* Status Dropdown / Pill */}
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        className="form-select form-select-sm border-0 fw-bold"
                        style={{ 
                          fontSize: '0.74rem', 
                          width: 'auto',
                          background: item.status === 'New' ? '#fee2e2' : item.status === 'Closed-Won' ? '#dcfce7' : item.status === 'In Progress' ? '#dbeafe' : item.status === 'Qualified' ? '#f5f3ff' : '#f8fafc',
                          color: item.status === 'New' ? '#dc2626' : item.status === 'Closed-Won' ? '#16a34a' : item.status === 'In Progress' ? '#2563eb' : item.status === 'Qualified' ? '#7c3aed' : '#475569'
                        }}
                        value={item.status || 'New'}
                        onChange={e => handleUpdateLeadStatus(item.id, e.target.value)}
                      >
                        {STATUS_LIST.filter(s => s !== 'All Statuses').map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>

                    {/* Quick Actions */}
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="d-flex align-items-center gap-1">
                        {/* WhatsApp Quick Action */}
                        {item.phone && (
                          <a
                            href={`https://wa.me/${String(item.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${item.name}, thank you for contacting TripGalileo regarding ${item.service || 'your trip'}!`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-light p-1.5 rounded-2 text-success"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </a>
                        )}

                        {/* Phone Call Quick Action */}
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            className="btn btn-sm btn-light p-1.5 rounded-2 text-primary"
                            title="Call Customer"
                          >
                            <Phone size={13} />
                          </a>
                        )}

                        {/* View Details Drawer */}
                        <button
                          className="btn btn-sm btn-light p-1.5 rounded-2 text-secondary"
                          onClick={() => setSelectedLead(item)}
                          title="View Lead Details & Discussion"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Delete (Admin only) */}
                        {!isSubAdmin && (
                          <button
                            className="btn btn-sm btn-light p-1.5 rounded-2 text-danger"
                            onClick={() => handleDeleteLead(item.id)}
                            title="Delete Lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-5 px-3">
            <div className="rounded-circle d-inline-flex p-3 mb-3" style={{ background: '#f8fafc' }}>
              <Users size={36} style={{ color: '#94a3b8' }} />
            </div>
            <h6 className="fw-bold text-dark mb-1">
              {isSubAdmin ? 'No Assigned Leads in Your Queue' : 'No Leads Found'}
            </h6>
            <p className="text-muted mx-auto mb-4" style={{ fontSize: '0.82rem', maxWidth: '420px' }}>
              {leads.length === 0 
                ? (isSubAdmin ? 'When an administrator assigns incoming leads to you, they will appear here in real-time.' : 'Your lead pipeline is clean. Inbound inquiries from hotel bookings, fleet rentals, custom packages, and AI chatbot chats will appear here in real-time.')
                : 'No leads matched your current search or filter criteria.'}
            </p>
            {!isSubAdmin && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-sm px-4 py-2 rounded-pill fw-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)' }}
              >
                + Create First Lead
              </button>
            )}
          </div>
        )}
      </div>

      {/* QUICK LEAD DETAILS & COMMUNICATION DRAWER */}
      {selectedLead && (
        <div className="position-fixed top-0 end-0 bottom-0 shadow-lg d-flex flex-column" style={{ width: '480px', maxWidth: '95vw', background: '#fff', zIndex: 1050, borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
          {/* Drawer Top Bar */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E', color: '#fff' }}>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h6 className="mb-0 fw-bold">{selectedLead.name}</h6>
                <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.68rem' }}>#{selectedLead.id}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{selectedLead.source}</div>
            </div>
            <button className="btn p-1 border-0 text-white-50" onClick={() => setSelectedLead(null)}><X size={18} /></button>
          </div>

          <div className="flex-grow-1 overflow-auto p-4">
            {/* Quick Contact Bar */}
            <div className="d-flex gap-2 mb-3">
              <a 
                href={`https://wa.me/${String(selectedLead.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${selectedLead.name}, this is ${currentUserName} from TripGalileo regarding your booking inquiry!`)}`} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold"
              >
                <MessageSquare size={14} /> WhatsApp
              </a>
              <a 
                href={`tel:${selectedLead.phone}`} 
                className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold"
              >
                <PhoneCall size={14} /> Call
              </a>
              {selectedLead.email && (
                <a 
                  href={`mailto:${selectedLead.email}`} 
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center p-2"
                  title="Send Email"
                >
                  <Mail size={14} />
                </a>
              )}
            </div>

            {/* 1. LEAD ASSIGNMENT INFORMATION SECTION */}
            <div className="p-3 rounded-3 mb-3" style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-uppercase" style={{ fontSize: '0.72rem', color: '#7c3aed', letterSpacing: '0.5px' }}>
                  LEAD ASSIGNMENT
                </span>
                {!isSubAdmin && (
                  <button 
                    onClick={() => handleOpenAssignModal(selectedLead)}
                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                    style={{ fontSize: '0.72rem', color: '#7c3aed' }}
                  >
                    {selectedLead.assigned_to && selectedLead.assigned_to !== 'Unassigned' ? 'Reassign' : 'Assign Now'}
                  </button>
                )}
              </div>
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                <span className="text-muted">Assigned To:</span>
                <span className="fw-bold text-dark">{selectedLead.assigned_to || selectedLead.assignedTo || 'Unassigned'}</span>
              </div>
              {selectedLead.assigned_by && (
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.76rem' }}>
                  <span className="text-muted">Assigned By:</span>
                  <span className="fw-semibold text-secondary">{selectedLead.assigned_by}</span>
                </div>
              )}
              {selectedLead.assigned_at && (
                <div className="d-flex justify-content-between" style={{ fontSize: '0.74rem' }}>
                  <span className="text-muted">Assigned On:</span>
                  <span className="fw-semibold text-secondary">{String(selectedLead.assigned_at).slice(0, 16)}</span>
                </div>
              )}
            </div>

            {/* 2. NEXT ACTIONABLE STEP SECTION */}
            <div className="p-3 rounded-3 mb-3" style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-warning text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                  NEXT ACTIONABLE STEP
                </span>
                {!editingNextAction ? (
                  <button 
                    onClick={() => { setEditingNextAction(true); setNextActionDraft(selectedLead.next_action || selectedLead.nextAction || ''); }}
                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                    style={{ fontSize: '0.72rem', color: '#b45309' }}
                  >
                    Edit Action
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button onClick={() => setEditingNextAction(false)} className="btn btn-sm btn-link p-0 text-secondary text-decoration-none" style={{ fontSize: '0.72rem' }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveNextAction} disabled={savingNextAction} className="btn btn-sm btn-warning py-0 px-2 fw-bold" style={{ fontSize: '0.72rem' }}>
                      <Save size={11} className="me-1" /> Save
                    </button>
                  </div>
                )}
              </div>

              {editingNextAction ? (
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Send hotel quotation tomorrow by 2 PM..."
                  value={nextActionDraft}
                  onChange={e => setNextActionDraft(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
              ) : (
                <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '0.82rem' }}>
                  {selectedLead.next_action || selectedLead.nextAction || <span className="text-muted fw-normal fst-italic">No next action set. Click 'Edit Action' to define next step.</span>}
                </p>
              )}
            </div>

            {/* 3. FIELD DETAILS & STATUS */}
            <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="row g-2">
                <div className="col-6">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>SERVICE REQUESTED</span>
                  <span className="fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>{selectedLead.service || 'General Inquiry'}</span>
                </div>
                <div className="col-6">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>ESTIMATED BUDGET</span>
                  <span className="fw-bold text-success" style={{ fontSize: '0.82rem' }}>{selectedLead.budget || 'Not specified'}</span>
                </div>
                <div className="col-6 mt-2">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PHONE NUMBER</span>
                  <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selectedLead.phone}</span>
                </div>
                <div className="col-6 mt-2">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PIPELINE STAGE</span>
                  <select
                    className="form-select form-select-sm fw-bold mt-1"
                    style={{ fontSize: '0.76rem' }}
                    value={selectedLead.status || 'New'}
                    onChange={e => handleUpdateLeadStatus(selectedLead.id, e.target.value)}
                  >
                    {STATUS_LIST.filter(s => s !== 'All Statuses').map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. CHRONOLOGICAL COMMUNICATION & COMMENT THREAD */}
            <div className="rounded-3 p-3 mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <span className="fw-bold text-dark text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                  <MessageSquare size={13} style={{ color: '#FF6333' }} /> LEAD COMMUNICATION & DISCUSSION ({comments.length})
                </span>
                <button onClick={() => loadComments(selectedLead.id)} disabled={loadingComments} className="btn btn-sm btn-link p-0 text-muted" title="Refresh discussion">
                  <RefreshCw size={12} className={loadingComments ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Message Feed */}
              <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {comments.length === 0 && !loadingComments && (
                  <div className="text-center py-4 text-muted" style={{ fontSize: '0.78rem' }}>
                    No messages or notes recorded yet. Write an update or question below.
                  </div>
                )}

                {comments.map((c, idx) => {
                  const isSys = c.user_role === 'system' || c.user_id === 'system';
                  const isAdm = c.user_role === 'admin' || c.user_role === 'superadmin';

                  if (isSys) {
                    return (
                      <div key={c.id || idx} className="text-center my-1">
                        <span className="badge rounded-pill bg-light text-muted border fw-normal" style={{ fontSize: '0.68rem' }}>
                          ⚡ {c.comment} · {String(c.created_at || '').slice(11, 16)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={c.id || idx} 
                      className="p-2.5 rounded-3 shadow-none position-relative group"
                      style={{ 
                        background: isAdm ? '#0D1B2E' : '#f5f3ff', 
                        color: isAdm ? '#fff' : '#1e1b4b',
                        border: isAdm ? 'none' : '1px solid #ddd6fe',
                        alignSelf: isAdm ? 'flex-end' : 'flex-start',
                        maxWidth: '90%'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <span className="fw-bold" style={{ fontSize: '0.72rem', color: isAdm ? '#FF8A00' : '#7c3aed' }}>
                          {c.user_name} ({c.user_role})
                        </span>
                        <div className="d-flex align-items-center gap-1.5">
                          <span style={{ fontSize: '0.64rem', color: isAdm ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>
                            {String(c.created_at || '').slice(11, 16)}
                          </span>
                          {!isSubAdmin && (
                            <button 
                              onClick={() => handleDeleteComment(c.id)} 
                              className="btn btn-sm p-0 border-0 text-muted opacity-50 hover-opacity-100" 
                              title="Delete message"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        {c.comment}
                      </p>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendComment} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Write an update, question, or note... (Press Enter)"
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  disabled={sendingComment}
                  style={{ fontSize: '0.8rem' }}
                />
                <button 
                  type="submit" 
                  disabled={sendingComment || !newCommentText.trim()}
                  className="btn btn-sm text-white px-3 fw-bold d-flex align-items-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', border: 'none' }}
                >
                  <Send size={13} /> Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN / REASSIGN LEAD MODAL */}
      {assignModalLead && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2050, backdropFilter: 'blur(3px)' }}>
          <div className="rounded-4 shadow-lg overflow-hidden animate__animated animate__fadeInUp" style={{ width: '100%', maxWidth: '460px', background: '#fff' }}>
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
              <div className="d-flex align-items-center gap-2">
                <UserCheck size={18} style={{ color: '#FF6333' }} />
                <h6 className="mb-0 fw-bold">Assign Lead to Team Member</h6>
              </div>
              <button className="btn p-0 text-white-50 border-0" onClick={() => setAssignModalLead(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="p-4">
              <div className="p-3 rounded-3 mb-3 bg-light border">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Lead ID:</span>
                  <span className="fw-bold font-monospace text-primary">#{assignModalLead.id}</span>
                </div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Customer Name:</span>
                  <span className="fw-bold text-dark">{assignModalLead.name}</span>
                </div>
                <div className="d-flex justify-content-between" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Service / Item:</span>
                  <span className="fw-semibold text-secondary">{assignModalLead.service || 'Trip Inquiry'}</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Assign To Sub-Admin / Agent *
                </label>
                <select
                  className="form-select fw-bold"
                  value={selectedAssignee}
                  onChange={e => setSelectedAssignee(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                  required
                >
                  <option value="Unassigned">-- Unassigned --</option>
                  {assignableUsers.map(u => (
                    <option key={u.id || u.username} value={u.name || u.username}>
                      {u.name || u.username} ({u.role}) — {u.status}
                    </option>
                  ))}
                </select>
                <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                  The selected team member will gain visibility in their Sub-Admin portal to contact the guest and manage pipeline progression.
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-3 py-2 fw-bold" style={{ fontSize: '0.82rem' }} onClick={() => setAssignModalLead(null)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={assigning}
                  className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2" 
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem', border: 'none' }}
                >
                  <CheckCircle size={14} /> {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MANUAL LEAD MODAL */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
          <div className="rounded-4 shadow-lg overflow-hidden animate__animated animate__fadeInUp" style={{ width: '100%', maxWidth: '520px', background: '#fff' }}>
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
              <div className="d-flex align-items-center gap-2">
                <Plus size={18} style={{ color: '#FF6333' }} />
                <h6 className="mb-0 fw-bold">Add New Multi-Channel Lead</h6>
              </div>
              <button className="btn p-0 text-white-50 border-0" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddLead} className="p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Rahul Mehta"
                    value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="rahul@example.com"
                    value={newLead.email}
                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Lead Source *</label>
                  <select
                    className="form-select"
                    value={newLead.source}
                    onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="Hotel Enquiries">Hotel Enquiries</option>
                    <option value="Vehicle Rental">Vehicle Rental</option>
                    <option value="Vendor Onboarding">Vendor Onboarding</option>
                    <option value="Custom Trips">Custom Trips</option>
                    <option value="AI Planner">AI Planner</option>
                    <option value="Contact Us">Contact Us</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Service / Property Interested In</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Grand Hyatt Goa (3 Nights) or Mahindra Thar 4x4"
                    value={newLead.service}
                    onChange={e => setNewLead({ ...newLead, service: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Estimated Budget</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ₹50,000"
                    value={newLead.budget}
                    onChange={e => setNewLead({ ...newLead, budget: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Assign To</label>
                  <select
                    className="form-select"
                    value={newLead.assignedTo}
                    onChange={e => setNewLead({ ...newLead, assignedTo: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="Unassigned">-- Unassigned --</option>
                    {assignableUsers.map(u => (
                      <option key={u.id || u.username} value={u.name || u.username}>
                        {u.name || u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Next Actionable Step</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Call customer at 4 PM to discuss itinerary"
                    value={newLead.nextAction}
                    onChange={e => setNewLead({ ...newLead, nextAction: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Lead Notes / Special Requests</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Customer requirements, preferred dates, etc."
                    value={newLead.notes}
                    onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  ></textarea>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-3 py-2 fw-bold" style={{ fontSize: '0.82rem' }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2" 
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem', border: 'none' }}
                >
                  <CheckCircle size={14} /> Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
