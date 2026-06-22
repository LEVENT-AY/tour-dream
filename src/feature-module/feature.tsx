import { Outlet, useLocation } from "react-router";
import { useLayoutEffect, useState } from "react";
import Header from "../core/common/header/header";
import Cursor from "../core/common/cursor/cursor";
import BackToTop from "../core/common/backtotop/backToTop";
import Footer from "../core/common/footer/footer";
import FooterSeven from "./home-seven/footerSeven";
import { HomeShellContext } from "./home-shell-context";
import { all_routes } from "./router/all_routes";
import {
  fetchHomepageSettings,
  resolveHomeHeaderVariantRoute,
  resolveGeneralHomeTemplateRoute,
  shouldShowSharedFooterForHomeRoute,
  shouldShowSharedHeaderForHomeRoute,
  type HomepageSettings,
} from "../core/services/firebaseServices";

const isHomepageRoute = (pathname: string) => pathname === "/" || pathname.startsWith("/index");
const isRootHomeRoute = (pathname: string) => pathname === "/" || pathname === "/index";

const Feature = () => {
  const [showLoader, setShowLoader] = useState(() => isHomepageRoute(window.location.pathname));
  const [selectedHomeRoute, setSelectedHomeRoute] = useState(all_routes.allService1);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null);

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
            setHomepageSettings(settings);
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
    setHomepageSettings(null);
    setShowLoader(false);
  }, [location.pathname]);

  const effectiveHomeTemplateRoute = isRootHomeRoute(location.pathname) ? selectedHomeRoute : location.pathname;
  const effectiveHeaderVariantRoute = resolveHomeHeaderVariantRoute(
    effectiveHomeTemplateRoute,
    homepageSettings?.headerVariantOverrides,
  );
  const shouldShowSharedHeader = !isDashboardRoute && shouldShowSharedHeaderForHomeRoute(
    effectiveHomeTemplateRoute,
    homepageSettings?.headerVariantOverrides,
  );
  const shouldShowSharedFooter = !isDashboardRoute && shouldShowSharedFooterForHomeRoute(effectiveHomeTemplateRoute);
  const shouldShowFooterSeven = !isDashboardRoute && effectiveHomeTemplateRoute === "/index-9";
  const shouldHideBackToTop = effectiveHomeTemplateRoute === "/index-2";

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
              <HomeShellContext.Provider
                value={{
                  effectiveHomeTemplateRoute,
                  effectiveHeaderVariantRoute,
                }}
              >
                <div>
                  {shouldShowSharedHeader ? <Header /> : <></>}
                  <Outlet context={{ selectedHomeRoute: effectiveHomeTemplateRoute }} />
                  {shouldShowSharedFooter && <Footer />}
                  {shouldShowFooterSeven && <FooterSeven />}
                  {shouldHideBackToTop ? <></> : <BackToTop />}
                  <Cursor />
                </div>
              </HomeShellContext.Provider>
            </>
          )}
        </>
        <div className="sidebar-overlay"></div>
      </div>
    </>
  );
};

export default Feature;
