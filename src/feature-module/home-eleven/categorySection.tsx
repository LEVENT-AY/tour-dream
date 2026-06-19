import { Swiper, SwiperSlide } from "swiper/react"
import ImageWithBasePath from "../../core/common/imageWithBasePath"
import { useState } from "react";
import { Link } from "react-router-dom";


const CategorySection = () => {
    const [swiperInstance, setSwiperInstance] = useState<any>(null);
  return (
    <>
  {/* Explore section */}
  <section className="section explore-section">
    <div className="container">
      <div className="section-header-eleven wow fadeInUp">
        <span className="section-title">
          <ImageWithBasePath
            src="./assets/img/icons/compass.svg"
            alt="compass"
            className="me-1"
          />
          Explore
        </span>
        <h2>Explore by Category</h2>
      </div>
      <div className="position-relative wow fadeInUp">
        <div className="explore-slider slick-initialized slick-slider">
              <Swiper
        slidesPerView={4}
        slidesPerGroup={1}
        loop={true}
        speed={2000}
        breakpoints={{
          0: {
            slidesPerView: 1,
          },
          576: {
            slidesPerView: 1,
          },
          992: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 4,
          },
        }}
        onSwiper={setSwiperInstance}
      >
        <SwiperSlide>
          <div className="slick-slide"><div className="explore-item me-0">
            <div className="explore-img">
              <Link to="#">
                <ImageWithBasePath src="./assets/img/tours/tours-40.jpg" alt="img" />
              </Link>
            </div>
            <h3 className="home-eleven-title">
              <Link to="#">Adventure</Link>
            </h3>
          </div></div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slick-slide"><div className="explore-item me-0">
            <div className="explore-img">
              <Link to="#">
                <ImageWithBasePath src="./assets/img/tours/tours-41.jpg" alt="img" />
              </Link>
            </div>
            <h3 className="home-eleven-title">
              <Link to="#">Family</Link>
            </h3>
          </div></div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slick-slide"><div className="explore-item me-0">
            <div className="explore-img">
              <Link to="#">
                <ImageWithBasePath src="./assets/img/tours/tours-39.jpg" alt="img" />
              </Link>
            </div>
            <h3 className="home-eleven-title">
              <Link to="#">Water Sports</Link>
            </h3>
          </div></div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slick-slide"><div className="explore-item me-0">
            <div className="explore-img">
              <Link to="#">
                <ImageWithBasePath src="./assets/img/tours/tours-42.jpg" alt="img" />
              </Link>
            </div>
            <h3 className="home-eleven-title">
              <Link to="#">City Tours</Link>
            </h3>
          </div></div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slick-slide"> <div className="explore-item me-0">
            <div className="explore-img">
              <Link to="#">
                <ImageWithBasePath src="./assets/img/tours/tours-39.jpg" alt="img" />
              </Link>
            </div>
            <h3 className="home-eleven-title">
              <Link to="#">Water Sports</Link>
            </h3>
          </div></div>
        </SwiperSlide>
      </Swiper>
          
          
          
          
         
        </div>
        <button type="button" className="slick-arrow restaurant-prev" onClick={() => swiperInstance?.slidePrev()}>
          <i className="isax isax-arrow-left" />
        </button>
        <button type="button" className="slick-arrow restaurant-next" onClick={() => swiperInstance?.slideNext()}>
          <i className="isax isax-arrow-right-1" />
        </button>
      </div>
    </div>
  </section>
  {/* Explore section */}
</>

  )
}

export default CategorySection
