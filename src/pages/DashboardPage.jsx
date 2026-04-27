import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane, Ticket, CreditCard, Bell, Search, Users, Building2,
  TrendingUp, CheckCircle, Clock, MapPin, Plus, BarChart2,
  ShieldCheck, Briefcase, Filter, ChevronDown, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { flightAPI, bookingAPI, paymentAPI, notificationAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime, formatDate, formatDuration } from '../utils/helpers';
import { Badge, LoadingSpinner, EmptyState } from '../components/common';
import SeatMapModal from '../components/seats/SeatMapModal';
import './Dashboard.css';

// ─── Shared Flight Search Panel ───────────────────────────────────────────────
const FlightSearchPanel = ({ onResults, onRequireLogin }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    originAirportCode: '', destinationAirportCode: '',
    departureDate: '', passengers: 1, tripType: 'ONE_WAY',
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [seatMapFlight, setSeatMapFlight] = useState(null);
  const [filters, setFilters] = useState({ maxPrice: '', seatClass: '' });
  const [showFilters, setShowFilters] = useState(false);

  const sf = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await flightAPI.searchFlights({
        origin: form.originAirportCode.toUpperCase(),
        destination: form.destinationAirportCode.toUpperCase(),
        departureDate: form.departureDate,
        passengers: Number(form.passengers),
      });
      setResults(res.data || []);
      setSearched(true);
      if (!(res.data?.length)) toast('No flights found for this route.', { icon: '✈️' });
    } catch { toast.error('Search failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleBook = (flight) => {
    if (!user) { onRequireLogin(); return; }
    navigate('/bookings', { state: { flightId: flight.flightId, flight } });
  };

  const filtered = results.filter(f => {
    if (filters.maxPrice && f.basePrice > Number(filters.maxPrice)) return false;
    return true;
  });

  return (
    <div>
      {/* Search Form */}
      <div className="glass-card search-panel mb-6">
        <div className="search-panel__header">
          <h2 className="section-title">Search Flights</h2>
          <div className="trip-toggle">
            {['ONE_WAY', 'ROUND_TRIP'].map(t => (
              <button key={t} className={`trip-btn ${form.tripType === t ? 'trip-btn--active' : ''}`}
                onClick={() => setForm({ ...form, tripType: t })}>
                {t === 'ONE_WAY' ? 'One Way' : 'Round Trip'}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSearch}>
          <div className="search-grid">
            <div className="form-group search-field" style={{ marginBottom: 0 }}>
              <label className="form-label">From</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--blue-400)' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="DEL" maxLength={3} {...sf('originAirportCode')} required />
              </div>
            </div>
            <div className="form-group search-field" style={{ marginBottom: 0 }}>
              <label className="form-label">To</label>
              <div style={{ position: 'relative' }}>
                <Plane size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--blue-400)' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="BOM" maxLength={3} {...sf('destinationAirportCode')} required />
              </div>
            </div>
            <div className="form-group search-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Departure Date</label>
              <input type="date" className="form-input" min={new Date().toISOString().split('T')[0]} {...sf('departureDate')} required />
            </div>
            {form.tripType === 'ROUND_TRIP' && (
              <div className="form-group search-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Return Date</label>
                <input type="date" className="form-input" min={form.departureDate || new Date().toISOString().split('T')[0]} {...sf('returnDate')} />
              </div>
            )}
            <div className="form-group search-field" style={{ marginBottom: 0 }}>
              <label className="form-label">Passengers</label>
              <input type="number" min={1} max={9} className="form-input" {...sf('passengers')} />
            </div>
            <div className="search-field search-submit-col">
              <button type="submit" className="btn btn-primary btn-lg search-submit-btn" disabled={loading}>
                {loading ? <div className="spinner" /> : <Search size={18} />}
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading && <LoadingSpinner text="Finding best flights…" />}
      {!loading && searched && (
        <div className="glass-card fade-in">
          <div className="results-header">
            <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, color: 'var(--gray-700)' }}>
              {filtered.length} flight{filtered.length !== 1 ? 's' : ''} found
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> Filters <ChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
            </button>
          </div>

          {showFilters && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(37,99,235,0.06)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
                <label className="form-label">Max Price (₹)</label>
                <input type="number" className="form-input" placeholder="e.g. 5000" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
                <label className="form-label">Class</label>
                <select className="form-select" value={filters.seatClass} onChange={e => setFilters({ ...filters, seatClass: e.target.value })}>
                  <option value="">All Classes</option>
                  <option value="ECONOMY">Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First</option>
                </select>
              </div>
            </div>
          )}

          {filtered.length === 0
            ? <EmptyState icon={Plane} title="No flights match your filters" />
            : filtered.map(flight => (
              <SearchFlightCard
                key={flight.flightId}
                flight={flight}
                onBook={() => handleBook(flight)}
                onSeatMap={() => setSeatMapFlight(flight)}
                isLoggedIn={!!user}
              />
            ))
          }
        </div>
      )}

      {seatMapFlight && <SeatMapModal flight={seatMapFlight} onClose={() => setSeatMapFlight(null)} />}
    </div>
  );
};

