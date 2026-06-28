import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../imageWithBasePath';
import { all_routes } from '../../../feature-module/router/all_routes';
import {
  fetchHomepageSettings,
  normalizeWebsiteSettingsPath,
  type HomepageSettings,
} from '../../services/firebaseServices';

const Footer = () => {
  const routes = all_routes;
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

  const resolveLogo = (fallback: string) => homepageSettings?.logo || fallback;
  const footerLinks = (homepageSettings?.footerLinks || []).filter((link) => link && link.label && link.path);
  const socialLinks = homepageSettings?.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);
  const footerText = homepageSettings?.footerText || 'Copyright 2026. All Rights Reserved,';
  const contactPhone = homepageSettings?.contactPhone || '';
  const contactAddress = homepageSettings?.contactAddress || '';

  const renderSocialIcon = (platform: string) => {
    if (platform === 'twitter') return 'fa-x-twitter';
    if (platform === 'x') return 'fa-x-twitter';
    return `fa-${platform}`;
  };

  return (
    <>
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="row row-cols-lg-5 row-cols-md-3 row-cols-sm-2 row-cols-1">
              <div className="col">
                <div className="footer-widget">
                  <h5>{footerLinks.length > 0 ? 'Footer Links' : 'Pages'}</h5>
                  <ul className="footer-menu">
                    {footerLinks.length > 0 ? (
                      footerLinks.map((link) => (
                        <li key={`${link.label}-${link.path}`}>
                          <Link to={normalizeWebsiteSettingsPath(link.path) || routes.allService1}>{link.label}</Link>
                        </li>
                      ))
                    ) : (
                      <>
                        <li>
                          <Link to={routes.teams}>Our Team</Link>
                        </li>
                        <li>
                          <Link to={routes.pricingPlan}>Pricing Plans</Link>
                        </li>
                        <li>
                          <Link to={routes.Gallery}>Gallery</Link>
                        </li>
                        <li>
                          <Link to={routes.profileSettings}>Settings</Link>
                        </li>
                        <li>
                          <Link to={routes.myProfile}>Profile</Link>
                        </li>
                        <li>
                          <Link to={routes.agentListing}>Listings</Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="col">
                <div className="footer-widget">
                  <h5>Marketplace</h5>
                  <ul className="footer-menu">
                    <li>
                      <Link to={routes.cruiseList}>Cruises</Link>
                    </li>
                    <li>
                      <Link to={routes.busList}>Buses</Link>
                    </li>
                    <li>
                      <Link to={routes.visaList}>Visa Services</Link>
                    </li>
                    <li>
                      <Link to={routes.guideGrid}>Local Guides</Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col">
                <div className="footer-widget">
                  <h5>Destinations</h5>
                  <ul className="footer-menu">
                    <li>
                      <Link to={routes.cruiseList}>Tunis</Link>
                    </li>
                    <li>
                      <Link to={routes.cruiseList}>Sousse</Link>
                    </li>
                    <li>
                      <Link to={routes.cruiseList}>Hammamet</Link>
                    </li>
                    <li>
                      <Link to={routes.cruiseList}>Djerba</Link>
                    </li>
                    <li>
                      <Link to={routes.cruiseList}>Sfax</Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col">
                <div className="footer-widget">
                  <h5>Support</h5>
                  <ul className="footer-menu">
                    <li>
                      <Link to={routes.contactUs}>Contact Us</Link>
                    </li>
                    <li>
                      <Link to={routes.privacyPolicy}>Privacy Policy</Link>
                    </li>
                    <li>
                      <Link to={routes.termsConditions}>Terms and Conditions</Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="footer-wrap bg-white">
              <div className="row align-items-center">
                <div className="col-lg-6 col-xl-3 col-xxl-3">
                  <div className="mb-3 text-center text-xl-start">
                    <Link to={routes.allService1} className="d-block footer-logo-light">
                      <ImageWithBasePath src={resolveLogo('assets/img/logo-dark.svg')} alt={homepageSettings?.siteName || 'logo'} />
                    </Link>
                    <Link to={routes.allService1} className="footer-logo-dark">
                      <ImageWithBasePath src={resolveLogo('assets/img/logo.svg')} alt={homepageSettings?.siteName || 'logo'} />
                    </Link>
                  </div>
                </div>

                <div className="col-lg-12 col-xl-9 col-xxl-9">
                  <div className="d-sm-flex align-items-center justify-content-center justify-content-xl-end">
                    <div className="d-flex align-items-center justify-content-center justify-content-sm-start mb-3">
                      <span className="avatar avatar-lg bg-primary rounded-circle flex-shrink-0">
                        <i className="ti ti-headphones-filled fs-24" />
                      </span>
                      <div className="ms-2">
                        <p className="mb-1">Customer Support</p>
                        <p className="fw-medium text-dark">{contactPhone}</p>
                        {contactAddress && <p className="mb-0 fs-13 text-muted">{contactAddress}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="footer-img">
              <ImageWithBasePath src="assets/img/bg/footer.svg" className="img-fluid" alt="img" />
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div className="d-flex align-items-center justify-content-between flex-wrap">
                  <p className="fs-14">
                    {footerText}{' '}
                    <Link to={routes.allService1} className="text-primary fw-medium">
                      {homepageSettings?.siteName || 'DreamsTour'}
                    </Link>
                  </p>
                  <div className="d-flex align-items-center">
                    <ul className="social-icon">
                      {hasSocialLinks ? (
                        Object.entries(socialLinks).map(([platform, url]) => (
                          url ? (
                            <li key={platform}>
                              <a href={url} target="_blank" rel="noreferrer">
                                <i className={`fa-brands ${renderSocialIcon(platform)}`} />
                              </a>
                            </li>
                          ) : null
                        ))
                      ) : (
                        <>
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
                        </>
                      )}
                    </ul>
                  </div>
                  <p className="fs-14 text-muted mb-0">
                    No online card payment collected. All payments are manual after confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
