const AgentPlantModal = () => {

    return (
        <>
            {/* Transaction Details Modal */}
            <div className="modal fade" id="transaction_detail" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-body text-center py-5">
                            <i className="isax isax-receipt-2 fs-32 text-gray-4 mb-2 d-block" />
                            <p className="fw-medium mb-1">No transaction details available</p>
                            <p className="fs-14 text-gray-6 mb-0">Transaction records will appear here once the finance workflow is enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Transaction Details Modal */}
            {/* Price Plan Modal */}
            <div className="modal fade" id="price_plane" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-body text-center py-5">
                            <i className="isax isax-star fs-32 text-gray-4 mb-2 d-block" />
                            <p className="fw-medium mb-1">Plan selection is not available yet</p>
                            <p className="fs-14 text-gray-6 mb-0">Plan enrollment will be available once the subscription workflow is enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Price Plan Modal */}
        </>
    )
}

export default AgentPlantModal
