import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../../core/common/sidebar/sidebar';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAuth } from '../../../core/contexts/AuthContext';

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const MyProfile = () => {
  const routes = all_routes;
  const { userProfile, loading } = useAuth();

  const breadcrumbs = [
    {
      label: 'My Profile',
      link: routes.allService1,
      active: false,
    },
    {
      label: 'My Profile',
      active: true,
    },
  ];

  const displayName = userProfile?.displayName || userProfile?.email || 'Customer';
  const avatarSrc = userProfile?.photoURL || 'assets/img/users/user-01.jpg';
  const roleLabel = userProfile?.role ? userProfile.role : 'Role missing';

  return (
    <div>
      <Breadcrumb title="My Profile" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />

      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card shadow-none mb-0">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h6>My Profile</h6>
                  <Link to={routes.profileSettings} className="p-1 rounded-circle btn btn-light d-flex align-items-center justify-content-center">
                    <i className="isax isax-edit-2 fs-14" />
                  </Link>
                </div>
                <div className="card-body">
                  {loading ? (
                    <div className="text-gray-6">Loading profile...</div>
                  ) : userProfile ? (
                    <>
                      <h6 className="fs-16 mb-3">Basic Information</h6>
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-xl flex-shrink-0 me-3">
                          <ImageWithBasePath src={avatarSrc} alt={displayName} className="img-fluid rounded-circle" />
                        </span>
                        <div>
                          <h5 className="mb-1">{displayName}</h5>
                          <p className="mb-1 text-gray-6">{userProfile.email || 'No email on file'}</p>
                          <span className="badge badge-soft-info rounded-pill text-capitalize">{roleLabel}</span>
                        </div>
                      </div>
                      <div className="row border-bottom pb-2 mb-3">
                        <div className="col-md-6">
                          <div className="mb-2">
                            <h6 className="fs-14">Display Name</h6>
                            <p>{displayName}</p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <h6 className="fs-14">Email</h6>
                            <p>{userProfile.email || 'Not available'}</p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <h6 className="fs-14">Phone</h6>
                            <p>{userProfile.phone || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-2">
                            <h6 className="fs-14">Member Since</h6>
                            <p>{formatDate(userProfile.joinedAt || userProfile.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                      <h6 className="fs-16 mb-3">Account Information</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <div>
                            <h6 className="fs-14">Role</h6>
                            <p className="text-capitalize">{userProfile.role}</p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div>
                            <h6 className="fs-14">User ID</h6>
                            <p>{userProfile.uid}</p>
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="alert alert-light mb-0">Profile data is read from `users/{userProfile.uid}`.</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="alert alert-light mb-0">No customer profile found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
