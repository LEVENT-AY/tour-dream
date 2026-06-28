const AgentPlanSettingsModal = () => {

    return (
        <div>
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
            {/* Delete Modal */}
            <div className="modal fade" id="delete-list" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-body text-center py-5">
                            <i className="isax isax-trash fs-32 text-gray-4 mb-2 d-block" />
                            <p className="fw-medium mb-1">No saved cards to delete</p>
                            <p className="fs-14 text-gray-6 mb-0">Saved cards will appear here once the finance workflow is enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Delete Modal */}
        </div>
    )
}

export default AgentPlanSettingsModal
