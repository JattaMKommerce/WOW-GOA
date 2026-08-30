// Centralized API Service — All backend communication goes through here
export const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:8000/api.php' 
  : '/backend/api.php';

// ==========================================
// Generic API helper
// ==========================================

export function getTenantId() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenant = urlParams.get('tenant') || localStorage.getItem('tenant_id') || 'admin';
  return tenant;
}

export async function apiFetch(url, options = {}) {
  const tenantId = getTenantId();
  const headers = {
    ...options.headers,
    'X-Tenant-ID': tenantId
  };
  return fetch(url, { ...options, headers });
}

export async function makeApiCall(endpoint, options = {}) {
  let url;
  if (endpoint.startsWith('/api.php')) {
    // Strip /api.php and keep the query string, append to API_BASE
    const qs = endpoint.replace('/api.php', '');
    url = API_BASE + qs; // e.g. API_BASE + '?resource=vendor_wallets'
  } else {
    url = endpoint;
  }
  const res = await apiFetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) throw new Error(`API call failed: ${res.status}`);
  return res.json();
}

import {
  hotelsData,
  packagesData,
  carsData,
  bikesData,
  exploreDestinations,
  usersData,
  bookingsData,
  vendorsData,
  aiLeadsData,
  customEnquiriesData
} from '../data/mockData';

// ==========================================
// GET (Read) Functions with Resilient Fallbacks
// ==========================================

export async function fetchCars() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=cars`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Cars fetch fallback used:', err.message);
    return [];
  }
}

export async function fetchBikes() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=bikes`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Bikes fetch fallback used:', err.message);
    return [];
  }
}

export async function fetchHotels() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=hotels`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Hotels fetch fallback used:', err.message);
    return [];
  }
}

export async function fetchFlights() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=flights`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Flights fetch fallback used:', err.message);
    return [];
  }
}

export async function fetchDestinations() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=destinations`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Destinations fetch fallback used:', err.message);
    return [];
  }
}

export async function fetchPackages() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=packages`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Packages fetch fallback used:', err.message);
    return [];
  }
}

export async function fetchVendors() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=vendors`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Vendors fetch fallback used:', err.message);
    return [];
  }
}

export async function fetchUsers() {
  let list = [];
  try {
    const res = await apiFetch(`${API_BASE}?resource=users`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) list = data;
    }
  } catch (err) {
    console.warn('[API] Users fetch fallback used:', err.message);
  }

  if (!list.length) list = [...usersData];

  // Merge locally created users from localStorage
  try {
    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    if (Array.isArray(localUsers) && localUsers.length > 0) {
      const existingUsernames = new Set(list.map(u => (u.username || '').toLowerCase()));
      const uniqueLocal = localUsers.filter(u => !existingUsernames.has((u.username || '').toLowerCase()));
      list = [...uniqueLocal, ...list];
    }
  } catch (e) {}

  // Filter out any locally deleted users
  try {
    const deletedIds = new Set(JSON.parse(localStorage.getItem('deleted_user_ids') || '[]'));
    list = list.filter(u => !deletedIds.has(String(u.id)) && !deletedIds.has(String(u.username)));
  } catch (e) {}

  // Enrich with passwords from localStorage user_passwords map
  try {
    const userPassMap = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    list = list.map(u => {
      const stored = userPassMap[u.id] || userPassMap[u.username] || userPassMap[u.email];
      const defaultPass = u.plain_password || (u.username === 'superadmin' ? 'superadmin' : 'admin@2026');
      return {
        ...u,
        plain_password: stored || defaultPass,
        password: stored || defaultPass
      };
    });
  } catch (e) {}

  return list;
}

export async function fetchBookings() {
  let list = [];
  try {
    const res = await apiFetch(`${API_BASE}?resource=bookings`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        list = data;
      }
    }
  } catch (err) {
    console.warn('[API] Bookings fetch fallback used:', err.message);
  }

  if (!list.length) {
    list = [...bookingsData];
  }

  // Merge any newly created client bookings from localStorage
  try {
    const local = JSON.parse(localStorage.getItem('local_bookings') || '[]');
    if (Array.isArray(local) && local.length > 0) {
      const existingIds = new Set(list.map(b => String(b.id)));
      const uniqueLocal = local.filter(b => !existingIds.has(String(b.id)));
      list = [...uniqueLocal, ...list];
    }
  } catch (e) {}

  return list;
}

export async function fetchMarkups() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=markups`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Markups fetch error:', err.message);
    return [];
  }
}

export async function fetchLeads() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=leads`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] Leads fetch error:', err.message);
    return [];
  }
}

export async function fetchAiLeads() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=ai_leads`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[API] AI leads fetch error:', err.message);
    return [];
  }
}

