import React, { useState } from 'react';
import { Users, Search, UserCheck, Edit2, Armchair } from 'lucide-react';
import toast from 'react-hot-toast';
import { passengerAPI, bookingAPI } from '../api/services';
import { formatDate } from '../utils/helpers';
import { Modal, Badge, EmptyState, LoadingSpinner, PageHeader } from '../components/common';
import SeatMapModal from '../components/seats/SeatMapModal';

const PassengersPage = () => {
  const [pnrSearch, setPnrSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [editPassenger, setEditPassenger] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(null);

  // Seat assignment state
  const [assigningPassenger, setAssigningPassenger] = useState(null);
  const [assignFlight, setAssignFlight] = useState(null); // { flightId, flightNumber }
  const [loadingFlight, setLoadingFlight] = useState(false);

  // bookingId context — remembered when searching by booking
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [currentFlightInfo, setCurrentFlightInfo] = useState(null);

  const searchByPnr = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCurrentBookingId(null);
    setCurrentFlightInfo(null);
    try {
      const passRes = await passengerAPI.getPassengersByPnr(pnrSearch.trim().toUpperCase());
      const passengerList = passRes.data || [];
      setPassengers(passengerList);
      setSearched(true);

      // Fetch flight info via first passenger's bookingId
      const bookingId = passengerList[0]?.bookingId;
      if (bookingId) {
        setCurrentBookingId(bookingId);
        try {
          const bookingRes = await bookingAPI.getBookingById(bookingId);
          if (bookingRes.data) {
            setCurrentFlightInfo({
              flightId: bookingRes.data.flightId,
              flightNumber: bookingRes.data.flightNumber || bookingRes.data.flightId,
            });
          }
        } catch { /* flight info optional */ }
      }

      if (!passengerList.length) toast('No passengers found for this PNR.', { icon: '👤' });
    } catch {
      toast.error('PNR not found.');
      setPassengers([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const searchByTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCurrentBookingId(null);
    setCurrentFlightInfo(null);
    try {
      const r = await passengerAPI.getByTicketNumber(ticketSearch);
      const passenger = r.data;
      setPassengers(passenger ? [passenger] : []);
      setSearched(true);

      // Fetch flight info via their bookingId
      if (passenger?.bookingId) {
        try {
          const bookingRes = await bookingAPI.getBookingById(passenger.bookingId);
          if (bookingRes.data) {
            setCurrentFlightInfo({
              flightId: bookingRes.data.flightId,
              flightNumber: bookingRes.data.flightNumber || bookingRes.data.flightId,
            });
          }
        } catch { /* flight info optional */ }
      }
    } catch {
      toast.error('Ticket not found.');
      setPassengers([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (p) => { setEditPassenger(p); setEditForm({ ...p }); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await passengerAPI.updatePassenger(editPassenger.passengerId, editForm);
      toast.success('Passenger updated!');
      setPassengers(ps => ps.map(p => p.passengerId === editPassenger.passengerId ? r.data : p));
      setEditPassenger(null);
    } catch {
      toast.error('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckIn = async (id) => {
    setCheckingIn(id);
    try {
      const r = await passengerAPI.checkIn(id);
      toast.success('Checked in successfully!');
      setPassengers(ps => ps.map(p => p.passengerId === id ? r.data : p));
    } catch {
      toast.error('Check-in failed.');
    } finally {
      setCheckingIn(null);
    }
  };

  // Open seat map for a specific passenger
  const openSeatAssign = async (passenger) => {
    if (!currentFlightInfo) {
      // Try fetching from passenger's bookingId as fallback
      setLoadingFlight(true);
      try {
        const bookingRes = await bookingAPI.getBookingById(passenger.bookingId);
        const flightInfo = {
          flightId: bookingRes.data.flightId,
          flightNumber: bookingRes.data.flightNumber || bookingRes.data.flightId,
        };
        setCurrentFlightInfo(flightInfo);
        setAssignFlight(flightInfo);
        setAssigningPassenger(passenger);
      } catch {
        toast.error('Could not load flight info for seat assignment.');
      } finally {
        setLoadingFlight(false);
      }
    } else {
      setAssignFlight(currentFlightInfo);
      setAssigningPassenger(passenger);
    }
  };

  const handleAssignSeat = async (seat) => {
    if (!assigningPassenger) return;
    try {
      const r = await passengerAPI.assignSeat(
          assigningPassenger.passengerId,
          seat.seatId,
          seat.seatNumber
      );
      toast.success(`Seat ${seat.seatNumber} assigned to ${getDisplayName(assigningPassenger)}!`);
      setPassengers(ps =>
          ps.map(p => p.passengerId === assigningPassenger.passengerId ? r.data : p)
      );
    } catch {
      toast.error('Failed to assign seat.');
    } finally {
      setAssigningPassenger(null);
      setAssignFlight(null);
    }
  };

  const ef = (k) => ({
    value: editForm[k] || '',
    onChange: (e) => setEditForm({ ...editForm, [k]: e.target.value }),
  });

  const getDisplayName = (p) =>
      p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || '—';

  return (
      <div className="page-wrapper">
        <PageHeader title="Passengers" subtitle="Look up passenger records by PNR or ticket number" />

        <div className="grid-2 mb-6">
          <div className="glass-card p-4">
            <form onSubmit={searchByPnr}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                Search by PNR
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    className="form-input"
                    style={{ flex: 1, textTransform: 'uppercase' }}
                    placeholder="e.g. ABC123"
                    value={pnrSearch}
                    onChange={e => setPnrSearch(e.target.value)}
                    required
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                  <Search size={14} />
                </button>
              </div>
            </form>
          </div>
          <div className="glass-card p-4">
            <form onSubmit={searchByTicket}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                Search by Ticket Number
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Ticket number"
                    value={ticketSearch}
                    onChange={e => setTicketSearch(e.target.value)}
                    required
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                  <Search size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {loading && <LoadingSpinner text="Loading passengers…" />}

        {!loading && searched && (
            <div className="glass-card">
              {passengers.length === 0
                  ? <EmptyState icon={Users} title="No passengers found" />
                  : (
                      <div className="table-wrapper">
                        <table>
                          <thead>
                          <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Type</th>
                            <th>Ticket No.</th>
                            <th>Seat</th>
                            <th>DOB</th>
                            <th>Check-in</th>
                            <th>Actions</th>
                          </tr>
                          </thead>
                          <tbody>
                          {passengers.map(p => (
                              <tr key={p.passengerId}>
                                <td style={{ fontWeight: 600 }}>{getDisplayName(p)}</td>
                                <td style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{p.email || '—'}</td>
                                <td><span className="badge badge-gray">{p.passengerType || 'ADULT'}</span></td>
                                <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {p.ticketNumber || '—'}
                          </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>
                                  {p.seatNumber
                                      ? <span style={{ color: 'var(--blue-600)' }}>{p.seatNumber}</span>
                                      : <span style={{ color: 'var(--gray-400)', fontSize: '12px' }}>Not assigned</span>
                                  }
                                </td>
                                <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                  {formatDate(p.dateOfBirth)}
                                </td>
                                <td>
                                  {p.checkedIn || p.isCheckedIn
                                      ? <Badge status="CONFIRMED" label="Yes" />
                                      : p.seatId
                                          ? <Badge status="PENDING" label="No" />
                                          : <span
                                              title="Assign a seat first"
                                              style={{ fontSize: '11px', color: 'var(--gray-400)' }}
                                          >
                                  No seat
                                </span>
                                  }
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {/* Edit */}
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => openEdit(p)}
                                        title="Edit passenger"
                                    >
                                      <Edit2 size={13} />
                                    </button>

                                    {/* Assign Seat */}
                                    {!(p.checkedIn || p.isCheckedIn) && (
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openSeatAssign(p)}
                                            disabled={loadingFlight}
                                            title={p.seatNumber ? `Change seat (${p.seatNumber})` : 'Assign seat'}
                                            style={{ color: p.seatId ? 'var(--blue-600)' : undefined }}
                                        >
                                          {loadingFlight
                                              ? <div className="spinner" style={{ width: 12, height: 12 }} />
                                              : <Armchair size={13} />
                                          }
                                        </button>
                                    )}

                                    {/* Check-in — only if seat assigned and not yet checked in */}
                                    {!(p.checkedIn || p.isCheckedIn) && p.seatId && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleCheckIn(p.passengerId)}
                                            disabled={checkingIn === p.passengerId}
                                            title="Check in"
                                        >
                                          {checkingIn === p.passengerId
                                              ? <div className="spinner" />
                                              : <UserCheck size={13} />
                                          }
                                        </button>
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

        {!searched && !loading && (
            <div className="glass-card">
              <EmptyState
                  icon={Users}
                  title="Search for passengers"
                  description="Enter a PNR or Ticket Number above to view passenger records."
              />
            </div>
        )}

        {/* Edit Modal */}
        <Modal
            isOpen={!!editPassenger}
            onClose={() => setEditPassenger(null)}
            title="Edit Passenger"
            size="sm"
            footer={<>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditPassenger(null)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? <div className="spinner" /> : null} Save
              </button>
            </>}
        >
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="John Doe" {...ef('fullName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" {...ef('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" {...ef('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Passport Number</label>
              <input className="form-input" {...ef('passportNumber')} />
            </div>
            <div className="form-group">
              <label className="form-label">Nationality</label>
              <input className="form-input" {...ef('nationality')} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" {...ef('dateOfBirth')} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" {...ef('gender')}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </form>
        </Modal>

        {/* Seat Assignment Modal */}
        {assigningPassenger && assignFlight && (
            <SeatMapModal
                flight={assignFlight}
                passengerName={getDisplayName(assigningPassenger)}
                currentSeatId={assigningPassenger.seatId}
                onAssign={handleAssignSeat}
                onClose={() => { setAssigningPassenger(null); setAssignFlight(null); }}
            />
        )}
      </div>
  );
};

export default PassengersPage;