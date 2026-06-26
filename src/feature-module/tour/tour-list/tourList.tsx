import { useEffect, useState } from 'react'
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import FliterSidebar from './fliterSidebar';
import { all_routes } from '../../router/all_routes';
import TourSearch from '../tourSearch';
import { fetchTours } from '../../../core/services/firebaseServices';

type TourRecord = Record<string, any>;

const TourList = () => {
    const routes = all_routes;
    const [tours, setTours] = useState<TourRecord[]>([]);
    const [loadingTours, setLoadingTours] = useState(true);
    const [selectedItems, setSelectedItems] = useState<boolean[]>([]);

    useEffect(() => {
        const getTours = async () => {
            try {
                const data = await fetchTours();
                setTours(data.filter((tour) => tour.published !== false));
            } catch (error) {
                console.error('Error loading tours:', error);
            } finally {
                setLoadingTours(false);
            }
        };
        getTours();
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
            label: 'Tours',
            link: routes.allService1,
            active: false,
        },
        {
            label: 'Tours',
            active: true,
        },
        {
            label: 'TourList',
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

    const buildTourDetailsLink = (tourId: string) => `${routes.tourDetails}?id=${tourId}`;

    const getTourImages = (tour: TourRecord) => {
        const gallery = Array.isArray(tour.gallery) ? tour.gallery.filter(Boolean) : [];
        const primary = tour.image || gallery[0];
        return gallery.length > 0 ? gallery : primary ? [primary] : [];
    };

    const renderTourCard = (tour: TourRecord, index: number) => {
        const tourImages = getTourImages(tour);
        const tourLink = buildTourDetailsLink(tour.id);
        const tourDescription =
            tour.description ||
            tour.details ||
            'Explore this admin-managed tour listing with up-to-date pricing, images, and location details.';
        const tourType = tour.type || tour.category || tour.listingCategory || 'Tour';
        const tourDuration = tour.duration || '';
        const guests = tour.guests || tour.groupSize || '';

        return (
            <div className="place-item mb-4" key={tour.id || index}>
                <div className="place-img">
                    {tourImages.length > 1 ? (
                        <div className="img-slider image-slide owl-carousel nav-center">
                            <Slider {...imgslideroption}>
                                {tourImages.map((image: string, imageIndex: number) => (
                                    <div className="slide-images" key={`${tour.id || index}-${imageIndex}`}>
                                        <Link to={tourLink}>
                                            <ImageWithBasePath
                                                src={image}
                                                className="img-fluid"
                                                alt={tour.title || 'Tour image'}
                                                fallbackSrc={getCategoryFallbackSrc('tours')}
                                            />
                                        </Link>
                                    </div>
                                ))}
                            </Slider>
                        </div>
                    ) : (
                        <Link to={tourLink}>
                            <ImageWithBasePath
                                src={tourImages[0] || tour.image}
                                className="img-fluid"
                                alt={tour.title || 'Tour image'}
                                fallbackSrc={getCategoryFallbackSrc('tours')}
                            />
                        </Link>
                    )}
                    <div className="fav-item" onClick={() => handleItemClick(index)}>
                        <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`}>
                            <i className="isax isax-heart5" />
                        </Link>
                        <span className="badge bg-info d-inline-flex align-items-center">
                            <i className="isax isax-ranking me-1" />
                            Trending
                        </span>
                    </div>
                </div>
                <div className="place-content">
                    <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2 mb-3">
                        <div>
                            <h5 className="mb-1 text-truncate">
                                <Link to={tourLink}>{tour.title}</Link>
                            </h5>
                            <p className="fs-14 d-flex align-items-center">
                                <i className="isax isax-location5 me-2" />
                                {tour.location}
                            </p>
                        </div>
                        <div className="d-flex align-items-center">
                            <p className="fs-14 text-gray-9 border-end pe-2 me-2 mb-0">
                                <span className="me-1">
                                    <i className="ti ti-receipt text-primary" />
                                </span>
                                {tourType}
                            </p>
                            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-1">
                                {tour.rating}
                            </span>
                            <p className="fs-14">({tour.reviewsCount || 0} Reviews)</p>
                        </div>
                    </div>
                    <p className="fs-14 border-bottom pb-3 mb-3">{tourDescription}</p>
                    <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                        <div className="d-flex align-items-center">
                            {tourDuration && (
                                <>
                                    <span className="me-2">
                                        <i className="isax isax-calendar-tick text-gray-6" />
                                    </span>
                                    <p className="fs-14 text-gray-9 border-end pe-2 me-2 mb-0">{tourDuration}</p>
                                </>
                            )}
                            {guests && (
                                <p className="fs-14 text-gray-9 mb-0 text-truncate d-flex align-items-center">
                                    <i className="isax isax-profile-2user me-1" />
                                    {guests} Guests
                                </p>
                            )}
                        </div>
                        <div className="d-flex align-items-center">
                            <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal border-end pe-2 me-2">
                                Starts From
                                <span className="ms-1 fs-18 fw-semibold text-primary">${tour.price}</span>
                                {tour.oldPrice && (
                                    <span className="ms-1 fs-18 fw-semibold text-gray-3 text-decoration-line-through">${tour.oldPrice}</span>
                                )}
                            </h6>
                            <Link to="#" className="avatar avatar-sm flex-shrink-0">
                                <ImageWithBasePath
                                    src="assets/img/users/user-08.jpg"
                                    className="rounded-circle"
                                    alt="img"
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <Breadcrumb
                title="Tours"
                breadcrumbs={breadcrumbs}
                backgroundClass="breadcrumb-bg-02"
            />


            {/* Page Wrapper */}
            <div className="content">
                <div className="container">
                    {/* Tour Search */}
                    <TourSearch/>
                    {/* /Tour Search */}
                    {/* Tour Types */}
                    <div className="mb-2">
                        <div className="mb-3">
                            <h5 className="mb-2">Choose type of Tours you are interested</h5>
                        </div>
                        <div className="row">
                            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                                <div className="d-flex align-items-center hotel-type-item mb-3">
                                    <Link to={routes.tourGrid} className="avatar avatar-lg">
                                        <ImageWithBasePath
                                            src="assets/img/tours/tours-01.jpg"
                                            className="rounded-circle"
                                            alt="img"
                                        />
                                    </Link>
                                    <div className="ms-2">
                                        <h6 className="fs-16 fw-medium">
                                            <Link to={routes.tourGrid}>Ecotourism</Link>
                                        </h6>
                                        <p className="fs-14">216 Hotels</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                                <div className="d-flex align-items-center hotel-type-item mb-3">
                                    <Link to={routes.tourGrid} className="avatar avatar-lg">
                                        <ImageWithBasePath
                                            src="assets/img/tours/tours-02.jpg"
                                            className="rounded-circle"
                                            alt="img"
                                        />
                                    </Link>
                                    <div className="ms-2">
                                        <h6 className="fs-16 fw-medium">
                                            <Link to={routes.tourGrid}>Adventure Tour</Link>
                                        </h6>
                                        <p className="fs-14">569 tours</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                                <div className="d-flex align-items-center hotel-type-item mb-3">
                                    <Link to={routes.tourGrid} className="avatar avatar-lg">
                                        <ImageWithBasePath
                                            src="assets/img/tours/tours-03.jpg"
                                            className="rounded-circle"
                                            alt="img"
                                        />
                                    </Link>
                                    <div className="ms-2">
                                        <h6 className="fs-16 fw-medium">
                                            <Link to={routes.tourGrid}>Group Tours</Link>
                                        </h6>
                                        <p className="fs-14">129 tours</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                                <div className="d-flex align-items-center hotel-type-item mb-3">
                                    <Link to={routes.tourGrid} className="avatar avatar-lg">
                                        <ImageWithBasePath
                                            src="assets/img/tours/tours-04.jpg"
                                            className="rounded-circle"
                                            alt="img"
                                        />
                                    </Link>
                                    <div className="ms-2">
                                        <h6 className="fs-16 fw-medium">
                                            <Link to={routes.tourGrid}>Beach Tours</Link>
                                        </h6>
                                        <p className="fs-14">600 tours</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                                <div className="d-flex align-items-center hotel-type-item mb-3">
                                    <Link to={routes.tourGrid} className="avatar avatar-lg">
                                        <ImageWithBasePath
                                            src="assets/img/tours/tours-05.jpg"
                                            className="rounded-circle"
                                            alt="img"
                                        />
                                    </Link>
                                    <div className="ms-2">
                                        <h6 className="fs-16 fw-medium">
                                            <Link to={routes.tourGrid}>Historical Tours</Link>
                                        </h6>
                                        <p className="fs-14">200 tours</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xxl-2 col-lg-3 col-md-4 col-sm-6">
                                <div className="d-flex align-items-center hotel-type-item mb-3">
                                    <Link to={routes.tourGrid} className="avatar avatar-lg">
                                        <ImageWithBasePath
                                            src="assets/img/tours/tours-06.jpg"
                                            className="rounded-circle"
                                            alt="img"
                                        />
                                    </Link>
                                    <div className="ms-2">
                                        <h6 className="fs-16 fw-medium">
                                            <Link to={routes.tourGrid}>Summer Trip</Link>
                                        </h6>
                                        <p className="fs-14">200 tours</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /Tour Types */}
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-xl-3 col-lg-3 theiaStickySidebar">
                            <FliterSidebar />
                        </div>
                        {/* /Sidebar */}
                        <div className="col-xl-9 col-lg-9">
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="mb-3">{loadingTours ? 'Loading tours...' : `${tours.length} Tours Found on Your Search`}</h6>
                                <div className="d-flex align-items-center flex-wrap">
                                    <div className="list-item d-flex align-items-center mb-3">
                                        <Link to={routes.tourGrid} className="list-icon me-2">
                                            <i className="isax isax-grid-1" />
                                        </Link>
                                        <Link to={routes.tourList} className="list-icon active me-2">
                                            <i className="isax isax-firstline" />
                                        </Link>
                                        <Link to={routes.tourMap} className="list-icon me-2">
                                            <i className="isax isax-map-1" />
                                        </Link>
                                    </div>
                                    <div className="dropdown mb-3">
                                        <Link
                                            to="#"
                                            className="dropdown-toggle py-2"
                                            data-bs-toggle="dropdown"

                                        >
                                            <span className="fw-medium text-gray-9">Sort By : </span>
                                            Recommended
                                        </Link>
                                        <div className="dropdown-menu dropdown-sm">
                                            <form action={routes.tourList}>
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
                                                    <Link
                                                        to="#"
                                                        className="btn btn-light btn-sm me-2"
                                                    >
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
                                        Save an average of 15% on thousands of hotels when you're signed
                                        in
                                    </p>
                                    <Link to={routes.login} className="btn btn-white btn-sm mb-2">
                                        Sign In
                                    </Link>
                                </div>
                            </div>
                            <div className="hotel-list">
                                <div className="row justify-content-center">
                                    <div className="col-md-12">
                                        {loadingTours ? (
                                            <div className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                                <p className="mt-2 text-muted">Loading tours from database...</p>
                                            </div>
                                        ) : tours.length === 0 ? (
                                            <div className="text-center py-5">
                                                <p className="text-muted">No tours found in database.</p>
                                            </div>
                                        ) : (
                                            tours.map(renderTourCard)
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pagination */}
                            <nav className="pagination-nav">
                                <ul className="pagination justify-content-center">
                                    <li className="page-item disabled">
                                        <Link
                                            className="page-link"
                                            to="#"
                                            aria-label="Previous"
                                        >
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
                                        <Link
                                            className="page-link"
                                            to="#"
                                            aria-label="Next"
                                        >
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
        </div>

    )
}

export default TourList;