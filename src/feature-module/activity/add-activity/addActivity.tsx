import { all_routes } from "../../router/all_routes";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import CustomSelect from "../../../core/common/commonSelect";
import {
  ActivityBus,
  ActivityCategory,
  ActivityCity,
  ActivityDifficulty,
  ActivityEquipment,
  ActivityLanguage,
  ActivityPickup,
  ActivityPrice,
  ActivityState,
  ActivityTime,
  CountryOption,
} from "../../../core/common/selectOption/json/selectOption";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
const SECTION_IDS = [
  "#activity-details",
  "#location",
  "#timeslots",
  "#dropoff",
  "#extra",
  "#faq",
  "#gallery",
  "#description",
];
const AddActivity = () => {
  const routes = all_routes;
  const [activeId, setActiveId] = useState<string>("#basic_info");
  const getModalContainer = () =>
    document.getElementById("modal_datepicker") || document.body;
  const [highlights, setHighlights] = useState<string[]>([]);
  const [service, setService] = useState<string[]>([]);
const disabledDate = (current: any) => {
  return current && current < dayjs().startOf("day");
};
  const addHighlight = () => {
    setHighlights([...highlights, ""]); // Add an empty highlight
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index)); // Remove the highlight by index
  };
  const addService = () => {
    setService([...service, ""]); // Add an empty highlight
  };

  const removeService = (index: number) => {
    setService(service.filter((_, i) => i !== index)); // Remove the highlight by index
  };

  const [galleryItems, setGalleryItems] = useState<string[]>([
    "assets/img/uploads/upload-06.jpg",
    "assets/img/uploads/upload-07.jpg",
    "assets/img/uploads/upload-08.jpg",
    "assets/img/uploads/upload-09.jpg",
  ]);
  const removeGalleryItem = (index: number) => {
    setGalleryItems(galleryItems.filter((_, i) => i !== index)); // Remove item by index
  };
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
      label: "Activity",
      link: routes.allService1,
      active: false,
    },
    {
      label: "Activity",
      active: true,
    },
    {
      label: "Add Activity",
      active: true,
    },
  ];
  return (
    <>
      <Breadcrumb
        title="Activity"
        breadcrumbs={breadcrumbs}
        backgroundClass="breadcrumb-bg-01"
      />
      {/* Page Wrapper */}
      <div className="content">
        <div className="container">
          {/* Add New Bus */}
          <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 theiaStickySidebar">
              <div className="card border-0 mb-4 mb-lg-0">
                <div className="card-body">
                  <div>
                    <h5 className="mb-3">Add Activity</h5>
                    <ul className="add-tab-list">
                      <li>
                        <Link
                          to="#activity-details"
                          className={
                            activeId === "#activity-details" ? "active" : ""
                          }
                          onClick={(e) => onNavClick(e, "#activity-details")}
                        >
                          Activity Details
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#location"
                          className={activeId === "#location" ? "active" : ""}
                          onClick={(e) => onNavClick(e, "#location")}
                        >
                          Location
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#timeslots"
                          className={activeId === "#timeslots" ? "active" : ""}
                          onClick={(e) => onNavClick(e, "#timeslots")}
                        >
                          Timeslots
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#dropoff"
                          className={activeId === "#dropoff" ? "active" : ""}
                          onClick={(e) => onNavClick(e, "#dropoff")}
                        >
                          Itinerary
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#extra"
                          className={activeId === "#extra" ? "active" : ""}
                          onClick={(e) => onNavClick(e, "#extra")}
                        >
                          Extra Services
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#faq"
                          className={activeId === "#faq" ? "active" : ""}
                          onClick={(e) => onNavClick(e, "#faq")}
                        >
                          FAQ
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#gallery"
                          className={activeId === "#gallery" ? "active" : ""}
                          onClick={(e) => onNavClick(e, "#gallery")}
                        >
                          Gallery
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#description"
                          className={
                            activeId === "#description" ? "active" : ""
                          }
                          onClick={(e) => onNavClick(e, "#description")}
                        >
                          Description
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {/* /Sidebar */}
            <div className="col-lg-9">
              <form>
                <div className="card shadow-none" id="activity-details">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Activity Details</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      {/* Activity Name */}
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Activity Name</label>
                          <input
                            type="text"
                            className="form-control"
                            name="activity_name"
                          />
                        </div>
                      </div>
                      {/* Category */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Category</label>
                          <CustomSelect
                            options={ActivityCategory}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      {/* Start Date */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Start Date</label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              placeholder="dd/mm/yyyy"
                              defaultValue={defaultDate}
                              format="DD-MM-YYYY"
                              disabledDate={disabledDate}
                            />
                            <span className="input-icon-addon">
                              <i className="isax isax-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* End Date */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">End Date</label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              placeholder="dd/mm/yyyy"
                              defaultValue={defaultDate}
                              format="DD-MM-YYYY"
                              disabledDate={disabledDate}
                            />
                            <span className="input-icon-addon">
                              <i className="isax isax-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Total People */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">
                            Total Number Of People Allotted
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="total_people"
                          />
                        </div>
                      </div>
                      {/* Pricing */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Pricing (TND)</label>
                          <input
                            type="text"
                            className="form-control"
                            name="price"
                          />
                        </div>
                      </div>
                      {/* Offer Price */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">
                            Offer Price (TND)
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            name="offer_price"
                          />
                        </div>
                      </div>
                      {/* Duration */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Duration</label>
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
                      {/* Difficulty */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Difficulty</label>
                          <CustomSelect
                            options={ActivityDifficulty}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      {/* Hotel Pickup */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Hotel Pickup</label>
                          <CustomSelect
                            options={ActivityPickup}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      {/* Equipments */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Equipments</label>
                          <CustomSelect
                            options={ActivityEquipment}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      {/* Guide */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Guide</label>
                          <CustomSelect
                            options={ActivityPickup}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      {/* Languages */}
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Languages</label>
                          <CustomSelect
                            options={ActivityLanguage}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="location">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Location</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
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
                          <label className="form-label">State</label>
                          <CustomSelect
                            options={ActivityState}
                            className="select"
                            placeholder="Select State"
                          />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">City</label>
                          <CustomSelect
                            options={ActivityCity}
                            className="select"
                            placeholder="Select City"
                          />
                        </div>
                      </div>
                      <div className="col-xl-3 col-md-6">
                        <div className="mb-3">
                          <label className="form-label">Zip Code</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="timeslots">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Timeslots</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="timeslots">
                      <div className="row">
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Timeslots Name</label>
                            <CustomSelect
                              options={ActivityTime}
                              className="select"
                              placeholder="Select"
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
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
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
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
                      {highlights.map((_highlight, index) => (
                        <div className="row">
                          <div className="col-xl-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label">
                                Timeslots Name
                              </label>
                              <CustomSelect
                                options={ActivityTime}
                                className="select"
                                placeholder="Select"
                              />
                            </div>
                          </div>
                          <div className="col-xl-4 col-md-6">
                            <div className="mb-3">
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
                          <div className="col-xl-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label">To</label>
                              <div className="d-flex align-items-center">
                                <div className="input-icon-end position-relative w-100">
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
                                <Link to="#"
                                  className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3"
                                  onClick={() => removeHighlight(index)}
                                >
                                  <i className="isax isax-trash" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm add-timeslot"
                        onClick={addHighlight}
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="itenary">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Itenary</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="card shadow-none mb-3">
                      <div className="card-body px-3 py-2">
                        <div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                          <h6>
                            <Link to="#">Day 1, Kickoff in Los Angeles</Link>
                          </h6>
                          <div className="d-flex align-items-center">
                            <Link
                              to="#"
                              className="rounded-edit d-flex align-items-center justify-content-center me-2"
                            >
                              <i className="isax isax-edit-2" />
                            </Link>
                            <Link
                              to="#"
                              className="trash-icon d-flex align-items-center justify-content-center"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                            >
                              <i className="isax isax-trash text-danger" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#add_iternary"
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="extra">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Extra Services</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="extra-service">
                      <div className="row">
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Service Name</label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Price Type</label>
                            <CustomSelect
                              options={ActivityPrice}
                              className="select"
                              placeholder="Select"
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Offer Price (TND)
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                      </div>
                      {service.map((_service, index) => (
                        <div className="row">
                          <div className="col-xl-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Service Name</label>
                              <input type="text" className="form-control" />
                            </div>
                          </div>
                          <div className="col-xl-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Price Type</label>
                              <CustomSelect
                                options={ActivityPrice}
                                className="select"
                                placeholder="Select"
                              />
                            </div>
                          </div>
                          <div className="col-xl-4 col-md-6">
                            <div className="mb-3">
                              <label className="form-label">
                                Offer Price (TND)
                              </label>
                              <div className="d-flex align-items-center">
                                <input type="text" className="form-control" />
                                <Link to="#"
                                  className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3"
                                  onClick={() => removeService(index)}
                                >
                                  <i className="isax isax-trash" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm add-extraservice"
                        onClick={addService}
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="basic_info">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Basic Info</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Bus Name</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Bus Number</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Bus Type</label>
                          <CustomSelect
                            options={ActivityBus}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">Launched On</label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              placeholder="dd/mm/yyyy"
                              defaultValue={defaultDate}
                              format="DD-MM-YYYY"
                              disabledDate={disabledDate}
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
                <div className="card shadow-none" id="faq">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Faq</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="card shadow-none mb-3">
                      <div className="card-body px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                          <h6>
                            <Link to="#">
                              Is this activity suitable for beginners?
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center">
                            <Link
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#edit_faq"
                              className="rounded-edit d-flex align-items-center justify-content-center me-2"
                            >
                              <i className="isax isax-edit-2" />
                            </Link>
                            <Link
                              to="#"
                              className="trash-icon d-flex align-items-center justify-content-center"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                            >
                              <i className="isax isax-trash text-danger" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card shadow-none mb-3">
                      <div className="card-body px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                          <h6>
                            <Link to="#">
                              Do I need to know swimming to join?
                            </Link>
                          </h6>
                          <div className="d-flex align-items-center">
                            <Link
                              to="#"
                              data-bs-toggle="modal"
                              data-bs-target="#edit_faq"
                              className="rounded-edit d-flex align-items-center justify-content-center me-2"
                            >
                              <i className="isax isax-edit-2" />
                            </Link>
                            <Link
                              to="#"
                              className="trash-icon d-flex align-items-center justify-content-center"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                            >
                              <i className="isax isax-trash text-danger" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#add_faq"
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="gallery">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Gallery</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="file-upload drag-file w-100 d-flex align-items-center justify-content-center flex-column mb-2">
                      <span className="upload-img d-block mb-2">
                        <i className="isax isax-document-upload fs-24" />
                      </span>
                      <h6 className="mb-1">Upload Gallery Images</h6>
                      <p className="mb-0">
                        Upload Feature Image First, Image size should below 5MB
                      </p>
                      <input type="file" accept="video/image" />
                    </div>
                    <div className="d-flex align-items-center">
                      {galleryItems.map((src, index) => (
                        <Link to="#" key={index} className="gallery-upload-img me-2">
                          <ImageWithBasePath src={src} alt={`Gallery Item ${index + 1}`} />
                          <span
                            className="trash-icon d-flex align-items-center justify-content-center text-danger gallery-trash"
                            onClick={() => removeGalleryItem(index)}
                          >
                            <i className="isax isax-trash" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="description">
                  <div className="card-header d-flex align-items-center justify-content-between">
                    <h5 className="fs-18">Description</h5>
                    <button
                      type="button"
                      className="btn btn-sm p-2 btn-light d-inline-flex align-items-center justify-content-center rounded-circle"
                    >
                      <i className="isax isax-edit-2" />
                    </button>
                  </div>
                  <div className="card-body text-editor">
                    <div className="snow-editor" />
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  <button type="button" className="btn btn-light me-2">
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Add New Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
          {/* /Add New Bus */}
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Filter Modal */}
      <div className="modal fade" id="add_faq" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Add New FAQ</h5>
              <button
                data-bs-dismiss="modal"
                aria-label="close"
                className="btn-close"
              />
            </div>
            <form>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Question <span className="text-danger"> *</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
                <div>
                  <label className="form-label">
                    Answer <span className="text-danger"> *</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
              </div>
              <div className="modal-footer">
                <div className="d-flex align-items-center justify-content-end m-0">
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    className="btn btn-sm btn-light me-2"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Add FAQ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Filter Modal */}
      {/* Faq Modal */}
      <div
        className="modal fade"
        id="edit_faq"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Edit FAQ</h5>
              <button
                data-bs-dismiss="modal"
                aria-label="close"
                className="btn-close"
              />
            </div>
            <form>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Question <span className="text-danger"> *</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="Does offer free cancellation for a full refund?"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Answer <span className="text-danger"> *</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    defaultValue="yes"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <div className="d-flex align-items-center justify-content-end m-0">
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    className="btn btn-sm btn-light me-2"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Save FAQ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Faq Modal */}
      {/* Delete Modal */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body">
              <form>
                <div className="text-center">
                  <h5 className="mb-3">Confirm Delete</h5>
                  <p className="mb-3">
                    Are you sure you want to delete this item?
                  </p>
                  <div className="d-flex align-items-center justify-content-center">
                    <Link
                      to="#"
                      className="btn btn-light me-2"
                      data-bs-dismiss="modal"
                    >
                      No
                    </Link>
                    <button type="submit" className="btn btn-primary">
                      Yes
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Delete Modal */}
      {/* Iternary Modal */}
      <div
        className="modal fade"
        id="add_iternary"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5>Add New Itenary</h5>
              <button
                data-bs-dismiss="modal"
                aria-label="close"
                className="btn-close"
              />
            </div>
            <form>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Itenary <span className="text-danger"> *</span>
                  </label>
                  <input type="text" className="form-control" />
                </div>
              </div>
              <div className="modal-footer">
                <div className="d-flex align-items-center justify-content-end m-0">
                  <button
                    type="button"
                    data-bs-dismiss="modal"
                    className="btn btn-sm btn-light me-2"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    Add Itenary
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Iternary Modal */}
    </>
  );
};

export default AddActivity;
