import React from 'react';
import { 
  Building2, Calendar, CheckCircle2, Clock, XCircle, DollarSign, Gift, Tag, 
  TrendingUp, ArrowUpRight, Hotel, Car, Compass, ChevronRight, Users, 
  ShieldCheck, Wallet, Plane, Wand2, ArrowRight, Lock, AlertCircle
} from 'lucide-react';

export default function B2BDashboardTab({ 
  dashboardData, 
  partnerUser,
  onNavigateTab, 
  onSelectService 
}) {
  const metrics = dashboardData?.metrics || {};
  const recentBookings = metrics.recent_bookings || [];

  const hasCommission = Boolean(partnerUser?.allow_commission);
  const hasNonCommission = Boolean(partnerUser?.allow_non_commission);
  const isPendingMode = (partnerUser?.mode_request_status === 'PENDING');
  const requestedMode = partnerUser?.requested_mode;

  return (
    <div className="animate-fade-in">
      {/* Welcome Hero Banner */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
        <div className="p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-warning text-dark text-xxs fw-bold px-2.5 py-1 rounded-pill">
                OFFICIAL B2B PARTNER
              </span>
              <span className="text-white-50 text-xs">Partner ID: {metrics.partner_id || partnerUser?.id}</span>
            </div>
            <h3 className="fw-black font-heading mb-1 text-white">
              {metrics.company_name || partnerUser?.company_name || 'Partner Travel Agency'}
            </h3>
            <p className="text-white-50 text-xs mb-0">
              WOW GOA Centralized B2B Distribution & Live Reservation Engine
            </p>
          </div>

          {/* Quick Mode Access Buttons (Strictly filtered by Admin permissions) */}
          <div className="d-flex gap-2 flex-wrap">
            {hasCommission && (
              <button 
                onClick={() => onNavigateTab('commission_services')}
                className="btn btn-warning text-dark fw-bold rounded-pill px-3.5 py-2 text-xs d-flex align-items-center gap-1.5 shadow-sm font-heading"
              >
                <Gift size={15} />
                <span>Commission Channel ({partnerUser?.default_commission_rate || 10}%)</span>
              </button>
            )}

            {hasNonCommission && (
              <button 
                onClick={() => onNavigateTab('non_commission_services')}
                className="btn btn-primary text-white fw-bold rounded-pill px-3.5 py-2 text-xs d-flex align-items-center gap-1.5 shadow-sm font-heading"
              >
                <Tag size={15} />
                <span>Net Wholesale Channel ({partnerUser?.default_net_discount_rate || 10}% OFF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mode Status & Pending Alert Banner (Case 4) */}
      {isPendingMode && (
        <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 bg-white border-start border-4 border-warning">
          <div className="d-flex align-items-start gap-3">
            <div className="p-2 rounded-circle bg-warning bg-opacity-20 text-warning">
              <Clock size={20} />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill">
                  ADMIN REVIEW IN PROGRESS
                </span>
                <span className="fw-bold text-dark text-xs font-heading">
                  Request for {requestedMode === 'COMMISSION' ? 'Commission Mode' : 'Non-Commission Net Mode'} Submitted
                </span>
              </div>
              <p className="text-muted text-xs mb-0 leading-relaxed">
                Your request to access the secondary pricing mode is currently under administrative verification. 
                You continue to have full access to your approved channel while the second mode remains locked.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('profile')}
              className="btn btn-outline-dark btn-xs rounded-pill px-3 py-1 text-xxs fw-semibold text-nowrap"
            >
              View Request Status
            </button>
          </div>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-primary h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted text-xxs fw-bold text-uppercase">Total Bookings</div>
                <div className="fs-3 fw-black text-dark font-heading mt-1">{metrics.total_bookings || 0}</div>
                <div className="text-muted text-xxs mt-0.5">
                  <span className="text-success fw-semibold">{metrics.completed_bookings || 0} completed</span> • <span className="text-warning fw-semibold">{metrics.upcoming_bookings || 0} upcoming</span>
                </div>
              </div>
              <div className="rounded-3 p-2.5 bg-primary bg-opacity-10 text-primary">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Commission KPI card (only if commission is enabled) */}
        {hasCommission && (
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-success h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted text-xxs fw-bold text-uppercase">Commission Earned</div>
                  <div className="fs-3 fw-black text-success font-heading mt-1">
                    ₹{(metrics.total_commission_earned || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-muted text-xxs mt-0.5">
                    ₹{(metrics.total_commission_pending || 0).toLocaleString('en-IN')} accrued pending
                  </div>
                </div>
                <div className="rounded-3 p-2.5 bg-success bg-opacity-10 text-success">
                  <Gift size={20} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Net Bookings KPI card (only if non-commission is enabled) */}
        {hasNonCommission && (
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-info h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted text-xxs fw-bold text-uppercase">Net Bookings Volume</div>
                  <div className="fs-3 fw-black text-dark font-heading mt-1">
                    {metrics.non_commission_bookings || 0}
                  </div>
                  <div className="text-muted text-xxs mt-0.5">
                    Wholesale B2B purchases
                  </div>
                </div>
                <div className="rounded-3 p-2.5 bg-info bg-opacity-10 text-info">
                  <Tag size={20} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-warning h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="text-muted text-xxs fw-bold text-uppercase">Total Sales Volume</div>
                <div className="fs-3 fw-black text-dark font-heading mt-1">
                  ₹{(metrics.total_sales_volume || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-muted text-xxs mt-0.5">
                  Across all WOW Goa inventory
                </div>
              </div>
              <div className="rounded-3 p-2.5 bg-warning bg-opacity-10 text-dark">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Website Services Direct Showcase */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-0 text-dark font-heading">WOW GOA Service Distribution</h5>
            <span className="text-muted text-xs">Direct access to live shared inventory across all product categories</span>
          </div>
          <span className="badge bg-light text-muted border text-xxs">
            Real-Time D2C + B2B Database Sync
          </span>
        </div>

        <div className="row g-3">
          {/* Self Drive */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('selfdrive')}
              className="p-3.5 rounded-4 border border-light-subtle h-100 cursor-pointer transition-all hover-shadow-md bg-light d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="rounded-3 p-2 bg-dark text-white">
                    <Car size={20} />
                  </div>
                  <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill">Popular</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1">Self Drive Holidays</h6>
                <p className="text-muted text-xxs mb-0 leading-relaxed">
                  Interactive booking with pickup/drop airports, chauffeur options, and car specs.
                </p>
              </div>
              <div className="pt-3 d-flex align-items-center justify-content-between text-warning fw-bold text-xs">
                <span>Book Vehicle</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Trip Packages */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('packages')}
              className="p-3.5 rounded-4 border border-light-subtle h-100 cursor-pointer transition-all hover-shadow-md bg-light d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="rounded-3 p-2 bg-dark text-white">
                    <Compass size={20} />
                  </div>
                  <span className="badge bg-primary text-white text-xxs fw-bold px-2 py-0.5 rounded-pill">Packages</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1">Trip Packages & Tours</h6>
                <p className="text-muted text-xxs mb-0 leading-relaxed">
                  Day-wise itineraries, North/South Goa sightseeing, watersports, and boat cruises.
                </p>
              </div>
              <div className="pt-3 d-flex align-items-center justify-content-between text-primary fw-bold text-xs">
                <span>Browse Packages</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Hotels */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div 
              onClick={() => onSelectService('hotels')}
              className="p-3.5 rounded-4 border border-light-subtle h-100 cursor-pointer transition-all hover-shadow-md bg-light d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="rounded-3 p-2 bg-dark text-white">
                    <Hotel size={20} />
                  </div>
                  <span className="badge bg-success text-white text-xxs fw-bold px-2 py-0.5 rounded-pill">Stays</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1">Hotels & Beach Resorts</h6>
                <p className="text-muted text-xxs mb-0 leading-relaxed">
                  Live inventory of luxury resorts, beachside villas, boutique suites, and amenities.
                </p>
              </div>
              <div className="pt-3 d-flex align-items-center justify-content-between text-success fw-bold text-xs">
                <span>Reserve Room</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Flights */}
          <div className="col-12 col-sm-6 col-lg-6">
            <div 
              onClick={() => onSelectService('flights')}
              className="p-3.5 rounded-4 border border-light-subtle h-100 cursor-pointer transition-all hover-shadow-md bg-light d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="rounded-3 p-2 bg-dark text-white">
                    <Plane size={20} />
                  </div>
                  <span className="badge bg-info text-white text-xxs fw-bold px-2 py-0.5 rounded-pill">Airlines</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1">Domestic & Regional Flights</h6>
                <p className="text-muted text-xxs mb-0 leading-relaxed">
                  Flight connections into Goa (GOI / GOX) and major Indian metro hubs.
                </p>
              </div>
              <div className="pt-3 d-flex align-items-center justify-content-between text-info fw-bold text-xs">
                <span>View Flights</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Craft My Trip */}
          <div className="col-12 col-sm-6 col-lg-6">
            <div 
              onClick={() => onSelectService('craft')}
              className="p-3.5 rounded-4 border border-light-subtle h-100 cursor-pointer transition-all hover-shadow-md bg-light d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="rounded-3 p-2 bg-dark text-white">
                    <Wand2 size={20} />
                  </div>
                  <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill">Bespoke</span>
                </div>
                <h6 className="fw-bold text-dark font-heading mb-1">Craft My Trip (Tailor-Made)</h6>
                <p className="text-muted text-xxs mb-0 leading-relaxed">
                  Custom itineraries combining hotels, vehicle rentals, flights, and specialized activities.
                </p>
              </div>
              <div className="pt-3 d-flex align-items-center justify-content-between text-warning fw-bold text-xs">
                <span>Customize Trip</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <h5 className="fw-bold mb-0 text-dark font-heading">Recent Agency Reservations</h5>
          <button
            onClick={() => onNavigateTab(hasCommission ? 'commission_bookings' : 'non_commission_bookings')}
            className="btn btn-outline-dark btn-xs rounded-pill px-3 py-1 text-xxs fw-semibold"
          >
            View Full Ledger
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <Calendar size={32} className="mx-auto text-muted opacity-50 mb-2 d-block" />
            <p className="mb-0 text-xs fw-semibold text-dark">No recent bookings found</p>
            <span className="text-xxs">New bookings created under your account will appear here immediately.</span>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-xs">
              <thead className="table-light text-muted text-uppercase text-xxs">
                <tr>
                  <th className="ps-2">ID</th>
                  <th>Service</th>
                  <th>Guest</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th className="pe-2 text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.slice(0, 5).map(b => (
                  <tr key={b.id}>
                    <td className="ps-2 font-monospace fw-bold text-dark">#{b.id}</td>
                    <td className="text-truncate" style={{ maxWidth: '180px' }}>{b.item_name}</td>
                    <td>{b.name}</td>
                    <td>
                      <span className={`badge ${b.b2b_mode === 'COMMISSION' ? 'bg-warning text-dark' : 'bg-primary text-white'} text-xxs`}>
                        {b.b2b_mode || 'B2B'}
                      </span>
                    </td>
                    <td className="fw-bold text-dark">₹{parseFloat(b.total_amount || 0).toLocaleString()}</td>
                    <td className="pe-2 text-end">
                      <span className="badge bg-success bg-opacity-15 text-success border border-success text-xxs px-2 py-0.5 rounded-pill">
                        {b.status || 'Confirmed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
