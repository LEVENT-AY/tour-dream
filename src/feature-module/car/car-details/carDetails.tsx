import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Reviews from '../../../core/common/reviews/reviews';
import { all_routes } from '../../router/all_routes';
import { fetchCarById } from '../../../core/services/firebaseServices';
import CarInfo from './carInfo';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { isPublicListing, normalizeCarDetails } from '../../../core/services/listingDetailModels';

const fallbackCar = {
  id: 'car-demo',
  title: 'Audi A3 2019',
  name: 'Audi A3 2019',
  type: 'Sedan',
  location: 'Ciutat Vella, Barcelona',
  price: 500,
  priceUnit: 'day',
  rating: 4.5,
  reviewsCount: 500,
  image: 'assets/img/cars/car-large-01.jpg',
  gallery: [
    'assets/img/cars/car-large-01.jpg',
    'assets/img/cars/car-large-02.jpg',
    'assets/img/cars/car-large-03.jpg',
    'assets/img/cars/car-large-04.jpg',
    'assets/img/cars/car-large-05.jpg',
    'assets/img/cars/car-large-06.jpg',
  ],
  description: 'Car details are shown here when no Firestore id is provided.',
  published: false,
};

const CarDetails = () => {
  const routes = all_routes;
  const [searchParams] = useSearchParams();
  const carId = searchParams.get('id');
  const [carData, setCarData] = useState<any | null>(null);
  const [loading, setLoading] = useState(Boolean(carId));
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCar = async () => {
      if (!carId) {
        setLoading(false);
        setNotFound(false);
        setCarData(null);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchCarById(carId);
        if (!active) return;

        if (data && isPublicListing(data)) {
          setCarData(data);
          setNotFound(false);
        } else {
          setCarData(null);
          setNotFound(true);
        }
      } catch (error) {
        if (active) {
          setCarData(null);
          setNotFound(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCar();

    return () => {
      active = false;
    };
  }, [carId]);

  const displayCar: any = carData ? normalizeCarDetails(carData) : fallbackCar;
  const galleryImages = (displayCar.gallery?.length ? displayCar.gallery : [displayCar.image]).filter(Boolean);
  const heroImage = galleryImages[0] || getCategoryFallbackSrc('cars');

  if (carId && loading) {
    return (
      <div className="content">
        <div className="container">
          <div className="text-center py-5">Loading car listing...</div>
        </div>
      </div>
    );
  }

  if (carId && !loading && notFound) {
    return (
      <div className="content">
        <div className="container">
          <div className="alert alert-warning mb-0">
            The selected car listing could not be found or is not published yet.
          </div>
          <div className="mt-3">
            <Link to={routes.carGrid} className="btn btn-primary">
              Back to Cars
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const detailItems = [
    { label: 'Type', value: displayCar.type || 'Sedan' },
    { label: 'Fuel', value: displayCar.fuel || 'Not provided' },
    { label: 'Gear', value: displayCar.gear || 'Not provided' },
    { label: 'Travelled', value: displayCar.travelled || 'Not provided' },
    { label: 'Brand', value: displayCar.brand || 'Not provided' },
    { label: 'Model', value: displayCar.model || 'Not provided' },
  ];

  return (
    <div>
      <Breadcrumb title={displayCar.title || displayCar.name || 'Car'} breadcrumbs={[
        { label: 'Car', link: routes.allService1, active: false },
        { label: 'Car', active: false },
        { label: 'Car Details', active: true },
      ]} backgroundClass="breadcrumb-bg-03" />

      <div className="card-top-head">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
            <div>
              <div className="d-flex align-items-center mb-2 flex-wrap">
                <h4 className="d-flex align-items-center flex-wrap fw-bold mb-0">{displayCar.title || displayCar.name}</h4>
                <div className="d-flex align-items-center ms-2">
                  <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{displayCar.rating ?? 0}</span>
                  <p className="fs-14 mb-0">({displayCar.reviewsCount ?? 0} Reviews)</p>
                </div>
              </div>
              <div className="d-flex align-items-center flex-wrap row-gap-2">
                <p className="fs-14 mb-0 me-3 pe-3 border-end d-inline-flex align-items-center">
                  <span><i className="isax isax-smart-car text-primary me-2"></i></span>{displayCar.type || 'Sedan'}
                </p>
                <p className="fs-14 mb-0 me-3 pe-3 border-end">
                  <i className="isax isax-location5 me-2"></i>{displayCar.location || 'Location unavailable'}
                </p>
                {displayCar.badge ? <span className="badge bg-info text-capitalize">{displayCar.badge}</span> : null}
              </div>
            </div>
            <div className="text-end">
              <p className="fs-13 fw-medium mb-1">Starts From</p>
              <h5 className="text-primary mb-0">
                ${displayCar.price ?? 0} <span className="fs-14 text-default fw-normal">/ {displayCar.priceUnit || 'day'}</span>
              </h5>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="container">
          <div className="row">
            <div className="col-xl-8">
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <ImageWithBasePath
                    src={heroImage}
                    className="img-fluid rounded mb-3"
                    alt={displayCar.title || 'Car'}
                    fallbackSrc={getCategoryFallbackSrc('cars')}
                  />
                  <div className="row g-3">
                    {galleryImages.slice(1, 4).map((image: string, index: number) => (
                      <div className="col-md-4" key={`${image}-${index}`}>
                        <ImageWithBasePath
                          src={image}
                          className="img-fluid rounded"
                          alt={`${displayCar.title || 'Car'} ${index + 2}`}
                          fallbackSrc={getCategoryFallbackSrc('cars')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Description</h5>
                <p className="mb-0">
                  {displayCar.description || 'Car details will appear here when the selected Firestore listing includes a description.'}
                </p>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Car Specifications</h5>
                <div className="row gy-3">
                  {detailItems.map((item) => (
                    <div className="col-md-6 col-lg-4" key={item.label}>
                      <div className="p-3 rounded border bg-white h-100">
                        <p className="text-muted fs-13 mb-1">{item.label}</p>
                        <h6 className="mb-0">{item.value}</h6>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Gallery</h5>
                <div className="row g-3">
                  {galleryImages.map((image: string, index: number) => (
                    <div className="col-md-4" key={`${image}-gallery-${index}`}>
                      <ImageWithBasePath
                        src={image}
                        className="img-fluid rounded"
                        alt={`Gallery ${index + 1}`}
                        fallbackSrc={getCategoryFallbackSrc('cars')}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-light-200 card-bg-light mb-4">
                <h5 className="fs-18 mb-3">Frequently Asked Questions</h5>
                <div className="accordion faq-accordion" id="accordionCarFaq">
                  <div className="accordion-item show mb-2">
                    <div className="accordion-header">
                      <button className="accordion-button fw-medium" type="button" data-bs-toggle="collapse" data-bs-target="#car-faq-one" aria-controls="car-faq-one">
                        What documents do I need to book this car?
                      </button>
                    </div>
                    <div id="car-faq-one" className="accordion-collapse collapse show" data-bs-parent="#accordionCarFaq">
                      <div className="accordion-body">
                        <p className="mb-0">This car details page now uses neutral, car-specific FAQ copy instead of unrelated demo content.</p>
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item mb-2">
                    <div className="accordion-header">
                      <button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#car-faq-two" aria-controls="car-faq-two">
                        Are pickup and drop-off locations flexible?
                      </button>
                    </div>
                    <div id="car-faq-two" className="accordion-collapse collapse" data-bs-parent="#accordionCarFaq">
                      <div className="accordion-body">
                        <p className="mb-0">When Firestore data is available, the page displays the selected car's own location and pricing information.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Reviews />
            </div>

            <div className="col-xl-4">
              <CarInfo car={displayCar} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
