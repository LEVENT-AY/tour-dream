import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAuth } from '../../../core/contexts/AuthContext';
import { signOutUser } from '../../../core/services/firebaseServices';
import AdminSidebar from '../sidebar/AdminSidebar';
import { all_routes } from '../../router/all_routes';

const AdminLayout: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOutUser();
    navigate(all_routes.login);
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
                <span className="avatar avatar-sm bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                  <i className="isax isax-user fs-14" />
                </span>
                <span className="d-none d-md-inline fs-14">
                  {userProfile?.email || 'Admin'}
                </span>
                <i className="isax isax-arrow-down-1 ms-2 fs-12" />
              </button>
              {profileDropdownOpen && (
                <div className="dropdown-menu dropdown-menu-end show shadow-sm mt-2" style={{ display: 'block', minWidth: '200px' }}>
                  <div className="dropdown-item-text px-3 py-2 border-bottom">
                    <p className="mb-0 fw-medium fs-14">{userProfile?.email}</p>
                    <span className="badge bg-primary mt-1">{userProfile?.role || 'Admin'}</span>
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
