import { useState, useEffect } from 'react'
import { fetchTours } from '../../../core/services/firebaseServices';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb'
import FliterSidebar from './fliterSidebar';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import TourSearch from '../tourSearch';

const TourGrid = () => {
    const [tours, setTours] = useState<any[]>([]);
    const [loadingTours, setLoadingTours] = useState(true);

    useEffect(() => {
        const getTours = async () => {
            try {
                const data = await fetchTours();
                setTours(data);
            } catch (error) {
                console.error("Error loading tours:", error);
            } finally {
                setLoadingTours(false);
            }
        };
        getTours();
    }, []);

    const routes = all_routes;

    //Breadcrumb Data
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
            label: 'TourGrid',
            active: true,
        },
    ];

    //ImageSlider
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
            {
                breakpoint: 1400,
                settings: {
                    slidesToShow: 1,
                },
            },
            {
                breakpoint: 1300,
                settings: {
                    slidesToShow: 1,
                },
            },
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 1,
                },
            },
            {
                breakpoint: 576,
                settings: {
                    slidesToShow: 1,
                },
            },
            {
                breakpoint: 0,
                settings: {
                    slidesToShow: 1,
                },
            },
        ],
    };


    const [selectedItems, setSelectedItems] = useState(Array(10).fill(false));
    const handleItemClick = (index: number) => {
        setSelectedItems((prevSelectedItems) => {
            const updatedSelectedItems = [...prevSelectedItems];
            updatedSelectedItems[index] = !updatedSelectedItems[index];
            return updatedSelectedItems;
        });
    };

    return (
        <div>
            <Breadcrumb
                title="Tours"
                breadcrumbs={breadcrumbs}
                backgroundClass="breadcrumb-bg-02"
            />

            <>
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
                            <div className="col-xl-3 col-lg-4 theiaStickySidebar">
                                <FliterSidebar />
                            </div>
                            {/* /Sidebar */}
                            <div className="col-xl-9 col-lg-8 theiaStickySidebar">
                                <div className="d-flex align-items-center justify-content-between flex-wrap">
                                    <h6 className="mb-3">1920 Tours Found on Your Search</h6>
                                    <div className="d-flex align-items-center flex-wrap">
                                        <div className="list-item d-flex align-items-center mb-3">
                                            <Link to={routes.tourGrid} className="list-icon active me-2">
                                                <i className="isax isax-grid-1" />
                                            </Link>
                                            <Link to={routes.tourList} className="list-icon me-2">
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
                                                <form action={routes.tourGrid}>
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
                                <div className="row justify-content-center">
                                    {/* Tours Grid */}
                                    {loadingTours ? (
                                        <div className="text-center py-5 w-100">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <p className="mt-2 text-muted">Loading tours from database...</p>
                                        </div>
                                    ) : tours.length === 0 ? (
                                        <div className="text-center py-5 w-100">
                                            <p className="text-muted">No tours found in database.</p>
                                        </div>
                                    ) : (
                                        tours.map((tour, index) => (
                                            <div className="col-xxl-4 col-md-6 d-flex" key={tour.id || index}>
                                                <div className="place-item common-grid-slider mb-4 flex-fill">
                                                    <div className="place-img">
                                                        <div className="img-slider image-slide owl-carousel nav-center">
                                                            <Slider {...imgslideroption}>
                                                                <div className="slide-images">
                                                                    <Link to={`${routes.tourDetails}?id=${tour.id}`}>
                                                                        <ImageWithBasePath
                                                                            src={tour.image}
                                                                            className="img-fluid"
                                                                            alt={tour.title || "Tour image"}
                                                                            fallbackSrc={getCategoryFallbackSrc("tours")}
                                                                        />
                                                                    </Link>
                                                                </div>
                                                            </Slider>
                                                        </div>
                                                        <div className="fav-item" key={index} onClick={() => handleItemClick(index)}>
                                                            <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`}>
                                                                    <i className="isax isax-heart5" />
                                                            </Link>
                                                            {tour.trending && (
                                                                <span className="badge bg-info d-inline-flex align-items-center">
                                                                    <i className="isax isax-ranking me-1" />
                                                                    Trending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="place-content">
                                                        <div className="d-flex align-items-center justify-content-between mb-1">
                                                            <div className="d-flex flex-wrap align-items-center">
                                                                <span className="me-1">
                                                                    <i className="ti ti-receipt text-primary" />
                                                                </span>
                                                                <p className="fs-14 text-gray-9">{tour.type}</p>
                                                            </div>
                                                            <span className="d-inline-block border vertical-splits">
                                                                <span className="bglight text-light d-flex align-items-center justify-content-center" />
                                                            </span>
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-1">
                                                                    {tour.rating}
                                                                </span>
                                                                <p className="fs-14">({tour.reviewsCount} Reviews)</p>
                                                            </div>
                                                        </div>
                                                        <h5 className="mb-1 text-truncate">
                                                            <Link to={`${routes.tourDetails}?id=${tour.id}`}>{tour.title}</Link>
                                                        </h5>
                                                        <p className="d-flex align-items-center mb-3">
                                                            <i className="isax isax-location5 me-2" />
                                                            {tour.location}
                                                        </p>
                                                        <div className="mb-3">
                                                            <h6 className="d-flex align-items-center text-gray-6 fs-14 fw-normal">
                                                                Starts From{" "}
                                                                <span className="ms-1 fs-18 fw-semibold text-primary">
                                                                    ${tour.price}
                                                                </span>
                                                                {tour.oldPrice && (
                                                                    <span className="ms-1 fs-18 fw-semibold text-gray-3 text-decoration-line-through">
                                                                        ${tour.oldPrice}
                                                                    </span>
                                                                )}
                                                            </h6>
                                                        </div>
                                                        <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                                            <div className="d-flex flex-wrap align-items-center me-2">
                                                                <span className="me-1">
                                                                    <i className="isax isax-calendar-tick text-gray-6" />
                                                                </span>
                                                                <p className="fs-14 text-gray-9">{tour.duration}</p>
                                                            </div>
                                                            <Link to={`${routes.tourDetails}?id=${tour.id}`} className="btn btn-outline-primary btn-sm">
                                                                Book Now
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {/* /Tours Grid */}
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
            </>

        </div>

    )
}

export default TourGrid
