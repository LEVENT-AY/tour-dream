import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";

const Recomanded = () => {
  return (
    <>
      <section className="section recommended-sec">
        <div className="container">
          <div className="section-header-eight wow fadeInUp">
            <h2>
              Popular Tunisia <br />{" "}
              <ImageWithBasePath
                src="./assets/img/bg/heading-bg-03.png"
                alt=""
              />{" "}
              Tours &amp; Highlights{" "}
            </h2>
          </div>
          <div className="row row-gap-4">
            <div className="col-lg-3 col-md-6">
              <div className="recommended-list-item wow fadeInUp">
                <div className="recommended-img">
                  <Link to={all_routes.cruiseList} tabIndex={0}>
                    <ImageWithBasePath
                      src="assets/img/destination/destination-54.jpg"
                      className="img-fluid"
                      alt="Medina Walk in Tunis Medina"
                    />
                  </Link>
                    <div className="fav-item fs-14">
                    <span className="me-2">
                      <i className="isax isax-calendar-tick me-1" />3 Days, 2
                      Night
                    </span>
                  </div>
                </div>
                  <div className="recommended-content">
                  <div className="mb-1 home-eight-title text-dark">
                    <Link to={all_routes.cruiseList}>Medina Walk</Link>
                  </div>
                  <span>Tunis Medina</span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="recommended-list-item wow fadeInUp">
                <div className="recommended-img">
                  <Link to={all_routes.cruiseList} tabIndex={0}>
                    <ImageWithBasePath
                      src="assets/img/destination/destination-55.jpg"
                      className="img-fluid"
                      alt="Sahara Escape in Douz, Sahara Desert"
                    />
                  </Link>
                    <div className="fav-item fs-14">
                    <span className="me-2">
                      <i className="isax isax-calendar-tick me-1" />5 Days, 4
                      Nights
                    </span>
                  </div>
                </div>
                  <div className="recommended-content">
                  <div className="mb-1 home-eight-title text-dark">
                    <Link to={all_routes.cruiseList}>Sahara Escape</Link>
                  </div>
                  <span>Douz, Sahara Desert</span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="recommended-list-item wow fadeInUp">
                <div className="recommended-img">
                  <Link to={all_routes.cruiseList} tabIndex={0}>
                    <ImageWithBasePath
                      src="assets/img/destination/destination-56.jpg"
                      className="img-fluid"
                      alt="Coastal Ride at Hammamet Coast"
                    />
                  </Link>
                    <div className="fav-item fs-14">
                    <span className="me-2">
                      <i className="isax isax-calendar-tick me-1" />2 Days, 1
                      Night
                    </span>
                  </div>
                </div>
                  <div className="recommended-content">
                  <div className="mb-1 home-eight-title text-dark">
                    <Link to={all_routes.cruiseList}>Coastal Ride</Link>
                  </div>
                  <span>Hammamet Coast</span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="recommended-list-item wow fadeInUp">
                <div className="recommended-img">
                  <Link to={all_routes.cruiseList} tabIndex={0}>
                    <ImageWithBasePath
                      src="assets/img/destination/destination-57.jpg"
                      className="img-fluid"
                      alt="Djerba Retreat on Djerba Island"
                    />
                  </Link>
                    <div className="fav-item fs-14">
                    <span className="me-2">
                      <i className="isax isax-calendar-tick me-1" />4 Days, 3
                      Nights
                    </span>
                  </div>
                </div>
                  <div className="recommended-content">
                  <div className="mb-1 home-eight-title text-dark">
                    <Link to={all_routes.cruiseList}>Djerba Retreat</Link>
                  </div>
                  <span>Djerba Island</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-4 pt-2 wow fadeInUp">
            <Link to={all_routes.cruiseList} className="btn btn-primary">
              View All Services
              <i className="isax isax-arrow-right-3 ms-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Recomanded;
