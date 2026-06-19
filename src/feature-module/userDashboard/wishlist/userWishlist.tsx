import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../../core/common/sidebar/sidebar';

const UserWishlist = () => {
  const routes = all_routes;

  const breadcrumbs = [
    { label: 'Wishlist', link: routes.allService1, active: false },
    { label: 'Wishlist', active: true },
  ];

  return (
    <div>
      <Breadcrumb title="Wishlist" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card mb-0">
                <div className="card-body">
                  <h6 className="mb-2">My Wishlist</h6>
                  <p className="fs-14 text-gray-6 mb-0">No saved items yet.</p>
                  <div className="mt-3">
                    <Link to={routes.userDashboard} className="btn btn-light btn-sm">Back to Dashboard</Link>
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

export default UserWishlist;