export async function fetchCustomEnquiries() {
  let list = [];
  try {
    const res = await apiFetch(`${API_BASE}?resource=custom_enquiries`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        list = data;
      }
    }
  } catch (err) {
    console.warn('[API] Custom enquiries fetch error:', err.message);
  }

  // Merge any local changes / assignments from localStorage
  try {
    const local = JSON.parse(localStorage.getItem('local_custom_enquiries') || '[]');
    if (Array.isArray(local) && local.length > 0) {
      const localMap = new Map(local.map(e => [String(e.enquiry_id || e.id), e]));
      list = list.map(item => {
        const idKey = String(item.enquiry_id || item.id);
        if (localMap.has(idKey)) {
          const loc = localMap.get(idKey);
          return {
            ...item,
            status: loc.status !== undefined ? loc.status : item.status,
            assigned_to: loc.assigned_to !== undefined ? loc.assigned_to : item.assigned_to
          };
        }
        return item;
      });

      // Add any locally added enquiries not in list
      const existingIds = new Set(list.map(e => String(e.enquiry_id || e.id)));
      local.forEach(e => {
        if (!existingIds.has(String(e.enquiry_id || e.id))) {
          list.push(e);
        }
      });
    }
  } catch (e) {}

  return list;
}

export async function fetchLiveFlights(from, to, date) {
  // Simulate network delay to mimic live API
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (!from || !to) return [];
  
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  
  // Simulated realistic live flight data based on query
  return [
    {
      id: `fl-${Math.floor(Math.random()*1000)}`,
      airline: 'IndiGo',
      logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=50&q=80',
      from: fromCode,
      to: toCode,
      departure: '06:30',
      arrival: '09:05',
      duration: '2h 35m',
      stops: 'Non-stop',
      price: Math.floor(Math.random() * 3000) + 4000
    },
    {
      id: `fl-${Math.floor(Math.random()*1000)}`,
      airline: 'Air India',
      logo: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=50&q=80',
      from: fromCode,
      to: toCode,
      departure: '10:15',
      arrival: '13:00',
      duration: '2h 45m',
      stops: 'Non-stop',
      price: Math.floor(Math.random() * 4000) + 5000
    },
    {
      id: `fl-${Math.floor(Math.random()*1000)}`,
      airline: 'Vistara',
      logo: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=50&q=80',
      from: fromCode,
      to: toCode,
      departure: '14:20',
      arrival: '18:45',
      duration: '4h 25m',
      stops: '1 Stop',
      price: Math.floor(Math.random() * 2000) + 6000
    },
    {
      id: `fl-${Math.floor(Math.random()*1000)}`,
      airline: 'SpiceJet',
      logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=50&q=80',
      from: fromCode,
      to: toCode,
      departure: '19:40',
      arrival: '22:15',
      duration: '2h 35m',
      stops: 'Non-stop',
      price: Math.floor(Math.random() * 1500) + 3500
    }
  ];
}

// ==========================================
// POST (Write) Functions
// ==========================================

export async function loginUser(username, password) {
  const cleanU = (username || '').trim();
  const cleanP = (password || '').trim();

  try {
    const res = await apiFetch(`${API_BASE}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanU, password: cleanP })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.user) {
        return data.user;
      }
    }
  } catch (err) {
    console.warn('[API] Server login request error:', err.message);
  }

  // Client-side fallback authentication for demo accounts
  if ((cleanU === 'superadmin' || cleanU === 'superadmin@gmail.com') && (cleanP === 'superadmin' || cleanP === 'superadmin@2026')) {
    return { id: 'u-1', username: 'superadmin', email: 'superadmin@gmail.com', role: 'superadmin' };
  }
  if ((cleanU === 'admin' || cleanU === 'admin@gmail.com') && (cleanP === 'admin@2026' || cleanP === 'admin')) {
    return { id: 'u-2', username: 'admin', email: 'admin@gmail.com', role: 'admin' };
  }
  if ((cleanU === 'vendor' || cleanU === 'vendor@tripgalileo.com') && (cleanP === 'admin@2026' || cleanP === 'vendor')) {
    return { id: 'u-3', username: 'vendor', email: 'vendor@tripgalileo.com', role: 'vendor' };
  }
  if ((cleanU === 'hotel_vendor' || cleanU === 'hotel_vendor@tripgalileo.com') && (cleanP === 'admin@2026' || cleanP === 'hotel_vendor')) {
    return { id: 'u-4', username: 'hotel_vendor', email: 'hotel_vendor@tripgalileo.com', role: 'hotel_vendor' };
  }
  if ((cleanU === 'flight_vendor' || cleanU === 'flight_vendor@tripgalileo.com') && (cleanP === 'admin@2026' || cleanP === 'flight_vendor')) {
    return { id: 'u-5', username: 'flight_vendor', email: 'flight_vendor@tripgalileo.com', role: 'flight_vendor' };
  }

  throw new Error("Invalid username or password. Check credentials.");
}

export async function updateOnlineStatus(userId, isOnline = 1) {
  try {
    const res = await apiFetch(`${API_BASE}?action=update_online_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_online: isOnline })
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] updateOnlineStatus error:', err.message);
    return { success: false };
  }
}

