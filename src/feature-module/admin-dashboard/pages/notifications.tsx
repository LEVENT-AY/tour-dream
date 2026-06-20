import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../core/contexts/AuthContext';
import {
  deleteNotification,
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../../../core/services/firebaseServices';

const AdminNotifications: React.FC = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      setNotifications(await fetchUserNotifications(userProfile.uid));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid]);

  const toggleRead = async (notificationId: string, read: boolean) => {
    if (!userProfile?.uid) return;
    await markNotificationRead(userProfile.uid, notificationId, read);
    setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, read } : item)));
  };

  const remove = async (notificationId: string) => {
    if (!userProfile?.uid) return;
    await deleteNotification(userProfile.uid, notificationId);
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
  };

  const readAll = async () => {
    if (!userProfile?.uid) return;
    await markAllNotificationsRead(userProfile.uid);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">Notifications</h3>
        <button className="btn btn-light" onClick={readAll}>Mark all as read</button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Booking</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">No notifications found.</td>
                  </tr>
                ) : (
                  notifications.map((notification) => (
                    <tr key={notification.id} className={notification.read ? '' : 'table-warning'}>
                      <td>
                        <div className="fw-medium">{notification.title}</div>
                        <div className="small text-muted">{notification.message || notification.body}</div>
                      </td>
                      <td>{notification.type || 'notification'}</td>
                      <td>{notification.bookingId || '—'}</td>
                      <td>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <span className={`badge ${notification.read ? 'bg-secondary' : 'bg-primary'}`}>
                          {notification.read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-light me-2" onClick={() => notification.id && toggleRead(notification.id, !notification.read)}>
                          {notification.read ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => notification.id && remove(notification.id)}>
                          <i className="isax isax-trash" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
