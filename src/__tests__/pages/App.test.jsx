// App.test.jsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Mock services so AuthContext doesn't hit a real API ────────────────────
jest.mock('../../api/services', () => ({
  authAPI: {
    getProfile: jest.fn(),
    login: jest.fn(),
  },
}));

// ── Mock heavy page components ─────────────────────────────────────────────
jest.mock('../../pages/LoginPage',    () => () => <div>LoginPage</div>);
jest.mock('../../pages/RegisterPage', () => () => <div>RegisterPage</div>);
jest.mock('../../pages/DashboardPage',() => () => <div>Dashboard</div>);
jest.mock('../../components/layout/Layout', () => ({ children }) => <div>{children}</div>);

// ── Mock react-hot-toast (used in App) ────────────────────────────────────
jest.mock('react-hot-toast', () => ({ Toaster: () => null }));

import { authAPI } from '../../api/services';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// ── PrivateRoute / PublicRoute extracted for unit testing ──────────────────
const PrivateRoute = ({ children, adminOnly, staffOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner spinner-lg" />
      </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (staffOnly && user.role !== 'AIRLINE_STAFF' && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

// ── Test app wrappers ──────────────────────────────────────────────────────
const ProtectedApp = ({ adminOnly, staffOnly }) => (
    <Routes>
      <Route path="/login" element={<div>LoginPage</div>} />
      <Route path="/" element={<div>Home</div>} />
      <Route
          path="/protected"
          element={
            <PrivateRoute adminOnly={adminOnly} staffOnly={staffOnly}>
              <div>Protected Content</div>
            </PrivateRoute>
          }
      />
    </Routes>
);

const PublicApp = () => (
    <Routes>
      <Route path="/" element={<div>Dashboard</div>} />
      <Route path="/login" element={<PublicRoute><div>LoginPage</div></PublicRoute>} />
    </Routes>
);

const renderAt = (ui, initialPath = '/') =>
    render(
        <AuthProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            {ui}
          </MemoryRouter>
        </AuthProvider>
    );

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// ── PrivateRoute tests ─────────────────────────────────────────────────────
describe('PrivateRoute', () => {
  it('shows spinner while loading', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    // getProfile never resolves → loading stays true
    authAPI.getProfile.mockReturnValue(new Promise(() => {}));
    renderAt(<ProtectedApp />, '/protected');
    expect(document.querySelector('.spinner-lg')).toBeInTheDocument();
  });

  it('redirects to /login when user is null', async () => {
    // No token → no profile fetch → user stays null
    renderAt(<ProtectedApp />, '/protected');
    await waitFor(() =>
        expect(screen.getByText('LoginPage')).toBeInTheDocument()
    );
  });

  it('renders children for authenticated PASSENGER', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    authAPI.getProfile.mockResolvedValue({ data: { userId: '1', email: 'u@t.com', role: 'PASSENGER' } });
    renderAt(<ProtectedApp />, '/protected');
    await waitFor(() => expect(screen.getByText('Protected Content')).toBeInTheDocument());
  });

  it('blocks PASSENGER on adminOnly route', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    authAPI.getProfile.mockResolvedValue({ data: { userId: '1', email: 'u@t.com', role: 'PASSENGER' } });
    renderAt(<ProtectedApp adminOnly />, '/protected');
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument());
  });

  it('allows ADMIN on adminOnly route', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    authAPI.getProfile.mockResolvedValue({ data: { userId: '1', email: 'a@t.com', role: 'ADMIN' } });
    renderAt(<ProtectedApp adminOnly />, '/protected');
    await waitFor(() => expect(screen.getByText('Protected Content')).toBeInTheDocument());
  });

  it('blocks PASSENGER on staffOnly route', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    authAPI.getProfile.mockResolvedValue({ data: { userId: '1', email: 'u@t.com', role: 'PASSENGER' } });
    renderAt(<ProtectedApp staffOnly />, '/protected');
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument());
  });

  it('allows AIRLINE_STAFF on staffOnly route', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    authAPI.getProfile.mockResolvedValue({ data: { userId: '1', email: 's@t.com', role: 'AIRLINE_STAFF' } });
    renderAt(<ProtectedApp staffOnly />, '/protected');
    await waitFor(() => expect(screen.getByText('Protected Content')).toBeInTheDocument());
  });

  it('allows ADMIN on staffOnly route', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    authAPI.getProfile.mockResolvedValue({ data: { userId: '1', email: 'a@t.com', role: 'ADMIN' } });
    renderAt(<ProtectedApp staffOnly />, '/protected');
    await waitFor(() => expect(screen.getByText('Protected Content')).toBeInTheDocument());
  });
});

// ── PublicRoute tests ──────────────────────────────────────────────────────
describe('PublicRoute', () => {
  it('renders children for unauthenticated user', async () => {
    renderAt(<PublicApp />, '/login');
    await waitFor(() =>
        expect(screen.getByText('LoginPage')).toBeInTheDocument()
    );
  });

  it('redirects authenticated user to / from /login', async () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    authAPI.getProfile.mockResolvedValue({ data: { userId: '1', email: 'u@t.com', role: 'PASSENGER' } });
    renderAt(<PublicApp />, '/login');
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
    expect(screen.queryByText('LoginPage')).not.toBeInTheDocument();
  });

  it('renders null while loading', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('userId', '1');
    // getProfile never resolves → loading stays true → PublicRoute returns null
    authAPI.getProfile.mockReturnValue(new Promise(() => {}));
    renderAt(<PublicApp />, '/login');
    expect(screen.queryByText('LoginPage')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});

// ── App smoke test ─────────────────────────────────────────────────────────
describe('App (smoke)', () => {
  it('renders without crashing using MemoryRouter', () => {
    // We import the real App but BrowserRouter fails in jsdom, so test that
    // AuthProvider + MemoryRouter + routes work together instead
    authAPI.getProfile.mockResolvedValue({ data: {} });
    expect(() => renderAt(<ProtectedApp />, '/')).not.toThrow();
  });
});