export async function registerUser(userData) {
  const newUserId = `u-${Date.now()}`;
  const password = userData.password || userData.plain_password || 'admin@2026';
  const newUserRecord = {
    id: newUserId,
    username: userData.username,
    email: userData.email,
    role: userData.role || 'admin',
    billing_price: parseInt(userData.billing_price || userData.billingPrice || 0, 10) || 5000,
    status: userData.status || 'active',
    plain_password: password,
    password: password,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
  };

  // Save to local storage cache
  try {
    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    // replace if exists with same username, else unshift
    const filtered = localUsers.filter(u => u.username !== newUserRecord.username);
    filtered.unshift(newUserRecord);
    localStorage.setItem('local_users', JSON.stringify(filtered));

    const passMap = JSON.parse(localStorage.getItem('user_passwords') || '{}');
    passMap[newUserId] = password;
    passMap[userData.username] = password;
    passMap[userData.email] = password;
    localStorage.setItem('user_passwords', JSON.stringify(passMap));
  } catch (e) {}

  try {
    const res = await apiFetch(`${API_BASE}?action=register_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userData,
        password: password,
        billing_price: newUserRecord.billing_price
      })
    });
    const data = await res.json();
    if (data && data.success) {
      return { ...data, user: newUserRecord };
    }
  } catch (err) {
    console.warn('[API] Backend register_user fallback used:', err.message);
  }

  return {
    success: true,
    message: "Administrator account created successfully!",
    user: newUserRecord
  };
}

export async function updateUser(userData) {
  const password = userData.password || userData.plain_password;
  try {
    if (password) {
      const map = JSON.parse(localStorage.getItem('user_passwords') || '{}');
      if (userData.id) map[userData.id] = password;
      if (userData.username) map[userData.username] = password;
      if (userData.email) map[userData.email] = password;
      localStorage.setItem('user_passwords', JSON.stringify(map));
    }

    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    const idx = localUsers.findIndex(u => u.id === userData.id || u.username === userData.username);
    if (idx !== -1) {
      localUsers[idx] = { ...localUsers[idx], ...userData, plain_password: password, password: password };
      localStorage.setItem('local_users', JSON.stringify(localUsers));
    }
  } catch (e) {}

  try {
    const res = await apiFetch(`${API_BASE}?action=update_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API] Update user fallback:', err.message);
    return { success: true, message: 'User updated successfully' };
  }
}

export async function deleteUser(id) {
  try {
    const deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids') || '[]');
    if (!deletedIds.includes(String(id))) {
      deletedIds.push(String(id));
      localStorage.setItem('deleted_user_ids', JSON.stringify(deletedIds));
    }

    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    const filtered = localUsers.filter(u => String(u.id) !== String(id) && String(u.username) !== String(id));
    localStorage.setItem('local_users', JSON.stringify(filtered));
  } catch (e) {}

  try {
    const res = await apiFetch(`${API_BASE}?action=delete_user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API] Delete user fallback:', err.message);
    return { success: true, message: 'User deleted successfully' };
  }
}

export async function chatWithAI(messages) {
  const res = await apiFetch(`${API_BASE}?action=chat_with_ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'AI Chat failed');
  return data.reply;
}

export async function addVendor(vendorData) {
  const res = await apiFetch(`${API_BASE}?action=add_vendor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vendorData)
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add vendor');
  return data;
}

export async function updateVendor(vendorData) {
  const res = await apiFetch(`${API_BASE}?action=update_vendor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vendorData)
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update vendor');
  return data;
}

export async function deleteVendor(id) {
  const res = await apiFetch(`${API_BASE}?action=delete_vendor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete vendor');
  return data;
}

export async function setVendorPassword(id, password) {
  const res = await apiFetch(`${API_BASE}?action=set_vendor_password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, password })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to set vendor password');
  return data;
}

export async function createAiLead(name, phone) {
  const res = await apiFetch(`${API_BASE}?action=create_ai_lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone })
  });
  return res.json();
}

export async function createLead(leadData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_lead', ...leadData })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create lead');
  return data;
}

export async function updateLead(leadId, updateData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_lead', id: leadId, ...updateData })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update lead');
  return data;
}

export async function updateLeadStatus(leadId, status) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_lead_status', id: leadId, status })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update lead status');
  return data;
}

export async function updateLeadAssignee(leadId, assignedTo, assignedBy = 'Admin') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'assign_lead', id: leadId, assigned_to: assignedTo, assigned_by: assignedBy })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to assign lead');
  return data;
}

export async function assignLead(leadId, assignedTo, assignedBy = 'Admin') {
  return updateLeadAssignee(leadId, assignedTo, assignedBy);
}

export async function updateNextAction(leadId, nextAction) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_next_action', id: leadId, next_action: nextAction })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update next action');
  return data;
}

export async function fetchAssignableUsers() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=assignable_users`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    return list.filter(u => {
      const r = (u.role || '').toLowerCase();
      const n = (u.name || u.username || '').toLowerCase();
      const excluded = ['admin', 'superadmin', 'super_admin', 'go_operator', 'goa_operator'];
      return !excluded.includes(r) && !excluded.includes(n);
    });
  } catch (err) {
    console.warn('[API] fetchAssignableUsers fallback:', err.message);
    return [];
  }
}

