import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, CreditCard, CheckCircle, AlertTriangle, Armchair } from 'lucide-react';
import * as api from '../../services/api';

export default function FlightBookingFlow({ offer, onBack, onComplete }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Passenger details
  const [passengers, setPassengers] = useState(
    offer.passengers.map(p => ({
      id: p.id,
      type: p.type,
      title: 'mr',
      given_name: '',
      family_name: '',
      gender: 'm',
      born_on: '',
      email: '',
      phone_number: ''
    }))
  );

  // Seat Maps
  const [seatMaps, setSeatMaps] = useState(null);

  // Validations
  const validateFare = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revalidate_fare', offer_id: offer.id })
      });
      const data = await res.json();
      if (!data.success) {
        setError("This fare is no longer available. Please search again.");
        return false;
      }
      
      const newOffer = data.data;
      if (newOffer.total_amount !== offer.total_amount) {
        setError(`The price has changed from ${offer.total_currency} ${offer.total_amount} to ${newOffer.total_currency} ${newOffer.total_amount}.`);
        // We could update the offer state here in a real app
      }
      
      return true;
    } catch (err) {
      setError("Failed to validate fare: " + err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToSeats = async () => {
    // Validate required fields
    for (const p of passengers) {
      if (!p.given_name || !p.family_name || !p.born_on) {
        setError("Please fill in all passenger details.");
        return;
      }
      if (p.type === 'adult' && (!p.email || !p.phone_number)) {
        setError("Primary adult contact info is required.");
        return;
      }
    }
    
    setError(null);
    
    const isValid = await validateFare();
    if (!isValid) return;

    // Fetch Seat Maps
    setIsLoading(true);
    try {
      const res = await fetch('/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_seat_maps', offer_id: offer.id })
      });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setSeatMaps(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setStep(2);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Validate one last time (simulated)
      // 2. Create Duffel Order
      
      const duffelPassengers = passengers.map(p => {
        let dp = {
          id: p.id,
          title: p.title,
          given_name: p.given_name,
          family_name: p.family_name,
          gender: p.gender,
          born_on: p.born_on
        };
        if (p.email) dp.email = p.email;
        if (p.phone_number) dp.phone_number = p.phone_number;
        return dp;
      });
      
      const res = await fetch('/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book_flight',
          offer_id: offer.id,
          passengers: duffelPassengers,
          payments: [
            {
              type: "balance", // Using Duffel balance for test mode
              amount: offer.total_amount,
              currency: offer.total_currency
            }
          ]
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setStep(4); // Success!
        if (onComplete) onComplete(data.data);
      } else {
        setError(data.message || "Booking failed.");
      }
    } catch (err) {
      setError("Payment processing failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassenger = (id, field, value) => {
    setPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container">
        <button className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center" onClick={onBack}>
          <ChevronLeft size={20} /> Back to Search Results
        </button>
        
        <div className="row">
          <div className="col-lg-8">
            
            {/* Step 1: Traveller Details */}
            {step === 1 && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center"><User className="me-2" /> Traveller Details</h5>
                </div>
                <div className="card-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  
                  {passengers.map((p, idx) => (
                    <div key={p.id} className="mb-4 pb-4 border-bottom">
                      <h6 className="fw-bold mb-3">Passenger {idx + 1} ({p.type})</h6>
                      <div className="row g-3">
                        <div className="col-md-2">
                          <label className="form-label">Title</label>
                          <select className="form-select" value={p.title} onChange={e => updatePassenger(p.id, 'title', e.target.value)}>
                            <option value="mr">Mr</option>
                            <option value="mrs">Mrs</option>
                            <option value="ms">Ms</option>
                            <option value="miss">Miss</option>
                          </select>
                        </div>
                        <div className="col-md-5">
                          <label className="form-label">Given Name</label>
                          <input type="text" className="form-control" value={p.given_name} onChange={e => updatePassenger(p.id, 'given_name', e.target.value)} required />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label">Family Name</label>
                          <input type="text" className="form-control" value={p.family_name} onChange={e => updatePassenger(p.id, 'family_name', e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Date of Birth</label>
                          <input type="date" className="form-control" value={p.born_on} onChange={e => updatePassenger(p.id, 'born_on', e.target.value)} required />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Gender</label>
                          <select className="form-select" value={p.gender} onChange={e => updatePassenger(p.id, 'gender', e.target.value)}>
                            <option value="m">Male</option>
                            <option value="f">Female</option>
                          </select>
                        </div>
                        {p.type === 'adult' && (
                          <>
                            <div className="col-md-6">
                              <label className="form-label">Email</label>
                              <input type="email" className="form-control" value={p.email} onChange={e => updatePassenger(p.id, 'email', e.target.value)} required />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Phone Number (e.g. +44...)</label>
                              <input type="tel" className="form-control" value={p.phone_number} onChange={e => updatePassenger(p.id, 'phone_number', e.target.value)} required />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button className="btn btn-primary px-4 py-2" onClick={handleContinueToSeats} disabled={isLoading}>
                    {isLoading ? 'Validating Fare...' : 'Continue'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: Seats / Addons */}
            {step === 2 && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center"><Armchair className="me-2" /> Seat Selection & Add-ons</h5>
                </div>
                <div className="card-body text-center py-5">
                  {seatMaps ? (
                    <div>
                      <p className="text-muted mb-4">Seat selection is available, but the visual seat map requires a premium integration. For now, we will assign seats at check-in.</p>
                      <button className="btn btn-outline-primary me-3" onClick={() => setStep(1)}>Back</button>
                      <button className="btn btn-primary" onClick={() => setStep(3)}>Skip Seat Selection</button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted mb-4">Seat selection is not available for this flight. The airline may assign a seat during check-in.</p>
                      <button className="btn btn-outline-primary me-3" onClick={() => setStep(1)}>Back</button>
                      <button className="btn btn-primary" onClick={() => setStep(3)}>Continue to Payment</button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center"><CreditCard className="me-2" /> Secure Checkout</h5>
                </div>
                <div className="card-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  
                  <div className="alert alert-info d-flex align-items-center">
                    <AlertTriangle className="me-2" /> 
                    <div>By clicking pay, you agree to the airline fare rules and cancellation conditions. Note: This is a TEST mode booking via Duffel.</div>
                  </div>
                  
                  <form onSubmit={handlePayment}>
                    <div className="mb-3">
                      <label className="form-label">Card Number</label>
                      <input type="text" className="form-control" placeholder="**** **** **** ****" required defaultValue="4242 4242 4242 4242" />
                    </div>
                    <div className="row mb-4">
                      <div className="col-6">
                        <label className="form-label">Expiry Date</label>
                        <input type="text" className="form-control" placeholder="MM/YY" required defaultValue="12/26" />
                      </div>
                      <div className="col-6">
                        <label className="form-label">CVV</label>
                        <input type="text" className="form-control" placeholder="***" required defaultValue="123" />
                      </div>
                    </div>
                    
                    <button type="button" className="btn btn-outline-secondary me-3" onClick={() => setStep(2)}>Back</button>
                    <button type="submit" className="btn btn-success fw-bold px-4" disabled={isLoading}>
                      {isLoading ? 'Processing...' : `Pay ${offer.total_currency} ${offer.total_amount}`}
                    </button>
                  </form>
                </div>
              </div>
            )}
            
            {/* Step 4: Success */}
            {step === 4 && (
              <div className="card shadow-sm border-0 mb-4 text-center py-5">
                <div className="card-body">
                  <CheckCircle size={64} className="text-success mb-3 mx-auto" />
                  <h3 className="fw-bold mb-3">Booking Confirmed!</h3>
                  <p className="text-muted mb-4">Your flight has been successfully booked via the Duffel API.</p>
                  <p className="mb-2"><strong>Duffel Order ID:</strong> (Generated safely in backend)</p>
                  <button className="btn btn-primary mt-4" onClick={() => window.location.href = '/'}>Return Home</button>
                </div>
              </div>
            )}
            
          </div>
          
          <div className="col-lg-4">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white py-3">
                <h6 className="fw-bold mb-0">Fare Summary</h6>
              </div>
              <div className="card-body bg-light">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Base Fare</span>
                  <span>{offer.total_currency} {offer.base_amount}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Taxes & Fees</span>
                  <span>{offer.total_currency} {offer.tax_amount}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between fw-bold fs-5">
                  <span>Total Amount</span>
                  <span className="text-primary">{offer.total_currency} {offer.total_amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
