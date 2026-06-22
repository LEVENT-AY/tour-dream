import { Outlet, useLocation } from "react-router";
import { useLayoutEffect, useState } from "react";
import Header from "../core/common/header/header";
import Cursor from "../core/common/cursor/cursor";
import BackToTop from "../core/common/backtotop/backToTop";
import Footer from "../core/common/footer/footer";
import FooterSeven from "./home-seven/footerSeven";
import { all_routes } from "./router/all_routes";
import {
  fetchHomepageSettings,
  resolveGeneralHomeTemplateRoute,
  shouldShowSharedFooterForHomeRoute,
  shouldShowSharedHeaderForHomeRoute,
} from "../core/services/firebaseServices";

const isHomepageRoute = (pathname: string) => pathname === "/" || pathname.startsWith("/index");

const Feature = () => {
  const [showLoader, setShowLoader] = useState(() => isHomepageRoute(window.location.pathname));
  const [selectedHomeRoute, setSelectedHomeRoute] = useState(all_routes.allService1);

  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/agent") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/user");

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
      behavior: "instant",
    });

    let cancelled = false;

    if (isHomepageRoute(location.pathname)) {
      setShowLoader(true);

      const loadHomepageRoute = async () => {
        for (let attempt = 0; attempt < 3 && !cancelled; attempt += 1) {
          try {
            const settings = await fetchHomepageSettings();
            if (cancelled) return;
            setSelectedHomeRoute(resolveGeneralHomeTemplateRoute(settings?.publicTemplates?.home));
            if (settings) break;
          } catch {
            if (!cancelled && attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }

        if (!cancelled) {
          setShowLoader(false);
        }
      };

      void loadHomepageRoute();
      return () => {
        cancelled = true;
      };
    }

    setSelectedHomeRoute(all_routes.allService1);
    setShowLoader(false);
  }, [location.pathname]);

  const effectiveShellRoute = isHomepageRoute(location.pathname) ? selectedHomeRoute : location.pathname;
  const shouldShowSharedHeader = !isDashboardRoute && shouldShowSharedHeaderForHomeRoute(effectiveShellRoute);
  const shouldShowSharedFooter = !isDashboardRoute && shouldShowSharedFooterForHomeRoute(effectiveShellRoute);
  const shouldShowFooterSeven = !isDashboardRoute && effectiveShellRoute === "/index-9";
  const shouldHideBackToTop = effectiveShellRoute === "/index-2";

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
                {shouldShowSharedHeader ? <Header /> : <></>}
                <Outlet context={{ selectedHomeRoute: effectiveShellRoute }} />
                {shouldShowSharedFooter && <Footer />}
                {shouldShowFooterSeven && <FooterSeven />}
                {shouldHideBackToTop ? <></> : <BackToTop />}
                <Cursor />
              </div>
            </>
          )}
        </>
        <div className="sidebar-overlay"></div>
      </div>
    </>
  );
};

export default Feature;