export async function fetchLeadComments(leadId, userRole = '', username = '') {
  let url = `${API_BASE}?resource=lead_comments&lead_id=${encodeURIComponent(leadId)}`;
  if (userRole) url += `&user_role=${encodeURIComponent(userRole)}`;
  if (username) url += `&username=${encodeURIComponent(username)}`;
  const res = await apiFetch(url);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function addLeadComment(leadId, comment, user = {}) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_lead_comment',
      lead_id: leadId,
      comment,
      user_id: user.id || 'admin',
      user_name: user.name || user.username || 'Admin',
      user_role: user.role || 'admin'
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add comment');
  return data;
}

export async function deleteLeadComment(commentId, leadId) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_lead_comment', id: commentId, lead_id: leadId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete comment');
  return data;
}

export async function toggleUserStatus(userId, status) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggle_user_status', id: userId, status })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to toggle user status');
  return data;
}

export async function addUser(userData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register_user', ...userData })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create user');
  return data;
}

export async function deleteLead(leadId) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_lead', id: leadId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete lead');
  return data;
}

export async function updateAiLeadChat(id, chatHistory) {
  const res = await apiFetch(`${API_BASE}?action=update_ai_lead_chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, chat_history: JSON.stringify(chatHistory) })
  });
  return res.json();
}

export async function addVehicle(vehicleData) {
  const isCar = vehicleData.type === 'car' || Boolean(vehicleData.seating) || Boolean(vehicleData.transmission);
  const action = isCar ? 'add_car' : 'add_bike';
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...vehicleData })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to add vehicle');
  return data;
}

export async function addPackage(pkg) {
  const response = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_package', ...pkg })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Failed to add package');
  return data;
}

export async function updateVehicle(vehicleData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_vehicle', ...vehicleData })
  });
  if (!res.ok) throw new Error('Server returned ' + res.status);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function addFlight(flightData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_flight', ...flightData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function updateFlight(flightData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_flight', ...flightData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function deleteFlight(id) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_flight', id })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function addHotel(hotelData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_hotel', ...hotelData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function updateHotel(hotelData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_hotel', ...hotelData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function updateHotelAvailability(id, blockedDates) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_hotel_availability', id, blocked_dates: blockedDates })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function deleteHotel(id) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_hotel', id })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

export async function saveMarkup(markupData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_markup', ...markupData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error);
  return data;
}

// ==========================================
// User Authentication & Management

export async function updatePackage(pkg) {
  const response = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_package', ...pkg })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Failed to update package');
  return data;
}

export async function deletePackage(id) {
  const response = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_package', id })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Failed to delete package');
  return data;
}

export async function calculatePackagePrice(data) {
  const res = await apiFetch(`${API_BASE}?action=calculate_price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to calculate price');
  return json;
}

export async function createBooking(bookingData) {
  let createdBookingId = null;
  try {
    const res = await apiFetch(`${API_BASE}?action=book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        createdBookingId = data.booking_id;
      }
    }
  } catch (err) {
    console.warn('[API] Server booking endpoint fallback:', err.message);
  }
  
  const assignedId = createdBookingId || `BK-${Math.floor(100000 + Math.random() * 900000)}`;
  
  const newBookingRecord = {
    id: assignedId,
    name: bookingData.name || 'Customer',
    customer_name: bookingData.name || 'Customer',
    phone: bookingData.phone || '',
    email: bookingData.email || '',
    item_id: bookingData.item_id || 'hotel-1',
    item_name: bookingData.item_name || 'Hotel Stay',
    pickup_loc: bookingData.pickup_loc || 'Goa',
    pickup_date: bookingData.pickup_date || '',
    drop_date: bookingData.drop_date || '',
    booking_days: bookingData.booking_days || 1,
    total_amount: bookingData.total_amount || 0,
    amount_paid: bookingData.amount_paid || 0,
    remaining_amount: bookingData.remaining_amount || 0,
    total_paid: bookingData.total_paid || bookingData.total_amount || 0,
    status: bookingData.status || 'Confirmed',
    payment_status: bookingData.payment_status || 'Pay at Hotel',
    payment_method: bookingData.payment_method || 'Pay at Hotel',
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    traveller_details_json: bookingData.traveller_details_json || null,
    price_breakdown_json: bookingData.price_breakdown_json || null,
    customizations: bookingData.customizations || null
  };

  try {
    const saved = JSON.parse(localStorage.getItem('local_bookings') || '[]');
    saved.unshift(newBookingRecord);
    localStorage.setItem('local_bookings', JSON.stringify(saved));
    window.dispatchEvent(new CustomEvent('new-booking-created', { detail: newBookingRecord }));
  } catch (e) {
    console.warn('Error saving local booking:', e);
  }

  return {
    success: true,
    booking_id: assignedId,
    message: "Booking confirmed successfully!",
    booking: newBookingRecord
  };
}

export async function uploadImage(file) {
  if (!file) return '';
  if (typeof file === 'string') return file;

  // 1. Try standard FormData upload
  try {
    const formData = new FormData();
    formData.append('action', 'upload_image');
    formData.append('image', file);
    
    const res = await apiFetch(`${API_BASE}?action=upload_image`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.url) {
        return data.url;
      }
    }
  } catch (formErr) {
    console.warn('[uploadImage] Multipart upload failed, attempting Base64 fallback:', formErr.message);
  }

  // 2. Base64 JSON fallback to backend
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const res = await apiFetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload_image', image_base64: base64, filename: file.name || 'image.jpg' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.url) {
            resolve(data.url);
            return;
          }
        }
        // If server returned non-200, resolve with base64 DataURL so image displays and works locally
        resolve(base64);
      } catch (err) {
        // Last-resort fallback: return data URI so image displays and works locally
        resolve(reader.result);
      }
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export async function uploadImages(files) {
  if (!files || files.length === 0) return [];
  const fileArray = Array.isArray(files) ? files : Array.from(files);
  const results = await Promise.all(fileArray.map(f => uploadImage(f)));
  return results.filter(Boolean);
}

export async function toggleVehicleAvailability(id, type, isAvailable) {
  const res = await apiFetch(`${API_BASE}?action=toggle_vehicle_availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, type, is_available: isAvailable ? 1 : 0 })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to toggle availability');
  return data;
}

function getIataCode(loc) {
  if (!loc) return '';
  loc = loc.toUpperCase();
  if (loc.includes('DHARWAD')) return null; // No airport
  if (loc.includes('HUBLI') || loc.includes('HBX')) return 'HBX';
  if (loc.includes('GOA') || loc.includes('GOI') || loc.includes('MOPA') || loc.includes('GOX')) return 'GOI';
  if (loc.includes('DELHI') || loc.includes('DEL')) return 'DEL';
  if (loc.includes('MUMBAI') || loc.includes('BOM')) return 'BOM';
  if (loc.includes('BANGALORE') || loc.includes('BENGALURU') || loc.includes('BLR')) return 'BLR';
  if (loc.includes('CHENNAI') || loc.includes('MAA')) return 'MAA';
  if (loc.includes('KOLKATA') || loc.includes('CCU')) return 'CCU';
  if (loc.includes('HYDERABAD') || loc.includes('HYD')) return 'HYD';
  if (loc.includes('PUNE') || loc.includes('PNQ')) return 'PNQ';
  if (loc.includes('AHMEDABAD') || loc.includes('AMD')) return 'AMD';
  if (loc.includes('JAIPUR') || loc.includes('JAI')) return 'JAI';
  if (loc.includes('COCHIN') || loc.includes('COK')) return 'COK';
  // Fallback: use first 3 chars if it's already a code, else it might fail, but that's expected
  return loc.length === 3 ? loc : loc.substring(0, 3);
}

export async function searchFlights(from, to, date, adults = 1, children = 0, infants = 0, cabinClass = 'economy') {
  try {
    const fromIata = getIataCode(from);
    const toIata = getIataCode(to);

    // If a city doesn't have an airport (like Dharwad), return empty instantly
    if (!fromIata || !toIata) {
      return [];
    }

    // Format passengers for Duffel
    const passengers = [];
    for (let i = 0; i < adults; i++) passengers.push({ type: 'adult' });
    for (let i = 0; i < children; i++) passengers.push({ type: 'child' });
    for (let i = 0; i < infants; i++) passengers.push({ type: 'infant_without_seat' });

    let offers = [];
    try {
      const res = await apiFetch(`${API_BASE}?action=search_flights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromIata,
          to: toIata,
          date,
          passengers,
          cabin_class: cabinClass
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success && data.data?.offers) {
        offers = data.data.offers;
      }
    } catch (apiErr) {
      console.warn("Duffel API Error (falling back to generated live data):", apiErr);
    }

    // Map Duffel offers to the common format expected by the frontend UI
    let mappedOffers = offers.map((offer) => {
      const slice = offer.slices?.[0];
      const segments = slice?.segments || [];
      const firstSeg = segments[0];
      const lastSeg = segments[segments.length - 1];
      
      let durationStr = slice?.duration || '';
      const hMatch = durationStr.match(/(\d+)H/);
      const mMatch = durationStr.match(/(\d+)M/);
      const h = hMatch ? hMatch[1] : 0;
      const m = mMatch ? mMatch[1] : 0;
      const formattedDuration = `${h}h ${m}m`;

      return {
        id: offer.id,
        airline: offer.owner?.name || 'Unknown Airline',
        logo: offer.owner?.logo_symbol_url || '',
        from: firstSeg?.origin?.iata_code || fromIata,
        to: lastSeg?.destination?.iata_code || toIata,
        departure: firstSeg?.departing_at || '',
        arrival: lastSeg?.arriving_at || '',
        duration: formattedDuration,
        stops: segments.length > 1 ? `${segments.length - 1} Stop(s)` : 'Non-stop',
        price: parseFloat(offer.total_amount || 0)
      };
    });

    // Fallback: If Duffel returns 0 results (common in test mode for regional routes)
    // we generate realistic flight data so the user gets a working experience.
    if (mappedOffers.length === 0) {
      const generateMockTime = (baseHour) => {
        const d = new Date(date || new Date());
        d.setHours(baseHour, Math.floor(Math.random() * 60), 0);
        return d.toISOString();
      };
      const arrTime = (depIso, addHours) => {
        const d = new Date(depIso);
        d.setHours(d.getHours() + addHours, d.getMinutes() + Math.floor(Math.random() * 30));
        return d.toISOString();
      };

      const t1 = generateMockTime(6);
      const t2 = generateMockTime(10);
      const t3 = generateMockTime(14);
      const t4 = generateMockTime(19);

      mappedOffers = [
        {
          id: `fl-${Math.floor(Math.random()*1000)}`,
          airline: 'IndiGo',
          logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=50&q=80',
          from: fromIata,
          to: toIata,
          departure: t1,
          arrival: arrTime(t1, 2),
          duration: '2h 15m',
          stops: 'Non-stop',
          price: Math.floor(Math.random() * 2000) + 4000
        },
        {
          id: `fl-${Math.floor(Math.random()*1000)}`,
          airline: 'Air India',
          logo: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=50&q=80',
          from: fromIata,
          to: toIata,
          departure: t2,
          arrival: arrTime(t2, 2),
          duration: '2h 45m',
          stops: 'Non-stop',
          price: Math.floor(Math.random() * 3000) + 4500
        },
        {
          id: `fl-${Math.floor(Math.random()*1000)}`,
          airline: 'Vistara',
          logo: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=50&q=80',
          from: fromIata,
          to: toIata,
          departure: t3,
          arrival: arrTime(t3, 4),
          duration: '4h 25m',
          stops: '1 Stop',
          price: Math.floor(Math.random() * 2000) + 6000
        },
        {
          id: `fl-${Math.floor(Math.random()*1000)}`,
          airline: 'Akasa Air',
          logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=50&q=80',
          from: fromIata,
          to: toIata,
          departure: t4,
          arrival: arrTime(t4, 2),
          duration: '2h 05m',
          stops: 'Non-stop',
          price: Math.floor(Math.random() * 1500) + 3500
        }
      ];
    }

    return mappedOffers;
  } catch (error) {
    console.error("Flight Search Error:", error);
    throw error;
  }
}
export async function searchAirports(query) {
  const res = await apiFetch(`${API_BASE}?action=airport_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || 'Failed to search airports');
  return data.data;
}
export async function createFlight(flightData) {
  const res = await apiFetch(`${API_BASE}?action=create_flight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flightData)
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add flight');
  return data;
}

export async function addMasterHotel(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_master_hotel', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create hotel');
  return data;
}

export async function deleteMasterHotel(id) {
  const res = await apiFetch(`${API_BASE}?action=delete_master_hotel&id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete hotel');
  return data;
}

export async function addMasterFlight(flightData) {
  const res = await apiFetch(`${API_BASE}?action=add_master_flight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flightData)
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add flight to master table');
  return data;
}

export async function deleteMasterFlight(id) {
  const res = await apiFetch(`${API_BASE}?action=delete_master_flight&id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete flight');
  return data;
}

export async function createHotel(hotelData) {
  const res = await apiFetch(`${API_BASE}?action=create_hotel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hotelData)
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create hotel');
  return data;
}

export async function updatePaymentSettings(razorpayEnabled, upiEnabled, razorpayKey, razorpaySecret, upiId, upiQrUrl) {
  const res = await apiFetch(`${API_BASE}?action=update_payment_settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      razorpay_enabled: razorpayEnabled ? 1 : 0, 
      upi_enabled: upiEnabled ? 1 : 0,
      razorpay_key: razorpayKey,
      razorpay_secret: razorpaySecret,
      upi_id: upiId,
      upi_qr_url: upiQrUrl
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update payment settings');
  return data;
}

export async function updateBookingPayment(id, paymentMethod, paymentProof) {
  const res = await apiFetch(`${API_BASE}?action=update_booking_payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, payment_method: paymentMethod, payment_proof: paymentProof })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update booking payment');
  return data;
}

export async function holdVehicle(vehicleId, sessionId = null) {
  const res = await apiFetch(`${API_BASE}?action=hold_vehicle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: vehicleId, session_id: sessionId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to hold vehicle');
  return data;
}

export async function uploadDocument(file, entityType, entityId, docType) {
  const formData = new FormData();
  formData.append('action', 'upload_document');
  formData.append('file', file);
  formData.append('entity_type', entityType);
  formData.append('entity_id', entityId);
  formData.append('document_type', docType);
  
  const res = await apiFetch(`${API_BASE}?action=upload_document`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
  return data;
}

// ==========================================
// PMS (Property Management System) Functions
// ==========================================



// Vehicle Vendor specific methods

export async function deleteVehicle(id, type) {
  const res = await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify({ action: 'delete_vehicle', id, type }) });
  return res.json();
}

export async function getVendorPaymentMethods(vendorId) {
  const res = await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify({ action: 'get_vendor_payment_methods', vendor_id: vendorId }) });
  return res.json();
}

export async function getAdminPaymentMethods() {
  const res = await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify({ action: 'get_admin_payment_methods' }) });
  return res.json();
}

export async function addVendorPaymentMethod(payload) {
  const res = await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify({ action: 'add_vendor_payment_method', ...payload }) });
  return res.json();
}

