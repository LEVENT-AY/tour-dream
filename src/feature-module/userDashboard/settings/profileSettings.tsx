import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../../core/common/sidebar/sidebar';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAuth } from '../../../core/contexts/AuthContext';
import { updateUserSafe } from '../../../core/services/firebaseServices';

const initialForm = {
    displayName: '',
    phone: '',
};

const ProfileSettings = () => {
    const routes = all_routes;
    const { userProfile, loading } = useAuth();
    const [form, setForm] = useState(initialForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!userProfile) return;
        setForm({
            displayName: userProfile.displayName || '',
            phone: userProfile.phone || '',
        });
    }, [userProfile]);

    const breadcrumbs = [
        {
            label: 'Profile Settings',
            link: routes.allService1,
            active: false,
        },
        {
            label: 'Profile Settings',
            active: true,
        },
    ];

    const handleChange = (key: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.uid) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await updateUserSafe(userProfile.uid, {
                displayName: form.displayName.trim(),
                phone: form.phone.trim(),
            });
            setSuccess('Profile saved successfully.');
        } catch (err: any) {
            setError(err?.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

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
        return <div className="alert alert-danger m-4">Unable to load customer profile.</div>;
    }

    return (
        <div>
            <Breadcrumb title="Profile Settings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

            <div className="content">
                <div className="container">
                    <div className="row">
                        <div className="col-xl-3 col-lg-4">
                            <Sidebar />
                        </div>
                        <div className="col-xl-9 col-lg-8">
                            <div className="card settings mb-0">
                                <div className="card-header">
                                    <h6>Profile Settings</h6>
                                </div>
                                <div className="card-body pb-3">
                                    <div className="settings-link d-flex align-items-center flex-wrap">
                                        <Link to={routes.profileSettings} className="active ps-3">
                                            <i className="isax isax-user-octagon me-2" />
                                            Profile Settings
                                        </Link>
                                        <Link to={routes.securitySettings}>
                                            <i className="isax isax-shield-tick me-2" />
                                            Security
                                        </Link>
                                        <Link to={routes.notificationSettings}>
                                            <i className="isax isax-notification me-2" />
                                            Notifications
                                        </Link>
                                        <Link to={routes.integrationSettings} className="pe-3">
                                            <i className="isax isax-hierarchy me-2" />
                                            Integrations
                                        </Link>
                                    </div>

                                    {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
                                    {success && <div className="alert alert-success mt-3 mb-0">{success}</div>}

                                    <form onSubmit={handleSave} className="mt-3">
                                        <div className="settings-content mb-3">
                                            <h6 className="fs-16 mb-3">Basic Information</h6>
                                            <div className="row gy-3">
                                                <div className="col-lg-12">
                                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                                        <ImageWithBasePath
                                                            src={userProfile.photoURL || 'assets/img/users/user-01.jpg'}
                                                            alt={userProfile.displayName || 'Customer profile'}
                                                            className="img-fluid avatar avatar-xxl br-10 flex-shrink-0"
                                                            fallbackSrc="assets/img/users/user-01.jpg"
                                                        />
                                                        <div>
                                                            <p className="fs-14 text-gray-6 fw-normal mb-0">
                                                                Your profile photo is read from `users/{userProfile.uid}`.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-lg-6">
                                                    <label className="form-label">Display Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.displayName}
                                                        onChange={handleChange('displayName')}
                                                        disabled={saving}
                                                    />
                                                </div>
                                                <div className="col-lg-6">
                                                    <label className="form-label">Email</label>
                                                    <input type="email" className="form-control" value={userProfile.email || ''} readOnly />
                                                </div>
                                                <div className="col-lg-6">
                                                    <label className="form-label">Phone</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={form.phone}
                                                        onChange={handleChange('phone')}
                                                        disabled={saving}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-footer px-0 pb-0">
                                            <div className="d-flex align-items-center justify-content-end">
                                                <Link to="#" className="btn btn-light me-2" onClick={(e) => e.preventDefault()}>
                                                    Cancel
                                                </Link>
                                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                                    {saving ? 'Saving...' : 'Save'}
                                                </button>
                                            </div>
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

export default ProfileSettings;
