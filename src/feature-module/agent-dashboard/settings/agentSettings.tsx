import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Sidebar from '../sidebar/sidebar';
import { useAuth } from '../../../core/contexts/AuthContext';
import { updateAgentProfile, uploadAgentProfilePhoto } from '../../../core/services/agentServices';

const initialForm = {
  displayName: '',
  phone: '',
  businessName: '',
  businessType: '',
  businessAddress: '',
  description: '',
};

const AgentSettings = () => {
  const routes = all_routes;
  const { userProfile, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!userProfile) return;
    setForm({
      displayName: userProfile.displayName || '',
      phone: userProfile.phone || '',
      businessName: userProfile.businessName || '',
      businessType: userProfile.businessType || '',
      businessAddress: userProfile.businessAddress || '',
      description: userProfile.description || '',
    });
    setPhotoURL(userProfile.photoURL || '');
  }, [userProfile]);

  const handleChange = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const result = await uploadAgentProfilePhoto(userProfile.uid, file);
      setPhotoURL(result.url);
      setSuccess('Profile image updated successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to upload profile image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateAgentProfile(userProfile.uid, {
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        photoURL,
        businessName: form.businessName.trim(),
        businessType: form.businessType.trim(),
        businessAddress: form.businessAddress.trim(),
        description: form.description.trim(),
      });
      setSuccess('Profile saved successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile.');
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
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-danger mb-0">Unable to load agent profile.</div>
      </div>
    );
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
                <div className="card-header">
                  <h6>Settings</h6>
                </div>
                <div className="card-body pb-3">
                  <div className="settings-link d-flex align-items-center flex-wrap">
                    <Link to={routes.agentSettings} className="active ps-3">
                      <i className="isax isax-user-octagon me-2" />
                      Edit Profile
                    </Link>
                    <Link to={routes.agentBussinessDetails}>
                      <i className="isax isax-buildings-2 me-2" />
                      Bussiness Details
                    </Link>
                    <Link to={routes.agentAccountSettings}>
                      <i className="isax isax-wallet-money me-2" />
                      Account Settings
                    </Link>
                    <Link to={routes.agentSecuritySettings}>
                      <i className="isax isax-shield-tick me-2" />
                      Security
                    </Link>
                    <Link to={routes.agentPlanSettings}>
                      <i className="isax isax-star me-2" />
                      Plans &amp; Billing
                    </Link>
                    <Link to={routes.agentNotificationSettings}>
                      <i className="isax isax-notification me-2" />
                      Notifications
                    </Link>
                  </div>

                  {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
                  {success && <div className="alert alert-success mt-3 mb-0">{success}</div>}

                  <form onSubmit={handleSave} className="mt-3">
                    <div className="settings-content mb-3">
                      <h6 className="fs-16 mb-3">Real Profile</h6>
                      <div className="row gy-3">
                        <div className="col-12">
                          <div className="d-flex align-items-center flex-wrap gap-3">
                            <ImageWithBasePath
                              src={photoURL || 'assets/img/users/user-lg-26.jpg'}
                              alt="Agent profile"
                              className="img-fluid avatar avatar-xxl br-10 flex-shrink-0"
                              fallbackSrc="assets/img/users/user-lg-26.jpg"
                            />
                            <div>
                              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                <label className="upload-btn" htmlFor="agentProfilePhoto">
                                  {uploading ? 'Uploading...' : 'Upload'}
                                </label>
                                <input
                                  type="file"
                                  id="agentProfilePhoto"
                                  className="d-none"
                                  accept="image/*"
                                  onChange={handlePhotoChange}
                                  disabled={uploading}
                                />
                                <button type="button" className="btn btn-light btn-md" onClick={() => setPhotoURL('')}>
                                  Remove
                                </button>
                              </div>
                              <p className="fs-14 text-gray-6 fw-normal mb-0">Profile image is stored in Firebase Storage.</p>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Display Name</label>
                          <input className="form-control" value={form.displayName} onChange={handleChange('displayName')} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Email</label>
                          <input className="form-control" value={userProfile.email || ''} readOnly />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Phone</label>
                          <input className="form-control" value={form.phone} onChange={handleChange('phone')} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Agent Status</label>
                          <input className="form-control" value={userProfile.agentStatus || 'pending'} readOnly />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Approved</label>
                          <input className="form-control" value={userProfile.approved ? 'Yes' : 'No'} readOnly />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Suspended</label>
                          <input className="form-control" value={userProfile.suspended ? 'Yes' : 'No'} readOnly />
                        </div>
                      </div>
                    </div>

                    <div className="settings-content">
                      <h6 className="fs-16 mb-3">Business Profile</h6>
                      <div className="row gy-3">
                        <div className="col-lg-6">
                          <label className="form-label">Business Name</label>
                          <input className="form-control" value={form.businessName} onChange={handleChange('businessName')} />
                        </div>
                        <div className="col-lg-6">
                          <label className="form-label">Business Type</label>
                          <input className="form-control" value={form.businessType} onChange={handleChange('businessType')} />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Business Address</label>
                          <input className="form-control" value={form.businessAddress} onChange={handleChange('businessAddress')} />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Description</label>
                          <textarea className="form-control" rows={4} value={form.description} onChange={handleChange('description')} />
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <Link to="#" className="btn btn-light" onClick={(e) => e.preventDefault()}>
                        Cancel
                      </Link>
                      <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
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

export default AgentSettings;
