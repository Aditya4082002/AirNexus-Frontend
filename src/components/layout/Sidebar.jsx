import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Plane, LayoutDashboard, Ticket, Users, CreditCard,
  Bell, Building2, MapPin, LogOut, User, Menu, X,
  ChevronRight, ShieldCheck, Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

// Navigation items per role
const passengerNav = [
  { path: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/bookings',     icon: Ticket,          label: 'My Bookings' },
  { path: '/passengers',   icon: Users,           label: 'Passengers' },
  { path: '/payments',     icon: CreditCard,      label: 'Payments' },
  { path: '/notifications',icon: Bell,            label: 'Notifications' },
  { path: '/profile',      icon: User,            label: 'Profile' },
];

const staffNav = [
  { path: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/bookings',     icon: Ticket,          label: 'Bookings' },
  { path: '/passengers',   icon: Users,           label: 'Passengers' },
  { path: '/airlines',     icon: Building2,       label: 'Airlines' },
  { path: '/airports',     icon: MapPin,          label: 'Airports' },
  { path: '/notifications',icon: Bell,            label: 'Notifications' },
  { path: '/profile',      icon: User,            label: 'Profile' },
];

const adminNav = [
  { path: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/bookings',     icon: Ticket,          label: 'All Bookings' },
  { path: '/passengers',   icon: Users,           label: 'Passengers' },
  { path: '/payments',     icon: CreditCard,      label: 'Payments' },
  { path: '/airlines',     icon: Building2,       label: 'Airlines' },
  { path: '/airports',     icon: MapPin,          label: 'Airports' },
  { path: '/notifications',icon: Bell,            label: 'Notifications' },
  { path: '/profile',      icon: User,            label: 'Profile' },
];

// Guest nav (not logged in)
const guestNav = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
];

const getRoleLabel = (role) => {
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'AIRLINE_STAFF') return 'Airline Staff';
  return 'Passenger';
};

const getRoleIcon = (role) => {
  if (role === 'ADMIN') return ShieldCheck;
  if (role === 'AIRLINE_STAFF') return Briefcase;
  return User;
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const navItems = !user ? guestNav
    : isAdmin() ? adminNav
    : isStaff() ? staffNav
    : passengerNav;

  const RoleIcon = user ? getRoleIcon(user.role) : User;

  const SidebarContent = () => (
    <div className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <div className="sidebar__logo"><Plane size={20} /></div>
          {!collapsed && <span className="sidebar__brand-name">AirNexus</span>}
        </div>
        <button className="sidebar__toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Role badge */}
      {user && !collapsed && (
        <div className="sidebar__role-badge">
          <RoleIcon size={12} />
          <span>{getRoleLabel(user.role)}</span>
        </div>
      )}

      <nav className="sidebar__nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path + label}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={18} className="sidebar__icon" />
            {!collapsed && <span className="sidebar__label">{label}</span>}
            {collapsed && <span className="sidebar__tooltip">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        {user ? (
          <>
            {!collapsed && (
              <div className="sidebar__user">
                <div className="sidebar__avatar">
                  {(user.fullName || user.email)?.charAt(0).toUpperCase()}
                </div>
                <div className="sidebar__user-info">
                  <span className="sidebar__user-email">{user.fullName || user.email}</span>
                  <span className="sidebar__user-role">{getRoleLabel(user.role)}</span>
                </div>
              </div>
            )}
            <button className="sidebar__logout" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
              {!collapsed && <span>Logout</span>}
            </button>
          </>
        ) : (
          !collapsed && (
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>Sign In</button>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/register')}>Register</button>
            </div>
          )
        )}
      </div>
    </div>
  );

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}><Menu size={22} /></button>

      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-sidebar" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={20} /></button>
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="desktop-sidebar"><SidebarContent /></div>
    </>
  );
};

export default Sidebar;
