import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useState } from "react";
import { Link } from "react-router-dom";

const TestimonialSection = () => {
  const [swiperInstance, setSwiperInstance] = useState<any>(null);

  return (
    <>
      {/* testimonials */}
      <section className="section testimonials-nine">
        <div className="counter-sec">
          <div className="container">
            <div className="row row-gap-4">
              <div className="col-xl-3 col-md-6 wow fadeInUp">
                <div className="testimonials-count">
                  <h3>
                    <span className="counter">50</span>+
                  </h3>
                  <div className="fw-medium">Providers Registered</div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 wow fadeInUp">
                <div className="testimonials-count">
                  <h3>
                    <span className="counter">7000</span>+
                  </h3>
                  <div className="fw-medium">Booking Completed</div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 wow fadeInUp">
                <div className="testimonials-count">
                  <h3>
                    <span className="counter">100</span>+
                  </h3>
                  <div className="fw-medium">Clients Globally</div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 wow fadeInUp">
                <div className="testimonials-count">
                  <h3>
                    <span className="counter">254</span>+
                  </h3>
                  <div className="fw-medium">Providers Registered</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="section-head-nine px-2 text-center wow fadeInUp"
          style={{ visibility: "visible", animationName: "fadeInUp" }}
        >
          <h2>
            Hear From Our <span>Happy Clients</span>
          </h2>
          <span>What people say about us worldwide</span>
        </div>
        <div className="testimonial-slider-nine wow fadeInUp">
          <Swiper
            modules={[Navigation]}
            slidesPerView={2}
            slidesPerGroup={1}
            speed={2000}
            loop={true}
            centeredSlides={false}
            autoplay={false}
            onSwiper={setSwiperInstance}
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
              <div className="slider-item">
                {/* Testimonial Item */}
                <div className="testimonial-item">
                  <div className="rating d-flex align-items-center mb-3">
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <span>5.0</span>
                  </div>
                  <p>
                    "The most incredible travel experience of my life! Every
                    detail was perfectly planned and the destinations were
                    breathtaking."
                  </p>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center">
                      <Link to="#" className="avatar avatar-lg  flex-shrink-0">
                        <ImageWithBasePath
                          src="assets/img/users/user-lg-33.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div className="fs-18 fw-semibold text-gray-9 mb-0">
                          <Link to="#">Gregg Lewis</Link>
                        </div>
                        <p className="fs-14">San Diego, CA</p>
                      </div>
                    </div>
                    <div className="quote-icon">
                      <ImageWithBasePath
                        src="./assets/img/icons/quote-icon.svg"
                        alt="img"
                      />
                    </div>
                  </div>
                </div>
                {/* Testimonial Item End */}
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="slider-item">
                {/* Testimonial Item */}
                <div className="testimonial-item">
                  <div className="rating d-flex align-items-center mb-3">
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <span>5.0</span>
                  </div>
                  <p>
                    "A truly seamless experience from booking to return. The
                    cultural tour was enriching and beautifully organized."
                  </p>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center">
                      <Link to="#" className="avatar avatar-lg  flex-shrink-0">
                        <ImageWithBasePath
                          src="assets/img/users/user-35.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div className="fs-18 fw-semibold text-gray-9 mb-0">
                          <Link to="#">Lauren Parker</Link>
                        </div>
                        <p className="fs-14">Seattle, WA</p>
                      </div>
                    </div>
                    <div className="quote-icon">
                      <ImageWithBasePath
                        src="./assets/img/icons/quote-icon.svg"
                        alt="img"
                      />
                    </div>
                  </div>
                </div>
                {/* Testimonial Item End */}
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="slider-item">
                {/* Testimonial Item */}
                <div className="testimonial-item">
                  <div className="rating d-flex align-items-center mb-3">
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <span>5.0</span>
                  </div>
                  <p>
                    Very gentle and reassuring during my wisdom tooth
                    extraction. The procedure was quick, recovery was easy, and
                    her staff was amazing.
                  </p>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center">
                      <Link to="#" className="avatar avatar-lg  flex-shrink-0">
                        <ImageWithBasePath
                          src="assets/img/users/user-09.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div className="fs-18 fw-semibold text-gray-9 mb-0">
                          <Link to="#">Michael Adams</Link>
                        </div>
                        <p className="fs-14">Chicago, IL</p>
                      </div>
                    </div>
                    <div className="quote-icon">
                      <ImageWithBasePath
                        src="./assets/img/icons/quote-icon.svg"
                        alt="img"
                      />
                    </div>
                  </div>
                </div>
                {/* Testimonial Item End */}
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="slider-item">
                {/* Testimonial Item */}
                <div className="testimonial-item">
                  <div className="rating d-flex align-items-center mb-3">
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <i className="fa-solid fa-star filled  text-primary me-1 fs-14" />
                    <span>5.0</span>
                  </div>
                  <p>
                    "The most incredible travel experience of my life! Every
                    detail was perfectly planned and the destinations were
                    breathtaking."
                  </p>
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center">
                      <Link to="#" className="avatar avatar-lg  flex-shrink-0">
                        <ImageWithBasePath
                          src="assets/img/users/user-38.jpg"
                          className="rounded-circle"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <div className="fs-18 fw-semibold text-gray-9 mb-0">
                          <Link to="#">Gregg Lewis</Link>
                        </div>
                        <p className="fs-14">San Diego, CA</p>
                      </div>
                    </div>
                    <div className="quote-icon">
                      <ImageWithBasePath
                        src="./assets/img/icons/quote-icon.svg"
                        alt="img"
                      />
                    </div>
                  </div>
                </div>
                {/* Testimonial Item End */}
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
        <div className="d-flex align-items-center justify-content-center gap-3 wow fadeInUp">
          <button
            type="button"
            className="slick-arrow restaurant-prev"
            onClick={() => swiperInstance?.slidePrev()}
          >
            <i className="isax isax-arrow-left-2" />
          </button>
          <button
            type="button"
            className="slick-arrow restaurant-next"
            onClick={() => swiperInstance?.slideNext()}
          >
            <i className="isax isax-arrow-right-3" />
          </button>
        </div>
      </section>
      {/* testimonials */}
    </>
  );
};

export default TestimonialSection;
