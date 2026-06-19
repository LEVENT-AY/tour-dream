import { useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../sidebar/sidebar';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { changeAgentPassword, sendAgentPasswordReset } from '../../../../core/services/agentServices';

const AgentSecuritySettings = () => {
  const routes = all_routes;
  const { userProfile, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await changeAgentPassword(currentPassword, newPassword);
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setMessage('');
    try {
      await sendAgentPasswordReset();
      setMessage('Password reset email sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email.');
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
            <div className="col-xl-3 col-lg-4">
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
                    <Link to={routes.agentSecuritySettings} className="active ps-3"><i className="isax isax-shield-tick me-2" />Security</Link>
                    <Link to={routes.agentPlanSettings}><i className="isax isax-star me-2" />Plans &amp; Billing</Link>
                    <Link to={routes.agentNotificationSettings}><i className="isax isax-notification me-2" />Notifications</Link>
                  </div>

                  {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
                  {message && <div className="alert alert-success mt-3 mb-0">{message}</div>}

                  <div className="row g-3 mt-3">
                    <div className="col-lg-6 d-flex">
                      <div className="security-content flex-fill bg-gray-transparent rounded border-0 mb-2">
                        <h6 className="fs-14 mb-2">Account Summary</h6>
                        <p className="fs-14 text-gray-6 fw-normal mb-1">Email: {userProfile.email || '—'}</p>
                        <p className="fs-14 text-gray-6 fw-normal mb-1">Phone: {userProfile.phone || '—'}</p>
                        <p className="fs-14 text-gray-6 fw-normal mb-1">Agent Status: {userProfile.agentStatus || 'pending'}</p>
                        <p className="fs-14 text-gray-6 fw-normal mb-1">Approved: {userProfile.approved ? 'Yes' : 'No'}</p>
                        <p className="fs-14 text-gray-6 fw-normal mb-0">Suspended: {userProfile.suspended ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <div className="col-lg-6 d-flex">
                      <div className="security-content flex-fill bg-gray-transparent rounded border-0 mb-2">
                        <form onSubmit={handlePasswordSubmit}>
                          <h6 className="fs-14 mb-2">Change Password</h6>
                          <input className="form-control mb-2" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                          <input className="form-control mb-2" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                          <input className="form-control mb-3" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                          <div className="d-flex gap-2">
                            <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>{saving ? 'Changing...' : 'Change'}</button>
                            <button type="button" className="btn btn-light btn-sm" onClick={handleReset}>Reset Email</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSecuritySettings;
