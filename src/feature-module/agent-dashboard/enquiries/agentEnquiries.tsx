
import { useEffect, useState } from 'react';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../sidebar/sidebar';
import PredefinedDateRanges from '../../../core/common/range-picker/datePicker';
import type { TableData } from '../../../core/common/data/interface';
import Table from "../../../core/common/dataTable/index";
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/contexts/AuthContext';
import { fetchAgentEnquiries, type Enquiry } from '../../../core/services/agentServices';

const AgentEnquiries = () => {

    const routes = all_routes;
    const { userProfile } = useAuth();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadEnquiries = async () => {
        if (!userProfile?.uid) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAgentEnquiries(userProfile.uid);
            setEnquiries(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load enquiries');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEnquiries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.uid]);

    const formatDate = (value?: string) => {
        if (!value) return '—';
        try {
            return new Date(value).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
            });
        } catch {
            return value;
        }
    };

    const data = enquiries.map((enquiry) => ({
        id: enquiry.id,
        type: enquiry.listingId ? 'Listing Enquiry' : 'General Enquiry',
        enquiryfor: enquiry.listingTitle || 'General',
        customerinfo: `${enquiry.customerName || 'Customer'}${enquiry.customerEmail ? ` (${enquiry.customerEmail})` : ''}`,
        status: enquiry.status,
        inquiredOn: formatDate(enquiry.createdAt),
        raw: enquiry,
    }));

    const columns = [
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (_text: any, render: any) => (
                <span className="fw-medium">{render.type}</span>
            ),
            sorter: (a: TableData, b: TableData) => String(a.type).length - String(b.type).length,
        },
        {
            title: "Enquiry for",
            dataIndex: "enquiryfor",
            key: "enquiryfor",
            render: (_text: any, render: any) => (
                <>
                    <h6 className="fs-14">{render.enquiryfor}</h6>
                </>

            ),
            sorter: (a: TableData, b: TableData) =>
                String(a.enquiryfor).length - String(b.enquiryfor).length,
        },
        {
            title: "Customer Info",
            dataIndex: "customerinfo",
            key: "customerinfo",
            render: (_text: any, render: any) => (
                <>
                    <p className="fs-14 fw-n mb-1">{render.customerinfo}</p>
                    <Link to={routes.agentEnquiriesDetails} state={{ enquiry: render.raw }} className="link-primary">
                        View Details
                    </Link>
                </>

            ),
            sorter: (a: TableData, b: TableData) =>
                String(a.customerinfo).length - String(b.customerinfo).length,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text: any, render: any) => (
                <span className={`badge rounded-pill d-inline-flex align-items-center fs-10 ${text === 'responded' ? 'badge-success' : text === 'closed' ? 'badge-secondary' : 'badge-warning'}`}>
                    <i className="fa-solid fa-circle fs-5 me-1" />
                    {render.status}
                </span>

            ),
            sorter: (a: TableData, b: TableData) => String(a.status).length - String(b.status).length,
        },
        {
            title: "Inquired On",
            dataIndex: "inquiredOn",
            sorter: (a: TableData, b: TableData) => String(a.inquiredOn).length - String(b.inquiredOn).length,
        },
        {
            title: "",
            dataIndex: "action",
            render: (_text: any, render: any) => (
                <div className="d-flex align-items-center">
                    <Link to={routes.agentEnquiriesDetails} state={{ enquiry: render.raw }}>
                        <i className="isax isax-eye" />
                    </Link>
                </div>

            ),
        },
    ];

    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Enquirers',
            active: false,
            link: routes.home1
        },
        {
            label: 'Enquirers',
            active: true,
        },
    ];

    return (
        <div>
            <Breadcrumb title="Enquirers" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
            {/* Page Wrapper */}
            <div className="content">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-xl-3 col-lg-4 ">
                            <Sidebar />
                        </div>
                        {/* /Sidebar */}
                        <div className="col-xl-9 col-lg-8">
                            {/* Booking Header */}
                            <div className="card booking-header">
                                <div className="card-body header-content d-flex align-items-center justify-content-between flex-wrap ">
                                    <div>
                                        <h6>Enquiries</h6>
                                        <p className="fs-14 text-gray-6 fw-normal">
                                            No of Enquiries : {enquiries.length}
                                        </p>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap">
                                        <div className="input-icon-start position-relative">
                                            <span className="icon-addon">
                                                <i className="isax isax-calendar-edit fs-14" />
                                            </span>
                                            <PredefinedDateRanges />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* /Booking Header */}

                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
                                </div>
                            )}

                            {/* Hotel-Booking List */}
                            <div className="card hotel-list">
                                <div className="card-body p-0">
                                    <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                                        <h6 className="">Enquiries List</h6>
                                        <div className="d-flex align-items-center flex-wrap">
                                            <div className="input-icon-start position-relative">
                                                <span className="icon-addon">
                                                    <i className="isax isax-search-normal-1 fs-14" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {loading ? (
                                        <div className="text-center py-5">
                                            <span className="spinner-border spinner-border-sm text-primary me-2" />
                                            Loading enquiries...
                                        </div>
                                    ) : enquiries.length === 0 ? (
                                        <div className="text-center py-5">
                                            <h6>No enquiries yet</h6>
                                            <p className="text-muted mb-0">
                                                There are no public enquiry forms connected yet. Customer enquiries will appear here once the contact forms are wired up.
                                            </p>
                                        </div>
                                    ) : (
                                        <Table dataSource={data} columns={columns} Selection={false} />
                                    )}
                                </div>
                            </div>
                            {/* /Hotel-Booking List */}
                        </div>
                    </div>
                </div>
            </div>
            {/* /Page Wrapper */}

        </div>
    )
}

export default AgentEnquiries