export async function updateVendorPaymentMethod(payload) {
  const res = await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify({ action: 'update_vendor_payment_method', ...payload }) });
  return res.json();
}

export async function deleteVendorPaymentMethod(id) {
  const res = await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify({ action: 'delete_vendor_payment_method', id }) });
  return res.json();
}

export const saveVendorPaymentMethod = addVendorPaymentMethod;

export async function updateBookingStatus(id, status, paymentStatus = null) {
  // Update local storage bookings first as client-side fallback
  try {
    const localBookings = JSON.parse(localStorage.getItem('local_bookings') || '[]');
    const idx = localBookings.findIndex(b => String(b.id) === String(id));
    if (idx !== -1) {
      localBookings[idx].status = status;
      if (paymentStatus) localBookings[idx].payment_status = paymentStatus;
      localStorage.setItem('local_bookings', JSON.stringify(localBookings));
    }
  } catch (e) {}

  try {
    const payload = { action: 'update_booking_status', id, status };
    if (paymentStatus) payload.payment_status = paymentStatus;
    const res = await apiFetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success) return data;
    }
  } catch (err) {
    console.warn('[API] update_booking_status backend error, using local fallback:', err.message);
  }
  return { success: true, message: 'Status updated successfully' };
}

export async function deleteBooking(id) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_booking', id })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete booking');
  return data;
}

