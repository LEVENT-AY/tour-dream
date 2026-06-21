import React, { useState, useEffect } from "react";
import ImageWithBasePath from "../imageWithBasePath";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setDataTheme } from "../../redux/themeSettingSlice";
import { all_routes } from "../../../feature-module/router/all_routes";
import LoginModal from "../modal/loginModal";
import RegisterModal from "../modal/registerModal";
import ForgotPasswordModal from "../modal/forgotPassword";
import ChangePasswordModal from "../modal/changePassword";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isResponsive, setIsResponsive] = useState(false);
  const [isOffcanva, setIsOffcanva] = useState(false);
  const [isMegaMenu, setIsMegaMenu] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, userProfile, logout } = useAuth();
  const isPublicHomeRoute = location.pathname === "/" || location.pathname === "/index";
  const dataTheme = useSelector((state: any) => state.themeSetting.dataTheme);
  const handleDataThemeChange = (theme: string) => {
    dispatch(setDataTheme(theme));
  };
  const openSubMenu = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setOpenDropdownIndex(null);
  };
  const routes = all_routes;
  const accountDashboardRoute =
    userProfile?.role === 'admin'
      ? routes.adminDashboard
      : userProfile?.role === 'agent'
        ? routes.agentDashboard
        : routes.userDashboard;
  const accountProfileRoute =
    userProfile?.role === 'admin'
      ? routes.adminDashboard
      : userProfile?.role === 'agent'
        ? routes.agentDashboard
        : routes.userMyProfile;
  const accountSettingsRoute =
    userProfile?.role === 'admin'
      ? routes.adminDashboard
      : userProfile?.role === 'agent'
        ? routes.agentSettings
        : routes.profileSettings;
  const accountBookingsRoute =
    userProfile?.role === 'admin'
      ? routes.adminBookings
      : userProfile?.role === 'agent'
        ? routes.agentBookingRequests
        : routes.customerHotelBooking;
  const toggleSubMenu = (index: any) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
    setIsDropdownOpen(false);
  };
  const handleLogout = async (event?: React.MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    await logout();
    navigate(routes.allService1);
  };
  useEffect(() => {
    if (isOffcanva === true) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOffcanva]);
  const sideBar = [
    {
      tittle: "Home",
      base: "home",
      showAsTab: false,
      separateRoute: true,
      menu: [
        {
          menuValue: "All service - 1",
          img: "assets/img/menu/home-11.jpg",
          homeName: "All Services 1",
          route: routes.allService1,
          hasSubRoute: false,
          showSubRoute: false,
          base: routes.allService1,
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "All service - 2",
          img: "assets/img/menu/home-12.jpg",
          homeName: "All Services 2",
          route: "/index-2",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-2",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Home - 1",
          img: "assets/img/menu/home-01.jpg",
          homeName: "All Service 3",
          route: "/index-3",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-3",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Home - 2",
          img: "assets/img/menu/home-02.jpg",
          route: "/index-4",
          homeName: "Hotels",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-4",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Home - 3",
          img: "assets/img/menu/home-03.jpg",
          route: "/index-5",
          homeName: "Cars",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-5",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Home - 4",
          img: "assets/img/menu/home-04.jpg",
          route: "/index-6",
          homeName: "Flight",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-6",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Home - 5",
          img: "assets/img/menu/home-05.jpg",
          route: "/index-7",
          homeName: "Cruise",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-7",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Home - 6",
          img: "assets/img/menu/home-06.jpg",
          route: "/index-8",
          homeName: "Tours",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-8",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Home - 7",
          img: "assets/img/menu/home-07.jpg",
          route: "/index-9",
          homeName: "Bus",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-9",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Guide",
          img: "assets/img/menu/home-08.jpg",
          homeName: "Guide",
          route: "/index-10",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-10",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Activities",
          img: "assets/img/menu/home-09.jpg",
          homeName: "Activities",
          route: "/index-11",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-11",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Visa",
          img: "assets/img/menu/home-10.jpg",
          homeName: "Visa",
          route: "/index-12",
          hasSubRoute: false,
          showSubRoute: false,
          base: "/index-12",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
      ],
    },
    {
      tittle: "Flight",
      base: "flight",
      subTitle: "Flight Booking",
      showAsTab: false,
      separateRoute: false,
      tabMenu: false,
      img: "assets/img/menu/flight.jpg",
      menu: [
        {
          menuValue: "Flight Grid",
          route: "/flight/flight-grid",
          hasSubRoute: false,
          showSubRoute: false,
          base: "flight-grid",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Flight List",
          route: "/flight/flight-list",
          hasSubRoute: false,
          showSubRoute: false,
          base: "flight-list",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Flight Details",
          route: "/flight/flight-details",
          hasSubRoute: false,
          showSubRoute: false,
          base: "flight-details",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Flight Booking",
          route: "/flight/flight-booking",
          hasSubRoute: false,
          showSubRoute: false,
          base: "flight-bookings",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Add Flight",
          route: "/flight/add-flight",
          hasSubRoute: false,
          showSubRoute: false,
          base: "flight",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
      ],
    },
    {
      tittle: "Hotel",
      base: "hotel",
      subTitle: "Hotel Booking",
      showAsTab: false,
      separateRoute: false,
      tabMenu: false,
      img: "assets/img/menu/hotel.jpg",
      menu: [
        {
          menuValue: "Hotel Grid",
          route: routes.hotelGrid,
          hasSubRoute: false,
          showSubRoute: false,
          base: "hotel-grid",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Chalet Grid",
          route: routes.chaletGrid,
          hasSubRoute: false,
          showSubRoute: false,
          base: "chalet-grid",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Resort Grid",
          route: routes.resortGrid,
          hasSubRoute: false,
          showSubRoute: false,
          base: "resort-grid",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Hotel Map",
          route: routes.hotelMap,
          hasSubRoute: false,
          showSubRoute: false,
          base: "hotel-map",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Hotel List",
          route: routes.hotelList,
          hasSubRoute: false,
          showSubRoute: false,
          base: "hotel-list",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Hotel Details",
          route: routes.hotelDetails,
          hasSubRoute: false,
          showSubRoute: false,
          base: "hotel-details",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Hotel Booking",
          route: routes.hotelBooking,
          hasSubRoute: false,
          showSubRoute: false,
          base: "hotel-bookings",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Add Hotel",
          route: routes.addHotel,
          hasSubRoute: false,
          showSubRoute: false,
          base: "add-hotel",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
      ],
    },
    {
      tittle: "Car",
      base: "car",
      subTitle: "Car Booking",
      showAsTab: false,
      separateRoute: false,
      tabMenu: false,
      img: "assets/img/menu/car.jpg",
      menu: [
        {
          menuValue: "Car Grid",
          route: routes.carGrid,
          hasSubRoute: false,
          showSubRoute: false,
          base: "car-grid",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Car List",
          route: routes.carList,
          hasSubRoute: false,
          showSubRoute: false,
          base: "car-list",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Car Map",
          route: routes.carMap,
          hasSubRoute: false,
          showSubRoute: false,
          base: "car-map",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Car Details",
          route: routes.carDetails,
          hasSubRoute: false,
          showSubRoute: false,
          base: "car-details",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Car Booking",
          route: routes.carBooking,
          hasSubRoute: false,
          showSubRoute: false,
          base: "car-bookings",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Add Car",
          route: routes.addCar,
          hasSubRoute: false,
          showSubRoute: false,
          base: "add-car",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
      ],
    },
    {
      tittle: "Cruise",
      base: "cruise",
      subTitle: "Cruise Booking",
      showAsTab: false,
      separateRoute: false,
      tabMenu: false,
      img: "assets/img/menu/cruise.jpg",
      menu: [
        {
          menuValue: "Cruise Grid",
          route: routes.cruiseGrid,
          hasSubRoute: false,
          showSubRoute: false,
          base: "cruise-grid",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Cruise List",
          route: routes.cruiseList,
          hasSubRoute: false,
          showSubRoute: false,
          base: "cruise-list",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Cruise Details",
          route: routes.cruiseDetails,
          hasSubRoute: false,
          showSubRoute: false,
          base: "cruise-details",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Cruise Booking",
          route: routes.cruiseBooking,
          hasSubRoute: false,
          showSubRoute: false,
          base: "cruise-bookings",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Add Cruise",
          route: routes.addCruise,
          hasSubRoute: false,
          showSubRoute: false,
          base: "add-cruise",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
      ],
    },
    {
      tittle: "Tour",
      base: "tour",
      subTitle: "Tour Booking",
      showAsTab: false,
      separateRoute: false,
      tabMenu: false,
      img: "assets/img/menu/tour.jpg",
      menu: [
        {
          menuValue: "Tour Grid",
          route: routes.tourGrid,
          hasSubRoute: false,
          showSubRoute: false,
          base: "tour-grid",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Tour List",
          route: routes.tourList,
          hasSubRoute: false,
          showSubRoute: false,
          base: "tour-list",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Tour Map",
          route: routes.tourMap,
          hasSubRoute: false,
          showSubRoute: false,
          base: "tour-map",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Tour Details",
          route: routes.tourDetails,
          hasSubRoute: false,
          showSubRoute: false,
          base: "tour-details",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Tour Booking",
          route: routes.tourBooking,
          hasSubRoute: false,
          showSubRoute: false,
          base: "tour-bookings",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Add Tour",
          route: routes.addTour,
          hasSubRoute: false,
          showSubRoute: false,
          base: "add-tour",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
      ],
    },
    {
      tittle: "Bus",
      base: "bus",
      subTitle: "Bus Booking",
      showAsTab: false,
      separateRoute: false,
      tabMenu: false,
      img: "assets/img/menu/bus.jpg",
      menu: [
        {
          menuValue: "Bus List",
          route: routes.busList,
          hasSubRoute: false,
          showSubRoute: false,
          base: "bus-list",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Bus Left Sidebar",
          route: routes.busLeftSidebar,
          hasSubRoute: false,
          showSubRoute: false,
          base: "bus-left-sidebar",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Bus Right Sidebar",
          route: routes.busRightSidebar,
          hasSubRoute: false,
          showSubRoute: false,
          base: "bus-right-sidebar",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Bus Details",
          route: routes.busDetails,
          hasSubRoute: false,
          showSubRoute: false,
          base: "bus-details",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Bus Seat Selection",
          route: routes.busSeatSelection,
          hasSubRoute: false,
          showSubRoute: false,
          base: "bus-seat-selection",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Bus Booking",
          route: routes.busBooking,
          hasSubRoute: false,
          showSubRoute: false,
          base: "bus-bookings",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
        {
          menuValue: "Add Bus",
          route: routes.addBus,
          hasSubRoute: false,
          showSubRoute: false,
          base: "add-bus",
          page: "",
          last: "",
          subMenus: [],
          icon: "",
        },
      ],
    },
    {
      tittle: "Pages",
      base: "pages",
      subTitle: "Pages",
      showAsTab: false,
      separateRoute: false,
      tabMenu: true,
      img: "assets/img/menu/flight.jpg",
      menu: [
        {
          title: "Activity",
          id: "activity",
          id2: "mob_activity",
          showtab: true,
          img: "assets/img/menu/activity.jpg",
          subMenus: [
            {
              menuValue: "Activity Grid",
              route: routes.activityGrid,
              hasSubRoute: false,
              showSubRoute: false,
              base: "activity-grid",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Activity List",
              route: routes.activityList,
              hasSubRoute: false,
              showSubRoute: false,
              base: "activity-list",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Activity Map",
              route: routes.activityMap,
              hasSubRoute: false,
              showSubRoute: false,
              base: "activity-map",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Activity Details",
              route: routes.activityDetails,
              hasSubRoute: false,
              showSubRoute: false,
              base: "activity-details",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Activity Booking Confirmation",
              route: routes.activityBookingConfirmation,
              hasSubRoute: false,
              showSubRoute: false,
              base: "activity-booking-confirmation",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Add Activity",
              route: routes.addActivity,
              hasSubRoute: false,
              showSubRoute: false,
              base: "add-activity",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
          ],
        },
        {
          title: "Visa",
          id: "visa",
          id2: "mob_visa",
          showtab: false,
          img: "assets/img/menu/visa.jpg",
          subMenus: [
            {
              menuValue: "Visa Grid",
              route: routes.visaGrid,
              hasSubRoute: false,
              showSubRoute: false,
              base: "visa-grid",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Visa List",
              route: routes.visaList,
              hasSubRoute: false,
              showSubRoute: false,
              base: "visa-list",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Visa Details",
              route: routes.visaDetails,
              hasSubRoute: false,
              showSubRoute: false,
              base: "visa-details",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Visa Booking Confirmation",
              route: routes.visaBookingConfirmation,
              hasSubRoute: false,
              showSubRoute: false,
              base: "visa-booking-confirmation",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Add Visa",
              route: routes.addVisa,
              hasSubRoute: false,
              showSubRoute: false,
              base: "add-visa",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Track Visa",
              route: routes.trackVisa,
              hasSubRoute: false,
              showSubRoute: false,
              base: "track-visa",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Visa Requirements",
              route: routes.visaRequirements,
              hasSubRoute: false,
              showSubRoute: false,
              base: "visa-requirements",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
          ],
        },
        {
          title: "Guide",
          id: "guide",
          id2: "mob_guide",
          showtab: false,
          img: "assets/img/menu/guide.jpg",
          subMenus: [
            {
              menuValue: "Guide Grid",
              route: routes.guideGrid,
              hasSubRoute: false,
              showSubRoute: false,
              base: "guide-grid",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Guide Details",
              route: routes.guideDetails,
              hasSubRoute: false,
              showSubRoute: false,
              base: "guide-details",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Guide Booking",
              route: routes.guideBooking,
              hasSubRoute: false,
              showSubRoute: false,
              base: "guide-booking",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Guide Booking Confirmation",
              route: routes.guideBookingConfirmation,
              hasSubRoute: false,
              showSubRoute: false,
              base: "guide-booking-confirmation",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Add Guide",
              route: routes.addGuide,
              hasSubRoute: false,
              showSubRoute: false,
              base: "add-guide",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
          ],
        },
        {
          title: "Pages",
          id: "pages",
          id2: "mob_pages",
          showtab: false,
          subMenus: [
            {
              menuValue: "About",
              route: routes.about_us,
              hasSubRoute: false,
              showSubRoute: false,
              base: "about",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Gallery",
              route: routes.Gallery,
              hasSubRoute: false,
              showSubRoute: false,
              base: "gallery",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Testimonials",
              route: routes.Testimonials,
              hasSubRoute: false,
              showSubRoute: false,
              base: "testimonials",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Faq",
              route: routes.FAQ,
              hasSubRoute: false,
              showSubRoute: false,
              base: "faq",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Pricing Plan",
              route: routes.pricingPlan,
              hasSubRoute: false,
              showSubRoute: false,
              base: "pricing-plan",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Pricing Plan 2",
              route: routes.pricingPlantwo,
              hasSubRoute: false,
              showSubRoute: false,
              base: "pricing-plan-two",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Teams",
              route: routes.teams,
              hasSubRoute: false,
              showSubRoute: false,
              base: "teams",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Invoice",
              route: routes.invoices,
              hasSubRoute: false,
              showSubRoute: false,
              base: "invoice",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Blogs Grid",
              route: routes.blogGrid,
              hasSubRoute: false,
              showSubRoute: false,
              base: "blogs-grid",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Blogs List",
              route: routes.blogList,
              hasSubRoute: false,
              showSubRoute: false,
              base: "blogs-list",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Blogs Details",
              route: routes.blogDetails,
              hasSubRoute: false,
              showSubRoute: false,
              base: "blogs-details",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Destination",
              route: routes.destination,
              hasSubRoute: false,
              showSubRoute: false,
              base: "destination",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Destination Details",
              route: routes.destrinationDetails,
              hasSubRoute: false,
              showSubRoute: false,
              base: "destination-details",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Recently Viewed",
              route: routes.recentlyViewed,
              hasSubRoute: false,
              showSubRoute: false,
              base: "recently-viewed",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Bokking Confirmation",
              route: routes.termsConditions,
              hasSubRoute: false,
              showSubRoute: false,
              base: "Terms-Conditions",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Terms & Conditions",
              route: routes.termsConditions,
              hasSubRoute: false,
              showSubRoute: false,
              base: "Terms-Conditions",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Privacy Policy",
              route: routes.privacyPolicy,
              hasSubRoute: false,
              showSubRoute: false,
              base: "privacy-policy",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Login",
              route: routes.login,
              hasSubRoute: false,
              showSubRoute: false,
              base: "login",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Register",
              route: routes.register,
              hasSubRoute: false,
              showSubRoute: false,
              base: "register",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Forgot Password",
              route: routes.forgotPassword,
              hasSubRoute: false,
              showSubRoute: false,
              base: "forgot-password",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Change Password",
              route: routes.changepassword,
              hasSubRoute: false,
              showSubRoute: false,
              base: "change-password",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "404 Error",
              route: routes.Error404,
              hasSubRoute: false,
              showSubRoute: false,
              base: "404-error",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "500 Error",
              route: routes.Error500,
              hasSubRoute: false,
              showSubRoute: false,
              base: "500-error",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "RTL",
              route: routes.homeOneRtl,
              hasSubRoute: false,
              showSubRoute: false,
              base: "rtl",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
          ],
        },
        {
          title: "Dashboard",
          title2: "Admin Dashboard",
          id: "dashboard",
          id2: "mob_dashboard",
          showtab: false,
          subMenus: [
            {
              menuValue: "User Dashboard",
              route: accountDashboardRoute,
              hasSubRoute: false,
              showSubRoute: false,
              base: "dashboard",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "My Bookings",
              route: routes.userFlightBooking,
              hasSubRoute: false,
              showSubRoute: false,
              base: "customer-flight-bookings",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Reviews",
              route: routes.userReviews,
              hasSubRoute: false,
              showSubRoute: false,
              base: "about",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Wishlist",
              route: routes.userWishlist,
              hasSubRoute: false,
              showSubRoute: false,
              base: "wishlist",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Wallet",
              route: routes.userWallet,
              hasSubRoute: false,
              showSubRoute: false,
              base: "about",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Payments",
              route: routes.payment,
              hasSubRoute: false,
              showSubRoute: false,
              base: "payment",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Offers & Rewards",
              route: routes.userCoupons,
              hasSubRoute: false,
              showSubRoute: false,
              base: "customer-coupons",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Profile Settings",
              route: accountSettingsRoute,
              hasSubRoute: false,
              showSubRoute: false,
              base: "profile-settings",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Notifications",
              route: routes.notification,
              hasSubRoute: false,
              showSubRoute: false,
              base: "notification",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "My Profile",
              route: accountProfileRoute,
              hasSubRoute: false,
              showSubRoute: false,
              base: "my-profile",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue: "Settings",
              route: accountSettingsRoute,
              hasSubRoute: false,
              showSubRoute: false,
              base: "profile-settings",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Dashboard",
              route: accountDashboardRoute,
              hasSubRoute: false,
              showSubRoute: false,
              base: "agent-dashboard",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Listings",
              route: routes.agentListing,
              hasSubRoute: false,
              showSubRoute: false,
              base: "agent-listing",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Bookings",
              route: routes.agentHotelBooking,
              hasSubRoute: false,
              showSubRoute: false,
              base: "agent-hotel-booking",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Enquiries",
              route: routes.agentEnquirers,
              hasSubRoute: false,
              showSubRoute: false,
              base: "agent-enquirers",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Earnings",
              route: routes.agentEarnings,
              hasSubRoute: false,
              showSubRoute: false,
              base: "agent-earnings",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Payouts",
              route: routes.agentPendingPayouts,
              hasSubRoute: false,
              showSubRoute: false,
              base: "pending-payouts",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Reviews",
              route: routes.agentReview,
              hasSubRoute: false,
              showSubRoute: false,
              base: "agent-review",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
            {
              menuValue2: "Settings",
              route: accountSettingsRoute,
              hasSubRoute: false,
              showSubRoute: false,
              base: "agent-settings",
              page: "",
              last: "",
              subMenus: [],
              icon: "",
            },
          ],
        },
      ],
    },
    {
      tittle: "Contact",
      base: "base",
      showAsTab: false,
      separateRoute: false,
      standalone: true,
      menu: [],
    },
  ];
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 991) {
        setIsResponsive(true);
      } else {
        setIsResponsive(false);
        setIsOffcanva(false);
      }
    };

    // Call the function on mount
    handleResize();

    // Attach resize listener
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 130) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    // Add event listener
    window.addEventListener("scroll", handleScroll);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("class", dataTheme);
  }, [dataTheme]);
  const DarkButton = () => {
    return (
      <div className="me-3">
        <Link
          to="#"
          id="dark-mode-toggle"
          className={`theme-toggle ${dataTheme === "light" && "activate"}`}
          onClick={() => handleDataThemeChange("dark-mode")}
        >
          <i className="isax isax-moon" />
        </Link>
        <Link
          to="#"
          id="light-mode-toggle"
          className={`theme-toggle ${dataTheme === "dark-mode" && "activate"}`}
          onClick={() => handleDataThemeChange("light")}
        >
          <i className="isax isax-sun-1" />
        </Link>
      </div>
    );
  };
  return (
    <>
      <div
        className={`${location.pathname === "/index-10" || location.pathname === "/index-12" ? "" : "main-header"} ${location.pathname === "/index-4" || location.pathname === "/index-6" || location.pathname === "/index-8" ? "main-header-four" : ""} ${location.pathname === "/index-2" && "main-header-nine"} `}
      >
        {/* Header Topbar*/}
        {location.pathname === "/index" ||
          location.pathname === "/index-2" ||
          location.pathname === "/index-4" ||
          location.pathname === "/index-5" ||
          location.pathname === "/index-6" ||
          location.pathname === "/index-7" ||
          location.pathname === "/index-8" ||
          location.pathname === "/index-9" ||
          location.pathname === "/index-10" ||
          location.pathname === "/index-11" ||
          location.pathname === "/index-12" ? (
          <></>
        ) : (
          <div className="header-topbar text-center bg-transparent">
            <div className="container">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <p className="d-flex align-items-center fw-medium fs-14 mb-2">
                  <i className="isax isax-call5 me-2" />
                  Toll Free : +1 56565 56594
                </p>
                <div className="d-flex align-items-center">
                  <p className="mb-2 me-3 d-flex align-items-center fw-medium fs-14">
                    <i className="isax isax-message-text-15 me-2" />
                    Email : info@example.com
                  </p>
                  <div className="dropdown flag-dropdown mb-2 me-3">
                    <Link
                      to="#"
                      className="dropdown-toggle d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <ImageWithBasePath
                        src="assets/img/flags/us-flag.svg"
                        className="me-2"
                        alt="flag"
                      />
                      ENG
                    </Link>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/us-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          ENG
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/arab-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          ARA
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/france-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          FRE
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="dropdown mb-2 me-3">
                    <Link
                      to="#"
                      className="dropdown-toggle"
                      data-bs-toggle="dropdown"
                    >
                      USD
                    </Link>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          USD
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          YEN
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          EURO
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="fav-dropdown mb-2">
                    <Link to={routes.wishlist} className="position-relative">
                      <i className="isax isax-heart" />
                      <span className="count-icon bg-secondary text-gray-9">
                        0
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {location.pathname === "/index-6" && (
          <div className="header-topbar topbar-four text-center bg-transparent">
            <div className="container-fluid">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center flex-wrap">
                  <p className="d-flex align-items-center fs-14 mb-2 me-3 ">
                    <i className="isax isax-call5 me-2" />
                    Toll Free : +1 56565 56594
                  </p>
                  <p className="mb-2 d-flex align-items-center fs-14">
                    <i className="isax isax-message-text-15 me-2" />
                    Email : info@example.com
                  </p>
                </div>
                <div className="d-flex align-items-center">
                  <div className="dropdown flag-dropdown mb-2 me-3">
                    <Link
                      to="#"
                      className="dropdown-toggle d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <ImageWithBasePath
                        src="assets/img/flags/us-flag.svg"
                        className="me-2"
                        alt="flag"
                      />
                      ENG
                    </Link>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/us-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          ENG
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/arab-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          ARA
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/france-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          FRA
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="dropdown mb-2">
                    <Link
                      to="#"
                      className="dropdown-toggle"
                      data-bs-toggle="dropdown"
                    >
                      USD
                    </Link>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          USD
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          YEN
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          EURO
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {location.pathname === "/index-8" && (
          <div className="header-topbar header-top-six text-center bg-transparent">
            <div className="container">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center flex-wrap">
                  <p className="d-flex align-items-center fs-14 mb-2 me-3 ">
                    <i className="isax isax-call5 me-2" />
                    Toll Free : +1 56565 56594
                  </p>
                  <p className="mb-2 d-flex align-items-center fs-14">
                    <i className="isax isax-message-text-15 me-2" />
                    Email : info@example.com
                  </p>
                </div>
                <div className="navbar-logo mb-2">
                  <Link className="logo-dark header-logo" to={routes.allService1}>
                    <ImageWithBasePath
                      src="assets/img/logo-dark.svg"
                      className="logo"
                      alt="Logo"
                    />
                  </Link>
                  <Link className="logo-white header-logo" to={routes.allService1}>
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="logo"
                      alt="Logo"
                    />
                  </Link>
                </div>
                <div className="d-flex align-items-center">
                  <div className="dropdown mb-2 me-3">
                    <Link
                      to="#"
                      className="dropdown-toggle"
                      data-bs-toggle="dropdown"
                    >
                      USD
                    </Link>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          USD
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          YEN
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          EURO
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <DarkButton />
                  <div className="fav-dropdown  me-3">
                    <Link to={routes.wishlist} className="position-relative">
                      <i className="isax isax-heart" />
                      <span className="count-icon bg-secondary text-gray-9">
                        0
                      </span>
                    </Link>
                  </div>
                  <div>
                    <Link
                      to="#"
                      className="text-white btn btn-dark w-100 mb-2"
                      data-bs-toggle="modal"
                      data-bs-target="#login-modal"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {location.pathname === "/index-2" && (
          <div className="header-topbar topbar-four topbar-nine text-center">
            <div className="container-fluid">
              <div className="d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center">
                  <div className="dropdown flag-dropdown me-3 mt-1">
                    <Link
                      to="#"
                      className="dropdown-toggle d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <ImageWithBasePath
                        src="assets/img/flags/us-flag.svg"
                        className="me-2"
                        alt="flag"
                      />
                      ENG
                    </Link>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/us-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          ENG
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/arab-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          ARA
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item rounded d-flex align-items-center"
                          to="#"
                        >
                          <ImageWithBasePath
                            src="assets/img/flags/france-flag.svg"
                            className="me-2"
                            alt="flag"
                          />
                          FRA
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle p-2 py-1 rounded-pill fs-12 fw-medium"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      USD
                    </Link>
                    <ul className="dropdown-menu p-2 mt-2">
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          USD
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          YEN
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item rounded" to="#">
                          EURO
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="d-flex align-items-center flex-wrap">
                  <p className="d-flex align-items-center fs-14 mb-0 me-3 ">
                    <i className="isax isax-call5 me-2" />
                    Toll Free : +1 56565 56594
                  </p>
                  <p className="mb-0 d-flex align-items-center fs-14">
                    <i className="isax isax-message-text-15 me-2" />
                    Email : info@example.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* /Header Topbar*/}
        {/* Header */}
        <header
          className={`${scrolled ? "fixed" : ""} ${location.pathname === "/index" && "header-eight"} ${location.pathname === "/index-2" && "header-nine header-four"}
          ${location.pathname === "/index-4" || (location.pathname === "/index-9" && "header-four")} 
          ${location.pathname === "/index-5" && "header-three"} ${location.pathname === "/index-6" && "header-four"} 
          ${location.pathname === "/index-7" && "header-five"} ${location.pathname === "/index-8" && "header-six"} 
          ${location.pathname === "/index-9" && "header-seven"} ${location.pathname === "/index-10" && "header-ten"} 
          ${location.pathname === "/index-11" && "header-eleven"} ${location.pathname === "/index-12" && "header-eight header-twelve"}`}
        >
          <div
            className={` ${location.pathname === "/index" || location.pathname === "/index-10" || location.pathname === "/index-2" || location.pathname === "/index-6" || location.pathname === "/index-11" || location.pathname === "/index-12" ? "container-fluid" : "container"}`}
          >
            <div className={`offcanvas-info ${isOffcanva ? "show" : ""}`}>
              <div className="offcanvas-wrap">
                <div className="offcanvas-detail">
                  <div className="offcanvas-head">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <Link to={routes.allService1} className="black-logo-responsive">
                        <ImageWithBasePath
                          src="assets/img/logo-dark.svg"
                          alt="logo-img"
                        />
                      </Link>
                      <Link to={routes.allService1} className="white-logo-responsive">
                        <ImageWithBasePath
                          src="assets/img/logo.svg"
                          alt="logo-img"
                        />
                      </Link>
                      <div
                        className="offcanvas-close"
                        onClick={() => setIsOffcanva(false)}
                      >
                        <i className="ti ti-x" />
                      </div>
                    </div>
                    <div className="wishlist-info d-flex justify-content-between align-items-center">
                      <h6 className="fs-16 fw-medium">Wishlist</h6>
                      <div className="d-flex align-items-center">
                        <div className="fav-dropdown">
                          <Link
                            to={routes.wishlist}
                            className="position-relative"
                          >
                            <i className="isax isax-heart" />
                            <span className="count-icon bg-secondary text-gray-9">
                              0
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`mobile-menu fix mb-3 ${isResponsive ? "mean-container" : ""}`}
                  >
                    <div className="mean-bar">
                      <nav className="mean-nav">
                        <ul className="main-nav" style={{ display: "none" }}>
                          {sideBar.map((mainMenus, i) => (
                            <React.Fragment key={i}>
                              {mainMenus.separateRoute ? (
                                <li
                                  className={`has-submenu megamenu active ${isDropdownOpen ? "dropdown-opened" : ""
                                    }`}
                                >
                                  <Link to="#" onClick={openSubMenu}>
                                    {mainMenus.tittle}

                                    <i className="fa-solid fa-angle-down"></i>
                                  </Link>
                                  <ul
                                    className={`submenu mega-submenu ${mainMenus.tittle === "Home" ? "home-menu" : ""}`}
                                    style={{
                                      display: isDropdownOpen
                                        ? "block"
                                        : "none",
                                    }}
                                  >
                                    <li>
                                      <div className="megamenu-wrapper">
                                        <div className="d-none d-lg-flex align-items-center justify-content-between flex-wrap">
                                          <h6 className="mb-3">Home Pages</h6>
                                          <Link
                                            to="#"
                                            className="btn btn-dark btn-md mb-3 text-white d-inline-block w-auto"
                                          >
                                            Purchase Template
                                          </Link>
                                        </div>
                                        <div className="row">
                                          {mainMenus.menu.map(
                                            (menu: any, index: any) => (
                                              <div
                                                className="col-lg-2"
                                                key={index}
                                              >
                                                <div
                                                  className={`single-demo ${menu.base === mainMenus.base
                                                    ? "active"
                                                    : ""
                                                    }`}
                                                >
                                                  <div className="demo-img">
                                                    <Link to={menu.route}>
                                                      <ImageWithBasePath
                                                        src={menu.img}
                                                        className="img-fluid"
                                                        alt="img"
                                                      />
                                                    </Link>
                                                  </div>
                                                  <div className="demo-info">
                                                    <Link to={menu.route}>
                                                      {menu.homeName}
                                                    </Link>
                                                  </div>
                                                </div>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </li>
                                  </ul>
                                  <Link
                                    className={`mean-expand ${isDropdownOpen ? "mean-clicked" : ""
                                      }`}
                                    to="#"
                                    style={{ fontSize: "18px" }}
                                    onClick={openSubMenu}
                                  >
                                    <i className="ti ti-plus"></i>
                                  </Link>
                                </li>
                              ) : mainMenus.standalone ? (
                                <li
                                  className={`${location.pathname.includes('contact-us') && "active"}`}
                                >
                                  <Link to={routes.contactUs}>
                                    {mainMenus.tittle}
                                  </Link>
                                </li>
                              ) : (
                                <>
                                  {mainMenus.tabMenu ? (
                                    <li
                                      className={`has-submenu megamenutab ${mainMenus?.menu?.some((item: any) => item?.route?.includes(location.pathname)) ? "active" : ""}`}
                                      onClick={() => toggleSubMenu(7)}
                                    >
                                      <Link to="#">
                                        {mainMenus.tittle}
                                        <i className="fa-solid fa-angle-down"></i>
                                      </Link>
                                      <ul className="submenu mega-submenu" style={{
                                        display:
                                          openDropdownIndex === 7
                                            ? "block"
                                            : "none",
                                      }}>
                                        <li>
                                          <div className="megamenu-wrapper">
                                            <div className="row">
                                              <div className="col-lg-3">
                                                <div
                                                  className="nav flex-column nav-pills menu-tab"
                                                  id="menu-tab"
                                                  role="tablist"
                                                  aria-orientation="vertical"
                                                >
                                                  <ul>
                                                    {mainMenus.menu.map(
                                                      (menu: any, idx: any) => (
                                                        <li key={idx}>
                                                          <Link
                                                            className={`nav-link ${menu.showtab ? "active" : ""}`}
                                                            id="activity-tab"
                                                            data-bs-toggle="tab"
                                                            to={`#${menu.id2}`}
                                                            role="tab"
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            {menu.title}
                                                          </Link>
                                                        </li>
                                                      ),
                                                    )}
                                                  </ul>
                                                </div>
                                              </div>
                                              <div className="col-lg-9">
                                                <div
                                                  className="tab-content tab-menulist"
                                                  id="menu-tabContent"
                                                >
                                                  {mainMenus.menu.map(
                                                    (menu: any, idx: any) => (
                                                      <div
                                                        className={`tab-pane fade ${menu.showtab ? "show active" : ""}`}
                                                        id={menu.id2}
                                                        role="tabpanel"
                                                        key={idx}
                                                      >
                                                        {menu.title ===
                                                          "Pages" && (
                                                            <h6>{menu.title}</h6>
                                                          )}
                                                        <div className="row">
                                                          <div className="col-lg-6">
                                                            { }
                                                            {menu.title !==
                                                              "Pages" && (
                                                                <h6>
                                                                  {menu.title}
                                                                </h6>
                                                              )}
                                                            <ul>
                                                              {menu.subMenus
                                                                .filter(
                                                                  (
                                                                    subMenu: any,
                                                                  ) =>
                                                                    subMenu &&
                                                                    subMenu.menuValue &&
                                                                    subMenu.menuValue.trim() !==
                                                                    "",
                                                                )
                                                                .map(
                                                                  (
                                                                    subMenu: any,
                                                                    idx: number,
                                                                  ) => (
                                                                    <li
                                                                      key={idx}
                                                                    >
                                                                      <Link
                                                                        to={
                                                                          subMenu.route
                                                                        }
                                                                      >
                                                                        {
                                                                          subMenu.menuValue
                                                                        }
                                                                      </Link>
                                                                    </li>
                                                                  ),
                                                                )}
                                                            </ul>
                                                          </div>
                                                          <div className="col-lg-6">
                                                            {menu.img ? (
                                                              <div className="menu-img">
                                                                <ImageWithBasePath
                                                                  src={menu.img}
                                                                  alt="img"
                                                                  className="img-fluid"
                                                                />
                                                              </div>
                                                            ) : (
                                                              <>
                                                                {menu.title2 && (
                                                                  <h6>
                                                                    {
                                                                      menu.title2
                                                                    }
                                                                  </h6>
                                                                )}
                                                                <ul>
                                                                  {menu.subMenus
                                                                    .filter(
                                                                      (
                                                                        subMenu: any,
                                                                      ) =>
                                                                        subMenu &&
                                                                        subMenu.menuValue2 &&
                                                                        subMenu.menuValue2.trim() !==
                                                                        "",
                                                                    )
                                                                    .map(
                                                                      (
                                                                        subMenu: any,
                                                                        idx: number,
                                                                      ) => (
                                                                        <li
                                                                          key={
                                                                            idx
                                                                          }
                                                                        >
                                                                          <Link
                                                                            to={
                                                                              subMenu.route
                                                                            }
                                                                          >
                                                                            {
                                                                              subMenu.menuValue2
                                                                            }
                                                                          </Link>
                                                                        </li>
                                                                      ),
                                                                    )}
                                                                </ul>
                                                              </>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              </div>


                                            </div>
                                          </div>
                                        </li>
                                      </ul>
                                      <Link className="mean-expand" to="#"><i className="ti ti-plus"></i></Link>
                                    </li>
                                  ) : (
                                    <li
                                      className={`has-submenu mega-innermenu ${openDropdownIndex === i
                                        ? "dropdown-opened"
                                        : ""
                                        }`}
                                    >
                                      <Link
                                        to="#"
                                        onClick={() => toggleSubMenu(i)}
                                      >
                                        {mainMenus.tittle}
                                        <i className="fa-solid fa-angle-down"></i>
                                      </Link>
                                      <ul
                                        className="submenu mega-submenu"
                                        style={{
                                          display:
                                            openDropdownIndex === i
                                              ? "block"
                                              : "none",
                                        }}
                                      >
                                        <li>
                                          <div className="megamenu-wrapper">
                                            <div className="row">
                                              <div className="col-lg-6">
                                                <h6>{mainMenus.tittle}</h6>
                                                <ul>
                                                  {mainMenus.menu.map(
                                                    (menu: any, index: any) => (
                                                      <React.Fragment
                                                        key={index}
                                                      >
                                                        {!mainMenus.tabMenu && (
                                                          <li>
                                                            <Link
                                                              to={
                                                                routes.flightGrid
                                                              }
                                                            >
                                                              {menu.menuValue}
                                                            </Link>
                                                          </li>
                                                        )}
                                                        {mainMenus.tabMenu &&
                                                          menu.menuValue && (
                                                            <li>
                                                              <Link
                                                                to={
                                                                  routes.flightGrid
                                                                }
                                                              >
                                                                {menu.menuValue}
                                                              </Link>
                                                            </li>
                                                          )}
                                                        {mainMenus.tabMenu &&
                                                          menu.menuValue2 && (
                                                            <li>
                                                              <Link
                                                                to={
                                                                  routes.flightGrid
                                                                }
                                                              >
                                                                {
                                                                  menu.menuValue2
                                                                }
                                                              </Link>
                                                            </li>
                                                          )}
                                                      </React.Fragment>
                                                    ),
                                                  )}
                                                </ul>
                                                <Link
                                                  className="mean-expand"
                                                  to="#"
                                                  style={{ fontSize: "18px" }}
                                                >
                                                  <i className="ti ti-plus"></i>
                                                </Link>
                                              </div>
                                              <div className="col-lg-6">
                                                <div className="menu-img">
                                                  <ImageWithBasePath
                                                    src={mainMenus?.img || ""}
                                                    alt="img"
                                                    className="img-fluid"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </li>
                                      </ul>
                                      <Link
                                        className={`mean-expand ${openDropdownIndex === i
                                          ? "mean-clicked"
                                          : ""
                                          }`}
                                        to="#"
                                        style={{ fontSize: "18px" }}
                                        onClick={() => toggleSubMenu(i)}
                                      >
                                        <i className="ti ti-plus"></i>
                                      </Link>
                                    </li>
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          ))}
                        </ul>
                      </nav>
                    </div>
                  </div>
                  <div className="offcanvas__contact">
                    <div className="mt-4">
                      <div className="header-dropdown d-flex flex-fill">
                        <div className="w-100">
                          <div className="dropdown flag-dropdown mb-2">
                            <Link
                              to="#"
                              className="dropdown-toggle bg-white border d-flex align-items-center"
                              data-bs-toggle="dropdown"
                            >
                              <ImageWithBasePath
                                src="assets/img/flags/us-flag.svg"
                                className="me-2"
                                alt="flag"
                              />
                              ENG
                            </Link>
                            <ul className="dropdown-menu p-2">
                              <li>
                                <Link
                                  className="dropdown-item rounded d-flex align-items-center"
                                  to="#"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/flags/us-flag.svg"
                                    className="me-2"
                                    alt="flag"
                                  />
                                  ENG
                                </Link>
                              </li>
                              <li>
                                <Link
                                  className="dropdown-item rounded d-flex align-items-center"
                                  to="#"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/flags/arab-flag.svg"
                                    className="me-2"
                                    alt="flag"
                                  />
                                  ARA
                                </Link>
                              </li>
                              <li>
                                <Link
                                  className="dropdown-item rounded d-flex align-items-center"
                                  to="#"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/flags/france-flag.svg"
                                    className="me-2"
                                    alt="flag"
                                  />
                                  FRE
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div className="dropdown">
                            <Link
                              to="#"
                              className="dropdown-toggle bg-white border d-block"
                              data-bs-toggle="dropdown"
                            >
                              USD
                            </Link>
                            <ul className="dropdown-menu p-2">
                              <li>
                                <Link className="dropdown-item rounded" to="#">
                                  USD
                                </Link>
                              </li>
                              <li>
                                <Link className="dropdown-item rounded" to="#">
                                  YEN
                                </Link>
                              </li>
                              <li>
                                <Link className="dropdown-item rounded" to="#">
                                  EURO
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Link
                          to="#"
                          className="text-white btn btn-dark w-100 mb-3"
                          data-bs-toggle="modal"
                          data-bs-target="#login-modal"
                        >
                          Sign In
                        </Link>
                      </div>
                      <Link
                        to={routes.becomeAnExpert}
                        className="btn btn-primary w-100"
                      >
                        Become Expert
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`offcanvas-overlay ${isOffcanva ? "overlay-open" : ""}`}
              onClick={() => setIsOffcanva(false)}
            />
            <div className="header-nav">
              <div className="main-menu-wrapper">
                <div className="navbar-logo">
                  <Link className="logo-white header-logo" to={routes.allService1}>
                    {location.pathname === "/index-4" ||
                      location.pathname === "/index-2" ||
                      location.pathname === "/index-5" ||
                      location.pathname === "/index-6" ||
                      location.pathname === "/index-7" ? (
                      <ImageWithBasePath
                        src="assets/img/logo-dark.svg"
                        className="logo"
                        alt="Logo"
                      />
                    ) : location.pathname === "/index-10" ? (
                      <ImageWithBasePath
                        src="assets/img/logo-10.svg"
                        className="logo"
                        alt="Logo"
                      />
                    ) : (
                      <ImageWithBasePath
                        src="assets/img/logo.svg"
                        className="logo"
                        alt="Logo"
                      />
                    )}
                  </Link>
                  {location.pathname !== routes.home6 && (
                    <Link className="logo-dark header-logo" to={routes.allService1}>
                      {location.pathname === "/index-4" ||
                        location.pathname === "/index-2" ||
                        location.pathname === "/index-5" ||
                        location.pathname === "/index-6" ||
                        location.pathname === "/index-7" ||
                        location.pathname === "/index-9" ? (
                        <ImageWithBasePath
                          src="assets/img/logo.svg"
                          className="logo"
                          alt="Logo"
                        />
                      ) : (
                        <ImageWithBasePath
                          src="assets/img/logo-dark.svg"
                          className="logo"
                          alt="Logo"
                        />
                      )}
                    </Link>
                  )}
                </div>
                <nav id="mobile-menu">
                  <ul className={`main-nav ${isMegaMenu ? "active" : ""}`}>
                    {sideBar.map((mainMenus: any, index) => (
                      <React.Fragment key={index}>
                        {mainMenus.separateRoute ? (
                          <li
                            className={`has-submenu megamenu ${mainMenus?.menu?.some((item: any) => item?.route?.includes(location.pathname)) ? "active" : ""}`}
                            onMouseOver={() => setIsMegaMenu(true)}
                            onMouseLeave={() => setIsMegaMenu(false)}
                          >
                            <Link to="#">
                              {mainMenus.tittle}
                              <i className="fa-solid fa-angle-down"></i>
                            </Link>
                            <ul
                              className={`submenu mega-submenu ${mainMenus.tittle === "Home" ? "home-menu" : ""}`}
                              onMouseOver={() => setIsMegaMenu(true)}
                              onMouseLeave={() => setIsMegaMenu(false)}
                            >
                              <li>
                                <div className="megamenu-wrapper">
                                  <div className="d-none d-lg-flex align-items-center justify-content-between flex-wrap">
                                    <h6 className="mb-3">Home Pages</h6>
                                    <Link
                                      to="#"
                                      className="btn btn-dark btn-md mb-3 text-white d-inline-block w-auto"
                                    >
                                      Purchase Template
                                    </Link>
                                  </div>
                                  <div className="row g-lg-4">
                                    {mainMenus.menu.map(
                                      (menu: any, idx: any) => (
                                        <div className="col-lg-2" key={idx}>
                                          <div
                                            className={`single-demo ${location.pathname === menu.route ? "active" : ""}`}
                                          >
                                            <div className="demo-img">
                                              <Link to={menu.route}>
                                                <ImageWithBasePath
                                                  src={menu.img}
                                                  className="img-fluid"
                                                  alt="img"
                                                />
                                              </Link>
                                            </div>
                                            <div className="demo-info">
                                              <Link to={menu.route} className={`${location.pathname === menu.route ? "active" : ""}`}>
                                                {menu.homeName}
                                              </Link>
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              </li>
                            </ul>
                          </li>
                        ) : mainMenus.standalone ? (
                          <li
                            className={`${location.pathname.includes('contact-us') && "active"}`}
                          >
                            <Link to={routes.contactUs}>
                              {mainMenus.tittle}
                            </Link>
                          </li>
                        ) : (
                          <>
                            {mainMenus.tabMenu ? (
                              <li
                                className={`has-submenu megamenutab ${mainMenus?.menu?.some((item: any) => item?.route?.includes(location.pathname)) ? "active" : ""} 
                                ${location.pathname.includes('activity') || location.pathname.includes('visa') || location.pathname.includes('guide') || location.pathname.includes('pages') || location.pathname.includes('user') || location.pathname.includes('agent') ? 'active' : ''}`}
                              >
                                <Link to="#">
                                  {mainMenus.tittle}
                                  <i className="fa-solid fa-angle-down"></i>
                                </Link>
                                <ul className="submenu mega-submenu">
                                  <li>
                                    <div className="megamenu-wrapper">
                                      <div className="row">
                                        <div className="col-lg-3">
                                          <div
                                            className="nav flex-column nav-pills menu-tab"
                                            id="menu-tab"
                                            role="tablist"
                                            aria-orientation="vertical"
                                          >
                                            <ul>
                                              {mainMenus.menu.map(
                                                (menu: any, idx: any) => (
                                                  <li key={idx}>
                                                    <Link
                                                      className={`nav-link ${menu.showtab ? "active" : ""}`}
                                                      id="activity-tab"
                                                      data-bs-toggle="tab"
                                                      to={`#${menu.id}`}
                                                      role="tab"
                                                    >
                                                      {menu.title}
                                                    </Link>
                                                  </li>
                                                ),
                                              )}
                                            </ul>
                                          </div>
                                        </div>
                                        <div className="col-lg-9">
                                          <div
                                            className="tab-content tab-menulist"
                                            id="menu-tabContent"
                                          >
                                            {mainMenus.menu.map(
                                              (menu: any, idx: any) => (
                                                <div
                                                  className={`tab-pane fade ${menu.showtab ? "show active" : ""}`}
                                                  id={menu.id}
                                                  role="tabpanel"
                                                  key={idx}
                                                >
                                                  {menu.title === "Pages" && (
                                                    <h6>{menu.title}</h6>
                                                  )}
                                                  <div className="row">
                                                    <div className="col-lg-6">
                                                      { }
                                                      {menu.title !==
                                                        "Pages" && (
                                                          <h6>{menu.title === 'Dashboard' ? 'User Dashboard' : menu.title}</h6>
                                                        )}
                                                      <ul>
                                                        {menu.subMenus
                                                          .filter(
                                                            (subMenu: any) =>
                                                              subMenu &&
                                                              subMenu.menuValue &&
                                                              subMenu.menuValue.trim() !==
                                                              "",
                                                          )
                                                          .map(
                                                            (
                                                              subMenu: any,
                                                              idx: number,
                                                            ) => (
                                                              <li key={idx} className={`${location.pathname === subMenu.route ? 'active' : ''}`}>
                                                                <Link
                                                                  to={
                                                                    subMenu.route
                                                                  }
                                                                >
                                                                  {
                                                                    subMenu.menuValue
                                                                  }
                                                                </Link>
                                                              </li>
                                                            ),
                                                          )}
                                                      </ul>
                                                    </div>
                                                    <div className="col-lg-6">
                                                      {menu.img ? (
                                                        <div className="menu-img">
                                                          <ImageWithBasePath
                                                            src={menu.img}
                                                            alt="img"
                                                            className="img-fluid"
                                                          />
                                                        </div>
                                                      ) : (
                                                        <>
                                                          {menu.title2 && (
                                                            <h6>
                                                              {menu.title2}
                                                            </h6>
                                                          )}
                                                          <ul>
                                                            {menu.subMenus
                                                              .filter(
                                                                (
                                                                  subMenu: any,
                                                                ) =>
                                                                  subMenu &&
                                                                  subMenu.menuValue2 &&
                                                                  subMenu.menuValue2.trim() !==
                                                                  "",
                                                              )
                                                              .map(
                                                                (
                                                                  subMenu: any,
                                                                  idx: number,
                                                                ) => (
                                                                  <li
                                                                    key={idx}
                                                                    className={
                                                                      location.pathname ===
                                                                        subMenu.route
                                                                        ? "active"
                                                                        : ""
                                                                    }
                                                                  >
                                                                    <Link
                                                                      to={
                                                                        subMenu.route
                                                                      }
                                                                    >
                                                                      {
                                                                        subMenu.menuValue2
                                                                      }
                                                                    </Link>
                                                                  </li>
                                                                ),
                                                              )}
                                                          </ul>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>

                                        {/* <div className="col-lg-9">
                                          <h6>{mainMenus.subTitle}</h6>
                                          <ul>
                                            {mainMenus.menu.map((menu: { menuValue: any, route: string; }, idx: React.Key | null | undefined) => (
                                              menu.menuValue &&
                                              <li key={idx} className={location.pathname === menu.route ? 'active' : ''}>
                                                <Link to={menu.route}>{menu.menuValue}</Link>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        <div className="col-lg-6">
                                          <h6>{mainMenus.subTitle2}</h6>
                                          <ul>
                                            {mainMenus.menu.map((menu: { menuValue2: any, route: string; }, idx: React.Key | null | undefined) => (
                                              menu.menuValue2 &&
                                              <li key={idx} className={location.pathname === menu.route ? 'active' : ''}>
                                                <Link to={menu.route}>{menu.menuValue2}</Link>
                                              </li>
                                            ))}
                                          </ul>
                                        </div> */}
                                      </div>
                                    </div>
                                  </li>
                                </ul>
                              </li>
                            ) : (
                              <li
                                className={`has-submenu mega-innermenu ${mainMenus?.menu?.some((item: any) => item?.route?.includes(location.pathname)) ? "active" : ""}`}
                              >
                                <Link to="#">
                                  {mainMenus.tittle}
                                  <i className="fa-solid fa-angle-down"></i>
                                </Link>
                                <ul className="submenu mega-submenu">
                                  <li>
                                    <div className="megamenu-wrapper">
                                      <div className="row">
                                        <div className="col-lg-6">
                                          <h6>{mainMenus.subTitle}</h6>
                                          <ul>
                                            {mainMenus.menu.map(
                                              (
                                                menu: {
                                                  menuValue: string;
                                                  route: string;
                                                },
                                                idx:
                                                  | React.Key
                                                  | null
                                                  | undefined,
                                              ) => (
                                                <li
                                                  key={idx}
                                                  className={
                                                    location.pathname ===
                                                      menu.route
                                                      ? "active"
                                                      : ""
                                                  }
                                                >
                                                  <Link to={menu.route}>
                                                    {menu.menuValue}
                                                  </Link>
                                                </li>
                                              ),
                                            )}
                                          </ul>
                                        </div>
                                        <div className="col-lg-6">
                                          <div className="menu-img">
                                            <ImageWithBasePath
                                              src={mainMenus.img}
                                              className="img-fluid"
                                              alt="img"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                </ul>
                              </li>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </ul>
                </nav>
                {isPublicHomeRoute ? (
                  loading ? (
                    <div className="header-btn d-flex align-items-center" aria-busy="true">
                      <DarkButton />
                    </div>
                  ) : isAuthenticated ? (
                    <div className="header-btn d-flex align-items-center">
                      <DarkButton />
                      <div className="dropdown profile-dropdown">
                        <Link
                          to="#"
                          className="d-flex align-items-center"
                          data-bs-toggle="dropdown"
                        >
                          <span className="avatar avatar-md">
                            <ImageWithBasePath
                              src={userProfile?.photoURL || "assets/img/users/user-05.jpg"}
                              alt="Img"
                              className="img-fluid rounded-circle border border-white border-4"
                            />
                          </span>
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                              to={accountDashboardRoute}
                            >
                              Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                              to={accountBookingsRoute}
                            >
                              My Booking
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                              to={accountProfileRoute}
                            >
                              My Profile
                            </Link>
                          </li>
                          <li>
                            <hr className="dropdown-divider my-2" />
                          </li>
                          <li>
                            <Link
                              className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                              to={accountSettingsRoute}
                            >
                              Settings
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                              to="#"
                              onClick={handleLogout}
                            >
                              Logout
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="header-btn d-flex align-items-center">
                      <DarkButton />
                      <div className="fav-dropdown me-3">
                        <Link
                          to={all_routes.wishlist}
                          className="position-relative text-white wishlist-icon"
                        >
                          <i className="isax isax-heart" />
                          <span className="count-icon bg-secondary text-white">
                            0
                          </span>
                        </Link>
                      </div>
                      <div className="d-flex align-items-center">
                        <Link
                          to="#"
                          className="text-white btn btn-primary w-100"
                          data-bs-toggle="modal"
                          data-bs-target="#login-modal"
                        >
                          <i className="isax isax-lock5 me-1" />
                          Login
                        </Link>
                        <Link to="#" className="text-white btn btn-dark w-100">
                          <i className="isax isax-user-minus me-1" />
                          Register
                        </Link>
                      </div>
                      <div className="header__hamburger d-xl-none my-auto">
                        <div className="sidebar-menu">
                          <i className="isax isax-menu5" />
                        </div>
                      </div>
                    </div>
                  )
                ) : location.pathname === "/index-2" ? (
                  <div className="header-btn d-flex align-items-center">
                    <DarkButton />
                    <div className="fav-dropdown me-3">
                      <Link
                        to={all_routes.wishlist}
                        className="position-relative wishlist-icon"
                      >
                        <i className="isax isax-heart" />
                        <span className="count-icon bg-secondary text-gray-9">
                          0
                        </span>
                      </Link>
                    </div>
                    <Link
                      to="#"
                      className="btn btn-primary d-inline-flex align-items-center me-2"
                    >
                      <i className="isax isax-lock5 me-2" />
                      Login
                    </Link>
                    <Link
                      to={all_routes.register}
                      className="btn btn-dark d-inline-flex align-items-center me-0"
                    >
                      <i className="isax isax-profile-remove5 me-2" />
                      Register
                    </Link>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div className="sidebar-menu">
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-3" ? (
                  <div className="header-btn d-flex align-items-center">
                    <DarkButton />
                    <div>
                      <Link
                        to="#"
                        className="btn btn-white me-3"
                        data-bs-toggle="modal"
                        data-bs-target="#login-modal"
                      >
                        Sign In
                      </Link>
                    </div>
                    <Link
                      to={routes.becomeAnExpert}
                      className="btn btn-primary me-0"
                    >
                      Become Expert
                    </Link>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div
                        className="sidebar-menu"
                        onClick={() => setIsOffcanva(true)}
                      >
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-4" ? (
                  <div className="header-btn d-flex align-items-center">
                    <div className="dropdown flag-dropdown me-3">
                      <Link
                        to="#"
                        className="d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <ImageWithBasePath
                          src="assets/img/flags/us-flag.svg"
                          alt="flag"
                        />
                      </Link>
                      <ul className="dropdown-menu p-2 mt-2">
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/us-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            ENG
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/arab-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            ARA
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/france-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            FRE
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown me-3">
                      <Link
                        to="#"
                        className="dropdown-toggle"
                        data-bs-toggle="dropdown"
                      >
                        USD
                      </Link>
                      <ul className="dropdown-menu p-2 mt-2">
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            USD
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            YEN
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            EURO
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="me-3">
                      <Link to={accountDashboardRoute}>
                        <i className="isax isax-user" />
                      </Link>
                    </div>
                    <DarkButton />
                    <div className="fav-dropdown me-3">
                      <Link to={routes.wishlist} className="position-relative">
                        <i className="isax isax-heart" />
                        <span className="count-icon bg-secondary text-gray-9">
                          0
                        </span>
                      </Link>
                    </div>
                    <Link
                      to={routes.becomeAnExpert}
                      className="btn btn-primary"
                    >
                      Become Expert
                    </Link>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div
                        className="sidebar-menu"
                        onClick={() => setIsOffcanva(true)}
                      >
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-5" ? (
                  <div className="header-btn d-flex align-items-center">
                    <div className="cart-dropdown me-3">
                      <Link
                        to={accountDashboardRoute}
                        className="position-relative"
                      >
                        <i className="isax isax-user" />
                      </Link>
                    </div>
                    <DarkButton />
                    <div className="fav-dropdown me-3">
                      <Link to={routes.wishlist} className="position-relative">
                        <i className="isax isax-heart" />
                        <span className="count-icon bg-secondary text-gray-9">
                          0
                        </span>
                      </Link>
                    </div>
                    <div>
                      <Link
                        to="#"
                        className="text-white fs-13 btn btn-dark btn-md"
                        data-bs-toggle="modal"
                        data-bs-target="#login-modal"
                      >
                        Sign In
                      </Link>
                    </div>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div
                        className="sidebar-menu"
                        onClick={() => setIsOffcanva(true)}
                      >
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-6" ? (
                  <>
                    <div className="header-btn d-flex align-items-center">
                      <DarkButton />
                      <div className="fav-dropdown me-3">
                        <Link
                          to={routes.wishlist}
                          className="position-relative"
                        >
                          <i className="isax isax-heart" />
                          <span className="count-icon bg-secondary text-gray-9">
                            0
                          </span>
                        </Link>
                      </div>
                      <Link
                        to={routes.addFlight}
                        className="btn btn-dark d-inline-flex align-items-center me-2"
                      >
                        <i className="isax isax-lock me-2" />
                        Add Your Listing
                      </Link>
                      <Link
                        to={routes.register}
                        className="btn btn-dark d-inline-flex align-items-center me-0"
                      >
                        <i className="isax isax-lock me-2" />
                        Sign Up
                      </Link>
                      <div className="header__hamburger d-xl-none my-auto">
                        <div
                          className="sidebar-menu"
                          onClick={() => setIsOffcanva(true)}
                        >
                          <i className="isax isax-menu5" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : location.pathname === "/index-7" ? (
                  <div className="header-btn d-flex align-items-center">
                    <div className="cart-dropdown me-3">
                      <Link
                        to={accountDashboardRoute}
                        className="position-relative"
                      >
                        <i className="isax isax-user" />
                      </Link>
                    </div>
                    <DarkButton />
                    <div className="fav-dropdown me-3">
                      <Link to={routes.wishlist} className="position-relative">
                        <i className="isax isax-heart" />
                        <span className="count-icon bg-secondary text-gray-9">
                          0
                        </span>
                      </Link>
                    </div>
                    <div>
                      <Link
                        to="#"
                        className="text-white btn btn-dark w-100"
                        data-bs-toggle="modal"
                        data-bs-target="#login-modal"
                      >
                        Sign In
                      </Link>
                    </div>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div
                        className="sidebar-menu"
                        onClick={() => setIsOffcanva(true)}
                      >
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-8" ? (
                  <div className="header__hamburger d-xl-none my-auto">
                    <div
                      className="sidebar-menu"
                      onClick={() => setIsOffcanva(true)}
                    >
                      <i className="isax isax-menu5" />
                    </div>
                  </div>
                ) : location.pathname === "/index-9" ? (
                  <div className="header-btn d-flex align-items-center">
                    <div className="dropdown me-3">
                      <Link
                        to="#"
                        className="dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        USD
                      </Link>
                      <ul className="dropdown-menu p-2 mt-2" style={{}}>
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            USD
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            YEN
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            EURO
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown flag-dropdown me-3">
                      <Link
                        to="#"
                        className="d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <ImageWithBasePath
                          src="assets/img/flags/us-flag.svg"
                          alt="flag"
                        />
                      </Link>
                      <ul className="dropdown-menu p-2 mt-2">
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/us-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            ENG
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/arab-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            ARA
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/france-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            FRE
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <DarkButton />
                    <Link to={routes.login} className="btn btn-primary">
                      Login
                    </Link>
                    <Link to={routes.register} className="btn btn-dark">
                      Register
                    </Link>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div className="sidebar-menu">
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-10" ? (
                  <div className="header-btn d-flex align-items-center">
                    <DarkButton />
                    <div className="fav-dropdown me-3">
                      <Link
                        to={routes.wishlist}
                        className="position-relative text-white wishlist-icon fs-24"
                      >
                        <i className="isax isax-heart" />
                        <span className="count-icon bg-secondary text-white">
                          0
                        </span>
                      </Link>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to="#"
                        className="text-white btn btn-primary w-100"
                        data-bs-toggle="modal"
                        data-bs-target="#login-modal"
                      >
                        <i className="isax isax-lock5 me-1" />
                        Login
                      </Link>
                      <Link to="#" className="text-white btn btn-dark w-100">
                        <i className="isax isax-user-minus me-1" />
                        Register
                      </Link>
                    </div>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div className="sidebar-menu">
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-11" ? (
                  <div className="header-btn d-flex align-items-center">
                    <div className="dropdown flag-dropdown flag-dropdown-desktop me-2 d-none d-lg-flex">
                      <Link
                        to="#"
                        className="dropdown-toggle d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <ImageWithBasePath
                          src="assets/img/flags/us-flag.svg"
                          alt="flag"
                        />
                      </Link>
                      <ul className="dropdown-menu p-2 mt-2">
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/us-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            ENG
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/arab-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            ARA
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item rounded d-flex align-items-center"
                            to="#"
                          >
                            <ImageWithBasePath
                              src="assets/img/flags/france-flag.svg"
                              className="me-2"
                              alt="flag"
                            />
                            FRE
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="dropdown me-2 d-none d-lg-block">
                      <Link
                        to="#"
                        className="dropdown-toggle p-2 rounded-pill fs-12 fw-medium"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        USD
                      </Link>
                      <ul className="dropdown-menu p-2 mt-2">
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            USD
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            YEN
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item rounded" to="#">
                            EURO
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <div className="me-3">
                      <Link to="#">
                        <i className="isax isax-user" />
                      </Link>
                    </div>
                    <DarkButton />
                    <div className="fav-dropdown me-3">
                      <Link
                        to={all_routes.wishlist}
                        className="position-relative wishlist-icon"
                      >
                        <i className="isax isax-heart" />
                        <span className="count-icon bg-secondary text-dark">
                          0
                        </span>
                      </Link>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.becomeAnExpert}
                        className="text-white btn btn-primary w-100"
                      >
                        Become Expert
                      </Link>
                    </div>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div className="sidebar-menu">
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : location.pathname === "/index-12" ? (
                  <div className="header-btn d-flex align-items-center">
                    <DarkButton />
                    <div className="fav-dropdown me-3">
                      <Link
                        to={all_routes.wishlist}
                        className="position-relative wishlist-icon"
                      >
                        <i className="isax isax-heart" />
                        <span className="count-icon bg-secondary text-white">
                          0
                        </span>
                      </Link>
                    </div>
                    <div className="d-flex align-items-center">
                      <Link
                        to={all_routes.login}
                        className="text-white btn btn-primary w-100"
                        data-bs-toggle="modal"
                        data-bs-target="#login-modal"
                      >
                        <i className="isax isax-lock5 me-1" />
                        Login
                      </Link>
                      <Link
                        to={all_routes.register}
                        className="text-white btn btn-dark w-100"
                      >
                        <i className="isax isax-user-minus me-1" />
                        Register
                      </Link>
                    </div>
                    <div className="header__hamburger d-xl-none my-auto">
                      <div className="sidebar-menu">
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="header-btn d-flex align-items-center">
                    <DarkButton />
                    <div className="dropdown profile-dropdown">
                      <Link
                        to="#"
                        className="d-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <span className="avatar avatar-md">
                          <ImageWithBasePath
                            src="assets/img/users/user-05.jpg"
                            alt="Img"
                            className="img-fluid rounded-circle border border-white border-4"
                          />
                        </span>
                      </Link>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        <li>
                          <Link
                            className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                            to={accountDashboardRoute}
                          >
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                            to={accountBookingsRoute}
                          >
                            My Booking
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                            to={accountProfileRoute}
                          >
                            My Profile
                          </Link>
                        </li>
                        <li>
                          <hr className="dropdown-divider my-2" />
                        </li>
                        <li>
                          <Link
                            className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                            to={accountSettingsRoute}
                          >
                            Settings
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="dropdown-item d-inline-flex align-items-center rounded fw-medium p-2"
                            to="#"
                            onClick={handleLogout}
                          >
                            Logout
                          </Link>
                        </li>
                      </ul>
                    </div>
                    <Link
                      to={
                        location.pathname.includes("cruise")
                          ? all_routes.addCruise
                          : location.pathname.includes("tour")
                            ? all_routes.addTour
                            : location.pathname.includes("flight")
                              ? all_routes.addFlight
                              : location.pathname.includes("car")
                                ? all_routes.addCar
                                : location.pathname.includes("activity")
                                  ? all_routes.addActivity
                                  : location.pathname.includes("visa")
                                    ? all_routes.addVisa
                                    : location.pathname.includes("guide")
                                      ? all_routes.addGuide
                                      : all_routes.addHotel
                      }
                      className="btn btn-primary me-0"
                    >
                      Add Listing
                    </Link>
                    <div
                      className="header__hamburger d-xl-none my-auto"
                      onClick={() => setIsOffcanva(true)}
                    >
                      <div className="sidebar-menu">
                        <i className="isax isax-menu5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        {/* /Header */}
      </div>
      <LoginModal />
      <RegisterModal />
      <ForgotPasswordModal />
      <ChangePasswordModal />
    </>
  );
};

export default Header;
