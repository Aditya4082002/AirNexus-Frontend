import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy'); } catch { return date; }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try { return format(new Date(date), 'dd MMM yyyy, HH:mm'); } catch { return date; }
};

export const formatTime = (date) => {
  if (!date) return '—';
  try { return format(new Date(date), 'HH:mm'); } catch { return date; }
};

export const timeAgo = (date) => {
  if (!date) return '—';
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return date; }
};

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
};

export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const getStatusBadgeClass = (status) => {
  const map = {
    CONFIRMED: 'badge-success', COMPLETED: 'badge-success', ARRIVED: 'badge-success', AVAILABLE: 'badge-success',
    PENDING: 'badge-warning', ON_TIME: 'badge-info', DELAYED: 'badge-warning', HELD: 'badge-warning',
    CANCELLED: 'badge-error', NO_SHOW: 'badge-error', BLOCKED: 'badge-error',
    DEPARTED: 'badge-purple', FIRST: 'badge-purple', BUSINESS: 'badge-info', ECONOMY: 'badge-gray',
  };
  return map[status] || 'badge-gray';
};

export const truncate = (str, len = 30) =>
  str && str.length > len ? str.substring(0, len) + '…' : str;

export const classNames = (...classes) => classes.filter(Boolean).join(' ');
