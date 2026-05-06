# ✈️ AirNexus Frontend

A full-featured airline management and booking platform built with React 18. AirNexus provides a role-based interface for passengers, airline staff, and administrators to manage flights, bookings, passengers, payments, and notifications.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Pages & Routing](#pages--routing)
- [Role-Based Access Control](#role-based-access-control)
- [API Services](#api-services)
- [Authentication](#authentication)
- [Testing](#testing)
- [Utility Functions](#utility-functions)

---

## ✨ Features

- **Flight Search & Booking** — Search available flights by origin, destination, and date; book with seat selection
- **Seat Map Modal** — Interactive visual seat selector with class-based filtering (Economy, Business, First)
- **Booking Management** — View, confirm, and cancel bookings; look up by PNR code
- **Passenger Management** — Add multiple passengers per booking, assign seats, and manage check-in
- **Payment Processing** — Initiate, verify, and refund payments; full payment history per user
- **Notifications** — Real-time in-app notifications with unread count badge and mark-all-read
- **Airline & Airport Management** — Staff and admins can create, update, and deactivate airlines and airports
- **Profile Management** — Update personal details and change password
- **Google OAuth Login** — One-click sign-in via Google in addition to email/password
- **Role-Aware Navigation** — Sidebar automatically adapts to Passenger, Airline Staff, or Admin roles
- **Responsive Design** — Collapsible sidebar with mobile-friendly drawer navigation

---

## 🛠 Tech Stack

| Category | Library / Tool |
|---|---|
| UI Framework | React 18 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Notifications | react-hot-toast |
| Icons | lucide-react |
| Date Formatting | date-fns |
| Testing | React Testing Library + Jest |
| Build Tool | Create React App (react-scripts 5) |

---

## 📁 Project Structure

```
src/
├── api/
│   ├── axiosConfig.js          # Axios instance with JWT interceptors
│   └── services.js             # All API service modules (auth, flights, bookings, etc.)
├── components/
│   ├── auth/
│   │   └── Auth.css            # Shared auth form styles
│   ├── common/
│   │   └── index.jsx           # Reusable UI components (badges, spinners, modals, etc.)
│   ├── layout/
│   │   ├── Layout.jsx          # Page wrapper component
│   │   ├── Layout.css
│   │   ├── Sidebar.jsx         # Role-aware collapsible sidebar navigation
│   │   └── Sidebar.css
│   └── seats/
│       └── SeatMapModal.jsx    # Interactive seat selection modal
├── context/
│   └── AuthContext.jsx         # Global auth state (user, login, logout, roles)
├── pages/
│   ├── DashboardPage.jsx       # Home / flight search
│   ├── LoginPage.jsx           # Email + Google login
│   ├── RegisterPage.jsx        # User registration
│   ├── BookingsPage.jsx        # Booking list and management
│   ├── PassengersPage.jsx      # Passenger records per booking
│   ├── PaymentsPage.jsx        # Payment history and refunds
│   ├── NotificationsPage.jsx   # In-app notifications
│   ├── AirlinesPage.jsx        # Airline management (staff/admin)
│   ├── AirportsPage.jsx        # Airport management (staff/admin)
│   ├── ProfilePage.jsx         # User profile and password change
│   └── Dashboard.css
├── styles/
│   └── globals.css             # Global CSS variables, utility classes, and base styles
├── utils/
│   └── helpers.js              # Date, currency, duration, and status formatting helpers
├── __tests__/                  # Unit and integration tests
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── utils/
├── App.jsx                     # Root component with routing and auth guards
└── index.js                    # React DOM entry point
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **npm** v8 or higher
- A running instance of the AirNexus Backend API (default: `http://localhost:8080`)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd AirNexus-Frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your API URL and Google Client ID (see Environment Variables section)

# 4. Start the development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

| Variable | Description | Default |
|---|---|---|
| `REACT_APP_API_URL` | Base URL of the AirNexus backend REST API | `http://localhost:8080` |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID for Google Sign-In | — |

> **Note:** Never commit your `.env` file to version control. Add it to `.gitignore`.

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start the development server at `localhost:3000` |
| `npm run build` | Create an optimised production build in the `build/` folder |
| `npm test` | Run tests in interactive watch mode |
| `npm run test:ci` | Run all tests once (no watch mode, for CI pipelines) |
| `npm run test:coverage` | Run tests and generate a coverage report in `coverage/` |
| `npm run eject` | Eject from Create React App (irreversible) |

---

## 🗺 Pages & Routing

| Path | Page | Access |
|---|---|---|
| `/` | Dashboard (Flight Search) | Public |
| `/login` | Login | Public (redirects to `/` if already logged in) |
| `/register` | Register | Public (redirects to `/` if already logged in) |
| `/bookings` | Bookings | Authenticated |
| `/passengers` | Passengers | Authenticated |
| `/payments` | Payments | Authenticated |
| `/notifications` | Notifications | Authenticated |
| `/profile` | Profile | Authenticated |
| `/airlines` | Airlines Management | Staff & Admin only |
| `/airports` | Airports Management | Staff & Admin only |
| `*` | — | Redirects to `/` |

---

## 👥 Role-Based Access Control

AirNexus has three user roles that determine what pages and actions are available:

### PASSENGER
Default role for registered users. Can search flights, manage personal bookings, view passengers on their bookings, make and view payments, and receive notifications.

### AIRLINE_STAFF
All Passenger capabilities plus access to Airlines and Airports management pages for creating and updating airline/airport records.

### ADMIN
Full access to everything, including all bookings across all users and all management pages.

Route guards are enforced both client-side (via `PrivateRoute` and `staffOnly` props in `App.jsx`) and server-side (via API authorization).

---

## 🔌 API Services

All API calls are centralised in `src/api/services.js` and grouped by domain. Each service module uses the shared Axios instance from `axiosConfig.js` which automatically attaches the JWT token and user ID to every request.

### Auth (`authAPI`)
`register`, `login`, `googleLogin`, `getProfile`, `updateProfile`, `changePassword`

### Flights (`flightAPI`)
`addFlight`, `searchFlights`, `getFlightById`, `getFlightByNumber`, `updateFlight`, `updateFlightStatus`, `decrementSeats`, `incrementSeats`, `deleteFlight`, `getFlightsByAirline`

### Bookings (`bookingAPI`)
`createBooking`, `getBookingById`, `getBookingByPnr`, `getBookingsByUser`, `getUpcomingBookings`, `cancelBooking`, `confirmBooking`, `updateStatus`, `calculateFare`

### Seats (`seatAPI`)
`getSeatMap`, `getAvailableSeats`, `getAvailableByClass`, `holdSeat`, `releaseSeat`, `confirmSeat`, `addSeatsForFlight`, `deleteSeatsForFlight`

### Passengers (`passengerAPI`)
`addPassenger`, `addPassengers`, `getPassengersByBooking`, `assignSeat`, `checkIn`, `deletePassenger`, `deletePassengersByBooking`

### Payments (`paymentAPI`)
`initiatePayment`, `verifyPayment`, `getPaymentByBooking`, `getPaymentsByUser`, `refundPayment`

### Airlines & Airports (`airlineAPI`)
`createAirline`, `getAllAirlines`, `getActiveAirlines`, `updateAirline`, `deactivateAirline`, `createAirport`, `getAllAirports`, `searchAirports`, `updateAirport`, `deleteAirport`

### Notifications (`notificationAPI`)
`getNotificationsByUser`, `getUnreadNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`

---

## 🔑 Authentication

Authentication is handled globally via `AuthContext` (`src/context/AuthContext.jsx`).

**How it works:**

1. On login (email/password or Google OAuth), the backend returns a JWT token and user ID.
2. Both are stored in `localStorage` under `token` and `userId`.
3. The Axios interceptor in `axiosConfig.js` automatically attaches `Authorization: Bearer <token>` and `X-User-Id` headers to every outgoing request.
4. On a `401 Unauthorized` response, tokens are cleared and the user is redirected to `/login`.
5. On app load, if a token exists, `AuthContext` fetches the user profile to restore session state.

**Context API exposed:**

```js
const {
  user,           // Current user object (null if not logged in)
  loading,        // True while session is being restored on page load
  login,          // (credentials) => Promise
  googleLogin,    // (idToken) => Promise
  register,       // (data) => Promise
  logout,         // () => void
  refreshUser,    // () => Promise — re-fetches profile from API
  isAdmin,        // () => boolean
  isStaff,        // () => boolean
  isPassenger,    // () => boolean
  isLoggedIn,     // () => boolean
} = useAuth();
```

---

## 🧪 Testing

Tests are located in `src/__tests__/` and mirror the source structure.

```
src/__tests__/
├── api/
│   ├── axiosConfig.test.js     # Axios interceptor and config tests
│   └── services.test.js        # API service call tests
├── components/
│   └── CommonComponents.test.jsx
├── context/
│   └── AuthContext.test.jsx    # Auth state, login/logout flows
├── pages/
│   └── App.test.jsx            # Routing and route guard tests
└── utils/
    └── helpers.test.js         # Formatting utility unit tests
```

**Run tests:**

```bash
npm test                  # Watch mode
npm run test:ci           # Single run (CI)
npm run test:coverage     # With coverage report
```

**Coverage thresholds** (configured in `package.json`):

| Metric | Minimum |
|---|---|
| Branches | 80% |
| Functions | 80% |
| Lines | 80% |
| Statements | 80% |

Coverage reports are generated in `coverage/lcov-report/index.html`.

---
