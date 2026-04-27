import React, { useState } from 'react';
import { User, Lock, Save, Globe, Phone, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/common';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    passportNumber: user?.passportNumber || '',
    nationality: user?.nationality || '',
  });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await authAPI.updateProfile(profileForm);
      await refreshUser();
      toast.success('Profile updated!');
    } catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setChangingPw(true);
    try {
      await authAPI.changePassword(pwForm.oldPassword, pwForm.newPassword);
      toast.success('Password changed successfully!');
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch { toast.error('Password change failed. Check your current password.'); }
    finally { setChangingPw(false); }
  };

  const pf = (k) => ({ value: profileForm[k] || '', onChange: (e) => setProfileForm({ ...profileForm, [k]: e.target.value }) });
  const wf = (k) => ({ value: pwForm[k] || '', onChange: (e) => setPwForm({ ...pwForm, [k]: e.target.value }) });

  const getRoleColor = (role) => {
    if (role === 'ADMIN') return 'linear-gradient(135deg,#1a3a5c,#0f2942)';
    if (role === 'AIRLINE_STAFF') return 'linear-gradient(135deg,#1d4ed8,#1a3a5c)';
    return 'linear-gradient(135deg,#3b82f6,#2563eb)';
  };

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Administrator';
    if (role === 'AIRLINE_STAFF') return 'Airline Staff';
    return 'Passenger';
  };

  return (
    <div className="page-wrapper">
      <PageHeader title="Profile" subtitle="Manage your account settings and travel documents" />
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Side nav */}
        <div className="glass-card" style={{ width: '220px', padding: '8px', flexShrink: 0 }}>
          <div style={{ padding: '20px 12px 20px', textAlign: 'center', borderBottom: '1px solid rgba(37,99,235,0.08)', marginBottom: '8px' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: getRoleColor(user?.role), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '26px', fontWeight: 700, color: 'white', fontFamily: 'var(--font-primary)', boxShadow: '0 6px 20px rgba(37,99,235,0.3)' }}>
              {(user?.fullName || user?.email)?.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '4px' }}>{user?.fullName || 'User'}</div>
            <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginBottom: '6px' }}>{user?.email}</div>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>{getRoleLabel(user?.role)}</span>
          </div>
          {[['profile', User, 'Profile Info'], ['password', Lock, 'Change Password']].map(([t, Icon, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-primary)', fontWeight: 500, background: tab === t ? 'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(29,78,216,0.1))' : 'none', color: tab === t ? 'var(--blue-700)' : 'var(--gray-600)', transition: 'var(--transition)' }}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card p-6" style={{ flex: 1, minWidth: '300px' }}>
          {tab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h2 className="section-title" style={{ marginBottom: '20px' }}>Profile Information</h2>
              <div className="form-group">
                <label className="form-label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Full Name</label>
                <input className="form-input" placeholder="John Doe" {...pf('fullName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" {...pf('email')} required />
              </div>
              <div className="form-group">
                <label className="form-label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Phone</label>
                <input className="form-input" placeholder="+91 98765 43210" {...pf('phone')} />
              </div>
              <div className="divider" />
              <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '14px', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} /> Travel Documents
              </h3>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Passport Number</label>
                  <input className="form-input" placeholder="P1234567" {...pf('passportNumber')} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Globe size={12} style={{ display: 'inline', marginRight: 4 }} />Nationality</label>
                  <input className="form-input" placeholder="Indian" {...pf('nationality')} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '8px' }}>
                {saving ? <div className="spinner" /> : <Save size={15} />} Save Changes
              </button>
            </form>
          )}
          {tab === 'password' && (
            <form onSubmit={handlePasswordChange}>
              <h2 className="section-title" style={{ marginBottom: '20px' }}>Change Password</h2>
              <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-input" placeholder="••••••••" {...wf('oldPassword')} required /></div>
              <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-input" placeholder="Min. 8 characters" {...wf('newPassword')} required /></div>
              <div className="form-group"><label className="form-label">Confirm New Password</label><input type="password" className="form-input" placeholder="••••••••" {...wf('confirmPassword')} required /></div>
              <button type="submit" className="btn btn-primary" disabled={changingPw} style={{ marginTop: '8px' }}>
                {changingPw ? <div className="spinner" /> : <Lock size={15} />} Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
