import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Mail, Lock, User, Eye, EyeOff, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../components/auth/Auth.css';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const RegisterPage = () => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created! Welcome to AirNexus.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleGoogleSignUp = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error('Google sign-up is not configured.');
      return;
    }
    setGoogleLoading(true);
    window.google?.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        try {
          await googleLogin(credential);
          toast.success('Account created! Welcome to AirNexus.');
          navigate('/');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Google sign-up failed.');
        } finally { setGoogleLoading(false); }
      },
    });
    window.google?.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleLoading(false);
      }
    });
  };

  const f = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb--1" />
      <div className="auth-bg-orb auth-bg-orb--2" />
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Plane size={24} /></div>
          <span className="auth-logo-name">AirNexus</span>
        </div>
        <div className="auth-header">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join AirNexus — free to search, easy to book</p>
        </div>

        <button className="btn-google" onClick={handleGoogleSignUp} disabled={googleLoading || loading}>
          {googleLoading ? <><div className="spinner" /> Signing up…</> : <><GoogleIcon /> Continue with Google</>}
        </button>

        <div className="auth-divider">or sign up with email</div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="form-label">Full Name</label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input type="text" className="form-input auth-input" placeholder="John Doe" {...f('fullName')} required />
            </div>
          </div>
          <div className="auth-field">
            <label className="form-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input type="email" className="form-input auth-input" placeholder="you@example.com" {...f('email')} required />
            </div>
          </div>
          <div className="auth-field">
            <label className="form-label">Phone (optional)</label>
            <div className="auth-input-wrap">
              <Phone size={16} className="auth-input-icon" />
              <input type="tel" className="form-input auth-input" placeholder="+91 98765 43210" {...f('phone')} />
            </div>
          </div>
          <div className="auth-field">
            <label className="form-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input type={showPw ? 'text' : 'password'} className="form-input auth-input auth-input--pw"
                placeholder="Min. 8 characters" {...f('password')} required />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label className="form-label">Confirm Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input type="password" className="form-input auth-input" placeholder="••••••••" {...f('confirmPassword')} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading || googleLoading}>
            {loading ? <><div className="spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer-text">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
        <p className="auth-footer-text" style={{ marginTop: '8px' }}>
          <Link to="/" className="auth-link" style={{ color: 'var(--gray-400)', fontWeight: 400 }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
