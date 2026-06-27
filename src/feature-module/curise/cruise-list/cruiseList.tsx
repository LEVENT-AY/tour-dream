import { useState } from 'react'
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import FliterSidebar from '../curise-grid/fliterSidebar'
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import Slider from 'react-slick';
import { all_routes } from '../../router/all_routes';
import CruiseSearch from '../cruiseSearch';
import FirestoreCruiseList from './FirestoreCruiseList';

const CruiseList = () => {
    const routes = all_routes
    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Cruise',
            link: routes.allService1,
            active: false,
        },
        {
            label: 'Cruise',
            active: true,
        },
        {
            label: 'Cruise Grid',
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
        <>
            <Breadcrumb
                title="Cruise"
                breadcrumbs={breadcrumbs}
                backgroundClass="breadcrumb-bg-06"
            />
            <div className="content">
                <div className="container">
                    <CruiseSearch />

                    <div className="row">

                        {/* Sidebar */}
                        <div className="col-xl-3 col-lg-4 ">
                            <FliterSidebar />
                        </div>
                        {/* /Sidebar */}

                        <div className="col-xl-9 col-lg-8 theiaStickySidebar">
                            <div className="d-flex align-items-center justify-content-between flex-wrap">
                                <h6 className="mb-3">Cruises in Tunisia</h6>
                                <div className="d-flex align-items-center flex-wrap">
                                    <div className="list-item d-flex align-items-center mb-3">
                                        <Link to={routes.cruiseGrid} className="list-icon me-2"><i className="isax isax-grid-1"></i></Link>
                                        <Link to={routes.cruiseList} className="list-icon active me-2"><i className="isax isax-firstline"></i></Link>
                                        <Link to={routes.cruiseMap} className="list-icon me-2"><i className="isax isax-map-1"></i></Link>
                                    </div>
                                    <div className="dropdown mb-3">
                                        <Link to="#" className="dropdown-toggle py-2" data-bs-toggle="dropdown" >
                                            <span className="fw-medium text-gray-9">Sort By : </span>Recommended
                                        </Link>
                                        <div className="dropdown-menu dropdown-sm">
                                            <form >
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
                                                    <button type="submit" className="btn btn-primary btn-sm">Apply</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-info br-10 p-3 pb-2 mb-4">
                                <div className="d-flex align-items-center justify-content-between flex-wrap">
                                    <p className="fs-14 fw-medium mb-2 d-inline-flex align-items-center"><i className="isax isax-info-circle me-2"></i>Save an average of 15% on thousands of cruise when you're signed in</p>
                                    <Link to={routes.login} className="btn btn-white btn-sm mb-2">Sign In</Link>
                                </div>
                            </div>
                            <FirestoreCruiseList />
                            <div className="hotel-list list-full">
                                <div className="row justify-content-center">
                                    <div className="col-md-12">
                                        {/* Cruise List */}
                                        <div className="place-item mb-4">
                                            <div className="place-img">
                                                <div className="img-slider image-slide owl-carousel nav-center">
                                                    <Slider {...imgslideroption}>
                                                        <div className="slide-images">
                                                            <Link to={routes.cruiseDetails}>
                                                                <ImageWithBasePath src="assets/img/cruise/cruise-05.jpg" className="img-fluid" alt="img" />
                                                            </Link>
                                                        </div>
                                                        <div className="slide-images">
                                                            <Link to={routes.cruiseDetails}>
                                                                <ImageWithBasePath src="assets/img/cruise/cruise-02.jpg" className="img-fluid" alt="img" />
                                                            </Link>
                                                        </div>
                                                        <div className="slide-images">
                                                            <Link to={routes.cruiseDetails}>
                                                                <ImageWithBasePath src="assets/img/cruise/cruise-04.jpg" className="img-fluid" alt="img" />
                                                            </Link>
                                                        </div>
                                                        <div className="slide-images">
                                                            <Link to={routes.cruiseDetails}>
                                                                <ImageWithBasePath src="assets/img/cruise/cruise-03.jpg" className="img-fluid" alt="img" />
                                                            </Link>
                                                        </div>
                                                    </Slider>
                                                </div>
                                                <div className="fav-item" key={1} onClick={() => handleItemClick(1)}>
                                                    <Link to="#" className={`fav-icon ${selectedItems[1] ? 'selected' : ''}`}>
                                                        <i className="isax isax-heart5"></i>
                                                    </Link>
                                                    <span className="badge bg-info d-inline-flex align-items-center"><i className="isax isax-ranking me-1"></i>Trending</span>
                                                </div>
                                            </div>
                                            <div className="place-content">
                                                <div className="d-flex justify-content-between align-items-center flex-wrap row-gap-2 mb-3">
                                                    <div>
                                                        <h5 className="mb-1 text-truncate"><Link to={routes.cruiseDetails}>Super Aquamarine</Link></h5>
                                                        <p className="d-flex align-items-center fs-14"><i className="isax isax-location5 me-2"></i>Tunis</p>
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <Link to="#" className="d-flex align-items-center overflow-hidden border-end pe-2 me-2">
                                                            <span className="avatar avatar-sm flex-shrink-0 me-2">
                                                                <ImageWithBasePath src="assets/img/users/user-08.jpg" className="rounded-circle" alt="img" />
                                                            </span>
                                                            <p className="fs-14 text-truncate">Beth Williams</p>
                                                        </Link>
                                                        <span className="badge badge-warning badge-xs text-gray-9 fs-13 fw-medium me-2">4.9</span>
                                                        <p className="fs-14 text-truncate">(0)</p>
                                                    </div>
                                                </div>
                                                <p className="fs-14 line-ellipsis mb-3">Embark on a luxurious cruise where breathtaking destinations meet world-class comfort and entertainment.</p>
                                                <div className="d-flex align-items-center justify-content-between cruise-list-item border-top flex-wrap row-gap-2 pt-3 mb-3">
                                                    <p className="fs-14 mb-0"><i className="isax isax-calendar-2 text-gray-6 me-1"></i>Year : <span className="text-dark fw-medium">2021</span></p>
                                                    <p className="fs-14 mb-0"><i className="isax isax-user me-1"></i>Guests : <span className="text-dark fw-medium">4</span></p>
                                                    <p className="fs-14 mb-0"><i className="isax isax-fatrows text-gray-6 me-1"></i>Width : <span className="text-dark fw-medium">88.47 m</span></p>
                                                    <p className="fs-14"><i className="isax isax-flash-1 me-1"></i>Speed : <span className="text-dark fw-medium">19 Knots</span></p>
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                                    <h6 className="d-flex align-items-center"><i className="isax isax-home-wifi ms-2 me-2"></i><i className="isax isax-scissor me-2"></i><i className="isax isax-profile-2user me-2"></i><i className="isax isax-wind-2 me-2"></i><Link to="#" className="fs-14 fw-normal text-default d-inline-block">+2</Link></h6>
                                                    <h5 className="text-primary text-nowrap me-2">500 TND <span className="fs-14 fw-normal text-default">/ day</span></h5>
                                                </div>
                                            </div>
                                        </div>
                                        {/* /Cruise List */}

                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}

export default CruiseList
