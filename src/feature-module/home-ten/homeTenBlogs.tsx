import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { all_routes } from "../router/all_routes";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

const HomeTenBlogs = () => {
  const routes = all_routes;
const [swiperInstance, setSwiperInstance] = useState<any>(null);



  return (
    <>
      {/* Start Blog Section */}
      <section className="section blog-section-ten">
        <div className="container">
          <div className="section-header-ten wow fadeInUp" data-wow-delay="1.5">
            <h2 className="section-title">
              Stay Updated <span> on the Stories </span>
            </h2>
            <Link
              to={routes.blogGrid}
              className="btn btn-primary d-flex align-items-center"
            >
              View All <i className="isax isax-arrow-right-3" />
            </Link>
          </div>
          {/* start slider  */}
          <div className="blog-ten-slider slick-initialized slick-slider">
          <Swiper className="slick-list"
        slidesPerView={3}
        slidesPerGroup={1}
        loop={true}
        speed={2000}
        breakpoints={{
          0: { slidesPerView: 1 },
          576: { slidesPerView: 1 },
          768: { slidesPerView: 1 },
          992: { slidesPerView: 2 },
          1200: { slidesPerView: 3 },
          1400: { slidesPerView: 3 },
        }}
        onSwiper={setSwiperInstance}
      >
        <SwiperSlide>
            <div className="slide-item">
              {/* Item 1  */}
              <div className="blog-item-ten">
                <div className="blog-overlay">
                  <ImageWithBasePath
                    src="assets/img/blog/blog-img-1.jpg"
                    alt="blog-img"
                    className="img-1"
                  />
                </div>
                <div className="blog-content">
                  <button className="badge border-0">Guided Tours</button>
                  <h3 className="custom-title">
                    <Link to="#">
                      How a Travel Guide Can Enhance Your Adventure
                    </Link>
                  </h3>
                </div>
                <div className="blog-date">
                  <h4 className="date">30</h4>
                  <p className="month">Mar</p>
                </div>
              </div>
            </div>
        </SwiperSlide>
        <SwiperSlide>
             <div className="slide-item">
              {/* Item 2  */}
              <div
                className="blog-item-ten wow fadeInUp"
                data-wow-delay="1.5"
                data-wow-duration="1.5s"
              >
                <div className="blog-overlay">
                  <ImageWithBasePath
                    src="assets/img/blog/blog-img-2.jpg"
                    alt="blog-img"
                    className="img-1"
                  />
                </div>
                <div className="blog-content">
                  <button className="badge border-0">Travel Tips</button>
                  <h3 className="custom-title">
                    <Link to="#">
                      How to Choose the Right Travel Guide for Your Trip
                    </Link>
                  </h3>
                </div>
                <div className="blog-date">
                  <h4 className="date">22</h4>
                  <p className="month">Feb</p>
                </div>
              </div>
            </div>
        </SwiperSlide>
        <SwiperSlide>
            <div className="slide-item">
              {/* Item 3  */}
              <div
                className="blog-item-ten wow fadeInUp"
                data-wow-delay={2}
                data-wow-duration="2s"
              >
                <div className="blog-overlay">
                  <ImageWithBasePath
                    src="assets/img/blog/blog-img-3.jpg"
                    alt="blog-img"
                    className="img-1"
                  />
                </div>
                <div className="blog-content">
                  <button className="badge border-0">Activity Tours</button>
                  <h3 className="custom-title">
                    <Link to="#">
                      Adventure Sports Experiences with Professional Guides
                    </Link>
                  </h3>
                </div>
                <div className="blog-date">
                  <h4 className="date">15</h4>
                  <p className="month">Jan</p>
                </div>
              </div>
            </div>
        </SwiperSlide>
        <SwiperSlide>
           <div className="slide-item">
              {/* Item 1  */}
              <div className="blog-item-ten">
                <div className="blog-overlay">
                  <ImageWithBasePath
                    src="assets/img/blog/blog-img-1.jpg"
                    alt="blog-img"
                    className="img-1"
                  />
                </div>
                <div className="blog-content">
                  <button className="badge border-0">Guided Tours</button>
                  <h3 className="custom-title">
                    <Link to="#">
                      How a Travel Guide Can Enhance Your Adventure
                    </Link>
                  </h3>
                </div>
                <div className="blog-date">
                  <h4 className="date">30</h4>
                  <p className="month">Mar</p>
                </div>
              </div>
            </div>
        </SwiperSlide>
        <SwiperSlide>
<div className="slide-item">
              {/* Item 3  */}
              <div
                className="blog-item-ten wow fadeInUp"
                data-wow-delay={2}
                data-wow-duration="2s"
              >
                <div className="blog-overlay">
                  <ImageWithBasePath
                    src="assets/img/blog/blog-img-3.jpg"
                    alt="blog-img"
                    className="img-1"
                  />
                </div>
                <div className="blog-content">
                  <button className="badge border-0">Activity Tours</button>
                  <h3 className="custom-title">
                    <Link to="#">
                      Adventure Sports Experiences with Professional Guides
                    </Link>
                  </h3>
                </div>
                <div className="blog-date">
                  <h4 className="date">15</h4>
                  <p className="month">Jan</p>
                </div>
              </div>
            </div>
        </SwiperSlide>
      </Swiper>
          </div>
      
         
          <div className="arrow-item wow fadeInUp" data-wow-delay="1.5">
            <button type="button" className="slick-arrow blog-ten-prev" onClick={() => swiperInstance?.slidePrev()}>
              <i className="isax isax-arrow-left-2" />
            </button>
            <button type="button" className="slick-arrow blog-ten-next" onClick={() => swiperInstance?.slideNext()}>
              <i className="isax isax-arrow-right-3" />
            </button>
          </div>
        </div>
      </section>
      {/* End Blog Section */}
    </>
  );
};

export default HomeTenBlogs;
