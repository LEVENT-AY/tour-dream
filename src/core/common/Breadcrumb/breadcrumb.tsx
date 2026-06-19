import React from 'react';
import { all_routes } from '../../../feature-module/router/all_routes';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    link?: string;
    active?: boolean;
}
interface BreadcrumbProps {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    backgroundClass?: string;
}


const Breadcrumb: React.FC<BreadcrumbProps> = ({ title, breadcrumbs, backgroundClass }) => {


    const location = useLocation();

    const breadCrumbPages =
        location.pathname === "/user/customer-flight-booking" ||
        location.pathname === "/user/customer-car-booking" ||
        location.pathname === "/user/customer-hotel-booking" ||
        location.pathname === "/user/customer-tour-booking";

    return (
        <div className={`breadcrumb-bar ${backgroundClass} text-center`}>
            <div className="container">
                <div className="row">
                    <div className="col-md-12 col-12">
                        <h2 className="breadcrumb-title mb-2">{title}</h2>
                        <nav aria-label="breadcrumb">
                            <ol className="breadcrumb justify-content-center mb-0">
                                {breadcrumbs.map((breadcrumb, index) => (
                                    <li
                                        key={index}
                                        className={`breadcrumb-item ${breadcrumb.active ? 'active' : ''}`}
                                        aria-current={breadcrumb.active ? 'page' : undefined}
                                    >
                                        {breadcrumb.link ? (
                                            <Link to={all_routes.allService1}>
                                                {
                                                    breadCrumbPages ? (<i className="isax isax-grid-55"></i>) : (<i className="isax isax-home5"></i>)
                                                }
                                            </Link>
                                        ) : (
                                            breadcrumb.label
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Breadcrumb;