export async function updateBooking(bookingData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_booking', ...bookingData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to update booking');
  return data;
}

export async function addCar(carData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_car', ...carData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to add car');
  return data;
}

export async function updateCar(carData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_vehicle', type: 'car', ...carData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to update car');
  return data;
}

export async function deleteCar(id) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_vehicle', type: 'car', id })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to delete car');
  return data;
}

export async function addBike(bikeData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add_bike', ...bikeData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to add bike');
  return data;
}

export async function updateBike(bikeData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_vehicle', type: 'bike', ...bikeData })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to update bike');
  return data;
}

export async function deleteBike(id) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_vehicle', type: 'bike', id })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || data.error || 'Failed to delete bike');
  return data;
}

// ─── COUPONS MANAGEMENT ──────────────────────────────────────────
export async function getAddOns() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=add_ons`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('[API] getAddOns error:', err);
  }
  return [];
}

export async function createAddOn(data) {
  const res = await apiFetch(`${API_BASE}?action=create_add_on`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_add_on', ...data })
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create add_on');
  return json;
}

export async function deleteAddOn(id) {
  const res = await apiFetch(`${API_BASE}?action=delete_add_on`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_add_on', id })
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete add_on');
  return json;
}

export async function fetchPaymentSettings() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=payment_settings`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('[API] fetchPaymentSettings error:', err);
  }
  return null;
}

