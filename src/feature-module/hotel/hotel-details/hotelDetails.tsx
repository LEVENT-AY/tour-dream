import { useEffect, useMemo, useRef, useState } from "react";
import Slider from "react-slick";
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link, useSearchParams } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import StickyContent from './stickyContent';
import { formatHotelPrice } from '../../../core/common/hotelPricing';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { all_routes } from "../../router/all_routes";
import { fetchHotelById, fetchHotels } from '../../../core/services/firebaseServices';

type FaqItem = {
    question: string;
    answer: string;
};

type ReviewItem = {
    text: string;
    date?: string;
};

type HotelDetailsView = {
    id: string;
    title: string;
    location: string;
    rating: string;
    reviewsCount: number;
    reviewsLabel: string;
    reviewSummary: string;
    description: string;
    image: string;
    gallery: string[];
    amenities: string[];
    roomTypes: string[];
    highlights: string[];
    services: string[];
    nearbyLandmarks: string[];
    faq: FaqItem[];
    reviews: ReviewItem[];
    checkInTime: string;
    checkOutTime: string;
    providerMessage: string;
    roomInventoryText: string;
    bookingMode: string;
    bookingEnabled: boolean;
    published: boolean;
    latitude: number | null;
    longitude: number | null;
    priceFrom: number | null;
    priceCurrency: string;
    priceUnit: string;
    priceNote: string;
    priceStatus: string;
    sourceName: string;
    sourceUrl: string;
};

const toStringList = (value: unknown): string[] =>
    Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
        : typeof value === 'string' && value.trim()
            ? [value.trim()]
            : [];

const firstTextValue = (...values: unknown[]) =>
    values.find((value) => typeof value === 'string' && value.trim()) as string | undefined;

const hasMojibake = (value: string) => /[ÃÂ�]/.test(value);

const repairMojibake = (value: string) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text || !hasMojibake(text)) return text;
    try {
        const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
        return new TextDecoder('utf-8').decode(bytes).replace(/\u0000/g, '').trim();
    } catch {
        return text;
    }
};

const cleanText = (value: unknown) => repairMojibake(String(value || '').replace(/\s+/g, ' ').trim());

const normalizeUniqueStrings = (...values: unknown[]) =>
    [...new Set(values.flatMap((value) => toStringList(value).map((item) => cleanText(item))).filter(Boolean))];

const normalizeFaq = (value: unknown): FaqItem[] =>
    Array.isArray(value)
        ? value
            .map((item) => ({
                question: cleanText((item as Record<string, unknown>)?.question),
                answer: cleanText((item as Record<string, unknown>)?.answer),
            }))
            .filter((item) => item.question && item.answer)
        : [];

const normalizeReviews = (value: unknown): ReviewItem[] =>
    Array.isArray(value)
        ? value
            .map((item) => ({
                text: cleanText((item as Record<string, unknown>)?.text),
                date: cleanText((item as Record<string, unknown>)?.date),
            }))
            .filter((item) => item.text)
        : [];

