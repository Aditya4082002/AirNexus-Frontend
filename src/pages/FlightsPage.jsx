import React, { useState } from 'react';
import { Search, Plus, Plane, Clock, DollarSign, Trash2, Edit2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { flightAPI } from '../api/services';
import { formatDateTime, formatCurrency, formatDuration } from '../utils/helpers';
import { Modal, Badge, EmptyState, LoadingSpinner, PageHeader } from '../components/common';
import SeatMapModal from '../components/seats/SeatMapModal';

const FLIGHT_STATUSES = ['ON_TIME', 'DELAYED', 'CANCELLED', 'DEPARTED', 'ARRIVED'];

const defaultFlight = {
  flightNumber: '', airlineId: '', originAirportCode: '', destinationAirportCode: '',
  departureTime: '', arrivalTime: '', durationMinutes: '', aircraftType: '',
  totalSeats: '', availableSeats: '', basePrice: '', status: 'ON_TIME',
};

const FlightsPage = () => {
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchForm, setSearchForm] = useState({
    originAirportCode: '', destinationAirportCode: '', departureDate: '', passengers: 1,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [editFlight, setEditFlight] = useState(null);
  const [flightForm, setFlightForm] = useState(defaultFlight);
  const [saving, setSaving] = useState(false);
  const [seatMapFlight, setSeatMapFlight] = useState(null);
  const [statusModal, setStatusModal] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await flightAPI.searchFlights(searchForm);
      setResults(res.data || []);
      setSearched(true);
      if ((res.data || []).length === 0) toast('No flights found for your search.', { icon: '✈️' });
    } catch { toast.error('Search failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setFlightForm(defaultFlight); setEditFlight(null); setShowAdd(true); };
  const openEdit = (f) => {
    setFlightForm({ ...f, departureTime: f.departureTime?.replace('T', ' ').substring(0, 16), arrivalTime: f.arrivalTime?.replace('T', ' ').substring(0, 16) });
    setEditFlight(f);
    setShowAdd(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editFlight) {
        await flightAPI.updateFlight(editFlight.flightId, flightForm);
        toast.success('Flight updated!');
      } else {
        await flightAPI.addFlight(flightForm);
        toast.success('Flight added!');
      }
      setShowAdd(false);
      if (searched) handleSearch({ preventDefault: () => {} });
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this flight?')) return;
    try { await flightAPI.deleteFlight(id); toast.success('Flight deleted.'); setResults(r => r.filter(f => f.flightId !== id)); }
    catch { toast.error('Delete failed.'); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { const res = await flightAPI.updateFlightStatus(id, status); toast.success('Status updated!'); setResults(r => r.map(f => f.flightId === id ? res.data : f)); setStatusModal(null); }
    catch { toast.error('Update failed.'); }
  };

  const sf = (k) => ({ value: flightForm[k], onChange: (e) => setFlightForm({ ...flightForm, [k]: e.target.value }) });
  const ss = (k) => ({ value: searchForm[k], onChange: (e) => setSearchForm({ ...searchForm, [k]: e.target.value }) });

  return (
    <div className="page-wrapper">
      <PageHeader title="Flights" subtitle="Search and manage flights" actions={
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Flight</button>
      } />

      {/* Search Form */}
      <div className="glass-card p-6 mb-6">
        <h2 className="section-title mb-4">Search Flights</h2>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From (IATA)</label>
              <input className="form-input" placeholder="DEL" maxLength={3} {...ss('originAirportCode')} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To (IATA)</label>
              <input className="form-input" placeholder="BOM" maxLength={3} {...ss('destinationAirportCode')} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" {...ss('departureDate')} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Passengers</label>
              <input type="number" min={1} max={9} className="form-input" {...ss('passengers')} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="spinner" /> : <Search size={16} />} Search
          </button>
        </form>
      </div>

      {/* Results */}
      {loading && <LoadingSpinner text="Searching flights…" />}
      {!loading && searched && (
        <div className="glass-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
            <span style={{ fontFamily: 'var(--font-primary)', fontWeight: 600, color: 'var(--gray-700)' }}>
              {results.length} flight{results.length !== 1 ? 's' : ''} found
            </span>
          </div>
          {results.length === 0 ? <EmptyState icon={Plane} title="No flights found" description="Try different dates or routes" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {results.map(flight => (
                <FlightCard key={flight.flightId} flight={flight} onEdit={() => openEdit(flight)}
                  onDelete={() => handleDelete(flight.flightId)}
                  onSeatMap={() => setSeatMapFlight(flight)}
                  onStatus={() => setStatusModal(flight)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={editFlight ? 'Edit Flight' : 'Add Flight'} size="lg"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" /> : null}{editFlight ? 'Update' : 'Add'} Flight
          </button>
        </>}>
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Flight Number</label><input className="form-input" placeholder="AI101" {...sf('flightNumber')} required /></div>
            <div className="form-group"><label className="form-label">Airline ID</label><input className="form-input" {...sf('airlineId')} required /></div>
            <div className="form-group"><label className="form-label">Origin (IATA)</label><input className="form-input" maxLength={3} placeholder="DEL" {...sf('originAirportCode')} required /></div>
            <div className="form-group"><label className="form-label">Destination (IATA)</label><input className="form-input" maxLength={3} placeholder="BOM" {...sf('destinationAirportCode')} required /></div>
            <div className="form-group"><label className="form-label">Departure Time</label><input type="datetime-local" className="form-input" {...sf('departureTime')} required /></div>
            <div className="form-group"><label className="form-label">Arrival Time</label><input type="datetime-local" className="form-input" {...sf('arrivalTime')} required /></div>
            <div className="form-group"><label className="form-label">Duration (mins)</label><input type="number" className="form-input" {...sf('durationMinutes')} /></div>
            <div className="form-group"><label className="form-label">Aircraft Type</label><input className="form-input" placeholder="Boeing 737" {...sf('aircraftType')} /></div>
            <div className="form-group"><label className="form-label">Total Seats</label><input type="number" className="form-input" {...sf('totalSeats')} required /></div>
            <div className="form-group"><label className="form-label">Available Seats</label><input type="number" className="form-input" {...sf('availableSeats')} required /></div>
            <div className="form-group"><label className="form-label">Base Price (₹)</label><input type="number" className="form-input" {...sf('basePrice')} required /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" {...sf('status')}>
                {FLIGHT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} title="Update Flight Status" size="sm"
        footer={<button className="btn btn-secondary btn-sm" onClick={() => setStatusModal(null)}>Close</button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FLIGHT_STATUSES.map(s => (
            <button key={s} className={`btn ${statusModal?.status === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => handleStatusUpdate(statusModal.flightId, s)}>{s}</button>
          ))}
        </div>
      </Modal>

      {seatMapFlight && <SeatMapModal flight={seatMapFlight} onClose={() => setSeatMapFlight(null)} />}
    </div>
  );
};

const FlightCard = ({ flight, onEdit, onDelete, onSeatMap, onStatus }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(37,99,235,0.06)', transition: 'background 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '80px' }}>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '15px', color: 'var(--gray-800)' }}>{flight.flightNumber}</div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{flight.aircraftType}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-primary)', color: 'var(--navy)' }}>{flight.originAirportCode}</div>
            <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{formatDateTime(flight.departureTime)?.split(',')[1]?.trim()}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{formatDuration(flight.durationMinutes)}</div>
            <div style={{ height: '2px', width: '100%', background: 'linear-gradient(90deg, var(--purple-300), var(--blue-400))', borderRadius: '1px', position: 'relative' }}>
              <Plane size={10} style={{ position: 'absolute', right: '-2px', top: '-4px', color: 'var(--blue-600)' }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-primary)', color: 'var(--navy)' }}>{flight.destinationAirportCode}</div>
            <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>{formatDateTime(flight.arrivalTime)?.split(',')[1]?.trim()}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: '80px' }}>
          <div style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, fontSize: '16px', color: 'var(--blue-700)' }}>{formatCurrency(flight.basePrice)}</div>
          <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{flight.availableSeats} seats left</div>
        </div>
        <Badge status={flight.status} />
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(!menuOpen)}><MoreVertical size={15} /></button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(29,78,216,0.15)', zIndex: 10, minWidth: '140px', overflow: 'hidden' }}
              onMouseLeave={() => setMenuOpen(false)}>
              {[{ icon: Edit2, label: 'Edit', action: onEdit }, { icon: Clock, label: 'Status', action: onStatus }, { icon: Plane, label: 'Seat Map', action: onSeatMap }, { icon: Trash2, label: 'Delete', action: onDelete, danger: true }].map(({ icon: Icon, label, action, danger }) => (
                <button key={label} onClick={() => { action(); setMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: danger ? '#ef4444' : 'var(--gray-700)', fontFamily: 'var(--font-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.06)' : 'rgba(37,99,235,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightsPage;
