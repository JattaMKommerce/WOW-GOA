import React from 'react';
import { ArrowLeft, Users, User, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function PackageCheckoutStep2({
  pkg,
  travellers,
  setTravellers,
  numAdults,
  setNumAdults,
  numChildren,
  setNumChildren,
  contactEmail,
  setContactEmail,
  contactPhone,
  setContactPhone,
  isSelfDrivePackage,
  drivingLicense,
  setDrivingLicense,
  vehiclePickupLoc,
  setVehiclePickupLoc,
  vehicleDropLoc,
  setVehicleDropLoc,
  onBack,
  onProceed
}) {
  const updateTravellerCount = (type, increment) => {
    if (type === 'adults') {
      const newCount = numAdults + increment;
      if (newCount < 1 || newCount > 6) return;
      setNumAdults(newCount);
      adjustTravellersArray(newCount, numChildren);
    } else {
      const newCount = numChildren + increment;
      if (newCount < 0 || newCount > 4) return;
      setNumChildren(newCount);
      adjustTravellersArray(numAdults, newCount);
    }
  };

  const adjustTravellersArray = (adults, children) => {
    const total = adults + children;
    let newTravellers = [...travellers];
    
    if (newTravellers.length < total) {
      while (newTravellers.length < total) {
        const isAdult = newTravellers.length < adults;
        newTravellers.push({
          type: isAdult ? 'Adult' : 'Child',
          firstName: '',
          lastName: '',
          gender: '',
          age: '',
          idType: 'Aadhaar'
        });
      }
    } else if (newTravellers.length > total) {
      newTravellers = newTravellers.slice(0, total);
    }
    
    for (let i = 0; i < newTravellers.length; i++) {
        newTravellers[i].type = i < adults ? 'Adult' : 'Child';
    }
    
    setTravellers(newTravellers);
  };

  const handleTravellerChange = (index, field, value) => {
    const updated = [...travellers];
    updated[index][field] = value;
    setTravellers(updated);
  };

  return (
    <div className="container py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <button onClick={onBack} className="btn btn-link text-dark text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 fw-bold">
        <ArrowLeft size={18} /> Back to Itinerary
      </button>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="mb-4">
            <h2 className="fw-extrabold text-dark mb-1">Traveller Details</h2>
            <p className="text-muted small">Please enter details exactly as they appear on your government ID.</p>
          </div>

          <div className="bg-white border rounded shadow-sm mb-4">
             <div className="p-3 border-bottom bg-light">
                 <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-primary"><Users size={18}/> Manage Guests</h6>
             </div>
             <div className="p-4 d-flex gap-5">
                 <div className="d-flex align-items-center justify-content-between flex-grow-1" style={{maxWidth: '250px'}}>
                     <span className="fw-bold">Adults (12+ yrs)</span>
                     <div className="d-flex align-items-center border rounded">
                         <button className="btn btn-sm btn-light px-3 fw-bold" onClick={() => updateTravellerCount('adults', -1)}>-</button>
                         <span className="px-3 fw-bold">{numAdults}</span>
                         <button className="btn btn-sm btn-light px-3 fw-bold" onClick={() => updateTravellerCount('adults', 1)}>+</button>
                     </div>
                 </div>
                 <div className="d-flex align-items-center justify-content-between flex-grow-1" style={{maxWidth: '250px'}}>
                     <span className="fw-bold">Children (2-11 yrs)</span>
                     <div className="d-flex align-items-center border rounded">
                         <button className="btn btn-sm btn-light px-3 fw-bold" onClick={() => updateTravellerCount('children', -1)}>-</button>
                         <span className="px-3 fw-bold">{numChildren}</span>
                         <button className="btn btn-sm btn-light px-3 fw-bold" onClick={() => updateTravellerCount('children', 1)}>+</button>
                     </div>
                 </div>
             </div>
          </div>

          {travellers.map((traveller, idx) => (
              <div key={idx} className="bg-white border rounded shadow-sm mb-4">
                  <div className="p-3 border-bottom bg-light d-flex justify-content-between">
                     <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                         <User size={18} className="text-muted"/> {traveller.type} {idx + 1}
                     </h6>
                     {idx === 0 && <span className="badge bg-success bg-opacity-25 text-success">Lead Traveller</span>}
                  </div>
                  <div className="p-4">
                      <div className="row g-3">
                          <div className="col-md-2">
                             <label className="form-label small fw-bold text-secondary">Title *</label>
                             <select className="form-select" value={traveller.gender} onChange={(e) => handleTravellerChange(idx, 'gender', e.target.value)}>
                                 <option value="">Select</option>
                                 <option value="Mr">Mr</option>
                                 <option value="Ms">Ms</option>
                                 <option value="Mrs">Mrs</option>
                                 <option value="Mstr">Mstr (Child)</option>
                                 <option value="Miss">Miss (Child)</option>
                             </select>
                          </div>
                          <div className="col-md-5">
                             <label className="form-label small fw-bold text-secondary">First & Middle Name *</label>
                             <input type="text" className="form-control" placeholder="e.g. John" value={traveller.firstName} onChange={(e) => handleTravellerChange(idx, 'firstName', e.target.value)} />
                          </div>
                          <div className="col-md-5">
                             <label className="form-label small fw-bold text-secondary">Last Name *</label>
                             <input type="text" className="form-control" placeholder="e.g. Doe" value={traveller.lastName} onChange={(e) => handleTravellerChange(idx, 'lastName', e.target.value)} />
                          </div>
                          <div className="col-md-4">
                             <label className="form-label small fw-bold text-secondary">Age *</label>
                             <input type="number" className="form-control" placeholder="e.g. 30" min={traveller.type === 'Adult' ? 12 : 2} max={traveller.type === 'Adult' ? 100 : 11} value={traveller.age} onChange={(e) => handleTravellerChange(idx, 'age', e.target.value)} />
                          </div>
                      </div>
                  </div>
              </div>
          ))}

          {isSelfDrivePackage && (
            <div className="bg-white border rounded shadow-sm mb-4">
              <div className="p-3 border-bottom bg-light">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-primary"><ShieldCheck size={18}/> Driving License & Location</h6>
              </div>
              <div className="p-4 row g-3">
                  <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Upload Driving License *</label>
                      <div className="d-flex align-items-center gap-2">
                        <input type="file" className="form-control" accept="image/*" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setDrivingLicense(reader.result);
                                };
                                reader.readAsDataURL(file);
                            }
                        }} />
                        {drivingLicense ? (
                          <span className="badge bg-warning text-dark border p-2">Pending Verification</span>
                        ) : (
                          <span className="badge bg-secondary p-2">Not Uploaded</span>
                        )}
                      </div>
                      <small className="text-muted" style={{fontSize:'11px'}}>Required for self-drive vehicle handover. Vendor will verify.</small>
                  </div>
                  <div className="col-md-3">
                      <label className="form-label small fw-bold text-secondary">Pickup Location *</label>
                      <input type="text" className="form-control" placeholder="e.g. Goa Airport" value={vehiclePickupLoc} onChange={(e) => setVehiclePickupLoc(e.target.value)} />
                  </div>
                  <div className="col-md-3">
                      <label className="form-label small fw-bold text-secondary">Drop Location *</label>
                      <input type="text" className="form-control" placeholder="e.g. Calangute" value={vehicleDropLoc} onChange={(e) => setVehicleDropLoc(e.target.value)} />
                  </div>
              </div>
            </div>
          )}

          <div className="bg-white border rounded shadow-sm mb-4">
             <div className="p-3 border-bottom bg-light">
                 <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-primary"><ShieldCheck size={18}/> Contact Details</h6>
             </div>
             <div className="p-4 row g-3">
                 <div className="col-md-6">
                     <label className="form-label small fw-bold text-secondary">Email Address *</label>
                     <div className="input-group">
                         <span className="input-group-text bg-white text-muted"><Mail size={16}/></span>
                         <input type="email" className="form-control" placeholder="john@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                     </div>
                     <small className="text-muted" style={{fontSize:'11px'}}>Your booking voucher will be sent here.</small>
                 </div>
                 <div className="col-md-6">
                     <label className="form-label small fw-bold text-secondary">Mobile Number *</label>
                     <div className="input-group">
                         <span className="input-group-text bg-white text-muted"><Phone size={16}/></span>
                         <input type="tel" className="form-control" placeholder="9876543210" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                     </div>
                     <small className="text-muted" style={{fontSize:'11px'}}>For trip updates and driver details.</small>
                 </div>
             </div>
          </div>

          <div className="d-flex justify-content-end">
              <button className="btn btn-primary btn-lg fw-bold px-5 rounded-pill shadow" onClick={onProceed}>
                  Review & Pay Details
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
