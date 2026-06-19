import React, { useState } from "react";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import { all_routes } from "../../router/all_routes";
import CustomSelect from "../../../core/common/commonSelect";
import { CountryOption, visaCategory, visaDays, visaMode, visaValidity } from "../../../core/common/selectOption/json/selectOption";
import { Link } from "react-router-dom";
const SECTION_IDS = [
  "#basic_info",
  "#documents_requirement",
  "#additional_requirement",
  "#conditional_requirement",
  "#important_note",
  "#common_reasons_for_rejection",
  "#description",
  "#faq",
];
const AddVisa = () => {
  const routes = all_routes;
  const [activeId, setActiveId] = useState<string>("#basic_info");
  const [documentInc, setDocumentInc] = useState<string[]>([]);
  const [additionalInc, setAdditionalInc] = useState<string[]>([]);
  const [conditionalInc, setConditionalInc] = useState<string[]>([]);
  const [impNoteInc, setImpNoteInc] = useState<string[]>([]);
  const [reasonInc, setReasonInc] = useState<string[]>([]);

  const addDocument = () => {
    setDocumentInc([...documentInc, ""]); // Add an empty highlight
  };

  const removeDocument = (index: number) => {
    setDocumentInc(documentInc.filter((_, i) => i !== index)); // Remove the highlight by index
  };
  const addAdditional = () => {
    setAdditionalInc([...additionalInc, ""]); // Add an empty highlight
  };

  const removeAdditional = (index: number) => {
    setAdditionalInc(additionalInc.filter((_, i) => i !== index)); // Remove the highlight by index
  };
  const addConditional = () => {
    setConditionalInc([...conditionalInc, ""]); // Add an empty highlight
  };

  const removeConditional = (index: number) => {
    setConditionalInc(conditionalInc.filter((_, i) => i !== index)); // Remove the highlight by index
  };
  const addImpNote = () => {
    setImpNoteInc([...impNoteInc, ""]); // Add an empty highlight
  };

  const removeImpNote = (index: number) => {
    setImpNoteInc(impNoteInc.filter((_, i) => i !== index)); // Remove the highlight by index
  };
  const addReason = () => {
    setReasonInc([...reasonInc, ""]); // Add an empty highlight
  };

  const removeReason = (index: number) => {
    setReasonInc(reasonInc.filter((_, i) => i !== index)); // Remove the highlight by index
  };
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
      label: "Visa",
      link: routes.allService1,
      active: false,
    },
    {
      label: "Visa",
      active: true,
    },
    {
      label: "Add Visa",
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
          <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 theiaStickySidebar">
              <div className="card border-0 mb-4 mb-lg-0">
                <div className="card-body">
                  <div>
                    <h5 className="mb-3">Add Cruise</h5>
                    <ul className="add-tab-list">
                      <li>
                        <Link to="#basic_info" className={
                          activeId === "#basic_info" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#basic_info")}>
                          Basic Info
                        </Link>
                      </li>
                      <li>
                        <Link to="#documents_requirement" className={
                          activeId === "#documents_requirement" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#documents_requirement")}>Documents Requirement</Link>
                      </li>
                      <li>
                        <Link to="#additional_requirement" className={
                          activeId === "#additional_requirement" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#additional_requirement")}>Additional Requirement</Link>
                      </li>
                      <li>
                        <Link to="#conditional_requirement" className={
                          activeId === "#conditional_requirement" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#conditional_requirement")}>
                          Conditional Requirement
                        </Link>
                      </li>
                      <li>
                        <Link to="#important_note" className={
                          activeId === "#important_note" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#important_note")}>Important Note</Link>
                      </li>
                      <li>
                        <Link to="#common_reasons_for_rejection" className={
                          activeId === "#common_reasons_for_rejection" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#common_reasons_for_rejection")}>
                          Common Reasons for Rejection
                        </Link>
                      </li>
                      <li>
                        <Link to="#description" className={
                          activeId === "#description" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#description")} >Description</Link>
                      </li>
                      <li>
                        <Link to="#faq" className={
                          activeId === "#faq" ? "active" : ""
                        } onClick={(e) => onNavClick(e, "#faq")}>FAQ</Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {/* /Sidebar */}
            <div className="col-lg-9">
              <form>
                <div className="card shadow-none" id="basic_info">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h6 className="fs-18">Basic Info</h6>
                    </div>
                  </div>
                  <div className="card-body pb-1">
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="d-flex align-items-center mb-3">
                          <span className="img-fluid avatar avatar-xxl br-10 bg-light border text-dark flex-shrink-0 me-3">
                            <i className="isax isax-image" />
                          </span>
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
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Title<span className="text-danger ms-1">*</span>
                          </label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">
                            Category<span className="text-danger ms-1">*</span>
                          </label>
                          <CustomSelect
                            options={visaCategory}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">
                            Mode<span className="text-danger ms-1">*</span>
                          </label>
                          <CustomSelect
                            options={visaMode}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label">
                            Validity<span className="text-danger ms-1">*</span>
                          </label>
                          <CustomSelect
                            options={visaValidity}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Processing Duration
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <CustomSelect
                            options={visaDays}
                            className="select"
                            placeholder="Select"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">
                            Country<span className="text-danger ms-1">*</span>
                          </label>
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
                <div className="card shadow-none" id="documents_requirement">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Documents Requirement</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row add-requirement-info">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Requirement</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    {documentInc.map((_documentInc, index) => (
                      <div className="row add-requirement-info">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Requirement</label>
                            <div className="d-flex align-items-center">
                              <input type="text" className="form-control" />
                              <Link to="#" className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3" onClick={() => removeDocument(index)}>
                                <i className="isax isax-trash" />
                              </Link>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm add-requirement"
                        onClick={addDocument}
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="additional_requirement">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Additional Requirement</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row add-additional-requirement-info">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Additional Requirement
                          </label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    {additionalInc.map((_additionalInc, index) => (
                      <div className="row add-requirement-info">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Additional Requirement</label>
                            <div className="d-flex align-items-center">
                              <input type="text" className="form-control" />
                              <Link to="#" className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3"
                                onClick={() => removeAdditional(index)}>
                                <i className="isax isax-trash" />
                              </Link>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm add-additional-requirement"
                        onClick={addAdditional}
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="conditional_requirement">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Conditional Requirement</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row add-conditional-requirement-info">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Conditional Requirement
                          </label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    {conditionalInc.map((_conditionalInc, index) => (
                      <div className="row add-requirement-info">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Conditional Requirement</label>
                            <div className="d-flex align-items-center">
                              <input type="text" className="form-control" />
                              <Link to="#" className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3"
                                onClick={() => removeConditional(index)}>
                                <i className="isax isax-trash" />
                              </Link>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm add-conditional-requirement"
                        onClick={addConditional}
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="important_note">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Important Note</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row add-important-note-info">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">Important Note</label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    {impNoteInc.map((_impNoteInc, index) => (
                      <div className="row add-requirement-info">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Important Note</label>
                            <div className="d-flex align-items-center">
                              <input type="text" className="form-control" />
                              <Link to="#" className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3"
                                onClick={() => removeImpNote(index)}>
                                <i className="isax isax-trash" />
                              </Link>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm add-important-note"
                        onClick={addImpNote}
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="common_reasons_for_rejection">
                  <div className="card-header">
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="fs-18">Common Reasons for Rejection</h5>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row add-common-reasons-for-rejection-info">
                      <div className="col-md-12">
                        <div className="mb-3">
                          <label className="form-label">
                            Common Reasons for Rejection
                          </label>
                          <input type="text" className="form-control" />
                        </div>
                      </div>
                    </div>
                    {reasonInc.map((_reasonInc, index) => (
                      <div className="row add-requirement-info">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Common Reasons for Rejection</label>
                            <div className="d-flex align-items-center">
                              <input type="text" className="form-control" />
                              <Link to="#" className="text-danger trash-icon d-flex align-items-center justify-content-center ms-3"
                                onClick={() => removeReason(index)}>
                                <i className="isax isax-trash" />
                              </Link>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Link
                        to="#"
                        className="btn btn-primary btn-sm add-common-reasons-for-rejection"
                        onClick={addReason}
                      >
                        <i className="isax isax-add-circle me-1" />
                        Add New
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card shadow-none" id="description">
                  <div className="card-header">
                    <h5 className="fs-18">Description</h5>
                  </div>
                  <div className="card-body text-editor">
                    <div className="snow-editor" />
                  </div>
                </div>
                <div className="card shadow-none" id="faq">
                  <div className="card-header">
                    <h5 className="fs-18">FAQ</h5>
                  </div>
                  <div className="card-body">
                    <div className="card shadow-none mb-3">
                      <div className="card-body px-3 py-2">
                        <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                          <h6>
                            <Link to="#">
                              Does offer free cancellation for a full refund?
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
                            <Link to="#">Is there a pool?</Link>
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
                <div className="d-flex align-items-center justify-content-center">
                  <button type="button" className="btn btn-light me-2">
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Add New FAQ */}
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
      {/* /Add New FAQ */}
      {/* Faq Modal */}
      <div className="modal fade" id="edit_faq" tabIndex={-1} aria-hidden="true">
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
                  <input type="text" className="form-control" defaultValue="yes" />
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
    </>
  )
}

export default AddVisa
