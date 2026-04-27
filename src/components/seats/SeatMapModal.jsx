import React, { useEffect, useState } from 'react';
import { seatAPI } from '../../api/services';
import { Modal, LoadingSpinner } from '../common';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CLASS_COLORS = {
  FIRST:    { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  BUSINESS: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' },
  ECONOMY:  { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
};

const STATUS_COLORS = {
  AVAILABLE: '#22c55e',
  HELD:      '#f59e0b',
  CONFIRMED: '#ef4444',
  BLOCKED:   '#94a3b8',
};

/**
 * SeatMapModal
 *
 * Props:
 *   flight        — { flightId, flightNumber }         (required)
 *   onClose       — () => void                          (required)
 *   passengerName — string, shown in header             (optional)
 *   currentSeatId — string, highlights passenger's seat (optional)
 *   onAssign      — (seat) => void                      (optional)
 *                   When provided, shows "Assign Seat" button instead of / alongside Hold.
 *                   When omitted, modal works in view-only / hold-release mode.
 */
const SeatMapModal = ({ flight, onClose, passengerName, currentSeatId, onAssign }) => {
  const { user } = useAuth();
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(false);

  const isAssignMode = typeof onAssign === 'function';

  useEffect(() => {
    seatAPI.getSeatMap(flight.flightId)
        .then(r => setSeats(r.data || []))
        .catch(() => toast.error('Failed to load seat map'))
        .finally(() => setLoading(false));
  }, [flight.flightId]);

  const handleHold = async () => {
    if (!selected) return;
    setActing(true);
    try {
      await seatAPI.holdSeat(selected.seatId);
      toast.success(`Seat ${selected.seatNumber} held!`);
      setSeats(s =>
          s.map(seat =>
              seat.seatId === selected.seatId
                  ? { ...seat, status: 'HELD', heldByUserId: user?.userId }
                  : seat
          )
      );
      setSelected(null);
    } catch {
      toast.error('Failed to hold seat.');
    } finally {
      setActing(false);
    }
  };

  const handleRelease = async () => {
    if (!selected) return;
    setActing(true);
    try {
      await seatAPI.releaseSeat(selected.seatId);
      toast.success(`Seat ${selected.seatNumber} released.`);
      setSeats(s =>
          s.map(seat =>
              seat.seatId === selected.seatId
                  ? { ...seat, status: 'AVAILABLE', heldByUserId: null }
                  : seat
          )
      );
      setSelected(null);
    } catch {
      toast.error('Failed to release seat.');
    } finally {
      setActing(false);
    }
  };

  const handleAssign = async () => {
    if (!selected || !onAssign) return;
    setActing(true);
    try {
      await onAssign(selected); // parent handles the API call and toast
      setSelected(null);
    } finally {
      setActing(false);
    }
  };

  // Group seats by row
  const rows = {};
  seats.forEach(s => {
    if (!rows[s.seat_row]) rows[s.seat_row] = [];
    rows[s.seat_row].push(s);
  });

  const classSummary = ['FIRST', 'BUSINESS', 'ECONOMY'].map(c => ({
    class: c,
    available: seats.filter(s => s.seatClass === c && s.status === 'AVAILABLE').length,
    total: seats.filter(s => s.seatClass === c).length,
  }));

  const modalTitle = isAssignMode
      ? `Assign Seat${passengerName ? ` — ${passengerName}` : ''}`
      : `Seat Map — ${flight.flightNumber}`;

  const renderFooter = () => {
    if (!selected) {
      return <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>;
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
        <span style={{ flex: 1, fontSize: '13px', color: 'var(--gray-600)' }}>
          Selected: <strong>{selected.seatNumber}</strong> ({selected.seatClass}) — {selected.status}
          {selected.seatId === currentSeatId && (
              <span style={{ marginLeft: '6px', color: 'var(--blue-600)', fontWeight: 600 }}>
              (current)
            </span>
          )}
        </span>

          {/* Assign mode: show Assign button for available/held seats */}
          {isAssignMode && (selected.status === 'AVAILABLE' || selected.status === 'HELD') && (
              <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAssign}
                  disabled={acting}
              >
                {acting ? <div className="spinner" /> : null}
                {selected.seatId === currentSeatId ? 'Keep Seat' : 'Assign Seat'}
              </button>
          )}

          {/* View mode: hold/release controls */}
          {!isAssignMode && selected.status === 'AVAILABLE' && (
              <button className="btn btn-primary btn-sm" onClick={handleHold} disabled={acting}>
                {acting ? <div className="spinner" /> : null} Hold Seat
              </button>
          )}
          {!isAssignMode && selected.status === 'HELD' && (
              <button className="btn btn-secondary btn-sm" onClick={handleRelease} disabled={acting}>
                {acting ? <div className="spinner" /> : null} Release
              </button>
          )}

          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
            Deselect
          </button>
        </div>
    );
  };

  return (
      <Modal isOpen onClose={onClose} title={modalTitle} size="xl" footer={renderFooter()}>
        {loading ? (
            <LoadingSpinner text="Loading seat map…" />
        ) : (
            <div>
              {/* Assign mode banner */}
              {isAssignMode && (
                  <div style={{
                    background: 'rgba(37,99,235,0.06)',
                    border: '1px solid rgba(37,99,235,0.15)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: 'var(--blue-700)',
                  }}>
                    Select an available seat to assign
                    {passengerName && <> to <strong>{passengerName}</strong></>}.
                    {currentSeatId && ' Their current seat is highlighted in blue.'}
                  </div>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div
                        key={status}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gray-600)' }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: color, opacity: 0.8 }} />
                      {status}
                    </div>
                ))}
                {isAssignMode && currentSeatId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--blue-600)' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--blue-600)' }} />
                      CURRENT SEAT
                    </div>
                )}
              </div>

              {/* Class summary */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {classSummary.map(c => (
                    <div
                        key={c.class}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          background: CLASS_COLORS[c.class]?.bg,
                          border: `1px solid ${CLASS_COLORS[c.class]?.border}`,
                          fontSize: '12px',
                          fontWeight: 600,
                          color: CLASS_COLORS[c.class]?.text,
                        }}
                    >
                      {c.class}: {c.available}/{c.total} available
                    </div>
                ))}
              </div>

              {/* Seat grid */}
              <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                  {Object.entries(rows)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([row, rowSeats]) => (
                          <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{
                      width: '24px',
                      textAlign: 'right',
                      fontSize: '11px',
                      color: 'var(--gray-400)',
                      fontFamily: 'monospace',
                    }}>
                      {row}
                    </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {['A', 'B', 'C'].map(col => {
                                const seat = rowSeats.find(s => s.seat_column === col);
                                return seat ? (
                                    <SeatButton
                                        key={col}
                                        seat={seat}
                                        selected={selected?.seatId === seat.seatId}
                                        isCurrentSeat={seat.seatId === currentSeatId}
                                        onClick={() => setSelected(seat)}
                                    />
                                ) : (
                                    <div key={col} style={{ width: 32, height: 32 }} />
                                );
                              })}
                            </div>
                            <div style={{ width: '16px' }} />
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {['D', 'E', 'F'].map(col => {
                                const seat = rowSeats.find(s => s.seat_column === col);
                                return seat ? (
                                    <SeatButton
                                        key={col}
                                        seat={seat}
                                        selected={selected?.seatId === seat.seatId}
                                        isCurrentSeat={seat.seatId === currentSeatId}
                                        onClick={() => setSelected(seat)}
                                    />
                                ) : (
                                    <div key={col} style={{ width: 32, height: 32 }} />
                                );
                              })}
                            </div>
                          </div>
                      ))}
                </div>
              </div>
            </div>
        )}
      </Modal>
  );
};

const SeatButton = ({ seat, selected, isCurrentSeat, onClick }) => {
  const isUnavailable = seat.status === 'CONFIRMED' || seat.status === 'BLOCKED';
  const color = STATUS_COLORS[seat.status] || '#94a3b8';

  let bg, border, textColor;

  if (selected) {
    bg = 'var(--blue-600)';
    border = '2px solid var(--blue-700)';
    textColor = 'white';
  } else if (isCurrentSeat) {
    bg = 'rgba(37,99,235,0.15)';
    border = '2px solid var(--blue-500)';
    textColor = 'var(--blue-700)';
  } else {
    bg = color + '33';
    border = `1.5px solid ${color}`;
    textColor = color;
  }

  return (
      <button
          onClick={onClick}
          disabled={isUnavailable}
          title={`${seat.seatNumber} (${seat.seatClass}) - ${seat.status}${isCurrentSeat ? ' — Current seat' : ''}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border,
            background: bg,
            color: textColor,
            fontSize: '9px',
            fontWeight: 700,
            cursor: isUnavailable ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'monospace',
          }}
      >
        {seat.seatNumber}
      </button>
  );
};

export default SeatMapModal;