import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../../../core/common/sidebar/sidebar';
import { useAuth } from '../../../core/contexts/AuthContext';
import { fetchUserOrders, type UserOrder } from '../../../core/services/firebaseServices';

const formatAmount = (order: UserOrder) => {
  if (typeof order.totalAmount !== 'number') return 'Not set';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: order.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(order.totalAmount);
};

const UserOrders = () => {
  const routes = all_routes;
  const { userProfile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const breadcrumbs = [
    { label: 'Orders', link: routes.allService1, active: false },
    { label: 'Orders', active: true },
  ];

  useEffect(() => {
    if (!userProfile?.uid) return;
    let isMounted = true;
    setLoading(true);

    fetchUserOrders(userProfile.uid)
      .then((data) => {
        if (isMounted) setOrders(data);
      })
      .catch((error) => {
        console.error('Failed to load orders:', error);
        if (isMounted) setOrders([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userProfile?.uid]);

  if (authLoading) {
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
      <Breadcrumb title="Orders" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card booking-header mb-4">
                <div className="card-body header-content d-flex align-items-center justify-content-between flex-wrap">
                  <div>
                    <h6>Orders</h6>
                    <p className="fs-14 text-gray-6 fw-normal mb-0">No of Orders : {orders.length}</p>
                  </div>
                  <Link to={routes.userDashboard} className="btn btn-light btn-sm">Dashboard</Link>
                </div>
              </div>

              <div className="card hotel-list">
                <div className="card-body">
                  {loading ? (
                    <div className="text-gray-6">Loading your orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="alert alert-light mb-0">No orders yet</div>
                  ) : (
                    <div className="row g-3">
                      {orders.map((order) => (
                        <div className="col-12" key={order.id || order.orderId}>
                          <div className="border rounded p-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                              <p className="mb-1 text-gray-6 text-uppercase small">{order.itemType || 'Order'}</p>
                              <h6 className="mb-1">{order.title}</h6>
                              <p className="mb-0 text-gray-6">Order ID: {order.orderId}</p>
                            </div>
                            <div className="text-end">
                              <div className="fw-medium mb-1">{formatAmount(order)}</div>
                              <span className="badge badge-soft-info rounded-pill text-capitalize">{order.status || 'pending'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default UserOrders;
