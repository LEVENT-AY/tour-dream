import { Outlet, useLocation } from "react-router";
import { useLayoutEffect, useState } from "react";
import Header from "../core/common/header/header";
import Cursor from "../core/common/cursor/cursor";
import BackToTop from "../core/common/backtotop/backToTop";
import Footer from "../core/common/footer/footer";
import FooterSeven from "./home-seven/footerSeven";

const Feature = () => {
  const [showLoader, setShowLoader] = useState(() => window.location.pathname.includes("index"));

  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith('/agent') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/user');

  const Preloader = () => {
    return (
      <div id="loader-wrapper">
        <div id="loader">
          <span className="loader-line" />
        </div>
      </div>
    );
  };
useLayoutEffect(() => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant", // or "smooth"
  });

  if (location.pathname.includes("index")) {
    setShowLoader(true);
    const timeoutId = setTimeout(() => {
      setShowLoader(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }

  setShowLoader(false);
}, [location.pathname]);
  return (
    <>
      <div>
        <>
          {isDashboardRoute ? (
            <Outlet />
          ) : showLoader ? (
            <Preloader />
          ) : (
            <>
              <div>
                {location.pathname === "/index-10" || location.pathname === "/index-12" ? (
                  <></>
                ) : (
                  <Header />
                )}
                <Outlet />
                {/* Show Footer on all routes except index-2 to index-6 */}
                {![
                  "/index",
                  "/index-2",
                  "/index-4",
                  "/index-5",
                  "/index-6",
                  "/index-7",
                  "/index-8",
                  "/index-9",
                  "/index-10",
                  "/index-11",
                  "/index-12",
                ].includes(location.pathname) && <Footer />}

                {/* Show FooterSeven only on /index-7 */}
                {location.pathname === "/index-9" && <FooterSeven />}
                {
                  location.pathname === '/index-2'?(<></>):(<BackToTop />)
                }
                <Cursor />
                
              </div>
            </>
          )}
        </>
        {/* <Loader/> */}

        <div className="sidebar-overlay"></div>
      </div>
    </>
  );
};

export default Feature;
