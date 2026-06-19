import { Swiper, SwiperSlide } from "swiper/react";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Link } from "react-router-dom";
import { all_routes } from "../router/all_routes";

const BlogSection = () => {
  return (
    <>
      {/* blog */}
      <section className="section blog-sec-nine">
        <div className="container">
          <div className="section-head-nine text-center wow fadeInUp">
            <h2>
              Read Our Latest <span>Stories &amp; Tips</span> Here
            </h2>
            <span>
              Resources that cater to travel enthusiasts, with a focus on
              adventure, gear reviews, and travel tips.
            </span>
          </div>
        </div>
        <div className="blog-nine-slider wow fadeInUp slick-initialized slick-slider">
          <Swiper
            slidesPerView={2}
            slidesPerGroup={1}
            loop={true}
            speed={2000}
            centeredSlides={false}
            navigation={false}
            breakpoints={{
              0: {
                slidesPerView: 1,
              },
              992: {
                slidesPerView: 2,
              },
            }}
          >
            <SwiperSlide>
              <div className="blog-nine-item slick-slide">
                <div className="d-md-flex">
                  <div className="blog-nine-img">
                    <Link to="#">
                      <ImageWithBasePath
                        src="./assets/img/blog/blog-36.jpg"
                        alt="img"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <button className="badge badge-light border-0">
                      Adventure Awaits
                    </button>
                    <div className="home-nine-title mb-2">
                      <Link to="#">
                        Unveiling Hidden Gems: Your Next Adventure?
                      </Link>
                    </div>
                    <p className="mb-4">
                      Discover uncharted territories and create unforgettable
                      memories...
                    </p>
                    <span className="text-gray-9 d-flex align-items-center">
                      <i className="isax isax-calendar me-1" />
                      15 Aug 2026
                    </span>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="blog-nine-item slick-slide">
                <div className="d-md-flex">
                  <div className="blog-nine-img">
                    <Link to="#">
                      <ImageWithBasePath
                        src="./assets/img/blog/blog-37.jpg"
                        alt="img"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <button className="badge badge-light border-0">
                      Travel Tips
                    </button>
                    <div className="home-nine-title mb-2">
                      <Link to="#">Travel Light: Pack Smart, See More</Link>
                    </div>
                    <p className="mb-4">
                      Our guide helps you pack efficiently, so you can focus on
                      your adventure...
                    </p>
                    <span className="text-gray-9 d-flex align-items-center">
                      <i className="isax isax-calendar me-1" />
                      10 Sep 2026
                    </span>
                  </div>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="blog-nine-item slick-slide">
                <div className="d-md-flex">
                  <div className="blog-nine-img">
                    <Link to="#">
                      <ImageWithBasePath
                        src="./assets/img/blog/blog-38.jpg"
                        alt="img"
                      />
                    </Link>
                  </div>
                  <div className="blog-content">
                    <button className="badge badge-light border-0">
                      Destinations
                    </button>
                    <div className="home-nine-title mb-2">
                      <Link to="#">Top 5 Hidden Beaches in the Caribbean</Link>
                    </div>
                    <p className="mb-4">
                      Escape the crowds and discover pristine shores with our
                      curated list...
                    </p>
                    <span className="text-gray-9 d-flex align-items-center">
                      <i className="isax isax-calendar me-1" />
                      01 Dec 2026
                    </span>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
        <div className="text-center mt-4 wow fadeInUp px-3">
          <Link to={all_routes.blogGrid} className="btn btn-primary">
            View All Articles <i className="isax isax-arrow-right-3 ms-2" />
          </Link>
        </div>
      </section>
      {/* blog */}
    </>
  );
};

export default BlogSection;
