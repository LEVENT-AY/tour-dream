import React, { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Reviews from '../../../core/common/reviews/reviews';
import StickyContent from './stickyContent';
import { DatePicker } from 'antd'
import dayjs from "dayjs";
import BannerCounter from "../../../core/common/banner-counter/counter";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import RoomDetailModal from "../../../core/common/modal/roomDetailModal";
import { all_routes } from "../../router/all_routes";
import { fetchHotelById, fetchHotels } from '../../../core/services/firebaseServices';

type HotelDetailsView = {
    id: string;
    title: string;
    name: string;
    badge: string;
    location: string;
    rating: string;
    reviewsCount: number;
    reviewsLabel: string;
    price: number;
    priceLabel: string;
    description: string;
    image: string;
    gallery: string[];
    roomsLabel: string;
    amenities: string[];
    roomTypes: string[];
    highlights: string[];
    services: string[];
    nearbyLandmarks: string[];
    providerName: string;
    providerSince: string;
    providerPhone: string;
    providerEmail: string;
    published: boolean;
    featured: boolean;
};

const fallbackHotelDetails: HotelDetailsView = {
    id: 'hotel-plaza-athenee',
    title: 'Hotel Plaza Athenee',
    name: 'Hotel Plaza Athenee',
    badge: 'Popular',
    location: 'Barcelona',
    rating: '4.5',
    reviewsCount: 500,
    reviewsLabel: '(500 Reviews)',
    price: 500,
    priceLabel: '$500',
    description:
        'Hotel Plaza Athenee is an excellent choice for travellers visiting Coimbatore, offering a budget friendly environment alongside many helpful amenities designed to enhance your stay.',
    image: 'assets/img/hotels/hotel-large-01.jpg',
    gallery: [
        'assets/img/hotels/hotel-large-01.jpg',
        'assets/img/hotels/hotel-large-02.jpg',
        'assets/img/hotels/hotel-large-03.jpg',
        'assets/img/hotels/hotel-large-04.jpg',
        'assets/img/hotels/hotel-large-05.jpg',
        'assets/img/hotels/hotel-large-06.jpg',
    ],
    roomsLabel: 'Total 48 Rooms',
    amenities: ['Pool', 'Coffee', 'Laundry Facilities', 'In-Room Safe', 'Airport Transfer', 'Bar'],
    roomTypes: ['Smoking rooms', 'Suite', 'Connecting Rooms'],
    highlights: [
        'Spacious rooms with contemporary furnishings and helpful amenities.',
        'Easy access to local attractions and city landmarks.',
        'Comfort-focused stay with practical guest services.',
    ],
    services: ['Concierge Services', 'Daily Housekeeping', 'Front Desk Services', 'Valet Parking'],
    nearbyLandmarks: [
        'Near By Statue of Liberty',
        'The Metropolitan Museum of Art',
        'Yellowstone National Park',
    ],
    providerName: 'Property support team',
    providerSince: 'Member since: 14 May 2024',
    providerPhone: '+1 12545 45548',
    providerEmail: 'Info@example.com',
    published: true,
    featured: true,
};

const toStringList = (value: unknown): string[] =>
    Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        : typeof value === 'string' && value.trim()
            ? [value.trim()]
            : [];

const firstTextValue = (...values: unknown[]) =>
    values.find((value) => typeof value === 'string' && value.trim()) as string | undefined;

const normalizeHotelDetails = (data?: Record<string, any> | null): HotelDetailsView => {
    const gallery = [
        ...toStringList(data?.gallery),
        ...toStringList(data?.galleryImages),
        ...toStringList(data?.images),
    ];
    const image = firstTextValue(data?.image, data?.mainImage, data?.thumbnail) || gallery[0] || fallbackHotelDetails.image;
    const title = firstTextValue(data?.title, data?.name, data?.hotelName, data?.propertyName) || fallbackHotelDetails.title;
    const location = firstTextValue(data?.location, data?.city, data?.address, data?.country) || fallbackHotelDetails.location;
    const ratingValue = typeof data?.rating === 'number' ? data.rating : Number(data?.rating);
    const reviewsCountValue = typeof data?.reviewsCount === 'number' ? data.reviewsCount : Number(data?.reviewsCount);
    const priceValue = typeof data?.price === 'number'
        ? data.price
        : Number(firstTextValue(data?.price, data?.pricePerNight, data?.startingPrice) || 0);
    const amenities = toStringList(data?.amenities || data?.facilities || data?.features || data?.services);
    const roomTypes = toStringList(data?.roomTypes || data?.roomType || data?.type || data?.propertyType);
    const highlights = toStringList(data?.highlights);
    const services = toStringList(data?.services || data?.amenities);
    return {
        id: typeof data?.id === 'string' && data.id.trim() ? data.id : fallbackHotelDetails.id,
        title,
        name: title,
        badge: firstTextValue(data?.badge) || (data?.featured === true ? 'Trending' : fallbackHotelDetails.badge),
        location,
        rating: Number.isFinite(ratingValue) ? String(ratingValue) : fallbackHotelDetails.rating,
        reviewsCount: Number.isFinite(reviewsCountValue) ? reviewsCountValue : fallbackHotelDetails.reviewsCount,
        reviewsLabel: `(${Number.isFinite(reviewsCountValue) ? reviewsCountValue : fallbackHotelDetails.reviewsCount} Reviews)`,
        price: Number.isFinite(priceValue) ? priceValue : fallbackHotelDetails.price,
        priceLabel: `$${Number.isFinite(priceValue) ? priceValue : fallbackHotelDetails.price}`,
        description: firstTextValue(data?.description, data?.details, data?.summary) || fallbackHotelDetails.description,
        image,
        gallery: gallery.length > 0 ? gallery : [image],
        roomsLabel: firstTextValue(
            typeof data?.roomsCount === 'number' ? `Total ${data.roomsCount} Rooms` : '',
            typeof data?.roomCount === 'number' ? `Total ${data.roomCount} Rooms` : '',
            typeof data?.rooms === 'number' ? `Total ${data.rooms} Rooms` : '',
            typeof data?.availableRooms === 'number' ? `Total ${data.availableRooms} Rooms` : ''
        ) || fallbackHotelDetails.roomsLabel,
        amenities: amenities.length > 0 ? amenities : fallbackHotelDetails.amenities,
        roomTypes: roomTypes.length > 0 ? roomTypes : fallbackHotelDetails.roomTypes,
        highlights: highlights.length > 0 ? highlights : amenities.slice(0, 3).concat(fallbackHotelDetails.highlights).slice(0, 3),
        services: services.length > 0 ? services : fallbackHotelDetails.services,
        nearbyLandmarks: (() => {
            const landmarks = toStringList(data?.nearbyLandmarks || data?.landmarks);
            return landmarks.length > 0 ? landmarks : fallbackHotelDetails.nearbyLandmarks;
        })(),
        providerName: firstTextValue(data?.providerName, data?.ownerName, data?.hostName, data?.managerName) || fallbackHotelDetails.providerName,
        providerSince: firstTextValue(data?.providerSince, data?.memberSince) || fallbackHotelDetails.providerSince,
        providerPhone: firstTextValue(data?.providerPhone, data?.phone, data?.contactPhone) || fallbackHotelDetails.providerPhone,
        providerEmail: firstTextValue(data?.providerEmail, data?.email, data?.contactEmail) || fallbackHotelDetails.providerEmail,
        published: data?.published !== false,
        featured: data?.featured === true,
    };
};

const isPublicHotelRecord = (data?: Record<string, any> | null) => {
    if (!data || data.published !== true) return false;
    const approvalStatus = String(data.approvalStatus || data.status || 'approved').toLowerCase();
    return approvalStatus !== 'rejected' && approvalStatus !== 'suspended';
};
const HotelDetails = () => {
    const routes = all_routes
    const [searchParams] = useSearchParams();
    const [open, setOpen] = React.useState(false);
    const [open2, setOpen2] = React.useState(false);
    const [defaultDate] = useState(dayjs());
    const [isPolicy,setIsPolicy] = useState(true);
    const [isPolicy2,setIsPolicy2] = useState(false);
    const [isPolicy3,setIsPolicy3] = useState(false);
    const [isPolicy4,setIsPolicy4] = useState(false);
    const [hotelData, setHotelData] = useState<any>(null);
    const [hotelNotFound, setHotelNotFound] = useState(false);

    const [gallery, setGallery] = React.useState(false);
    const hotelId = searchParams.get('id');

    useEffect(() => {
        let isMounted = true;

        const loadHotel = async () => {
            if (!hotelId) {
                if (isMounted) {
                    setHotelData(null);
                    setHotelNotFound(false);
                }
                return;
            }
            try {
                const data = await fetchHotelById(hotelId);
                if (isMounted) {
                    if (isPublicHotelRecord(data)) {
                        setHotelData(data);
                        setHotelNotFound(false);
                        return;
                    }
                }
            } catch {
                // Fall through to the published hotel query below.
            }

            try {
                const hotels = await fetchHotels();
                const matchedHotel = hotels.find((hotel) => hotel.id === hotelId);
                if (isMounted && matchedHotel) {
                    setHotelData(matchedHotel);
                    setHotelNotFound(false);
                    return;
                }
            } catch {
                // Ignore and fall back to the template state below.
            }

            if (isMounted) {
                setHotelData(null);
                setHotelNotFound(true);
            }
        };

        loadHotel();

        return () => {
            isMounted = false;
        };
    }, [hotelId]);
    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Hotel Details',
            active: false,
            link:routes.home1
        },
        {
            label: 'Hotel',
            active: false,
        },
        {
            label: 'Hotel Details',
            active: true,
        },
    ];
        const sliderForRef = useRef<any>(null);
        const sliderNavRef = useRef<any>(null);
        const [navSync, setNavSync] = useState<any>({ sliderFor: null, sliderNav: null });
        const CustomNextArrow = ({  onClick }: any) => (
            <div className="owl-nav">
            <button type="button" role="presentation" className="owl-next"  onClick={onClick}>
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
        const sliderForSettings = {
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: true,
            arrows: true,
            fade: true,
            nextArrow: <CustomNextArrow />,
            prevArrow: <CustomPrevArrow />,
            asNavFor: navSync.sliderFor,
          };
        
          const sliderNavSettings = {
            slidesToShow: 5,
            slidesToScroll: 1,
            dots: false,
            arrows: true,
            infinite: true,
            nextArrow: <CustomNextArrow />,
            prevArrow: <CustomPrevArrow />,
            focusOnSelect: true,
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


          const [selectedItems, setSelectedItems] = useState(Array(10).fill(false));
            const handleItemClick = (index: number) => {
              setSelectedItems((prevSelectedItems) => {
                const updatedSelectedItems = [...prevSelectedItems];
                updatedSelectedItems[index] = !updatedSelectedItems[index];
                return updatedSelectedItems;
              });
            };

    const isFirestoreBackedHotel = Boolean(hotelId && hotelData && isPublicHotelRecord(hotelData));
    const displayHotel = isFirestoreBackedHotel ? normalizeHotelDetails(hotelData) : fallbackHotelDetails;

    return (
    <>
    <Breadcrumb title="Hotel Details" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
    <div className="content">
        <div className="container">
            {hotelId && hotelNotFound && (
                <div className="alert alert-warning mb-4" role="alert">
                    We could not load a public hotel listing for this link, so the page is showing the template fallback instead.
                </div>
            )}

            <div className="row">

                {/* Hotel Details */}
                <div className="col-xl-8">

                    {/* Slider */}
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                        <div className="mb-2">
                            <h4 className="mb-1 d-flex align-items-center flex-wrap">{displayHotel.title || displayHotel.name}<span className="badge badge-xs bg-success rounded-pill ms-2"><i className="isax isax-ticket-star me-1"></i>{displayHotel.badge || 'Verified'}</span></h4>
                            <div className="d-flex align-items-center flex-wrap">
                                <p className="fs-14 mb-2 me-3 pe-3 border-end"><i className="isax isax-buildings me-2"></i>Hotel</p>
                                <p className="fs-14 mb-2 me-3 pe-3 border-end"><i className="isax isax-location5 me-2"></i>{displayHotel.location}<Link to="#location" className="link-primary text-decoration-underline fw-medium ms-2">View Location</Link></p>
                                <div className="d-flex align-items-center mb-2">
                                    <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{displayHotel.rating}</span>
                                    <p className="fs-14"><Link to="#reviews">{displayHotel.reviewsLabel}</Link></p>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                            <Link to="#" className="btn btn-outline-light btn-icon btn-sm d-flex align-items-center justify-content-center me-2"><i className="isax isax-share"></i></Link>
                            <Link to="#" className="btn btn-outline-light btn-sm d-inline-flex align-items-center"><i className="isax isax-heart5 text-danger me-1"></i>Save</Link>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
                        <div className="d-flex align-items-center flex-wrap">
                            {displayHotel.highlights.slice(0, 3).map((item) => (
                                <p key={item} className="fs-14 me-2 mb-2"><i className="isax isax-tick-circle5 text-success me-2"></i>{item}</p>
                            ))}
                        </div>
                        {displayHotel.roomsLabel && (
                            <span className="badge badge-light text-gray-9 badge-md fs-13 fw-medium rounded-pill mb-2">{displayHotel.roomsLabel}</span>
                        )}
                    </div>
                    <div className="border-bottom pb-4 mb-4">
                                <div className="service-wrap mb-4">
                                    <div className="slider-wrap">
                                        <Slider {...sliderForSettings} ref={sliderForRef} className="owl-carousel slicknavfor service-carousel nav-center mb-4" >
                                            <div className="service-img">
                                                <ImageWithBasePath src={displayHotel.image || "assets/img/hotels/hotel-large-01.jpg"} className="img-fluid" alt="Slider Img" />
                                            </div>
                                    {Array.isArray(displayHotel.gallery) ? displayHotel.gallery.slice(1).map((img: string) => (
                                        <div className="service-img" key={img}>
                                            <ImageWithBasePath src={img} className="img-fluid" alt="Slider Img" />
                                        </div>
                                    )) : null}
                                        </Slider>
                                        <Lightbox
                                            open={gallery}
                                            close={() => setGallery(false)}
                                            slides={[
                                        ...(Array.isArray(displayHotel.gallery) && displayHotel.gallery.length > 0
                                            ? displayHotel.gallery
                                            : ["assets/img/hotels/hotel-large-01.jpg"]).map((src: string) => ({ src })),
                                            ]}
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
                            <Slider {...sliderNavSettings} ref={sliderNavRef} className="owl-carousel slider-nav-thumbnails nav-center" >
                                <div><ImageWithBasePath src="assets/img/hotels/hotel-thumb-01.jpg" className="img-fluid" alt="Slider Img" /></div>
                                <div><ImageWithBasePath src="assets/img/hotels/hotel-thumb-02.jpg" className="img-fluid" alt="Slider Img" /></div>
                                <div><ImageWithBasePath src="assets/img/hotels/hotel-thumb-03.jpg" className="img-fluid" alt="Slider Img" /></div>
                                <div><ImageWithBasePath src="assets/img/hotels/hotel-thumb-04.jpg" className="img-fluid" alt="Slider Img" /></div>
                                <div><ImageWithBasePath src="assets/img/hotels/hotel-thumb-05.jpg" className="img-fluid" alt="Slider Img" /></div>
                                <div><ImageWithBasePath src="assets/img/hotels/hotel-thumb-06.jpg" className="img-fluid" alt="Slider Img" /></div>
                            </Slider>
                        </div>
                        <h5 className="mb-3 fs-18">Description</h5>
                        <div>
                            <p>{displayHotel.description}</p>
                        </div>
                        <div className="read-more">
                            <div className="more-text">
                                <p>{displayHotel.highlights[0] || 'Comfort-focused accommodation with practical guest services.'}</p>
                            </div>
                            <Link to="#" className="fs-14 fw-medium more-link text-decoration-underline mb-2">Show More</Link>
                        </div>
                    </div>
                    {/* /Slider */}

                    {/* Highlights */}
                    <div className="border-bottom pb-4 mb-4">
                        <h5 className="mb-3 fs-18">Highlights</h5>
                        <div className="highlight-box">
                            <p className="d-flex align-items-center"><i className="isax isax-star-1 text-orange"></i>Spacious Rooms: Comfortable accommodations with contemporary furnishings and high-quality bedding.</p>
                        </div>
                        <div className="highlight-box">
                            <p className="d-flex align-items-center"><i className="isax isax-star-1 text-orange"></i>Destination Unlocked: Programs that encourage exploration of local culture and attractions.</p>
                        </div>
                        <div className="highlight-box">
                            <p className="d-flex align-items-center"><i className="isax isax-star-1 text-orange"></i>Sophisticated Décor: Modern and artistic interiors with a touch of elegance.</p>
                        </div>
                    </div>
                    {/* /Highlights */}

                    {/* Popular Amenities */}
                    <div className="border-bottom pb-2 mb-4">
                        <h5 className="mb-3 fs-18">Popular Amenities</h5>
                        <div className="row">
                            {displayHotel.amenities.slice(0, 9).map((amenity) => (
                                <div className="col-sm-6 col-lg-4" key={amenity}>
                                    <div className="d-flex align-items-center mb-3">
                                        <span className="avatar avatar-md bg-primary-transparent rounded-circle me-2">
                                            <i className="isax isax-wind-2 fs-16"></i>
                                        </span>
                                        <p>{amenity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* /Popular Amenities */}

                    {/* Room types */}
                    <div className="border-bottom pb-2 mb-4">
                        <h5 className="mb-3 fs-18">Room types</h5>
                        <div className="row">
                            {(displayHotel.roomTypes.length > 0 ? displayHotel.roomTypes : [displayHotel.name]).slice(0, 3).map((roomType) => (
                                <div className="col-sm-6 col-lg-4" key={roomType}>
                                    <div className="d-flex align-items-center mb-3">
                                        <span className="avatar avatar-md bg-primary-transparent rounded-circle me-2">
                                            <i className="isax isax-send-sqaure-2 fs-16"></i>
                                        </span>
                                        <p>{roomType}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* /Room types */}

                    {/* Availability */}
                    <div className="border-bottom pb-2 mb-4" id="availability">
                        <h5 className="mb-3 fs-18">Availability</h5>
                        <div className="card">
                            <div className="card-body">
                                <div className="banner-form">
                                    <form className="d-lg-flex">
                                        <div className="d-flex form-info">
                                            <div className="form-item">
                                                <label className="form-label fs-14 text-default mb-1">Check In</label>
                                                <DatePicker 
                                                    className="form-control datetimepicker"
                                                    placeholder="dd/mm/yyyy"
                                                    defaultValue={defaultDate}
                                                    format="DD-MM-YYYY"
                                                />
                                            </div>
                                            <div className="form-item">
                                                <label className="form-label fs-14 text-default mb-1">Check Out</label>
                                                <DatePicker 
                                                    className="form-control datetimepicker"
                                                    placeholder="dd/mm/yyyy"
                                                    defaultValue={defaultDate}
                                                    format="DD-MM-YYYY"
                                                />
                                            </div>
                                            <div className="form-item dropdown">
                                                <div data-bs-toggle="dropdown" data-bs-auto-close="outside"  role="menu">
                                                    <label className="form-label fs-14 text-default mb-1">Guests</label>
                                                    <h5>4 <span className="fw-normal fs-14">Persons</span></h5>
                                                </div>
                                                <div className="dropdown-menu dropdown-menu-end dropdown-xl">
                                                    <h5 className="mb-3">Select Travelers &  Class</h5>
                                                    <div className="mb-3 border br-10 info-item pb-1">
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <div className="mb-3 d-flex align-items-center justify-content-between">
                                                                    <label className="form-label text-gray-9 mb-2">Rooms</label>
                                                                    <BannerCounter/>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-12">
                                                                <div className="mb-3 d-flex align-items-center justify-content-between">
                                                                    <label className="form-label text-gray-9 mb-2">Adults</label>
                                                                    <BannerCounter/>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-12">
                                                                <div className="mb-3 d-flex align-items-center justify-content-between">
                                                                    <label className="form-label text-gray-9 mb-2">Children <span className="text-default fw-normal">( 2-12 Yrs )</span></label>
                                                                    <BannerCounter/>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-12">
                                                                <div className="mb-3 d-flex align-items-center justify-content-between">
                                                                    <label className="form-label text-gray-9 mb-2">Infants <span className="text-default fw-normal">( 0-12 Yrs )</span></label>
                                                                    <BannerCounter/>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mb-3 border br-10 info-item pb-1">
                                                        <h6 className="fs-16 fw-medium mb-2">Travellers</h6>
                                                        <div className="d-flex align-items-center flex-wrap">
                                                            <div className="form-check me-3 mb-3">
                                                                <input className="form-check-input" type="radio" name="room" id="room1" defaultChecked />
                                                                <label className="form-check-label" htmlFor="room1">
                                                                    Single
                                                                </label>
                                                            </div>
                                                            <div className="form-check me-3 mb-3">
                                                                <input className="form-check-input" type="radio" name="room" id="room2" />
                                                                <label className="form-check-label" htmlFor="room2">
                                                                    Double
                                                                </label>
                                                            </div>
                                                            <div className="form-check me-3 mb-3">
                                                                <input className="form-check-input" type="radio" name="room" id="room3" />
                                                                <label className="form-check-label" htmlFor="room3">
                                                                    Delux
                                                                </label>
                                                            </div>
                                                            <div className="form-check mb-3">
                                                                <input className="form-check-input" type="radio" name="room" id="room4" />
                                                                <label className="form-check-label" htmlFor="room4">
                                                                    Suite
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mb-3 border br-10 info-item pb-1">
                                                        <h6 className="fs-16 fw-medium mb-2">Property Type</h6>
                                                        <div className="d-flex align-items-center flex-wrap">
                                                            <div className="form-check me-3 mb-3">
                                                                <input className="form-check-input" type="radio" name="property" id="property1" defaultChecked />
                                                                <label className="form-check-label" htmlFor="property1">
                                                                    Villa
                                                                </label>
                                                            </div>
                                                            <div className="form-check me-3 mb-3">
                                                                <input className="form-check-input" type="radio" name="property" id="property2" />
                                                                <label className="form-check-label" htmlFor="property2">
                                                                    Condo
                                                                </label>
                                                            </div>
                                                            <div className="form-check me-3 mb-3">
                                                                <input className="form-check-input" type="radio" name="property" id="property3" />
                                                                <label className="form-check-label" htmlFor="property3">
                                                                    Cabin
                                                                </label>
                                                            </div>
                                                            <div className="form-check mb-3">
                                                                <input className="form-check-input" type="radio" name="property" id="property4" />
                                                                <label className="form-check-label" htmlFor="property4">
                                                                    Apartments
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-end">
                                                        <Link to="#" className="btn btn-light btn-sm me-2">Cancel</Link>
                                                        <button type="button" className="btn btn-primary btn-sm">Apply</button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-item dropdown">
                                                <div data-bs-toggle="dropdown" data-bs-auto-close="outside"  role="menu">
                                                    <label className="form-label fs-14 text-default mb-1">Price per Night</label>
                                                    <input type="text" className="form-control" defaultValue="$1000 - $15000" />
                                                </div>
                                                <div className="dropdown-menu dropdown-md p-0">
                                                    <ul>
                                                        <li className="border-bottom">
                                                            <Link className="dropdown-item" to="#">
                                                                <h6 className="fs-16 fw-medium">$500 - $2000</h6>
                                                                <p>Upto 65% offers</p>
                                                            </Link>
                                                        </li>
                                                        <li className="border-bottom">
                                                            <Link className="dropdown-item" to="#">
                                                                <h6 className="fs-16 fw-medium">Upto 65% offers</h6>
                                                                <p>Upto 40% offers</p>
                                                            </Link>
                                                        </li>
                                                        <li className="border-bottom">
                                                            <Link className="dropdown-item" to="#">
                                                                <h6 className="fs-16 fw-medium">$5000 - $8000</h6>
                                                                <p>Upto 35% offers</p>
                                                            </Link>
                                                        </li>
                                                        <li className="border-bottom">
                                                            <Link className="dropdown-item" to="#">
                                                                <h6 className="fs-16 fw-medium">$9000 - $11000</h6>
                                                                <p>Upto 20% offers</p>
                                                            </Link>
                                                        </li>
                                                        <li>
                                                            <Link className="dropdown-item" to="#">
                                                                <h6 className="fs-16 fw-medium">$11000 - $15000</h6>
                                                                <p>Upto 10% offers</p>
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" className="btn btn-primary search-btn rounded">Search</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                        {!isFirestoreBackedHotel && (
                        <div className="hotel-list">
                            <div className="place-item mb-4">
                                <div className="place-img">
                                    <div className="img-slider image-slide owl-carousel nav-center">
                                        <Slider {...imgslideroption}>
                                        <div className="slide-images">
                                            <Link to={routes.hotelDetails}>
                                                <ImageWithBasePath src="assets/img/hotels/hotel-08.jpg" className="img-fluid" alt="img" />
                                            </Link>
                                        </div>
                                        <div className="slide-images">
                                            <Link to={routes.hotelDetails}>
                                                <ImageWithBasePath src="assets/img/hotels/hotel-03.jpg" className="img-fluid" alt="img" />
                                            </Link>
                                        </div>
                                        </Slider>
                                    </div>
                                    <div className="fav-item" key={1} onClick={() => handleItemClick(1)}>
                                        <span className="badge bg-pink">Popular</span>
                                        <Link to="#"className={`fav-icon ${selectedItems[1] ? 'selected' : ''}`}>
                                            <i className="isax isax-heart5"></i>
                                        </Link>
                                    </div>
                                </div>
                                <div className="place-content pb-1">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                                        <div className="overflow-hidden">
                                            <h5 className="mb-2 d-inline-flex align-items-center text-truncate"><Link to={routes.hotelDetails}>Queen Room</Link><span className="badge badge-xs badge-success rounded-pill ms-2">19% Offer</span></h5>
                                        </div>
                                        <div className="d-flex align-items-center text-nowrap mb-2">
                                            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">4.3</span>
                                            <p className="fs-14">(500 Reviews)</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap">
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Sleeps 2</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">1 Queen Bed</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">City View </span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">15 m²</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Free WiFi</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Private Safe</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill mb-2">Free Self Parking</span>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap">
                                        <p className="me-2 mb-2 d-inline-flex align-items-center"><i className="isax isax-tick-circle5 text-success me-2"></i>Refundable</p>
                                        <p className="mb-2 d-inline-flex align-items-center"><i className="isax isax-tick-circle5 text-success me-2"></i>Express check-in/out available</p>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3">
                                        <h5 className="text-primary me-2 mb-3">$500 <span className="text-default text-decoration-line-through">$654</span> <span className="fs-14 fw-normal text-default">/ Night</span></h5>
                                        <div className="d-flex align-items-center">
                                            <Link to="#" data-bs-toggle="modal" data-bs-target="#room-details" className="fs-14 link-primary text-decoration-underline me-3 mb-3">View Room Details</Link>
                                            <div className="btn btn-primary btn-md mb-3">
                                                <div className="form-check d-flex align-items-center ps-0">
                                                    <input className="form-check-input ms-0 mt-0 border border-white" name="book" type="checkbox" id="book1" defaultChecked />
                                                    <label className="form-check-label fs-13 text-white ms-2" htmlFor="book1">Select Room</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="place-item mb-4">
                                <div className="place-img">
                                    <Link to={routes.hotelDetails}>
                                        <ImageWithBasePath src="assets/img/hotels/hotel-02.jpg" className="img-fluid" alt="img" />
                                    </Link>
                                    <div className="fav-item justify-content-end" key={2} onClick={() => handleItemClick(2)}>
                                        <Link to="#" className={`fav-icon ${selectedItems[2] ? 'selected' : ''}`}>
                                            <i className="isax isax-heart5"></i>
                                        </Link>
                                    </div>
                                </div>
                                <div className="place-content pb-1">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                                        <div className="overflow-hidden">
                                            <h5 className="mb-2 d-inline-flex align-items-center text-truncate"><Link to={routes.hotelDetails}>Double Room</Link></h5>
                                        </div>
                                        <div className="d-flex align-items-center text-nowrap mb-2">
                                            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">4.9</span>
                                            <p className="fs-14">(380 Reviews)</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap">
                                        <p className="me-2 mb-2 d-inline-flex align-items-center"><i className="isax isax-tick-circle5 text-success me-2"></i>Reserve now, pay later</p>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap mb-2">
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Sleeps 6</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">2 King Beds</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Family Room</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">23 m²</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">2 Bathrooms</span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3">
                                        <h5 className="text-primary me-2 mb-3">$700 <span className="fs-14 fw-normal text-default">/ Night</span></h5>
                                        <div className="d-flex align-items-center">
                                            <Link to="#" data-bs-toggle="modal" data-bs-target="#room-details" className="fs-14 link-primary text-decoration-underline me-3 mb-3">View Room Details</Link>
                                            <div className="btn btn-primary btn-md mb-3">
                                                <div className="form-check d-flex align-items-center ps-0">
                                                    <input className="form-check-input ms-0 mt-0 border border-white" name="book" type="checkbox" id="book2" />
                                                    <label className="form-check-label fs-13 text-white ms-2" htmlFor="book2">Select Room</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="place-item mb-4">
                                <div className="place-img">
                                    <Link to={routes.hotelDetails}>
                                        <ImageWithBasePath src="assets/img/hotels/hotel-03.jpg" className="img-fluid" alt="img" />
                                    </Link>
                                    <div className="fav-item justify-content-end" key={3} onClick={() => handleItemClick(3)}>
                                        <Link to="#" className={`fav-icon ${selectedItems[3] ? 'selected' : ''}`}>
                                            <i className="isax isax-heart5"></i>
                                        </Link>
                                    </div>
                                </div>
                                <div className="place-content pb-1">
                                    <div className="d-flex align-items-center justify-content-between flex-wrap">
                                        <div className="overflow-hidden">
                                            <h5 className="mb-2 d-inline-flex align-items-center text-truncate"><Link to={routes.hotelDetails}>Executive Suite 1Bedroom</Link></h5>
                                        </div>
                                        <div className="d-flex align-items-center text-nowrap mb-2">
                                            <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">4.9</span>
                                            <p className="fs-14">(380 Reviews)</p>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap">
                                        <p className="me-2 mb-2 d-inline-flex align-items-center"><i className="isax isax-tick-circle5 text-success me-2"></i>Reserve now, pay later</p>
                                    </div>
                                    <div className="d-flex align-items-center flex-wrap mb-2">
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Sleeps 3</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">1 Bed</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Family Room</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">35 m²</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Free WiFi</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill me-2 mb-2">Private Safe</span>
                                        <span className="badge badge-info-100 fs-10 fw-medium rounded-pill mb-2">Free Parking</span>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between flex-wrap border-top pt-3">
                                        <h5 className="text-primary me-2 mb-3">$450 <span className="fs-14 fw-normal text-default">/ Night</span></h5>
                                        <div className="d-flex align-items-center">
                                            <Link to="#" data-bs-toggle="modal" data-bs-target="#room-details" className="fs-14 link-primary text-decoration-underline me-3 mb-3">View Room Details</Link>
                                            <div className="btn btn-primary btn-md mb-3">
                                                <div className="form-check d-flex align-items-center ps-0">
                                                    <input className="form-check-input ms-0 mt-0 border border-white" name="book" type="checkbox" id="book3" />
                                                    <label className="form-check-label fs-13 text-white ms-2" htmlFor="book3">Select Room</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                    {/* /Availability */}

                    {/* Services */}
                    <div className="border-bottom pb-2 mb-4">
                        <h5 className="mb-3 fs-18">Services</h5>
                        <div className="row">
                            {displayHotel.services.slice(0, 9).map((service) => (
                                <div className="col-md-6 col-lg-4" key={service}>
                                    <div className="d-flex align-items-center mb-3">
                                        <span className="avatar avatar-md bg-primary-transparent rounded-circle me-2">
                                            <i className="isax isax-verify fs-16"></i>
                                        </span>
                                        <p>{service}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* /Services */}

                    {/* Gallery */}
                    <div className="border-bottom pb-4 mb-4">
                        <h5 className="mb-3 fs-18">Gallery</h5>
                        <Lightbox
                            open={open}
                            close={() => setOpen(false)}
                            slides={[
                            ...(displayHotel.gallery.length > 0 ? displayHotel.gallery : [displayHotel.image]).map((src: string) => ({ src })),
                            ]}
                        />
                        <div className="row row-cols-lg-6 row-cols-sm-4 row-cols-2 g-2">
                            {(displayHotel.gallery.length > 0 ? displayHotel.gallery : [displayHotel.image]).slice(0, 11).map((src: string) => (
                                <div className="col" key={src}>
                                    <Link className="galley-wrap" data-fancybox="gallery" to="#" onClick={() => setOpen(true)}>
                                        <ImageWithBasePath src={src} alt="img"/>
                                    </Link>
                                </div>
                            ))}
                            {(displayHotel.gallery.length > 0 ? displayHotel.gallery : [displayHotel.image]).length > 1 && (
                                <div className="col">
                                    <div className="galley-wrap more-gallery d-flex align-items-center justify-content-center">
                                        <Link data-fancybox="gallery" to="#" onClick={() => setOpen(true)} className="btn btn-white btn-xs"><i className="isax isax-image5 me-1"></i>See All</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                    </div>
                    {/* /Gallery */}

                    {/* Hotel Rules */}
                    <div className="border-bottom pb-2 mb-4">
                        <h5 className="mb-3 fs-18">Hotel Rules</h5>
                        <div className="card shadow-none mb-3">
                            <div className="card-body p-3 pb-0">
                                <h6 className="fw-medium mb-3">Check-In / Check-Out Policy</h6>
                                <div className="d-flex align-items-center">
                                    <div className="d-flex align-items-center me-4 mb-3">
                                        <i className="isax isax-clock fs-24 text-gray-9"></i>
                                        <div className="ms-2">
                                            <p className="mb-1">Check In</p>
                                            <h6>09:00 AM</h6>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <i className="isax isax-clock fs-24 text-gray-9"></i>
                                        <div className="ms-2">
                                            <p className="mb-1">Check Out</p>
                                            <h6>09:00 PM</h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`policy-wrap p-3 pb-2 mb-3 ${isPolicy ? '' : 'expanded'}`}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="fw-medium mb-2">Guarantee Policy</h6>
                                <Link to="#" onClick={()=>setIsPolicy(!isPolicy)} className="fs-14 fw-medium text-decoration-underline toggle-btn mb-2">{isPolicy ? 'Show Less':'Show More'}</Link>
                            </div>
                            <div className="policy-info pb-2" style={{display:isPolicy?'block':'none'}}>
                                <p className="mb-0">- A valid credit card will be required upon booking;</p>
                                <p className="mb-0">- For credit card reservations, the same card(s) must be presented upon check in at the respective hotels;</p>
                                <p className="mb-0">- Management reserves the right to cancel any reservations without notice if we are notified of any fraud or illegal activities associated with the full payments received.</p>
                            </div>
                        </div>
                        <div className={`policy-wrap p-3 pb-2 mb-3 ${isPolicy2 ? '' : 'expanded'}`}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="fw-medium mb-2">Children Policy</h6>
                                <Link to="#" onClick={()=>setIsPolicy2(!isPolicy2)} className="fs-14 fw-medium text-decoration-underline toggle-btn mb-2">{isPolicy2 ? 'Show Less':'Show More'}</Link>
                            </div>
                            <div className="policy-info pb-2 hide" style={{display:isPolicy2?'block':'none'}}>
                                <p className="mb-0">- A valid credit card will be required upon booking;</p>
                                <p className="mb-0">- For credit card reservations, the same card(s) must be presented upon check in at the respective hotels;</p>
                                <p className="mb-0">- Management reserves the right to cancel any reservations without notice if we are notified of any fraud or illegal activities associated with the full payments received.</p>
                            </div>
                        </div>
                        <div className={`policy-wrap p-3 pb-2 mb-3 ${isPolicy3 ? '' : 'expanded'}`}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="fw-medium mb-2">Cancellation/Amendment Policy</h6>
                                <Link to="#" onClick={()=>setIsPolicy3(!isPolicy3)} className="fs-14 fw-medium text-decoration-underline toggle-btn mb-2">{isPolicy3 ? 'Show Less':'Show More'}</Link>
                            </div>
                            <div className="policy-info pb-2 hide" style={{display:isPolicy3?'block':'none'}}>
                                <p className="mb-0">- A valid credit card will be required upon booking;</p>
                                <p className="mb-0">- For credit card reservations, the same card(s) must be presented upon check in at the respective hotels;</p>
                                <p className="mb-0">- Management reserves the right to cancel any reservations without notice if we are notified of any fraud or illegal activities associated with the full payments received.</p>
                            </div>
                        </div>
                        <div className={`policy-wrap p-3 pb-2 mb-3 ${isPolicy4 ? '' : 'expanded'}`}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="fw-medium mb-2">Late check-out Policy</h6>
                                <Link to="#" onClick={()=>setIsPolicy4(!isPolicy4)} className="fs-14 fw-medium text-decoration-underline toggle-btn mb-2">{isPolicy4 ? 'Show Less':'Show More'}</Link>
                            </div>
                            <div className="policy-info pb-2 hide" style={{display:isPolicy4?'block':'none'}}>
                                <p className="mb-0">- A valid credit card will be required upon booking;</p>
                                <p className="mb-0">- For credit card reservations, the same card(s) must be presented upon check in at the respective hotels;</p>
                                <p className="mb-0">- Management reserves the right to cancel any reservations without notice if we are notified of any fraud or illegal activities associated with the full payments received.</p>
                            </div>
                        </div>
                    </div>
                    {/* /Hotel Rules */}

                    {/* Services */}
                    <div className="border-bottom pb-2 mb-4">
                        <h5 className="mb-3 fs-18">Services</h5>
                        <div className="row">
                            <div className="col-md-6">
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Wheelchair accessible</p>
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Visual alarms in hallways</p>
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Wheelchair-accessible gym</p>
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Elevator</p>
                            </div>
                            <div className="col-md-6">
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Braille/raised signage</p>
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Wheelchair-accessible business center</p>
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Wheelchair-accessible lounge</p>
                                <p className="d-flex align-items-center mb-3"><i className="isax isax-magic-star fs-14 me-2"></i>Wheelchair-accessible concierge desk</p>
                            </div>
                        </div>
                    </div>
                    {/* /Services */}

                    {/* Frequently Asked Questions */}
                    <div className="border-bottom pb-3 mb-4">
                        <h5 className="mb-3 fs-18">Frequently Asked Questions</h5>
                        <div className="accordion faq-accordion" id="accordionFaq">
                            <div className="accordion-item show mb-2">
                                <h2 className="accordion-header">
									<button className="accordion-button fw-medium" type="button" data-bs-toggle="collapse" data-bs-target="#faq-collapseOne"  aria-controls="faq-collapseOne">
										Does offer free cancellation for a full refund?
									</button>
								</h2>
                                <div id="faq-collapseOne" className="accordion-collapse collapse show" data-bs-parent="#accordionFaq">
                                    <div className="accordion-body">
                                        <p className="mb-0">Does have fully refundable room rates available to book on our site. If you’ve booked a fully refundable room rate, this can be cancelled up to a few days before check-in depending on the property's cancellation policy. Just make sure to check this property's cancellation policy for the exact terms and conditions.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="accordion-item mb-2">
                                <h2 className="accordion-header">
									<button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-two"  aria-controls="faq-two">
										Is there a pool?
									</button>
								</h2>
                                <div id="faq-two" className="accordion-collapse collapse" data-bs-parent="#accordionFaq">
                                    <div className="accordion-body">
                                        <p className="mb-0">Does have fully refundable room rates available to book on our site. If you’ve booked a fully refundable room rate, this can be cancelled up to a few days before check-in depending on the property's cancellation  policy. Just make sure to check this property's cancellation policy for the exact terms and conditions.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="accordion-item mb-2">
                                <h2 className="accordion-header">
									<button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-three"  aria-controls="faq-three">
										Are pets allowed?
									</button>
								</h2>
                                <div id="faq-three" className="accordion-collapse collapse" data-bs-parent="#accordionFaq">
                                    <div className="accordion-body">
                                        <p className="mb-0">Does have fully refundable room rates available to book on our site. If you’ve booked a fully refundable room rate, this can be cancelled up to a few days before check-in depending on the property's cancellation  policy. Just make sure to check this property's cancellation policy for the exact terms and conditions.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="accordion-item mb-2">
                                <h2 className="accordion-header">
									<button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-four"  aria-controls="faq-four">
										Is airport shuttle service offered?
									</button>
								</h2>
                                <div id="faq-four" className="accordion-collapse collapse" data-bs-parent="#accordionFaq">
                                    <div className="accordion-body">
                                        <p className="mb-0">Does have fully refundable room rates available to book on our site. If you’ve booked a fully refundable room rate, this can be cancelled up to a few days before check-in depending on the property's cancellation  policy. Just make sure to check this property's cancellation policy for the exact terms and conditions.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="accordion-item mb-2">
                                <h2 className="accordion-header">
									<button className="accordion-button fw-medium collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-five"  aria-controls="faq-five">
										What are the check-in and check-out times?
									</button>
								</h2>
                                <div id="faq-five" className="accordion-collapse collapse" data-bs-parent="#accordionFaq">
                                    <div className="accordion-body">
                                        <p className="mb-0">Does have fully refundable room rates available to book on our site. If you’ve booked a fully refundable room rate, this can be cancelled up to a few days before check-in depending on the property's cancellation policy. Just make sure to check this property's cancellation policy for the exact terms and conditions.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /Frequently Asked Questions */}

                    <Reviews/>
                    <Lightbox
                            open={open2}
                            close={() => setOpen2(false)}
                            slides={[
                            { src: "/react/assets/img/hotels/hotel-large-01.jpg" },
                            { src: "/react/assets/img/hotels/hotel-large-02.jpg" },
                            { src: "/react/assets/img/hotels/hotel-large-03.jpg" },
                            { src: "/react/assets/img/hotels/hotel-large-04.jpg" },
                            { src: "/react/assets/img/hotels/hotel-large-05.jpg" },
                            { src: "/react/assets/img/hotels/hotel-large-06.jpg" },
                            ]}
                        />
                </div>
                {/* /Hotel Details */}

                {/* Sidebar Details */}
                <div className="col-xl-4 ">

                    <StickyContent hotel={displayHotel} />

                </div>
                {/* /Sidebar Details */}

            </div>
        </div>
    </div>
    <RoomDetailModal/>
    </>
  )
}

export default HotelDetails
