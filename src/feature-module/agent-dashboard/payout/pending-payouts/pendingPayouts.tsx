import { Link } from 'react-router-dom';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import { all_routes } from '../../../router/all_routes';
import Sidebar from '../../sidebar/sidebar';

const AgentPendingPayouts = () => {
  const routes = all_routes;
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
                    <h6 className="mb-1">Payouts</h6>
                    <p className="fs-14 text-gray-6 fw-normal ">
                      No of Pending Payouts : 0
                    </p>
                  </div>
                </div>
              </div>
              {/* /Payout Header */}
              <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                <Link to={routes.agentPendingPayouts} className="btn btn-primary">
                  Pending Payouts
                </Link>
                <Link to={routes.agentPaymentHistory} className="btn btn-light">
                  Payment History
                </Link>
              </div>
              {/* Pending Payouts List */}
              <div className="card hotel-list">
                <div className="card-body p-0">
                  <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                    <h6 className="">Pending Payouts</h6>
                  </div>
                  <div className="p-4 text-center">
                    <div className="alert alert-info d-inline-block mb-0">
                      <i className="isax isax-info-circle5 me-2" />
                      Payment and payout integration is not configured yet. Pending payouts will appear here once payout processing is enabled.
                    </div>
                  </div>
                </div>
              </div>
              {/* /Pending Payouts List */}
            </div>
            {/* /Payouts */}
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
    </>
  )
}

export default AgentPendingPayouts
