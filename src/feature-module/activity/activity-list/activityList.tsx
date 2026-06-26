import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ActivitySearch from '../activitySearch';
import ActivityFilter from '../activityFilter';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { fetchActivities } from '../../../core/services/firebaseServices';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

type ActivityRecord = Record<string, any>;

const ActivityList = () => {
  const routes = all_routes;
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    const getActivities = async () => {
      try {
        const data = await fetchActivities();
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };
    getActivities();
  }, []);

  const buildActivityDetailsLink = (activityId: string) => `${routes.activityDetails}?id=${activityId}`;

  const getActivityImages = (activity: ActivityRecord) => {
    const gallery = Array.isArray(activity.gallery) ? activity.gallery.filter(Boolean) : [];
    const primary = activity.image || gallery[0];
    return gallery.length > 0 ? gallery : primary ? [primary] : [];
  };

  const renderActivityCard = (activity: ActivityRecord, index: number) => {
    const activityImages = getActivityImages(activity);
    const activityLink = buildActivityDetailsLink(activity.id);
    const activityDescription =
      activity.description ||
      activity.details ||
      'Explore this admin-managed activity listing with up-to-date pricing, images, and location details.';
    const activityDuration = activity.duration || '';

    return (
      <div className="place-item mb-4" key={activity.id || index}>
        <div className="place-img activity-img">
          <Link to={activityLink}>
            <ImageWithBasePath
              src={activityImages[0] || activity.image}
              className="img-fluid"
              alt={activity.title || 'Activity image'}
              fallbackSrc={getCategoryFallbackSrc('activities')}
            />
          </Link>
          <div className="fav-item">
            <span className="badge bg-info d-inline-flex align-items-center">
              <i className="isax isax-ranking me-1" />
              Trending
            </span>
            <button className={`fav-icon border-0 ${fav[index] ? '' : 'selected'}`} onClick={() => handlefav(index)}>
              <i className="isax isax-heart5" />
            </button>
          </div>
        </div>
        <div className="place-content pb-1">
          <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
            <div>
              <h5 className="mb-1 text-truncate">
                <Link to={activityLink}>{activity.title}</Link>
              </h5>
              <p className="d-flex align-items-center mb-2">
                <i className="isax isax-location5 me-1" />
                {activity.location}
              </p>
            </div>
            <div className="d-flex align-items-center mb-2">
              <div className="d-flex align-items-center text-nowrap">
                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                  {activity.rating}
                </span>
                <p className="fs-14">({activity.reviewsCount || 0} Reviews)</p>
              </div>
            </div>
          </div>
          <p className="line-ellipsis fs-14">{activityDescription}</p>
          <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3">
            <p className="d-flex align-items-center mb-3">
              <i className="isax isax-clock4 me-2" /> {activityDuration}
            </p>
            <div className="d-flex align-items-center mb-2">
              <div className="d-flex align-items-center text-nowrap border-end pe-2 me-2">
                <h5 className="text-primary text-nowrap d-flex align-items-center gap-1">
                  <span className="fs-14 fw-normal text-gray-6">
                    Starts From
                  </span>
                  ${activity.price}{" "}
                  {activity.oldPrice && (
                    <span className="text-gray-3 text-decoration-line-through">
                      ${activity.oldPrice}
                    </span>
                  )}
                </h5>
              </div>
              <Link
                to="#"
                className="d-flex align-items-center overflow-hidden"
              >
                <span className="avatar avatar-md flex-shrink-0">
                  <ImageWithBasePath
                    src="assets/img/users/user-01.jpg"
                    className="rounded-circle"
                    alt="img"
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  //Breadcrumb Data
  const breadcrumbs = [
    {
      label: 'Activity',
      link: routes.allService1,
      active: false,
    },
    {
      label: 'Activity',
      active: true,
    },
    {
      label: 'Activity List',
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
          {/* Hotel Search */}
          <ActivitySearch />
          {/* /Hotel Search */}
          {/* Hotel Types */}
          <div className="mb-2">
            <div className="mb-3">
              <h5 className="mb-2">Choose type of activities you are interested</h5>
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
                      <Link to={routes.activityGrid}>Nature &amp; Wildlife</Link>
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
          {/* /Hotel Types */}
          <div className="row">
            {/* Sidebar */}
            <ActivityFilter />
            {/* /Sidebar */}
            <div className="col-xl-9 col-lg-8">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-3">
                  {loadingActivities ? 'Loading activities...' : `${activities.length} Activities `}
                  <span className="fw-normal">Found on Your Search</span>
                </h6>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="list-item d-flex align-items-center mb-3">
                    <Link to={routes.activityGrid} className="list-icon me-2">
                      <i className="isax isax-grid-1" />
                    </Link>
                    <Link to={routes.activityList} className="list-icon active me-2">
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
                          <button type="submit" className="btn btn-primary btn-sm">
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
                    Save an average of 15% on thousands of activities when you're
                    signed in
                  </p>
                  <Link to={routes.login} className="btn btn-white btn-sm mb-2">
                    Sign In
                  </Link>
                </div>
              </div>
              <div className="hotel-list">
                <div className="row justify-content-center">
                  <div className="col-md-12">
                    {loadingActivities ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading activities from database...</p>
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No activities found in database.</p>
                      </div>
                    ) : (
                      activities.map(renderActivityCard)
                    )}
                  </div>
                </div>
              </div>
              {/* Pagination */}
              <nav className="pagination-nav">
                <ul className="pagination justify-content-center">
                  <li className="page-item disabled">
                    <Link className="page-link" to="#" aria-label="Previous">
                      <span aria-hidden="true">
                        <i className="fa-solid fa-chevron-left" />
                      </span>
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" to="#">
                      1
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" to="#">
                      2
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" to="#">
                      3
                    </Link>
                  </li>
                  <li className="page-item active">
                    <Link className="page-link" to="#">
                      4
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" to="#">
                      5
                    </Link>
                  </li>
                  <li className="page-item">
                    <Link className="page-link" to="#" aria-label="Next">
                      <span aria-hidden="true">
                        <i className="fa-solid fa-chevron-right" />
                      </span>
                    </Link>
                  </li>
                </ul>
              </nav>
              {/* /Pagination */}
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}

    </>
  )
}

export default ActivityList
