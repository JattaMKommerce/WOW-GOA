import React, { useState, useEffect, useRef } from 'react';
import { Settings, Plus, Building, QrCode, Upload, X } from 'lucide-react';
import * as api from '../../../services/api';

export default function PMSPaymentSettings({ currentUser }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMethod, setNewMethod] = useState({
    method_type: 'UPI',
    details: { upi_id: '', name: '', qr_image: '', account_name: '', bank_name: '', account_number: '', ifsc: '', key_id: '', key_secret: '' }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const qrInputRef = useRef(null);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await api.getVendorPaymentMethods(currentUser.id);
      setMethods(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [currentUser.id]);

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setQrPreview(base64);
      setNewMethod(prev => ({
        ...prev,
        details: { ...prev.details, qr_image: base64 }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleMethodTypeChange = (type) => {
    setQrPreview(null);
    setNewMethod({ method_type: type, details: { upi_id: '', name: '', qr_image: '', account_name: '', bank_name: '', account_number: '', ifsc: '', key_id: '', key_secret: '' } });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload = {
        vendor_id: currentUser.id,
        method_type: newMethod.method_type,
        display_name: newMethod.method_type + ' Payment',
        status: 'Active'
      };
      
      if (newMethod.method_type === 'UPI') {
        payload.upi_id = newMethod.details.upi_id;
        payload.account_name = newMethod.details.name;
        payload.qr_image_url = newMethod.details.qr_image;
      } else if (newMethod.method_type === 'Bank Transfer') {
        payload.account_name = newMethod.details.account_name;
        payload.bank_name = newMethod.details.bank_name;
        payload.account_number = newMethod.details.account_number;
        payload.ifsc_code = newMethod.details.ifsc;
      } else if (newMethod.method_type === 'Razorpay') {
        payload.account_name = newMethod.details.key_id;
        payload.instructions = newMethod.details.key_secret;
      }

      await api.addVendorPaymentMethod(payload);
      setShowAdd(false);
      setQrPreview(null);
      setNewMethod({ method_type: 'UPI', details: { upi_id: '', name: '', qr_image: '', account_name: '', bank_name: '', account_number: '', ifsc: '', key_id: '', key_secret: '' } });
      fetchMethods();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment method?")) return;
    try {
      await api.deleteVendorPaymentMethod(id);
      fetchMethods();
    } catch (e) {
      alert("Error deleting: " + e.message);
    }
  };

  return (
    <div className="p-4" style={{ minHeight: '100%' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#1a2b4a' }}>Payment Gateways</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>Configure how customers pay for your bookings</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary fw-bold px-4 py-2 rounded-pill">
          <Plus size={18} className="me-2" /> Add Payment Method
        </button>
      </div>

      {showAdd && (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">New Payment Method</h5>
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label text-muted fw-bold small">Method Type</label>
                <select
                  className="form-select"
                  value={newMethod.method_type}
                  onChange={(e) => handleMethodTypeChange(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Razorpay">Razorpay</option>
                </select>
              </div>

              {newMethod.method_type === 'UPI' && (
                <>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-bold small">UPI Holder Name</label>
                      <input type="text" className="form-control" placeholder="e.g. Acme Rentals" value={newMethod.details.name}
                        onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, name: e.target.value } })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-bold small">UPI ID</label>
                      <input type="text" className="form-control" placeholder="example@upi" value={newMethod.details.upi_id}
                        onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, upi_id: e.target.value } })} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold small">UPI QR Code Image (Optional)</label>
                    <div
                      className="border border-2 border-dashed rounded-3 p-3 text-center"
                      style={{ borderColor: '#dee2e6', cursor: 'pointer', background: '#f8f9fa' }}
                      onClick={() => qrInputRef.current?.click()}
                    >
                      {qrPreview ? (
                        <div className="position-relative d-inline-block">
                          <img src={qrPreview} alt="QR Preview" style={{ maxHeight: '160px', maxWidth: '160px', borderRadius: '8px' }} />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle p-1"
                            style={{ width: '24px', height: '24px', lineHeight: 1 }}
                            onClick={(e) => { e.stopPropagation(); setQrPreview(null); setNewMethod(prev => ({ ...prev, details: { ...prev.details, qr_image: '' } })); }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-muted py-2">
                          <QrCode size={36} className="mb-2 opacity-50" />
                          <div className="small fw-bold">Click to upload QR Code</div>
                        </div>
                      )}
                    </div>
                    <input ref={qrInputRef} type="file" accept="image/*" className="d-none" onChange={handleQrUpload} />
                  </div>
                </>
              )}

              {newMethod.method_type === 'Bank Transfer' && (
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-bold small">Account Holder Name</label>
                    <input type="text" className="form-control" value={newMethod.details.account_name}
                      onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, account_name: e.target.value } })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-bold small">Account Number</label>
                    <input type="text" className="form-control" value={newMethod.details.account_number}
                      onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, account_number: e.target.value } })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-bold small">IFSC Code</label>
                    <input type="text" className="form-control" value={newMethod.details.ifsc}
                      onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, ifsc: e.target.value } })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-bold small">Bank Name</label>
                    <input type="text" className="form-control" value={newMethod.details.bank_name}
                      onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, bank_name: e.target.value } })} required />
                  </div>
                </div>
              )}

              {newMethod.method_type === 'Razorpay' && (
                <>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold small">Razorpay Key ID</label>
                    <input type="text" className="form-control" value={newMethod.details.key_id}
                      onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, key_id: e.target.value } })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold small">Razorpay Key Secret</label>
                    <input type="password" className="form-control" value={newMethod.details.key_secret}
                      onChange={e => setNewMethod({ ...newMethod, details: { ...newMethod.details, key_secret: e.target.value } })} required />
                  </div>
                </>
              )}

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="btn btn-light fw-bold px-4">Cancel</button>
                <button type="submit" className="btn btn-primary fw-bold px-4" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>
      ) : methods.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <Settings size={40} className="mx-auto text-muted mb-3" />
          <h5 className="fw-bold">No Payment Gateways Configured</h5>
          <p className="text-muted">Customers will not be able to pay you directly until you add a payment method.</p>
        </div>
      ) : (
        <div className="row g-4">
          {methods.map(method => {
            const isUPI = method.method_type === 'UPI';
            const isBank = method.method_type === 'Bank Transfer';
            const isRazorpay = method.method_type === 'Razorpay';
            
            return (
              <div key={method.id} className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <span className="badge bg-primary bg-opacity-10 text-primary mb-2 px-3 py-2 rounded-pill fw-bold">
                          {method.method_type}
                        </span>
                        <h6 className="fw-bold m-0">{method.display_name}</h6>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span>
                          <span className={`badge ${method.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>{method.status}</span>
                        </span>
                      </div>
                    </div>

                    <div className="bg-light rounded-3 p-3 mb-3">
                      {isUPI && (
                        <>
                          <div className="small text-muted mb-1">UPI ID</div>
                          <div className="fw-bold mb-2">{method.upi_id}</div>
                          <div className="small text-muted mb-1">Name</div>
                          <div className="fw-bold">{method.account_name}</div>
                        </>
                      )}
                      {isBank && (
                        <>
                          <div className="small text-muted mb-1">Bank Name</div>
                          <div className="fw-bold mb-2">{method.bank_name}</div>
                          <div className="small text-muted mb-1">Account Number</div>
                          <div className="fw-bold mb-2">{method.account_number}</div>
                          <div className="small text-muted mb-1">IFSC</div>
                          <div className="fw-bold mb-2">{method.ifsc_code}</div>
                          <div className="small text-muted mb-1">Account Holder</div>
                          <div className="fw-bold">{method.account_name}</div>
                        </>
                      )}
                      {isRazorpay && (
                        <>
                          <div className="small text-muted mb-1">Key ID</div>
                          <div className="fw-bold text-truncate">{method.account_name}</div>
                        </>
                      )}
                    </div>
                    
                    <button onClick={() => handleDelete(method.id)} className="btn btn-outline-danger btn-sm w-100 fw-bold">
                      Remove Method
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
