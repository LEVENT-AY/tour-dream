
import { all_routes } from '../../../router/all_routes';
import Breadcrumb from '../../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import Sidebar from '../../sidebar/sidebar';
import AgentPlanSettingsModal from './agentPlanSettingsModal';


const AgentPlanSettings = () => {

    const routes = all_routes;
    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Settings',
            active: false,
            link: routes.home1
        },
        {
            label: 'Settings',
            active: true,
        },
    ];

    return (
        <div>
            <Breadcrumb title="Settings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

            {/* Page Wrapper */}
            <div className="content">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-xl-3 col-lg-4">
                            <Sidebar />
                        </div>
                        {/* /Sidebar */}
                        {/* Profile Settings */}
                        <div className="col-xl-9 col-lg-8">
                            <div className="card settings mb-0">
                                <div className="card-header">
                                    <h6>Settings</h6>
                                </div>
                                <div className="card-body">
                                    <div className="settings-link d-flex align-items-center flex-wrap">
                                        <Link to={routes.agentSettings}>
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
                                        <Link to={routes.agentPlanSettings} className="active ps-3">
                                            <i className="isax isax-star me-2" />
                                            Plans &amp; Billing
                                        </Link>
                                        <Link to={routes.agentNotificationSettings}>
                                            <i className="isax isax-notification me-2" />
                                            Notifications
                                        </Link>
                                    </div>
                                    <div>
                                        <div>
                                            <h6 className="mb-3">Plans &amp; Billing</h6>
                                        </div>
                                        <div className="row">
                                            <div className="col-xl-5 d-flex">
                                                <div className="card shadow-none bg-gray-transparent flex-fill">
                                                    <div className="card-body">
                                                        <div className="text-center py-4">
                                                            <i className="isax isax-star fs-32 text-gray-4 mb-2 d-block" />
                                                            <p className="fw-medium mb-1">No active plan</p>
                                                            <p className="fs-14 text-gray-6 mb-0">Plan and billing information will appear here once the subscription workflow is enabled.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-xl-7 d-flex">
                                                <div className="card shadow-none bg-gray-transparent flex-fill">
                                                    <div className="card-body">
                                                        <div className="text-center py-4">
                                                            <i className="isax isax-card-tick fs-32 text-gray-4 mb-2 d-block" />
                                                            <p className="fw-medium mb-1">No saved cards</p>
                                                            <p className="fs-14 text-gray-6 mb-0">Saved payment methods will appear here once the finance workflow is enabled.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card hotel-list mb-0">
                                            <div className="card-body p-0">
                                                <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                                                    <h6>Transaction History</h6>
                                                    <div className="d-flex align-items-center flex-wrap">
                                                        <div className="dropdown">
                                                            <Link
                                                                to="#"
                                                                className="dropdown-toggle text-gray-6 btn  rounded border d-inline-flex align-items-center"
                                                                data-bs-toggle="dropdown"
                                                                
                                                            >
                                                                Status
                                                            </Link>
                                                            <ul className="dropdown-menu dropdown-menu-end p-3">
                                                                <li>
                                                                    <Link
                                                                        to="#"
                                                                        className="dropdown-item rounded-1"
                                                                    >
                                                                        Paid
                                                                    </Link>
                                                                </li>
                                                                <li>
                                                                    <Link
                                                                        to="#"
                                                                        className="dropdown-item rounded-1"
                                                                    >
                                                                        Pending
                                                                    </Link>
                                                                </li>
                                                                <li>
                                                                    <Link
                                                                        to="#"
                                                                        className="dropdown-item rounded-1"
                                                                    >
                                                                        Cancelled
                                                                    </Link>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="custom-datatable-filter table-responsive">
                                                    <table className="table datatable">
                                                        <tbody>
                                                            <tr>
                                                                <td colSpan={8} className="text-center py-4 text-gray-6">
                                                                    No transaction history yet.
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* /Profile Settings */}
                    </div>
                </div>
            </div>
            {/* /Page Wrapper */}

            <AgentPlanSettingsModal />

        </div>
    )
}

export default AgentPlanSettings
