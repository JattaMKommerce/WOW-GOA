import React, { useState } from 'react';
import {
  Compass, LogOut, LayoutDashboard, Plane, PlusCircle, Calendar,
  BookOpen, BarChart2, Settings, UserCircle, Activity,
  Wallet, Tag, DollarSign, ChevronDown, ChevronRight, Menu,
  Trash2, Edit2, AlertCircle, CheckCircle, X, Users
} from 'lucide-react';
import VendorWallet from '../../components/vendor/VendorWallet';

const SIDEBAR_GROUPS = [
  { label: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> }] },
  { label: 'Fleet Management', items: [
    { id: 'flights', label: 'My Routes', icon: <Plane size={15} /> },
    { id: 'add_flight', label: 'Add Route', icon: <PlusCircle size={15} /> },
    { id: 'pricing', label: 'Pricing & Fares', icon: <Tag size={15} /> },
  ]},
  { label: 'Bookings', items: [
    { id: 'all_bookings', label: 'All Bookings', icon: <BookOpen size={15} /> },
    { id: 'passengers', label: 'Passenger Directory', icon: <Users size={15} /> },
  ]},
  { label: 'Finance', items: [
    { id: 'wallet', label: 'Platform Wallet', icon: <Wallet size={15} /> },
    { id: 'earnings', label: 'Earnings & Reports', icon: <BarChart2 size={15} /> },
  ]},
  { label: 'Account', items: [
    { id: 'profile', label: 'Vendor Profile', icon: <UserCircle size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
    { id: 'activity_log', label: 'Activity Log', icon: <Activity size={15} /> },
  ]}
];

const PAGE_TITLES = {
  dashboard:'Flight Dashboard', flights:'My Routes', add_flight:'Add New Route',
  pricing:'Pricing & Fares', all_bookings:'All Bookings', passengers:'Passenger Directory',
  wallet:'Platform Wallet', earnings:'Earnings & Reports', profile:'Vendor Profile',
  settings:'Settings', activity_log:'Activity Log',
};

