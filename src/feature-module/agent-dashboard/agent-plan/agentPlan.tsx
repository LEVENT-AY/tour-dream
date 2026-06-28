import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';

const AgentPlan = () => {

    const routes = all_routes;
    const breadcrumbs = [
        {
            label: 'Plans & Billings',
            active: false,
            link: routes.home1
        },
        {
            label: 'Plans & Billings',
            active: true,
        },
    ];

    return (
        <div>
            <Breadcrumb title="Plans & Billings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
            <div className="content">
                <div className="container">
                    <div className="mb-3">
                        <Link
                            to={routes.agentPlanSettings}
                            className="text-primary d-inline-flex align-items-center fs-14"
                        >
                            <i className="isax isax-arrow-left me-2" />
                            Back to Plans &amp; Billings
                        </Link>
                    </div>
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="card shadow-none">
                                <div className="card-body text-center py-5">
                                    <i className="isax isax-star fs-32 text-gray-4 mb-2 d-block" />
                                    <p className="fw-medium mb-1">Plan enrollment is not available yet</p>
                                    <p className="fs-14 text-gray-6 mb-3">Plan subscription and payment enrollment will be available once the finance workflow is enabled.</p>
                                    <Link
                                        to={routes.agentPlanSettings}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Back to Settings
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AgentPlan
