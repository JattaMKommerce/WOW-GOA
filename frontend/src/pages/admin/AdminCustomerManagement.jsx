import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Eye, Wallet, Calendar, Star, Filter, ChevronRight, X, Download, 
  UserPlus, Shield, Plus, CheckCircle, AlertCircle, RefreshCw, Key, Phone, Mail, MapPin, UserCheck, ToggleLeft, ToggleRight
} from 'lucide-react';
import * as api from '../../services/api';

function StatusBadge({ status }) {
  const m = { 
    active: ['#dcfce7', '#16a34a'], 
    suspended: ['#fee2e2', '#dc2626'], 
    inactive: ['#fee2e2', '#dc2626'],
    pending: ['#fef9c3', '#ca8a04'], 
    confirmed: ['#dbeafe', '#2563eb'], 
    cancelled: ['#fee2e2', '#dc2626'] 
  };
  const [bg, color] = m[status?.toLowerCase()] || ['#f1f5f9', '#64748b'];
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: bg, color, fontSize: '0.65rem', textTransform: 'uppercase' }}>{status || 'Active'}</span>;
}

function RoleBadge({ role }) {
  const m = {
    admin: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    superadmin: { bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' },
    subadmin: { bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' },
    agent: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    customer: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
    vendor: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }
  };
  const c = m[role?.toLowerCase()] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  return (
    <span 
      className="px-2 py-0.5 rounded-pill fw-bold" 
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '0.68rem', textTransform: 'capitalize' }}
    >
      {role || 'User'}
    </span>
  );
}

