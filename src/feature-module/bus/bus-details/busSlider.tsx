import React, { useState, useRef, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";

const BusSlider: React.FC = () => {
  const sliderForRef = useRef<any>(null);
  const sliderNavRef = useRef<any>(null);
  const [navSync, setNavSync] = useState<any>({ sliderFor: null, sliderNav: null });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const largeImages = [
    "assets/img/bus/bus-large-01.jpg",
    "assets/img/bus/bus-large-02.jpg",
    "assets/img/bus/bus-large-03.jpg",
    "assets/img/bus/bus-large-04.jpg",
    "assets/img/bus/bus-large-05.jpg",
    "assets/img/bus/bus-large-02.jpg",
  ];

  useEffect(() => {
    setNavSync({
      sliderFor: sliderNavRef.current,
      sliderNav: sliderForRef.current,
    });
  }, []);

  const CustomNextArrow = ({ onClick }: any) => (
    <div className="owl-nav">
      <button type="button" className="owl-next" onClick={onClick}>
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );

  const CustomPrevArrow = ({ onClick }: any) => (
    <div className="owl-nav">
      <button type="button" className="owl-prev" onClick={onClick}>
        <i className="fa-solid fa-chevron-left" />
      </button>
    </div>
  );

  const sliderForSettings = {
    slidesToShow: 1,
    slidesToScroll: 1,
    infinite: true,
    arrows: true,
    fade: true,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    asNavFor: navSync.sliderFor,
    beforeChange: (_oldIndex: number, newIndex: number) => setCurrentSlide(newIndex),
  };

  const sliderNavSettings = {
    slidesToShow: 5,
    slidesToScroll: 1,
    dots: false,
    arrows: false,
    infinite: true,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    focusOnSelect: true,
    asNavFor: navSync.sliderNav,
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: 5 } },
      { breakpoint: 768, settings: { slidesToShow: 3 } },
      { breakpoint: 580, settings: { slidesToShow: 2 } },
      { breakpoint: 0, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="service-wrap mb-4">
      <div className="slider-wrap position-relative">
        {/* Main Slider */}
        <Slider {...sliderForSettings} ref={sliderForRef} className="owl-carousel slicknavfor service-carousel nav-center mb-4">
          {largeImages.map((img, idx) => (
            <div className="service-img" key={idx}>
              <ImageWithBasePath src={img} className="img-fluid" alt={`Slider Img ${idx}`} />
            </div>
          ))}
        </Slider>

        {/* See All Button */}
        <button
          className="btn btn-white btn-xs view-btn position-absolute"
          onClick={() => setLightboxOpen(true)}
        >
          <i className="isax isax-image me-1"></i>See All
        </button>

        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          index={currentSlide}
          close={() => setLightboxOpen(false)}
          slides={largeImages.map((src) => ({ src: `/react/src/${src}` }))}
        // plugins={[Thumbnails]}
        // thumbnails={{ width: 100, position: "bottom" }}
        />
      </div>


      {/* Thumbnail Slider */}
      <Slider {...sliderNavSettings} ref={sliderNavRef} className="owl-carousel slider-nav-thumbnails nav-center mt-3">
        {largeImages.map((img, idx) => (
          <div key={idx}>
            <ImageWithBasePath src={img.replace("large", "thumb")} className="img-fluid" alt={`Thumb ${idx}`} />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default BusSlider;