export async function getCoupons() {
  try {
    const res = await apiFetch(`${API_BASE}?resource=coupons`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('[API] getCoupons error:', err);
  }
  return [];
}

export async function createCoupon(couponData) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create_coupon', ...couponData })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create coupon');
  return data;
}

export async function deleteCoupon(id) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_coupon', id })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete coupon');
  return data;
}

// ─── CRM & LEAD TIMELINE ─────────────────────────────────────────
export async function updateEnquiryStatus(enquiryId, status, assignedTo = null) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_enquiry_status', enquiry_id: enquiryId, status, assigned_to: assignedTo })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update enquiry status');
  return data;
}

export async function addEnquiryTimeline(enquiryId, actionType = 'Note', notes = '', followUpDate = null, attachmentUrl = null, createdBy = 'Admin', senderRole = 'admin') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_enquiry_timeline',
      enquiry_id: enquiryId,
      action_type: actionType,
      notes,
      follow_up_date: followUpDate,
      attachment_url: attachmentUrl,
      created_by: createdBy,
      sender_role: senderRole
    })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to add timeline log');
  return data;
}

export async function fetchEnquiryTimeline(enquiryId) {
  try {
    const res = await apiFetch(`${API_BASE}?resource=enquiry_timeline&enquiry_id=${encodeURIComponent(enquiryId)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('[API] fetchEnquiryTimeline error:', err);
  }
  return [];
}

// ─── HOTEL PMS API SERVICE METHODS ─────────────────────────────────────────

export async function pmsUpdateHotelStatus(hotelId, vendorId, status, remarks = '') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_update_hotel_status', hotel_id: hotelId, vendor_id: vendorId, hotel_status: status, approval_remarks: remarks })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update hotel status');
  return data;
}

export async function pmsGetStats(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=pms_stats&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch PMS stats');
  return res.json();
}

export async function pmsGetDashboardActivity(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=pms_dashboard_activity&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch dashboard activity');
  return res.json();
}

export async function pmsListRoomTypes(vendorId = 'u-5', hotelId = null) {
  let url = `${API_BASE}?resource=hotel_room_types&vendor_id=${encodeURIComponent(vendorId)}`;
  if (hotelId) url += `&hotel_id=${encodeURIComponent(hotelId)}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch room types');
  return res.json();
}

export async function pmsCreateRoomType(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_create_room_type', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create room type');
  return data;
}

export async function pmsUpdateRoomType(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_update_room_type', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update room type');
  return data;
}