export default function AdminCustomerManagement({ usersList = [], bookings = [], initialOpenAddUser = false, currentUser }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Add Users / Team Management Modal State
  const [showUsersModal, setShowUsersModal] = useState(initialOpenAddUser);
  const [usersSubTab, setUsersSubTab] = useState('list'); // 'list' | 'add'
  const [allUsers, setAllUsers] = useState(usersList);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModalMessage, setUserModalMessage] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    city: '',
    role: 'subadmin',
    password: '',
    status: 'active'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (initialOpenAddUser) {
      setShowUsersModal(true);
    }
  }, [initialOpenAddUser]);

  const loadLiveUsers = async () => {
    setLoadingUsers(true);
    try {
      const u = await api.fetchUsers();
      if (Array.isArray(u)) {
        setAllUsers(u);
      }
    } catch (err) {
      console.warn("Failed to fetch live users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showUsersModal) {
      loadLiveUsers();
    }
  }, [showUsersModal]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.toggleUserStatus(user.id, nextStatus);
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      setUserModalMessage({ type: 'success', text: `User ${user.name || user.username} is now ${nextStatus}.` });
      setTimeout(() => setUserModalMessage(null), 3000);
    } catch (err) {
      setUserModalMessage({ type: 'error', text: err.message || 'Failed to update user status.' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert("Name and email are required.");
      return;
    }
    setCreatingUser(true);
    setUserModalMessage(null);
    try {
      const payload = {
        name: newUser.name.trim(),
        username: (newUser.username.trim() || newUser.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        email: newUser.email.trim(),
        phone: newUser.phone.trim(),
        city: newUser.city.trim() || 'Goa',
        role: newUser.role,
        password: newUser.password.trim() || 'Pass@123',
        status: newUser.status
      };
      const res = await api.addUser(payload);
      if (res.success) {
        setUserModalMessage({ type: 'success', text: `User ${payload.name} (${payload.role}) created successfully!` });
        setNewUser({
          name: '',
          username: '',
          email: '',
          phone: '',
          city: '',
          role: 'subadmin',
          password: '',
          status: 'active'
        });
        await loadLiveUsers();
        setUsersSubTab('list');
      } else {
        throw new Error(res.error || 'Failed to create user');
      }
    } catch (err) {
      setUserModalMessage({ type: 'error', text: err.message || 'Error creating user' });
    } finally {
      setCreatingUser(false);
    }
  };

  // Derive real customer records dynamically from registered users & live bookings
  const customerMap = new Map();

  // 1. Registered customer users from DB
  (allUsers.length > 0 ? allUsers : usersList).filter(u => u.role === 'customer' || !u.role).forEach(u => {
    const key = (u.email || u.phone || u.username || String(u.id)).toLowerCase();
    customerMap.set(key, {
      id: u.id,
      name: u.name || u.username || 'Customer',
      email: u.email || '',
      phone: u.phone || '—',
      city: u.city || 'Goa',
      joined: u.created_at ? String(u.created_at).slice(0, 10) : '2026-08-01',
      status: u.status || 'active',
      bookings: 0,
      spent: 0,
      wallet: 0,
      kyc: u.kyc_status || 'verified'
    });
  });

  // 2. Customers with active bookings from DB
  (bookings || []).forEach(b => {
    const key = (b.email || b.phone || b.name || '').toLowerCase();
    if (!key) return;
    const bAmt = Number(b.total_amount || b.total_paid || b.amount_paid || 0) || 0;
    if (customerMap.has(key)) {
      const existing = customerMap.get(key);
      existing.bookings += 1;
      existing.spent += bAmt;
      if (!existing.phone || existing.phone === '—') existing.phone = b.phone || '—';
      if (!existing.email && b.email) existing.email = b.email;
    } else {
      customerMap.set(key, {
        id: b.id || `CUST-${Math.random().toString(36).substr(2, 6)}`,
        name: b.name || 'Direct Customer',
        email: b.email || '',
        phone: b.phone || '—',
        city: b.pickup_loc || 'Goa',
        joined: (b.created_at ? String(b.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10)),
        status: 'active',
        bookings: 1,
        spent: bAmt,
        wallet: 0,
        kyc: 'verified'
      });
    }
  });

  const allCustomers = Array.from(customerMap.values());

  const filtered = allCustomers.filter(c => {
    const matchStatus = statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter.toLowerCase();
    const query = search.toLowerCase();
    const matchSearch = String(c.name || '').toLowerCase().includes(query) || String(c.email || '').toLowerCase().includes(query);
    return matchStatus && matchSearch;
  });

  const customerBookings = selected ? (bookings || []).filter(b => b.name === selected.name || b.customer_id === selected.id) : [];

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) {
      alert("No customer records to export.");
      return;
    }
    const headers = ["Customer Name", "Email", "Phone", "City", "Member Since", "Status", "KYC Status", "Total Bookings", "Total Spent (INR)", "Wallet Balance (INR)"];
    const rows = filtered.map(c => [
      `"${c.name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.city || ''}"`,
      `"${c.joined || ''}"`,
      `"${c.status || ''}"`,
      `"${c.kyc || ''}"`,
      c.bookings || 0,
      c.spent || 0,
      c.wallet || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      {/* Header with Export & + Add Users action */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '18px' }}>Customer Management</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>View and manage customer accounts, team members, Sub-Admins, and booking histories</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* + Add Users Button */}
          <button 
            onClick={() => { setShowUsersModal(true); setUsersSubTab('add'); }}
            className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm text-white border-0" 
            style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem' }}
          >
            <UserPlus size={15} /> + Add Users
          </button>

          {/* Manage Team Button */}
          <button 
            onClick={() => { setShowUsersModal(true); setUsersSubTab('list'); }}
            className="btn btn-light px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm border" 
            style={{ fontSize: '0.82rem', color: '#475569' }}
          >
            <Shield size={14} style={{ color: '#9333ea' }} /> Manage Team & Sub-Admins
          </button>

          <button 
            onClick={handleExportCSV}
            className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm" 
            style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.82rem', border: '1px solid #bbf7d0' }}
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL CUSTOMERS</div>
            <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#0D1B2E' }}>{allCustomers.length}</div>
            <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>Registered & Booking Guests</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>ACTIVE ACCOUNTS</div>
            <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#16a34a' }}>{allCustomers.filter(c => c.status === 'active').length}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Verified profiles</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>TEAM & SUB-ADMINS</div>
            <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#9333ea' }}>{allUsers.filter(u => ['subadmin', 'agent', 'admin'].includes(u.role)).length}</div>
            <div style={{ fontSize: '0.7rem', color: '#9333ea' }}>Lead Assignees & Staff</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="rounded-3 p-3" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL REVENUE</div>
            <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#0D1B2E' }}>₹{(allCustomers.reduce((s, c) => s + c.spent, 0) / 1000).toFixed(1)}K</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cumulative bookings</div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="rounded-3 p-3 mb-4 d-flex flex-wrap gap-2 align-items-center justify-content-between" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
          <Search size={15} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control form-control-sm border-0 shadow-none"
            placeholder="Search customers by name, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: '0.82rem' }}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
          {['all', 'active', 'suspended'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="btn btn-sm px-2 py-1 rounded-pill fw-bold"
              style={{
                fontSize: '0.7rem',
                background: statusFilter === s ? '#0D1B2E' : '#f1f5f9',
                color: statusFilter === s ? '#fff' : '#64748b',
                textTransform: 'capitalize',
                border: 'none'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List */}
      <div className="rounded-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Customer</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Contact</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>City</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Bookings</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Total Spent</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }} onClick={() => setSelected(c)}>
                  <td className="px-3 py-3">
                    <div className="fw-bold" style={{ color: '#0D1B2E' }}>{c.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Member since {c.joined}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{c.email || '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.phone}</div>
                  </td>
                  <td className="px-3 py-3">{c.city}</td>
                  <td className="px-3 py-3 fw-bold">{c.bookings}</td>
                  <td className="px-3 py-3 fw-bold" style={{ color: '#16a34a' }}>₹{c.spent.toLocaleString()}</td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-light p-1 rounded-2" onClick={() => setSelected(c)} title="View Profile">
                      <Eye size={14} style={{ color: '#64748b' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-5 text-muted" style={{ fontSize: '0.82rem' }}>No customers found matching search</div>}
        </div>
      </div>

      {/* Customer Details Drawer */}
      {selected && (
        <div className="position-fixed top-0 end-0 bottom-0 shadow-lg d-flex flex-column" style={{ width: '420px', maxWidth: '90vw', background: '#fff', zIndex: 1050, borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
          <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E', color: '#fff' }}>
            <div>
              <h6 className="mb-0 fw-bold">{selected.name}</h6>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>{selected.email || selected.phone}</div>
            </div>
            <button className="btn p-1 border-0 text-white-50" onClick={() => setSelected(null)}><X size={18} /></button>
          </div>

          <div className="d-flex border-bottom flex-shrink-0">
            {['overview', 'bookings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="btn btn-sm flex-fill py-2 fw-bold text-capitalize rounded-0"
                style={{
                  fontSize: '0.78rem',
                  borderBottom: activeTab === tab ? '2px solid #FF6333' : 'none',
                  color: activeTab === tab ? '#FF6333' : '#64748b',
                  background: activeTab === tab ? '#fff' : '#f8fafc'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-grow-1 overflow-auto p-4">
            {activeTab === 'overview' ? (
              <div>
                <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Account Status</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Phone</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.phone}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Email</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.email || '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>City</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.city}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Joined Date</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.joined}</span>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>TOTAL SPENT</div>
                      <div className="fw-bold mt-1" style={{ fontSize: '1.1rem', color: '#16a34a' }}>₹{selected.spent.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>TOTAL BOOKINGS</div>
                      <div className="fw-bold mt-1" style={{ fontSize: '1.1rem', color: '#2563eb' }}>{selected.bookings}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h6 className="fw-bold mb-3" style={{ fontSize: '0.85rem' }}>Booking History ({customerBookings.length})</h6>
                {customerBookings.map((b, i) => (
                  <div key={i} className="p-3 rounded-3 mb-2" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>#{b.id} — {b.item_name || 'Booking'}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="d-flex justify-content-between" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      <span>{b.pickup_date || b.created_at || '—'}</span>
                      <span className="fw-bold text-success">₹{(b.total_amount || b.total_paid || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {customerBookings.length === 0 && <div className="text-center py-4 text-muted" style={{ fontSize: '0.8rem' }}>No bookings for this customer</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEAM & USER MANAGEMENT MODAL (Add Users / Sub-Admins) */}
      {showUsersModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
          <div className="rounded-4 shadow-lg overflow-hidden animate__animated animate__fadeInUp" style={{ width: '100%', maxWidth: '780px', background: '#fff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
              <div className="d-flex align-items-center gap-2">
                <Shield size={18} style={{ color: '#FF6333' }} />
                <h6 className="mb-0 fw-bold">User & Team Management</h6>
              </div>
              <button className="btn p-0 text-white-50 border-0" onClick={() => setShowUsersModal(false)}><X size={18} /></button>
            </div>

            {/* Sub-tabs: List vs Add */}
            <div className="d-flex border-bottom px-4 pt-2 bg-light gap-2">
              <button 
                onClick={() => setUsersSubTab('list')}
                className={`btn btn-sm px-3 py-2 fw-bold rounded-top-3 border-0 ${usersSubTab === 'list' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
                style={{ fontSize: '0.82rem' }}
              >
                <Users size={14} className="me-1.5 inline" /> Team Members & Sub-Admins ({allUsers.length})
              </button>
              <button 
                onClick={() => setUsersSubTab('add')}
                className={`btn btn-sm px-3 py-2 fw-bold rounded-top-3 border-0 ${usersSubTab === 'add' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
                style={{ fontSize: '0.82rem' }}
              >
                <UserPlus size={14} className="me-1.5 inline text-success" /> + Create User / Sub-Admin
              </button>
            </div>

            {/* Notification alert */}
            {userModalMessage && (
              <div className={`px-4 py-2 text-white fw-semibold d-flex align-items-center justify-content-between ${userModalMessage.type === 'success' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.8rem' }}>
                <span>{userModalMessage.text}</span>
                <button className="btn btn-sm p-0 text-white border-0" onClick={() => setUserModalMessage(null)}><X size={14} /></button>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-grow-1 overflow-auto p-4">
              {usersSubTab === 'list' ? (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      All registered team members, sub-admins, agents, and platform users eligible for lead handling.
                    </span>
                    <button onClick={loadLiveUsers} disabled={loadingUsers} className="btn btn-sm btn-light border d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                      <RefreshCw size={12} className={loadingUsers ? 'animate-spin' : ''} /> Refresh
                    </button>
                  </div>

                  <div className="table-responsive rounded-3 border">
                    <table className="table align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>User / Name</th>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Contact</th>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Role</th>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Live Presence</th>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                          <th className="px-3 py-2.5 fw-bold text-muted text-end" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(u => (
                          <tr key={u.id || u.username} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td className="px-3 py-2.5">
                              <div className="fw-bold" style={{ color: '#0D1B2E' }}>{u.name || u.username}</div>
                              <div className="font-monospace text-muted" style={{ fontSize: '0.7rem' }}>@{u.username}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div>{u.email}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{u.phone || '—'}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <RoleBadge role={u.role} />
                            </td>
                            <td className="px-3 py-2.5">
                              {Number(u.is_online) === 1 ? (
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-1 font-monospace fw-bold" style={{ fontSize: '0.68rem' }}>
                                  🟢 ONLINE
                                </span>
                              ) : (
                                <span className="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 font-monospace fw-normal" style={{ fontSize: '0.68rem' }}>
                                  ⚪ OFFLINE
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <StatusBadge status={u.status || 'active'} />
                            </td>
                            <td className="px-3 py-2.5 text-end">
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`btn btn-sm px-2.5 py-1 rounded-pill fw-bold border ${u.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                style={{ fontSize: '0.72rem' }}
                                title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                              >
                                {u.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Create User Form */
                <form onSubmit={handleCreateUser}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        className="form-control form-control-sm"
                        placeholder="e.g. Rahul Deshmukh"
                        value={newUser.name}
                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Username</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. rahul_subadmin (auto-generated if empty)"
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Email Address *</label>
                      <input
                        type="email"
                        required
                        className="form-control form-control-sm"
                        placeholder="rahul@tripgalileo.com"
                        value={newUser.email}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Phone Number</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="+91 98765 43210"
                        value={newUser.phone}
                        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>User Role *</label>
                      <select
                        className="form-select form-select-sm fw-bold"
                        value={newUser.role}
                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <option value="subadmin">Sub-Admin (Lead Dispatch & Operations)</option>
                        <option value="agent">Agent (Lead Assigned Representative)</option>
                        <option value="admin">Administrator (Full Access)</option>
                        <option value="customer">Customer Guest</option>
                        <option value="vendor">Vendor Partner</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Password</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Default: Pass@123"
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-light px-3 py-2 fw-bold" style={{ fontSize: '0.82rem' }} onClick={() => setUsersSubTab('list')}>
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={creatingUser}
                      className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2" 
                      style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem', border: 'none' }}
                    >
                      <CheckCircle size={15} /> {creatingUser ? 'Creating...' : 'Create User Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
