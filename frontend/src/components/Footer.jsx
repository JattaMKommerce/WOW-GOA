import React from 'react';
import { Compass } from 'lucide-react';
import { useSiteConfig } from '../context/SiteConfigContext';

export default function Footer({ setActiveTab }) {
  const { liveConfig } = useSiteConfig();
  const footerLinks = liveConfig?.menus?.footer || [];
  return (
    <footer className="premium-footer">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4 text-start">
            <a className="navbar-brand d-flex align-items-center mb-3" href="/" onClick={(e) => { e.preventDefault(); setActiveTab('cars'); }}>
              <Compass size={24} className="text-warning me-2" />
              <span className="text-white fw-bold">TripGalileo</span>
            </a>
            <p className="small text-muted">
              TripGalileo is Goa's leading luxury vehicle rental and curated holiday booking portal. Experience seamless self-drive freedom.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a href="#" aria-label="Facebook" className="text-white opacity-75 hover-opacity-100"><i className="bi bi-facebook fs-5 text-white"></i></a>
              <a href="#" aria-label="Instagram" className="text-white opacity-75 hover-opacity-100"><i className="bi bi-instagram fs-5 text-white"></i></a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-white opacity-75 hover-opacity-100"><i className="bi bi-youtube fs-5 text-white"></i></a>
            </div>
          </div>
          <div className="col-6 col-lg-2 text-start">
            <h5 className="text-white fs-6 mb-3">Rentals</h5>
            <ul className="list-unstyled">
              <li><a href="#search" onClick={() => setActiveTab('cars')} className="footer-link">Cars Rental</a></li>
              <li><a href="#search" onClick={() => setActiveTab('bikes')} className="footer-link">Bikes Rental</a></li>
              <li><a href="#search" onClick={() => setActiveTab('hotels')} className="footer-link">Luxury Hotels</a></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2 text-start">
            <h5 className="text-white fs-6 mb-3">Links</h5>
            <ul className="list-unstyled">
              {footerLinks.map(link => (
                <li key={link.id}>
                  <a 
                    href={link.href} 
                    className="footer-link"
                    onClick={(e) => {
                      if(link.href.startsWith('/')) {
                        e.preventDefault();
                        setActiveTab(link.id);
                        window.history.pushState({}, '', link.href);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-lg-4 text-start">
            <h5 className="text-white fs-6 mb-3">Contact Support</h5>
            <p className="small text-muted mb-2"><i className="bi bi-geo-alt me-2 text-warning"></i> Calangute Beach Road, Goa, 403516</p>
            <p className="small text-muted mb-2"><i className="bi bi-telephone me-2 text-warning"></i> +91 98765 43210</p>
            <p className="small text-muted"><i className="bi bi-envelope me-2 text-warning"></i> support@tripgalileo.com</p>
          </div>
        </div>
        <div className="border-top border-secondary pt-3 text-center small text-muted">
          &copy; 2026 TripGalileo. All rights reserved. Built for beautiful Goan holidays.
        </div>
      </div>
    </footer>
  );
}
