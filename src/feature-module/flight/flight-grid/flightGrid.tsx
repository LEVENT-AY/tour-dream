import { useState, useEffect } from 'react'
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import { getCategoryFallbackSrc } from '../../../core/services/firebaseStorage';
import { all_routes } from '../../router/all_routes';
import FlightSearch from '../flightSearch';
import FlightFilter from '../flightFilter';
import { fetchFlights } from '../../../core/services/firebaseServices';


const FlightGrid = () => {
    const routes = all_routes
    const [flights, setFlights] = useState<any[]>([]);
    const [loadingFlights, setLoadingFlights] = useState(true);

    useEffect(() => {
        const getFlights = async () => {
            try {
                const data = await fetchFlights();
                setFlights(data);
            } catch (error) {
                console.error("Error loading flights:", error);
            } finally {
                setLoadingFlights(false);
            }
        };
        getFlights();
    }, []);

    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Flight',
            link: routes.allService1,
            active: false,
        },
        {
            label: 'Flight',
            active: false,
        },
        {
            label: 'Flight Grid',
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
            { breakpoint: 1400, settings: { slidesToShow: 1 } },
            { breakpoint: 1300, settings: { slidesToShow: 1 } },
            { breakpoint: 992, settings: { slidesToShow: 1 } },
            { breakpoint: 576, settings: { slidesToShow: 1 } },
            { breakpoint: 0, settings: { slidesToShow: 1 } },
        ],
    };

    const [selectedItems, setSelectedItems] = useState<boolean[]>([]);
    const handleItemClick = (index: number) => {
        setSelectedItems((prev) => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
    };

    return (
        <>
            <Breadcrumb title="Flight" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-05" />
            <div className="content">
                <div className="container">
                    <FlightSearch />


                    <div className="row">

                        <FlightFilter />

                        <div className="col-xl-9 col-lg-9">
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="mb-3">{flights.length} Flights Found on Your Search</h6>
                                <div className="d-flex align-items-center flex-wrap">
                                    <div className="list-item d-flex align-items-center mb-3">
                                        <Link to={routes.flightGrid} className="list-icon active me-2"><i className="isax isax-grid-1"></i></Link>
                                        <Link to={routes.flightList} className="list-icon  me-2"><i className="isax isax-firstline"></i></Link>
                                    </div>
                                    <div className="dropdown mb-3">
                                        <Link to="#" className="dropdown-toggle py-2" data-bs-toggle="dropdown" >
                                            <span className="fw-medium text-gray-9">Sort By : </span>Recommended
                                        </Link>
                                        <div className="dropdown-menu dropdown-sm">
                                            <form action={routes.flightGrid}>
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
                                    <p className="fs-14 fw-medium mb-2 d-inline-flex align-items-center"><i className="isax isax-info-circle me-2"></i>Save an average of 15% on thousands of flights when you're signed in</p>
                                    <Link to={routes.login} className="btn btn-white btn-sm mb-2">Sign In</Link>
                                </div>
                            </div>
                            <div className="row justify-content-center">

                                {loadingFlights ? (
                                    <div className="text-center py-5 w-100">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2 text-muted">Loading flights from database...</p>
                                    </div>
                                ) : flights.length === 0 ? (
                                    <div className="text-center py-5 w-100">
                                        <p className="text-muted">No flights found in database.</p>
                                    </div>
                                ) : (
                                    flights.map((flight, index) => (
                                        <div className="col-xxl-4 col-md-6 d-flex" key={flight.id || index}>
                                            <div className={`place-item mb-4 flex-fill ${flight.gallery && flight.gallery.length > 1 ? 'common-grid-slider' : ''}`}>
                                                <div className="place-img">
                                                    {flight.gallery && flight.gallery.length > 1 ? (
                                                        <div className="img-slider image-slide owl-carousel nav-center">
                                                            <Slider {...imgslideroption}>
                                                                {flight.gallery.map((img: string, i: number) => (
                                                                    <div className="slide-images" key={i}>
                                                                        <Link to={routes.flightDetails}>
                                                                            <ImageWithBasePath src={img} className="img-fluid" alt={flight.title || "Flight image"} fallbackSrc={getCategoryFallbackSrc("flights")} />
                                                                        </Link>
                                                                    </div>
                                                                ))}
                                                            </Slider>
                                                        </div>
                                                    ) : (
                                                        <Link to={routes.flightDetails}>
                                                            <ImageWithBasePath src={flight.image || flight.gallery?.[0]} className="img-fluid" alt={flight.title || "Flight image"} fallbackSrc={getCategoryFallbackSrc("flights")} />
                                                        </Link>
                                                    )}
                                                    <div className="fav-item" onClick={() => handleItemClick(index)}>
                                                        <div className="d-flex align-items-center">
                                                            <Link to="#" className={`fav-icon ${selectedItems[index] ? 'selected' : ''}`}>
                                                                <i className="isax isax-heart5"></i>
                                                            </Link>
                                                            {flight.badge && <span className="badge bg-indigo">{flight.badge}</span>}
                                                        </div>
                                                        <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium rounded">{flight.rating}</span>
                                                    </div>
                                                </div>
                                                <div className="place-content">
                                                    <div className="flight-loc d-flex align-items-center justify-content-between mb-2">
                                                        <span className="loc-name d-inline-flex align-items-center"><i className="isax isax-airplane rotate-45 me-2"></i>{flight.departureCity}</span>
                                                        <Link to="#" className="arrow-icon flex-shrink-0"><i className="isax isax-arrow-2"></i></Link>
                                                        <span className="loc-name d-inline-flex align-items-center"><i className="isax isax-airplane rotate-135 me-2"></i>{flight.arrivalCity}</span>
                                                    </div>
                                                    <h5 className="text-truncate mb-1"><Link to={routes.flightDetails}>{flight.title}</Link></h5>
                                                    <div className="d-flex align-items-center mb-2">
                                                        <span className="avatar avatar-sm me-2">
                                                            <ImageWithBasePath src="assets/img/icons/airindia.svg" className="rounded-circle" alt="icon" />
                                                        </span>
                                                        <p className="fs-14 mb-0 me-2">{flight.airline}</p>
                                                        <p className="fs-14 mb-0"><i className="ti ti-point-filled text-primary me-2"></i>{flight.stopInfo}</p>
                                                    </div>
                                                    <div className="date-info p-2 mb-3">
                                                        <p className="d-flex align-items-center"><i className="isax isax-calendar-2 me-2"></i>{flight.dates}</p>
                                                    </div>
                                                    <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                                        <h6 className="text-primary"><span className="fs-14 fw-normal text-default">From </span>${flight.price}</h6>
                                                        <div className="d-flex align-items-center">
                                                            {flight.seatsLeft && <span className="badge bg-outline-success fs-10 fw-medium me-2">{flight.seatsLeft} Seats Left</span>}
                                                            <Link to="#" className="avatar avatar-sm">
                                                                <ImageWithBasePath src="assets/img/users/user-08.jpg" className="rounded-circle" alt="img" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}

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
        </>
    )
}

export default FlightGrid;