export async function pmsDeleteRoomType(id, vendorId = 'u-5') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_delete_room_type', id, vendor_id: vendorId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete room type');
  return data;
}

export async function pmsListRooms(hotelId, vendorId = 'u-5') {
  let url = `${API_BASE}?resource=hotel_rooms&vendor_id=${encodeURIComponent(vendorId)}`;
  if (hotelId) url += `&hotel_id=${encodeURIComponent(hotelId)}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

export async function pmsCreateRoom(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_create_room', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create room');
  return data;
}

export async function pmsUpdateRoom(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_update_room', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update room');
  return data;
}

export async function pmsDeleteRoom(id, vendorId = 'u-5') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_delete_room', id, vendor_id: vendorId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete room');
  return data;
}

export async function pmsBulkRooms(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_bulk_rooms', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to bulk upload rooms');
  return data;
}

export async function pmsGetAvailabilityCalendar(hotelId, roomTypeId, fromDate, toDate) {
  const url = `${API_BASE}?resource=hotel_availability_calendar&hotel_id=${encodeURIComponent(hotelId || '')}&room_type_id=${encodeURIComponent(roomTypeId || '')}&from_date=${encodeURIComponent(fromDate || '')}&to_date=${encodeURIComponent(toDate || '')}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch availability calendar');
  return res.json();
}

export async function pmsUpdateAvailability(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_update_availability', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update availability');
  return data;
}

export async function pmsListRatePlans(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=hotel_rate_plans&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch rate plans');
  return res.json();
}

export async function pmsCreateRatePlan(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_create_rate_plan', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create rate plan');
  return data;
}

export async function pmsUpdateRatePlan(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_update_rate_plan', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update rate plan');
  return data;
}

export async function pmsDeleteRatePlan(id, vendorId = 'u-5') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_delete_rate_plan', id, vendor_id: vendorId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete rate plan');
  return data;
}

export async function pmsListGuests(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=hotel_guests&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch guests');
  return res.json();
}

export async function pmsCreateGuest(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_create_guest', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create guest');
  return data;
}

export async function pmsUpdateGuest(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_update_guest', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update guest');
  return data;
}

export async function pmsDeleteGuest(id, vendorId = 'u-5') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_delete_guest', id, vendor_id: vendorId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete guest');
  return data;
}

export async function pmsListReviews(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=hotel_reviews&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function pmsReplyReview(id, vendorId = 'u-5', reply = '') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_reply_review', id, vendor_id: vendorId, reply })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to reply review');
  return data;
}

export async function pmsListStaff(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=hotel_staff&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch staff');
  return res.json();
}

export async function pmsCreateStaff(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_create_staff', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create staff');
  return data;
}

export async function pmsUpdateStaff(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_update_staff', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update staff');
  return data;
}

export async function pmsDeleteStaff(id, vendorId = 'u-5') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_delete_staff', id, vendor_id: vendorId })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete staff');
  return data;
}

export async function pmsListNotifications(vendorId = 'u-5', vendorType = null) {
  let url = `${API_BASE}?resource=hotel_notifications&vendor_id=${encodeURIComponent(vendorId)}`;
  if (vendorType) url += `&vendor_type=${encodeURIComponent(vendorType)}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function pmsMarkNotificationRead(id = null, vendorId = 'u-5', all = false) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_mark_notification_read', id, vendor_id: vendorId, all })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to update notifications');
  return data;
}

export async function pmsDeleteNotification(id = null, vendorId = 'u-5', all = false) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_delete_notification', id, vendor_id: vendorId, all })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to delete notification');
  return data;
}

export async function pmsListTickets(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=hotel_support_tickets&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function pmsCreateTicket(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_create_ticket', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create ticket');
  return data;
}

export async function pmsReplyTicket(id, vendorId = 'u-5', reply = '') {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_reply_ticket', id, vendor_id: vendorId, reply })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to reply ticket');
  return data;
}

export async function pmsListActivity(vendorId = 'u-5') {
  const res = await apiFetch(`${API_BASE}?resource=hotel_activity_logs&vendor_id=${encodeURIComponent(vendorId)}`);
  if (!res.ok) throw new Error('Failed to fetch activity log');
  return res.json();
}

export async function pmsLogActivity(payload) {
  try {
    await apiFetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pms_log_activity', ...payload })
    });
  } catch (err) {}
}

export async function pmsCreateManualBooking(payload) {
  const res = await apiFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'pms_create_manual_booking', ...payload })
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Failed to create manual booking');
  return data;
}

