import ImageWithBasePath from '../../core/common/imageWithBasePath'
import { Link } from 'react-router-dom'
import { all_routes } from '../router/all_routes'

const GuideSection = () => {
  return (
    <>
  <section className="section guide-section">
    <div className="container">
      <div className="section-header-eight wow fadeInUp">
        <h2>
          Local Tunisian <br />{" "}
          <ImageWithBasePath src="./assets/img/bg/heading-bg-04.png" alt="img" /> Guides For
          You{" "}
        </h2>
      </div>
      <div className="row row-gap-4">
        <div className="col-lg-3 col-md-6 wow fadeInUp">
          <div className="guide-list-item">
            <div className="guide-img">
              <Link to={all_routes.guideGrid} tabIndex={0}>
                <ImageWithBasePath
                  src="assets/img/users/user-lg-35.jpg"
                  className="img-fluid"
                  alt="img"
                />
              </Link>
              <Link to={all_routes.guideGrid} className="loc-view-bottom">
                <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
            <div className="guide-content">
              <div className="home-eight-title text-dark mb-1">
                <Link to={all_routes.guideGrid}>Ahmed Ben Ali</Link>
              </div>
              <span>Tunis</span>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 wow fadeInUp">
          <div className="guide-list-item">
            <div className="guide-img">
              <Link to={all_routes.guideGrid} tabIndex={0}>
                <ImageWithBasePath
                  src="assets/img/users/user-lg-36.jpg"
                  className="img-fluid"
                  alt="img"
                />
              </Link>
              <Link to={all_routes.guideGrid} className="loc-view-bottom">
                <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
            <div className="guide-content">
              <div className="home-eight-title text-dark mb-1">
                <Link to={all_routes.guideGrid}>Salma Mansouri</Link>
              </div>
              <span>Sousse</span>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 wow fadeInUp">
          <div className="guide-list-item">
            <div className="guide-img">
              <Link to={all_routes.guideGrid} tabIndex={0}>
                <ImageWithBasePath
                  src="assets/img/users/user-lg-37.jpg"
                  className="img-fluid"
                  alt="img"
                />
              </Link>
              <Link to={all_routes.guideGrid} className="loc-view-bottom">
                <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
            <div className="guide-content">
              <div className="home-eight-title text-dark mb-1">
                <Link to={all_routes.guideGrid}>Karim Bouchoucha</Link>
              </div>
              <span>Hammamet</span>
            </div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6 wow fadeInUp">
          <div className="guide-list-item">
            <div className="guide-img">
              <Link to={all_routes.guideGrid} tabIndex={0}>
                <ImageWithBasePath
                  src="assets/img/users/user-lg-38.jpg"
                  className="img-fluid"
                  alt="img"
                />
              </Link>
              <Link to={all_routes.guideGrid} className="loc-view-bottom">
                <i className="isax isax-arrow-right-1" />
              </Link>
            </div>
            <div className="guide-content">
              <div className="home-eight-title text-dark mb-1">
                <Link to={all_routes.guideGrid}>Ines Gharbi</Link>
              </div>
              <span>Djerba</span>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-4 pt-2 wow fadeInUp">
        <Link to={all_routes.guideGrid} className="btn btn-primary">
          View All Guides
          <i className="isax isax-arrow-right-3 ms-2" />
        </Link>
      </div>
    </div>
  </section>
</>

  )
}

export default GuideSection
