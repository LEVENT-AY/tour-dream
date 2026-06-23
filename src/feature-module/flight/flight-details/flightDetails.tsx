import React, { useEffect, useRef, useState } from 'react'
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { all_routes } from '../../router/all_routes';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import CustomSelect from '../../../core/common/commonSelect';
import { PreferredClass } from '../../../core/common/selectOption/json/selectOption';
import BannerCounter from '../../../core/common/banner-counter/counter';
import dayjs from 'dayjs';
import { DatePicker } from 'antd';
import Lightbox from "yet-another-react-lightbox";
import Reviews from '../../../core/common/reviews/reviews';
import { fetchFlightById, fetchFlights } from '../../../core/services/firebaseServices';

type FlightDetailsView = {
    id: string;
    title: string;
    badge: string;
    airline: string;
    stopInfo: string;
    departureCity: string;
    arrivalCity: string;
    routeLabel: string;
    location: string;
    dates: string;
    departureDateLabel: string;
    rating: string;
    reviewsLabel: string;
    reviewsCount: number;
    price: number;
    seatsLabel: string;
    priceLabel: string;
    description: string;
    mainImage: string;
    galleryImages: string[];
    mapRouteLabel: string;
    fromAirportLabel: string;
    toAirportLabel: string;
    published: boolean;
    featured: boolean;
};

const fallbackFlightDetails: FlightDetailsView = {
    id: "fallback-flight-details",
    title: "Antonov An-32",
    badge: "Cheapest",
    airline: "Air India",
    stopInfo: "1-stop at Dubai",
    departureCity: "Newyork",
    arrivalCity: "Sydney",
    routeLabel: "Newyork - Sydney",
    location: "15,Adri Street,Ciutat Vella,Barcelona",
    dates: "Flexible dates",
    departureDateLabel: "Flexible dates",
    rating: "5.0",
    reviewsLabel: "(400 Reviews)",
    reviewsCount: 400,
    price: 300,
    seatsLabel: "40 Seats Left",
    priceLabel: "$300",
    description:
        'Experience top-notch service, in-flight amenities, and smooth takeoffs for a stress-free journey.',
    mainImage: "assets/img/flight/flight-large-01.jpg",
    galleryImages: [
        "assets/img/flight/flight-large-01.jpg",
        "assets/img/flight/flight-large-02.jpg",
        "assets/img/flight/flight-large-03.jpg",
        "assets/img/flight/flight-large-04.jpg",
        "assets/img/flight/flight-large-05.jpg",
        "assets/img/flight/flight-large-06.jpg",
    ],
    mapRouteLabel: "Newyork - Sydney",
    fromAirportLabel: "Ken International Airport",
    toAirportLabel: "Martini International Airport",
    published: true,
    featured: true,
};

const normalizeFlightDetails = (data?: Record<string, any> | null): FlightDetailsView => {
    const toStringList = (value: unknown): string[] => Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        : [];
    const departureCity = typeof data?.departureCity === "string" && data.departureCity.trim()
        ? data.departureCity
        : typeof data?.from === "string" && data.from.trim()
            ? data.from
        : typeof data?.city === "string" && data.city.trim()
            ? data.city
            : typeof data?.address === "string" && data.address.trim()
                ? data.address
                : fallbackFlightDetails.departureCity;
    const arrivalCity = typeof data?.arrivalCity === "string" && data.arrivalCity.trim()
        ? data.arrivalCity
        : typeof data?.to === "string" && data.to.trim()
            ? data.to
        : typeof data?.country === "string" && data.country.trim()
            ? data.country
            : fallbackFlightDetails.arrivalCity;
    const routeLabel = [departureCity, arrivalCity].filter(Boolean).join(" - ") || fallbackFlightDetails.routeLabel;
    const gallery = [
        ...toStringList(data?.gallery),
        ...toStringList(data?.galleryImages),
        ...toStringList(data?.images),
    ];
    const dates = Array.isArray(data?.dates)
        ? toStringList(data.dates).join(" - ")
        : typeof data?.dates === "string" && data.dates.trim()
            ? data.dates
            : typeof data?.departureDate === "string" && data.departureDate.trim()
                ? typeof data?.arrivalDate === "string" && data.arrivalDate.trim()
                    ? `${data.departureDate} - ${data.arrivalDate}`
                    : data.departureDate
                : fallbackFlightDetails.dates;
    const departureDateLabel = typeof data?.departureDate === "string" && data.departureDate.trim()
        ? data.departureDate
        : typeof data?.dates === "string" && data.dates.trim()
            ? data.dates
            : fallbackFlightDetails.departureDateLabel;
    const image = typeof data?.image === "string" && data.image.trim()
        ? data.image
        : typeof data?.mainImage === "string" && data.mainImage.trim()
            ? data.mainImage
        : typeof data?.thumbnail === "string" && data.thumbnail.trim()
            ? data.thumbnail
            : gallery[0] || fallbackFlightDetails.mainImage;
    const mainImage = image;
    const galleryImages = (gallery.length > 0 ? gallery : [mainImage]).slice(0, 6);
    const reviewsCount = typeof data?.reviewsCount === "number"
        ? data.reviewsCount
        : Number(data?.reviewsCount) || 0;
    const price = typeof data?.price === "number"
        ? data.price
        : Number(data?.price) || 0;
    const fromAirportLabel = typeof data?.fromAirportLabel === "string" && data.fromAirportLabel.trim()
        ? data.fromAirportLabel
        : typeof data?.departureAirport === "string" && data.departureAirport.trim()
            ? data.departureAirport
            : typeof data?.fromAirport === "string" && data.fromAirport.trim()
                ? data.fromAirport
                : typeof data?.originAirport === "string" && data.originAirport.trim()
                    ? data.originAirport
                    : "";
    const toAirportLabel = typeof data?.toAirportLabel === "string" && data.toAirportLabel.trim()
        ? data.toAirportLabel
        : typeof data?.arrivalAirport === "string" && data.arrivalAirport.trim()
            ? data.arrivalAirport
            : typeof data?.toAirport === "string" && data.toAirport.trim()
                ? data.toAirport
                : typeof data?.destinationAirport === "string" && data.destinationAirport.trim()
                    ? data.destinationAirport
                    : "";
    const title = typeof data?.title === "string" && data.title.trim()
        ? data.title
        : typeof data?.flightName === "string" && data.flightName.trim()
            ? data.flightName
            : typeof data?.airlineName === "string" && data.airlineName.trim()
                ? data.airlineName
                : typeof data?.flightNumber === "string" && data.flightNumber.trim()
                    ? data.flightNumber
                    : fallbackFlightDetails.title;

    return {
        id: typeof data?.id === "string" && data.id.trim() ? data.id : fallbackFlightDetails.id,
        title,
        badge: typeof data?.badge === "string" && data.badge.trim()
            ? data.badge
            : data?.featured === true
                ? "Trending"
                : fallbackFlightDetails.badge,
        airline: typeof data?.airline === "string" && data.airline.trim()
            ? data.airline
            : typeof data?.airlineName === "string" && data.airlineName.trim()
                ? data.airlineName
                : fallbackFlightDetails.airline,
        stopInfo: typeof data?.stopInfo === "string" && data.stopInfo.trim()
            ? data.stopInfo
            : typeof data?.flightNumber === "string" && data.flightNumber.trim()
                ? data.flightNumber
                : typeof data?.make === "string" && data.make.trim()
                    ? data.make
                    : fallbackFlightDetails.stopInfo,
        departureCity,
        arrivalCity,
        routeLabel,
        location: typeof data?.location === "string" && data.location.trim()
            ? data.location
            : routeLabel,
        dates,
        departureDateLabel,
        rating: typeof data?.rating === "number"
            ? String(data.rating)
            : typeof data?.rating === "string" && data.rating.trim()
                ? data.rating
                : fallbackFlightDetails.rating,
        reviewsCount,
        reviewsLabel: `(${reviewsCount} Reviews)`,
        seatsLabel: `${typeof data?.seatsLeft === "number" ? data.seatsLeft : Number(data?.seatsLeft ?? data?.staffs) || 0} Seats Left`,
        price,
        priceLabel: `$${price}`,
        description: typeof data?.description === "string" && data.description.trim()
            ? data.description
            : typeof data?.details === "string" && data.details.trim()
                ? data.details
                : fallbackFlightDetails.description,
        mainImage,
        galleryImages,
        mapRouteLabel: routeLabel,
        fromAirportLabel,
        toAirportLabel,
        published: data?.published !== false,
        featured: data?.featured === true,
    };
};

