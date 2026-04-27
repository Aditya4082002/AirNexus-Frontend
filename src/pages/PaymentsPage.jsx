import React, { useEffect, useState, useCallback } from 'react';
import { CreditCard, RotateCcw, CheckCircle, Loader, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI, bookingAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../utils/helpers';
import { Badge, EmptyState, LoadingSpinner, PageHeader, Modal } from '../components/common';

// ─── Load Razorpay SDK once ────────────────────────────────────────────────
const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// ─── Booking Picker ────────────────────────────────────────────────────────
const BookingPicker = ({ selectedBooking, onSelect, userId }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        bookingAPI.getBookingsByUser(userId)
            .then(r => {
                // Only show bookings that are CONFIRMED or PENDING (payable)
                const payable = (r.data || []).filter(b =>
                    ['PENDING', 'CONFIRMED'].includes(b.status)
                );
                setBookings(payable);
            })
            .catch(() => toast.error('Could not load bookings.'))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) return <div style={{ padding: '12px', color: 'var(--gray-400)', fontSize: '13px' }}>Loading your bookings…</div>;
    if (bookings.length === 0) return (
        <div style={{ padding: '12px', color: 'var(--gray-400)', fontSize: '13px', textAlign: 'center' }}>
            No payable bookings found.
        </div>
    );

    return (
        <div>
            <label className="form-label">Select Booking</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {bookings.map(b => {
                    const selected = selectedBooking?.bookingId === b.bookingId;
                    return (
                        <div key={b.bookingId} onClick={() => onSelect(b)}
                             style={{
                                 padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                                 border: `1.5px solid ${selected ? 'rgba(37,99,235,0.4)' : 'rgba(37,99,235,0.1)'}`,
                                 background: selected ? 'rgba(37,99,235,0.06)' : 'var(--white)',
                                 transition: 'all 0.15s',
                             }}
                             onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(37,99,235,0.03)'; }}
                             onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'var(--white)'; }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--gray-800)' }}>
                                        PNR: {b.pnrCode || b.bookingId?.substring(0, 8).toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                                        {b.flightId?.substring(0, 8)}… &nbsp;·&nbsp; {b.passengerCount || 1} pax &nbsp;·&nbsp; {b.tripType}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--blue-700)', fontSize: '14px' }}>
                                        {formatCurrency(b.totalFare || b.totalAmount || 0)}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '2px' }}>{b.status}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const PaymentsPage = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refundModal, setRefundModal] = useState(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refunding, setRefunding] = useState(false);
    const [initiateModal, setInitiateModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [initiating, setInitiating] = useState(false);

    const fetchPayments = useCallback(() => {
        paymentAPI.getPaymentsByUser(user.userId)
            .then(r => setPayments(r.data || []))
            .catch(() => toast.error('Failed to load payments.'))
            .finally(() => setLoading(false));
    }, [user.userId]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    // ── Razorpay Checkout ─────────────────────────────────────────────────
    const handleInitiate = async () => {
        if (!selectedBooking) { toast.error('Please select a booking.'); return; }

        setInitiating(true);
        const loaded = await loadRazorpayScript();
        if (!loaded) {
            toast.error('Failed to load Razorpay. Check your internet connection.');
            setInitiating(false);
            return;
        }

        try {
            // 1. Create Razorpay order on backend
            const amount = selectedBooking.totalFare || selectedBooking.totalAmount;
            const res = await paymentAPI.initiatePayment({
                bookingId: selectedBooking.bookingId,
                userId: user.userId,
                amount: amount,
                currency: 'INR',
            });

            const { paymentId, razorpayOrderId, razorpayKeyId } = res.data;

            // 2. Open Razorpay checkout popup
            const options = {
                key: razorpayKeyId,
                amount: amount * 100, // paise
                currency: 'INR',
                name: 'AirNexus',
                description: `Booking ${selectedBooking.pnrCode || selectedBooking.bookingId?.substring(0, 8)}`,
                order_id: razorpayOrderId,
                prefill: {
                    name: user.fullName || user.name || '',
                    email: user.email || '',
                    contact: user.phone || '',
                },
                theme: { color: '#2563eb' },
                modal: {
                    ondismiss: () => {
                        toast('Payment cancelled.', { icon: '⚠️' });
                        setInitiating(false);
                    },
                },
                handler: async (response) => {
                    // 3. Verify payment on backend after successful payment
                    try {
                        await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        toast.success('Payment successful! Booking confirmed. ✈️');
                        setInitiateModal(false);
                        setSelectedBooking(null);
                        fetchPayments(); // refresh list
                    } catch {
                        toast.error('Payment verification failed. Contact support.');
                    } finally {
                        setInitiating(false);
                    }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                toast.error('Payment failed: ' + response.error.description);
                setInitiating(false);
            });
            rzp.open();
            setInitiateModal(false); // close our modal, Razorpay popup takes over

        } catch (err) {
            toast.error('Could not initiate payment. Try again.');
            setInitiating(false);
        }
    };

    // ── Refund ────────────────────────────────────────────────────────────
    const handleRefund = async () => {
        if (!refundAmount || isNaN(refundAmount)) { toast.error('Enter a valid amount.'); return; }
        setRefunding(true);
        try {
            const res = await paymentAPI.refundPayment(refundModal.paymentId, Number(refundAmount));
            toast.success('Refund initiated!');
            setPayments(ps => ps.map(p => p.paymentId === refundModal.paymentId ? res.data : p));
            setRefundModal(null); setRefundAmount('');
        } catch { toast.error('Refund failed.'); }
        finally { setRefunding(false); }
    };

    const totalPaid = payments.filter(p => p.status === 'PAID' || p.status === 'SUCCESS').reduce((s, p) => s + (p.amount || 0), 0);
    const totalRefunded = payments.filter(p => p.status === 'REFUNDED').reduce((s, p) => s + (p.refundAmount || p.amount || 0), 0);

    return (
        <div className="page-wrapper">
            <PageHeader title="Payments" subtitle="Your payment history and transactions" actions={
                <button className="btn btn-primary" onClick={() => setInitiateModal(true)}>
                    <CreditCard size={16} /> Initiate Payment
                </button>
            } />

            {/* Summary */}
            <div className="grid-3 mb-6">
                {[
                    ['Total Transactions', payments.length, '#a855f7'],
                    ['Total Paid', formatCurrency(totalPaid), '#10b981'],
                    ['Total Refunded', formatCurrency(totalRefunded), '#f59e0b'],
                ].map(([label, value, color]) => (
                    <div key={label} className="stat-card">
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-primary)', color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? <LoadingSpinner text="Loading payments…" /> : (
                <div className="glass-card">
                    {payments.length === 0
                        ? <EmptyState icon={CreditCard} title="No payment history" description="Your transactions will appear here." />
                        : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                    <tr>
                                        <th>Payment ID</th><th>Booking</th><th>Amount</th>
                                        <th>Method</th><th>Status</th><th>Date</th><th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {payments.map(p => (
                                        <tr key={p.paymentId}>
                                            <td><span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--gray-600)' }}>
                          {p.razorpayPaymentId || p.paymentId?.substring(0, 14) + '…'}
                        </span></td>
                                            <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{p.bookingId?.substring(0, 12)}…</td>
                                            <td style={{ fontWeight: 700, color: 'var(--blue-700)', fontFamily: 'var(--font-primary)' }}>{formatCurrency(p.amount)}</td>
                                            <td style={{ fontSize: '13px' }}>{p.paymentMethod || 'Razorpay'}</td>
                                            <td><Badge status={p.status} /></td>
                                            <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{formatDateTime(p.createdAt)}</td>
                                            <td>
                                                {(p.status === 'PAID' || p.status === 'SUCCESS') && (
                                                    <button className="btn btn-secondary btn-sm"
                                                            onClick={() => { setRefundModal(p); setRefundAmount(p.amount); }}>
                                                        <RotateCcw size={13} /> Refund
                                                    </button>
                                                )}
                                                {p.status === 'PENDING' && (
                                                    <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontStyle: 'italic' }}>Awaiting payment</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>
            )}

            {/* Initiate Payment Modal */}
            <Modal isOpen={initiateModal} onClose={() => { setInitiateModal(false); setSelectedBooking(null); }}
                   title="Initiate Payment" size="md"
                   footer={<>
                       <button className="btn btn-secondary btn-sm" onClick={() => { setInitiateModal(false); setSelectedBooking(null); }}>
                           Cancel
                       </button>
                       <button className="btn btn-primary btn-sm" onClick={handleInitiate} disabled={initiating || !selectedBooking}>
                           {initiating
                               ? <><Loader size={13} className="spin" /> Opening Razorpay…</>
                               : <><CreditCard size={13} /> Pay {selectedBooking ? formatCurrency(selectedBooking.totalFare || selectedBooking.totalAmount || 0) : ''}</>
                           }
                       </button>
                   </>}>
                <BookingPicker
                    userId={user.userId}
                    selectedBooking={selectedBooking}
                    onSelect={setSelectedBooking}
                />
                {selectedBooking && (
                    <div style={{
                        marginTop: '16px', padding: '12px 14px', borderRadius: '10px',
                        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <CheckCircle size={16} color="#10b981" />
                        <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>
                            You'll be charged <strong>{formatCurrency(selectedBooking.totalFare || selectedBooking.totalAmount || 0)}</strong> via Razorpay secure checkout.
                        </div>
                    </div>
                )}
            </Modal>

            {/* Refund Modal */}
            <Modal isOpen={!!refundModal} onClose={() => { setRefundModal(null); setRefundAmount(''); }}
                   title="Process Refund" size="sm"
                   footer={<>
                       <button className="btn btn-secondary btn-sm" onClick={() => setRefundModal(null)}>Cancel</button>
                       <button className="btn btn-primary btn-sm" onClick={handleRefund} disabled={refunding}>
                           {refunding ? <div className="spinner" /> : <RotateCcw size={13} />} Process Refund
                       </button>
                   </>}>
                <div className="form-group">
                    <label className="form-label">Refund Amount (₹)</label>
                    <input type="number" className="form-input" value={refundAmount}
                           onChange={e => setRefundAmount(e.target.value)} max={refundModal?.amount} />
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '4px', display: 'block' }}>
            Max: {formatCurrency(refundModal?.amount)}
          </span>
                </div>
            </Modal>
        </div>
    );
};

export default PaymentsPage;