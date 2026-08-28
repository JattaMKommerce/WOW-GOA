import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plane } from 'lucide-react';
import * as api from '../services/api';

export default function AirportAutocomplete({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Sync prop value to internal query if it changes externally
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query && query.length >= 2 && query !== value) {
        setIsLoading(true);
        try {
          // Goa specific mappings
          const goaTerms = ['baga beach', 'calangute', 'north goa', 'panjim', 'goa', 'candolim'];
          const lowerQuery = query.toLowerCase().trim();
          
          let searchTerms = query;
          if (goaTerms.includes(lowerQuery)) {
             searchTerms = "Goa";
          }
          
          const res = await api.searchAirports(searchTerms);
          
          let fetchedSuggestions = res || [];
          if (goaTerms.includes(lowerQuery) && fetchedSuggestions.length > 0) {
              // Add a special "All Airports" option at the top
              fetchedSuggestions = [
                  {
                      name: "Goa - All Airports",
                      iata_code: "GOI", // Sending GOI to Duffel usually searches Dabolim. We can just send GOI.
                      iata_city_code: "GOI",
                      type: "city",
                      city_name: "Goa"
                  },
                  ...fetchedSuggestions.filter(s => s.iata_code === 'GOI' || s.iata_code === 'GOX')
              ];
          }

          setSuggestions(fetchedSuggestions);
          setIsOpen(true);
        } catch (err) {
          console.error("Airport search failed", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (place) => {
    // We prefer IATA code if available
    const code = place.iata_code || place.iata_city_code;
    const displayValue = code ? `${code} - ${place.name}` : place.name;
    setQuery(displayValue);
    onChange(displayValue);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="position-relative w-100">
      <div className="text-muted" style={{ fontSize: '13px' }}>{label}</div>
      <input 
        type="text" 
        className="w-100 border-0 p-0 text-dark fw-bold" 
        style={{ fontSize: '30px', lineHeight: '1.2', background: 'transparent', outline: 'none', boxShadow: 'none' }}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
      />
      {/* Search Input Line */}
      <div style={{ height: '2px', background: '#008cff', width: '30px', marginTop: '10px' }}></div>
      
      {/* Dropdown Results */}
      {isOpen && (
        <div 
          className="position-absolute bg-white shadow rounded mt-2 w-100 z-3" 
          style={{ top: '100%', left: 0, minWidth: '350px', maxHeight: '400px', overflowY: 'auto' }}
        >
          {isLoading && (
            <div className="p-4 text-center text-muted">
              <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
              <div>Searching global airports...</div>
            </div>
          )}
          
          {!isLoading && suggestions.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-muted">
              <Plane size={24} className="mb-2 opacity-50" />
              <div>No valid IATA airports found for "{query}".</div>
            </div>
          )}
          
          {!isLoading && suggestions.length > 0 && (
            <ul className="list-unstyled mb-0">
              {suggestions.map((place) => (
                <li 
                  key={place.id} 
                  className="p-3 border-bottom hover-bg-light cursor-pointer d-flex align-items-center"
                  onClick={() => handleSelect(place)}
                >
                  <div className="me-3 text-muted">
                    {place.type === 'airport' ? <Plane size={18} /> : <MapPin size={18} />}
                  </div>
                  <div>
                    <div className="fw-bold text-dark">{place.name}</div>
                    <div className="text-muted small">{place.city_name}, {place.country_name}</div>
                  </div>
                  {(place.iata_code || place.iata_city_code) && (
                    <div className="ms-auto bg-light rounded px-2 py-1 small fw-bold text-primary">
                      {place.iata_code || place.iata_city_code}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