const FlightDetails = () => {

    const routes = all_routes
    const [searchParams] = useSearchParams();
    const flightId = searchParams.get('id');

    const [gallery, setGallery] = React.useState(false);
    const [flightData, setFlightData] = useState<Record<string, any> | null>(null);

    const [flightRadio, setFlightRadio] = useState<string>('oneway');


    const [defaultDate] = useState(dayjs());

    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Flight Details',
            active: false,
            link: routes.home1
        },
        {
            label: 'Flight',
            active: false,
        },
        {
            label: 'Flight Details',
            active: true,
        },
    ];
    const flightDetailsUrl = flightId ? `${routes.flightDetails}?id=${encodeURIComponent(flightId)}` : routes.flightDetails;

    const sliderForRef = useRef<any>(null);
    const sliderNavRef = useRef<any>(null);
    const [navSync, setNavSync] = useState<any>({ sliderFor: null, sliderNav: null });
    const CustomNextArrow = ({  onClick }: any) => (
        <div className="owl-nav">
            <button type="button" role="presentation" className="owl-next" onClick={onClick}>
                <i className="fa-solid fa-chevron-right" />
            </button>
        </div>

    );

    const CustomPrevArrow = ({  onClick }: any) => (
        <div className="owl-nav">
            <button type="button" role="presentation" className="owl-prev" onClick={onClick}>
                <i className="fa-solid fa-chevron-left" />
            </button>
        </div>
    );
    useEffect(() => {
        setNavSync({
            sliderFor: sliderNavRef.current,
            sliderNav: sliderForRef.current,
        });
    }, []);

    useEffect(() => {
        let active = true;

        const loadFlight = async () => {
            if (!flightId) {
                if (active) {
                    setFlightData(null);
                }
                return;
            }

            try {
                const data = await fetchFlightById(flightId);
                if (active) {
                    if (data) {
                        setFlightData(data);
                        return;
                    }
                }
            } catch (error) {
                console.error("Error loading direct flight details:", error);
            }

            try {
                const flights = await fetchFlights();
                const matchedFlight = flights.find((flight) => flight.id === flightId);
                if (active) {
                    setFlightData(matchedFlight || null);
                }
            } catch (error) {
                console.error("Error loading flight list fallback:", error);
                if (active) {
                    setFlightData(null);
                }
            }
        };

        void loadFlight();

        return () => {
            active = false;
        };
    }, [flightId]);

    const isFirestoreBackedFlight = Boolean(flightId && flightData && flightData.published !== false);
    const displayFlight = isFirestoreBackedFlight ? normalizeFlightDetails(flightData) : fallbackFlightDetails;
    const routeSummary = displayFlight.routeLabel || displayFlight.location;
    const galleryImages = isFirestoreBackedFlight ? displayFlight.galleryImages : fallbackFlightDetails.galleryImages;
    const lightboxSlides = galleryImages.map((src) => ({ src }));


    const largeImage = {
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        autoplay: false,
        infinite: true,
        speed: 2000,
        nextArrow: <CustomNextArrow />,
        prevArrow: <CustomPrevArrow />,
        asNavFor: navSync.sliderFor,
    };

    const smallImage = {
        slidesToShow: 5,
        slidesToScroll: 0,
        focusOnSelect: true,
        dots: false,
        arrows: false,
        infinite: false,
        speed: 1000,
        margin: 10,
        nextArrow: <CustomNextArrow />,
        prevArrow: <CustomPrevArrow />,
        asNavFor: navSync.sliderNav,
        responsive: [
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 5,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 3,
                },
            },
            {
                breakpoint: 580,
                settings: {
                    slidesToShow: 2,
                },
            },
            {
                breakpoint: 0,
                settings: {
                    vertical: false,
                    slidesToShow: 1,
                },
            },
        ],
    };

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
            <Breadcrumb title="Flight" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-05" />

            <>
                {/* Page Wrapper */}
                <div className="content">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-8">
                                {/* Slider */}
                                <div>
                                    <div className="service-wrap slider-wrap-five mb-4">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                                            <div className="mb-2">
                                                <h4 className="mb-1 d-flex align-items-center flex-wrap">
                                                    {displayFlight.title}
                                                    <span className="badge badge-xs bg-success rounded-pill ms-2">
                                                        <i className="isax isax-ticket-star5 me-1" />
                                                        {displayFlight.featured ? "Featured" : "Verified"}
                                                    </span>
                                                    {displayFlight.badge ? (
                                                        <span className="badge badge-xs bg-indigo rounded-pill ms-2">
                                                            {displayFlight.badge}
                                                        </span>
                                                    ) : null}
                                                </h4>
                                                <div className="d-flex align-items-center flex-wrap">
                                                    <p className="fs-14 mb-2 me-3 pe-3 border-end d-flex align-items-center">
                                                        <ImageWithBasePath
                                                            src="assets/img/icons/airindia.svg"
                                                            className="me-2"
                                                            alt="Img"
                                                        />{" "}
                                                        {displayFlight.airline}
                                                        <span className="bg-primary divide-point mx-2" /> {displayFlight.stopInfo}
                                                    </p>
                                                    <p className="fs-14 mb-2 me-3 pe-3 border-end">
                                                        <i className="isax isax-location5 me-2" />
                                                        {routeSummary}
                                                        <Link
                                                            to="#location"
                                                            className="link-primary text-decoration-underline fw-medium ms-2"
                                                        >
                                                            View Location
                                                        </Link>
                                                    </p>
                                                    <div className="d-flex align-items-center mb-2">
                                                        <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                                                            {displayFlight.rating}
                                                        </span>
                                                        <p className="fs-14">
                                                            <Link to="#reviews">{displayFlight.reviewsLabel}</Link>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center mb-3">
                                                <Link
                                                    to="#"
                                                    className="btn btn-outline-light btn-icon btn-sm d-flex align-items-center justify-content-center me-2"
                                                >
                                                    <i className="isax isax-share" />
                                                </Link>
                                                <Link
                                                    to="#"
                                                    className="btn btn-outline-light btn-sm d-inline-flex align-items-center"
                                                >
                                                    <i className="isax isax-heart5 text-danger me-1" />
                                                    Save
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="service-wrap mb-4">
                                            <div className="slider-wrap">
                                                <div
                                                    className="owl-carousel service-carousel nav-center mb-4"
                                                    id="large-img"
                                                >
                                                    <Slider {...largeImage} ref={sliderForRef}>
                                                        {galleryImages.map((src, index) => (
                                                            <div className="service-img" key={`${src}-${index}`}>
                                                                <ImageWithBasePath
                                                                    src={src}
                                                                    className="img-fluid"
                                                                    alt={`${displayFlight.title} image ${index + 1}`}
                                                                />
                                                            </div>
                                                        ))}
                                                    </Slider>

                                                </div>
                                                <Lightbox
                                                    open={gallery}
                                                    close={() => setGallery(false)}
                                                    slides={lightboxSlides}
                                                />
                                                <Link
                                                    data-fancybox="gallery"
                                                    className="btn btn-white btn-xs view-btn"
                                                    onClick={() => setGallery(true)} to="#" title="Demo 01"
                                                >
                                                    <i className="isax isax-image me-1" />
                                                    See All
                                                </Link>
                                            </div>
                                            <div
                                                className="owl-carousel slider-nav-thumbnails nav-center"
                                                id="small-img"
                                            >
                                                <Slider {...smallImage} ref={sliderNavRef}>
                                                    {galleryImages.map((src, index) => (
                                                        <div key={`thumb-${src}-${index}`}>
                                                            <ImageWithBasePath
                                                                src={src}
                                                                className="img-fluid"
                                                                alt={`${displayFlight.title} thumbnail ${index + 1}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </Slider>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* /Slider */}
                                <div className="card shadow-none bg-light-200">
                                    <div className="card-body pb-1">
                                        <h5 className="d-flex align-items-center fs-18 mb-3">
                                            <span className="avatar avatar-md rounded-circle bg-primary me-2">
                                                <i className="isax isax-airplane5" />
                                            </span>
                                            Flight Information
                                        </h5>
                                        <div className="row">
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="mb-3">
                                                    <h6 className="mb-1">Airline</h6>
                                                    <p>{displayFlight.airline}</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="mb-3">
                                                    <h6 className="mb-1">Route</h6>
                                                    <p>{routeSummary}</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="mb-3">
                                                    <h6 className="mb-1">Departure Date</h6>
                                                    <p>{displayFlight.dates}</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="mb-3">
                                                    <h6 className="mb-1">Seats Left</h6>
                                                    <p>{displayFlight.seatsLabel}</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="mb-3">
                                                    <h6 className="mb-1">Price</h6>
                                                    <p>{displayFlight.priceLabel}</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="mb-3">
                                                    <h6 className="mb-1">Badge</h6>
                                                    <p>{displayFlight.badge}</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div className="mb-3">
                                                    <h6 className="mb-1">Rating</h6>
                                                    <p>{displayFlight.rating}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="accordion custom-accordion accordion-shadow-none">
                                    <div className="accordion-item border-0 mb-4">
                                        <div className="accordion-header">
                                            <button
                                                className="accordion-button"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordion_collapse_two"
                                                aria-expanded="true"
                                            >
                                                Description
                                            </button>
                                        </div>
                                        <div
                                            id="accordion_collapse_two"
                                            className="accordion-collapse collapse show"
                                        >
                                            <div className="accordion-body pt-0">
                                                <p className="mb-2">
                                                    {displayFlight.description}
                                                </p>
                                                <p className="mb-0">
                                                    Firestore-backed flight details are shown for this itinerary only.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="accordion-item mb-0 border-0 pb-1"
                                        style={{ display: isFirestoreBackedFlight ? 'none' : 'block' }}
                                    >
                                        <div className="accordion-header">
                                            <button
                                                className="accordion-button"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordion_collapse_three"
                                                aria-expanded="true"
                                            >
                                                Amenities
                                            </button>
                                        </div>
                                        <div
                                            id="accordion_collapse_three"
                                            className="accordion-collapse collapse show"
                                        >
                                            <div className="accordion-body pt-0">
                                                <div className="row">
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="mb-3">
                                                            <h6 className="mb-2">Dining Options</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Room Service</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Cafés and Bakeries</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Specialty Restaurants</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Buffet Restaurants</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="mb-3">
                                                            <h6 className="mb-2">Entertainment</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Live Shows</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Movie Theaters</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Nightclubs &amp; Bars</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Casino</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="mb-3">
                                                            <h6 className="mb-2">Sports &amp; Fitness</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Pools</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Fitness Centers</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Sports Courts</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Rock Climbing Walls</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="mb-3">
                                                            <h6 className="mb-2">Wellness &amp; Relaxation</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Spas</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Thermal Suites</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Adult-Only Retreats</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="mb-3">
                                                            <h6 className="mb-2">Family &amp; Kids</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Kids' Clubs</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Arcades</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Water Parks</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-4 col-md-6">
                                                        <div className="mb-3">
                                                            <h6 className="mb-2">Accommodations</h6>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Cabins</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Private Balconies</p>
                                                            </div>
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="isax isax-verify text-primary me-2 fs-16" />
                                                                <p>Concierge and Butler Service</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="accordion-item mb-0 border-0 pb-1"
                                        style={{ display: isFirestoreBackedFlight ? 'none' : 'block' }}
                                    >
                                        <div className="accordion-header">
                                            <button
                                                className="accordion-button"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordion_collapse_six"
                                                aria-expanded="true"
                                            >
                                                Available Seats
                                            </button>
                                        </div>
                                        <div
                                            id="accordion_collapse_six"
                                            className="accordion-collapse collapse show"
                                        >
                                            <div className="accordion-body pt-0">
                                                <div className="banner-form">
                                                    <form >
                                                        <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <div className="form-check d-flex align-items-center me-3 mb-2">
                                                                    <input
                                                                        className="form-check-input mt-0"
                                                                        type="radio"
                                                                        name="Radio"
                                                                        id="oneway"
                                                                        onChange={() => setFlightRadio('oneway')}
                                                                        checked={flightRadio === 'oneway' ? true : false}
                                                                    />
                                                                    <label
                                                                        className="form-check-label fs-14 ms-2"
                                                                        htmlFor="oneway"
                                                                    >
                                                                        Oneway
                                                                    </label>
                                                                </div>
                                                                <div className="form-check d-flex align-items-center me-3 mb-2">
                                                                    <input
                                                                        className="form-check-input mt-0"
                                                                        type="radio"
                                                                        name="Radio"
                                                                        id="roundtrip"
                                                                        onChange={() => setFlightRadio('roundtrip')}
                                                                        checked={flightRadio === 'roundtrip' ? true : false}
                                                                    />
                                                                    <label
                                                                        className="form-check-label fs-14 ms-2"
                                                                        htmlFor="roundtrip"
                                                                    >
                                                                        Round Trip
                                                                    </label>
                                                                </div>
                                                                <div className="form-check d-flex align-items-center me-3 mb-2">
                                                                    <input
                                                                        className="form-check-input mt-0"
                                                                        type="radio"
                                                                        name="Radio"
                                                                        id="multiway"
                                                                        defaultValue="multiway"
                                                                        onChange={() => setFlightRadio('multiway')}
                                                                        checked={flightRadio === 'multiway' ? true : false}
                                                                    />
                                                                    <label
                                                                        className="form-check-label fs-14 ms-2"
                                                                        htmlFor="multiway"
                                                                    >
                                                                        Multi Trip
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <h6 className="fw-medium fs-16 mb-2">
                                                                Millions of cheap flights. One simple search
                                                            </h6>
                                                        </div>
                                                        <div className="normal-trip mb-4" style={{ display: flightRadio === 'multiway' ? 'none' : 'block' }}>
                                                            <div className="d-lg-flex">
                                                                <div className="d-flex  form-info">
                                                                    <div className="form-item dropdown">
                                                                        <div
                                                                            data-bs-toggle="dropdown"
                                                                            data-bs-auto-close="outside"

                                                                            role="menu"
                                                                        >
                                                                            <label className="form-label fs-14 text-default mb-1">
                                                                                From
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                defaultValue={displayFlight.departureCity}
                                                                            />
                                                                            <p className="fs-12 mb-0">
                                                                                {displayFlight.dates}
                                                                            </p>
                                                                        </div>
                                                                        <div className="dropdown-menu dropdown-md p-0">
                                                                            <div className="input-search p-3 border-bottom">
                                                                                <div className="input-group">
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control"
                                                                                        placeholder="Search Location"
                                                                                    />
                                                                                    <span className="input-group-text px-2 border-start-0">
                                                                                        <i className="isax isax-search-normal" />
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <ul>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Newyork
                                                                                        </h6>
                                                                                        <p>Ken International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Boston
                                                                                        </h6>
                                                                                        <p>
                                                                                            Boston Logan International Airport
                                                                                        </p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Northern Virginia
                                                                                        </h6>
                                                                                        <p>Dulles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Los Angeles
                                                                                        </h6>
                                                                                        <p>Los Angeles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Orlando
                                                                                        </h6>
                                                                                        <p>Orlando International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                    <div className="form-item dropdown ps-2 ps-sm-3">
                                                                        <div
                                                                            data-bs-toggle="dropdown"
                                                                            data-bs-auto-close="outside"

                                                                            role="menu"
                                                                        >
                                                                            <label className="form-label fs-14 text-default mb-1">
                                                                                To
                                                                            </label>
                                                                            <h5>{displayFlight.arrivalCity}</h5>
                                                                            <p className="fs-12 mb-0">
                                                                                {displayFlight.stopInfo || routeSummary}
                                                                            </p>
                                                                            <span className="way-icon badge badge-primary rounded-pill translate-middle">
                                                                                <i className="fa-solid fa-arrow-right-arrow-left" />
                                                                            </span>
                                                                        </div>
                                                                        <div className="dropdown-menu dropdown-md p-0">
                                                                            <div className="input-search p-3 border-bottom">
                                                                                <div className="input-group">
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control"
                                                                                        placeholder="Search Location"
                                                                                    />
                                                                                    <span className="input-group-text px-2 border-start-0">
                                                                                        <i className="isax isax-search-normal" />
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <ul>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Newyork
                                                                                        </h6>
                                                                                        <p>Ken International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Boston
                                                                                        </h6>
                                                                                        <p>
                                                                                            Boston Logan International Airport
                                                                                        </p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Northern Virginia
                                                                                        </h6>
                                                                                        <p>Dulles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Los Angeles
                                                                                        </h6>
                                                                                        <p>Los Angeles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li>
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Orlando
                                                                                        </h6>
                                                                                        <p>Orlando International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                    <div className="form-item">
                                                                        <label className="form-label fs-14 text-default mb-1">
                                                                            Departure
                                                                        </label>
                                                                        <DatePicker
                                                                            className="form-control datetimepicker"
                                                                            placeholder="dd/mm/yyyy"
                                                                            defaultValue={defaultDate}
                                                                            format="DD-MM-YYYY"
                                                                        />
                                                                        <p className="fs-12 mb-0">Monday</p>
                                                                    </div>
                                                                    <div className="form-item round-drip" style={{ display: flightRadio === 'roundtrip' ? 'block' : 'none' }}>
                                                                        <label className="form-label fs-14 text-default mb-1">
                                                                            Return
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control datetimepicker"
                                                                            defaultValue="23-10-2024"
                                                                        />
                                                                        <p className="fs-12 mb-0">Wednesday</p>
                                                                    </div>
                                                                    <div className="form-item dropdown">
                                                                        <div
                                                                            data-bs-toggle="dropdown"
                                                                            data-bs-auto-close="outside"

                                                                            role="menu"
                                                                        >
                                                                            <label className="form-label fs-14 text-default mb-1">
                                                                                Travellers and cabin class
                                                                            </label>
                                                                            <h5>
                                                                                4{" "}
                                                                                <span className="fw-normal fs-14">
                                                                                    Persons
                                                                                </span>
                                                                            </h5>
                                                                            <p className="fs-12 mb-0">1 Adult, Economy</p>
                                                                        </div>
                                                                        <div className="dropdown-menu dropdown-menu-end dropdown-xl">
                                                                            <h5 className="mb-3">
                                                                                Select Travelers &amp; Class
                                                                            </h5>
                                                                            <div className="mb-3 border br-10 info-item pb-1">
                                                                                <h6 className="fs-16 fw-medium mb-2">
                                                                                    Travellers
                                                                                </h6>
                                                                                <div className="row">
                                                                                    <div className="col-md-4">
                                                                                        <div className="mb-3">
                                                                                            <label className="form-label text-gray-9 mb-2">
                                                                                                Adults{" "}
                                                                                                <span className="text-default fw-normal">
                                                                                                    ( 12+ Yrs )
                                                                                                </span>
                                                                                            </label>
                                                                                            <BannerCounter />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-md-4">
                                                                                        <div className="mb-3">
                                                                                            <label className="form-label text-gray-9 mb-2">
                                                                                                Childrens{" "}
                                                                                                <span className="text-default fw-normal">
                                                                                                    ( 2-12 Yrs )
                                                                                                </span>
                                                                                            </label>
                                                                                            <BannerCounter />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-md-4">
                                                                                        <div className="mb-3">
                                                                                            <label className="form-label text-gray-9 mb-2">
                                                                                                Infants
                                                                                                <span className="text-default fw-normal">
                                                                                                    ( 0-12 Yrs )
                                                                                                </span>
                                                                                            </label>
                                                                                            <BannerCounter />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="mb-3 border br-10 info-item pb-1">
                                                                                <h6 className="fs-16 fw-medium mb-2">
                                                                                    Travellers
                                                                                </h6>
                                                                                <div className="d-flex align-items-center flex-wrap">
                                                                                    <div className="form-check me-3 mb-3">
                                                                                        <input
                                                                                            className="form-check-input"
                                                                                            type="radio"
                                                                                            defaultValue="Economy"
                                                                                            name="cabin-class"
                                                                                            id="economy"
                                                                                            defaultChecked
                                                                                        />
                                                                                        <label
                                                                                            className="form-check-label"
                                                                                            htmlFor="economy"
                                                                                        >
                                                                                            Economy
                                                                                        </label>
                                                                                    </div>
                                                                                    <div className="form-check me-3 mb-3">
                                                                                        <input
                                                                                            className="form-check-input"
                                                                                            type="radio"
                                                                                            defaultValue="Economy"
                                                                                            name="cabin-class"
                                                                                            id="premium-economy"
                                                                                        />
                                                                                        <label
                                                                                            className="form-check-label"
                                                                                            htmlFor="premium-economy"
                                                                                        >
                                                                                            Premium Economy
                                                                                        </label>
                                                                                    </div>
                                                                                    <div className="form-check me-3 mb-3">
                                                                                        <input
                                                                                            className="form-check-input"
                                                                                            type="radio"
                                                                                            defaultValue="Business"
                                                                                            name="cabin-class"
                                                                                            id="business"
                                                                                        />
                                                                                        <label
                                                                                            className="form-check-label"
                                                                                            htmlFor="business"
                                                                                        >
                                                                                            Business
                                                                                        </label>
                                                                                    </div>
                                                                                    <div className="form-check mb-3">
                                                                                        <input
                                                                                            className="form-check-input"
                                                                                            type="radio"
                                                                                            defaultValue="First Class"
                                                                                            name="cabin-class"
                                                                                            id="first-class"
                                                                                        />
                                                                                        <label
                                                                                            className="form-check-label"
                                                                                            htmlFor="first-class"
                                                                                        >
                                                                                            First Class
                                                                                        </label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="d-flex justify-content-end">
                                                                                <Link
                                                                                    to="#"
                                                                                    className="btn btn-light btn-sm me-2"
                                                                                >
                                                                                    Cancel
                                                                                </Link>

                                                                                <Link
                                                                                    to={all_routes.flightGrid}
                                                                                    className="btn btn-primary btn-sm"
                                                                                >
                                                                                    Apply
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <Link
                                                                    to={all_routes.flightGrid}
                                                                    className="btn btn-primary search-btn rounded"
                                                                >
                                                                    Search
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="multi-trip mb-4" style={{ display: flightRadio === 'multiway' ? 'block' : 'none' }}>
                                                            <div className="d-lg-flex">
                                                                <div className="d-flex  form-info">
                                                                    <div className="form-item dropdown">
                                                                        <div
                                                                            data-bs-toggle="dropdown"
                                                                            data-bs-auto-close="outside"
                                                                            role="menu"
                                                                        >
                                                                            <label className="form-label fs-14 text-default mb-1">
                                                                                From
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                    defaultValue={displayFlight.departureCity}
                                                                            />
                                                                            <p className="fs-12 mb-0">
                                                                                Ken International Airport
                                                                            </p>
                                                                        </div>
                                                                        <div className="dropdown-menu dropdown-md p-0">
                                                                            <div className="input-search p-3 border-bottom">
                                                                                <div className="input-group">
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control"
                                                                                        placeholder="Search Location"
                                                                                    />
                                                                                    <span className="input-group-text px-2 border-start-0">
                                                                                        <i className="isax isax-search-normal" />
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <ul>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Newyork
                                                                                        </h6>
                                                                                        <p>Ken International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Boston
                                                                                        </h6>
                                                                                        <p>
                                                                                            Boston Logan International Airport
                                                                                        </p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Northern Virginia
                                                                                        </h6>
                                                                                        <p>Dulles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Los Angeles
                                                                                        </h6>
                                                                                        <p>Los Angeles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Orlando
                                                                                        </h6>
                                                                                        <p>Orlando International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                    <div className="form-item dropdown ps-2 ps-sm-3">
                                                                        <div
                                                                            data-bs-toggle="dropdown"
                                                                            data-bs-auto-close="outside"
                                                                            role="menu"
                                                                        >
                                                                            <label className="form-label fs-14 text-default mb-1">
                                                                                To
                                                                            </label>
                                                                            <h5>Las Vegas</h5>
                                                                            <p className="fs-12 mb-0">
                                                                                Martini International Airport
                                                                            </p>
                                                                            <span className="way-icon badge badge-primary rounded-pill translate-middle">
                                                                                <i className="fa-solid fa-arrow-right-arrow-left" />
                                                                            </span>
                                                                        </div>
                                                                        <div className="dropdown-menu dropdown-md p-0">
                                                                            <div className="input-search p-3 border-bottom">
                                                                                <div className="input-group">
                                                                                    <input
                                                                                        type="text"
                                                                                        className="form-control"
                                                                                        placeholder="Search Location"
                                                                                    />
                                                                                    <span className="input-group-text px-2 border-start-0">
                                                                                        <i className="isax isax-search-normal" />
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <ul>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Newyork
                                                                                        </h6>
                                                                                        <p>Ken International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Boston
                                                                                        </h6>
                                                                                        <p>
                                                                                            Boston Logan International Airport
                                                                                        </p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Northern Virginia
                                                                                        </h6>
                                                                                        <p>Dulles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li className="border-bottom">
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Los Angeles
                                                                                        </h6>
                                                                                        <p>Los Angeles International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                                <li>
                                                                                    <Link
                                                                                        className="dropdown-item"
                                                                                        to="#"
                                                                                    >
                                                                                        <h6 className="fs-16 fw-medium">
                                                                                            Orlando
                                                                                        </h6>
                                                                                        <p>Orlando International Airport</p>
                                                                                    </Link>
                                                                                </li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                    <div className="form-item">
                                                                        <label className="form-label fs-14 text-default mb-1">
                                                                            Departure
                                                                        </label>
                                                                        <DatePicker
                                                                            className="form-control datetimepicker"
                                                                            placeholder="dd/mm/yyyy"
                                                                            defaultValue={defaultDate}
                                                                            format="DD-MM-YYYY"
                                                                        />
                                                                        <p className="fs-12 mb-0">Monday</p>
                                                                    </div>
                                                                </div>
                                                                <Link
                                                                    to={all_routes.flightGrid}
                                                                    className="btn btn-primary search-btn rounded"
                                                                >
                                                                    Search
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>
                                                {/* Flight List */}
                                                <div className="hotel-list flight-details-list">
                                                    <div className="place-item mb-4">
                                                        <div className="place-img">
                                                            <div className="img-slider owl-carousel nav-center">
                                                                <Slider {...imgslideroption}>
                                                                    <div className="slide-images">
                                                                        <Link to={flightDetailsUrl}>
                                                                            <ImageWithBasePath
                                                                                src="assets/img/flight/flight-01.jpg"
                                                                                className="img-fluid"
                                                                                alt="img"
                                                                            />
                                                                        </Link>
                                                                    </div>
                                                                    <div className="slide-images">
                                                                        <Link to={flightDetailsUrl}>
                                                                            <ImageWithBasePath
                                                                                src="assets/img/flight/flight-02.jpg"
                                                                                className="img-fluid"
                                                                                alt="img"
                                                                            />
                                                                        </Link>
                                                                    </div>
                                                                </Slider>

                                                            </div>
                                                            <div className="fav-item" key={1} onClick={() => handleItemClick(1)}>
                                                                <span className="badge bg-pink">Popular</span>
                                                                <Link to="#" className={`fav-icon ${selectedItems[1] ? 'selected' : ''}`}>
                                                                    <i className="isax isax-heart5" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="place-content pb-1">
                                                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                                                <div className="overflow-hidden">
                                                                    <h5 className="mb-2 d-inline-flex align-items-center text-truncate">
                                                                        <Link to={flightDetailsUrl}>Economy Class</Link>
                                                                    </h5>
                                                                </div>
                                                                <div className="d-flex align-items-center text-nowrap mb-2">
                                                                    <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                                                                        4.3
                                                                    </span>
                                                                    <p className="fs-14">(380 Reviews)</p>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <p className="me-3 mb-3 d-inline-flex align-items-center">
                                                                    <i className="isax isax-tick-circle5 text-success me-1" />
                                                                    Excess Baggage
                                                                </p>
                                                                <p className="mb-3 d-inline-flex align-items-center">
                                                                    <i className="isax isax-tick-circle5 text-success me-1" />
                                                                    Priority Boarding
                                                                </p>
                                                            </div>
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    &nbsp;LED TV 2
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    15 m²
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    Free WiFi
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    Private Safe
                                                                </span>
                                                            </div>
                                                            <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3">
                                                                <h5 className="text-primary me-2">
                                                                    $500{" "}
                                                                    <span className="text-default text-decoration-line-through">
                                                                        $252
                                                                    </span>{" "}
                                                                    <span className="fs-14 fw-normal text-default">
                                                                        / Person ( $759 total includes taxes &amp; fees )
                                                                    </span>
                                                                </h5>
                                                                <div className="btn btn-primary btn-md">
                                                                    <div className="form-check d-flex align-items-center ps-0">
                                                                        <input
                                                                            className="form-check-input ms-0 mt-0 border border-white"
                                                                            name="book"
                                                                            type="checkbox"
                                                                            id="book1"
                                                                            defaultChecked
                                                                        />
                                                                        <label
                                                                            className="form-check-label fs-13 text-white ms-2"
                                                                            htmlFor="book1"
                                                                        >
                                                                            Select
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="place-item mb-4">
                                                        <div className="place-img">
                                                            <div className="img-slider owl-carousel nav-center">
                                                                <Slider {...imgslideroption}>
                                                                    <div className="slide-images">
                                                                        <Link to={flightDetailsUrl}>
                                                                            <ImageWithBasePath
                                                                                src="assets/img/flight/flight-03.jpg"
                                                                                className="img-fluid"
                                                                                alt="img"
                                                                            />
                                                                        </Link>
                                                                    </div>
                                                                    <div className="slide-images">
                                                                        <Link to={flightDetailsUrl}>
                                                                            <ImageWithBasePath
                                                                                src="assets/img/flight/flight-04.jpg"
                                                                                className="img-fluid"
                                                                                alt="img"
                                                                            />
                                                                        </Link>
                                                                    </div>
                                                                </Slider>

                                                            </div>
                                                            <div className="fav-item justify-content-end" key={2} onClick={() => handleItemClick(2)}>
                                                                <Link to="#" className={`fav-icon ${selectedItems[2] ? 'selected' : ''}`}>
                                                                    <i className="isax isax-heart5" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="place-content pb-1">
                                                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                                                <div className="overflow-hidden">
                                                                    <h5 className="mb-2 d-inline-flex align-items-center text-truncate">
                                                                        <Link to={flightDetailsUrl}>Business Class</Link>
                                                                    </h5>
                                                                </div>
                                                                <div className="d-flex align-items-center text-nowrap mb-2">
                                                                    <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                                                                        4.3
                                                                    </span>
                                                                    <p className="fs-14">(380 Reviews)</p>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <p className="me-3 mb-3 d-inline-flex align-items-center">
                                                                    <i className="isax isax-tick-circle5 text-success me-1" />
                                                                    Excess Baggage
                                                                </p>
                                                                <p className="mb-3 d-inline-flex align-items-center">
                                                                    <i className="isax isax-tick-circle5 text-success me-1" />
                                                                    Priority Boarding
                                                                </p>
                                                            </div>
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    &nbsp;LED TV 2
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    15 m²
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    Free WiFi
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    Private Safe
                                                                </span>
                                                            </div>
                                                            <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3">
                                                                <h5 className="text-primary me-2">
                                                                    $500{" "}
                                                                    <span className="text-default text-decoration-line-through">
                                                                        $658
                                                                    </span>{" "}
                                                                    <span className="fs-14 fw-normal text-default">
                                                                        / Person ( $756 total includes taxes &amp; fees )
                                                                    </span>
                                                                </h5>
                                                                <div className="btn btn-primary btn-md">
                                                                    <div className="form-check d-flex align-items-center ps-0">
                                                                        <input
                                                                            className="form-check-input ms-0 mt-0 border border-white"
                                                                            name="book"
                                                                            type="checkbox"
                                                                            id="book2"
                                                                        />
                                                                        <label
                                                                            className="form-check-label fs-13 text-white ms-2"
                                                                            htmlFor="book2"
                                                                        >
                                                                            Select
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="place-item mb-4">
                                                        <div className="place-img">
                                                            <div className="img-slider owl-carousel nav-center">
                                                                <Slider {...imgslideroption}>
                                                                    <div className="slide-images">
                                                                        <Link to={flightDetailsUrl}>
                                                                            <ImageWithBasePath
                                                                                src="assets/img/flight/flight-13.jpg"
                                                                                className="img-fluid"
                                                                                alt="img"
                                                                            />
                                                                        </Link>
                                                                    </div>
                                                                    <div className="slide-images">
                                                                        <Link to={flightDetailsUrl}>
                                                                            <ImageWithBasePath
                                                                                src="assets/img/flight/flight-12.jpg"
                                                                                className="img-fluid"
                                                                                alt="img"
                                                                            />
                                                                        </Link>
                                                                    </div>
                                                                </Slider>
                                                            </div>
                                                            <div className="fav-item justify-content-end" key={3} onClick={() => handleItemClick(3)}>
                                                                <Link to="#" className={`fav-icon ${selectedItems[3] ? 'selected' : ''}`}>
                                                                    <i className="isax isax-heart5" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="place-content pb-1">
                                                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                                                <div className="overflow-hidden">
                                                                    <h5 className="mb-2 d-inline-flex align-items-center text-truncate">
                                                                        <Link to={flightDetailsUrl}>Regular</Link>
                                                                    </h5>
                                                                </div>
                                                                <div className="d-flex align-items-center text-nowrap mb-2">
                                                                    <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">
                                                                        4.3
                                                                    </span>
                                                                    <p className="fs-14">(380 Reviews)</p>
                                                                </div>
                                                            </div>
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <p className="me-3 mb-3 d-inline-flex align-items-center">
                                                                    <i className="isax isax-tick-circle5 text-success me-1" />
                                                                    Excess Baggage
                                                                </p>
                                                                <p className="mb-3 d-inline-flex align-items-center">
                                                                    <i className="isax isax-tick-circle5 text-success me-1" />
                                                                    Priority Boarding
                                                                </p>
                                                            </div>
                                                            <div className="d-flex align-items-center flex-wrap">
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    &nbsp;LED TV 2
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    15 m²
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    Free WiFi
                                                                </span>
                                                                <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-3">
                                                                    Private Safe
                                                                </span>
                                                            </div>
                                                            <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3 gap-2">
                                                                <h5 className="text-primary me-2">
                                                                    $500{" "}
                                                                    <span className="text-default text-decoration-line-through">
                                                                        $989
                                                                    </span>{" "}
                                                                    <span className="fs-14 fw-normal text-default">
                                                                        / Person ( $1059 total includes taxes &amp; fees )
                                                                    </span>
                                                                </h5>
                                                                <div className="btn btn-primary btn-md">
                                                                    <div className="form-check d-flex align-items-center ps-0">
                                                                        <input
                                                                            className="form-check-input ms-0 mt-0 border border-white"
                                                                            name="book"
                                                                            type="checkbox"
                                                                            id="book3"
                                                                            defaultChecked
                                                                        />
                                                                        <label
                                                                            className="form-check-label fs-13 text-white ms-2"
                                                                            htmlFor="book3"
                                                                        >
                                                                            Select
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* /Flight List */}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="accordion-item mb-4 border-0">

                                        <div className="accordion-header">
                                            <button
                                                className="accordion-button"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordion_collapse_four"
                                                aria-expanded="true"

                                            >
                                                Gallery
                                            </button>
                                        </div>
                                        <div
                                            id="accordion_collapse_four"
                                            className="accordion-collapse collapse show"
                                        >
                                            <div className="accordion-body pt-0">
                                                <div className="row row-cols-lg-6 row-cols-sm-4 row-cols-2 g-2">
                                                    {galleryImages.slice(0, 5).map((src, index) => (
                                                        <div className="col" key={`gallery-thumb-${src}-${index}`}>
                                                            <Link
                                                                className="galley-wrap"
                                                                data-fancybox="gallery"
                                                                onClick={() => setGallery(true)}
                                                                to="#"
                                                                title={displayFlight.title}
                                                            >
                                                                <ImageWithBasePath
                                                                    src={src}
                                                                    alt={`${displayFlight.title} thumbnail ${index + 1}`}
                                                                />
                                                            </Link>
                                                        </div>
                                                    ))}
                                                    <div className="col">
                                                        <div className="galley-wrap more-gallery d-flex align-items-center justify-content-center">
                                                            <Link
                                                                data-fancybox="gallery"
                                                                onClick={() => setGallery(true)} to="#"
                                                                title={displayFlight.title}
                                                                className="btn btn-white btn-xs"
                                                            >
                                                                <i className="isax isax-image5 me-1" />
                                                                See All
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="accordion-item mb-4 border-0"
                                        style={{ display: isFirestoreBackedFlight ? 'none' : 'block' }}
                                    >
                                        <div className="accordion-header">
                                            <button
                                                className="accordion-button"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordion_collapse_eight"
                                                aria-expanded="true"
                                            >
                                                Frequently Asked Questions
                                            </button>
                                        </div>
                                        <div
                                            id="accordion_collapse_eight"
                                            className="accordion-collapse collapse show"
                                        >
                                            <div className="accordion-body pt-0">
                                                <div className="accordion faq-accordion" id="accordionFaq">
                                                    <div className="accordion-item show mb-2">
                                                        <div className="accordion-header">
                                                            <button
                                                                className="accordion-button fw-medium"
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target="#faq-collapseOne"

                                                                aria-controls="faq-collapseOne"
                                                            >
                                                                How old do I need to be to rent a car?
                                                            </button>
                                                        </div>
                                                        <div
                                                            id="faq-collapseOne"
                                                            className="accordion-collapse collapse show"
                                                            data-bs-parent="#accordionFaq"
                                                        >
                                                            <div className="accordion-body">
                                                                <p className="mb-0">
                                                                    We offer a diverse fleet of vehicles to suit every
                                                                    need, including compact cars, sedans, SUVs and
                                                                    luxury vehicles. You can browse our selection online
                                                                    or contact us for assistance in choosing the right
                                                                    vehicle for you
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="accordion-item mb-2">
                                                        <div className="accordion-header">
                                                            <button
                                                                className="accordion-button fw-medium collapsed"
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target="#faq-two"

                                                                aria-controls="faq-two"
                                                            >
                                                                What documents do I need to rent a car?
                                                            </button>
                                                        </div>
                                                        <div
                                                            id="faq-two"
                                                            className="accordion-collapse collapse"
                                                            data-bs-parent="#accordionFaq"
                                                        >
                                                            <div className="accordion-body">
                                                                <p className="mb-0">
                                                                    We offer a diverse fleet of vehicles to suit every
                                                                    need, including compact cars, sedans, SUVs and
                                                                    luxury vehicles. You can browse our selection online
                                                                    or contact us for assistance in choosing the right
                                                                    vehicle for you
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="accordion-item mb-2">
                                                        <div className="accordion-header">
                                                            <button
                                                                className="accordion-button fw-medium collapsed"
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target="#faq-three"

                                                                aria-controls="faq-three"
                                                            >
                                                                What types of vehicles are available for rent?
                                                            </button>
                                                        </div>
                                                        <div
                                                            id="faq-three"
                                                            className="accordion-collapse collapse"
                                                            data-bs-parent="#accordionFaq"
                                                        >
                                                            <div className="accordion-body">
                                                                <p className="mb-0">
                                                                    We offer a diverse fleet of vehicles to suit every
                                                                    need, including compact cars, sedans, SUVs and
                                                                    luxury vehicles. You can browse our selection online
                                                                    or contact us for assistance in choosing the right
                                                                    vehicle for you
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="accordion-item">
                                                        <div className="accordion-header">
                                                            <button
                                                                className="accordion-button fw-medium collapsed"
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target="#faq-four"

                                                                aria-controls="faq-four"
                                                            >
                                                                Can I rent a car with a debit card?
                                                            </button>
                                                        </div>
                                                        <div
                                                            id="faq-four"
                                                            className="accordion-collapse collapse"
                                                            data-bs-parent="#accordionFaq"
                                                        >
                                                            <div className="accordion-body">
                                                                <p className="mb-0">
                                                                    We offer a diverse fleet of vehicles to suit every
                                                                    need, including compact cars, sedans, SUVs and
                                                                    luxury vehicles. You can browse our selection online
                                                                    or contact us for assistance in choosing the right
                                                                    vehicle for you
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="accordion-item mb-xl-0 mb-4 shadow-sm p-3 border-0"
                                        id="reviews"
                                        style={{ display: isFirestoreBackedFlight ? 'none' : 'block' }}
                                    >
                                        <div className="accordion-header">
                                            <button
                                                className="accordion-button"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#accordion_collapse_nine"
                                                aria-expanded="true"
                                            >
                                                Reviews
                                            </button>
                                        </div>
                                        <div
                                            id="accordion_collapse_nine"
                                            className="accordion-collapse collapse show"
                                        >
                                            <div className="accordion-body border-top mt-3 pt-3">
                                                <Reviews />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                <div className="col-xl-4 ">
                                <div className="">
                                    <div className="card shadow-none ">
                                        <div className="card-body">
                                            {isFirestoreBackedFlight ? (
                                                <>
                                                    <div className="d-flex align-items-center mb-4">
                                                        <span className="btn btn-outline-light flex-fill">
                                                            <span className="icon-rotate-up me-2">
                                                                <i className="isax isax-airplane" />
                                                            </span>
                                                            {displayFlight.departureCity}
                                                        </span>
                                                        <Link
                                                            to="#"
                                                            className="way-icon badge badge-primary rounded-pill mx-2"
                                                        >
                                                            <i className="fa-solid fa-arrow-right-arrow-left" />
                                                        </Link>
                                                        <span className="btn btn-outline-light flex-fill">
                                                            <span className="icon-rotate-down me-2">
                                                                <i className="isax isax-airplane" />
                                                            </span>
                                                            {displayFlight.arrivalCity}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-between bg-light-200 rounded p-3 mb-3">
                                                        <p className="fs-13 fw-medium mb-0">Starts From</p>
                                                        <h5 className="text-primary">
                                                            {displayFlight.priceLabel}{" "}
                                                            <span className="fs-14 text-default fw-normal">/ Person</span>
                                                        </h5>
                                                    </div>
                                                    <div className="border rounded p-3 mb-3">
                                                        <h5 className="fs-18 mb-3">Flight Summary</h5>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="text-default">Route</span>
                                                            <strong className="text-end">{displayFlight.routeLabel}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="text-default">From</span>
                                                            <strong className="text-end">
                                                                {displayFlight.departureCity}
                                                                {displayFlight.fromAirportLabel ? ` · ${displayFlight.fromAirportLabel}` : ''}
                                                            </strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="text-default">To</span>
                                                            <strong className="text-end">
                                                                {displayFlight.arrivalCity}
                                                                {displayFlight.toAirportLabel ? ` · ${displayFlight.toAirportLabel}` : ''}
                                                            </strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="text-default">Departure</span>
                                                            <strong className="text-end">{displayFlight.departureDateLabel}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="text-default">Seats</span>
                                                            <strong className="text-end">{displayFlight.seatsLabel}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <span className="text-default">Reviews</span>
                                                            <strong className="text-end">{displayFlight.reviewsLabel}</strong>
                                                        </div>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <span className="text-default">Badge</span>
                                                            <strong className="text-end">{displayFlight.badge}</strong>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-lg search-btn ms-0 w-100 mb-3 fs-14 justify-content-center"
                                                    >
                                                        Book Now
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="banner-form">
                                                    <form className="form-info border-0">
                                                        <div className="form-info border-0">
                                                            <div className="form-item dropdown border rounded p-3 mb-3 w-100">
                                                                <div
                                                                    data-bs-toggle="dropdown"
                                                                    data-bs-auto-close="outside"
                                                                    role="menu"
                                                                >
                                                                    <label className="form-label fs-14 text-default mb-1">
                                                                        From
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control"
                                                                        defaultValue={displayFlight.departureCity}
                                                                    />
                                                                    <p className="fs-12 mb-0">Ken International Airport</p>
                                                                </div>
                                                                <div className="dropdown-menu dropdown-md p-0">
                                                                    <div className="input-search p-3 border-bottom">
                                                                        <div className="input-group">
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                placeholder="Search Location"
                                                                            />
                                                                            <span className="input-group-text px-2 border-start-0">
                                                                                <i className="isax isax-search-normal" />
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <ul>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Newyork</h6>
                                                                                <p>Ken International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Boston</h6>
                                                                                <p>Boston Logan International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">
                                                                                    Northern Virginia
                                                                                </h6>
                                                                                <p>Dulles International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Los Angeles</h6>
                                                                                <p>Los Angeles International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Orlando</h6>
                                                                                <p>Orlando International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                            <div className="form-item dropdown border rounded p-2 mb-3 w-100">
                                                                <div
                                                                    data-bs-toggle="dropdown"
                                                                    data-bs-auto-close="outside"
                                                                    role="menu"
                                                                >
                                                                    <label className="form-label fs-14 text-default mb-1">
                                                                        To
                                                                    </label>
                                                                    <h5>Las Vegas</h5>
                                                                    <p className="fs-12 mb-0">
                                                                        Martini International Airport
                                                                    </p>
                                                                </div>
                                                                <div className="dropdown-menu dropdown-md p-0">
                                                                    <div className="input-search p-3 border-bottom">
                                                                        <div className="input-group">
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                placeholder="Search Location"
                                                                            />
                                                                            <span className="input-group-text px-2 border-start-0">
                                                                                <i className="isax isax-search-normal" />
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <ul>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Newyork</h6>
                                                                                <p>Ken International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Boston</h6>
                                                                                <p>Boston Logan International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">
                                                                                    Northern Virginia
                                                                                </h6>
                                                                                <p>Dulles International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li className="border-bottom">
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Los Angeles</h6>
                                                                                <p>Los Angeles International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                        <li>
                                                                            <Link className="dropdown-item" to="#">
                                                                                <h6 className="fs-16 fw-medium">Orlando</h6>
                                                                                <p>Orlando International Airport</p>
                                                                            </Link>
                                                                        </li>
                                                                    </ul>
                                                                </div>
                                                            </div>
                                                            <div className="form-item border rounded p-3 mb-3 w-100">
                                                                <label className="form-label fs-14 text-default mb-1">
                                                                    Departure
                                                                </label>
                                                                <DatePicker
                                                                    className="form-control datetimepicker"
                                                                    placeholder="dd/mm/yyyy"
                                                                    defaultValue={defaultDate}
                                                                    format="DD-MM-YYYY"
                                                                />
                                                                <p className="fs-12 mb-0">Monday</p>
                                                            </div>
                                                            <div className="mb-3">
                                                                <label className="form-label fs-14 text-default mb-1">
                                                                    Preferred Class
                                                                </label>
                                                                <CustomSelect
                                                                    options={PreferredClass}
                                                                    className="select d-flex"
                                                                    placeholder="Select"
                                                                />
                                                            </div>
                                                            <div className="card shadow-none mb-3">
                                                                <div className="card-body p-3 pb-0">
                                                                    <div className="border-bottom pb-2 mb-2">
                                                                        <h6>Details</h6>
                                                                    </div>
                                                                    <div className="custom-increment">
                                                                        <div className="mb-3 d-flex align-items-center justify-content-between">
                                                                            <label className="form-label text-gray-9 mb-0">
                                                                                Adults
                                                                            </label>
                                                                            <BannerCounter />
                                                                        </div>
                                                                        <div className="mb-3 d-flex align-items-center justify-content-between">
                                                                            <label className="form-label text-gray-9 mb-0">
                                                                                Infants{" "}
                                                                                <span className="text-default fw-normal">
                                                                                    ( 0-12 Yrs )
                                                                                </span>
                                                                            </label>
                                                                            <BannerCounter />
                                                                        </div>
                                                                        <div className="mb-3 d-flex align-items-center justify-content-between">
                                                                            <label className="form-label text-gray-9 mb-0">
                                                                                Children{" "}
                                                                                <span className="text-default fw-normal">
                                                                                    ( 2-12 Yrs )
                                                                                </span>
                                                                            </label>
                                                                            <BannerCounter />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="submit"
                                                            className="btn btn-primary btn-lg search-btn ms-0 w-100 mb-3 fs-14 justify-content-center"
                                                        >
                                                            Book Now
                                                        </button>
                                                        <div className="d-flex align-items-center justify-content-between mt-1">
                                                            <h6 className="fs-14 fw-medium text-success">
                                                                {displayFlight.seatsLabel} on your Search
                                                            </h6>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Map */}
                                    <div className="card shadow-none" id="location">
                                        <div className="d-flex">
                                            <iframe
                                                src={`https://www.google.com/maps?q=${encodeURIComponent(displayFlight.mapRouteLabel)}&output=embed`}
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                className="contact-map"
                                            />
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                                                <p className="d-flex align-items-center mb-0">
                                                    <i className="isax isax-location5 me-2" />
                                                    {displayFlight.mapRouteLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* /Map */}
                                    {/* Enquiry */}
                                    <div className="card shadow-none">
                                        <div className="card-body">
                                            <form action={flightDetailsUrl}>
                                                <h5 className="mb-3 fs-18">Enquire Us</h5>
                                                <div className="py-1">
                                                    <div className="mb-3">
                                                        <label className="form-label">Name</label>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label">Email</label>
                                                        <input type="email" className="form-control" />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label">Phone</label>
                                                        <input type="text" className="form-control" />
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label">Message</label>
                                                        <textarea
                                                            className="form-control"
                                                            rows={3}
                                                            defaultValue={""}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary w-100 btn-lg d-flex align-items-center justify-content-center"
                                                >
                                                    Submit Enquiry
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                    {/* /Enquiry */}
                                    <div className="card shadow-none">
                                        <div className="card-body">
                                            <h5 className="fs-18 mb-3">Why Book With Us</h5>
                                            <div>
                                                <p className="d-flex align-items-center mb-3">
                                                    <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                                                        <i className="isax isax-medal-star" />
                                                    </span>
                                                    Expertise and Experience
                                                </p>
                                                <p className="d-flex align-items-center mb-3">
                                                    <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                                                        <i className="isax isax-menu" />
                                                    </span>
                                                    Tailored Services
                                                </p>
                                                <p className="d-flex align-items-center mb-3">
                                                    <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                                                        <i className="isax isax-message-minus" />
                                                    </span>
                                                    Comprehensive Planning
                                                </p>
                                                <p className="d-flex align-items-center mb-3">
                                                    <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                                                        <i className="isax isax-user-add" />
                                                    </span>
                                                    Client Satisfaction
                                                </p>
                                                <p className="d-flex align-items-center">
                                                    <span className="avatar avatar-md bg-light rounded-circle text-dark me-2">
                                                        <i className="isax isax-grammerly" />
                                                    </span>
                                                    24/7 Support
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="card shadow-none mb-0"
                                        style={{ display: isFirestoreBackedFlight ? 'none' : 'block' }}
                                    >
                                        <div className="card-body">
                                            <h5 className="fs-18 mb-3">Provider Details</h5>
                                            <div className="py-1">
                                                <div className="bg-light-500 br-10 mb-3 d-flex align-items-center p-3">
                                                    <Link
                                                        to="#"
                                                        className="avatar avatar-lg flex-shrink-0"
                                                    >
                                                        <ImageWithBasePath
                                                            src="assets/img/users/user-05.jpg"
                                                            alt="img"
                                                            className="rounded-circle"
                                                        />
                                                    </Link>
                                                    <div className="ms-2 overflow-hidden">
                                                        <h6 className="fw-medium text-truncate">
                                                            <Link to="#">Adrian Hendriques</Link>
                                                        </h6>
                                                        <p className="fs-14">Member Since : 14 May 2024</p>
                                                    </div>
                                                </div>
                                                <div className="border br-10 mb-3 p-3">
                                                    <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                                                        <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                                                            <i className="isax isax-call-outgoing5" />
                                                        </span>
                                                        <p>+1 12545 45548</p>
                                                    </div>
                                                    <div className="d-flex align-items-center border-bottom pb-3 mb-3">
                                                        <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                                                            <i className="isax isax-message-search5" />
                                                        </span>
                                                        <p>Info@example.com</p>
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <span className="avatar avatar-sm me-2 rounded-circle flex-shrink-0 bg-primary">
                                                            <i className="isax isax-location-tick5" />
                                                        </span>
                                                        <p>4635 Pheasant Ridge Road, USA</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row g-2">
                                                <div className="col-sm-6">
                                                    <Link
                                                        to="#"
                                                        className="btn btn-light d-flex align-items-center justify-content-center"
                                                    >
                                                        <i className="isax isax-messages5 me-2" />
                                                        Whatsapp Us
                                                    </Link>
                                                </div>
                                                <div className="col-sm-6">
                                                    <Link
                                                        to={routes.userChat}
                                                        className="btn btn-primary d-flex align-items-center justify-content-center"
                                                    >
                                                        <i className="isax isax-message-notif5 me-2" />
                                                        Chat Now
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                {/* /Page Wrapper */}
            </>


        </div>
    )
}

export default FlightDetails
