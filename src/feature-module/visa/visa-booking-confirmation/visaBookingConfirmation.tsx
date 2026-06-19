import { Link } from "react-router-dom";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
const VisaBookingConfirmation = () => {
  const routes = all_routes;

  //Breadcrumb Data
  const breadcrumbs = [
    {
      label: "Visa",
      link: routes.allService1,
      active: false,
    },
    {
      label: "Visa",
      active: true,
    },
    {
      label: "Visa Booking Confirmation",
      active: true,
    },
  ];
  return (
    <>
      <Breadcrumb
        title="Visa"
        breadcrumbs={breadcrumbs}
        backgroundClass="breadcrumb-bg-08"
      />
      {/* Page Wrapper */}
      <div className="content">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card mb-0">
                <div className="card-body">
                  <div className="upcoming-content">
                    <div className="upcoming-title bg-light-200 border border-light mb-4 d-flex align-items-center justify-content-between p-3 rounded">
                      <div className="d-flex align-items-center flex-wrap">
                        <div className="me-2">
                          <ImageWithBasePath
                            src="assets/img/users/user-11.jpg"
                            alt="image"
                            className="avatar avartar-md avatar-rounded"
                          />
                        </div>
                        <div>
                          <h6 className="mb-1">
                            Long term for Academic with Health Insurance
                          </h6>
                          <div className="title-list d-flex align-items-center">
                            <p className="text-primary me-2 mb-0 fs-14">
                              #VS-1254 <i className="ti ti-point-filled ms-2" />
                            </p>
                            <p className="d-flex align-items-center fs-14 pe-2 me-2  border-light fw-normal">
                              <i className="isax isax-location5 me-1" />
                              Egypt
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="badge badge-purple rounded-pill d-inline-flex align-items-center fs-10">
                          <i className="fa-solid fa-circle fs-5 me-1" />
                          Applied
                        </span>
                      </div>
                    </div>
                    <div className="upcoming-details pb-4 border-bottom mb-4">
                      <h6 className="mb-2">Visa Details</h6>
                      <div className="row gy-3">
                        <div className="col-lg-3">
                          <h6 className="fs-14">Country</h6>
                          <p className="text-gray-6 fs-16 ">Egypt</p>
                        </div>
                        <div className="col-lg-3">
                          <h6 className="fs-14">Catgeory</h6>
                          <p className="text-gray-6 fs-16 ">Student Visa</p>
                        </div>
                        <div className="col-lg-3">
                          <h6 className="fs-14">Validity</h6>
                          <p className="text-gray-6 fs-16 ">1 Year</p>
                        </div>
                        <div className="col-lg-3">
                          <h6 className="fs-14">No of Persons</h6>
                          <p className="text-gray-6 fs-16 ">04</p>
                        </div>
                        <div className="col-lg-3">
                          <h6 className="fs-14">Processing Time</h6>
                          <p className="text-gray-6 fs-16 ">7-10 Working Day</p>
                        </div>
                        <div className="col-lg-3">
                          <h6 className="fs-14">Visa Mode</h6>
                          <p className="text-gray-6 fs-16 ">Consular Visa</p>
                        </div>
                        <div className="col-lg-3">
                          <h6 className="fs-14">Applied On</h6>
                          <p className="text-gray-6 fs-16 ">20 May 2026</p>
                        </div>
                      </div>
                    </div>
                    <div className="upcoming-details">
                      <h6 className="mb-2">Personal Details</h6>
                      <div className="row gy-3">
                        <div className="col-lg-4">
                          <h6 className="fs-14">Name</h6>
                          <p className="text-gray-6 fs-16 ">Chris Foxy</p>
                        </div>
                        <div className="col-lg-4">
                          <h6 className="fs-14">Email</h6>
                          <p className="text-gray-6 fs-16 ">
                            chrfo2356@example.com
                          </p>
                        </div>
                        <div className="col-lg-4">
                          <h6 className="fs-14">Date of Birth</h6>
                          <p className="text-gray-6 fs-16 ">25 May 2005</p>
                        </div>
                        <div className="col-lg-4">
                          <h6 className="fs-14">Phone</h6>
                          <p className="text-gray-6 fs-16 ">+1 12656 26654</p>
                        </div>
                        <div className="col-lg-4">
                          <h6 className="fs-14">Document</h6>
                          <div className="d-flex">
                            <p className="text-gray-6 fs-16 me-2">Passport.pdf</p>
                            <Link
                              to="#"
                              className="fw-medium text-primary text-decoration-underline"
                            >
                              Download
                            </Link>
                          </div>
                        </div>
                      </div>
                      <h6 className="mb-2">Short Description</h6>
                      <p>
                        Apply for a visa to study abroad for an academic year with
                        comprehensive healthcare coverage.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-footer text-end">
                  <Link to="#" className="btn btn-primary">
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
    </>
  )
}

export default VisaBookingConfirmation