const SearchFlightCard = ({ flight, onBook, onSeatMap, isLoggedIn }) => (
  <div className="flight-result-card">
    <div className="flight-result-card__route">
      <div className="flight-result-card__airport">
        <span className="flight-result-card__code">{flight.originAirportCode}</span>
        <span className="flight-result-card__time">{formatDateTime(flight.departureTime)?.split(',')[1]?.trim()}</span>
      </div>
      <div className="flight-result-card__line">
        <span className="flight-result-card__duration">{formatDuration(flight.durationMinutes)}</span>
        <div className="flight-result-card__ruler">
          <Plane size={11} style={{ color: 'var(--blue-600)' }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Direct</span>
      </div>
      <div className="flight-result-card__airport">
        <span className="flight-result-card__code">{flight.destinationAirportCode}</span>
        <span className="flight-result-card__time">{formatDateTime(flight.arrivalTime)?.split(',')[1]?.trim()}</span>
      </div>
    </div>
    <div className="flight-result-card__info">
      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{flight.flightNumber} · {flight.aircraftType}</div>
      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{flight.availableSeats} seats left</div>
    </div>
    <div className="flight-result-card__right">
      <Badge status={flight.status} />
      <div className="flight-result-card__price">{formatCurrency(flight.basePrice)}</div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={onSeatMap}><MapPin size={13} /> Seats</button>
        <button className="btn btn-primary btn-sm" onClick={onBook}>
          {isLoggedIn ? <><Ticket size={13} /> Book</> : <><ArrowRight size={13} /> Login to Book</>}
        </button>
      </div>
    </div>
  </div>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card fade-in">
    <div className="stat-icon" style={{ background: color }}><Icon size={22} color="white" /></div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>{sub}</div>}
  </div>
);

