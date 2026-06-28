import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { all_routes } from "../router/all_routes";
import FeaturedServices from "./FeaturedServices";
import ExperienceSection from "./experienceSection";
import Recomanded from "./recomanded";
import DeliverySection from "./deliverySection";
import GuideSection from "./guideSection";
import TestimonialSection from "./testimonialSection";
import ChooseSection from "./chooseSection";
import LatestSection from "./latestSection";
import FooterSection from "./footerSection";
import {
  fetchHomepageSettings,
  type HomepageSettings,
} from "../../core/services/firebaseServices";

const HomeServiceOne = () => {
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadHomepageSettings = async () => {
      for (let attempt = 0; attempt < 3 && !cancelled; attempt += 1) {
        try {
          const settings = await fetchHomepageSettings();
          if (!cancelled) {
            setHomepageSettings(settings);
            if (settings) return;
          }
        } catch (error) {
          if (!cancelled) {
            console.error(error);
          }
        }
        if (!cancelled && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    };
    void loadHomepageSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const routes = all_routes;
  return (
    <>
      <section className="hero-sec-eight" data-homepage-settings={homepageSettings ? "loaded" : "empty"}>
        <div className="container">
          <div className="hero-content">
            <div className="row align-items-center">
              <div className="col-md-12 mx-auto text-center">
                <h1 className="display-4 fw-bold mb-3">Explore Tunisia Travel Services</h1>
                <p className="lead mb-4">
                  Send a request for cruises, buses, visas, and local guides. Our team confirms availability and manual payment instructions.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Link to={routes.cruiseList} className="btn btn-primary btn-lg">
                    Explore Services
                  </Link>
                  <Link to={routes.contactUs} className="btn btn-outline-primary btn-lg">
                    Send a Request
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeaturedServices />
      <ExperienceSection />
      <Recomanded />
      <DeliverySection />
      <GuideSection />
      <TestimonialSection />
      <ChooseSection />
      <LatestSection />
      <FooterSection />
    </>
  );
};

export default HomeServiceOne;
