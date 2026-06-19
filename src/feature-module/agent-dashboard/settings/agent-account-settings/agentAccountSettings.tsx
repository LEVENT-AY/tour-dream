import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../sidebar/sidebar';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { changeAgentPassword, sendAgentPasswordReset, updateAgentProfile } from '../../../../core/services/agentServices';

const AgentAccountSettings = () => {
  const routes = all_routes;
  const { userProfile, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    setPhone(userProfile.phone || '');
  }, [userProfile]);

  const handlePhoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    setSavingPhone(true);
    setError('');
    setMessage('');
    try {
      await updateAgentProfile(userProfile.uid, { phone });
      setMessage('Phone number saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save phone number.');
    } finally {
      setSavingPhone(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
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
      setChangingPassword(false);
    }
  };

  const handleReset = async () => {
    setError('');
    setMessage('');
    try {
      await sendAgentPasswordReset();
      setMessage('Password reset email sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send password reset email.');
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
                    <Link to={routes.agentAccountSettings} className="active ps-3"><i className="isax isax-wallet-money me-2" />Account Settings</Link>
                    <Link to={routes.agentSecuritySettings}><i className="isax isax-shield-tick me-2" />Security</Link>
                    <Link to={routes.agentPlanSettings}><i className="isax isax-star me-2" />Plans &amp; Billing</Link>
                    <Link to={routes.agentNotificationSettings}><i className="isax isax-notification me-2" />Notifications</Link>
                  </div>

                  {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
                  {message && <div className="alert alert-success mt-3 mb-0">{message}</div>}

                  <div className="row g-3 mt-3">
                    <div className="col-lg-6">
                      <div className="card shadow-none bg-gray-transparent h-100">
                        <div className="card-body">
                          <h6 className="mb-3">Contact</h6>
                          <p className="mb-2 text-muted">Email: {userProfile.email || '—'}</p>
                          <p className="mb-2 text-muted">Display Name: {userProfile.displayName || '—'}</p>
                          <p className="mb-2 text-muted">Status: {userProfile.agentStatus || 'pending'}</p>
                          <p className="mb-2 text-muted">Approved: {userProfile.approved ? 'Yes' : 'No'}</p>
                          <p className="mb-3 text-muted">Suspended: {userProfile.suspended ? 'Yes' : 'No'}</p>
                          <form onSubmit={handlePhoneSave}>
                            <label className="form-label">Phone Number</label>
                            <input type="tel" className="form-control mb-3" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            <button className="btn btn-primary" type="submit" disabled={savingPhone}>{savingPhone ? 'Saving...' : 'Save Phone'}</button>
                          </form>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-6">
                      <div className="card shadow-none bg-gray-transparent h-100">
                        <div className="card-body">
                          <h6 className="mb-3">Password</h6>
                          <form onSubmit={handlePasswordChange}>
                            <label className="form-label">Current Password</label>
                            <input className="form-control mb-3" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                            <label className="form-label">New Password</label>
                            <input className="form-control mb-3" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <label className="form-label">Confirm Password</label>
                            <input className="form-control mb-3" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <div className="d-flex gap-2">
                              <button className="btn btn-primary" type="submit" disabled={changingPassword}>{changingPassword ? 'Changing...' : 'Change Password'}</button>
                              <button type="button" className="btn btn-light" onClick={handleReset}>Send Reset Email</button>
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
    </div>
  );
};

export default AgentAccountSettings;
