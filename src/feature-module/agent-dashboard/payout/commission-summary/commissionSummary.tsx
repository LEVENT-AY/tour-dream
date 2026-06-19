import { useEffect, useState } from 'react';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import { all_routes } from '../../../router/all_routes';
import Sidebar from '../../sidebar/sidebar';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { calculateAgentEarnings, fetchAgentBookings, type Booking } from '../../../../core/services/agentServices';

const AgentCommissionSummary = () => {
  const routes = all_routes;
  const { userProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [earnings, setEarnings] = useState({ totalEstimated: 0, confirmedCount: 0, completedCount: 0, currency: 'USD' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;
    let isMounted = true;
    setLoading(true);
    Promise.all([
      fetchAgentBookings(userProfile.uid),
      calculateAgentEarnings(userProfile.uid),
    ])
      .then(([bookingsData, earningsData]) => {
        if (!isMounted) return;
        setBookings(bookingsData);
        setEarnings(earningsData);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [userProfile?.uid]);

  //Breadcrumb Data
  const breadcrumbs = [
    {
      label: '',
      active: false,
      link: routes.home1
    },
    {
      label: 'Payouts',
      active: true,
    },
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: earnings.currency }).format(val);

  const eligible = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed');

  return (
    <>
      <Breadcrumb title="Payouts" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
      {/* Page Wrapper */}
      <div className="content">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-xl-3 col-lg-4 theiaStickySidebar">
              <Sidebar />
            </div>
            {/* /Sidebar */}
            {/* Payouts */}
            <div className="col-xl-9 col-lg-8 theiaStickySidebar">
              {/* Payout Header */}
              <div className="card booking-header border-0">
                <div className="card-body header-content d-flex align-items-center justify-content-between flex-wrap ">
                  <div>
                    <h6 className="mb-1">Commission Summary</h6>
                    <p className="fs-14 text-gray-6 fw-normal ">
                      Estimated eligible bookings : {loading ? '—' : eligible.length}
                    </p>
                  </div>
                </div>
              </div>
              {/* /Payout Header */}

              <div className="alert alert-info mb-3">
                <i className="isax isax-info-circle5 me-2" />
                Commission and payout integration is not configured yet. Amounts shown are estimates based on confirmed/completed bookings only.
              </div>

              {/* Commission List */}
              <div className="card hotel-list">
                <div className="card-body p-0">
                  <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                    <h6 className="">Eligible Bookings</h6>
                  </div>
                  <div className="custom-datatable-filter table-responsive">
                    <table className="table datatable">
                      <thead className="thead-light">
                        <tr>
                          <th>Booking ID</th>
                          <th>Booked Type</th>
                          <th>Service</th>
                          <th>Booked on</th>
                          <th>Price</th>
                          <th>Estimated Net</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              <span className="spinner-border spinner-border-sm text-primary me-2" />
                              Loading...
                            </td>
                          </tr>
                        ) : eligible.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">
                              No eligible bookings found. Commission estimates will appear here once bookings are confirmed or completed.
                            </td>
                          </tr>
                        ) : (
                          eligible.map((b) => {
                            const price = typeof b.totalAmount === 'number' ? b.totalAmount : b.price || 0;
                            return (
                              <tr key={b.id}>
                                <td>
                                  <span className="fw-medium">#{b.id?.slice(-6).toUpperCase()}</span>
                                </td>
                                <td>{b.itemType ? b.itemType.charAt(0).toUpperCase() + b.itemType.slice(1) : '—'}</td>
                                <td>
                                  <div>
                                    <p className="text-dark mb-0 fw-medium fs-14">{b.itemTitle}</p>
                                  </div>
                                </td>
                                <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                                <td>{formatCurrency(price)}</td>
                                <td>{formatCurrency(price)}</td>
                                <td>
                                  <span className={`badge rounded-pill fs-10 ${b.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                                    <i className="fa-solid fa-circle fs-5 me-1" />
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* /Commission List */}
            </div>
            {/* /Payouts */}
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
    </>
  )
}

export default AgentCommissionSummary
