import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../sidebar/sidebar';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { updateAgentProfile, type AgentNotificationPrefs } from '../../../../core/services/agentServices';

const defaultPrefs: AgentNotificationPrefs = {
  bookingAlerts: { push: false, sms: true, email: true },
  commissionAlerts: { push: false, sms: true, email: true },
  reviewAlerts: { push: true, sms: false, email: false },
  listingAlerts: { push: true, sms: false, email: true },
  systemAnnouncements: { push: true, sms: false, email: true },
};

const AgentNotificationSettings = () => {
  const routes = all_routes;
  const { userProfile, loading } = useAuth();
  const [prefs, setPrefs] = useState<AgentNotificationPrefs>(defaultPrefs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile?.notifications) {
      setPrefs({ ...defaultPrefs, ...userProfile.notifications });
    }
  }, [userProfile?.notifications]);

  const toggle = (category: keyof AgentNotificationPrefs, channel: 'push' | 'sms' | 'email') => {
    setPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel],
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateAgentProfile(userProfile.uid, { notifications: prefs });
      setMessage('Notification preferences saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save notifications.');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Settings', active: false, link: routes.home1 },
    { label: 'Settings', active: true },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return <div className="alert alert-danger m-4">Unable to load agent profile.</div>;
  }

  return (
    <div>
      <Breadcrumb title="Settings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4 theiaStickySidebar">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card settings mb-0">
                <div className="card-header"><h6>Settings</h6></div>
                <div className="card-body pb-3">
                  <div className="settings-link d-flex align-items-center flex-wrap">
                    <Link to={routes.agentSettings}><i className="isax isax-user-octagon me-2" />Edit Profile</Link>
                    <Link to={routes.agentBussinessDetails}><i className="isax isax-buildings-2 me-2" />Bussiness Details</Link>
                    <Link to={routes.agentAccountSettings}><i className="isax isax-wallet-money me-2" />Account Settings</Link>
                    <Link to={routes.agentSecuritySettings}><i className="isax isax-shield-tick me-2" />Security</Link>
                    <Link to={routes.agentPlanSettings}><i className="isax isax-star me-2" />Plans &amp; Billing</Link>
                    <Link to={routes.agentNotificationSettings} className="active ps-3"><i className="isax isax-notification me-2" />Notifications</Link>
                  </div>

                  {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
                  {message && <div className="alert alert-success mt-3 mb-0">{message}</div>}

                  <div className="mt-3 mb-3 p-3 bg-light rounded">
                    <div className="row g-2">
                      <div className="col-md-4"><strong>Email:</strong> {userProfile.email || '—'}</div>
                      <div className="col-md-4"><strong>Display Name:</strong> {userProfile.displayName || '—'}</div>
                      <div className="col-md-4"><strong>Phone:</strong> {userProfile.phone || '—'}</div>
                    </div>
                    <div className="row g-2 mt-1">
                      <div className="col-md-4"><strong>Business:</strong> {userProfile.businessName || '—'}</div>
                      <div className="col-md-4"><strong>Status:</strong> {userProfile.agentStatus || 'pending'}</div>
                      <div className="col-md-4"><strong>Approved:</strong> {userProfile.approved ? 'Yes' : 'No'} / <strong>Suspended:</strong> {userProfile.suspended ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  <form onSubmit={handleSave}>
                    <div className="row mb-3 row-gap-3">
                      <div className="col-md-6">
                        <h6 className="fs-14 mb-1">Booking Status Alerts</h6>
                        <p className="fs-14 fw-normal">Get notified when a booking is confirmed, modified, or cancelled.</p>
                      </div>
                      {(['push', 'sms', 'email'] as const).map((channel) => (
                        <div className="col-2" key={`booking-${channel}`}>
                          <h6 className="fs-14 mb-1">{channel.toUpperCase()}</h6>
                          <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" role="switch" checked={!!prefs.bookingAlerts?.[channel]} onChange={() => toggle('bookingAlerts', channel)} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="row mb-3 row-gap-3">
                      <div className="col-md-6"><h6 className="fs-14 mb-1">Commission Status Alerts</h6><p className="fs-14 fw-normal">Instant updates when your commission changes.</p></div>
                      {(['push', 'sms', 'email'] as const).map((channel) => (
                        <div className="col-2" key={`commission-${channel}`}>
                          <h6 className="fs-14 mb-1">{channel.toUpperCase()}</h6>
                          <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" checked={!!prefs.commissionAlerts?.[channel]} onChange={() => toggle('commissionAlerts', channel)} /></div>
                        </div>
                      ))}
                    </div>

                    <div className="row mb-3 row-gap-3">
                      <div className="col-md-6"><h6 className="fs-14 mb-1">New Review Notifications</h6><p className="fs-14 fw-normal">Alerts when a customer submits a new review.</p></div>
                      {(['push', 'sms', 'email'] as const).map((channel) => (
                        <div className="col-2" key={`review-${channel}`}>
                          <h6 className="fs-14 mb-1">{channel.toUpperCase()}</h6>
                          <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" checked={!!prefs.reviewAlerts?.[channel]} onChange={() => toggle('reviewAlerts', channel)} /></div>
                        </div>
                      ))}
                    </div>

                    <div className="row mb-3 row-gap-3">
                      <div className="col-md-6"><h6 className="fs-14 mb-1">Service Listing Updates</h6><p className="fs-14 fw-normal">Get notified when your listing is approved or rejected.</p></div>
                      {(['push', 'sms', 'email'] as const).map((channel) => (
                        <div className="col-2" key={`listing-${channel}`}>
                          <h6 className="fs-14 mb-1">{channel.toUpperCase()}</h6>
                          <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" checked={!!prefs.listingAlerts?.[channel]} onChange={() => toggle('listingAlerts', channel)} /></div>
                        </div>
                      ))}
                    </div>

                    <div className="row mb-3 row-gap-3">
                      <div className="col-md-6"><h6 className="fs-14 mb-1">System Announcements</h6><p className="fs-14 fw-normal">Platform updates, feature releases, and dashboard notices.</p></div>
                      {(['push', 'sms', 'email'] as const).map((channel) => (
                        <div className="col-2" key={`system-${channel}`}>
                          <h6 className="fs-14 mb-1">{channel.toUpperCase()}</h6>
                          <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" checked={!!prefs.systemAnnouncements?.[channel]} onChange={() => toggle('systemAnnouncements', channel)} /></div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentNotificationSettings;
