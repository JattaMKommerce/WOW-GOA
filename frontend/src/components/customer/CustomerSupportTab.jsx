import React, { useState } from 'react';
import {
  HelpCircle, MessageCircle, Phone, Mail, Send, CheckCircle2,
  AlertCircle, ChevronDown, ChevronRight, Compass, ShieldCheck, MapPin
} from 'lucide-react';

export default function CustomerSupportTab({
  currentUser,
  bookings = []
}) {
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketData, setTicketData] = useState({
    bookingId: '',
    category: 'Self Drive Support',
    subject: '',
    message: ''
  });

  const [activeFaq, setActiveFaq] = useState(null);

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketData({ bookingId: '', category: 'Self Drive Support', subject: '', message: '' });
    }, 4000);
  };

  const FAQS = [
    {
      q: 'What documents are required at Self Drive vehicle pickup in Goa?',
      a: 'You will need a valid Original Indian Driving License (or International Driving Permit for foreign nationals) and an Aadhaar Card / Passport for identity verification. Digital inspection is completed within 2 minutes.'
    },
    {
      q: 'Is there any security deposit for Self Drive cars and bikes?',
      a: 'WOW GOA provides Zero Security Deposit on verified bookings! For select premium luxury cars (BMW, Audi, Thar), a minor refundable pre-authorization is refunded back to your wallet / original method upon vehicle return.'
    },
    {
      q: 'Can I pick up the vehicle at Goa Airport (GOI or GOX) and drop in North Goa?',
      a: 'Yes! All WOW GOA Self Drive Holiday packages support flexible airport delivery and hotel return with free doorstep delivery across North and South Goa.'
    },
    {
      q: 'What is the fuel policy for Self Drive vehicles?',
      a: 'We follow a Same-to-Same Fuel Policy. You receive the vehicle with a specific fuel level and simply return it with the same level.'
    },
    {
      q: 'What happens if my flight or arrival is delayed?',
      a: 'Do not worry! Our Goa logistics team tracks your flight status in real time. Your assigned vehicle and representative will be waiting at the arrival terminal regardless of delays.'
    }
  ];

  return (
    <div className="customer-tab-content animate-fade-in">
      
      {/* ─── Header ─── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h4 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '22px' }}>
            Customer Support & Help Desk
          </h4>
          <p className="text-muted text-xs mb-0">
            24/7 dedicated traveler support, on-road assistance, and trip coordination across Goa.
          </p>
        </div>
      </div>

      {/* ─── Direct Contact Channels ─── */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white h-100" style={{ border: '1px solid #eef2f6' }}>
            <div className="rounded-circle p-3 bg-success bg-opacity-10 text-success d-inline-flex mx-auto mb-2">
              <MessageCircle size={26} />
            </div>
            <h6 className="fw-bold text-dark mb-1 font-heading">WhatsApp Concierge</h6>
            <p className="text-muted text-xxs mb-3">Instant on-road support & vehicle assistance</p>
            <a 
              href="https://wa.me/919876543210?text=Hi%20WOW%20GOA%20Team%2C%20I%20need%20assistance"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-success fw-bold rounded-pill px-3 py-2 text-xs d-flex align-items-center justify-content-center gap-1.5 mt-auto"
            >
              <MessageCircle size={14} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white h-100" style={{ border: '1px solid #eef2f6' }}>
            <div className="rounded-circle p-3 bg-primary bg-opacity-10 text-primary d-inline-flex mx-auto mb-2">
              <Phone size={26} />
            </div>
            <h6 className="fw-bold text-dark mb-1 font-heading">24/7 Goa Helpline</h6>
            <p className="text-muted text-xxs mb-3">+91 98765 43210 (Toll Free)</p>
            <a 
              href="tel:+919876543210"
              className="btn btn-sm btn-dark fw-bold rounded-pill px-3 py-2 text-xs d-flex align-items-center justify-content-center gap-1.5 mt-auto"
            >
              <Phone size={14} className="text-warning" />
              <span>Call Operations Desk</span>
            </a>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center bg-white h-100" style={{ border: '1px solid #eef2f6' }}>
            <div className="rounded-circle p-3 bg-warning bg-opacity-10 text-warning d-inline-flex mx-auto mb-2">
              <Mail size={26} />
            </div>
            <h6 className="fw-bold text-dark mb-1 font-heading">Email Support</h6>
            <p className="text-muted text-xxs mb-3">support@wowgoa.com</p>
            <a 
              href="mailto:support@wowgoa.com"
              className="btn btn-sm btn-light border text-dark fw-bold rounded-pill px-3 py-2 text-xs d-flex align-items-center justify-content-center gap-1.5 mt-auto"
            >
              <Mail size={14} />
              <span>Send an Email</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── Support Ticket & FAQ Section ─── */}
      <div className="row g-4">
        
        {/* Left Column: Raise Issue / Ticket */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100" style={{ border: '1px solid #eef2f6' }}>
            <h6 className="fw-bold text-dark mb-2 font-heading">Raise a Support Ticket / Inquiry</h6>
            <p className="text-muted text-xs mb-3">Our concierge desk will review and reply within 15 minutes.</p>

            {ticketSubmitted && (
              <div className="alert alert-success border-0 rounded-3 p-3 text-xs d-flex align-items-center gap-2 mb-3">
                <CheckCircle2 size={16} />
                <span>Ticket registered! Support ID: #TKT-{Math.floor(1000 + Math.random() * 9000)}. Our team is contacting you.</span>
              </div>
            )}

            <form onSubmit={handleTicketSubmit}>
              <div className="mb-2.5">
                <label className="form-label text-xs fw-bold text-muted">Related Booking</label>
                <select 
                  className="form-select text-xs"
                  value={ticketData.bookingId}
                  onChange={(e) => setTicketData({ ...ticketData, bookingId: e.target.value })}
                >
                  <option value="">General Inquiry / Future Booking</option>
                  {bookings.map((b, i) => (
                    <option key={b.id || i} value={b.id || `WOW-${i}`}>
                      Booking #{b.id || `WOW-${i}`} — {b.item_name || b.package_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2.5">
                <label className="form-label text-xs fw-bold text-muted">Issue Category</label>
                <select 
                  className="form-select text-xs"
                  value={ticketData.category}
                  onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                >
                  <option value="Self Drive Support">Self Drive Vehicle Support / Delivery</option>
                  <option value="Chauffeur Service">Chauffeur / Driver Assignment</option>
                  <option value="Hotel Voucher">Hotel Check-in & Resort Voucher</option>
                  <option value="Payments">Payment & Refund Inquiries</option>
                  <option value="Other">Other Travel Questions</option>
                </select>
              </div>

              <div className="mb-2.5">
                <label className="form-label text-xs fw-bold text-muted">Subject</label>
                <input 
                  type="text"
                  className="form-control text-xs"
                  placeholder="e.g. Need to adjust airport pickup time"
                  value={ticketData.subject}
                  onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-xs fw-bold text-muted">Your Message</label>
                <textarea 
                  className="form-control text-xs"
                  rows="3"
                  placeholder="Describe your request or question in detail..."
                  value={ticketData.message}
                  onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-warning text-dark fw-bold rounded-pill w-100 py-2 text-xs d-flex align-items-center justify-content-center gap-1.5 shadow-sm">
                <Send size={14} />
                <span>Submit Ticket to WOW GOA Desk</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Self Drive & Travel FAQs */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100" style={{ border: '1px solid #eef2f6' }}>
            <h6 className="fw-bold text-dark mb-2 font-heading">Frequently Asked Questions</h6>
            <p className="text-muted text-xs mb-3">Quick answers for self drive holidays and Goa travel.</p>

            <div className="d-flex flex-column gap-2">
              {FAQS.map((faq, fIdx) => {
                const isOpen = activeFaq === fIdx;
                return (
                  <div key={fIdx} className="rounded-3 border overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : fIdx)}
                      className="btn w-100 text-start p-3 d-flex justify-content-between align-items-center bg-light text-xs fw-bold text-dark border-0"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {isOpen && (
                      <div className="p-3 bg-white text-xs text-muted border-top">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
