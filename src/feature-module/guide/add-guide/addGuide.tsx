import React, { useState } from "react";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import { all_routes } from "../../router/all_routes";
import { Link } from "react-router-dom";
import CustomSelect from "../../../core/common/commonSelect";
import { ActivityLanguage, ActivityPickup, CountryOption, gender, guideExpertise, tourTypes } from "../../../core/common/selectOption/json/selectOption";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
const SECTION_IDS = [
  "#basic_info",
  "#location",
  "#pricing",
  "#availability",
  "#language_skills",
  "#certifications",
  "#description",
];
const AddGuide = () => {


  const routes = all_routes;
  const [activeId, setActiveId] = useState<string>("#basic_info");
  const getModalContainer = () =>
    document.getElementById("modal_datepicker") || document.body;
  const [defaultDate] = useState(dayjs());
  React.useEffect(() => {
    const initial =
      (typeof window !== "undefined" && window.location?.hash) || "#basic_info";
    setActiveId(initial);
  }, []);
  React.useEffect(() => {
    const headerOffset = 80;
    const observers: IntersectionObserver[] = [];

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = `#${entry.target.id}`;
          setActiveId(id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: `-${headerOffset}px 0px -60% 0px`,
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
    });

    SECTION_IDS.forEach((hash) => {
      const el = document.querySelector(hash);
      if (el) {
        observer.observe(el);
      }
    });

    observers.push(observer);
    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);
  const onNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    const target = document.querySelector(hash) as HTMLElement | null;
    if (target) {
      const headerOffset = 80;
      const y =
        target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(hash);
      if (history.replaceState) {
        history.replaceState(null, "", hash);
      }
    }
  };
  //Breadcrumb Data
  const breadcrumbs = [
    {
      label: "Guide",
      link: routes.allService1,
      active: false,
    },
    {
      label: "Our Guide",
      active: true,
    },
    {
      label: "Add Guide",
      active: true,
    },
  ];
  return (
    <>
      <Breadcrumb
        title="Guide"
        breadcrumbs={breadcrumbs}
        backgroundClass="breadcrumb-bg-09"
      />
      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-lg-3 theiaStickySidebar">
              <div className="card border-0 mb-4 mb-lg-0">
                <div className="card-body">
                  <div>
                    <h5 className="mb-3">Add Guide</h5>
                    <ul className="add-tab-list">
                      <li>
                        <Link to="#basic_info" className={
                          activeId === "#basic_info" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#basic_info")}>
                          Basic Information
                        </Link>
                      </li>
                      <li>
                        <Link to="#location" className={
                          activeId === "#location" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#location")}>Location</Link>
                      </li>
                      <li>
                        <Link to="#pricing" className={
                          activeId === "#pricing" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#pricing")}>Pricing</Link>
                      </li>
                      <li>
                        <Link to="#availability" className={
                          activeId === "#availability" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#availability")}>Availability</Link>
                      </li>
                      <li>
                        <Link to="#language_skills" className={
                          activeId === "#language_skills" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#language_skills")}>Language &amp; Skills</Link>
                      </li>
                      <li>
                        <Link to="#certifications" className={
                          activeId === "#certifications" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#certifications")}>Certifications &amp; Safety</Link>
                      </li>
                      <li>
                        <Link to="#description" className={
                          activeId === "#description" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#description")}>Description</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-9">
              <form>
                <div className="card shadow-none" id="basic_info">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Guide Details</h5>
                    </div>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="d-flex align-items-center mb-3">
                          <ImageWithBasePath
                            src="assets/img/users/user-01.jpg"
                            alt="image"
                            className="img-fluid avatar avatar-xxl br-10 flex-shrink-0 me-3"
                          />
                          <div>
                            <p className="fs-14 text-gray-6 fw-normal mb-2">
                              Recommended dimensions are typically 400 x 400 pixels.
                            </p>
                            <div className="d-flex align-items-center">
                              <div className="me-2">
                                <label className="upload-btn" htmlFor="fileUpload">
                                  Upload
                                </label>
                                <input
                                  type="file"
                                  id="fileUpload"
                                  style={{ display: "none" }}
                                />
                              </div>
                              <Link to="#" className="btn btn-light btn-md">
                                Remove
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">First Name</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Last Name</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Gender</label>
                          <CustomSelect
                            options={gender}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Phone</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-lg-4 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Date of Birth</label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              placeholder="dd/mm/yyyy"
                              defaultValue={defaultDate}
                              format="DD-MM-YYYY"
                            />
                            <span className="input-icon-addon">
                              <i className="isax isax-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="location">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Location</h5>
                    </div>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Address Line 1</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Address Line 2</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Country</label>
                          <CustomSelect
                            options={CountryOption}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">City</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">State</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Zip Code</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-xl-12 col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Operating Areas</label>
                          <CustomSelect
                            options={CountryOption}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="pricing">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Pricing</h5>
                    </div>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-xl-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Price (USD)</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-xl-6 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Overtime Price (USD)</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="availability">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Availability</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row align-items-center mb-3">
                      <div className="col-lg-4">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            id="check1"
                          />
                          <label className="form-label mb-0" htmlFor="check1">
                            Sunday
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row align-items-center mb-3">
                      <div className="col-lg-4">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            id="check2"
                          />
                          <label className="form-label mb-0" htmlFor="check2">
                            Monday
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row align-items-center mb-3">
                      <div className="col-lg-4">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            id="check3"
                          />
                          <label className="form-label mb-0" htmlFor="check3">
                            Tuesday
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row align-items-center mb-3">
                      <div className="col-lg-4">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            id="check4"
                          />
                          <label className="form-label mb-0" htmlFor="check4">
                            Wednesday
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row align-items-center mb-3">
                      <div className="col-lg-4">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            id="check5"
                          />
                          <label className="form-label mb-0" htmlFor="check5">
                            Thursday
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row align-items-center mb-3">
                      <div className="col-lg-4">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            id="check6"
                          />
                          <label className="form-label mb-0" htmlFor="check6">
                            Friday
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row align-items-center">
                      <div className="col-lg-4">
                        <div className="form-check form-switch mb-1">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            role="switch"
                            id="check7"
                          />
                          <label className="form-label mb-0" htmlFor="check7">
                            Saturday
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div>
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              getPopupContainer={getModalContainer}
                              use12Hours
                              placeholder="Choose"
                              format="h:mm A"
                              className="form-control timepicker"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10 text-gray-7" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="language_skills">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Language &amp; Skills</h5>
                    </div>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-12">
                        <div className="mb-3">
                          <label className="form-label">Languages Known</label>
                          <CustomSelect
                            options={ActivityLanguage}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="mb-3">
                          <label className="form-label">Tour Types</label>
                          <CustomSelect
                            options={tourTypes}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="mb-3">
                          <label className="form-label">Activity Expertise</label>
                          <CustomSelect
                            options={guideExpertise}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="certifications">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Certifications &amp; Safety</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">Certified Guide</label>
                          <CustomSelect
                            options={ActivityPickup}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">First Aid Trained</label>
                          <CustomSelect
                            options={ActivityPickup}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="mb-3">
                          <label className="form-label">Certification Name</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="upload-certificate-wrapper mb-3">
                        <div className="upload-certificate">
                          <div className="file-upload drag-file w-100 d-flex align-items-center justify-content-center flex-column mb-2">
                            <span className="upload-img d-block mb-2">
                              <i className="isax isax-document-upload fs-24" />
                            </span>
                            <h6 className="mb-1">Upload Gallery Images</h6>
                            <p className="mb-0">
                              Upload Feature Image First, Image size should below
                              5MB
                            </p>
                            <input type="file" accept="image/*,video/*" />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary add-upload-certificate"
                      >
                        <i className="isax isax-add-circle5 me-1" />
                        Add New
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="description">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Description</h5>
                  </div>
                  <div className="card-body text-editor">
                    <div className="snow-editor" />
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  <button type="button" className="btn btn-light me-2">
                    Reset
                  </button>
                  <Link to={routes.guideGrid} className="btn btn-primary">
                    Add New Guide
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
    </>
  )
}

export default AddGuide
