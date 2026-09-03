import React, { useState } from 'react';
import { 
  Building2, User, Phone, Mail, MapPin, ShieldCheck, Gift, Tag, 
  Wallet, CreditCard, Clock, AlertCircle, CheckCircle2, ArrowRight, Lock, Check
} from 'lucide-react';
import * as api from '../../services/api';

export default function B2BProfileTab({ partnerUser, onLogout, onPartnerRefresh }) {
  if (!partnerUser) return null;

  const hasCommission = Boolean(partnerUser.allow_commission);
  const hasNonCommission = Boolean(partnerUser.allow_non_commission);

  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMsg, setRequestMsg] = useState('');
  const [requestError, setRequestError] = useState('');

  // Local state for mode request to reflect instantly
  const [localReqStatus, setLocalReqStatus] = useState(partnerUser.mode_request_status || null);
  const [localReqMode, setLocalReqMode] = useState(partnerUser.requested_mode || null);

  const isPendingRequest = (localReqStatus === 'PENDING' && localReqMode);

  const handleRequestMode = async (modeToRequest) => {
    setRequestLoading(true);
    setRequestMsg('');
    setRequestError('');
    try {
      const res = await api.b2bRequestMode(partnerUser.id, modeToRequest);
      if (res && res.success) {
        setLocalReqStatus('PENDING');
        setLocalReqMode(modeToRequest);
        setRequestMsg(`Request for ${modeToRequest === 'COMMISSION' ? 'Commission' : 'Non-Commission Net'} mode submitted successfully! It is now pending Admin approval.`);
        if (onPartnerRefresh) onPartnerRefresh();
      } else {
        setRequestError(res.error || 'Failed to submit mode change request.');
      }
    } catch (err) {
      setRequestError(err.message || 'Error submitting mode request.');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '840px' }}>
      {/* Agency Identity Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 border-bottom mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle p-3 bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
              <Building2 size={28} />
            </div>
            <div>
              <h5 className="fw-black text-dark font-heading mb-0.5">{partnerUser.company_name || partnerUser.name}</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-success text-white text-xxs fw-bold px-2.5 py-0.5 rounded-pill">
                  ✓ Active Agency Partner
                </span>
                <span className="text-muted text-xxs font-monospace">Agency ID: {partnerUser.id}</span>
                {partnerUser.initial_mode && (
                  <span className="badge bg-light text-muted border text-xxs">
                    Registered Initial Mode: {partnerUser.initial_mode}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3.5 text-xs font-heading">
            Logout Agency
          </button>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Primary Contact Person</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.name || partnerUser.contact_name || '—'}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Agency Email</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.email || '—'}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Contact Phone</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.phone || '—'}</div>
          </div>
          <div className="col-md-6">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">GST Registration Number</label>
            <div className="fw-semibold text-dark text-sm font-monospace">{partnerUser.gst_number || 'Unregistered / Not Provided'}</div>
          </div>
          <div className="col-12">
            <label className="text-muted text-xxs fw-bold text-uppercase mb-1">Agency Registered Address</label>
            <div className="fw-semibold text-dark text-sm">{partnerUser.address || partnerUser.city || 'Goa, India'}</div>
          </div>
        </div>
      </div>

      {/* Authorized Pricing Modes & Additional Mode Request Section */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark font-heading mb-0">Authorized B2B Pricing Modes</h6>
            <span className="text-muted text-xxs">Governed strictly by Admin verification in database.</span>
          </div>
          {hasCommission && hasNonCommission ? (
            <span className="badge bg-success bg-opacity-15 text-success border border-success text-xxs px-2.5 py-1 rounded-pill fw-bold">
              ✓ Dual Mode Access Enabled
            </span>
          ) : (
            <span className="badge bg-warning bg-opacity-20 text-dark border border-warning text-xxs px-2.5 py-1 rounded-pill fw-bold">
              Single Mode Approved
            </span>
          )}
        </div>

        {/* Feedback alert messages */}
        {requestMsg && (
          <div className="alert alert-success py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>{requestMsg}</span>
          </div>
        )}
        {requestError && (
          <div className="alert alert-danger py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {/* Pending Banner if user has a pending request */}
        {isPendingRequest && (
          <div className="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning mb-3">
            <div className="d-flex align-items-start gap-2.5">
              <Clock size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-dark text-xs d-block mb-0.5">
                  Mode Change Request Pending Admin Approval
                </strong>
                <p className="text-muted text-xs mb-0 leading-relaxed">
                  Your request for <strong>{localReqMode === 'COMMISSION' ? 'Commission Mode' : 'Non-Commission Net Mode'}</strong> is under review by the WOW GOA Admin team. 
                  The second mode remains locked until approved.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="row g-3">
          {/* Commission Mode Card */}
          <div className="col-12 col-md-6">
            <div className={`p-3.5 rounded-3 border h-100 ${
              hasCommission 
                ? 'bg-warning bg-opacity-10 border-warning border-opacity-50' 
                : 'bg-light border-light-subtle opacity-75'
            }`}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-1.5 text-warning fw-bold text-xs">
                  <Gift size={16} />
                  <span>Commission Mode</span>
                </div>
                {hasCommission ? (
                  <span className="badge bg-success text-white text-xxs px-2 py-0.5 rounded-pill">
                    ✓ Active
                  </span>
                ) : (
                  <span className="badge bg-secondary text-white text-xxs px-2 py-0.5 rounded-pill d-flex align-items-center gap-1">
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>

              <div className="fs-5 fw-black text-dark font-heading mb-1">
                {partnerUser.default_commission_rate ? `${partnerUser.default_commission_rate}%` : '10.00%'} Commission
              </div>

              <p className="text-muted text-xxs mb-3 leading-relaxed">
                Guest pays retail price; agency earns direct commission payout on every completed booking.
              </p>

              {/* Request button if not active */}
              {!hasCommission && (
                <div>
                  {isPendingRequest && localReqMode === 'COMMISSION' ? (
                    <button disabled className="btn btn-warning btn-sm w-100 rounded-pill text-xxs fw-bold py-1.5 opacity-75">
                      ⏳ Verification Pending
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={requestLoading}
                      onClick={() => handleRequestMode('COMMISSION')}
                      className="btn btn-dark btn-sm w-100 rounded-pill text-xxs fw-bold py-1.5 d-flex align-items-center justify-content-center gap-1"
                    >
                      <span>Request Commission Access</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Non-Commission Mode Card */}
          <div className="col-12 col-md-6">
            <div className={`p-3.5 rounded-3 border h-100 ${
              hasNonCommission 
                ? 'bg-primary bg-opacity-10 border-primary border-opacity-50' 
                : 'bg-light border-light-subtle opacity-75'
            }`}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-1.5 text-primary fw-bold text-xs">
                  <Tag size={16} />
                  <span>Non-Commission Mode</span>
                </div>
                {hasNonCommission ? (
                  <span className="badge bg-success text-white text-xxs px-2 py-0.5 rounded-pill">
                    ✓ Active
                  </span>
                ) : (
                  <span className="badge bg-secondary text-white text-xxs px-2 py-0.5 rounded-pill d-flex align-items-center gap-1">
                    <Lock size={10} /> Locked
                  </span>
                )}
              </div>

              <div className="fs-5 fw-black text-dark font-heading mb-1">
                {partnerUser.default_net_discount_rate ? `${partnerUser.default_net_discount_rate}%` : '10.00%'} Wholesale Net
              </div>

              <p className="text-muted text-xxs mb-3 leading-relaxed">
                Direct wholesale net rates; agency applies its own markup to end travelers directly.
              </p>

              {/* Request button if not active */}
              {!hasNonCommission && (
                <div>
                  {isPendingRequest && localReqMode === 'NON_COMMISSION' ? (
                    <button disabled className="btn btn-primary btn-sm w-100 rounded-pill text-xxs fw-bold py-1.5 opacity-75">
                      ⏳ Verification Pending
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={requestLoading}
                      onClick={() => handleRequestMode('NON_COMMISSION')}
                      className="btn btn-primary btn-sm w-100 rounded-pill text-xxs fw-bold py-1.5 d-flex align-items-center justify-content-center gap-1"
                    >
                      <span>Request Non-Commission Access</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasCommission && hasNonCommission && (
          <div className="mt-3 p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-success text-xxs d-flex align-items-center gap-2">
            <CheckCircle2 size={14} className="flex-shrink-0" />
            <span>Congratulations! Your agency has active permissions for both Commission and Net Wholesale booking sections.</span>
          </div>
        )}
      </div>

      {/* Security Information */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex align-items-center gap-2 mb-2 text-dark fw-bold text-xs">
          <ShieldCheck size={16} className="text-success" />
          <span>B2B Channel Compliance & Security Terms</span>
        </div>
        <ul className="text-muted text-xxs mb-0 ps-3 leading-relaxed">
          <li className="mb-1">All bookings placed under your account carry authoritative B2B contract terms.</li>
          <li className="mb-1">Mode switching is governed strictly by administrator approval to preserve audit accuracy.</li>
          <li>Real-time notifications will update you the moment any mode requests or booking approvals occur.</li>
        </ul>
      </div>
    </div>
  );
}
