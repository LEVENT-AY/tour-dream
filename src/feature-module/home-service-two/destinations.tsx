import { Link } from "react-router-dom";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/swiper.css";
const Destinations = () => {
  return (
    <>
      {/* destinations sec */}
      <section className="section destinations-sec-nine">
        <div className="section-head-nine px-2 text-center wow fadeInUp">
          <h2>
            Top <span>Destinations</span>
          </h2>
          <span>Explore the world's most beautiful places</span>
        </div>
        <Swiper
          className="destinations-slider"
          modules={[Navigation, Autoplay]}
          slidesPerView={5}
          spaceBetween={20}
          speed={2000}
          loop={true}
          centeredSlides={false}
          autoplay={false}
          navigation={true}
          breakpoints={{
            1200: {
              slidesPerView: 4,
            },
            992: {
              slidesPerView: 3,
            },
            767: {
              slidesPerView: 3,
            },
            400: {
              slidesPerView: 2,
            },
            375: {
              slidesPerView: 2,
            },
            320: {
              slidesPerView: 1,
            },
            0: {
              slidesPerView: 1,
            },
          }}
        >
          <SwiperSlide>
            {" "}
            <div className="destinations-item">
              <div className="destinations-img">
                <Link to="#">
                  <ImageWithBasePath
                    src="assets/img/destination/destination-58.jpg"
                    alt="img"
                  />
                </Link>
                <div className="location-text">Tokyo</div>
                <div className="destinations-amount">
                  <div>
                    <p className="text-light mb-1">Starts From</p>
                    <span className="text-white fs-20 fw-semibold">$899</span>
                  </div>
                  <Link to="#" className="location-view-button">
                    <i className="isax isax-arrow-right-1" />
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="destinations-item">
              <div className="destinations-img">
                <Link to="#">
                  <ImageWithBasePath
                    src="assets/img/destination/destination-59.jpg"
                    alt="img"
                  />
                </Link>
                <div className="location-text">New York</div>
                <div className="destinations-amount">
                  <div>
                    <p className="text-light mb-1">Starts From</p>
                    <span className="text-white fs-20 fw-semibold">$1199</span>
                  </div>
                  <Link to="#" className="location-view-button">
                    <i className="isax isax-arrow-right-1" />
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="destinations-item">
              <div className="destinations-img">
                <Link to="#">
                  <ImageWithBasePath
                    src="assets/img/destination/destination-60.jpg"
                    alt="img"
                  />
                </Link>
                <div className="location-text">London</div>
                <div className="destinations-amount">
                  <div>
                    <p className="text-light mb-1">Starts From</p>
                    <span className="text-white fs-20 fw-semibold">$749</span>
                  </div>
                  <Link to="#" className="location-view-button">
                    <i className="isax isax-arrow-right-1" />
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="destinations-item">
              <div className="destinations-img">
                <Link to="#">
                  <ImageWithBasePath
                    src="assets/img/destination/destination-61.jpg"
                    alt="img"
                  />
                </Link>
                <div className="location-text">Sydney</div>
                <div className="destinations-amount">
                  <div>
                    <p className="text-light mb-1">Starts From</p>
                    <span className="text-white fs-20 fw-semibold">$1099</span>
                  </div>
                  <Link to="#" className="location-view-button">
                    <i className="isax isax-arrow-right-1" />
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            {" "}
            <div className="destinations-item">
              <div className="destinations-img">
                <Link to="#">
                  <ImageWithBasePath
                    src="assets/img/destination/destination-62.jpg"
                    alt="img"
                  />
                </Link>
                <div className="location-text">Berlin</div>
                <div className="destinations-amount">
                  <div>
                    <p className="text-light mb-1">Starts From</p>
                    <span className="text-white fs-20 fw-semibold">$649</span>
                  </div>
                  <Link to="#" className="location-view-button">
                    <i className="isax isax-arrow-right-1" />
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="destinations-item">
              <div className="destinations-img">
                <Link to="#">
                  <ImageWithBasePath
                    src="assets/img/destination/destination-63.jpg"
                    alt="img"
                  />
                </Link>
                <div className="location-text">Paris</div>
                <div className="destinations-amount">
                  <div>
                    <p className="text-light mb-1">Starts From</p>
                    <span className="text-white fs-20 fw-semibold">$1499</span>
                  </div>
                  <Link to="#" className="location-view-button">
                    <i className="isax isax-arrow-right-1" />
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </section>
      {/* destinations sec */}
    </>
  );
};

export default Destinations;