function SidebarGroup({ group, activeTab, onSelect, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== undefined ? defaultOpen : group.items.some(i => i.id === activeTab));
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)} className="btn w-100 d-flex align-items-center justify-content-between px-3 py-1 border-0" style={{ background:'transparent',fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'rgba(255,255,255,0.3)' }}>
        <span>{group.label}</span>
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
      {open && (
        <div className="d-flex flex-column gap-0 px-1">
          {group.items.map(item => (
            <button key={item.id} onClick={() => onSelect(item.id)} className="btn w-100 text-start d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3 mb-1"
              style={{ fontSize:'0.83rem', background:activeTab===item.id?'linear-gradient(90deg,#00B8D9,#0090b8)':'transparent', color:activeTab===item.id?'#fff':'rgba(255,255,255,0.65)', boxShadow:activeTab===item.id?'0 4px 12px rgba(0,184,217,0.3)':'none', fontWeight:activeTab===item.id?700:400 }}>
              <span style={{ color:activeTab===item.id?'#fff':'#00B8D9', flexShrink:0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="rounded-3 p-3 h-100" style={{ background:'#fff',border:'1px solid rgba(0,0,0,0.07)',boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="rounded-2 p-2 d-flex align-items-center justify-content-center mb-2" style={{ background:`${color}18`,color,width:'38px',height:'38px' }}>{icon}</div>
      <div className="fw-bold" style={{ fontSize:'1.3rem',color:'#0D1B2E' }}>{value}</div>
      <div style={{ fontSize:'0.72rem',color:'#64748b',fontWeight:600 }}>{label}</div>
    </div>
  );
}

function FlightDashboard({ flights, bookings, onNavigate }) {
  const myBookings = bookings.filter(b => flights.some(f => f.id === b.item_id));
  const revenue = myBookings.reduce((s, b) => s + parseFloat(b.total_paid || 0), 0);
  return (
    <div className="p-4">
      <div className="rounded-4 p-4 mb-4" style={{ background:'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'56px',height:'56px',background:'rgba(0,184,217,0.15)' }}><Plane size={28} style={{ color:'#00B8D9' }} /></div>
          <div><h4 className="fw-bold text-white mb-1">Flight Operations Dashboard</h4><p className="mb-0" style={{ color:'rgba(255,255,255,0.5)',fontSize:'0.85rem' }}>Monitor your routes, bookings and revenue.</p></div>
        </div>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><StatCard label="Active Routes" value={flights.length} color="#00B8D9" icon={<Plane size={18} />} /></div>
        <div className="col-6 col-md-3"><StatCard label="Total Bookings" value={myBookings.length} color="#059669" icon={<BookOpen size={18} />} /></div>
        <div className="col-6 col-md-3"><StatCard label="Revenue" value={`₹${revenue.toLocaleString()}`} color="#d97706" icon={<DollarSign size={18} />} /></div>
        <div className="col-6 col-md-3"><StatCard label="Passengers" value={myBookings.length} color="#7c3aed" icon={<Users size={18} />} /></div>
      </div>
      <div className="row g-3">
        <div className="col-md-5">
          <div className="rounded-3 p-3" style={{ background:'#fff',border:'1px solid rgba(0,0,0,0.07)' }}>
            <h6 className="fw-bold mb-3" style={{ fontSize:'13px',color:'#0D1B2E' }}>Quick Actions</h6>
            <div className="d-flex flex-column gap-2">
              <button className="btn d-flex align-items-center gap-2 fw-bold text-white" style={{ background:'linear-gradient(90deg,#00B8D9,#0090b8)',fontSize:'0.85rem',borderRadius:'8px' }} onClick={() => onNavigate('add_flight')}><PlusCircle size={16} /> Add Flight Route</button>
              <button className="btn d-flex align-items-center gap-2 fw-bold" style={{ background:'#f0f9ff',color:'#0369a1',fontSize:'0.85rem',borderRadius:'8px' }} onClick={() => onNavigate('all_bookings')}><BookOpen size={16} /> View All Bookings</button>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="rounded-3 p-3" style={{ background:'#fff',border:'1px solid rgba(0,0,0,0.07)' }}>
            <h6 className="fw-bold mb-3" style={{ fontSize:'13px',color:'#0D1B2E' }}>Recent Bookings</h6>
            {myBookings.length === 0 ? (<p className="text-muted text-center py-3 mb-0" style={{ fontSize:'0.82rem' }}>No bookings yet.</p>) :
              myBookings.slice(0, 4).map((b, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center py-2 border-bottom" style={{ fontSize:'0.82rem',borderColor:'rgba(0,0,0,0.05)' }}>
                  <div><div className="fw-bold" style={{ color:'#0D1B2E' }}>{b.name}</div><div style={{ color:'#94a3b8',fontSize:'0.72rem' }}>{b.item_name}</div></div>
                  <span className="fw-bold" style={{ color:'#16a34a' }}>₹{b.total_paid}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function MyRoutes({ flights, onDelete, onEditClick }) {
  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color:'#0D1B2E' }}>My Flight Routes <span className="badge ms-2" style={{ background:'#dbeafe',color:'#2563eb',fontSize:'0.75rem' }}>{flights.length}</span></h5>
      <div className="rounded-3 overflow-hidden" style={{ border:'1px solid rgba(0,0,0,0.07)',background:'#fff' }}>
        {flights.length === 0 ? (
          <div className="text-center py-5 text-muted"><Plane size={40} className="mb-3 opacity-25" /><p>No routes listed. Add your first route!</p></div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ fontSize:'0.83rem' }}>
              <thead style={{ background:'#f8fafc' }}>
                <tr>{['Airline','Flight No.','Route','Schedule','Base Fare','Actions'].map(h=><th key={h} className="py-3 px-3 fw-bold" style={{ fontSize:'0.72rem',textTransform:'uppercase',color:'#475569',borderBottom:'1px solid rgba(0,0,0,0.07)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {flights.map(f => (
                  <tr key={f.id} className="border-bottom" style={{ borderColor:'rgba(0,0,0,0.05)' }}>
                    <td className="px-3 py-2 fw-bold" style={{ color:'#0D1B2E' }}>{f.airline}</td>
                    <td className="px-3 py-2"><span className="badge" style={{ background:'#dbeafe',color:'#2563eb',fontSize:'0.75rem' }}>{f.flight_number}</span></td>
                    <td className="px-3 py-2"><span className="fw-bold" style={{ color:'#00B8D9' }}>{f.from_loc}</span><span className="mx-2 text-muted">→</span><span className="fw-bold" style={{ color:'#00B8D9' }}>{f.to_loc}</span></td>
                    <td className="px-3 py-2"><div style={{ fontSize:'0.75rem',color:'#64748b' }}>Dep: {f.departure_time}</div><div style={{ fontSize:'0.75rem',color:'#64748b' }}>Arr: {f.arrival_time}</div>{f.duration&&<div style={{ fontSize:'0.72rem',color:'#94a3b8' }}>Dur: {f.duration}</div>}</td>
                    <td className="px-3 py-2 fw-bold" style={{ color:'#059669' }}>₹{f.price}</td>
                    <td className="px-3 py-2">
                      <button className="btn btn-sm me-1 d-inline-flex align-items-center gap-1" style={{ background:'#dbeafe',color:'#2563eb',fontSize:'0.75rem',borderRadius:'6px' }} onClick={() => onEditClick(f)}><Edit2 size={12} /> Edit</button>
                      <button className="btn btn-sm d-inline-flex align-items-center gap-1" style={{ background:'#fee2e2',color:'#dc2626',fontSize:'0.75rem',borderRadius:'6px' }} onClick={() => { if(window.confirm('Delete this route?')) onDelete(f.id); }}><Trash2 size={12} /> Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AddRouteForm({ onAdd, onUpdate, editingFlight, onCancelEdit, onNavigate, currentUser }) {
  const blank = { airline:'',flight_number:'',from_loc:'GOI',to_loc:'DEL',departure_time:'',arrival_time:'',price:'',duration:'',seats:180 };
  const [form, setForm] = useState(editingFlight ? { airline:editingFlight.airline,flight_number:editingFlight.flight_number,from_loc:editingFlight.from_loc,to_loc:editingFlight.to_loc,departure_time:editingFlight.departure_time,arrival_time:editingFlight.arrival_time,price:editingFlight.price,duration:editingFlight.duration,seats:editingFlight.seats||180 } : blank);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (editingFlight) setForm({ airline:editingFlight.airline,flight_number:editingFlight.flight_number,from_loc:editingFlight.from_loc,to_loc:editingFlight.to_loc,departure_time:editingFlight.departure_time,arrival_time:editingFlight.arrival_time,price:editingFlight.price,duration:editingFlight.duration,seats:editingFlight.seats||180 });
    else setForm(blank);
  }, [editingFlight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.airline || !form.flight_number || !form.price) { setError('Please fill all required fields.'); return; }
    setSubmitting(true); setError('');
    try {
      const payload = { ...form, vendor_id: currentUser?.id || 'admin' };
      if (editingFlight) { await onUpdate(editingFlight.id, payload); } else { await onAdd(payload); }
      onNavigate('flights');
    } catch (err) { setError(err.message || 'Failed to save route.'); }
    setSubmitting(false);
  };

  const fields = [
    { label:'Airline Name *',key:'airline',type:'text',placeholder:'e.g. IndiGo',col:6 },
    { label:'Flight Number *',key:'flight_number',type:'text',placeholder:'e.g. 6E-204',col:6 },
    { label:'From (Airport Code)',key:'from_loc',type:'text',placeholder:'e.g. GOI',col:3 },
    { label:'To (Airport Code)',key:'to_loc',type:'text',placeholder:'e.g. DEL',col:3 },
    { label:'Departure Time',key:'departure_time',type:'time',col:3 },
    { label:'Arrival Time',key:'arrival_time',type:'time',col:3 },
    { label:'Base Fare (₹) *',key:'price',type:'number',placeholder:'e.g. 4500',col:4 },
    { label:'Duration',key:'duration',type:'text',placeholder:'e.g. 2h 15m',col:4 },
    { label:'Total Seats',key:'seats',type:'number',placeholder:'180',col:4 },
  ];

  return (
    <div className="p-4">
      <div className="rounded-4 p-4 mb-4" style={{ background:'linear-gradient(135deg,#e0f7fa 0%,#b2ebf2 100%)',border:'1px solid rgba(0,184,217,0.2)' }}>
        <div className="d-flex align-items-center gap-3">
          <span className="rounded-circle d-flex align-items-center justify-content-center" style={{ width:'48px',height:'48px',background:'#fff',color:'#00B8D9' }}><Plane size={24} /></span>
          <div><h5 className="fw-bold mb-0" style={{ color:'#0D1B2E' }}>{editingFlight?'Edit Flight Route':'Add New Flight Route'}</h5><p className="mb-0 text-muted" style={{ fontSize:'0.82rem' }}>Fill in the route details to list a flight.</p></div>
        </div>
      </div>
      <div className="rounded-3 p-4" style={{ background:'#fff',border:'1px solid rgba(0,0,0,0.07)' }}>
        {error && <div className="alert alert-danger d-flex align-items-center gap-2 py-2" style={{ fontSize:'0.85rem' }}><AlertCircle size={16} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {fields.map(f => (
              <div key={f.key} className={`col-md-${f.col}`}>
                <label className="form-label fw-bold" style={{ fontSize:'0.75rem',color:'#475569' }}>{f.label}</label>
                <input type={f.type} className="form-control" placeholder={f.placeholder} value={form[f.key]||''} onChange={e=>setForm(frm=>({...frm,[f.key]:e.target.value}))} />
              </div>
            ))}
          </div>
          <div className="d-flex gap-2 mt-4">
            <button type="submit" disabled={submitting} className="btn fw-bold text-white px-4" style={{ background:'linear-gradient(90deg,#00B8D9,#0090b8)',borderRadius:'8px' }}><CheckCircle size={16} className="me-1" />{submitting?'Saving...':editingFlight?'Update Route':'Add Route'}</button>
            {editingFlight && (<button type="button" className="btn fw-bold px-4" style={{ background:'#f1f5f9',color:'#64748b',borderRadius:'8px' }} onClick={onCancelEdit}><X size={16} className="me-1" />Cancel</button>)}
          </div>
        </form>
      </div>
    </div>
  );
}

function FlightBookings({ bookings, flights }) {
  const myBookings = bookings.filter(b => flights.some(f => f.id === b.item_id));
  return (
    <div className="p-4">
      <h5 className="fw-bold mb-3" style={{ color:'#0D1B2E' }}>All Flight Bookings</h5>
      <div className="rounded-3 overflow-hidden" style={{ border:'1px solid rgba(0,0,0,0.07)',background:'#fff' }}>
        {myBookings.length === 0 ? (<div className="text-center py-5 text-muted"><BookOpen size={40} className="mb-3 opacity-25" /><p>No bookings yet.</p></div>) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ fontSize:'0.83rem' }}>
              <thead style={{ background:'#f8fafc' }}>
                <tr>{['Booking ID','Passenger','Contact','Route','Amount','Status'].map(h=><th key={h} className="py-3 px-3 fw-bold" style={{ fontSize:'0.72rem',textTransform:'uppercase',color:'#475569',borderBottom:'1px solid rgba(0,0,0,0.07)' }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {myBookings.map((b,i)=>(
                  <tr key={i} className="border-bottom" style={{ borderColor:'rgba(0,0,0,0.05)' }}>
                    <td className="px-3 py-2 fw-bold">#{b.id}</td>
                    <td className="px-3 py-2"><div className="fw-bold">{b.name}</div></td>
                    <td className="px-3 py-2" style={{ color:'#64748b',fontSize:'0.78rem' }}>{b.phone}</td>
                    <td className="px-3 py-2 fw-bold" style={{ color:'#00B8D9' }}>{b.item_name}</td>
                    <td className="px-3 py-2 fw-bold" style={{ color:'#16a34a' }}>₹{b.total_paid}</td>
                    <td className="px-3 py-2"><span className="px-2 py-1 rounded-pill fw-bold" style={{ background:b.status==='Confirmed'?'#dcfce7':'#fef9c3',color:b.status==='Confirmed'?'#16a34a':'#ca8a04',fontSize:'0.7rem' }}>{b.status||'Pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ComingSoon({ title }) {
  return (<div className="p-4"><div className="rounded-3 p-5 text-center" style={{ background:'#fff',border:'1px solid rgba(0,0,0,0.07)' }}><Settings size={40} style={{ color:'#94a3b8' }} className="mb-3" /><h6 className="fw-bold mb-2" style={{ color:'#0D1B2E' }}>{title}</h6><p style={{ color:'#64748b',fontSize:'0.85rem' }}>This section is coming soon.</p></div></div>);
}

export default function FlightVendorPortalPage({ currentUser, triggerOpenLogin, flights=[], onAddFlight, onUpdateFlight, onDeleteFlight, onLogout, bookings=[] }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingFlight, setEditingFlight] = useState(null);

  if (!currentUser || currentUser.role !== 'flight_vendor') {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight:'100vh',background:'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
        <div className="text-center p-5">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width:'90px',height:'90px',background:'rgba(0,184,217,0.15)',border:'2px solid rgba(0,184,217,0.3)' }}><Plane size={42} style={{ color:'#00B8D9' }} /></div>
          <h3 className="fw-bold text-white mb-2">Flight Vendor Console</h3>
          <p className="mb-4" style={{ color:'rgba(255,255,255,0.5)' }}>Sign in with your flight vendor account to continue</p>
          <button type="button" className="btn px-5 py-2 fw-bold text-white rounded-pill" style={{ background:'linear-gradient(90deg,#00B8D9,#0090b8)' }} onClick={triggerOpenLogin}>Sign In to Flight Console</button>
        </div>
      </div>
    );
  }

  const myFlights = flights.filter(f => f.vendor_id === currentUser.id || f.vendor_id === String(currentUser.id));
  const handleEditClick = (flight) => { setEditingFlight(flight); setActiveTab('add_flight'); };
  const handleCancelEdit = () => { setEditingFlight(null); setActiveTab('flights'); };
  const handleSelect = (id) => { if (id !== 'add_flight') setEditingFlight(null); setActiveTab(id); };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <FlightDashboard flights={myFlights} bookings={bookings} onNavigate={setActiveTab} />;
      case 'flights': return <MyRoutes flights={myFlights} onDelete={onDeleteFlight} onEditClick={handleEditClick} />;
      case 'add_flight': return <AddRouteForm onAdd={onAddFlight} onUpdate={onUpdateFlight} editingFlight={editingFlight} onCancelEdit={handleCancelEdit} onNavigate={setActiveTab} currentUser={currentUser} />;
      case 'all_bookings': return <FlightBookings bookings={bookings} flights={myFlights} />;
      case 'wallet': return <VendorWallet currentUser={currentUser} />;
      default: return <ComingSoon title={PAGE_TITLES[activeTab] || activeTab} />;
    }
  };

  return (
    <div className="d-flex w-100" style={{ height:'100vh',background:'#f0f2f5',overflow:'hidden' }}>
      <div className="d-flex flex-column flex-shrink-0" style={{ width:sidebarOpen?'256px':'0px',minWidth:sidebarOpen?'256px':'0px',height:'100vh',overflowY:'auto',overflowX:'hidden',backgroundColor:'#0D1B2E',borderRight:'1px solid rgba(255,255,255,0.06)',transition:'all 0.3s ease' }}>
        <div className="px-3 py-3 d-flex align-items-center gap-2 flex-shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Compass size={22} style={{ color:'#00B8D9' }} />
          <div><div className="fw-extrabold text-white" style={{ fontSize:'15px' }}>TRIPGALILEO</div><div className="fw-bold text-uppercase" style={{ fontSize:'0.55rem',letterSpacing:'2px',color:'#00B8D9' }}>Flight Operator PMS</div></div>
        </div>
        <div className="flex-grow-1 py-2">{SIDEBAR_GROUPS.map((group,idx)=><SidebarGroup key={group.label} group={group} activeTab={activeTab} onSelect={handleSelect} defaultOpen={idx<2} />)}</div>
        <div className="p-3 flex-shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onLogout} className="btn w-100 d-flex align-items-center gap-2 py-2 px-3 border-0 rounded-3" style={{ background:'rgba(0,184,217,0.1)',color:'#00B8D9',fontSize:'0.85rem',fontWeight:600 }}><LogOut size={15} /> Sign Out</button>
        </div>
      </div>
      <div className="flex-grow-1 d-flex flex-column" style={{ height:'100vh',overflow:'hidden' }}>
        <header className="d-flex align-items-center justify-content-between px-4 flex-shrink-0" style={{ height:'56px',backgroundColor:'#0D1B2E',borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex align-items-center gap-3">
            <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="btn btn-sm p-1 border-0 text-white-50" style={{ background:'transparent' }}><Menu size={20} /></button>
            <div><div className="fw-bold text-white" style={{ fontSize:'14px' }}>{PAGE_TITLES[activeTab]||'Flight PMS'}</div><div className="text-white-50" style={{ fontSize:'0.68rem' }}>TripGalileo Flight Console</div></div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill" style={{ background:'rgba(0,184,217,0.1)',color:'#00B8D9',fontSize:'0.7rem',fontWeight:700 }}><span className="rounded-circle" style={{ width:'6px',height:'6px',background:'#00e676',display:'inline-block' }}></span> Online</span>
            <div className="position-relative">
              <button className="btn p-0 rounded-circle d-flex align-items-center justify-content-center" style={{ width:'36px',height:'36px',border:'2px solid #00B8D9',background:'linear-gradient(135deg,#00B8D9,#0090b8)' }} onClick={()=>setShowProfileDropdown(!showProfileDropdown)}>
                <span className="fw-bold text-white" style={{ fontSize:'14px' }}>{currentUser.username?.[0]?.toUpperCase()}</span>
              </button>
              {showProfileDropdown && (
                <div className="position-absolute shadow-lg" style={{ right:0,top:'48px',minWidth:'180px',background:'#10243A',borderRadius:'12px',border:'1px solid rgba(255,255,255,0.08)',zIndex:1050 }}>
                  <div className="text-center px-3 py-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                    <div className="fw-bold text-white" style={{ fontSize:'13px' }}>{currentUser.username}</div>
                    <span className="badge mt-1" style={{ background:'rgba(0,184,217,0.15)',color:'#00B8D9',fontSize:'0.6rem' }}>FLIGHT VENDOR</span>
                  </div>
                  <div className="p-2"><button className="btn w-100 d-flex align-items-center gap-2 py-2 px-2 rounded fw-bold" style={{ color:'#00B8D9',background:'rgba(0,184,217,0.1)',fontSize:'0.82rem' }} onClick={onLogout}><LogOut size={13} /> Sign Out</button></div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="flex-grow-1 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}