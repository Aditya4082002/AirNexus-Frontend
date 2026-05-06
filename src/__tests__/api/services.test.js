// services.test.js — full coverage of all API service functions

jest.mock('../../api/axiosConfig', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    post:   jest.fn(),
    put:    jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

import api from '../../api/axiosConfig';
import {
  authAPI, flightAPI, bookingAPI, seatAPI,
  passengerAPI, paymentAPI, airlineAPI, notificationAPI,
} from '../../api/services';

beforeEach(() => jest.clearAllMocks());

// ── authAPI ───────────────────────────────────────────────────────────────
describe('authAPI', () => {
  it('register → POST /api/auth/register', () => {
    authAPI.register({ email: 'a@b.com', password: 'pw' });
    expect(api.post).toHaveBeenCalledWith('/api/auth/register', { email: 'a@b.com', password: 'pw' });
  });
  it('login → POST /api/auth/login', () => {
    authAPI.login({ email: 'a', password: 'p' });
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', { email: 'a', password: 'p' });
  });
  it('googleLogin → POST /api/auth/google/login', () => {
    authAPI.googleLogin('id-token');
    expect(api.post).toHaveBeenCalledWith('/api/auth/google/login', { token: 'id-token' });
  });
  it('getProfile → GET /api/auth/profile', () => {
    authAPI.getProfile();
    expect(api.get).toHaveBeenCalledWith('/api/auth/profile');
  });
  it('updateProfile → PUT /api/auth/profile', () => {
    authAPI.updateProfile({ name: 'X' });
    expect(api.put).toHaveBeenCalledWith('/api/auth/profile', { name: 'X' });
  });
  it('changePassword → PUT /api/auth/password with params', () => {
    authAPI.changePassword('old', 'new');
    expect(api.put).toHaveBeenCalledWith('/api/auth/password', null, {
      params: { oldPassword: 'old', newPassword: 'new' },
    });
  });
});

// ── flightAPI ─────────────────────────────────────────────────────────────
describe('flightAPI', () => {
  it('addFlight', () => { flightAPI.addFlight({ n: 1 }); expect(api.post).toHaveBeenCalledWith('/api/flights', { n: 1 }); });
  it('getFlightById', () => { flightAPI.getFlightById(5); expect(api.get).toHaveBeenCalledWith('/api/flights/5'); });
  it('getFlightByNumber', () => { flightAPI.getFlightByNumber('AI101'); expect(api.get).toHaveBeenCalledWith('/api/flights/number/AI101'); });
  it('searchFlights', () => { flightAPI.searchFlights({ o: 'DEL' }); expect(api.post).toHaveBeenCalledWith('/api/flights/search', { o: 'DEL' }); });
  it('getFlightsByAirline', () => { flightAPI.getFlightsByAirline(3); expect(api.get).toHaveBeenCalledWith('/api/flights/airline/3'); });
  it('updateFlight', () => { flightAPI.updateFlight(1, { s: 'ok' }); expect(api.put).toHaveBeenCalledWith('/api/flights/1', { s: 'ok' }); });
  it('updateFlightStatus', () => { flightAPI.updateFlightStatus(2, 'DELAYED'); expect(api.put).toHaveBeenCalledWith('/api/flights/2/status', null, { params: { status: 'DELAYED' } }); });
  it('decrementSeats', () => { flightAPI.decrementSeats(4, 2); expect(api.put).toHaveBeenCalledWith('/api/flights/4/seats/decrement', null, { params: { count: 2 } }); });
  it('incrementSeats', () => { flightAPI.incrementSeats(4, 1); expect(api.put).toHaveBeenCalledWith('/api/flights/4/seats/increment', null, { params: { count: 1 } }); });
  it('deleteFlight', () => { flightAPI.deleteFlight(9); expect(api.delete).toHaveBeenCalledWith('/api/flights/9'); });
});

// ── bookingAPI ────────────────────────────────────────────────────────────
describe('bookingAPI', () => {
  it('createBooking', () => { bookingAPI.createBooking({ f: 1 }); expect(api.post).toHaveBeenCalledWith('/api/bookings', { f: 1 }); });
  it('getBookingById', () => { bookingAPI.getBookingById(7); expect(api.get).toHaveBeenCalledWith('/api/bookings/7'); });
  it('getBookingByPnr', () => { bookingAPI.getBookingByPnr('XYZ'); expect(api.get).toHaveBeenCalledWith('/api/bookings/pnr/XYZ'); });
  it('getBookingsByUser', () => { bookingAPI.getBookingsByUser(1); expect(api.get).toHaveBeenCalledWith('/api/bookings/user/1'); });
  it('getUpcomingBookings', () => { bookingAPI.getUpcomingBookings(2); expect(api.get).toHaveBeenCalledWith('/api/bookings/user/2/upcoming'); });
  it('cancelBooking', () => { bookingAPI.cancelBooking(3); expect(api.put).toHaveBeenCalledWith('/api/bookings/3/cancel'); });
  it('updateStatus', () => { bookingAPI.updateStatus(4, 'CONFIRMED'); expect(api.put).toHaveBeenCalledWith('/api/bookings/4/status', null, { params: { status: 'CONFIRMED' } }); });
  it('confirmBooking', () => { bookingAPI.confirmBooking(5, 'pay1'); expect(api.put).toHaveBeenCalledWith('/api/bookings/5/confirm', null, { params: { paymentId: 'pay1' } }); });
  it('calculateFare', () => {
    bookingAPI.calculateFare(1, 2, [3, 4], 15);
    expect(api.post).toHaveBeenCalledWith('/api/bookings/calculate-fare', null, {
      params: { flightId: 1, passengers: 2, seatIds: [3, 4], luggageKg: 15 },
    });
  });
});

// ── seatAPI ───────────────────────────────────────────────────────────────
describe('seatAPI', () => {
  it('addSeat', () => { seatAPI.addSeat({ n: 1 }); expect(api.post).toHaveBeenCalledWith('/api/seats', { n: 1 }); });
  it('addSeatsForFlight', () => { seatAPI.addSeatsForFlight(1, []); expect(api.post).toHaveBeenCalledWith('/api/seats/flight/1/bulk', []); });
  it('getSeatById', () => { seatAPI.getSeatById(2); expect(api.get).toHaveBeenCalledWith('/api/seats/2'); });
  it('getAvailableSeats', () => { seatAPI.getAvailableSeats(3); expect(api.get).toHaveBeenCalledWith('/api/seats/flight/3/available'); });
  it('getAvailableByClass', () => { seatAPI.getAvailableByClass(1, 'ECONOMY'); expect(api.get).toHaveBeenCalledWith('/api/seats/flight/1/class/ECONOMY'); });
  it('getSeatMap', () => { seatAPI.getSeatMap(5); expect(api.get).toHaveBeenCalledWith('/api/seats/flight/5/map'); });
  it('holdSeat', () => { seatAPI.holdSeat(6); expect(api.put).toHaveBeenCalledWith('/api/seats/6/hold'); });
  it('releaseSeat', () => { seatAPI.releaseSeat(7); expect(api.put).toHaveBeenCalledWith('/api/seats/7/release'); });
  it('confirmSeat', () => { seatAPI.confirmSeat(8); expect(api.put).toHaveBeenCalledWith('/api/seats/8/confirm'); });
  it('updateSeat', () => { seatAPI.updateSeat(9, { c: 'FIRST' }); expect(api.put).toHaveBeenCalledWith('/api/seats/9', { c: 'FIRST' }); });
  it('countAvailableByClass', () => { seatAPI.countAvailableByClass(2, 'BUSINESS'); expect(api.get).toHaveBeenCalledWith('/api/seats/flight/2/count/BUSINESS'); });
  it('deleteSeatsForFlight', () => { seatAPI.deleteSeatsForFlight(4); expect(api.delete).toHaveBeenCalledWith('/api/seats/flight/4'); });
});

// ── passengerAPI ──────────────────────────────────────────────────────────
describe('passengerAPI', () => {
  it('addPassenger', () => { passengerAPI.addPassenger({ n: 'A' }); expect(api.post).toHaveBeenCalledWith('/api/passengers', { n: 'A' }); });
  it('addPassengers', () => { passengerAPI.addPassengers([{ n: 'B' }]); expect(api.post).toHaveBeenCalledWith('/api/passengers/bulk', [{ n: 'B' }]); });
  it('getPassengerById', () => { passengerAPI.getPassengerById(1); expect(api.get).toHaveBeenCalledWith('/api/passengers/1'); });
  it('getByTicketNumber', () => { passengerAPI.getByTicketNumber('T99'); expect(api.get).toHaveBeenCalledWith('/api/passengers/ticket/T99'); });
  it('getPassengersByBooking', () => { passengerAPI.getPassengersByBooking(2); expect(api.get).toHaveBeenCalledWith('/api/passengers/booking/2'); });
  it('getPassengersByPnr', () => { passengerAPI.getPassengersByPnr('ABC'); expect(api.get).toHaveBeenCalledWith('/api/passengers/pnr/ABC'); });
  it('updatePassenger', () => { passengerAPI.updatePassenger(3, { n: 'C' }); expect(api.put).toHaveBeenCalledWith('/api/passengers/3', { n: 'C' }); });
  it('assignSeat', () => { passengerAPI.assignSeat(4, 10, '10A'); expect(api.put).toHaveBeenCalledWith('/api/passengers/4/assign-seat', null, { params: { seatId: 10, seatNumber: '10A' } }); });
  it('checkIn', () => { passengerAPI.checkIn(5); expect(api.put).toHaveBeenCalledWith('/api/passengers/5/check-in'); });
  it('countByBooking', () => { passengerAPI.countByBooking(6); expect(api.get).toHaveBeenCalledWith('/api/passengers/booking/6/count'); });
  it('deletePassenger', () => { passengerAPI.deletePassenger(7); expect(api.delete).toHaveBeenCalledWith('/api/passengers/7'); });
  it('deletePassengersByBooking', () => { passengerAPI.deletePassengersByBooking(8); expect(api.delete).toHaveBeenCalledWith('/api/passengers/booking/8'); });
});

// ── paymentAPI ────────────────────────────────────────────────────────────
describe('paymentAPI', () => {
  it('initiatePayment', () => { paymentAPI.initiatePayment({ a: 500 }); expect(api.post).toHaveBeenCalledWith('/api/payments/initiate', { a: 500 }); });
  it('verifyPayment', () => { paymentAPI.verifyPayment({ ref: 'x' }); expect(api.post).toHaveBeenCalledWith('/api/payments/verify', { ref: 'x' }); });
  it('getPaymentById', () => { paymentAPI.getPaymentById(1); expect(api.get).toHaveBeenCalledWith('/api/payments/1'); });
  it('getPaymentByBooking', () => { paymentAPI.getPaymentByBooking(2); expect(api.get).toHaveBeenCalledWith('/api/payments/booking/2'); });
  it('getPaymentsByUser', () => { paymentAPI.getPaymentsByUser(3); expect(api.get).toHaveBeenCalledWith('/api/payments/user/3'); });
  it('refundPayment', () => { paymentAPI.refundPayment(4, 200); expect(api.post).toHaveBeenCalledWith('/api/payments/4/refund', null, { params: { amount: 200 } }); });
});

// ── airlineAPI ────────────────────────────────────────────────────────────
describe('airlineAPI', () => {
  it('createAirline', () => { airlineAPI.createAirline({ n: 'AI' }); expect(api.post).toHaveBeenCalledWith('/api/airlines', { n: 'AI' }); });
  it('getAirlineById', () => { airlineAPI.getAirlineById(1); expect(api.get).toHaveBeenCalledWith('/api/airlines/1'); });
  it('getAirlineByIata', () => { airlineAPI.getAirlineByIata('AI'); expect(api.get).toHaveBeenCalledWith('/api/airlines/iata/AI'); });
  it('getAllAirlines', () => { airlineAPI.getAllAirlines(); expect(api.get).toHaveBeenCalledWith('/api/airlines'); });
  it('getActiveAirlines', () => { airlineAPI.getActiveAirlines(); expect(api.get).toHaveBeenCalledWith('/api/airlines/active'); });
  it('updateAirline', () => { airlineAPI.updateAirline(2, { n: 'X' }); expect(api.put).toHaveBeenCalledWith('/api/airlines/2', { n: 'X' }); });
  it('deactivateAirline', () => { airlineAPI.deactivateAirline(3); expect(api.put).toHaveBeenCalledWith('/api/airlines/3/deactivate'); });
  it('createAirport', () => { airlineAPI.createAirport({ n: 'DEL' }); expect(api.post).toHaveBeenCalledWith('/api/airports', { n: 'DEL' }); });
  it('getAirportById', () => { airlineAPI.getAirportById(4); expect(api.get).toHaveBeenCalledWith('/api/airports/4'); });
  it('getAirportByIata', () => { airlineAPI.getAirportByIata('DEL'); expect(api.get).toHaveBeenCalledWith('/api/airports/iata/DEL'); });
  it('getAllAirports', () => { airlineAPI.getAllAirports(); expect(api.get).toHaveBeenCalledWith('/api/airports'); });
  it('searchAirports', () => { airlineAPI.searchAirports('del'); expect(api.get).toHaveBeenCalledWith('/api/airports/search', { params: { q: 'del' } }); });
  it('getAirportsByCity', () => { airlineAPI.getAirportsByCity('Delhi'); expect(api.get).toHaveBeenCalledWith('/api/airports/city/Delhi'); });
  it('updateAirport', () => { airlineAPI.updateAirport(5, { n: 'Y' }); expect(api.put).toHaveBeenCalledWith('/api/airports/5', { n: 'Y' }); });
  it('deleteAirport', () => { airlineAPI.deleteAirport(6); expect(api.delete).toHaveBeenCalledWith('/api/airports/6'); });
});

// ── notificationAPI ───────────────────────────────────────────────────────
describe('notificationAPI', () => {
  it('sendNotification', () => { notificationAPI.sendNotification({ m: 'hi' }); expect(api.post).toHaveBeenCalledWith('/api/notifications', { m: 'hi' }); });
  it('getNotificationsByUser', () => { notificationAPI.getNotificationsByUser(1); expect(api.get).toHaveBeenCalledWith('/api/notifications/user/1'); });
  it('getUnreadNotifications', () => { notificationAPI.getUnreadNotifications(2); expect(api.get).toHaveBeenCalledWith('/api/notifications/user/2/unread'); });
  it('getUnreadCount', () => { notificationAPI.getUnreadCount(3); expect(api.get).toHaveBeenCalledWith('/api/notifications/user/3/unread-count'); });
  it('markAsRead', () => { notificationAPI.markAsRead(4); expect(api.put).toHaveBeenCalledWith('/api/notifications/4/read'); });
  it('markAllAsRead', () => { notificationAPI.markAllAsRead(5); expect(api.put).toHaveBeenCalledWith('/api/notifications/user/5/read-all'); });
  it('deleteNotification', () => { notificationAPI.deleteNotification(6); expect(api.delete).toHaveBeenCalledWith('/api/notifications/6'); });
});