import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingsPage from './pages/BookingsPage';
import PassengersPage from './pages/PassengersPage';
import PaymentsPage from './pages/PaymentsPage';
import NotificationsPage from './pages/NotificationsPage';
import AirlinesPage from './pages/AirlinesPage';
import AirportsPage from './pages/AirportsPage';
import ProfilePage from './pages/ProfilePage';
import './styles/globals.css';

// Only redirect to login if NOT logged in, used for protected routes
const PrivateRoute = ({ children, adminOnly, staffOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-lg" />
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (staffOnly && user.role !== 'AIRLINE_STAFF' && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
};

// Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168,85,247,0.2)',
            boxShadow: '0 8px 24px rgba(139,92,246,0.15)',
            color: 'var(--gray-800)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
      <Routes>
        {/* Public auth routes */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Dashboard — public (guests can search flights, login needed to book) */}
        <Route path="/" element={<Layout><DashboardPage /></Layout>} />

        {/* Passenger + Staff + Admin routes */}
        <Route path="/bookings"      element={<PrivateRoute><Layout><BookingsPage /></Layout></PrivateRoute>} />
        <Route path="/passengers"    element={<PrivateRoute><Layout><PassengersPage /></Layout></PrivateRoute>} />
        <Route path="/payments"      element={<PrivateRoute><Layout><PaymentsPage /></Layout></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Layout><NotificationsPage /></Layout></PrivateRoute>} />
        <Route path="/profile"       element={<PrivateRoute><Layout><ProfilePage /></Layout></PrivateRoute>} />

        {/* Staff + Admin routes */}
        <Route path="/airlines" element={<PrivateRoute staffOnly><Layout><AirlinesPage /></Layout></PrivateRoute>} />
        <Route path="/airports" element={<PrivateRoute staffOnly><Layout><AirportsPage /></Layout></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
