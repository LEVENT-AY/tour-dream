import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ActivitySearch from '../activitySearch';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { fetchActivities } from '../../../core/services/firebaseServices';
import { useEffect, useState } from 'react';
import { Slider } from 'antd'
import type { SliderSingleProps } from 'antd';
import { GoogleMap, InfoWindow, Marker, useLoadScript } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
type ActivityRecord = Record<string, any>;
const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 53.470692,
  lng: -2.220328,
};
interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  grid_name: string;
  grid_address: string;
  grid_day: string;
  grid_rate: string;
  image: string;
  grid_star: string;
}

const buildMapLocations = (activities: ActivityRecord[]): MapLocation[] =>
  activities
    .map((activity) => {
      const lat = Number(activity.lat ?? activity.latitude);
      const lng = Number(activity.lng ?? activity.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: String(activity.id),
        lat,
        lng,
        grid_name: activity.title || '',
        grid_address: activity.location || '',
        grid_day: activity.duration || '',
        grid_rate: `$${activity.price ?? 0}`,
        image: activity.image || (Array.isArray(activity.gallery) ? activity.gallery[0] : '') || '',
        grid_star: String(activity.rating ?? 0),
      };
    })
    .filter((loc): loc is MapLocation => loc !== null);

const ActivityMap = () => {
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

  const mapLocations = buildMapLocations(activities);

  const formatter: NonNullable<SliderSingleProps['tooltip']>['formatter'] =
    (value) => `$${value}`;

  const [selectedMarker, setSelectedMarker] = useState<MapLocation | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyD6adZVdzTvBpE2yBRK8cDfsss8QXChK0I",
  });

  const [fav, setFav] = useState<boolean[]>([]);

  const handlefav = (i: number) => {
    setFav((prev) => {
      const updated = [...prev];
      updated[i] = !updated[i];
      return updated;
    });
  };

  if (!isLoaded) return <div>Loading Map...</div>;

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
      label: 'Activity Map',
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
      <div className="content pb-0">
        <div className="map-content">
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
          <div className="d-flex align-items-center justify-content-between flex-wrap recommend-wrap mb-2">
            <div className="d-flex align-items-center flex-wrap">
              <div className="dropdown mb-3">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-sm border rounded"
                  data-bs-toggle="modal"
                  data-bs-target="#filter_modal"
                >
                  <i className="isax isax-filter-add me-1" /> Filters
                </Link>
              </div>
              <div className="dropdown mb-3">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-sm border rounded"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Pricing
                </Link>
                <div className="dropdown-menu dropdown-sm">
                  <form>
                    <h6 className="fw-medium fs-16 mb-3">Pricing</h6>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="pricing1"
                        type="checkbox"
                        id="pricing1"
                        defaultChecked
                      />
                      <label className="form-check-label ms-2" htmlFor="pricing1">
                        $50 - $100
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="pricing2"
                        type="checkbox"
                        id="pricing2"
                        defaultChecked
                      />
                      <label className="form-check-label ms-2" htmlFor="pricing2">
                        $100 - $1000
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="pricing3"
                        type="checkbox"
                        id="pricing3"
                        defaultChecked
                      />
                      <label className="form-check-label ms-2" htmlFor="pricing3">
                        $1000 - $5000
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-0">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="pricing4"
                        type="checkbox"
                        id="pricing4"
                        defaultChecked
                      />
                      <label className="form-check-label ms-2" htmlFor="pricing4">
                        $10000 - $2000
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
              <div className="dropdown mb-3">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-sm border rounded"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  User Ratings
                </Link>
                <div className="dropdown-menu dropdown-sm">
                  <form>
                    <h6 className="fw-medium fs-16 mb-3">Ratings</h6>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="review01"
                        type="checkbox"
                        id="review01"
                      />
                      <label className="form-check-label ms-2" htmlFor="review01">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary" />
                          <span className="ms-2">5 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="review02"
                        type="checkbox"
                        id="review02"
                      />
                      <label className="form-check-label ms-2" htmlFor="review02">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary" />
                          <span className="ms-2">4 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="review03"
                        type="checkbox"
                        id="review03"
                      />
                      <label className="form-check-label ms-2" htmlFor="review03">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary" />
                          <span className="ms-2">3 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="review04"
                        type="checkbox"
                        id="review04"
                      />
                      <label className="form-check-label ms-2" htmlFor="review04">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary me-1" />
                          <i className="fas fa-star filled text-primary" />
                          <span className="ms-2">2 Star</span>
                        </span>
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-0">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="review05"
                        type="checkbox"
                        id="review05"
                      />
                      <label className="form-check-label ms-2" htmlFor="review05">
                        <span className="rating d-flex align-items-center">
                          <i className="fas fa-star filled text-primary" />
                          <span className="ms-2">1 Star</span>
                        </span>
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
              <div className="dropdown mb-3">
                <Link
                  to="#"
                  className="dropdown-toggle btn btn-white btn-sm border rounded"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Activity Type
                </Link>
                <div className="dropdown-menu dropdown-sm">
                  <form>
                    <h6 className="fw-medium fs-16 mb-3">Amenities</h6>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="amenities1"
                        type="checkbox"
                        id="amenities1"
                        defaultChecked
                      />
                      <label className="form-check-label ms-2" htmlFor="amenities1">
                        Adventure
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="amenities2"
                        type="checkbox"
                        id="amenities2"
                      />
                      <label className="form-check-label ms-2" htmlFor="amenities2">
                        Water Sports
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="amenities3"
                        type="checkbox"
                        id="amenities3"
                      />
                      <label className="form-check-label ms-2" htmlFor="amenities3">
                        Nature &amp; Wildlife
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="amenities4"
                        type="checkbox"
                        id="amenities4"
                      />
                      <label className="form-check-label ms-2" htmlFor="amenities4">
                        Sightseeing
                      </label>
                    </div>
                    <div className="form-check d-flex align-items-center ps-0 mb-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="amenities5"
                        type="checkbox"
                        id="amenities5"
                      />
                      <label className="form-check-label ms-2" htmlFor="amenities5">
                        Cultural Tours
                      </label>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center flex-wrap">
              <div className="input-icon mb-3 me-3">
                <span className="input-icon-addon">
                  <i className="isax isax-search-normal" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Activity Name"
                />
              </div>
              <div className="list-item d-flex align-items-center mb-3">
                <Link to={routes.activityGrid} className="list-icon me-2">
                  <i className="isax isax-grid-1" />
                </Link>
                <Link to={routes.activityList} className="list-icon me-2">
                  <i className="isax isax-firstline" />
                </Link>
                <Link to={routes.activityMap} className="list-icon active me-2">
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
                      <label className="form-check-label ms-2" htmlFor="recommend1">
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
                      <label className="form-check-label ms-2" htmlFor="recommend2">
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
                      <label className="form-check-label ms-2" htmlFor="recommend3">
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
                      <label className="form-check-label ms-2" htmlFor="recommend4">
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
                      <label className="form-check-label ms-2" htmlFor="recommend5">
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
                      <label className="form-check-label ms-2" htmlFor="recommend6">
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
        </div>
        <div className="row">
          <div className="col-xl-8">
            <div className="map-lists-widget border-top">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-4">{loadingActivities ? 'Loading activities...' : `${activities.length} Activities Found on Your Search`}</h6>
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
              <div className="text-center">
                <Link to="#" className="btn btn-primary">
                  Load More
                </Link>
              </div>
            </div>
          </div>
          {/* Map */}
          <div className="col-xl-4 map-right grid-map">
            <div id="map" className="map-listing">
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                options={{
                  scrollwheel: false,
                  mapTypeId: "roadmap",
                }}
              >
                {mapLocations.length === 0 && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', padding: '8px 12px', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                    No activity coordinates available
                  </div>
                )}
                {mapLocations.map((location) => (
                  <Marker
                    key={location.id}
                    position={{ lat: location.lat, lng: location.lng }}
                    onClick={() => setSelectedMarker(location)}
                  />
                ))}

                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <div className="card">
                        <div className="card-img">
                          <Link to={buildActivityDetailsLink(selectedMarker.id)} className="property-img">
                            <ImageWithBasePath
                              className="img-fluid w-100"
                              alt="img"
                              src={selectedMarker.image}
                              fallbackSrc={getCategoryFallbackSrc('activities')}
                            />
                          </Link>
                        </div>
                        <div className="card-body">
                          <h5 className="title mb-2">
                            <Link to={buildActivityDetailsLink(selectedMarker.id)} tabIndex={-1}>
                              {selectedMarker.grid_name}
                            </Link>
                          </h5>
                          <p className="mb-3">
                            <i className="isax isax-location"></i>{" "}
                            {selectedMarker.grid_address}
                          </p>
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <h4 className="text-primary me-1">
                                {selectedMarker.grid_rate}
                              </h4>
                              <p>{selectedMarker.grid_day}</p>
                            </div>
                            <span className="badge badge-warning text-dark">
                              {selectedMarker.grid_star}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </div>
          </div>
          {/* /Map */}
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Filter Modal */}
      <div
        className="modal fade"
        id="filter_modal"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header d-flex align-items-center justify-content-between">
              <h4>Filters</h4>
              <Link to="#" className="text-primary">
                Clear
              </Link>
            </div>
            <form>
              <div className="modal-body">
                <div className=" mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <span className="me-2">
                      <i className="isax isax-ranking text-primary" />
                    </span>
                    <h6>Activity Type</h6>
                  </div>
                  <div className="d-flex align-items-center flex-wrap">
                    <div className="form-checkbox form-check form-check-inline d-inline-flex align-items-center mt-2 me-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="popular1"
                        type="checkbox"
                        id="popular1"
                        defaultChecked
                      />
                      <label className="form-check-label ms-2" htmlFor="popular1">
                        Adventure
                      </label>
                    </div>
                    <div className="form-checkbox form-check form-check-inline d-inline-flex align-items-center mt-2 me-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="popular2"
                        type="checkbox"
                        id="popular2"
                      />
                      <label className="form-check-label ms-2" htmlFor="popular2">
                        Water Sports
                      </label>
                    </div>
                    <div className="form-checkbox form-check form-check-inline d-inline-flex align-items-center mt-2 me-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="popular3"
                        type="checkbox"
                        id="popular3"
                      />
                      <label className="form-check-label ms-2" htmlFor="popular3">
                        Air Activities
                      </label>
                    </div>
                    <div className="form-checkbox form-check form-check-inline d-inline-flex align-items-center mt-2 me-2">
                      <input
                        className="form-check-input ms-0 mt-0"
                        name="popular4"
                        type="checkbox"
                        id="popular4"
                      />
                      <label className="form-check-label ms-2" htmlFor="popular4">
                        Desert &amp; Safari
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2 pb-2">
                    <span className="me-2">
                      <i className="isax isax-coin text-primary" />
                    </span>
                    <h6>Price Per Activity</h6>
                  </div>
                  <div className="mt-4">
                    <div className="filter-range">
                      <Slider range tooltip={{ formatter }} min={200} max={5695} defaultValue={[500, 2000]} />
                    </div>
                    <div className="filter-range-amount">
                      <p className="fs-14">
                        Range :{" "}
                        <span className="text-gray-9 fw-medium">$200 - $5695</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="d-flex align-items-center justify-content-end m-0">
                  <button
                    type="button"
                    className="btn btn-light btn-md me-2"
                    data-bs-dismiss="modal"
                  >
                    Reset
                  </button>
                  <button type="submit" className="btn btn-primary btn-md">
                    Apply Filters
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Filter Modal */}
    </>
  )
}

export default ActivityMap