const normalizeGallery = (data?: Record<string, any> | null) =>
    [...new Set([
        ...toStringList(data?.gallery),
        ...toStringList(data?.galleryImages),
        ...toStringList(data?.images),
        ...toStringList(data?.image ? [data.image] : []),
    ].map((item) => item.trim()).filter((item) => /^https?:\/\//i.test(item) && !/assets\/img\/hotels|hotel-large-|hotel-thumb-/i.test(item)))];

const normalizeHotelDetails = (data?: Record<string, any> | null): HotelDetailsView | null => {
    if (!data) {
        return null;
    }

    const gallery = normalizeGallery(data);
    const image = firstTextValue(data?.image, data?.mainImage, data?.thumbnail, gallery[0]) || '';
    const title = cleanText(firstTextValue(data?.title, data?.name, data?.hotelName, data?.propertyName) || '');
    const locationParts = normalizeUniqueStrings(data?.city, data?.region ? `${data.region}, Tunisia` : '', data?.location);
    const location = locationParts[0] || cleanText(firstTextValue(data?.address, data?.country) || '');
    const ratingValue = typeof data?.ratingValue === 'number' ? data.ratingValue : Number(data?.ratingValue ?? data?.rating);
    const reviewsCountValue = typeof data?.reviewsCount === 'number' ? data.reviewsCount : Number(data?.reviewsCount);
    const faq = normalizeFaq(data?.faq);
    const reviews = normalizeReviews(data?.reviews);
    const amenities = normalizeUniqueStrings(data?.amenities);
    const services = normalizeUniqueStrings(data?.services, data?.amenities);
    const roomTypes = normalizeUniqueStrings(data?.roomTypes);
    const highlights = normalizeUniqueStrings(data?.highlights);
    const nearbyLandmarks = normalizeUniqueStrings(data?.nearbyAttractions, data?.nearbyLandmarks, data?.landmarks);
    const providerMessage = 'DreamsTour will confirm availability and price after request.';

    return {
        id: typeof data?.id === 'string' && data.id.trim() ? data.id : '',
        title,
        location,
        rating: Number.isFinite(ratingValue) && ratingValue > 0 ? String(ratingValue) : '',
        reviewsCount: Number.isFinite(reviewsCountValue) && reviewsCountValue > 0 ? reviewsCountValue : reviews.length,
        reviewsLabel: Number.isFinite(reviewsCountValue) && reviewsCountValue > 0 ? `(${reviewsCountValue} Reviews)` : reviews.length > 0 ? `(${reviews.length} Reviews)` : '',
        reviewSummary: cleanText(data?.reviewSummary || ''),
        description: cleanText(firstTextValue(data?.description, data?.rawSource?.detail?.description) || ''),
        image,
        gallery: gallery.length > 0 ? gallery : (image ? [image] : []),
        amenities,
        roomTypes,
        highlights,
        services,
        nearbyLandmarks,
        faq,
        reviews,
        checkInTime: cleanText(data?.checkInTime || ''),
        checkOutTime: cleanText(data?.checkOutTime || ''),
        providerMessage,
        roomInventoryText: cleanText(data?.roomInventoryText || ''),
        bookingMode: cleanText(data?.bookingMode || ''),
        bookingEnabled: data?.bookingEnabled !== false,
        published: data?.published === true,
        latitude: Number.isFinite(Number(data?.latitude)) ? Number(data?.latitude) : null,
        longitude: Number.isFinite(Number(data?.longitude)) ? Number(data?.longitude) : null,
        priceFrom: Number.isFinite(Number(data?.priceFrom)) ? Number(data.priceFrom) : null,
        priceCurrency: cleanText(data?.priceCurrency || ''),
        priceUnit: cleanText(data?.priceUnit || 'night'),
        priceNote: cleanText(data?.priceNote || ''),
        priceStatus: cleanText(data?.priceStatus || ''),
        sourceName: cleanText(data?.sourceName || ''),
        sourceUrl: cleanText(data?.sourceUrl || ''),
    };
};

const isPublicHotelRecord = (data?: Record<string, any> | null) => {
    if (!data || data.published !== true) return false;
    const approvalStatus = String(data.approvalStatus || data.status || 'approved').toLowerCase();
    return approvalStatus !== 'rejected' && approvalStatus !== 'suspended';
};

const HotelDetails = () => {
    const routes = all_routes;
    const [searchParams] = useSearchParams();
    const [openGallery, setOpenGallery] = useState(false);
    const [hotelData, setHotelData] = useState<any>(null);
    const [hotelNotFound, setHotelNotFound] = useState(false);
    const sliderForRef = useRef<any>(null);
    const sliderNavRef = useRef<any>(null);
    const [navSync, setNavSync] = useState<any>({ sliderFor: null, sliderNav: null });

    const hotelId = searchParams.get('id');
    const initialCheckInDate = searchParams.get('checkInDate') || '';
    const initialCheckOutDate = searchParams.get('checkOutDate') || '';
    const initialAdults = Number(searchParams.get('adults') || 2);
    const initialRooms = Number(searchParams.get('rooms') || 1);
    const initialChildren = Number(searchParams.get('children') || 0);
    const initialChildAges = searchParams.get('childAges') || '';

    useEffect(() => {
        let isMounted = true;

        const loadHotel = async () => {
            if (!hotelId) {
                if (isMounted) {
                    setHotelData(null);
                    setHotelNotFound(true);
                }
                return;
            }

            try {
                const data = await fetchHotelById(hotelId);
                if (isMounted && isPublicHotelRecord(data)) {
                    setHotelData(data);
                    setHotelNotFound(false);
                    return;
                }
            } catch {
                // Fall through.
            }

            try {
                const hotels = await fetchHotels();
                const matchedHotel = hotels.find((hotel) => hotel.id === hotelId);
                if (isMounted && matchedHotel && isPublicHotelRecord(matchedHotel)) {
                    setHotelData(matchedHotel);
                    setHotelNotFound(false);
                    return;
                }
            } catch {
                // Ignore and show unavailable state below.
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

    useEffect(() => {
        setNavSync({
            sliderFor: sliderNavRef.current,
            sliderNav: sliderForRef.current,
        });
    }, []);

    const displayHotel = useMemo(() => normalizeHotelDetails(hotelData), [hotelData]);
    const isFirestoreBackedHotel = Boolean(hotelId && hotelData && isPublicHotelRecord(hotelData) && displayHotel);

    const breadcrumbs = [
        {
            label: 'Hotel Details',
            active: false,
            link: routes.home1,
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

    const sliderForSettings = {
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: true,
        arrows: true,
        fade: true,
        asNavFor: navSync.sliderFor,
    };

    const sliderNavSettings = {
        slidesToShow: 5,
        slidesToScroll: 1,
        dots: false,
        arrows: true,
        infinite: false,
        focusOnSelect: true,
        asNavFor: navSync.sliderNav,
        responsive: [
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 4,
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
        ],
    };

    const availabilityPrice = isFirestoreBackedHotel && displayHotel
        ? formatHotelPrice(
            {
                priceFrom: displayHotel.priceFrom,
                priceCurrency: displayHotel.priceCurrency,
                priceUnit: displayHotel.priceUnit,
                priceNote: displayHotel.priceNote,
            },
            { prefix: 'Starts From', fallbackLabel: 'Price on request' },
        )
        : { headline: 'Price on request', note: undefined, hasPrice: false };

    return (
        <>
            <Breadcrumb title="Hotel Details" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-01" />
            <div className="content">
                <div className="container">
                    {!isFirestoreBackedHotel || !displayHotel ? (
                        <div className="alert alert-warning mb-0" role="alert">
                            {hotelNotFound
                                ? 'This hotel is not publicly available yet. Draft hotels stay in Admin only until they are published.'
                                : 'Hotel details are not available right now.'}
                        </div>
                    ) : (
                        <div className="row">
                            <div className="col-xl-8">
                                <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                                    <div className="mb-2">
                                        <h4 className="mb-1">{displayHotel.title}</h4>
                                        <div className="d-flex align-items-center flex-wrap">
                                            <p className="fs-14 mb-2 me-3 pe-3 border-end">
                                                <i className="isax isax-buildings me-2"></i>Hotel
                                            </p>
                                            <p className="fs-14 mb-2 me-3 pe-3 border-end">
                                                <i className="isax isax-location5 me-2"></i>{displayHotel.location}
                                                <Link to="#location" className="link-primary text-decoration-underline fw-medium ms-2">View Location</Link>
                                            </p>
                                            {(displayHotel.rating || displayHotel.reviewsLabel) && (
                                                <div className="d-flex align-items-center mb-2">
                                                    {displayHotel.rating && <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">{displayHotel.rating}</span>}
                                                    <p className="fs-14">
                                                        {displayHotel.reviewsLabel ? <Link to="#reviews">{displayHotel.reviewsLabel}</Link> : 'No reviews yet'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {displayHotel.highlights.length > 0 && (
                                    <div className="d-flex align-items-center justify-content-between flex-wrap mb-3">
                                        <div className="d-flex align-items-center flex-wrap">
                                            {displayHotel.highlights.slice(0, 3).map((item) => (
                                                <p key={item} className="fs-14 me-2 mb-2">
                                                    <i className="isax isax-tick-circle5 text-success me-2"></i>{item}
                                                </p>
                                            ))}
                                        </div>
                                        {displayHotel.roomInventoryText && (
                                            <span className="badge badge-light text-gray-9 badge-md fs-13 fw-medium rounded-pill mb-2">
                                                {displayHotel.roomInventoryText}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="border-bottom pb-4 mb-4">
                                    <div className="service-wrap mb-4">
                                        <div className="slider-wrap">
                                            <Slider {...sliderForSettings} ref={sliderForRef} className="owl-carousel slicknavfor service-carousel nav-center mb-4">
                                                {displayHotel.gallery.map((img) => (
                                                    <div className="service-img" key={img}>
                                                        <ImageWithBasePath src={img} className="img-fluid" alt={displayHotel.title} />
                                                    </div>
                                                ))}
                                            </Slider>
                                            <Lightbox
                                                open={openGallery}
                                                close={() => setOpenGallery(false)}
                                                slides={displayHotel.gallery.map((src: string) => ({ src }))}
                                            />
                                            <Link
                                                data-fancybox="gallery"
                                                className="btn btn-white btn-xs view-btn"
                                                onClick={() => setOpenGallery(true)}
                                                to="#"
                                            >
                                                <i className="isax isax-image me-1" />
                                                See All
                                            </Link>
                                        </div>
                                        <Slider {...sliderNavSettings} ref={sliderNavRef} className="owl-carousel slider-nav-thumbnails nav-center">
                                            {displayHotel.gallery.map((img) => (
                                                <div key={img}>
                                                    <ImageWithBasePath src={img} className="img-fluid" alt={displayHotel.title} />
                                                </div>
                                            ))}
                                        </Slider>
                                    </div>

                                    <h5 className="mb-3 fs-18">Description</h5>
                                    <p>{displayHotel.description}</p>
                                </div>

                                {displayHotel.highlights.length > 0 && (
                                    <div className="border-bottom pb-4 mb-4">
                                        <h5 className="mb-3 fs-18">Highlights</h5>
                                        {displayHotel.highlights.map((highlight) => (
                                            <div className="highlight-box" key={highlight}>
                                                <p className="d-flex align-items-center">
                                                    <i className="isax isax-star-1 text-orange"></i>{highlight}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

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

                                {displayHotel.roomTypes.length > 0 && (
                                    <div className="border-bottom pb-2 mb-4">
                                        <h5 className="mb-3 fs-18">Room Types</h5>
                                        <div className="row">
                                            {displayHotel.roomTypes.map((roomType) => (
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
                                )}

                                <div className="border-bottom pb-2 mb-4" id="availability">
                                    <h5 className="mb-3 fs-18">Availability</h5>
                                    <div className="card shadow-none border">
                                        <div className="card-body">
                                            <p className="fs-16 fw-medium mb-1">{availabilityPrice.headline}</p>
                                            <p className="text-muted mb-2">
                                                {availabilityPrice.note || 'Final price and availability are confirmed after request'}
                                            </p>
                                            <p className="mb-0 text-muted">
                                                This hotel is available by request only. We confirm room options and final pricing after you send your request.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-bottom pb-2 mb-4">
                                    <h5 className="mb-3 fs-18">Services</h5>
                                    <div className="row">
                                        {displayHotel.services.map((service) => (
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

                                <div className="border-bottom pb-4 mb-4">
                                    <h5 className="mb-3 fs-18">Gallery</h5>
                                    <div className="row row-cols-lg-6 row-cols-sm-4 row-cols-2 g-2">
                                        {displayHotel.gallery.slice(0, 11).map((src: string) => (
                                            <div className="col" key={src}>
                                                <Link className="galley-wrap" data-fancybox="gallery" to="#" onClick={() => setOpenGallery(true)}>
                                                    <ImageWithBasePath src={src} alt={displayHotel.title} />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-bottom pb-2 mb-4">
                                    <h5 className="mb-3 fs-18">Hotel Rules</h5>
                                    <div className="card shadow-none mb-3">
                                        <div className="card-body p-3">
                                            <h6 className="fw-medium mb-3">Check-In / Check-Out Policy</h6>
                                            <div className="d-flex align-items-center">
                                                <div className="d-flex align-items-center me-4 mb-3">
                                                    <i className="isax isax-clock fs-24 text-gray-9"></i>
                                                    <div className="ms-2">
                                                        <p className="mb-1">Check In</p>
                                                        <h6>{displayHotel.checkInTime || 'Confirmed after request'}</h6>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center mb-3">
                                                    <i className="isax isax-clock fs-24 text-gray-9"></i>
                                                    <div className="ms-2">
                                                        <p className="mb-1">Check Out</p>
                                                        <h6>{displayHotel.checkOutTime || 'Confirmed after request'}</h6>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-muted mb-0">Detailed hotel policies are confirmed after request.</p>
                                        </div>
                                    </div>
                                </div>

                                {displayHotel.faq.length > 0 && (
                                    <div className="border-bottom pb-3 mb-4">
                                        <h5 className="mb-3 fs-18">Frequently Asked Questions</h5>
                                        <div className="accordion faq-accordion" id="accordionFaq">
                                            {displayHotel.faq.map((item, index) => {
                                                const collapseId = `faq-item-${index}`;
                                                const isFirst = index === 0;
                                                return (
                                                    <div className="accordion-item mb-2" key={collapseId}>
                                                        <h2 className="accordion-header">
                                                            <button
                                                                className={`accordion-button fw-medium ${isFirst ? '' : 'collapsed'}`}
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target={`#${collapseId}`}
                                                                aria-controls={collapseId}
                                                            >
                                                                {item.question}
                                                            </button>
                                                        </h2>
                                                        <div id={collapseId} className={`accordion-collapse collapse ${isFirst ? 'show' : ''}`} data-bs-parent="#accordionFaq">
                                                            <div className="accordion-body">
                                                                <p className="mb-0">{item.answer}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="border-bottom pb-3 mb-4" id="reviews">
                                    <h5 className="mb-3 fs-18">Reviews</h5>
                                    {displayHotel.reviews.length > 0 ? (
                                        <>
                                            {displayHotel.reviewSummary && <p className="text-muted mb-3">{displayHotel.reviewSummary}</p>}
                                            {displayHotel.reviews.slice(0, 6).map((review, index) => (
                                                <div className="border rounded p-3 mb-3" key={`${review.date || 'review'}-${index}`}>
                                                    <p className="mb-1">{review.text}</p>
                                                    {review.date && <p className="text-muted fs-14 mb-0">{review.date}</p>}
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <p className="text-muted mb-0">No source-backed review details are available yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="col-xl-4 ">
                                <StickyContent
                                    hotel={{
                                        ...displayHotel,
                                        providerPhone: '',
                                        providerEmail: '',
                                        viewsCount: hotelData?.viewsCount,
                                    } as any}
                                    initialCheckInDate={initialCheckInDate}
                                    initialCheckOutDate={initialCheckOutDate}
                                    initialAdults={initialAdults}
                                    initialRooms={initialRooms}
                                    initialChildren={initialChildren}
                                    initialChildAges={initialChildAges}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default HotelDetails;
