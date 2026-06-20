import { all_routes } from "../../router/all_routes";
import Breadcrumb from "../../../core/common/Breadcrumb/breadcrumb";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { getCategoryFallbackSrc } from "../../../core/services/firebaseStorage";
import ActivitySearch from "../activitySearch";
import ActivityFilter from "../activityFilter";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchActivities } from "../../../core/services/firebaseServices";

const ActivityGrid = () => {
  const routes = all_routes;
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const getActivities = async () => {
      try {
        const data = await fetchActivities();
        setActivities(data);
      } catch (error) {
        console.error("Error loading activities:", error);
      } finally {
        setLoadingActivities(false);
      }
    };
    getActivities();
  }, []);

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
      label: "Activity Grid",
      active: true,
    },
  ];
  const [fav, setFav] = useState<boolean[]>([]);
  const handlefav = (i: number) => {
    setFav((prev) => {
      const updated = [...prev];
      updated[i] = !updated[i];
      return updated;
    });
  };
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
          {/* Activities Search */}
          <ActivitySearch />
          {/* /Activities Search */}
          {/* Activities Types */}
          <div className="mb-2">
            <div className="mb-3">
              <h5 className="mb-2">
                Choose type of activities you are interested
              </h5>
            </div>
            <div className="row">
              <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                  <Link to={routes.activityGrid} className="avatar avatar-lg">
                    <ImageWithBasePath
                      src="assets/img/activities/activity-model-01.jpg"
                      className="rounded-circle"
                      alt="img"
                    />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fs-16 fw-medium">
                      <Link to={routes.activityGrid}>Adventure</Link>
                    </h6>
                    <p className="fs-14">216 Activities</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                  <Link to={routes.activityGrid} className="avatar avatar-lg">
                    <ImageWithBasePath
                      src="assets/img/activities/activity-model-02.jpg"
                      className="rounded-circle"
                      alt="img"
                    />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fs-16 fw-medium">
                      <Link to={routes.activityGrid}>Water Sports</Link>
                    </h6>
                    <p className="fs-14">569 Activities</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                  <Link to={routes.activityGrid} className="avatar avatar-lg">
                    <ImageWithBasePath
                      src="assets/img/activities/activity-model-03.jpg"
                      className="rounded-circle"
                      alt="img"
                    />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fs-16 fw-medium">
                      <Link to={routes.activityGrid}>Air Activities</Link>
                    </h6>
                    <p className="fs-14">129 Activities</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                  <Link to={routes.activityGrid} className="avatar avatar-lg">
                    <ImageWithBasePath
                      src="assets/img/activities/activity-model-04.jpg"
                      className="rounded-circle"
                      alt="img"
                    />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fs-16 fw-medium">
                      <Link to={routes.activityGrid}>Desert &amp; Safari</Link>
                    </h6>
                    <p className="fs-14">60 Activities</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                  <Link to={routes.activityGrid} className="avatar avatar-lg">
                    <ImageWithBasePath
                      src="assets/img/activities/activity-model-05.jpg"
                      className="rounded-circle"
                      alt="img"
                    />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fs-16 fw-medium">
                      <Link to={routes.activityGrid}>
                        Nature &amp; Wildlife
                      </Link>
                    </h6>
                    <p className="fs-14">200 Activities</p>
                  </div>
                </div>
              </div>
              <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                <div className="d-flex align-items-center hotel-type-item mb-3">
                  <Link to={routes.activityGrid} className="avatar avatar-lg">
                    <ImageWithBasePath
                      src="assets/img/activities/activity-model-06.jpg"
                      className="rounded-circle"
                      alt="img"
                    />
                  </Link>
                  <div className="ms-2">
                    <h6 className="fs-16 fw-medium">
                      <Link to={routes.activityGrid}>Sightseeing</Link>
                    </h6>
                    <p className="fs-14">180 Activities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Activities Types */}
          <div className="row">
            {/* Sidebar */}
            <ActivityFilter />
            {/* /Sidebar */}
            <div className="col-xl-9 col-lg-8 theiaStickySidebar">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-3">
                  {activities.length}{" "}
                  <span className="fw-normal">Activities Found on Your Search</span>
                </h6>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="list-item d-flex align-items-center mb-3">
                    <Link
                      to={routes.activityGrid}
                      className="list-icon active me-2"
                    >
                      <i className="isax isax-grid-1" />
                    </Link>
                    <Link to={routes.activityList} className="list-icon me-2">
                      <i className="isax isax-firstline" />
                    </Link>
                    <Link to={routes.activityMap} className="list-icon me-2">
                      <i className="isax isax-map-1" />
                    </Link>
                  </div>
                  <div className="dropdown mb-3">
                    <Link
                      to="#"
                      className="dropdown-toggle py-2"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span className="fw-medium text-gray-9">Sort By : </span>
                      Recommended
                    </Link>
                    <div className="dropdown-menu dropdown-sm">
                      <form>
                        <h6 className="fw-medium fs-16 mb-3">Sort By</h6>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input
                            className="form-check-input ms-0 mt-0"
                            name="recommend"
                            type="checkbox"
                            id="recommend1"
                            defaultChecked
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="recommend1"
                          >
                            Recommended
                          </label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input
                            className="form-check-input ms-0 mt-0"
                            name="recommend"
                            type="checkbox"
                            id="recommend2"
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="recommend2"
                          >
                            Price: low to high
                          </label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input
                            className="form-check-input ms-0 mt-0"
                            name="recommend"
                            type="checkbox"
                            id="recommend3"
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="recommend3"
                          >
                            Price: high to low
                          </label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input
                            className="form-check-input ms-0 mt-0"
                            name="recommend"
                            type="checkbox"
                            id="recommend4"
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="recommend4"
                          >
                            Newest
                          </label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input
                            className="form-check-input ms-0 mt-0"
                            name="recommend"
                            type="checkbox"
                            id="recommend5"
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="recommend5"
                          >
                            Ratings
                          </label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-0">
                          <input
                            className="form-check-input ms-0 mt-0"
                            name="recommend"
                            type="checkbox"
                            id="recommend6"
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="recommend6"
                          >
                            Reviews
                          </label>
                        </div>
                        <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                          <Link to="#" className="btn btn-light btn-sm me-2">
                            Reset
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                          >
                            Apply
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-info br-10 p-3 pb-2 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <p className="fs-14 fw-medium mb-2 d-inline-flex align-items-center">
                    <i className="isax isax-info-circle me-2" />
                    Save an average of 15% on thousands of activities when
                    you're signed in
                  </p>
                  <Link to={routes.login} className="btn btn-white btn-sm mb-2">
                    Sign In
                  </Link>
                </div>
              </div>
              <div className="row justify-content-center">

                {loadingActivities ? (
                  <div className="text-center py-5 w-100">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading activities from database...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-5 w-100">
                    <p className="text-muted">No activities found in database.</p>
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div className="col-xl-4 col-md-6 d-flex" key={activity.id || index}>
                      <div className="place-item mb-4 flex-fill">
                        <div className="place-img">
                          <Link to={`${routes.activityDetails}?id=${activity.id}`} data-testid={`activity-card-link-${activity.id}`}>
                            <ImageWithBasePath
                              src={activity.image || activity.gallery?.[0]}
                              className="img-fluid"
                              alt={activity.title || "Activity image"}
                              fallbackSrc={getCategoryFallbackSrc("activities")}
                            />
                          </Link>
                          <div className="fav-item">
                            <button
                              className={`fav-icon border-0 ${fav[index] ? "" : "selected"}`}
                              onClick={() => handlefav(index)}
                            >
                              <i className="isax isax-heart5" />
                            </button>
                            {activity.badge && (
                              <span className="badge bg-info d-inline-flex align-items-center">
                                <i className="isax isax-ranking me-1" />
                                {activity.badge}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="place-content activity-content">
                          <div className="d-flex align-items-center badge-right position-absolute">
                            <span className="rating fs-12 me-1">
                              <i className="fas fa-star filled" />
                            </span>
                            <p className="fs-14 text-gray-2">
                              <span className="fs-14 fw-medium text-gray-9">
                                {activity.rating}
                              </span>{" "}
                              ({activity.reviewsCount} reviews)
                            </p>
                          </div>
                          <h5 className="mt-3 mb-1 text-truncate">
                            <Link to={`${routes.activityDetails}?id=${activity.id}`} data-testid={`activity-title-link-${activity.id}`}>{activity.title}</Link>
                          </h5>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <p className="d-flex align-items-center fs-14 mb-0">
                              <i className="isax isax-location5 me-1" /> {activity.location}
                            </p>
                            <p className="d-flex align-items-center fs-14 mb-0">
                              <i className="isax isax-clock5 me-1" /> {activity.duration}
                            </p>
                          </div>
                          <div className="d-flex align-items-center justify-content-between border-top pt-3">
                            <h5 className="text-primary text-nowrap d-flex align-items-center gap-1">
                              <span className="fs-14 fw-normal text-gray-6">
                                Starts From
                              </span>{" "}
                              ${activity.price}{" "}
                              {activity.oldPrice && <span className="text-gray-3 text-line">${activity.oldPrice}</span>}
                            </h5>
                            <Link
                              to="#"
                              className="d-flex align-items-center overflow-hidden"
                            >
                              <span className="avatar avatar-md flex-shrink-0">
                                <ImageWithBasePath
                                  src="assets/img/users/user-08.jpg"
                                  className="rounded-circle"
                                  alt="img"
                                />
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

              </div>

              {/* Pagination */}
              <nav className="pagination-nav">
                <ul className="pagination justify-content-center">
                  <li className="page-item disabled">
                    <Link className="page-link" to="#" aria-label="Previous">
                      <span aria-hidden="true"><i className="fa-solid fa-chevron-left" /></span>
                    </Link>
                  </li>
                  <li className="page-item"><Link className="page-link" to="#">1</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">2</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">3</Link></li>
                  <li className="page-item active"><Link className="page-link" to="#">4</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">5</Link></li>
                  <li className="page-item">
                    <Link className="page-link" to="#" aria-label="Next">
                      <span aria-hidden="true"><i className="fa-solid fa-chevron-right" /></span>
                    </Link>
                  </li>
                </ul>
              </nav>
              {/* /Pagination */}

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityGrid;
