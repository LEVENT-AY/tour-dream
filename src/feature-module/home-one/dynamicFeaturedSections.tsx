import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import ImageWithBasePath from '../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../core/services/firebaseStorage';
import { all_routes } from '../router/all_routes';
import {
  fetchHomepageSettings,
  fetchTours,
  fetchHotels,
  fetchFlights,
  type HomepageSettings,
} from '../../core/services/firebaseServices';

const DynamicFeaturedSections = () => {
  const routes = all_routes;
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t, h, f] = await Promise.all([
          fetchHomepageSettings(),
          fetchTours(),
          fetchHotels(),
          fetchFlights(),
        ]);
        setSettings(s);
        setTours(t.filter((item) => item.published !== false));
        setHotels(h.filter((item) => item.published !== false));
        setFlights(f.filter((item) => item.published !== false));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const sliderSettings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 2000,
    autoplay: false,
    swipe: true,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const getFeatured = (all: Record<string, any>[], ids: string[]) =>
    (ids?.map((id) => all.find((item) => item.id === id)).filter((item): item is Record<string, any> => !!item) || []);

  const renderTourCard = (tour: Record<string, any>) => (
    <div className="col-xl-4 col-md-6 d-flex" key={tour.id}>
      <div className="place-item common-grid-slider mb-4 flex-fill">
        <div className="place-img">
          <div className="img-slider image-slide owl-carousel nav-center">
            <Slider {...sliderSettings}>
              <div className="slide-images">
                <Link to={routes.tourDetails}>
                  <ImageWithBasePath src={tour.image} className="img-fluid" alt={tour.title || "Tour image"} fallbackSrc={getCategoryFallbackSrc("tours")} />
                </Link>
              </div>
            </Slider>
          </div>
          {tour.trending && (
            <div className="fav-item">
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1" />
                Trending
              </span>
            </div>
          )}
        </div>
        <div className="place-content">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <div className="d-flex flex-wrap align-items-center">
              <span className="me-1"><i className="ti ti-receipt text-primary" /></span>
              <p className="fs-14 text-gray-9">{tour.type}</p>
            </div>
            <div className="d-flex align-items-center flex-wrap">
              <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-1">{tour.rating}</span>
              <p className="fs-14">({tour.reviewsCount} Reviews)</p>
            </div>
          </div>
          <h5 className="mb-1 text-truncate"><Link to={routes.tourDetails}>{tour.title}</Link></h5>
          <p className="d-flex align-items-center mb-3"><i className="isax isax-location5 me-2" />{tour.location}</p>
          <div className="mb-3">
            <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal">
              Starts From <span className="ms-1 fs-18 fw-semibold text-primary">${tour.price}</span>
              {tour.oldPrice && <span className="ms-1 fs-18 fw-semibold text-gray-3 text-decoration-line-through">${tour.oldPrice}</span>}
            </h6>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <div className="d-flex flex-wrap align-items-center me-2">
              <span className="me-1"><i className="isax isax-calendar-tick text-gray-6" /></span>
              <p className="fs-14 text-gray-9">{tour.duration}</p>
            </div>
            <Link to={routes.tourBooking} className="btn btn-outline-primary btn-sm">Book Now</Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHotelCard = (hotel: Record<string, any>) => (
    <div className="col-xl-4 col-md-6 d-flex" key={hotel.id}>
      <div className="place-item mb-4 flex-fill">
        <div className="place-img">
          <Link to={routes.hotelDetails}>
            <ImageWithBasePath src={hotel.image} className="img-fluid" alt={hotel.title || "Hotel image"} fallbackSrc={getCategoryFallbackSrc("hotels")} />
          </Link>
          {hotel.badge && (
            <div className="fav-item">
              <span className="badge bg-info d-inline-flex align-items-center"><i className="isax isax-ranking me-1" />{hotel.badge}</span>
            </div>
          )}
        </div>
        <div className="place-content">
          <div className="d-flex align-items-center mb-1">
            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{hotel.rating}</span>
            <p className="fs-14">({hotel.reviewsCount} Reviews)</p>
          </div>
          <h5 className="mb-1 text-truncate"><Link to={routes.hotelDetails}>{hotel.title}</Link></h5>
          <p className="d-flex align-items-center mb-2"><i className="isax isax-location5 me-2" />{hotel.location}</p>
          <div className="border-top pt-2 mb-2">
            <h6 className="d-flex align-items-center">Facillities :<i className="isax isax-home-wifi ms-2 me-2 text-primary"></i><i className="isax isax-scissor me-2 text-primary"></i><i className="isax isax-profile-2user me-2 text-primary"></i><i className="isax isax-wind-2 me-2 text-primary"></i><Link to="#" className="fs-14 fw-normal text-default d-inline-block">+2</Link></h6>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <h5 className="text-primary text-nowrap me-2">${hotel.price} <span className="fs-14 fw-normal text-default">/ Night</span></h5>
            <Link to="#" className="d-flex align-items-center overflow-hidden">
              <span className="avatar avatar-md flex-shrink-0 me-2">
                <ImageWithBasePath src="assets/img/users/user-08.jpg" className="rounded-circle" alt="img" />
              </span>
              <p className="fs-14">Agent</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFlightCard = (flight: Record<string, any>) => (
    <div className="col-xxl-4 col-md-6 d-flex" key={flight.id}>
      <div className="place-item mb-4 flex-fill">
        <div className="place-img">
          <Link to={routes.flightDetails}>
            <ImageWithBasePath src={flight.image} className="img-fluid" alt={flight.title || "Flight image"} fallbackSrc={getCategoryFallbackSrc("flights")} />
          </Link>
          <div className="fav-item">
            {flight.badge && <span className="badge bg-indigo">{flight.badge}</span>}
            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium rounded">{flight.rating}</span>
          </div>
        </div>
        <div className="place-content">
          <div className="flight-loc d-flex align-items-center justify-content-between mb-2">
            <span className="loc-name d-inline-flex align-items-center"><i className="isax isax-airplane rotate-45 me-2" />{flight.departureCity}</span>
            <Link to="#" className="arrow-icon flex-shrink-0"><i className="isax isax-arrow-2" /></Link>
            <span className="loc-name d-inline-flex align-items-center"><i className="isax isax-airplane rotate-135 me-2" />{flight.arrivalCity}</span>
          </div>
          <h5 className="text-truncate mb-1"><Link to={routes.flightDetails}>{flight.title}</Link></h5>
          <div className="d-flex align-items-center mb-2">
            <span className="avatar avatar-sm me-2">
              <ImageWithBasePath src="assets/img/icons/airindia.svg" className="rounded-circle" alt="icon" />
            </span>
            <p className="fs-14 mb-0 me-2">{flight.airline}</p>
            <p className="fs-14 mb-0"><i className="ti ti-point-filled text-primary me-2" />{flight.stopInfo}</p>
          </div>
          <div className="date-info p-2 mb-3">
            <p className="d-flex align-items-center"><i className="isax isax-calendar-2 me-2" />{flight.dates}</p>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3">
            <h6 className="text-primary"><span className="fs-14 fw-normal text-default">From </span>${flight.price}</h6>
            {flight.seatsLeft && <span className="badge bg-outline-success fs-10 fw-medium">{flight.seatsLeft} Seats Left</span>}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || !settings) return null;

  const featuredTours = getFeatured(tours, settings.featuredTours);
  const featuredHotels = getFeatured(hotels, settings.featuredHotels);
  const featuredFlights = getFeatured(flights, settings.featuredFlights);

  return (
    <>
      {settings.sections.featuredTours && featuredTours.length > 0 && (
        <section className="section bg-light">
          <div className="container">
            <div className="section-header mb-4 text-center">
              <h2 className="mb-2">{settings.sectionTitles.featuredTours}</h2>
            </div>
            <div className="row">{featuredTours.map(renderTourCard)}</div>
          </div>
        </section>
      )}
      {settings.sections.featuredHotels && featuredHotels.length > 0 && (
        <section className="section bg-white">
          <div className="container">
            <div className="section-header mb-4 text-center">
              <h2 className="mb-2">{settings.sectionTitles.featuredHotels}</h2>
            </div>
            <div className="row">{featuredHotels.map(renderHotelCard)}</div>
          </div>
        </section>
      )}
      {settings.sections.featuredFlights && featuredFlights.length > 0 && (
        <section className="section bg-light">
          <div className="container">
            <div className="section-header mb-4 text-center">
              <h2 className="mb-2">{settings.sectionTitles.featuredFlights}</h2>
            </div>
            <div className="row">{featuredFlights.map(renderFlightCard)}</div>
          </div>
        </section>
      )}
    </>
  );
};

export default DynamicFeaturedSections;
