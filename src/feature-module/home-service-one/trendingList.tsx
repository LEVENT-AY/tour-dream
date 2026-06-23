import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { getCategoryFallbackSrc } from "../../core/services/firebaseStorage";
import {
  TRENDING_FALLBACK_DATA,
  fetchTrendingSectionCards,
  type TrendingSectionCards,
} from "../../core/services/trendingListings";

const TrendingList = () => {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [cards, setCards] = useState<TrendingSectionCards>(TRENDING_FALLBACK_DATA);

  useEffect(() => {
    let cancelled = false;

    const loadCards = async () => {
      try {
        const nextCards = await fetchTrendingSectionCards();
        if (!cancelled) {
          setCards(nextCards);
        }
      } catch {
        if (!cancelled) {
          setCards(TRENDING_FALLBACK_DATA);
        }
      }
    };

    void loadCards();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavorite = (key: string) => {
    setFavorites((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderFlightCard = (flight: TrendingSectionCards["flights"][number]) => (
    <div className="col-xxl-3 col-lg-4 col-md-6" key={flight.id}>
      <div className="trending-list-item">
        <div className="place-img">
          <Link to={flight.route}>
            <ImageWithBasePath
              src={flight.image}
              className="img-fluid"
              alt={flight.title}
              fallbackSrc={getCategoryFallbackSrc("flights")}
            />
          </Link>
          <div className="fav-item d-flex align-items-center gap-2 flex-wrap">
            {flight.badge ? (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1" />
                {flight.badge}
              </span>
            ) : null}
            <span className="badge bg-white text-dark">{flight.seatsLabel}</span>
            <button
              className={`fav-icon border-0 ${favorites[`flight:${flight.id}`] ? "selected" : ""}`}
              onClick={() => toggleFavorite(`flight:${flight.id}`)}
              type="button"
            >
              <i className="isax isax-heart5" />
            </button>
          </div>
        </div>
        <div className="place-content">
          <h3 className="text-truncate mb-2 home-eight-title">
            <Link to={flight.route}>{flight.title}</Link>
          </h3>
          <div className="d-flex align-items-center mb-3">
            <span className="avatar avatar-sm me-2">
              <ImageWithBasePath
                src="assets/img/icons/airindia.svg"
                className="rounded-circle"
                alt="icon"
              />
            </span>
            <p className="fs-14 mb-0">{flight.airline}</p>
            <p className="fs-14 d-inline-flex align-items-center mb-0">
              <i className="fa-solid fa-circle fs-6 text-primary mx-2" />
              {flight.stopInfo}
            </p>
          </div>
          <div className="flight-loc d-flex align-items-center justify-content-between mb-3">
            <span className="loc-name d-inline-flex align-items-center">
              <i className="isax isax-airplane rotate-45 me-2" />
              {flight.departureCity}
            </span>
            <span className="arrow-icon">
              <i className="isax isax-arrow-2" />
            </span>
            <span className="loc-name d-inline-flex align-items-center">
              <i className="isax isax-airplane rotate-135 me-2" />
              {flight.arrivalCity}
            </span>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium rounded">
                {flight.rating}
              </span>
              <span className="fs-14 text-gray-5">{flight.reviewsLabel}</span>
            </div>
            <div className="d-flex align-items-center">
              <span className="fs-14 text-gray-5 me-2">From</span>
              <span className="fs-18 fw-semibold text-primary">{flight.price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHotelCard = (hotel: TrendingSectionCards["hotels"][number]) => (
    <div className="col-xl-3 col-md-6 d-flex" key={hotel.id}>
      <div className="trending-list-item">
        <div className="place-img">
          <div className="img-slide">
            <div className="slide-images">
              <Link to={hotel.route}>
                <ImageWithBasePath
                  src={hotel.image}
                  className="img-fluid"
                  alt={hotel.title}
                  fallbackSrc={getCategoryFallbackSrc("hotels")}
                />
              </Link>
            </div>
          </div>
          <div className="fav-item">
            {hotel.badge ? (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1" />
                {hotel.badge}
              </span>
            ) : null}
            <button
              className={`fav-icon border-0 ${favorites[`hotel:${hotel.id}`] ? "" : "selected"}`}
              onClick={() => toggleFavorite(`hotel:${hotel.id}`)}
              type="button"
            >
              <i className="isax isax-heart5" />
            </button>
          </div>
        </div>
        <div className="place-content">
          <div className="d-flex align-items-center mb-1">
            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
              {hotel.rating}
            </span>
            <p className="fs-14">{hotel.reviewsLabel}</p>
          </div>
          <h5 className="mb-1 text-truncate">
            <Link to={hotel.route}>{hotel.title}</Link>
          </h5>
          <p className="d-flex align-items-center mb-2">
            <i className="isax isax-location5 me-2" />
            {hotel.location}
          </p>
          <div className="border-top pt-2 mb-2">
            <h6 className="d-flex align-items-center">
              Facillities :
              <i className="isax isax-home-wifi ms-2 me-2 text-primary" />
              <i className="isax isax-scissor me-2 text-primary" />
              <i className="isax isax-profile-2user me-2 text-primary" />
              <i className="isax isax-wind-2 me-2 text-primary" />
              <Link to="#" className="fs-14 fw-normal text-default d-inline-block">
                +2
              </Link>
            </h6>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <h5 className="text-primary text-nowrap me-2">
              {hotel.price}{" "}
              <span className="fs-14 fw-normal text-default">{hotel.priceSuffix}</span>
            </h5>
            <Link to="#" className="d-flex align-items-center overflow-hidden">
              <span className="avatar avatar-md flex-shrink-0 me-2">
                <ImageWithBasePath
                  src={hotel.hostAvatar}
                  className="rounded-circle"
                  alt="img"
                />
              </span>
              <p className="fs-14">{hotel.hostName}</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCarCard = (car: TrendingSectionCards["cars"][number]) => (
    <div className="col-xxl-3 col-xl-4 col-md-6 d-flex" key={car.id}>
      <div className="trending-list-item">
        <div className="place-img">
          <div className="img-slide">
            <div className="slide-images">
              <Link to={car.route}>
                <ImageWithBasePath
                  src={car.image}
                  className="img-fluid"
                  alt={car.title}
                  fallbackSrc={getCategoryFallbackSrc("cars")}
                />
              </Link>
            </div>
          </div>
          <div className="fav-item">
            <button
              className={`fav-icon border-0 ${favorites[`car:${car.id}`] ? "selected" : ""}`}
              onClick={() => toggleFavorite(`car:${car.id}`)}
              type="button"
            >
              <i className="isax isax-heart5" />
            </button>
            {car.badge ? (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1" />
                {car.badge}
              </span>
            ) : null}
          </div>
        </div>
        <div className="place-content">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <div className="d-flex flex-wrap align-items-center">
              <span className="badge badge-secondary fs-10 fw-medium me-1">{car.type}</span>
            </div>
          </div>
          <h5 className="mb-1 text-truncate">
            <Link to={car.route}>{car.title}</Link>
          </h5>
          <p className="d-flex align-items-center mb-3">
            <i className="isax isax-location5 me-2" />
            {car.location}
          </p>
          <div className="mb-3 p-2 border rounded">
            <div className="row">
              <div className="col border-end">
                <span className="fs-14 d-flex align-items-center text-dark">
                  <i className="isax isax-gas-station me-1" />
                  Fuel
                </span>
                <p className="text-dark fs-14">{car.fuel}</p>
              </div>
              <div className="col border-end">
                <span className="fs-14 d-flex align-items-center text-dark">
                  <i className="isax isax-kanban me-1" />
                  Gear
                </span>
                <p className="text-dark fs-14">{car.gear}</p>
              </div>
              <div className="col">
                <span className="fs-14 d-flex align-items-center text-dark">
                  <i className="isax isax-routing-2 me-1" />
                  Travelled
                </span>
                <p className="text-dark fs-14">{car.travelled}</p>
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <div className="d-flex flex-wrap align-items-center me-2">
              <h5 className="text-primary">
                {car.price}{" "}
                <span className="fs-14 text-gray-6 fw-normal">{car.priceSuffix}</span>
              </h5>
            </div>
            <div className="ms-2 d-flex align-items-center">
              <div className="d-flex align-items-center flex-wrap">
                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-1">
                  {car.rating}
                </span>
                <p className="fs-14">{car.reviewsLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCruiseCard = (cruise: TrendingSectionCards["cruise"][number]) => (
    <div className="col-xl-3 col-md-6 d-flex" key={cruise.id}>
      <div className="trending-list-item">
        <div className="place-img">
          <div className="img-slide">
            <div className="slide-images">
              <Link to={cruise.route}>
                <ImageWithBasePath
                  src={cruise.image}
                  className="img-fluid"
                  alt={cruise.title}
                  fallbackSrc={getCategoryFallbackSrc("default")}
                />
              </Link>
            </div>
          </div>
          <div className="fav-item">
            <button
              className={`fav-icon border-0 ${favorites[`cruise:${cruise.id}`] ? "" : "selected"}`}
              onClick={() => toggleFavorite(`cruise:${cruise.id}`)}
              type="button"
            >
              <i className="isax isax-heart5" />
            </button>
            {cruise.badge ? (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1" />
                {cruise.badge}
              </span>
            ) : null}
          </div>
        </div>
        <div className="place-content">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Link to="#" className="d-flex align-items-center overflow-hidden me-2">
              <span className="avatar avatar-md flex-shrink-0 me-2">
                <ImageWithBasePath
                  src="assets/img/users/user-08.jpg"
                  className="rounded-circle"
                  alt="img"
                />
              </span>
              <p className="fs-14 text-truncate">{cruise.hostName}</p>
            </Link>
            <div className="d-flex align-items-center">
              <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                {cruise.rating}
              </span>
              <p className="fs-14 text-truncate">{cruise.reviewsLabel}</p>
            </div>
          </div>
          <h5 className="mb-1 text-truncate">
            <Link to={cruise.route}>{cruise.title}</Link>
          </h5>
          <p className="d-flex align-items-center mb-3">
            <i className="isax isax-location5 me-2" />
            {cruise.location}
          </p>
          <div className="curise-details d-flex justify-content-between align-items-center mb-3">
            <div>
              <p className="mb-1">
                <i className="isax isax-calendar-2 text-gray-6 me-1" />
                Year :<span className="text-dark fw-medium"> {cruise.year}</span>
              </p>
              <p>
                <i className="isax isax-user me-1" />
                Guests : <span className="text-dark fw-medium">{cruise.guests}</span>
              </p>
            </div>
            <div>
              <p className="mb-1">
                <i className="isax isax-fatrows text-gray-6 me-1" />
                Width :<span className="text-dark fw-medium"> {cruise.width}</span>
              </p>
              <p>
                <i className="isax isax-flash-1 me-1" />
                Speed : <span className="text-dark fw-medium">{cruise.speed}</span>
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <h6 className="d-flex align-items-center">
              <i className="isax isax-home-wifi ms-2 me-2" />
              <i className="isax isax-scissor me-2" />
              <i className="isax isax-profile-2user me-2" />
              <i className="isax isax-wind-2 me-2" />
              <Link to="#" className="fs-14 fw-normal text-default d-inline-block">
                +2
              </Link>
            </h6>
            <h5 className="text-primary text-nowrap me-2">
              {cruise.price}{" "}
              <span className="fs-14 fw-normal text-default">{cruise.priceSuffix}</span>
            </h5>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTourCard = (tour: TrendingSectionCards["tour"][number]) => (
    <div className="col-xxl-3 col-xl-4 col-md-6 d-flex" key={tour.id}>
      <div className="trending-list-item">
        <div className="place-img">
          <div className="img-slide">
            <div className="slide-images">
              <Link to={tour.route}>
                <ImageWithBasePath
                  src={tour.image}
                  className="img-fluid"
                  alt={tour.title}
                  fallbackSrc={getCategoryFallbackSrc("tours")}
                />
              </Link>
            </div>
          </div>
          <div className="fav-item">
            <button
              className={`fav-icon border-0 ${favorites[`tour:${tour.id}`] ? "" : "selected"}`}
              onClick={() => toggleFavorite(`tour:${tour.id}`)}
              type="button"
            >
              <i className="isax isax-heart5" />
            </button>
            {tour.badge ? (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1" />
                {tour.badge}
              </span>
            ) : null}
          </div>
        </div>
        <div className="place-content">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <div className="d-flex flex-wrap align-items-center">
              <span className="me-1">
                <i className="ti ti-receipt text-primary" />
              </span>
              <p className="fs-14 text-gray-9">{tour.category}</p>
            </div>
            <span className="d-inline-block border vertical-splits">
              <span className="bglight text-light d-flex align-items-center justify-content-center" />
            </span>
            <div className="d-flex align-items-center flex-wrap">
              <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-1">
                {tour.rating}
              </span>
              <p className="fs-14">{tour.reviewsLabel}</p>
            </div>
          </div>
          <h5 className="mb-1 text-truncate">
            <Link to={tour.route}>{tour.title}</Link>
          </h5>
          <p className="d-flex align-items-center mb-3">
            <i className="isax isax-location5 me-2" />
            {tour.location}
          </p>
          <div className="mb-3">
            <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal">
              Starts From
              <span className="ms-1 fs-18 fw-semibold text-primary">{tour.price}</span>
              {tour.oldPrice ? (
                <span className="ms-1 fs-18 fw-semibold text-gray-3 text-decoration-line-through">
                  {tour.oldPrice}
                </span>
              ) : null}
            </h6>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <div className="d-flex flex-wrap align-items-center me-2">
              <span className="me-1">
                <i className="isax isax-calendar-tick text-gray-6" />
              </span>
              <p className="fs-14 text-gray-9">{tour.duration}</p>
            </div>
            <span className="d-inline-block border vertical-splits">
              <span className="bglight text-light d-flex align-items-center justify-content-center" />
            </span>
            <div className="ms-2 d-flex align-items-center">
              <p className="fs-14 text-gray-9 mb-0 text-truncate d-flex align-items-center">
                <i className="isax isax-profile-2user me-1" />
                {tour.guestsLabel}
              </p>
              <Link to="#" className="avatar avatar-sm ms-3">
                <ImageWithBasePath
                  src={tour.guestAvatar}
                  className="rounded-circle"
                  alt="img"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActivityCard = (activity: TrendingSectionCards["activity"][number]) => (
    <div className="col-xl-3 col-md-6 d-flex" key={activity.id}>
      <div className="trending-list-item">
        <div className="place-img">
          <Link to={activity.route}>
            <ImageWithBasePath
              src={activity.image}
              className="img-fluid"
              alt={activity.title}
              fallbackSrc={getCategoryFallbackSrc("activities")}
            />
          </Link>
          <div className="fav-item">
            <button
              className={`fav-icon border-0 ${favorites[`activity:${activity.id}`] ? "selected" : ""}`}
              onClick={() => toggleFavorite(`activity:${activity.id}`)}
              type="button"
            >
              <i className="isax isax-heart5" />
            </button>
            {activity.badge ? (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1" />
                {activity.badge}
              </span>
            ) : null}
          </div>
        </div>
        <div className="place-content activity-content">
          <div className="d-flex align-items-center badge-right">
            <span className="rating fs-12 me-1">
              <i className="fas fa-star filled" />
            </span>
            <p className="fs-14 text-gray-2">
              <span className="fs-14 fw-medium text-gray-9">{activity.rating}</span>{" "}
              {activity.reviewsLabel}
            </p>
          </div>
          <h5 className="mt-1 mb-1 text-truncate">
            <Link to={activity.route}>{activity.title}</Link>
          </h5>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <p className="d-flex align-items-center fs-14 mb-0">
              <i className="isax isax-location5 me-1" />
              {activity.location}
            </p>
            <p className="d-flex align-items-center fs-14 mb-0">
              <i className="isax isax-clock5 me-1" />
              {activity.duration}
            </p>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <h5 className="text-primary text-nowrap d-flex align-items-center gap-1">
              <span className="fs-14 fw-normal text-gray-6">Starts From</span>{" "}
              {activity.price}{" "}
              {activity.oldPrice ? <span className="text-gray-3 text-line">{activity.oldPrice}</span> : null}
            </h5>
            <Link to="#" className="d-flex align-items-center overflow-hidden">
              <span className="avatar avatar-md flex-shrink-0">
                <ImageWithBasePath
                  src={activity.hostAvatar}
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

  const renderVisaCard = (visa: TrendingSectionCards["visa"][number]) => (
    <div className="col-xxl-3 col-xl-4 col-md-6 d-flex" key={visa.id}>
      <div className="trending-list-item">
        <div className="place-img">
          <div className="slide-images">
            <Link to={visa.route}>
              <ImageWithBasePath
                src={visa.image}
                className="img-fluid w-100"
                alt={visa.title}
                fallbackSrc={getCategoryFallbackSrc("default")}
              />
            </Link>
          </div>
          <div className="fav-item">
            <button
              className={`fav-icon p-2 border-0 ${favorites[`visa:${visa.id}`] ? "" : "selected"}`}
              onClick={() => toggleFavorite(`visa:${visa.id}`)}
              type="button"
            >
              <i className="isax isax-heart5" />
            </button>
            <span className="badge bg-white text-dark d-inline-flex align-items-center">
              {visa.badge}
            </span>
          </div>
        </div>
        <div className="place-content">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <div className="d-flex flex-wrap align-items-center me-2">
              <span className="me-1">
                <i className="isax isax-clock text-gray-6" />
              </span>
              <p className="fs-14 text-gray-9">{visa.processingTime}</p>
            </div>
          </div>
          <h5 className="mb-2">
            <Link to={visa.route}>{visa.title}</Link>
          </h5>
          <div className="d-flex align-items-center gap-0 mb-3">
            <p className="d-flex align-items-center fs-14 mb-0 me-2">Mode : {visa.mode}</p>
            <p className="fs-14 mb-0">
              <i className="ti ti-point-filled text-primary me-2" />
              Validity : {visa.validity}
            </p>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <div className="mb-0">
              <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal">
                From{" "}
                <span className="ms-1 fs-18 fw-semibold text-primary">
                  {visa.price}
                </span>
                <span className="ms-1 fs-14 text-gray-3">{visa.priceSuffix}</span>
              </h6>
            </div>
            <div className="ms-2 d-flex align-items-center">
              <p className="d-flex align-items-center fs-14 mb-0">
                <i className="isax isax-location5 me-1" />
                {visa.location}
              </p>
            </div>
          </div>
          {visa.details ? <p className="visually-hidden">{visa.details}</p> : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section className="section trending-list">
        <div className="container">
          <div className="section-header-eight wow fadeInUp">
            <h2>
              Trending Listings &amp; <br />{" "}
              <ImageWithBasePath
                src="./assets/img/bg/heading-bg-01.png"
                alt="img"
              />{" "}
              Best Sellers
            </h2>
          </div>
          <div className="d-flex align-items-center justify-content-center mb-4 px-2 gap-2 wow fadeInUp">
            <ul className="nav">
              <li>
                <Link to="#" className="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-1">
                  Flights
                </Link>
              </li>
              <li>
                <Link to="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-2">
                  Hotels
                </Link>
              </li>
              <li>
                <Link to="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-3">
                  Cars
                </Link>
              </li>
              <li>
                <Link to="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-4">
                  Cruise
                </Link>
              </li>
              <li>
                <Link to="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-5">
                  Tour
                </Link>
              </li>
              <li>
                <Link to="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-6">
                  Activity
                </Link>
              </li>
              <li>
                <Link to="#" className="nav-link" data-bs-toggle="tab" data-bs-target="#tab-7">
                  Visa
                </Link>
              </li>
            </ul>
          </div>
          <div className="tab-content wow fadeInUp">
            <div className="tab-pane fade active show" id="tab-1">
              <div className="row justify-content-center">{cards.flights.map(renderFlightCard)}</div>
            </div>
            <div className="tab-pane fade" id="tab-2">
              <div className="row row-gap-4 justify-content-center">{cards.hotels.map(renderHotelCard)}</div>
            </div>
            <div className="tab-pane fade" id="tab-3">
              <div className="row row-gap-4 justify-content-center">{cards.cars.map(renderCarCard)}</div>
            </div>
            <div className="tab-pane fade" id="tab-4">
              <div className="row justify-content-center">{cards.cruise.map(renderCruiseCard)}</div>
            </div>
            <div className="tab-pane fade" id="tab-5">
              <div className="row row-gap-4 justify-content-center">{cards.tour.map(renderTourCard)}</div>
            </div>
            <div className="tab-pane fade" id="tab-6">
              <div className="row row-gap-4 justify-content-center">{cards.activity.map(renderActivityCard)}</div>
            </div>
            <div className="tab-pane fade" id="tab-7">
              <div className="row row-gap-4 justify-content-center">{cards.visa.map(renderVisaCard)}</div>
            </div>
          </div>
        </div>
      </section>
      <div className="support-sec-outer">
        <section className="support-section support-sec-eight bg-dark overflow-hidden">
          <div
            className="horizontal-slide d-flex"
            data-direction="right"
            data-speed="slow"
          >
            <div className="slide-list d-flex">
              <div className="support-item">
                <h3>Personalized Itineraries</h3>
              </div>
              <div className="support-item">
                <h3>Comprehensive Planning</h3>
              </div>
              <div className="support-item">
                <h3>Expert Guidance</h3>
              </div>
              <div className="support-item">
                <h3>Local Experience</h3>
              </div>
              <div className="support-item">
                <h3>Customer Support</h3>
              </div>
              <div className="support-item">
                <h3>Sustainability Efforts</h3>
              </div>
              <div className="support-item">
                <h3>Multiple Regions</h3>
              </div>
            </div>
          </div>
        </section>
        <section className="support-section support-sec-eight bg-primary overflow-hidden">
          <div
            className="horizontal-slide d-flex"
            data-direction="left"
            data-speed="slow"
          >
            <div className="slide-list d-flex">
              <div className="support-item">
                <h3>Personalized Itineraries</h3>
              </div>
              <div className="support-item">
                <h3>Comprehensive Planning</h3>
              </div>
              <div className="support-item">
                <h3>Expert Guidance</h3>
              </div>
              <div className="support-item">
                <h3>Local Experience</h3>
              </div>
              <div className="support-item">
                <h3>Customer Support</h3>
              </div>
              <div className="support-item">
                <h3>Sustainability Efforts</h3>
              </div>
              <div className="support-item">
                <h3>Multiple Regions</h3>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default TrendingList;
