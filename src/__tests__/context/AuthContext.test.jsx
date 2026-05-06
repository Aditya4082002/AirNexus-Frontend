// AuthContext.test.jsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mock the services module ───────────────────────────────────────────────
jest.mock('../../api/services', () => ({
  authAPI: {
    getProfile: jest.fn(),
    login: jest.fn(),
    googleLogin: jest.fn(),
    register: jest.fn(),
  },
}));

import { authAPI } from '../../api/services';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// ── Helper component to expose context values ──────────────────────────────
const TestConsumer = () => {
  const { user, loading, login, logout, isAdmin, isStaff, isPassenger, isLoggedIn } = useAuth();
  return (
      <div>
        <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
        <span data-testid="loading">{String(loading)}</span>
        <span data-testid="isAdmin">{String(isAdmin())}</span>
        <span data-testid="isStaff">{String(isStaff())}</span>
        <span data-testid="isPassenger">{String(isPassenger())}</span>
        <span data-testid="isLoggedIn">{String(isLoggedIn())}</span>
        <button data-testid="loginBtn" onClick={() => login({ email: 'u@test.com', password: 'pw' })}>Login</button>
        <button data-testid="logoutBtn" onClick={logout}>Logout</button>
      </div>
  );
};

const renderWithProvider = () =>
    render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
    );

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  describe('initial state (no localStorage)', () => {
    it('sets loading=false and user=null when no token', async () => {
      authAPI.getProfile.mockResolvedValue({ data: {} });
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('loading').textContent).toBe('false')
      );
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  describe('token restoration on mount', () => {
    it('fetches profile when token + userId exist in localStorage', async () => {
      localStorage.setItem('token', 'abc');
      localStorage.setItem('userId', '1');
      authAPI.getProfile.mockResolvedValue({
        data: { userId: '1', email: 'user@test.com', role: 'PASSENGER' },
      });

      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('user').textContent).toContain('user@test.com')
      );
      expect(authAPI.getProfile).toHaveBeenCalledTimes(1);
    });

    it('clears localStorage when getProfile fails', async () => {
      localStorage.setItem('token', 'bad');
      localStorage.setItem('userId', '1');
      authAPI.getProfile.mockRejectedValue(new Error('Unauthorized'));

      // Mock localStorage methods
      const removeItem = jest.spyOn(Storage.prototype, 'removeItem');

      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('loading').textContent).toBe('false')
      );
      expect(removeItem).toHaveBeenCalledWith('token');
      expect(removeItem).toHaveBeenCalledWith('userId');
      expect(screen.getByTestId('user').textContent).toBe('null');
      removeItem.mockRestore();
    });
  });

  describe('login', () => {
    it('sets user and stores token/userId in localStorage', async () => {
      authAPI.getProfile.mockResolvedValue({ data: {} });
      authAPI.login.mockResolvedValue({
        data: { token: 'tok', userId: '2', email: 'u@test.com', role: 'PASSENGER' },
      });

      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('loading').textContent).toBe('false')
      );

      await act(async () => {
        screen.getByTestId('loginBtn').click();
      });

      await waitFor(() =>
          expect(screen.getByTestId('user').textContent).toContain('u@test.com')
      );
      expect(localStorage.getItem('token')).toBe('tok');
      expect(localStorage.getItem('userId')).toBe('2');
    });
  });

  describe('logout', () => {
    it('clears localStorage and sets user to null', async () => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('userId', '1');
      authAPI.getProfile.mockResolvedValue({
        data: { userId: '1', email: 'u@test.com', role: 'PASSENGER' },
      });

      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('user').textContent).toContain('u@test.com')
      );

      await act(async () => {
        screen.getByTestId('logoutBtn').click();
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('userId')).toBeNull();
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  describe('role helpers with ADMIN user', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('userId', '1');
      authAPI.getProfile.mockResolvedValue({
        data: { userId: '1', email: 'admin@test.com', role: 'ADMIN' },
      });
    });

    it('isAdmin returns true', async () => {
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('isAdmin').textContent).toBe('true')
      );
    });

    it('isStaff returns false for ADMIN', async () => {
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('isAdmin').textContent).toBe('true')
      );
      expect(screen.getByTestId('isStaff').textContent).toBe('false');
    });

    it('isPassenger returns false for ADMIN', async () => {
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('isPassenger').textContent).toBe('false')
      );
    });

    it('isLoggedIn returns true', async () => {
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('isLoggedIn').textContent).toBe('true')
      );
    });
  });

  describe('role helpers with AIRLINE_STAFF user', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('userId', '1');
      authAPI.getProfile.mockResolvedValue({
        data: { userId: '1', email: 'staff@test.com', role: 'AIRLINE_STAFF' },
      });
    });

    it('isStaff returns true', async () => {
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('isStaff').textContent).toBe('true')
      );
    });

    it('isAdmin returns false for STAFF', async () => {
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('isStaff').textContent).toBe('true')
      );
      expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    });

    it('isPassenger returns false for AIRLINE_STAFF', async () => {
      renderWithProvider();
      await waitFor(() =>
          expect(screen.getByTestId('isPassenger').textContent).toBe('false')
      );
    });
  });

  describe('googleLogin function', () => {
    it('sets user and stores token/userId after googleLogin', async () => {
      authAPI.getProfile.mockResolvedValue({ data: {} });
      authAPI.googleLogin.mockResolvedValue({
        data: { token: 'gt', userId: '9', email: 'g@test.com', role: 'PASSENGER' },
      });

      const GoogleConsumer = () => {
        const { user, googleLogin } = useAuth();
        return (
            <div>
              <span data-testid="gUser">{user ? user.email : 'null'}</span>
              <button data-testid="gBtn" onClick={() => googleLogin('id-token')}>Google</button>
            </div>
        );
      };

      render(<AuthProvider><GoogleConsumer /></AuthProvider>);
      await waitFor(() => expect(screen.getByTestId('gUser').textContent).toBe('null'));

      await act(async () => { screen.getByTestId('gBtn').click(); });
      await waitFor(() => expect(screen.getByTestId('gUser').textContent).toContain('g@test.com'));
      expect(localStorage.getItem('token')).toBe('gt');
      expect(localStorage.getItem('userId')).toBe('9');
    });
  });

  describe('refreshUser function', () => {
    it('re-fetches profile and updates user state', async () => {
      localStorage.setItem('token', 'tok');
      localStorage.setItem('userId', '1');
      authAPI.getProfile
          .mockResolvedValueOnce({ data: { userId: '1', email: 'old@test.com', role: 'PASSENGER' } })
          .mockResolvedValueOnce({ data: { userId: '1', email: 'new@test.com', role: 'PASSENGER' } });

      const RefreshConsumer = () => {
        const { user, refreshUser } = useAuth();
        return (
            <div>
              <span data-testid="rUser">{user ? user.email : 'null'}</span>
              <button data-testid="rBtn" onClick={refreshUser}>Refresh</button>
            </div>
        );
      };

      render(<AuthProvider><RefreshConsumer /></AuthProvider>);
      await waitFor(() => expect(screen.getByTestId('rUser').textContent).toContain('old@test.com'));

      await act(async () => { screen.getByTestId('rBtn').click(); });
      await waitFor(() => expect(screen.getByTestId('rUser').textContent).toContain('new@test.com'));
    });
  });

  describe('register function', () => {
    it('sets user after successful register', async () => {
      authAPI.getProfile.mockResolvedValue({ data: {} });
      authAPI.register = jest.fn().mockResolvedValue({
        data: { token: 'rt', userId: '5', email: 'new@test.com', role: 'PASSENGER' },
      });

      const RegisterConsumer = () => {
        const { user, register } = useAuth();
        return (
            <div>
              <span data-testid="regUser">{user ? user.email : 'null'}</span>
              <button data-testid="regBtn" onClick={() => register({ email: 'new@test.com' })}>Register</button>
            </div>
        );
      };

      render(<AuthProvider><RegisterConsumer /></AuthProvider>);
      await waitFor(() => expect(screen.getByTestId('regUser').textContent).toBe('null'));

      await act(async () => { screen.getByTestId('regBtn').click(); });
      await waitFor(() => expect(screen.getByTestId('regUser').textContent).toContain('new@test.com'));
      expect(localStorage.getItem('token')).toBe('rt');
    });
  });

  describe('useAuth hook', () => {
    it('throws when used outside AuthProvider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const Bad = () => { useAuth(); return null; };
      expect(() => render(<Bad />)).toThrow('useAuth must be used within AuthProvider');
      consoleError.mockRestore();
    });
  });
});