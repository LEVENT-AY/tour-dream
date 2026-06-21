import React, { useRef, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAuth } from '../../../core/contexts/AuthContext';
import AdminSidebar from '../sidebar/AdminSidebar';
import { all_routes } from '../../router/all_routes';
import { updateUserSafe } from '../../../core/services/firebaseServices';
import { uploadUserProfileImage } from '../../../core/services/firebaseStorage';

const AdminLayout: React.FC = () => {
  const { userProfile, logout, refreshUserProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    setSidebarOpen(false);
    window.location.assign('/');
  };

  const handlePhotoPick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !userProfile?.uid) return;

    setUploadingPhoto(true);
    try {
      const { url } = await uploadUserProfileImage(userProfile.uid, file);
      await updateUserSafe(userProfile.uid, { photoURL: url });
      await refreshUserProfile();
    } catch (error) {
      console.error('Failed to update admin profile photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="admin-dashboard-wrapper d-flex flex-column min-vh-100">
      {/* Top Navigation */}
      <header className="admin-header navbar navbar-expand-lg navbar-dark bg-dark py-2 px-3 sticky-top">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to={all_routes.adminDashboard}>
            <ImageWithBasePath src="assets/img/logo.svg" alt="DreamsTour" className="img-fluid admin-logo" />
            <span className="ms-2 fs-16 fw-semibold text-white">Admin</span>
          </Link>

          <button
            className="navbar-toggler border-0 p-0"
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <i className="isax isax-menu-1 fs-24 text-white" />
          </button>

          <div className="collapse navbar-collapse justify-content-end">
            <div className="dropdown">
              <button
                className="btn btn-link text-white text-decoration-none d-flex align-items-center p-0"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <span className="avatar avatar-sm rounded-circle d-flex align-items-center justify-content-center me-2 overflow-hidden bg-secondary">
                  <ImageWithBasePath
                    src={userProfile?.photoURL || 'assets/img/users/user-01.jpg'}
                    alt={userProfile?.displayName || 'Admin profile'}
                    className="img-fluid w-100 h-100 object-fit-cover"
                    fallbackSrc="assets/img/users/user-01.jpg"
                  />
                </span>
                <span className="d-none d-md-inline fs-14">
                  {userProfile?.email || 'Admin'}
                </span>
                <i className="isax isax-arrow-down-1 ms-2 fs-12" />
              </button>
              {profileDropdownOpen && (
                <div className="dropdown-menu dropdown-menu-end show shadow-sm mt-2" style={{ display: 'block', minWidth: '200px' }}>
                  <div className="dropdown-item-text px-3 py-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="avatar avatar-sm rounded-circle overflow-hidden bg-secondary flex-shrink-0">
                        <ImageWithBasePath
                          src={userProfile?.photoURL || 'assets/img/users/user-01.jpg'}
                          alt={userProfile?.displayName || 'Admin profile'}
                          className="img-fluid w-100 h-100 object-fit-cover"
                          fallbackSrc="assets/img/users/user-01.jpg"
                        />
                      </span>
                      <div>
                        <p className="mb-0 fw-medium fs-14">{userProfile?.email}</p>
                        <span className="badge bg-primary mt-1 text-capitalize">{userProfile?.role || 'Role missing'}</span>
                      </div>
                    </div>
                    <div className="mt-2 d-flex align-items-center gap-2">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={handlePhotoPick} disabled={uploadingPhoto}>
                        {uploadingPhoto ? 'Uploading...' : 'Change photo'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={handlePhotoChange}
                        disabled={uploadingPhoto}
                      />
                    </div>
                  </div>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={handleLogout}>
                    <i className="isax isax-logout-1 fs-14 me-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50"
          style={{ zIndex: 1030 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div className="admin-main d-flex flex-grow-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="admin-content flex-grow-1 bg-light p-3 p-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
