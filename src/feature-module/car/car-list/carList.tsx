import { useEffect, useState } from 'react';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { all_routes } from '../../router/all_routes';
import CarSearch from '../carSearch';
import CarFilter from '../carFilter';
import { fetchCars } from '../../../core/services/firebaseServices';

type CarRecord = Record<string, any>;

const CarList = () => {
  const routes = all_routes;
  const [cars, setCars] = useState<CarRecord[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [selectedItems, setSelectedItems] = useState<boolean[]>([]);

  useEffect(() => {
    const getCars = async () => {
      try {
        const data = await fetchCars();
        setCars(data.filter((car) => car.published !== false));
      } catch (error) {
        console.error('Error loading cars:', error);
      } finally {
        setLoadingCars(false);
      }
    };
    getCars();
  }, []);

  const handleItemClick = (index: number) => {
    setSelectedItems((prevSelectedItems) => {
      const updatedSelectedItems = [...prevSelectedItems];
      updatedSelectedItems[index] = !updatedSelectedItems[index];
      return updatedSelectedItems;
    });
  };

  const breadcrumbs = [
    {
      label: 'Car',
      link: routes.allService1,
      active: false,
    },
    {
      label: 'Car',
      active: false,
    },
    {
      label: 'Car List',
      active: true,
    },
  ];

  const imgslideroption = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 2000,
    autoplay: false,
    swipe: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 1 } },
      { breakpoint: 1300, settings: { slidesToShow: 1 } },
      { breakpoint: 992, settings: { slidesToShow: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 1 } },
      { breakpoint: 0, settings: { slidesToShow: 1 } },
    ],
  };

  const buildCarDetailsLink = (carId: string) => `${routes.carDetails}?id=${carId}`;

  const getCarImages = (car: CarRecord) => {
    const gallery = Array.isArray(car.gallery) ? car.gallery.filter(Boolean) : [];
    const primary = car.image || gallery[0];
    return gallery.length > 0 ? gallery : primary ? [primary] : [];
  };

  const renderCarCard = (car: CarRecord, index: number) => {
    const carImages = getCarImages(car);
    const carLink = buildCarDetailsLink(car.id);
    const carDescription =
      car.description ||
      car.details ||
      'Explore this admin-managed car listing with up-to-date pricing, images, and location details.';

    return (
      <div className="place-item mb-4" key={car.id || index}>
        <div className="place-img">
          {carImages.length > 1 ? (
            <div className="img-slider image-slide owl-carousel nav-center">
              <Slider {...imgslideroption}>
                {carImages.map((image: string, imageIndex: number) => (
                  <div className="slide-images" key={`${car.id || index}-${imageIndex}`}>
                    <Link to={carLink}>
                      <ImageWithBasePath
                        src={image}
                        className="img-fluid"
                        alt={car.title || 'Car image'}
                        fallbackSrc={getCategoryFallbackSrc('cars')}
                      />
                    </Link>
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <Link to={carLink}>
              <ImageWithBasePath
                src={carImages[0] || car.image}
                className="img-fluid"
                alt={car.title || 'Car image'}
                fallbackSrc={getCategoryFallbackSrc('cars')}
              />
            </Link>
          )}
          <div className="fav-item" onClick={() => handleItemClick(index)}>
            {car.badge && (
              <span className="badge bg-info d-inline-flex align-items-center">
                <i className="isax isax-ranking me-1"></i>
                {car.badge}
              </span>
            )}
            <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`}>
              <i className="isax isax-heart5"></i>
            </Link>
          </div>
        </div>
        <div className="place-content">
          <div className="d-flex justify-content-between align-items-center flex-wrap row-gap-2 mb-3">
            <div className="">
              <div className="d-flex align-items-center mb-1">
                <h5 className="text-truncate border-end pe-2 me-2"><Link to={carLink}>{car.title}</Link></h5>
                <span className="badge badge-secondary badge-sm d-flex align-items-center">{car.type || 'Sedan'}</span>
              </div>
              <p className="d-flex align-items-center"><i className="isax isax-location5 me-2"></i>{car.location}</p>
            </div>
            <div className="d-flex align-items-center">
              <Link to="#" className="avatar avatar-sm flex-shrink-0">
                <ImageWithBasePath src="assets/img/users/user-08.jpg" className="rounded-circle" alt="img" />
              </Link>
              <div className="d-flex align-items-center border-start ps-2 ms-2">
                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-1">{car.rating}</span>
                <p className="fs-14">({car.reviewsCount || 0} Reviews)</p>
              </div>
            </div>
          </div>
          <p className="fs-14 mb-3">{carDescription}</p>
          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2 me-1">
            <div className="p-2 border rounded d-inline-flex align-items-center">
              <div className="d-flex flex-wrap border-end pe-2 me-2">
                <span className="fs-14 d-flex align-items-center text-gray-6 fw-normal text-nowrap me-1">
                  <i className="isax isax-gas-station me-1"></i>
                  Fuel :
                </span>
                <p className="fs-14 fw-medium">{car.fuel || 'Not provided'}</p>
              </div>
              <div className="d-flex flex-wrap border-end pe-2 me-2">
                <span className="fs-14 d-flex align-items-center text-gray-6 fw-normal text-nowrap me-1">
                  <i className="isax isax-kanban me-1"></i>
                  Gear :
                </span>
                <p className="fs-14 fw-medium">{car.gear || 'Not provided'}</p>
              </div>
              <div className="d-flex flex-wrap">
                <span className="fs-14 d-flex align-items-center text-gray-6 fw-normal text-nowrap me-1">
                  <i className="isax isax-routing-2 me-1"></i>
                  Travelled :
                </span>
                <p className="fs-14 fw-medium">{car.travelled || 'Not provided'}</p>
              </div>
            </div>
            <h5 className="text-primary text-md-end text-nowrap">${car.price} <span className="fs-14 text-gray-6 fw-normal">/ {car.priceUnit || 'day'}</span></h5>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Breadcrumb title="Car" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-03" />
      {/* Page Wrapper */}
      <div className="content">
        <div className="container">

          <CarSearch />



          <div className="row">

            <CarFilter />

            <div className="col-xl-9 col-lg-8">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <h6 className="mb-3">{loadingCars ? 'Loading cars...' : `${cars.length} Cars Found on Your Search`}</h6>
                <div className="d-flex align-items-center flex-wrap">
                  <div className="list-item d-flex align-items-center mb-3">
                    <Link to={routes.carGrid} className="list-icon me-2"><i className="isax isax-grid-1"></i></Link>
                    <Link to={routes.carList} className="list-icon active me-2"><i className="isax isax-firstline"></i></Link>
                    <Link to={routes.carMap} className="list-icon me-2"><i className="isax isax-map-1"></i></Link>
                  </div>
                  <div className="dropdown mb-3">
                    <Link to="#" className="dropdown-toggle py-2" data-bs-toggle="dropdown" >
                      <span className="fw-medium text-gray-9">Sort By : </span>Recommended
                    </Link>
                    <div className="dropdown-menu dropdown-sm">
                      <form>
                        <h6 className="fw-medium fs-16 mb-3">Sort By</h6>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend1" defaultChecked />
                          <label className="form-check-label ms-2" htmlFor="recommend1">Recommended</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend2" />
                          <label className="form-check-label ms-2" htmlFor="recommend2">Price: low to high</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend3" />
                          <label className="form-check-label ms-2" htmlFor="recommend3">Price: high to low</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend4" />
                          <label className="form-check-label ms-2" htmlFor="recommend4">Newest</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend5" />
                          <label className="form-check-label ms-2" htmlFor="recommend5">Ratings</label>
                        </div>
                        <div className="form-check d-flex align-items-center ps-0 mb-0">
                          <input className="form-check-input ms-0 mt-0" name="recommend" type="checkbox" id="recommend6" />
                          <label className="form-check-label ms-2" htmlFor="recommend6">Reviews</label>
                        </div>
                        <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                          <Link to="#" className="btn btn-light btn-sm me-2">Reset</Link>
                          <button type="button" className="btn btn-primary btn-sm">Apply</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-info br-10 p-3 pb-2 mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <p className="fs-14 fw-medium mb-2 d-inline-flex align-items-center"><i className="isax isax-info-circle me-2"></i>Save an average of 15% on thousands of hotels when you're signed in</p>
                  <Link to={routes.login} className="btn btn-white btn-sm mb-2">Sign In</Link>
                </div>
              </div>
              <div className="hotel-list">
                <div className="row justify-content-center">
                  <div className="col-md-12">
                    {loadingCars ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading cars from database...</p>
                      </div>
                    ) : cars.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-muted">No cars found in database.</p>
                      </div>
                    ) : (
                      cars.map(renderCarCard)
                    )}
                  </div>
                </div>
              </div>

              {/* Pagination */}
              <nav className="pagination-nav">
                <ul className="pagination justify-content-center">
                  <li className="page-item disabled">
                    <Link className="page-link" to="#" aria-label="Previous">
                      <span aria-hidden="true"><i className="fa-solid fa-chevron-left"></i></span>
                    </Link>
                  </li>
                  <li className="page-item"><Link className="page-link" to="#">1</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">2</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">3</Link></li>
                  <li className="page-item active"><Link className="page-link" to="#">4</Link></li>
                  <li className="page-item"><Link className="page-link" to="#">5</Link></li>
                  <li className="page-item">
                    <Link className="page-link" to="#" aria-label="Next">
                      <span aria-hidden="true"><i className="fa-solid fa-chevron-right"></i></span>
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

export default CarList;