import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { all_routes } from "../router/all_routes";

const ExperienceSection = () => {
  return (
    <>
      <section className="section destinations-sec">
        <div className="container">
          <div className="section-header-eight wow fadeInUp">
            <h2>
              Explore Tunisian <br />{" "}
              <ImageWithBasePath
                src="./assets/img/bg/heading-bg-02.png"
                alt=""
              />{" "}
              Destinations{" "}
            </h2>
          </div>
          <div className="row">
            <div className="col-lg-3">
              <div className="location-wrap wow zoomIn">
                <Link to={all_routes.cruiseList}>
                  <ImageWithBasePath
                    src="assets/img/destination/destination-48.jpg"
                    alt="Tunis"
                  />
                </Link>
                <div className="loc-name-bottom">
                  <h3 className="mb-1 home-eight-title">Tunis</h3>
                </div>
                <Link to={all_routes.cruiseList} className="loc-view-bottom">
                  <i className="isax isax-arrow-right-1" />
                </Link>
              </div>
              <div className="location-wrap wow zoomIn">
                <Link to={all_routes.cruiseList}>
                  <ImageWithBasePath
                    src="assets/img/destination/destination-49.jpg"
                    alt="Sousse"
                  />
                </Link>
                <div className="loc-name-bottom">
                  <h3 className="mb-1 home-eight-title">Sousse</h3>
                </div>
                <Link to={all_routes.cruiseList} className="loc-view-bottom">
                  <i className="isax isax-arrow-right-1" />
                </Link>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="location-wrap wow zoomIn">
                <Link to={all_routes.cruiseList}>
                  <ImageWithBasePath
                    src="assets/img/destination/destination-50.jpg"
                    alt="Hammamet"
                  />
                </Link>
                <div className="loc-name-bottom">
                  <h3 className="mb-1 home-eight-title">Hammamet</h3>
                </div>
                <Link to={all_routes.cruiseList} className="loc-view-bottom">
                  <i className="isax isax-arrow-right-1" />
                </Link>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="location-wrap wow zoomIn">
                <Link to={all_routes.cruiseList}>
                  <ImageWithBasePath
                    src="assets/img/destination/destination-51.jpg"
                    alt="Djerba"
                  />
                </Link>
                <div className="loc-name-bottom">
                  <h3 className="mb-1 home-eight-title">Djerba</h3>
                </div>
                <Link to={all_routes.cruiseList} className="loc-view-bottom">
                  <i className="isax isax-arrow-right-1" />
                </Link>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="location-wrap wow zoomIn">
                    <Link to={all_routes.cruiseList}>
                      <ImageWithBasePath
                      src="assets/img/destination/destination-52.jpg"
                      alt="Sfax"
                    />
                  </Link>
                  <div className="loc-name-bottom">
                    <h3 className="mb-1 home-eight-title">Sfax</h3>
                    </div>
                    <Link to={all_routes.cruiseList} className="loc-view-bottom">
                      <i className="isax isax-arrow-right-1" />
                    </Link>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="location-wrap wow zoomIn">
                    <Link to={all_routes.cruiseList}>
                      <ImageWithBasePath
                      src="assets/img/destination/destination-53.jpg"
                      alt="Tozeur"
                    />
                  </Link>
                  <div className="loc-name-bottom">
                    <h3 className="mb-1 home-eight-title">Tozeur</h3>
                    </div>
                    <Link to={all_routes.cruiseList} className="loc-view-bottom">
                      <i className="isax isax-arrow-right-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-2 wow fadeInUp">
            <Link to={all_routes.cruiseList} className="btn btn-primary">
              View All Destinations
              <i className="isax isax-arrow-right-3 ms-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default ExperienceSection;
