import React, { useEffect, useState } from 'react';
import {
  fetchNotifications,
  createNotification,
  markNotificationRead,
  deleteNotification,
  fetchUsersByRole,
  type AppNotification,
  type AdminUserView,
} from '../../../core/services/firebaseServices';

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', role: 'all', userId: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [n, allUsers] = await Promise.all([fetchNotifications(), fetchUsersByRole('customer')]);
      setNotifications(n);
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const payload: Omit<AppNotification, 'id' | 'createdAt'> = {
        title: form.title,
        body: form.body,
      };
      if (form.userId) {
        payload.userId = form.userId;
      } else if (form.role !== 'all') {
        payload.role = form.role as any;
      }
      await createNotification(payload);
      setForm({ title: '', body: '', role: 'all', userId: '' });
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRead = async (id: string, read: boolean) => {
    try {
      await markNotificationRead(id, read);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteNotification(id);
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
        <h3 className="mb-0">Notifications</h3>
        <button className="btn btn-primary d-flex align-items-center" onClick={() => setModalOpen(true)}>
          <i className="isax isax-notification-bing me-2" />
          Send Notification
        </button>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Recipient</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No notifications found.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className={n.read ? '' : 'table-warning'}>
                      <td>
                        <div className="fw-medium">{n.title}</div>
                        <div className="small text-muted text-truncate" style={{ maxWidth: '300px' }}>
                          {n.body}
                        </div>
                      </td>
                      <td>
                        {n.userId
                          ? users.find((u) => u.uid === n.userId)?.email || n.userId
                          : n.role
                          ? `All ${n.role}s`
                          : 'All users'}
                      </td>
                      <td>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}</td>
                      <td>
                        <span className={`badge ${n.read ? 'bg-secondary' : 'bg-primary'}`}>
                          {n.read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-light me-2"
                          onClick={() => toggleRead(n.id!, !n.read)}
                        >
                          {n.read ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(n.id!)}>
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

      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Send Notification</h5>
                  <button type="button" className="btn-close" onClick={() => setModalOpen(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.body}
                      onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Recipient Role</label>
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, userId: '' }))}
                    >
                      <option value="all">All Users</option>
                      <option value="customer">Customers</option>
                      <option value="agent">Agents</option>
                      <option value="admin">Admins</option>
                      <option value="specific">Specific Customer</option>
                    </select>
                  </div>
                  {form.role === 'specific' && (
                    <div className="mb-3">
                      <label className="form-label">Select Customer</label>
                      <select
                        className="form-select"
                        value={form.userId}
                        onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                        required
                      >
                        <option value="">Choose customer</option>
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>
                            {u.displayName || u.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
