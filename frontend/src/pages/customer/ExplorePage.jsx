import React, { useState } from 'react';
import { MapPin, Filter } from 'lucide-react';

export default function ExplorePage({ destinations = [] }) {
  const [regionFilter, setRegionFilter] = useState('All');

  const filteredDestinations = destinations.filter(dest => {
    return regionFilter === 'All' || dest.region === regionFilter;
  });

  return (
    <div className="animate-fade-in-up">
      <div className="section-header">
        <span className="section-tagline">Global Journeys</span>
        <h2 className="section-title">Explore Premium Destinations</h2>
        <p className="text-muted mt-2">Discover curated holiday locations from around the world. Select your next dream getaway.</p>
      </div>

      {/* Region Filters */}
      <div className="filter-bar d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <Filter size={18} className="text-muted" />
          <span className="fw-semibold text-secondary">Region:</span>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button 
            type="button" 
            className={`filter-btn ${regionFilter === 'All' ? 'active' : ''}`}
            onClick={() => setRegionFilter('All')}
          >
            All Destinations
          </button>
          <button 
            type="button" 
            className={`filter-btn ${regionFilter === 'India' ? 'active' : ''}`}
            onClick={() => setRegionFilter('India')}
          >
            India
          </button>
          <button 
            type="button" 
            className={`filter-btn ${regionFilter === 'Middle East' ? 'active' : ''}`}
            onClick={() => setRegionFilter('Middle East')}
          >
            Middle East
          </button>
          <button 
            type="button" 
            className={`filter-btn ${regionFilter === 'Europe' ? 'active' : ''}`}
            onClick={() => setRegionFilter('Europe')}
          >
            Europe
          </button>
          <button 
            type="button" 
            className={`filter-btn ${regionFilter === 'Tropical Islands' ? 'active' : ''}`}
            onClick={() => setRegionFilter('Tropical Islands')}
          >
            Tropical Islands
          </button>
          <button 
            type="button" 
            className={`filter-btn ${regionFilter === 'Asia' ? 'active' : ''}`}
            onClick={() => setRegionFilter('Asia')}
          >
            Asia
          </button>
        </div>
      </div>

      {/* Grid of locations */}
      <div className="row g-4">
        {filteredDestinations.map((dest) => (
          <div key={dest.id} className="col-md-6 col-lg-4">
            <div className="explore-card">
              <img className="explore-card-img" src={dest.image} alt={dest.name} />
              <div className="explore-overlay text-start">
                <span className="explore-tag mb-2">{dest.tag}</span>
                <h3 className="explore-title">{dest.name}</h3>
                <p className="explore-desc">{dest.description}</p>
                <span className="text-warning fw-semibold small d-flex align-items-center gap-1">
                  <MapPin size={14} /> {dest.region}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
