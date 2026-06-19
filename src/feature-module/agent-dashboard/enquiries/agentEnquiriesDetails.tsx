import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import DefaultEditor from 'react-simple-wysiwyg';
import { updateEnquiryStatus, type Enquiry } from '../../../core/services/agentServices';

interface LocationState {
    enquiry?: Enquiry;
}

const AgentEnquiriesDetails = () => {

    const routes = all_routes;
    const location = useLocation();
    useNavigate(); // router hook available if needed
    const { enquiry } = (location.state as LocationState) || {};

    const [values, setValue] = useState('');
    const [status, setStatus] = useState(enquiry?.status || 'pending');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    function onChange(e: any) {
        setValue(e.target.value);
    }

    const handleStatusChange = async (newStatus: 'pending' | 'responded' | 'closed') => {
        if (!enquiry?.id) return;
        setSaving(true);
        setMessage('');
        try {
            await updateEnquiryStatus(enquiry.id, newStatus);
            setStatus(newStatus);
            setMessage('Status updated successfully.');
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Failed to update status');
        } finally {
            setSaving(false);
        }
    };

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

    if (!enquiry) {
        return (
            <div>
                <Breadcrumb title="Enquirers" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />
                <div className="content">
                    <div className="container">
                        <div className="alert alert-info">
                            No enquiry selected. <Link to={routes.agentEnquirers} className="alert-link">Back to enquiries</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Breadcrumb title="Enquirers" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

            <>
                {/* Page Wrapper */}
                <div className="content">
                    <div className="container">
                        <div>
                            <div className="mb-3">
                                <Link to={routes.agentEnquirers} className="text-primary">
                                    <i className="isax isax-arrow-left me-2" />
                                    Back to Enquiry List
                                </Link>
                            </div>
                            {message && (
                                <div className={`alert alert-${message.includes('success') ? 'teal' : 'danger'} alert-dismissible d-flex align-items-center border-0 mb-4 fade show`}>
                                    <i className="isax isax-info-circle5 me-2" />
                                    {message}
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setMessage('')}
                                        aria-label="Close"
                                    >
                                        <i className="fas fa-xmark" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="row">
                            {/* Sidebar */}
                            <div className="col-lg-4 theiaStickySidebar">
                                <div className="card mb-4 mb-lg-0">
                                    <div className="card-body">
                                        <h5 className="mb-3">Form Data</h5>
                                        <div className="mb-2">
                                            <h6 className="fw-medium mb-1">Name</h6>
                                            <p className="fs-14">{enquiry.customerName || '—'}</p>
                                        </div>
                                        <div className="mb-2">
                                            <h6 className="fw-medium mb-1">Phone Number </h6>
                                            <p className="fs-14">{enquiry.customerPhone || '—'}</p>
                                        </div>
                                        <div className="mb-2">
                                            <h6 className="fw-medium mb-1">Email</h6>
                                            <p className="fs-14">{enquiry.customerEmail || '—'}</p>
                                        </div>
                                        <div className="mb-4 pb-4 border-bottom">
                                            <h6 className="fw-medium mb-1">Description</h6>
                                            <p className="fs-14">
                                                {enquiry.message}
                                            </p>
                                        </div>
                                        <div className="mb-3">
                                            <DefaultEditor value={values} onChange={onChange} />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            disabled={!values.trim() || saving}
                                            onClick={() => {
                                                setMessage('Reply functionality will be available once messaging integration is configured.');
                                            }}
                                        >
                                            Add New Reply
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* /Sidebar */}
                            <div className="col-lg-8">
                                {/* Hotel-Booking List */}
                                <div className="card hotel-list mb-0">
                                    <div className="card-body p-0">
                                        <div className="list-header d-flex align-items-center justify-content-between flex-wrap p-3">
                                            <h6 className="mb-0">Enquiry Details</h6>
                                            <div className="d-flex align-items-center">
                                                <span className="me-2">Status:</span>
                                                <select
                                                    className="form-select form-select-sm"
                                                    value={status}
                                                    onChange={(e) => handleStatusChange(e.target.value as any)}
                                                    disabled={saving}
                                                    style={{ width: '140px' }}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="responded">Responded</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <h6 className="fs-14">Listing</h6>
                                                    <p className="text-gray-6 mb-0">{enquiry.listingTitle || 'General enquiry'}</p>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6 className="fs-14">Received</h6>
                                                    <p className="text-gray-6 mb-0">
                                                        {enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString() : '—'}
                                                    </p>
                                                </div>
                                                <div className="col-12">
                                                    <h6 className="fs-14">Message</h6>
                                                    <p className="text-gray-6 mb-0">{enquiry.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* /Hotel-Booking List */}
                            </div>
                        </div>
                    </div>
                </div>
                {/* /Page Wrapper */}
            </>


        </div>
    )
}

export default AgentEnquiriesDetails
