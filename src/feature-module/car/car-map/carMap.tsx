import { useEffect, useMemo, useState } from 'react';
import {
    GoogleMap,
    Marker,
    InfoWindow,
    useLoadScript,
} from '@react-google-maps/api';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { all_routes } from '../../router/all_routes';
import CarSearch from '../carSearch';
import CarFilterModal from '../../../core/common/modal/carFilterModal';
import { fetchCars } from '../../../core/services/firebaseServices';

type CarRecord = Record<string, any>;

type CarMapMarker = CarRecord & {
    lat: number;
    lng: number;
};

const containerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 53.470692,
    lng: -2.220328,
};

const markerOffsets = [
    { lat: 0, lng: 0 },
    { lat: -0.0021, lng: 0.0042 },
    { lat: -0.0042, lng: 0.0104 },
    { lat: 0.0035, lng: -0.0063 },
    { lat: 0.0056, lng: 0.0074 },
    { lat: -0.0068, lng: -0.0041 },
];

const CarMap = () => {
    const routes = all_routes;
    const [cars, setCars] = useState<CarRecord[]>([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [selectedItems, setSelectedItems] = useState<boolean[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<CarMapMarker | null>(null);

    const handleItemClick = (index: number) => {
        setSelectedItems((prevSelectedItems) => {
            const updatedSelectedItems = [...prevSelectedItems];
            updatedSelectedItems[index] = !updatedSelectedItems[index];
            return updatedSelectedItems;
        });
    };

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

    const carMarkers = useMemo<CarMapMarker[]>(
        () =>
            cars.map((car, index) => {
                const fallbackOffset = markerOffsets[index % markerOffsets.length];
                return {
                    ...car,
                    lat: Number(car.lat ?? car.latitude ?? defaultCenter.lat + fallbackOffset.lat),
                    lng: Number(car.lng ?? car.longitude ?? defaultCenter.lng + fallbackOffset.lng),
                };
            }),
        [cars],
    );

    useEffect(() => {
        if (!selectedMarker && carMarkers.length > 0) {
            setSelectedMarker(carMarkers[0]);
        }
    }, [carMarkers, selectedMarker]);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: 'AIzaSyD6adZVdzTvBpE2yBRK8cDfsss8QXChK0I',
    });

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
            label: 'Car Map',
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

    const renderCarCard = (car: CarMapMarker, index: number) => {
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

    if (!isLoaded) return <div>Loading Map...</div>;

    return (
        <>
            <Breadcrumb title="Car" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-03" />
            {/* Page Wrapper */}
            <div className="content pb-0">
                <div className="map-content">

                    <CarSearch />

                    <div className="d-flex align-items-center justify-content-between flex-wrap recommend-wrap mb-2">
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="dropdown mb-3">
                                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="modal" data-bs-target="#filter_modal">
                                    <i className="isax isax-filter-add me-1"></i> Filters
                                </Link>
                            </div>
                            <div className="dropdown mb-3">
                                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="dropdown" >
                                    Pricing
                                </Link>
                                <div className="dropdown-menu dropdown-sm">
                                    <form >
                                        <h6 className="fw-medium fs-16 mb-3">Pricing</h6>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="pricing1" type="checkbox" id="pricing1" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing1">
                                                $50 - $100
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="pricing2" type="checkbox" id="pricing2" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing2">
                                                $100 - $1000
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="pricing3" type="checkbox" id="pricing3" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing3">
                                                $1000 - $5000
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-0">
                                            <input className="form-check-input ms-0 mt-0" name="pricing4" type="checkbox" id="pricing4" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing4">
                                                $10000 - $2000
                                            </label>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                                            <Link to="#" className="btn btn-light btn-sm me-2">Reset</Link>
                                            <button type="button" className="btn btn-primary btn-sm">Apply</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="dropdown mb-3">
                                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="dropdown" >
                                    Car Types
                                </Link>
                                <div className="dropdown-menu dropdown-sm">
                                    <form >
                                        <h6 className="fw-medium fs-16 mb-3">Types</h6>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review1" type="checkbox" id="review1" />
                                            <label className="form-check-label ms-2" htmlFor="review1">
                                                Sedan
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review2" type="checkbox" id="review2" />
                                            <label className="form-check-label ms-2" htmlFor="review2">
                                                EV
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review3" type="checkbox" id="review3" />
                                            <label className="form-check-label ms-2" htmlFor="review3">
                                                Crossover
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review4" type="checkbox" id="review4" />
                                            <label className="form-check-label ms-2" htmlFor="review4">
                                                Sports
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review5" type="checkbox" id="review5" />
                                            <label className="form-check-label ms-2" htmlFor="review5">
                                                Van
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review6" type="checkbox" id="review6" />
                                            <label className="form-check-label ms-2" htmlFor="review6">
                                                Wagon
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-0">
                                            <input className="form-check-input ms-0 mt-0" name="review7" type="checkbox" id="review7" />
                                            <label className="form-check-label ms-2" htmlFor="review7">
                                                SUV
                                            </label>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                                            <Link to="#" className="btn btn-light btn-sm me-2">Reset</Link>
                                            <button type="button" className="btn btn-primary btn-sm">Apply</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="dropdown mb-3">
                                <Link to="#" className="dropdown-toggle btn btn-white btn-sm border rounded" data-bs-toggle="dropdown" >
                                    Car Brands
                                </Link>
                                <div className="dropdown-menu dropdown-sm">
                                    <form >
                                        <h6 className="fw-medium fs-16 mb-3">Car Brands</h6>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review01" type="checkbox" id="review01" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="review01">
                                                Toyota
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review02" type="checkbox" id="review02" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="review02">
                                                Ford
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review03" type="checkbox" id="review03" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="review03">
                                                Honda
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review04" type="checkbox" id="review04" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="review04">
                                                BMW
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review05" type="checkbox" id="review05" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="review05">
                                                Mercedes-Benz
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="review06" type="checkbox" id="review06" />
                                            <label className="form-check-label ms-2" htmlFor="review06">
                                                Tesla
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-0">
                                            <input className="form-check-input ms-0 mt-0" name="review07" type="checkbox" id="review07" />
                                            <label className="form-check-label ms-2" htmlFor="review07">
                                                Audi
                                            </label>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-end border-top pt-3 mt-3">
                                            <Link to="#" className="btn btn-light btn-sm me-2">Reset</Link>
                                            <button type="button" className="btn btn-primary btn-sm">Apply</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex align-items-center flex-wrap">
                            <div className="input-icon mb-3 me-3">
                                <span className="input-icon-addon">
                                    <i className="isax isax-search-normal"></i>
                                </span>
                                <input type="text" className="form-control" placeholder="Search by Car Name" />
                            </div>
                            <div className="list-item d-flex align-items-center mb-3">
                                <Link to={routes.carGrid} className="list-icon me-2"><i className="isax isax-grid-1"></i></Link>
                                <Link to={routes.carList} className="list-icon me-2"><i className="isax isax-firstline"></i></Link>
                                <Link to={routes.carMap} className="list-icon active  me-2"><i className="isax isax-map-1"></i></Link>
                            </div>
                            <div className="dropdown mb-3">
                                <Link to="#" className="dropdown-toggle py-2" data-bs-toggle="dropdown" >
                                    <span className="fw-medium text-gray-9">Sort By : </span>Recommended
                                </Link>
                                <div className="dropdown-menu dropdown-sm">
                                    <form>
                                        <h6 className="fw-medium fs-16 mb-3">Pricing</h6>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="pricing01" type="checkbox" id="pricing01" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing01">
                                                $50 - $100
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="pricing02" type="checkbox" id="pricing02" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing02">
                                                $100 - $1000
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-2">
                                            <input className="form-check-input ms-0 mt-0" name="pricing03" type="checkbox" id="pricing03" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing03">
                                                $1000 - $5000
                                            </label>
                                        </div>
                                        <div className="form-check d-flex align-items-center ps-0 mb-0">
                                            <input className="form-check-input ms-0 mt-0" name="pricing04" type="checkbox" id="pricing04" defaultChecked />
                                            <label className="form-check-label ms-2" htmlFor="pricing04">
                                                $10000 - $2000
                                            </label>
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
                </div>
                <div className="row">
                    <div className="col-xl-8">
                        <div className="map-lists-widget border-top">
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="mb-4">{loadingCars ? 'Loading cars...' : `${carMarkers.length} Cars Found on Your Search`}</h6>
                                <div className="list-item d-flex align-items-center shadow-md bg-white rounded-3 p-2 mb-4">
                                    <Link to={routes.carGrid} className="list-icon me-2"><i className="isax isax-grid-1"></i></Link>
                                    <Link to={routes.carList} className="list-icon active"><i className="isax isax-firstline"></i></Link>
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
                                        ) : carMarkers.length === 0 ? (
                                            <div className="text-center py-5">
                                                <p className="text-muted">No cars found in database.</p>
                                            </div>
                                        ) : (
                                            carMarkers.map(renderCarCard)
                                        )}
                                    </div>

                                </div>

                            </div>
                            <div className="text-center">
                                <Link to="#" className="btn btn-primary">Load More</Link>
                            </div>
                        </div>
                    </div>
                    {/* Map */}
                    <div className="col-xl-4 map-right grid-map">
                        <div id="map" className="map-listing">
                            <GoogleMap
                                mapContainerStyle={containerStyle}
                                center={selectedMarker ? { lat: selectedMarker.lat, lng: selectedMarker.lng } : defaultCenter}
                                zoom={14}
                                options={{
                                    scrollwheel: false,
                                    mapTypeId: 'roadmap',
                                }}
                            >
                                {carMarkers.map((car) => (
                                    <Marker
                                        key={car.id}
                                        position={{ lat: car.lat, lng: car.lng }}
                                        onClick={() => setSelectedMarker(car)}
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
                                                    <Link to={buildCarDetailsLink(selectedMarker.id)} className="property-img">
                                                        <ImageWithBasePath
                                                            className="img-fluid w-100"
                                                            alt={selectedMarker.title || 'Car image'}
                                                            src={selectedMarker.image || getCarImages(selectedMarker)[0]}
                                                            fallbackSrc={getCategoryFallbackSrc('cars')}
                                                        />
                                                    </Link>
                                                </div>
                                                <div className="card-body">
                                                    <h5 className="title mb-2">
                                                        <Link to={buildCarDetailsLink(selectedMarker.id)} tabIndex={-1}>
                                                            {selectedMarker.title}
                                                        </Link>
                                                    </h5>
                                                    <p className="mb-3">
                                                        <i className="isax isax-location"></i>{' '}
                                                        {selectedMarker.location}
                                                    </p>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center">
                                                            <h4 className="text-primary border-end pe-2 me-2">
                                                                ${selectedMarker.price}
                                                            </h4>
                                                            <p>/ day</p>
                                                        </div>
                                                        <span className="badge badge-warning text-dark">
                                                            {selectedMarker.rating}
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

            <CarFilterModal />
        </>
    )
}

export default CarMap;