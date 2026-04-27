import api from './axiosConfig';

// Auth Service
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  googleLogin: (idToken) => api.post('/api/auth/google/login', { token:idToken }),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (oldPassword, newPassword) =>
      api.put('/api/auth/password', null, { params: { oldPassword, newPassword } }),
};

// Flight Service
export const flightAPI = {
  addFlight: (data) => api.post('/api/flights', data),
  getFlightById: (id) => api.get(`/api/flights/${id}`),
  getFlightByNumber: (flightNumber) => api.get(`/api/flights/number/${flightNumber}`),
  searchFlights: (data) => api.post('/api/flights/search', data),
  getFlightsByAirline: (airlineId) => api.get(`/api/flights/airline/${airlineId}`),
  updateFlight: (id, data) => api.put(`/api/flights/${id}`, data),
  updateFlightStatus: (id, status) => api.put(`/api/flights/${id}/status`, null, { params: { status } }),
  decrementSeats: (id, count) => api.put(`/api/flights/${id}/seats/decrement`, null, { params: { count } }),
  incrementSeats: (id, count) => api.put(`/api/flights/${id}/seats/increment`, null, { params: { count } }),
  deleteFlight: (id) => api.delete(`/api/flights/${id}`),
};

// Booking Service
export const bookingAPI = {
  createBooking: (data) => api.post('/api/bookings', data),
  getBookingById: (id) => api.get(`/api/bookings/${id}`),
  getBookingByPnr: (pnrCode) => api.get(`/api/bookings/pnr/${pnrCode}`),
  getBookingsByUser: (userId) => api.get(`/api/bookings/user/${userId}`),
  getUpcomingBookings: (userId) => api.get(`/api/bookings/user/${userId}/upcoming`),
  cancelBooking: (id) => api.put(`/api/bookings/${id}/cancel`),
  updateStatus: (id, status) => api.put(`/api/bookings/${id}/status`, null, { params: { status } }),
  confirmBooking: (id, paymentId) => api.put(`/api/bookings/${id}/confirm`, null, { params: { paymentId } }),
  calculateFare: (flightId, passengers, seatIds, luggageKg) =>
      api.post('/api/bookings/calculate-fare', null, { params: { flightId, passengers, seatIds, luggageKg } }),
};

// Seat Service
export const seatAPI = {
  addSeat: (data) => api.post('/api/seats', data),
  addSeatsForFlight: (flightId, seats) => api.post(`/api/seats/flight/${flightId}/bulk`, seats),
  getSeatById: (id) => api.get(`/api/seats/${id}`),
  getAvailableSeats: (flightId) => api.get(`/api/seats/flight/${flightId}/available`),
  getAvailableByClass: (flightId, seatClass) => api.get(`/api/seats/flight/${flightId}/class/${seatClass}`),
  getSeatMap: (flightId) => api.get(`/api/seats/flight/${flightId}/map`),
  holdSeat: (seatId) => api.put(`/api/seats/${seatId}/hold`),
  releaseSeat: (seatId) => api.put(`/api/seats/${seatId}/release`),
  confirmSeat: (seatId) => api.put(`/api/seats/${seatId}/confirm`),
  updateSeat: (id, data) => api.put(`/api/seats/${id}`, data),
  countAvailableByClass: (flightId, seatClass) => api.get(`/api/seats/flight/${flightId}/count/${seatClass}`),
  deleteSeatsForFlight: (flightId) => api.delete(`/api/seats/flight/${flightId}`),
};

// Passenger Service
export const passengerAPI = {
  addPassenger: (data) => api.post('/api/passengers', data),
  addPassengers: (data) => api.post('/api/passengers/bulk', data),
  getPassengerById: (id) => api.get(`/api/passengers/${id}`),
  getByTicketNumber: (ticketNumber) => api.get(`/api/passengers/ticket/${ticketNumber}`),
  getPassengersByBooking: (bookingId) => api.get(`/api/passengers/booking/${bookingId}`),
  getPassengersByPnr: (pnrCode) => api.get(`/api/passengers/pnr/${pnrCode}`),
  updatePassenger: (id, data) => api.put(`/api/passengers/${id}`, data),
  assignSeat: (id, seatId, seatNumber) =>
      api.put(`/api/passengers/${id}/assign-seat`, null, { params: { seatId, seatNumber } }),
  checkIn: (id) => api.put(`/api/passengers/${id}/check-in`),
  countByBooking: (bookingId) => api.get(`/api/passengers/booking/${bookingId}/count`),
  deletePassenger: (id) => api.delete(`/api/passengers/${id}`),
  deletePassengersByBooking: (bookingId) => api.delete(`/api/passengers/booking/${bookingId}`),
};

// Payment Service
export const paymentAPI = {
  initiatePayment: (data) => api.post('/api/payments/initiate', data),
  verifyPayment: (data) => api.post('/api/payments/verify', data),
  getPaymentById: (id) => api.get(`/api/payments/${id}`),
  getPaymentByBooking: (bookingId) => api.get(`/api/payments/booking/${bookingId}`),
  getPaymentsByUser: (userId) => api.get(`/api/payments/user/${userId}`),
  refundPayment: (id, amount) => api.post(`/api/payments/${id}/refund`, null, { params: { amount } }),
};

// Airline Service
export const airlineAPI = {
  createAirline: (data) => api.post('/api/airlines', data),
  getAirlineById: (id) => api.get(`/api/airlines/${id}`),
  getAirlineByIata: (iataCode) => api.get(`/api/airlines/iata/${iataCode}`),
  getAllAirlines: () => api.get('/api/airlines'),
  getActiveAirlines: () => api.get('/api/airlines/active'),
  updateAirline: (id, data) => api.put(`/api/airlines/${id}`, data),
  deactivateAirline: (id) => api.put(`/api/airlines/${id}/deactivate`),
  createAirport: (data) => api.post('/api/airports', data),
  getAirportById: (id) => api.get(`/api/airports/${id}`),
  getAirportByIata: (iataCode) => api.get(`/api/airports/iata/${iataCode}`),
  getAllAirports: () => api.get('/api/airports'),
  searchAirports: (q) => api.get('/api/airports/search', { params: { q } }),
  getAirportsByCity: (city) => api.get(`/api/airports/city/${city}`),
  updateAirport: (id, data) => api.put(`/api/airports/${id}`, data),
  deleteAirport: (id) => api.delete(`/api/airports/${id}`),
};

// Notification Service
export const notificationAPI = {
  sendNotification: (data) => api.post('/api/notifications', data),
  getNotificationsByUser: (userId) => api.get(`/api/notifications/user/${userId}`),
  getUnreadNotifications: (userId) => api.get(`/api/notifications/user/${userId}/unread`),
  getUnreadCount: (userId) => api.get(`/api/notifications/user/${userId}/unread-count`),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: (userId) => api.put(`/api/notifications/user/${userId}/read-all`),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
};