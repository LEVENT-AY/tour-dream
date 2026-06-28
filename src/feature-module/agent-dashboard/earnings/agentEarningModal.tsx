
import { Link } from 'react-router-dom'
import CustomSelect from '../../../core/common/commonSelect'
import { Days } from '../../../core/common/selectOption/json/selectOption'

const AgentEarningModal = () => {
    return (
        <>
            {/* Earnings Invoice Modal */}
            <div className="modal fade" id="earning_invoice" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-body text-center py-5">
                            <i className="isax isax-receipt-2 fs-32 text-gray-4 mb-2 d-block" />
                            <p className="fw-medium mb-1">No invoice details available</p>
                            <p className="fs-14 text-gray-6 mb-0">Invoice records will appear here once the finance workflow is enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Earnings Invoice Modal */}
            {/* Withdraw Invoice Modal */}
            <div className="modal fade" id="withdraw_invoice" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-body text-center py-5">
                            <i className="isax isax-receipt-2 fs-32 text-gray-4 mb-2 d-block" />
                            <p className="fw-medium mb-1">No withdraw details available</p>
                            <p className="fs-14 text-gray-6 mb-0">Withdrawal records will appear here once the finance workflow is enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Withdraw Invoice Modal */}
            {/* Edit Card Modal */}
            <div className="modal fade" id="edit_card" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-md">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5>Edit Card</h5>
                            <Link to="#" data-bs-dismiss="modal" className="btn-close text-dark"></Link>
                        </div>
                        <form>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Card Holder Name <span className="text-danger"> *</span></label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon"><i className="isax isax-user fs-14" /></span>
                                        <input type="text" className="form-control" placeholder="Enter cardholder name" />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Card Number <span className="text-danger"> *</span></label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon"><i className="isax isax-card-tick fs-14" /></span>
                                        <input type="text" className="form-control" placeholder="Enter card number" />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Expire Date <span className="text-danger"> *</span></label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon"><i className="isax isax-calendar-2 fs-14" /></span>
                                        <input type="text" className="form-control" />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">CVV <span className="text-danger"> *</span></label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon"><i className="isax isax-check fs-14" /></span>
                                        <input type="text" className="form-control" placeholder="Enter CVV" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <div className="d-flex align-items-center justify-content-between flex-fill flex-wrap row-gap-3 m-0">
                                    <div className="form-check d-flex align-items-center ps-0 me-4">
                                        <input className="form-check-input ms-0 mt-0" type="checkbox" id="hotel-5" />
                                        <label className="form-check-label ms-2" htmlFor="hotel-5">Mark as default</label>
                                    </div>
                                    <div>
                                        <button className="btn btn-light btn-sm" type="button" data-bs-dismiss="modal">Cancel</button>
                                        <button className="btn btn-primary btn-sm" type="submit">Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Edit Card Modal */}
            {/* Saved Card Modal */}
            <div className="modal fade" id="saved_card" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-body text-center py-5">
                            <i className="isax isax-card-tick fs-32 text-gray-4 mb-2 d-block" />
                            <p className="fw-medium mb-1">No saved cards yet</p>
                            <p className="fs-14 text-gray-6 mb-0">Saved payment methods will appear here once the finance workflow is enabled.</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Saved Card Modal */}
            {/* Add Card Modal */}
            <div className="modal fade" id="add_card" tabIndex={-1} aria-hidden="true">
                <div className="modal-dialog  modal-dialog-centered modal-md w-500">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5>Add New</h5>
                            <Link
                                to="#"
                                data-bs-dismiss="modal"
                                className="btn-close text-dark"
                            ></Link>
                        </div>
                        <form >
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Card Holder Name <span className="text-danger"> *</span>
                                    </label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon">
                                            <i className="isax isax-user fs-14" />
                                        </span>
                                        <input type="text" className="form-control" />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Card Number <span className="text-danger"> *</span>
                                    </label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon">
                                            <i className="isax isax-card-tick fs-14" />
                                        </span>
                                        <input type="text" className="form-control" />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Expire Date <span className="text-danger"> *</span>
                                    </label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon">
                                            <i className="isax isax-calendar-2 fs-14" />
                                        </span>
                                       <input type="text" className='form-control' />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        CVV <span className="text-danger"> *</span>
                                    </label>
                                    <div className="input-icon-start position-relative">
                                        <span className="icon-addon">
                                            <i className="isax isax-check fs-14" />
                                        </span>
                                        <input type="text" className="form-control" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <div className="d-flex align-items-center justify-content-between flex-fill flex-wrap row-gap-3 m-0">
                                    <div className="form-check d-flex align-items-center ps-0 me-4">
                                        <input
                                            className="form-check-input ms-0 mt-0"
                                            type="checkbox"
                                            id="mark"
                                        />
                                        <label className="form-check-label ms-2" htmlFor="mark">
                                            Mark as default
                                        </label>
                                    </div>
                                    <div>
                                        <button
                                            className="btn btn-light btn-sm"
                                            type="button"
                                            data-bs-dismiss="modal"
                                        >
                                            Cancel
                                        </button>
                                        <button className="btn btn-primary btn-sm" type="submit">
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Add Card Modal */}
            {/* Withdraw Payment Modal */}
            <div className="modal fade" id="withdraw_payment" aria-hidden="true">
                <div className="modal-dialog  modal-dialog-centered modal-md w-500">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5>Withdraw Payment</h5>
                            <Link
                                to="#"
                                data-bs-dismiss="modal"
                                className="btn-close text-dark"
                            ></Link>
                        </div>
                        <form>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Enter Amount <span className="text-danger"> *</span>
                                    </label>
                                    <input type="text" className="form-control" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Select Account <span className="text-danger"> *</span>
                                    </label>
                                    <CustomSelect
                                        options={Days}
                                        className="select d-flex"
                                        placeholder="Select"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <div className="m-0">
                                    <button
                                        className="btn btn-light btn-sm"
                                        type="button"
                                        data-bs-dismiss="modal"
                                    >
                                        Cancel
                                    </button>
                                    <Link to="#" data-bs-dismiss="modal" className="btn btn-primary btn-sm" >
                                        Withdraw
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* /Withdraw Payment Modal */}
        </>

    )
}

export default AgentEarningModal
