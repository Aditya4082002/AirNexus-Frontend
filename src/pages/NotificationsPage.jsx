import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';
import { EmptyState, LoadingSpinner, PageHeader } from '../components/common';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationAPI.getNotificationsByUser(user.userId);
      setNotifications(res.data || []);
    } catch { toast.error('Failed to load notifications.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.userId) fetchNotifications(); }, [user]);

  const markRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(ns => ns.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    } catch { toast.error('Failed.'); }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead(user.userId);
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read.');
    } catch { toast.error('Failed.'); }
  };

  const deleteNotif = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(ns => ns.filter(n => n.notificationId !== id));
      toast.success('Notification deleted.');
    } catch { toast.error('Failed.'); }
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const TYPE_ICONS = { EMAIL: '📧', SMS: '📱', PUSH: '🔔' };

  return (
    <div className="page-wrapper">
      <PageHeader title="Notifications" subtitle={`${unreadCount} unread`} actions={
        unreadCount > 0 && <button className="btn btn-secondary" onClick={markAllRead}><CheckCheck size={15} /> Mark All Read</button>
      } />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[['all', 'All'], ['unread', 'Unread']].map(([val, label]) => (
          <button key={val} className={`btn ${filter === val ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter(val)}>
            {label}{val === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner text="Loading notifications…" /> : (
        <div className="glass-card">
          {filtered.length === 0 ? <EmptyState icon={Bell} title="No notifications" description={filter === 'unread' ? "You're all caught up!" : "No notifications yet"} /> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filtered.map((n, i) => (
                <div key={n.notificationId} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(37,99,235,0.06)' : 'none',
                  background: !n.isRead ? 'rgba(37,99,235,0.03)' : 'transparent', transition: 'background 0.2s',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: !n.isRead ? 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(29,78,216,0.1))' : 'rgba(37,99,235,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {TYPE_ICONS[n.type] || '🔔'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {n.title && <div style={{ fontFamily: 'var(--font-primary)', fontWeight: n.isRead ? 500 : 700, fontSize: '14px', color: 'var(--gray-800)', marginBottom: '3px' }}>{n.title}</div>}
                    <div style={{ fontSize: '13px', color: 'var(--gray-600)', lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '5px' }}>{formatDateTime(n.sentAt)} · {n.type || 'NOTIFICATION'}</div>
                  </div>
                  {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-600)', flexShrink: 0, marginTop: '6px' }} />}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {!n.isRead && (
                      <button className="btn btn-ghost btn-sm" onClick={() => markRead(n.notificationId)} title="Mark as read"><Check size={14} /></button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteNotif(n.notificationId)} title="Delete" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
