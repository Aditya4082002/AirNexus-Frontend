import React, { useEffect, useState, useRef } from 'react';
import { Ticket, Search, Plus, Users, X, Plane, MapPin, Calendar, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI, passengerAPI, flightAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatCurrency, formatDate, formatTime, formatDuration } from '../utils/helpers';
import { Modal, Badge, EmptyState, LoadingSpinner, PageHeader, ConfirmDialog } from '../components/common';

const defaultPassenger = { title: 'MR', fullName: '', email: '', phone: '', passportNumber: '', nationality: '', dateOfBirth: '', gender: 'MALE', passengerType: 'ADULT' };

const defaultBooking = {
  flightId: '', passengers: [{ ...defaultPassenger }],
  seatIds: [], mealPreference: '', luggageKg: 0,
  contactEmail: '', contactPhone: '', tripType: 'ONE_WAY',
};


// ─── Flight Picker Component ───────────────────────────────────────────────
const FlightPicker = ({ value, onChange }) => {
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [date, setDate] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedFlight, setSelectedFlight] = React.useState(null);
  const [showResults, setShowResults] = React.useState(false);

  const handleSearch = async () => {
    if (!origin.trim()) { toast.error('Enter origin airport code (e.g. DEL)'); return; }
    if (!destination.trim()) { toast.error('Enter destination airport code (e.g. BOM)'); return; }
    if (!date) { toast.error('Select a departure date'); return; }
    setSearching(true);
    setShowResults(false);
    try {
      const res = await flightAPI.searchFlights({
        origin: origin.trim().toUpperCase(),
        destination: destination.trim().toUpperCase(),
        departureDate: date,
        passengers: 1,
      });
      const flights = res.data || [];
      setResults(flights);
      setShowResults(true);
      if (flights.length === 0) toast('No flights found for this route and date.', { icon: '✈️' });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Flight search failed.';
      toast.error(msg);
    } finally {
      setSearching(false);
    }
  };

  const selectFlight = (flight) => {
    setSelectedFlight(flight);
    onChange(flight.flightId);
    setShowResults(false);
  };

  const clearSelection = () => {
    setSelectedFlight(null);
    onChange('');
    setResults([]);
    setShowResults(false);
  };

  return (
      <div style={{ gridColumn: '1 / -1' }}>
        <label className="form-label">Flight</label>
        {selectedFlight ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: 'rgba(37,99,235,0.06)',
              border: '1.5px solid rgba(37,99,235,0.25)', borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ background: 'rgba(37,99,235,0.1)', borderRadius: '8px', padding: '8px' }}>
                  <Plane size={16} color="var(--blue-600)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--gray-800)' }}>
                    {selectedFlight.flightNumber} &nbsp;·&nbsp;
                    <span style={{ color: 'var(--blue-700)' }}>{selectedFlight.origin}</span>
                    &nbsp;→&nbsp;
                    <span style={{ color: 'var(--blue-700)' }}>{selectedFlight.destination}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>
                    {formatDateTime(selectedFlight.departureTime)} &nbsp;·&nbsp;
                    {formatDuration(selectedFlight.durationMinutes)} &nbsp;·&nbsp;
                    {selectedFlight.availableSeats} seats left &nbsp;·&nbsp;
                    {formatCurrency(selectedFlight.basePrice)}
                  </div>
                </div>
              </div>
              <button type="button" onClick={clearSelection}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px' }}>
                <X size={16} />
              </button>
            </div>
        ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <MapPin size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                  <input className="form-input" placeholder="From (DEL)" maxLength={3}
                         style={{ paddingLeft: '30px', textTransform: 'uppercase' }}
                         value={origin} onChange={e => setOrigin(e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                  <MapPin size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                  <input className="form-input" placeholder="To (BOM)" maxLength={3}
                         style={{ paddingLeft: '30px', textTransform: 'uppercase' }}
                         value={destination} onChange={e => setDestination(e.target.value)} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Calendar size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                  <input type="date" className="form-input" style={{ paddingLeft: '30px' }}
                         value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <button type="button" className="btn btn-primary" onClick={handleSearch} disabled={searching}
                        style={{ whiteSpace: 'nowrap', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {searching ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Search size={14} />}
                  {!searching && 'Search'}
                </button>
              </div>
              {showResults && results.length > 0 && (
                  <div style={{
                    border: '1px solid rgba(37,99,235,0.15)', borderRadius: '10px', overflow: 'hidden',
                    background: 'var(--white)', boxShadow: '0 8px 24px rgba(37,99,235,0.1)',
                    maxHeight: '280px', overflowY: 'auto',
                  }}>
                    {results.map((flight, idx) => (
                        <div key={flight.flightId} onClick={() => selectFlight(flight)}
                             style={{
                               padding: '12px 16px', cursor: 'pointer',
                               borderBottom: idx < results.length - 1 ? '1px solid rgba(37,99,235,0.07)' : 'none',
                               display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                               transition: 'background 0.15s',
                             }}
                             onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.05)'}
                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(37,99,235,0.08)', borderRadius: '6px', padding: '6px' }}>
                              <Plane size={14} color="var(--blue-600)" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gray-800)' }}>
                                {flight.flightNumber} &nbsp;
                                <span style={{ color: 'var(--blue-700)', fontWeight: 800 }}>{flight.origin}</span>
                                <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}> → </span>
                                <span style={{ color: 'var(--blue-700)', fontWeight: 800 }}>{flight.destination}</span>
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                                {formatDateTime(flight.departureTime)} &nbsp;·&nbsp; {formatDuration(flight.durationMinutes)} &nbsp;·&nbsp; {flight.availableSeats} seats left
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--blue-700)', fontSize: '14px' }}>{formatCurrency(flight.basePrice)}</div>
                            <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '2px' }}>{flight.status}</div>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </>
        )}
      </div>
  );
};

const BookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pnrSearch, setPnrSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [bookingForm, setBookingForm] = useState(defaultBooking);
  const [saving, setSaving] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [detailPassengers, setDetailPassengers] = useState([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingAPI.getBookingsByUser(user.userId);
      setBookings(res.data || []);
    } catch { toast.error('Failed to load bookings.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.userId) fetchBookings(); }, [user]);

  const handlePnrSearch = async (e) => {
    e.preventDefault();
    if (!pnrSearch.trim()) return;
    try {
      const res = await bookingAPI.getBookingByPnr(pnrSearch.trim().toUpperCase());
      setDetailBooking(res.data);
      loadPassengers(res.data.bookingId);
    } catch { toast.error('PNR not found.'); }
  };

  const loadPassengers = async (bookingId) => {
    setLoadingPassengers(true);
    try { const res = await passengerAPI.getPassengersByBooking(bookingId); setDetailPassengers(res.data || []); }
    catch { setDetailPassengers([]); }
    finally { setLoadingPassengers(false); }
  };

  const openDetail = (b) => { setDetailBooking(b); loadPassengers(b.bookingId); };

  const handleCancel = async () => {
    try {
      const res = await bookingAPI.cancelBooking(cancelId);
      toast.success('Booking cancelled.');
      setBookings(bs => bs.map(b => b.bookingId === cancelId ? res.data : b));
      setCancelId(null);
      if (detailBooking?.bookingId === cancelId) setDetailBooking(res.data);
    } catch { toast.error('Cancellation failed.'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      // Map frontend fullName → firstName + lastName expected by BookingRequest.PassengerDetails
      const mappedPassengers = bookingForm.passengers.map(p => {
        const parts = (p.fullName || '').trim().split(/\s+/);
        const firstName = parts[0] || 'Unknown';
        const lastName = parts.slice(1).join(' ') || firstName;
        const gender = (p.gender || 'MALE').toUpperCase();
        const title = (p.title || (gender === 'FEMALE' ? 'MRS' : 'MR')).toUpperCase();
        return {
          title,
          firstName,
          lastName,
          dateOfBirth: p.dateOfBirth || '2000-01-01',
          gender,
          passportNumber: p.passportNumber || null,
          nationality: p.nationality || null,
          mealPreference: (bookingForm.mealPreference || 'NONE').toUpperCase().replace(/ /g, '_'),
          passportExpiry: p.passportExpiry || null,
        };
      });

      const payload = {
        userId: user.userId,
        flightId: bookingForm.flightId,
        tripType: bookingForm.tripType,
        seatIds: bookingForm.seatIds || [],
        luggageKg: Number(bookingForm.luggageKg) || 0,
        contactEmail: bookingForm.contactEmail,
        contactPhone: bookingForm.contactPhone,
        passengers: mappedPassengers,
      };
      await bookingAPI.createBooking(payload);
      toast.success('Booking created successfully! ✈️');
      setShowCreate(false);
      setBookingForm(defaultBooking);
      fetchBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed.'); }
    finally { setSaving(false); }
  };

  const updatePassenger = (i, key, val) => {
    const ps = [...bookingForm.passengers];
    ps[i] = { ...ps[i], [key]: val };
    setBookingForm({ ...bookingForm, passengers: ps });
  };

  const addPassenger = () => setBookingForm({ ...bookingForm, passengers: [...bookingForm.passengers, { ...defaultPassenger }] });
  const removePassenger = (i) => setBookingForm({ ...bookingForm, passengers: bookingForm.passengers.filter((_, idx) => idx !== i) });

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'upcoming') return b.status === 'CONFIRMED' || b.status === 'PENDING';
    if (activeTab === 'past') return b.status === 'COMPLETED' || b.status === 'NO_SHOW';
    if (activeTab === 'cancelled') return b.status === 'CANCELLED';
    return true;
  });

  return (
      <div className="page-wrapper">
        <PageHeader title="My Bookings" subtitle="Manage your flight bookings" actions={
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New Booking</button>
        } />

        {/* PNR Search */}
        <div className="glass-card p-4 mb-4">
          <form onSubmit={handlePnrSearch} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
              <label className="form-label">Search by PNR Code</label>
              <input className="form-input" placeholder="e.g. ABC123" value={pnrSearch}
                     onChange={e => setPnrSearch(e.target.value.toUpperCase())} maxLength={6} style={{ textTransform: 'uppercase' }} />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}><Search size={16} /> Find</button>
          </form>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[['all','All'], ['upcoming','Upcoming'], ['past','Completed'], ['cancelled','Cancelled']].map(([val, label]) => (
              <button key={val} className={`btn ${activeTab === val ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setActiveTab(val)}>{label}</button>
          ))}
        </div>

        {loading ? <LoadingSpinner text="Loading bookings…" /> : (
            <div className="glass-card">
              {filteredBookings.length === 0
                  ? <EmptyState icon={Ticket} title="No bookings found" description={activeTab === 'all' ? 'Create your first booking above' : `No ${activeTab} bookings`}
                                action={activeTab === 'all' && <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>Book Now</button>} />
                  : (
                      <div className="table-wrapper">
                        <table>
                          <thead>
                          <tr><th>PNR</th><th>Flight ID</th><th>Pax</th><th>Total Fare</th><th>Trip</th><th>Status</th><th>Booked</th><th>Actions</th></tr>
                          </thead>
                          <tbody>
                          {filteredBookings.map(b => (
                              <tr key={b.bookingId}>
                                <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue-700)', background: 'rgba(37,99,235,0.08)', padding: '3px 8px', borderRadius: '6px' }}>{b.pnrCode}</span></td>
                                <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{b.flightId?.substring(0, 14)}…</td>
                                <td><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} />{b.numberOfPassengers}</span></td>
                                <td style={{ fontWeight: 700, color: 'var(--blue-700)', fontFamily: 'var(--font-primary)' }}>{formatCurrency(b.totalFare)}</td>
                                <td><span className="badge badge-gray">{b.tripType?.replace('_', ' ')}</span></td>
                                <td><Badge status={b.status} /></td>
                                <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{formatDate(b.bookedAt)}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(b)}>Details</button>
                                    {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                                        <button className="btn btn-danger btn-sm" onClick={() => setCancelId(b.bookingId)}><X size={13} /></button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )
              }
            </div>
        )}

        {/* Detail Modal */}
        <Modal isOpen={!!detailBooking} onClose={() => setDetailBooking(null)} title={`Booking — ${detailBooking?.pnrCode}`} size="lg"
               footer={
                 <div style={{ display: 'flex', gap: '10px' }}>
                   {(detailBooking?.status === 'PENDING' || detailBooking?.status === 'CONFIRMED') && (
                       <button className="btn btn-danger btn-sm" onClick={() => { setCancelId(detailBooking.bookingId); setDetailBooking(null); }}>Cancel Booking</button>
                   )}
                   <button className="btn btn-secondary btn-sm" onClick={() => setDetailBooking(null)}>Close</button>
                 </div>
               }>
          {detailBooking && (
              <div>
                <div className="grid-2" style={{ marginBottom: '20px' }}>
                  {[
                    ['PNR Code', detailBooking.pnrCode],
                    ['Status', null],
                    ['Trip Type', detailBooking.tripType?.replace('_', ' ')],
                    ['Flight ID', detailBooking.flightId?.substring(0, 16) + '…'],
                    ['Base Fare', formatCurrency(detailBooking.baseFare)],
                    ['Taxes', formatCurrency(detailBooking.taxes)],
                    ['Ancillary', formatCurrency(detailBooking.ancillaryCharges)],
                    ['Total Fare', formatCurrency(detailBooking.totalFare)],
                    ['Luggage', (detailBooking.luggageKg || 0) + ' kg'],
                    ['Meal Pref', detailBooking.mealPreference || 'None'],
                    ['Contact Email', detailBooking.contactEmail],
                    ['Contact Phone', detailBooking.contactPhone],
                  ].map(([k, v]) => (
                      <div key={k} style={{ padding: '8px 12px', background: 'rgba(37,99,235,0.04)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                        <div style={{ marginTop: '4px', fontWeight: 600, color: 'var(--gray-800)', fontSize: '13px' }}>
                          {k === 'Status' ? <Badge status={detailBooking.status} /> : v}
                        </div>
                      </div>
                  ))}
                </div>
                <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '15px', marginBottom: '12px', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} /> Passengers</h3>
                {loadingPassengers ? <LoadingSpinner /> : detailPassengers.length === 0
                    ? <EmptyState icon={Users} title="No passenger data" />
                    : detailPassengers.map(p => (
                        <div key={p.passengerId} style={{ padding: '12px', background: 'rgba(37,99,235,0.04)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()}</div>
                            <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{p.email} · Seat: {p.seatNumber || '—'} · {p.passengerType}</div>
                          </div>
                          <Badge status={p.checkedIn ? 'CONFIRMED' : 'PENDING'} label={p.checkedIn ? 'Checked In' : 'Not Checked In'} />
                        </div>
                    ))
                }
              </div>
          )}
        </Modal>

        {/* Create Booking Modal */}
        <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Booking" size="lg"
               footer={<>
                 <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
                 <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
                   {saving ? <div className="spinner" /> : <Ticket size={13} />} Create Booking
                 </button>
               </>}>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <FlightPicker value={bookingForm.flightId} onChange={id => setBookingForm({ ...bookingForm, flightId: id })} />
              <div className="form-group"><label className="form-label">Trip Type</label>
                <select className="form-select" value={bookingForm.tripType} onChange={e => setBookingForm({ ...bookingForm, tripType: e.target.value })}>
                  <option value="ONE_WAY">One Way</option><option value="ROUND_TRIP">Round Trip</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Contact Email</label><input type="email" className="form-input" value={bookingForm.contactEmail} onChange={e => setBookingForm({ ...bookingForm, contactEmail: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Contact Phone</label><input className="form-input" value={bookingForm.contactPhone} onChange={e => setBookingForm({ ...bookingForm, contactPhone: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Meal Preference</label>
                <select className="form-select" value={bookingForm.mealPreference} onChange={e => setBookingForm({ ...bookingForm, mealPreference: e.target.value })}>
                  <option value="">None</option><option value="VEG">Vegetarian</option><option value="NON_VEG">Non-Vegetarian</option><option value="VEGAN">Vegan</option><option value="JAIN">Jain</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Extra Luggage (kg)</label>
                <input type="number" min={0} max={40} className="form-input" value={bookingForm.luggageKg} onChange={e => setBookingForm({ ...bookingForm, luggageKg: e.target.value })} />
              </div>
            </div>

            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '15px', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={15} /> Passengers ({bookingForm.passengers.length})</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addPassenger}><Plus size={13} /> Add</button>
            </div>

            {bookingForm.passengers.map((p, i) => (
                <div key={i} style={{ padding: '14px', background: 'rgba(37,99,235,0.04)', borderRadius: '12px', marginBottom: '10px', position: 'relative' }}>
                  <div style={{ fontFamily: 'var(--font-primary)', fontSize: '12px', fontWeight: 700, color: 'var(--blue-700)', marginBottom: '10px' }}>
                    Passenger {i + 1}
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Title</label>
                      <select className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }} value={p.title} onChange={e => updatePassenger(i, 'title', e.target.value)}>
                        <option value="MR">Mr</option><option value="MRS">Mrs</option><option value="MS">Ms</option><option value="MISS">Miss</option><option value="DR">Dr</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Full Name</label>
                      <input className="form-input" style={{ padding: '8px 12px', fontSize: '13px' }} placeholder="John Doe" value={p.fullName} onChange={e => updatePassenger(i, 'fullName', e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Gender</label>
                      <select className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }} value={p.gender} onChange={e => updatePassenger(i, 'gender', e.target.value)}>
                        <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Date of Birth</label>
                      <input type="date" className="form-input" style={{ padding: '8px 12px', fontSize: '13px' }} value={p.dateOfBirth} onChange={e => updatePassenger(i, 'dateOfBirth', e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Passport Number</label>
                      <input className="form-input" style={{ padding: '8px 12px', fontSize: '13px' }} value={p.passportNumber} onChange={e => updatePassenger(i, 'passportNumber', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                      <label className="form-label" style={{ fontSize: '11px' }}>Nationality</label>
                      <input className="form-input" style={{ padding: '8px 12px', fontSize: '13px' }} placeholder="Indian" value={p.nationality} onChange={e => updatePassenger(i, 'nationality', e.target.value)} />
                    </div>
                  </div>
                  {bookingForm.passengers.length > 1 && (
                      <button type="button" onClick={() => removePassenger(i)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><X size={14} /></button>
                  )}
                </div>
            ))}
          </form>
        </Modal>

        <ConfirmDialog isOpen={!!cancelId} onClose={() => setCancelId(null)} onConfirm={handleCancel}
                       title="Cancel Booking" message="Are you sure you want to cancel this booking? This action cannot be undone and a refund will be initiated per the cancellation policy." confirmText="Cancel Booking" danger />
      </div>
  );
};

export default BookingsPage;