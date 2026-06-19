
import { useEffect, useState } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import DeleteModal from './deleteModal';
import { all_routes } from '../../router/all_routes';
import Sidebar from '../sidebar/sidebar';
import { useAuth } from '../../../core/contexts/AuthContext';
import {
  fetchAgentNotifications,
  markAgentNotificationRead,
  deleteAgentNotification,
  type AgentNotificationItem,
} from '../../../core/services/agentServices';

const AgentNotification = () => {

  const routes = all_routes;
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AgentNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentNotificationItem | null>(null);

  const loadNotifications = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAgentNotifications(userProfile.uid);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid]);

  const handleMarkRead = async (id: string, read: boolean) => {
    try {
      await markAgentNotificationRead(id, read);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read } : n))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read && n.id);
    await Promise.all(unread.map((n) => handleMarkRead(n.id!, true)));
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteAgentNotification(deleteTarget.id);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    const withIds = notifications.filter((n) => n.id);
    await Promise.all(withIds.map((n) => n.id && deleteAgentNotification(n.id)));
    setNotifications([]);
    setDeleteTarget(null);
  };

  const formatDate = (value?: string) => {
    if (!value) return '—';
    try {
      const date = new Date(value);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return value;
    }
  };

  //Breadcrumb Data
  const breadcrumbs = [
    {
      label: 'Notifications',
      link: routes.allService1,
      active: false,
    },
    {
      label: 'Notifications',
      active: true,
    },
  ];

  return (
    <div>
      <Breadcrumb
        title="Notifications"
        breadcrumbs={breadcrumbs}
        backgroundClass="breadcrumb-bg-01"
      />

      {/* Page Wrapper */}
      <div className="content">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-xl-3 col-lg-4 theiaStickySidebar">
              <Sidebar />
            </div>

            {/* /Sidebar */}
            {/* Notifications */}
            <div className="col-xl-9 col-lg-8">
              <div className="card shadow-none mb-0">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center flex-wrap row-gap-3">
                    <h6>Notifications</h6>
                    <div className="d-flex">
                      <Link
                        to="#"
                        className="btn btn-light btn-sm d-flex align-items-center me-2"
                        onClick={(e) => {
                          e.preventDefault();
                          handleMarkAllRead();
                        }}
                      >
                        <i className="isax isax-tick-square me-2" />
                        Mark all as Read
                      </Link>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm d-flex align-items-center"
                        data-bs-toggle="modal"
                        data-bs-target="#delete_modal"
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget({ title: 'all notifications', body: '' });
                        }}
                      >
                        <i className="isax isax-trash me-2" />
                        Delete All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger alert-dismissible fade show">
                      {error}
                      <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-5">
                      <span className="spinner-border spinner-border-sm text-primary me-2" />
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-5">
                      <h6>No notifications</h6>
                      <p className="text-muted mb-0">You have no notifications at the moment.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div className={`card notification-card ${notification.read ? 'bg-light' : ''}`} key={notification.id}>
                        <div className="card-body d-sm-flex align-items-center">
                          <span className={`avatar avatar-lg rounded-circle ${notification.read ? 'bg-secondary' : 'bg-info'} flex-shrink-0 me-sm-3 mb-3 mb-sm-0`}>
                            <i className="isax isax-calendar-edit5" />
                          </span>
                          <div className="flex-fill">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="fs-16">{notification.title}</h6>
                              <div className="d-flex align-items-center">
                                <Link
                                  to="#"
                                  className="btn btn-light btn-sm me-2"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (notification.id) handleMarkRead(notification.id, !notification.read);
                                  }}
                                  title={notification.read ? 'Mark as unread' : 'Mark as read'}
                                >
                                  <i className={`isax ${notification.read ? 'isax-sms-notification' : 'isax-tick-square'} me-1`} />
                                  {notification.read ? 'Unread' : 'Read'}
                                </Link>
                                <Link
                                  to="#"
                                  className="notification-delete-btn btn btn-primary btn-sm"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_modal"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setDeleteTarget(notification);
                                  }}
                                >
                                  Delete
                                </Link>
                              </div>
                            </div>
                            <p className=" mb-1">
                              {notification.body}
                            </p>
                            <p className="text-gray-9">{formatDate(notification.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* /Notifications */}
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      <DeleteModal onConfirm={deleteTarget?.title === 'all notifications' ? handleDeleteAll : handleDelete} />


    </div>
  )
}

export default AgentNotification
