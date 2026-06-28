
import { Link } from 'react-router-dom'
import ImageWithBasePath from '../../core/common/imageWithBasePath'
import { all_routes } from '../router/all_routes'

const FooterSection = () => {
  return (
    <>
  {/* Footer */}
  <footer className="footer-eight">
    <div className="footer-top">
      <ImageWithBasePath
        src="assets/img/bg/footer-bg-03.png"
        alt="img"
        className="footer-bg"
      />
      <div className="container">

        <div className="row align-items-center row-gap-3">
          <div className="col-md-5">
            <div className="footer-about">
              <div>
                <Link to={all_routes.allService1} className="d-inline-block mb-1">
                  <ImageWithBasePath src="assets/img/logo.svg" alt="logo" />
                </Link>
                <p className="text-white">
                  DreamsTour helps travelers explore Tunisia services and send requests for team follow-up.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-7">
            <div className="row row-cols-xl-3 row-cols-sm-2 row-cols-1 g-4">
              <div className="col">
                <div className="d-flex align-items-center">
                  <span className="avatar avatar-lg bg-primary rounded-circle flex-shrink-0">
                    <i className="ti ti-headphones-filled fs-24" />
                  </span>
                  <div className="ms-2">
                    <p className="fs-14 mb-1 text-white">Customer Support</p>
                    <div className="fw-medium text-light">+216 56 000 000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="footer-middle">
      <div className="container">
        <div className="d-flex align-items-center justify-content-center justify-content-lg-between flex-wrap gap-3">
          <div className="footer-links d-none d-lg-block">
            <ul>
              <li>
                <Link to={all_routes.allService1}>Home</Link>
              </li>
              <li>
                <Link to={all_routes.cruiseList}>Cruise</Link>
              </li>
              <li>
                <Link to={all_routes.busList}>Bus</Link>
              </li>
              <li>
                <Link to={all_routes.visaList}>Visa</Link>
              </li>
              <li>
                <Link to={all_routes.guideGrid}>Guides</Link>
              </li>
              <li>
                <Link to={all_routes.contactUs}>Contact</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div className="footer-bottom">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-4">
            <p className="text-white mb-0">
              Copyright © 2026{" "}
              <Link to="#" className="fw-medium">
                DreamsTour
              </Link>
            </p>
          </div>
          <div className="col-md-4">
            <div className="footer-bottom-links d-flex align-items-center justify-content-center gap-3">
              <Link to="#">Legal Notice</Link>
              <Link to="#">Privacy Policy</Link>
            </div>
          </div>
          <div className="col-md-4">
            <ul className="social-icon">
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
  </footer>
  {/* /Footer */}
</>

  )
}

export default FooterSection
