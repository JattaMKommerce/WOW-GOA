import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Edit2, Save, X, Building, Link as LinkIcon, QrCode } from 'lucide-react';
import * as api from '../../services/api';

export default function VendorPaymentSettings({ currentUser }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const data = await api.makeApiCall(`/api.php?resource=vendor_payment_methods&vendor_id=${currentUser.id}`);
      setMethods(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, [currentUser.id]);

  const handleAddNew = () => {
    setFormData({
      vendor_id: currentUser.id,
      method_type: 'Bank Transfer',
      display_name: '',
      account_name: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      upi_id: '',
      instructions: '',
      status: 'Active'
    });
    setIsEditing(true);
  };

  const handleEdit = (method) => {
    setFormData(method);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this payment method?')) return;
    try {
      await api.makeApiCall('/api.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_vendor_payment_method', id, vendor_id: currentUser.id })
      });
      fetchMethods();
    } catch (e) { alert('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.makeApiCall('/api.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'save_vendor_payment_method', ...formData })
      });
      setIsEditing(false);
      fetchMethods();
    } catch (e) { alert('Failed to save'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await api.uploadImage(file);
      setFormData(prev => ({...prev, qr_image_url: url}));
    } catch (err) { alert('Upload failed'); }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Payment Methods</h3>
        {!isEditing && (
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={18} className="me-2"/> Add Method
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-header bg-white border-bottom p-4">
            <h5 className="mb-0 fw-bold">{formData.id ? 'Edit' : 'Add'} Payment Method</h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Method Type</label>
                <select className="form-select" value={formData.method_type} onChange={e => setFormData({...formData, method_type: e.target.value})}>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="QR Code">QR Code</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Display Name (e.g. Primary HDFC Account)</label>
                <input type="text" className="form-control" required value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} />
              </div>

              {formData.method_type === 'Bank Transfer' && (
                <>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Account Name</label>
                    <input type="text" className="form-control" required value={formData.account_name || ''} onChange={e => setFormData({...formData, account_name: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Bank Name</label>
                    <input type="text" className="form-control" required value={formData.bank_name || ''} onChange={e => setFormData({...formData, bank_name: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Account Number</label>
                    <input type="text" className="form-control" required value={formData.account_number || ''} onChange={e => setFormData({...formData, account_number: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">IFSC Code</label>
                    <input type="text" className="form-control" required value={formData.ifsc_code || ''} onChange={e => setFormData({...formData, ifsc_code: e.target.value})} />
                  </div>
                </>
              )}

              {formData.method_type === 'UPI' && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold">UPI ID</label>
                  <input type="text" className="form-control" required value={formData.upi_id || ''} onChange={e => setFormData({...formData, upi_id: e.target.value})} />
                </div>
              )}

              {formData.method_type === 'QR Code' && (
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Upload QR Image</label>
                  <input type="file" className="form-control" accept="image/*" onChange={handleFileUpload} />
                  {formData.qr_image_url && (
                    <img src={formData.qr_image_url} alt="QR" className="img-thumbnail mt-2" style={{maxHeight:'150px'}} />
                  )}
                </div>
              )}

              <div className="col-12">
                <label className="form-label fw-semibold">Special Instructions (Optional)</label>
                <textarea className="form-control" rows="2" value={formData.instructions || ''} onChange={e => setFormData({...formData, instructions: e.target.value})}></textarea>
              </div>

              <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4">Save Method</button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {loading ? (
            <div className="col-12 text-center py-5 text-muted">Loading payment methods...</div>
          ) : methods.length === 0 ? (
            <div className="col-12 text-center py-5 bg-light rounded-4 text-muted">
              <CreditCard size={48} className="mb-3 opacity-50"/>
              <h5>No Payment Methods</h5>
              <p>Add a payment method to receive customer payments directly.</p>
            </div>
          ) : (
            methods.map(method => (
              <div key={method.id} className="col-md-6 col-xl-4">
                <div className="card shadow-sm border-0 h-100 rounded-4">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className={`p-2 rounded-circle ${method.method_type === 'Bank Transfer' ? 'bg-primary' : method.method_type === 'UPI' ? 'bg-success' : 'bg-warning'} text-white bg-opacity-75`}>
                          {method.method_type === 'Bank Transfer' ? <Building size={18}/> : method.method_type === 'UPI' ? <LinkIcon size={18}/> : <QrCode size={18}/>}
                        </div>
                        <h5 className="fw-bold mb-0">{method.display_name}</h5>
                      </div>
                      <span className={`badge ${method.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>{method.status}</span>
                    </div>

                    <div className="mb-4">
                      {method.method_type === 'Bank Transfer' && (
                        <div className="small">
                          <div className="text-muted mb-1">Account: <span className="text-dark fw-medium">{method.account_name}</span></div>
                          <div className="text-muted mb-1">Bank: <span className="text-dark fw-medium">{method.bank_name}</span></div>
                          <div className="text-muted mb-1">A/C No: <span className="text-dark fw-medium">{method.account_number}</span></div>
                          <div className="text-muted">IFSC: <span className="text-dark fw-medium">{method.ifsc_code}</span></div>
                        </div>
                      )}
                      {method.method_type === 'UPI' && (
                        <div className="small">
                          <div className="text-muted mb-1">UPI ID: <span className="text-dark fw-medium">{method.upi_id}</span></div>
                        </div>
                      )}
                      {method.method_type === 'QR Code' && (
                        <div className="text-center">
                          <img src={method.qr_image_url} alt="QR" className="img-thumbnail border-0 bg-light" style={{maxHeight:'120px'}} />
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2 mt-auto">
                      <button className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => handleEdit(method)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger flex-grow-1" onClick={() => handleDelete(method.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
