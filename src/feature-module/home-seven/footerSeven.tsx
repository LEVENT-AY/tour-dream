import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { all_routes } from "../router/all_routes";

const FooterSeven = () => {
  return (
    <>
      {/* Footer */}
      <footer className="footer-three footer-seven">
        <div className="footer-top">
          <div className="container">
            <div className="row">
              <div className="col-xl-7 col-lg-6">
                <div className="footer-widget">
                  <div className="footer-about">
                    <div className="mb-4">
                      <Link to={all_routes.home7} className="d-inline-block mb-3">
                        <ImageWithBasePath src="assets/img/logo.svg" alt="logo" />
                      </Link>
                      <p>
                        Our mission is to offer you a seamless and enjoyable car
                        rental experience. Whether you’re planning a road trip
                      </p>
                      <ul className="social-icon mt-3">
                        <li>
                          <Link to="#">
                            <i className="fa-brands fa-facebook" />
                          </Link>
                        </li>
                        <li>
                          <Link to="#">
                            <i className="fa-brands fa-x-twitter" />
                          </Link>
                        </li>
                        <li>
                          <Link to="#">
                            <i className="fa-brands fa-instagram" />
                          </Link>
                        </li>
                        <li>
                          <Link to="#">
                            <i className="fa-brands fa-linkedin" />
                          </Link>
                        </li>
                        <li>
                          <Link to="#">
                            <i className="fa-brands fa-pinterest" />
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-5 col-lg-6">
                <div className="row row-cols-md-2 row-cols-sm-2 row-cols-1 row-gap-3">
                  <div className="col">
                    <div className="footer-widget mb-0">
                      <h5>Company</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to={all_routes.about_us}>About Us</Link>
                        </li>
                        <li>
                          <Link to="#">Careers</Link>
                        </li>
                        <li>
                          <Link to={all_routes.blogGrid}>Blog</Link>
                        </li>
                        <li>
                          <Link to="#">Affiliate Program</Link>
                        </li>
                        <li>
                          <Link to={all_routes.addFlight}>Add Your Listing</Link>
                        </li>
                        <li>
                          <Link to="#">Our Partners</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col">
                    <div className="footer-widget mb-0">
                      <h5>Destinations</h5>
                      <ul className="footer-menu">
                        <li>
                          <Link to="#">Hawai</Link>
                        </li>
                        <li>
                          <Link to="#">Istanbul</Link>
                        </li>
                        <li>
                          <Link to="#">San Diego</Link>
                        </li>
                        <li>
                          <Link to="#">Belgium</Link>
                        </li>
                        <li>
                          <Link to="#">Newyork</Link>
                        </li>
                        <li>
                          <Link to="#">Los Angeles</Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-7 ">
                <p className="text-lg-start text-center">
                  Copyright © 2026. All Rights Reserved,{" "}
                  <Link
                    to="#"
                    className="text-white fw-medium"
                  >
                    DreamsTour
                  </Link>
                </p>
              </div>
              <div className="col-md-5">
                <ul className="policy-links justify-content-lg-end gap-2">
                  <li>
                    <Link to={all_routes.privacyPolicy}>Privacy Policy</Link>
                  </li>
                  <li>
                    <Link to={all_routes.termsConditions}>Terms and Conditions</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* /Footer Bottom */}
      </footer>
      {/* /Footer */}
    </>
  );
};

export default FooterSeven;
