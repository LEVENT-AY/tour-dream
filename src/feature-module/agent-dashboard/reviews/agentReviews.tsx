import { useEffect, useState } from 'react'
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import PredefinedDateRanges from '../../../core/common/range-picker/datePicker';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { useAuth } from '../../../core/contexts/AuthContext';
import { fetchAgentReviews, addAgentReviewResponse, type AgentReview } from '../../../core/services/agentServices';

const AgentReviews = () => {

    const routes = all_routes;
    const { userProfile } = useAuth();
    const [reviews, setReviews] = useState<AgentReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);

    const loadReviews = async () => {
        if (!userProfile?.uid) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAgentReviews(userProfile.uid);
            setReviews(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.uid]);

    const handleReplySubmit = async (reviewId: string) => {
        if (!replyText.trim() || !userProfile?.uid) return;
        setSavingId(reviewId);
        try {
            await addAgentReviewResponse(reviewId, replyText.trim());
            setReplyText('');
            setReplyingId(null);
            await loadReviews();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save reply');
        } finally {
            setSavingId(null);
        }
    };

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

    const breadcrumbs = [
        {
            label: 'Reviews',
            active: false,
            link: routes.home1
        },
        {
            label: 'Reviews',
            active: true,
        },
    ];

    return (
        <div>
            <Breadcrumb title="Reviews" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

            <>
                {/* Page Wrapper */}
                <div className="content">
                    <div className="container">
                        <div className="row">
                            {/* Sidebar */}
                            <div className="col-xl-3 col-lg-4">
                                <Sidebar />
                            </div>
                            {/* /Sidebar */}
                            <div className="col-xl-9 col-lg-8">
                                {/* Review Title */}
                                <div className="card">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center flex-wrap row-gap-3">
                                            <div>
                                                <h6>Reviews</h6>
                                                <p className="fs-14">No of Reviews : {reviews.length}</p>
                                            </div>
                                            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                                                <div>
                                                    <div className="input-icon-end position-relative">
                                                        <span className="input-icon-addon">
                                                            <i className="isax isax-calendar-edit" />
                                                        </span>
                                                        <PredefinedDateRanges />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* /Review Title */}

                                {error && (
                                    <div className="alert alert-danger alert-dismissible fade show">
                                        {error}
                                        <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
                                    </div>
                                )}

                                {loading ? (
                                    <div className="card shadow-none">
                                        <div className="card-body text-center py-5">
                                            <span className="spinner-border spinner-border-sm text-primary me-2" />
                                            Loading reviews...
                                        </div>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="card shadow-none">
                                        <div className="card-body text-center py-5">
                                            <h6>No reviews yet</h6>
                                            <p className="text-muted mb-0">Reviews for your listings will appear here.</p>
                                        </div>
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <div className="card shadow-none" key={review.id}>
                                            <div className="card-body">
                                                <div>
                                                    <div className="d-flex justify-content-between align-items-center flex-wrap row-gap-2">
                                                        <div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <span className="avatar avatar-lg rounded-circle flex-shrink-0 me-2">
                                                                    <ImageWithBasePath
                                                                        src="assets/img/users/user-22.jpg"
                                                                        alt="user"
                                                                        className="img-fluid rounded-circle"
                                                                    />
                                                                </span>
                                                                <div>
                                                                    <h6 className="fs-16">{review.userName || 'Customer'}</h6>
                                                                    <div className="d-flex align-items-center flex-wrap">
                                                                        <span className="fs-14 d-flex align-items-center">
                                                                            {formatDate(review.createdAt)}
                                                                            <i className="ti ti-point-filled text-gray mx-2" />
                                                                        </span>
                                                                        <p className="fs-14">
                                                                            <span className="badge badge-xs badge-warning text-gray-9 me-2">
                                                                                {review.rating ?? '—'}
                                                                            </span>
                                                                            {review.itemTitle || review.listingTitle || 'Listing'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="fs-14 d-flex align-items-center mb-2">
                                                                    <i className="isax isax-info-circle5 text-gray-9 me-2" />
                                                                    Info : {review.itemType ? review.itemType.charAt(0).toUpperCase() + review.itemType.slice(1) : 'Service'} Booking ({review.listingTitle || review.itemTitle || 'Listing'})
                                                                </p>
                                                                <p className="fs-16 mb-0">
                                                                    {review.comment || 'No review text provided.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            {!review.agentResponse && (
                                                                <Link
                                                                    to="#"
                                                                    className="btn btn-light btn-sm border add-reply me-2"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setReplyingId(replyingId === review.id ? null : review.id || null);
                                                                        setReplyText('');
                                                                    }}
                                                                >
                                                                    Reply
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {review.agentResponse && (
                                                        <div className="bg-light rounded p-3 mt-3 ms-5">
                                                            <p className="mb-0">
                                                                <span className="fw-medium">You Replied : </span> {review.agentResponse}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {replyingId === review.id && !review.agentResponse && (
                                                        <div className="review-reply border-top mt-3 pt-3">
                                                            <form
                                                                className="reply-form"
                                                                onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    if (review.id) handleReplySubmit(review.id);
                                                                }}
                                                            >
                                                                <textarea
                                                                    rows={3}
                                                                    className="form-control"
                                                                    placeholder="Add a professional response"
                                                                    value={replyText}
                                                                    onChange={(e) => setReplyText(e.target.value)}
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    className="btn btn-primary btn-sm mt-2"
                                                                    disabled={!replyText.trim() || savingId === review.id}
                                                                >
                                                                    {savingId === review.id ? 'Submitting...' : 'Submit'}
                                                                </button>
                                                            </form>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {/* /Reviews */}
                            </div>
                        </div>
                    </div>
                </div>
                {/* /Page Wrapper */}
            </>


        </div>
    )
}

export default AgentReviews