// ─── PASSENGER DASHBOARD ───────────────────────────────────────────────────────
const PassengerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) return;
    Promise.allSettled([
      bookingAPI.getBookingsByUser(user.userId),
      paymentAPI.getPaymentsByUser(user.userId),
      notificationAPI.getUnreadCount(user.userId),
    ]).then(([b, p, uc]) => {
      if (b.status === 'fulfilled') setBookings(b.value.data || []);
      if (p.status === 'fulfilled') setPayments(p.value.data || []);
      if (uc.status === 'fulfilled') setUnreadCount(uc.value.data || 0);
    }).finally(() => setLoading(false));
  }, [user]);

  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const totalSpend = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const upcoming = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').slice(0, 3);

  return (
    <div>
      <div className="grid-4 mb-6">
        <StatCard icon={Ticket}      label="Total Bookings" value={bookings.length} color="linear-gradient(135deg,#3b82f6,#2563eb)" />
        <StatCard icon={CheckCircle} label="Confirmed"      value={confirmed}       color="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard icon={CreditCard}  label="Total Spent"    value={formatCurrency(totalSpend)} color="linear-gradient(135deg,#6366f1,#4338ca)" sub="All time" />
        <StatCard icon={Bell}        label="Unread Alerts"  value={unreadCount}     color="linear-gradient(135deg,#f59e0b,#d97706)" />
      </div>
      <div className="dashboard-grid">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Upcoming Trips</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')}>View all</button>
          </div>
          {loading ? <LoadingSpinner /> : upcoming.length === 0
            ? <EmptyState icon={Ticket} title="No upcoming trips" description="Search for flights above to book!" />
            : upcoming.map(b => (
              <div key={b.bookingId} className="booking-row" onClick={() => navigate('/bookings')}>
                <div className="booking-row__icon"><Plane size={16} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>PNR: {b.pnrCode}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{formatDate(b.bookedAt)} · {b.numberOfPassengers} pax · {formatCurrency(b.totalFare)}</div>
                </div>
                <Badge status={b.status} />
              </div>
            ))
          }
        </div>
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Recent Payments</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payments')}>View all</button>
          </div>
          {loading ? <LoadingSpinner /> : payments.length === 0
            ? <EmptyState icon={CreditCard} title="No payments yet" />
            : payments.slice(0, 4).map(p => (
              <div key={p.paymentId} className="payment-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.razorpayPaymentId || p.paymentId?.substring(0, 14) + '…'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{formatDateTime(p.createdAt)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--blue-700)', fontFamily: 'var(--font-primary)' }}>{formatCurrency(p.amount)}</div>
                  <Badge status={p.status} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ─── STAFF DASHBOARD ───────────────────────────────────────────────────────────
const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([bookingAPI.getBookingsByUser(user?.userId)]).then(([b]) => {
      if (b.status === 'fulfilled') setBookings(b.value.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="role-welcome-banner staff-banner">
        <Briefcase size={28} />
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '18px' }}>Airline Staff Dashboard</div>
          <div style={{ fontSize: '13px', opacity: 0.85 }}>Manage flights, passengers, and operations</div>
        </div>
      </div>
      <div className="grid-3 mb-6">
        <StatCard icon={Ticket}    label="Bookings"  value={bookings.length}                                           color="linear-gradient(135deg,#3b82f6,#2563eb)" />
        <StatCard icon={Building2} label="Airlines"  value="Manage"                                                   color="linear-gradient(135deg,#6366f1,#4338ca)" sub="Click to open" />
        <StatCard icon={MapPin}    label="Airports"  value="Manage"                                                   color="linear-gradient(135deg,#10b981,#059669)" sub="Click to open" />
      </div>
      <div className="dashboard-grid">
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Quick Actions</h2>
          </div>
          {[
            { icon: Building2, label: 'Manage Airlines', desc: 'Add/edit airline records', path: '/airlines', color: '#a855f7' },
            { icon: MapPin,    label: 'Manage Airports', desc: 'Create/update airports', path: '/airports', color: '#6366f1' },
            { icon: Users,     label: 'View Passengers', desc: 'Look up passenger manifest', path: '/passengers', color: '#10b981' },
            { icon: Ticket,    label: 'View Bookings',   desc: 'All booking records', path: '/bookings', color: '#f59e0b' },
          ].map(({ icon: Icon, label, desc, path, color }) => (
            <div key={path} className="quick-action-row" onClick={() => navigate(path)}>
              <div className="quick-action-icon" style={{ background: color + '22', color }}><Icon size={18} /></div>
              <div><div style={{ fontWeight: 600, fontSize: '14px' }}>{label}</div><div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{desc}</div></div>
              <ArrowRight size={16} style={{ marginLeft: 'auto', color: 'var(--gray-300)' }} />
            </div>
          ))}
        </div>
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Recent Bookings</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')}>View all</button>
          </div>
          {loading ? <LoadingSpinner /> : bookings.length === 0
            ? <EmptyState icon={Ticket} title="No bookings found" />
            : bookings.slice(0, 5).map(b => (
              <div key={b.bookingId} className="booking-row">
                <div className="booking-row__icon"><Ticket size={15} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>PNR: {b.pnrCode}</div>
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{formatCurrency(b.totalFare)} · {b.numberOfPassengers} pax</div>
                </div>
                <Badge status={b.status} />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      bookingAPI.getBookingsByUser(user?.userId),
      paymentAPI.getPaymentsByUser(user?.userId),
    ]).then(([b, p]) => {
      if (b.status === 'fulfilled') setBookings(b.value.data || []);
      if (p.status === 'fulfilled') setPayments(p.value.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const totalRev = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED').length;
  const cancelled = bookings.filter(b => b.status === 'CANCELLED').length;

  return (
    <div>
      <div className="role-welcome-banner admin-banner">
        <ShieldCheck size={28} />
        <div>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 800, fontSize: '18px' }}>Admin Control Panel</div>
          <div style={{ fontSize: '13px', opacity: 0.85 }}>Platform-wide management and analytics</div>
        </div>
      </div>
      <div className="grid-4 mb-6">
        <StatCard icon={Ticket}     label="Total Bookings" value={bookings.length}           color="linear-gradient(135deg,#3b82f6,#2563eb)" />
        <StatCard icon={CheckCircle}label="Confirmed"      value={confirmed}                  color="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard icon={TrendingUp} label="Revenue"        value={formatCurrency(totalRev)}   color="linear-gradient(135deg,#6366f1,#4338ca)" />
        <StatCard icon={BarChart2}  label="Cancelled"      value={cancelled}                  color="linear-gradient(135deg,#ef4444,#dc2626)" />
      </div>
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Platform Management</h2>
          {[
            { icon: Building2, label: 'Airlines',   path: '/airlines',   color: '#a855f7' },
            { icon: MapPin,    label: 'Airports',   path: '/airports',   color: '#6366f1' },
            { icon: Users,     label: 'Passengers', path: '/passengers', color: '#10b981' },
          ].map(({ icon: Icon, label, path, color }) => (
            <div key={path} className="quick-action-row" onClick={() => navigate(path)}>
              <div className="quick-action-icon" style={{ background: color + '22', color }}><Icon size={16} /></div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{label}</div>
              <ArrowRight size={14} style={{ marginLeft: 'auto', color: 'var(--gray-300)' }} />
            </div>
          ))}
        </div>
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">All Bookings</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')}>View all</button>
          </div>
          {loading ? <LoadingSpinner /> : bookings.slice(0, 4).map(b => (
            <div key={b.bookingId} className="booking-row">
              <div className="booking-row__icon"><Ticket size={14} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>PNR: {b.pnrCode}</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{formatCurrency(b.totalFare)}</div>
              </div>
              <Badge status={b.status} />
            </div>
          ))}
        </div>
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title">Payments</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/payments')}>View all</button>
          </div>
          {loading ? <LoadingSpinner /> : payments.slice(0, 4).map(p => (
            <div key={p.paymentId} className="payment-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.paymentId?.substring(0, 12)}…</div>
                <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{formatDateTime(p.createdAt)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--blue-700)', fontSize: '13px', fontFamily: 'var(--font-primary)' }}>{formatCurrency(p.amount)}</div>
                <Badge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── GUEST DASHBOARD ───────────────────────────────────────────────────────────
const GuestDashboard = ({ onRequireLogin }) => (
  <div>
    <div className="guest-hero">
      <div className="guest-hero__content">
        <h1 className="guest-hero__title">Search. Book. <span>Fly.</span></h1>
        <p className="guest-hero__sub">Find the best flights across hundreds of routes. No account needed to search — sign in to book.</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button className="btn btn-primary btn-lg" onClick={onRequireLogin}>
            <Ticket size={16} /> Sign In to Book
          </button>
          <button className="btn btn-secondary btn-lg" onClick={onRequireLogin}>
            <Plus size={16} /> Register Free
          </button>
        </div>
      </div>
      <div className="guest-hero__badges">
        {[['✈️', 'Search free'], ['🎫', 'Book tickets'], ['💺', 'Choose seats'], ['📲', 'Get alerts']].map(([e, l]) => (
          <div key={l} className="guest-badge"><span>{e}</span><span style={{ fontSize: '12px' }}>{l}</span></div>
        ))}
      </div>
    </div>
  </div>
);

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleRequireLogin = () => navigate('/login');

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  };

  const renderRoleDashboard = () => {
    if (!user) return null;
    if (isAdmin()) return <AdminDashboard />;
    if (isStaff()) return <StaffDashboard />;
    return <PassengerDashboard />;
  };

  return (
    <div className="page-wrapper">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          {user ? (
            <>
              <h1 className="page-title">
                Good {getGreeting()}, {user.fullName || user.email?.split('@')[0]} ✈️
              </h1>
              <p style={{ color: 'var(--gray-500)', marginTop: '4px', fontSize: '14px' }}>
                {isAdmin() ? 'Platform administrator overview' : isStaff() ? 'Airline operations dashboard' : "Here's your travel overview"}
              </p>
            </>
          ) : (
            <>
              <h1 className="page-title">Welcome to AirNexus ✈️</h1>
              <p style={{ color: 'var(--gray-500)', marginTop: '4px', fontSize: '14px' }}>
                Search flights for free — sign in to book
              </p>
            </>
          )}
        </div>
        {!user && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>Register</button>
          </div>
        )}
      </div>

      {/* Guest hero (only for guests) */}
      {!user && <GuestDashboard onRequireLogin={handleRequireLogin} />}

      {/* Flight search — available to ALL users (guest + logged in) */}
      <FlightSearchPanel onResults={() => {}} onRequireLogin={handleRequireLogin} />

      {/* Role-based dashboard sections */}
      {renderRoleDashboard()}
    </div>
  );
};

export default DashboardPage;
