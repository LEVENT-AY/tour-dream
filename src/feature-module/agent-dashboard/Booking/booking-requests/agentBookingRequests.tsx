import { useEffect, useState } from 'react';
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import BookingStatusBadge from '../../../../core/common/badge/BookingStatusBadge';
import { formatListingType } from '../../../../core/common/bookingDisplay';
import Sidebar from '../../sidebar/sidebar';
import { useAuth } from '../../../../core/contexts/AuthContext';
import { fetchAgentBookingRequests } from '../../../../core/services/agentServices';
import type { Booking } from '../../../../core/services/firebaseServices';

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const AgentBookingRequests = () => {
  const routes = all_routes;
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    setError(null);
    try {
      setRequests(await fetchAgentBookingRequests(userProfile.uid));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid]);

  const breadcrumbs = [
    { label: 'Booking Requests', active: false, link: routes.home1 },
    { label: 'Booking Requests', active: true },
  ];

  return (
    <div>
      <Breadcrumb title="Booking Requests" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            <div className="col-xl-9 col-lg-8">
              <div className="card booking-header border-0 mb-4">
                <div className="card-body header-content d-flex align-items-center justify-content-between flex-wrap">
                  <div>
                    <h6 className="mb-1">Booking Requests</h6>
                    <p className="fs-14 text-gray-6 fw-normal mb-0">No of Booking : {requests.length}</p>
                  </div>
                </div>
              </div>

              <div className="card border-0">
                <div className="card-body">
                  {error ? (
                    <div className="alert alert-danger mb-0">{error}</div>
                  ) : loading ? (
                    <p className="mb-0 text-muted">Loading booking requests...</p>
                  ) : requests.length === 0 ? (
                    <div className="text-center py-4">
                      <h6 className="mb-1">No booking requests found</h6>
                      <p className="text-muted mb-0">Requests assigned to your listings will appear here.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Listing Type</th>
                            <th>Customer Name</th>
                            <th>Customer Email</th>
                            <th>Customer Phone</th>
                            <th>Status</th>
                            <th>Created At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requests.map((request) => (
                            <tr key={request.id}>
                              <td>{request.title || request.itemTitle || 'Booking'}</td>
                              <td>{formatListingType(request.listingType || request.itemType)}</td>
                              <td>{request.customerName || request.userName || 'Customer'}</td>
                              <td>{request.customerEmail || request.userEmail || '—'}</td>
                              <td>{request.customerPhone || request.userPhone || '—'}</td>
                              <td>
                                <BookingStatusBadge status={request.status} />
                              </td>
                              <td>{formatDate(request.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

export default AgentBookingRequests;
