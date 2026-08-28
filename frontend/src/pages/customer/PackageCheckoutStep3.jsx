import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';

export default function PackageCheckoutStep3({
  pkg,
  serverPriceData,
  paymentMode,
  setPaymentMode,
  onBack,
  onCheckout
}) {
  if (!serverPriceData) return null;

  const total = serverPriceData.total_price;
  const advancePercent = serverPriceData.advance_percentage || 25;
  const advance = serverPriceData.advance_amount || Math.round((total * advancePercent) / 100);

  return (
    <div className="container py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <button onClick={onBack} className="btn btn-link text-dark text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 fw-bold">
        <ArrowLeft size={18} /> Back to Travellers
      </button>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="mb-4">
            <h2 className="fw-extrabold text-dark mb-1">Review & Pay</h2>
            <p className="text-muted small">You're almost there! Review your booking and choose a payment option.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-7">
               {/* Package Summary */}
               <div className="bg-white border rounded shadow-sm p-4 mb-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <CheckCircle2 size={18} className="text-success"/> Booking Summary
                  </h6>
                  <h5 className="fw-bold text-primary mb-1">{pkg.name}</h5>
                  <p className="text-muted small mb-3">{pkg.duration} • {pkg.destination || 'Goa'}</p>
                  
                  <div className="bg-light p-3 rounded small mb-3">
                     <span className="fw-bold d-block text-dark mb-1">Cancellation Policy:</span>
                     <span className="text-muted">{pkg.cancellation_policy || 'Strict: Non-refundable within 48 hours of travel.'}</span>
                  </div>

                  <div className="alert alert-success d-flex align-items-center gap-2 py-2 small mb-0">
                      <ShieldCheck size={16}/> Your booking is protected by TripGalileo Guarantee.
                  </div>
               </div>

               {/* Payment Options */}
               <div className="bg-white border rounded shadow-sm p-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <CreditCard size={18} className="text-primary"/> Select Payment Option
                  </h6>
                  
                  <div 
                    className={`border rounded p-3 mb-3 cursor-pointer transition-all ${paymentMode === 'full' ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                    onClick={() => setPaymentMode('full')}
                    style={{ cursor: 'pointer' }}
                  >
                     <div className="d-flex align-items-center gap-3">
                         <div className={`rounded-circle border d-flex align-items-center justify-content-center flex-shrink-0`} style={{width:'20px', height:'20px', borderColor: paymentMode === 'full' ? '#0d6efd' : '#ccc'}}>
                            {paymentMode === 'full' && <div className="bg-primary rounded-circle" style={{width:'10px', height:'10px'}}></div>}
                         </div>
                         <div className="flex-grow-1">
                             <div className="fw-bold d-flex justify-content-between">
                                 <span>Pay Full Amount</span>
                                 <span>₹{total}</span>
                             </div>
                             <div className="small text-muted mt-1">Pay the complete amount now and travel hassle-free.</div>
                         </div>
                     </div>
                  </div>

                  <div 
                    className={`border rounded p-3 cursor-pointer transition-all ${paymentMode === 'advance' ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                    onClick={() => setPaymentMode('advance')}
                    style={{ cursor: 'pointer' }}
                  >
                     <div className="d-flex align-items-center gap-3">
                         <div className={`rounded-circle border d-flex align-items-center justify-content-center flex-shrink-0`} style={{width:'20px', height:'20px', borderColor: paymentMode === 'advance' ? '#0d6efd' : '#ccc'}}>
                            {paymentMode === 'advance' && <div className="bg-primary rounded-circle" style={{width:'10px', height:'10px'}}></div>}
                         </div>
                         <div className="flex-grow-1">
                             <div className="fw-bold d-flex justify-content-between">
                                 <span>Pay To Hold ({advancePercent}%)</span>
                                 <span>₹{advance}</span>
                             </div>
                             <div className="small text-muted mt-1">Pay ₹{advance} now to confirm your booking. The remaining ₹{total - advance} must be paid before travel.</div>
                         </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="col-md-5">
               {/* Price Breakdown Sticky */}
               <div className="position-sticky" style={{top: '20px'}}>
                  <div className="bg-white border rounded shadow-sm p-4">
                     <h6 className="fw-bold mb-3 border-bottom pb-2">Price Breakdown</h6>
                     
                     <div className="d-flex justify-content-between mb-2 small">
                         <span className="text-muted">Total Package Cost</span>
                         <span className="fw-bold">₹{total}</span>
                     </div>
                     
                     <hr className="my-3 text-muted"/>
                     
                     <div className="d-flex justify-content-between mb-3">
                         <span className="fw-bold fs-5 text-dark">Amount Payable</span>
                         <span className="fw-bold fs-5 text-primary">₹{paymentMode === 'full' ? total : advance}</span>
                     </div>

                     <button className="btn btn-primary w-100 py-3 rounded-pill fw-bold text-white shadow d-flex justify-content-between align-items-center px-4 mt-2" onClick={onCheckout}>
                         <span>Proceed to Pay</span>
                         <ChevronRight size={18}/>
                     </button>
                     <p className="text-center text-muted mt-3 mb-0" style={{fontSize: '11px'}}>By proceeding, you agree to our Terms & Conditions.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
