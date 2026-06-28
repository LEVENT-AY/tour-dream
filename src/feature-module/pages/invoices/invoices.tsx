
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { all_routes } from '../../router/all_routes';

const Invoices = () => {

    const routes = all_routes;

    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Invoice',
            link: routes.allService1,
            active: false,
        },
        {
            label: 'Pages',
            active: true,
        },
        {
            label: 'Invoice',
            active: true,
        },
    ];


    return (
        <div>
            <Breadcrumb
                title="Destinations"
                breadcrumbs={breadcrumbs}
                backgroundClass="breadcrumb-bg-02"
            />
            {/* Page Wrapper */}
            <div className="content">
                <div className="container">
                    {/* Invoices */}
                    <div className="row justify-content-center">
                        <div className="col-md-9">
                            <div className="card mb-0">
                                <div className="card-body text-center py-5">
                                    <span className="isax isax-receipt-1 fs-1 text-muted mb-3 d-inline-block"></span>
                                    <h5>No invoices yet</h5>
                                    <p className="text-muted fs-14 mb-0">
                                        Invoices and payment records will appear here once the finance workflow is enabled.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /Invoices */}
                </div>
            </div>
            {/* /Page Wrapper */}

        </div>
    )
}

export default Invoices
