import  { useState } from 'react'
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../../../core/common/imageWithBasePath'
import { all_routes } from '../../router/all_routes'
import BannerCounter from '../../../core/common/banner-counter/counter'
import { DatePicker } from 'antd'
import dayjs from "dayjs";

const CruiseInfo = () => {

    const routes = all_routes;

    const [defaultDate] = useState(dayjs());
  return (
    <div className="">
        <div className="card bg-light-200">
            <div className="card-body">
                <h5 className="d-flex align-items-center fs-18 mb-3">
                <span className="avatar avatar-md rounded-circle bg-primary me-2"><i className="isax isax-ship5"></i></span>
                Cruise Information
                </h5>
                <div>
                    <div className="d-flex align-items-center justify-content-between details-info">
                        <h6 className="fw-medium">Launched On</h6>
                        <p className="flex-fill">25 May 2025</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between details-info">
                        <h6 className="fw-medium">Length</h6>
                        <p className="flex-fill">35 M</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between details-info">
                        <h6 className="fw-medium">Staffs</h6>
                        <p className="flex-fill">200</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between details-info">
                        <h6 className="fw-medium">Beam</h6>
                        <p className="flex-fill">200 ft</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between details-info">
                        <h6 className="fw-medium">Weight</h6>
                        <p className="flex-fill">8000 grt</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between details-info">
                        <h6 className="fw-medium">Dining Crew</h6>
                        <p className="flex-fill">80</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between details-info">
                        <h6 className="fw-medium">Speed</h6>
                        <p className="flex-fill">80.6 knots</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="card shadow-none">
            <div className="card-body">
                <h5 className="fs-18 mb-3">Check Availability</h5>
                <div className="d-flex align-items-center justify-content-between bg-light-200 rounded p-3 mb-3">
                    <p className="fs-13 fw-medium mb-0">Starts From</p>
                    <h5 className="text-primary">500 TND <span className="fs-14 text-default fw-normal">/ Night</span></h5>
                </div>
                <div className="banner-form">
                    <form className="form-info border-0">
                        <div className="form-info border-0">
                            <div className="form-item dropdown border rounded p-3 mb-3 w-100">
                                <div data-bs-toggle="dropdown" data-bs-auto-close="outside"  role="menu">
                                    <label className="form-label fs-14 text-default mb-1">Destination</label>
                                    <input type="text" className="form-control" defaultValue="Hammamet"/>
                                    <p className="fs-12 mb-0">Tunisia</p>
                                </div>
                                <div className="dropdown-menu dropdown-md p-0">
                                    <div className="input-search p-3 border-bottom">
                                        <div className="input-group">
                                            <input type="text" className="form-control" placeholder="Search Location"/>
                                            <span className="input-group-text px-2 border-start-0"><i className="isax isax-search-normal"></i></span>
                                        </div>
                                    </div>
                                    <ul>
                                        <li className="border-bottom">
                                            <Link className="dropdown-item" to="#">
                                                <h6 className="fs-16 fw-medium">Hammamet</h6>
                                                <p>Ken International Airport</p>
                                            </Link>
                                        </li>
                                        <li className="border-bottom">
                                            <Link className="dropdown-item" to="#">
                                                <h6 className="fs-16 fw-medium">Boston</h6>
                                                <p>Boston Logan International Airport</p>
                                            </Link>
                                        </li>
                                        <li className="border-bottom">
                                            <Link className="dropdown-item" to="#">
                                                <h6 className="fs-16 fw-medium">Northern Virginia</h6>
                                                <p>Dulles International Airport</p>
                                            </Link>
                                        </li>
                                        <li className="border-bottom">
                                            <Link className="dropdown-item" to="#">
                                                <h6 className="fs-16 fw-medium">Hammamet</h6>
                                                <p>Hammamet International Airport</p>
                                            </Link>
                                        </li>
                                        <li className="border-bottom">
                                            <Link className="dropdown-item" to="#">
                                                <h6 className="fs-16 fw-medium">Orlando</h6>
                                                <p>Orlando International Airport</p>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="form-item border rounded p-3 mb-3 w-100">
                                <label className="form-label fs-14 text-default mb-1">Start Date</label>
                                <DatePicker
                                    className="form-control datetimepicker"
                                    placeholder="dd/mm/yyyy"
                                    defaultValue={defaultDate}
                                    format="DD-MM-YYYY"
                                    />
                                <p className="fs-12 mb-0">Monday</p>
                            </div>
                            <div className="form-item border rounded p-3 mb-3 w-100">
                                <label className="form-label fs-14 text-default mb-1">End Date</label>
                                <DatePicker
                                    className="form-control datetimepicker"
                                    placeholder="dd/mm/yyyy"
                                    defaultValue={defaultDate}
                                    format="DD-MM-YYYY"
                                    />
                                <p className="fs-12 mb-0">Monday</p>
                            </div>
                            <div className="card shadow-none mb-3">
                                <div className="card-body p-3 pb-0">
                                    <div className="border-bottom pb-2 mb-2">
                                        <h6>Details</h6>
                                    </div>
                                    <div className="custom-increment">
                                        <div className="mb-3 d-flex align-items-center justify-content-between">
                                            <label className="form-label text-gray-9 mb-0">Adults</label>
                                            <BannerCounter/>
                                        </div>
                                        <div className="mb-3 d-flex align-items-center justify-content-between">
                                            <label className="form-label text-gray-9 mb-0">Infants <span className="text-default fw-normal">( 0-12 Yrs )</span></label>
                                            <BannerCounter/>
                                        </div>
                                        <div className="mb-3 d-flex align-items-center justify-content-between">
                                            <label className="form-label text-gray-9 mb-0">Children <span className="text-default fw-normal">( 2-12 Yrs )</span></label>
                                            <BannerCounter/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link to={all_routes.cruiseBooking} className="btn btn-primary btn-lg search-btn ms-0 w-100 mb-3 fs-14 justify-content-center">Book Now</Link>
                        <div className="d-flex align-items-center justify-content-between mt-1">
                            <h6 className="fs-14 fw-medium text-success">3 Cabin Available on your Search</h6>
                            <Link to="#" className="link-primary text-decoration-underline fs-14">View Cabins</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        {/* Enquiry */}
        <div className="card shadow-none">
            <div className="card-body">
                <form action={all_routes.cruiseDetails}>
                    <h5 className="mb-3 fs-18">Enquire Us</h5>
                    <div className="py-1">
                        <div className="mb-3">
                            <label className="form-label">Name</label>
                            <input type="text" className="form-control"/>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-control"/>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Phone</label>
                            <input type="text" className="form-control"/>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Message</label>
                            <textarea className="form-control" rows={3}></textarea>
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary w-100 btn-lg d-flex align-items-center justify-content-center">Submit Enquiry</button>
                </form>
            </div>
        </div>
        {/* /Enquiry */}

        <div className="card shadow-none">
            <div className="card-body">
                <h5 className="fs-18 mb-3">Why Book With Us</h5>
                <div>
                    <p className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                            <i className="isax isax-medal-star"></i>
                        </span>Expertise and Experience
                    </p>
                    <p className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                            <i className="isax isax-menu"></i>
                        </span>Tailored Services
                    </p>
                    <p className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                            <i className="isax isax-message-minus"></i>
                        </span>Comprehensive Planning
                    </p>
                    <p className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                            <i className="isax isax-user-add"></i>
                        </span>Client Satisfaction
                    </p>
                    <p className="d-flex align-items-center">
                        <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                            <i className="isax isax-grammerly"></i>
                        </span>24/7 Support
                    </p>
                </div>
            </div>
        </div>
        <div className="card shadow-none mb-0">
            <div className="card-body">
                <h5 className="fs-18 mb-3">Provider Details</h5>
                <div className="py-1">
                    <div className="bg-light-500 br-10 mb-3 d-flex align-items-center p-3">
                        <Link to="#" className="avatar avatar-lg flex-shrink-0">
                            <ImageWithBasePath src="assets/img/users/user-05.jpg" alt="img" className="rounded-circle" />
                        </Link>
                        <div className="ms-2 overflow-hidden">
                            <h6 className="fw-medium text-truncate"><Link to="#">Adrian Hendriques</Link></h6>
                            <p className="fs-14">Member Since : 14 May 2024</p>
                        </div>
                    </div>
                    <div className="border br-10 mb-3 p-3">
                        <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                            <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary"><i className="isax isax-call-outgoing5"></i></span>
                            <p>+1 12545 45548</p>
                        </div>
                        <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                            <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary"><i className="isax isax-message-search5"></i></span>
                            <p>Info@example.com</p>
                        </div>
                        <div className="d-flex align-items-center">
                            <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary"><i className="isax isax-location-tick5"></i></span>
                            <p>4635 Pheasant Ridge Road, Tunisia</p>
                        </div>
                    </div>
                </div>
                <div className="row g-2">
                    <div className="col-sm-6">
                        <Link to="#" className="btn btn-light d-flex align-items-center justify-content-center"><i className="isax isax-messages5 me-2"></i>Whatsapp Us</Link>
                    </div>
                    <div className="col-sm-6">
                        <Link to={routes.userChat} className="btn btn-primary d-flex align-items-center justify-content-center"><i className="isax isax-message-notif5 me-2"></i>Chat Now</Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default CruiseInfo
