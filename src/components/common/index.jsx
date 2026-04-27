import React from 'react';
import { X } from 'lucide-react';

// Modal
export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;
  const maxWidths = { sm: '420px', md: '560px', lg: '720px', xl: '900px' };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: maxWidths[size] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '18px', fontWeight: 700, color: 'var(--gray-800)' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '4px', borderRadius: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// Loading Spinner
export const LoadingSpinner = ({ size = 'md', text }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px' }}>
    <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
    {text && <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>{text}</p>}
  </div>
);

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="empty-state">
    {Icon && <Icon size={48} />}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div style={{ marginTop: '16px' }}>{action}</div>}
  </div>
);

// Confirm Dialog
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="sm"
    footer={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm`} onClick={onConfirm}>
          {confirmText}
        </button>
      </>
    }
  >
    <p style={{ color: 'var(--gray-600)', fontSize: '14px', lineHeight: 1.7 }}>{message}</p>
  </Modal>
);

// Page Header
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginTop: '4px' }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{actions}</div>}
  </div>
);

// Badge
export const Badge = ({ status, label }) => {
  const map = {
    CONFIRMED: 'badge-success', COMPLETED: 'badge-success', ARRIVED: 'badge-success', AVAILABLE: 'badge-success',
    PENDING: 'badge-warning', ON_TIME: 'badge-info', DELAYED: 'badge-warning', HELD: 'badge-warning',
    CANCELLED: 'badge-error', NO_SHOW: 'badge-error', BLOCKED: 'badge-error',
    DEPARTED: 'badge-purple', FIRST: 'badge-purple', BUSINESS: 'badge-info', ECONOMY: 'badge-gray',
    SUCCESS: 'badge-success', FAILED: 'badge-error', REFUNDED: 'badge-warning',
    true: 'badge-success', false: 'badge-gray',
  };
  return (
    <span className={`badge ${map[status] || 'badge-gray'}`}>
      {label || status}
    </span>
  );
};

// Input with label
export const FormField = ({ label, error, children }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    {children}
    {error && <span className="error-text">{error}</span>}
  </div>
);
