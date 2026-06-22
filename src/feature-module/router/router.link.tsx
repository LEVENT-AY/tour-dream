import { useEffect, useState } from "react";
import { Navigate, Route } from "react-router";
import { all_routes } from "./all_routes";
import AdminDashboard from "../admin-dashboard/dashboard/AdminDashboard";
import AdminBookings from "../admin-dashboard/pages/bookings";
import AdminBookingsPending from "../admin-dashboard/pages/bookingsPending";
import AdminBookingsConfirmed from "../admin-dashboard/pages/bookingsConfirmed";
import AdminBookingsCancelled from "../admin-dashboard/pages/bookingsCancelled";
import AdminTours from "../admin-dashboard/pages/tours";
import AdminHotels from "../admin-dashboard/pages/hotels";
import AdminResorts from "../admin-dashboard/pages/resorts";
import AdminChalets from "../admin-dashboard/pages/chalets";
import AdminActivities from "../admin-dashboard/pages/activities";
import AdminFlights from "../admin-dashboard/pages/flights";
import AdminCars from "../admin-dashboard/pages/cars";
import AdminAgents from "../admin-dashboard/pages/agents";
import AdminCustomers from "../admin-dashboard/pages/customers";
import AdminReviews from "../admin-dashboard/pages/reviews";
import AdminCoupons from "../admin-dashboard/pages/coupons";
import AdminPayments from "../admin-dashboard/pages/payments";
import AdminNotifications from "../admin-dashboard/pages/notifications";
import AdminSettings from "../admin-dashboard/pages/settings";
import AdminMigrate from "../admin-dashboard/pages/migrate";
import Login from "../auth/login/login";
import HomeOne from "../home-one/homeOne";
import AddFlight from "../flight/addFlight";
import Payment from "../userDashboard/payment/payment";
import UserOrders from "../userDashboard/orders/userOrders";
import Register from "../auth/register/register";
import ForgotPassword from "../auth/forgot-password/forgotPassword";
import ChangePassword from "../auth/change-password/changePassword";
import HomeTwo from "../home-Two/homeTwo";
import HomeThree from "../home-three/homeThree";
import HomeFour from "../home-four/homeFour";
import HomeFive from "../home-five/homeFive";
import HomeSix from "../home-six/homeSix";
import TourGrid from "../tour/tour-grid/tourGrid";
import HotelMap from "../hotel/hotel-map/hotelMap";
import HotelDetails from "../hotel/hotel-details/hotelDetails";
import TourList from "../tour/tour-list/tourList";
import TourMap from "../tour/tour-map/tourMap";
import TourBooking from "../tour/tour-booking/tourBooking";
import TourBookingConfirmation from "../tour/tour-bookingConfirmation/tourBookingConfirmation";
import CuriseGrid from "../curise/curise-grid/curiseGrid";
import BlogList from "../blog/blog-list/blogList";
import BlogGrid from "../blog/blog-grid/blogGrid";
import BlogDetails from "../blog/blog-details/blogDetails";
import Destination from "../pages/Destination/destination";
import AboutUs from "../pages/about-us/about_us";
import Teams from "../pages/teams/teams";
import CarList from "../car/car-list/carList";
import FlightList from "../flight/flight-list/flightList";
import CruiseList from "../curise/cruise-list/cruiseList";
import HotelList from "../hotel/hotel-list/hotelList";
import HotelGrid from "../hotel/hotel-grid/hotelGrid";
import ChaletGrid from "../chalet/chalet-grid/chaletGrid";
import ChaletDetails from "../chalet/chalet-details/chaletDetails";
import ResortGrid from "../resort/resort-grid/resortGrid";
import ResortDetails from "../resort/resort-details/resortDetails";
import FlightGrid from "../flight/flight-grid/flightGrid";
import Invoices from "../pages/invoices/invoices";
import Notification from "../userDashboard/notification/notification";
import UserFlightBooking from "../userDashboard/myBooking/flight/userFlightBooking";
import UserCarBooking from "../userDashboard/myBooking/car/userCarBooking";
import UserHotelsBooking from "../userDashboard/myBooking/hotels/userHotelsBooking";
import UserChat from "../userDashboard/message/userChat";
import UserWishlist from "../userDashboard/wishlist/userWishlist";
import UserWallet from "../userDashboard/wallet/userWallet";
import MyProfile from "../userDashboard/myProfile/myProfile";
import ProfileSettings from "../userDashboard/settings/profileSettings";
import UserCruiseBooking from "../userDashboard/myBooking/cruise/userCruiseBooking";
import HotelBooking from "../hotel/hotel-booking/hotelBooking";
import PrivacyPolicy from "../pages/privacy-policy/privacyPolicy";
import ContactUs from "../pages/contact/contactUs";
import AddHotel from "../hotel/add-hotel/addHotel";
import CarGrid from "../car/car-grid/carGrid";
import Error404 from "../pages/error/Error404";
import Error500 from "../pages/error/Error500";
import FAQ from "../pages/Faq/FAQ";
import Gallery from "../pages/Gallery/Gallery";
import PricingPlan from "../pages/pricing-plan/PricingPlan";
import Testimonials from "../pages/Testimonials/Testimonials";
import UnderMaintenance from "../pages/under-maintenance/UnderMaintenance";
import EditHotel from "../agent-dashboard/listing/edit-hotel/editHotel";
import CarMap from "../car/car-map/carMap";
import TourDetails from "../tour/tour-details/tourDetails";
import AddTour from "../tour/add-tour/addTour";
import EditTour from "../agent-dashboard/listing/edit-tour/editTour";
import CarDetails from "../car/car-details/carDetails";
import CruiseBooking from "../curise/cruise-booking/cruiseBooking";
import CruiseDetails from "../curise/curise-details/curiseDetails";
import CruiseBookingConfirmation from "../curise/cruise-booking-confirmation/cruiseBookingConfirmation";
import AddCar from "../car/add-car/addCar";
import EditCar from "../agent-dashboard/listing/edit-car/editCar";
import CruiseMap from "../curise/cruise-map/cruiseMap";
import FlightDetails from "../flight/flight-details/flightDetails";
import FlightBooking from "../flight/flight-booking/flightBooking";
import FlightBookingConfirmation from "../flight/flight-booking-confirmation/flightBookingConfirmation";
import EditFlight from "../agent-dashboard/listing/edit-flight/editFlight";
import AddCruise from "../curise/add-cruise/addCruise";
import EditCruise from "../agent-dashboard/listing/edit-cruise/editCruise";
import CarBooking from "../car/car-booking/carBooking";
import CarBookingConfirmation from "../car/car-booking-confirmation/carBookingConfirmation";
import Dashboard from "../userDashboard/dashboard/dashboard";
import UserTourBooking from "../userDashboard/myBooking/tour/userTourBooking";
import UserReviews from "../userDashboard/myReviews/userReviews";
import NotificationSettings from "../userDashboard/settings/notificationSettings";
import IntegrationSettings from "../userDashboard/settings/integrationSettings";
import SecuritySettings from "../userDashboard/settings/securitySettings";
import AgentDashboard from "../agent-dashboard/dashboard/agentDashboard";
import AgentListings from "../agent-dashboard/listing/agentListings";
import AgentHotelBooking from "../agent-dashboard/Booking/hotel-booking/agentHotelBooking";
import AgentBookingRequests from "../agent-dashboard/Booking/booking-requests/agentBookingRequests";
import AgentCarBooking from "../agent-dashboard/Booking/car-booking/agentCarBooking";
import AgentCruiseBooking from "../agent-dashboard/Booking/cruise-booking/agentCruiseBooking";
import AgentTourBooking from "../agent-dashboard/Booking/tour-booking/agentTourBooking";
import AgentFlightBooking from "../agent-dashboard/Booking/flight-booking/agentFlightBooking";
import AgentEnquiries from "../agent-dashboard/enquiries/agentEnquiries";
import AgentEnquiriesDetails from "../agent-dashboard/enquiries/agentEnquiriesDetails";
import AgentEarning from "../agent-dashboard/earnings/agentEarning";
import AgentReviews from "../agent-dashboard/reviews/agentReviews";
import AgentSettings from "../agent-dashboard/settings/agentSettings";
import AgentAccountSettings from "../agent-dashboard/settings/agent-account-settings/agentAccountSettings";
import AgentSecuritySettings from "../agent-dashboard/settings/agent-security-settings/agentSecuritySettings";
import AgentPlanSettings from "../agent-dashboard/settings/agent-plan-settings/agentPlanSettings";
import AgentPlan from "../agent-dashboard/agent-plan/agentPlan";
import AgentChat from "../agent-dashboard/agent-message/agentChat";
import AgentNotification from "../agent-dashboard/agent-notification/agentNotification";
import HomeOneRTL from "../pages/rtl/home-one/homeOne";
import ComingSoon from "../pages/coming-soon/comingSoon";
import TermsConditions from "../pages/terms-conditions/termsConditions";
import BusList from "../bus/bus-list/busList";
import BusBooking from "../bus/bus-booking/busBooking";
import BusBookingConfirmation from "../bus/bus-booking-confirmation/busBookingConfirmation";
import BusSeatSelection from "../bus/bus-seat-selection/busSeatSelection";
import AddBus from "../bus/add-bus/addBus";
import HomeSeven from "../home-seven/homeSeven";
import BusDetails from "../bus/bus-details/busDetails";
import BusListLeftSidebar from "../bus/bus-list/busListLeftSidebar";
import BusListRightSidebar from "../bus/bus-list/busListRightSidebar";
import UserBusBooking from "../userDashboard/myBooking/bus/userBusBooking";
import AgentBusBooking from "../agent-dashboard/Booking/bus-booking/agentBusBooking";
import PricingPlanTwo from "../pages/pricing-plan/PricingPlanTwo";
import RecentlyViewed from "../pages/recently-viewed/RecentlyViewed";
import EditBus from "../bus/edit-bus/editBus";
import HomeServiceTwo from "../home-service-two/homeServiceTwo";
import DestrinationDetails from "../pages/destrinationdetails/DestrinationDetails";
import HomeServiceOne from "../home-service-one/HomeServiceOne";
import HomeEleven from "../home-eleven/homeEleven";
import HomeTen from "../home-ten/homeTen";
import HomeTwelve from "../home-twelve/homeTwelve";
import {
  fetchHomepageSettings,
  resolveGeneralHomeTemplateRoute,
} from "../../core/services/firebaseServices";
import ActivityBookingConfirmation from "../activity/activity-booking-confirmation/activityBookingConfirmation";
import ActivityGrid from "../activity/activity-grid/activityGrid";
import ActivityList from "../activity/activity-list/activityList";
import ActivityMap from "../activity/activity-map/activityMap";
import ActivityDetails from "../activity/activity-details/activityDetails";
import AddActivity from "../activity/add-activity/addActivity";
import ActivityBooking from "../activity/activity-booking/activityBooking";
import AddVisa from "../visa/add-visa/addVisa";
import VisaList from "../visa/visa-list/visaList";
import VisaGrid from "../visa/visa-grid/visaGrid";
import VisaDetails from "../visa/visa-details/visaDetails";
import VisaBookingConfirmation from "../visa/visa-booking-confirmation/visaBookingConfirmation";
import TrackVisa from "../visa/track-visa/trackVisa";
import VisaRequirement from "../visa/visa-requirements/visaRequirement";
import GuideGrid from "../guide/guide-grid/guideGrid";
import GuideDetails from "../guide/guide-Details/guideDetails";
import GuideBooking from "../guide/guide-booking/guideBooking";
import GuideBookingConfirmation from "../guide/guide-booking-confirmation/guideBookingConfirmation";
import AddGuide from "../guide/add-guide/addGuide";
import UserTourGuidesBooking from "../userDashboard/myBooking/tour-guides/tourGuidesBooking";
import UserVisaBooking from "../userDashboard/myBooking/visa/visaBooking";
import UserAcitivitiesBooking from "../userDashboard/myBooking/activities/acitivitiesBooking";
import UserCoupons from "../userDashboard/offer-and-rewards/coupons/coupons";
import UserLoyaltyPoints from "../userDashboard/offer-and-rewards/loyalty-points/loyaltyPoints";
import UserRewardsHistory from "../userDashboard/offer-and-rewards/rewards-history.tsx/rewardsHistory";
import UserReferralProgram from "../userDashboard/offer-and-rewards/referral-program/referralProgram";
import UserGiftCards from "../userDashboard/offer-and-rewards/gift-cards/giftCards";
import AgentGuideBooking from "../agent-dashboard/Booking/guide-booking/guideBooking";
import AgentVisaBooking from "../agent-dashboard/Booking/visa-booking/visaBooking";
import AgentActivitiesBooking from "../agent-dashboard/Booking/activities-booking/activitiesBooking";
import AgentCancellationRequest from "../agent-dashboard/Booking/cancellation-request/cancellationRequest";
import AgentPaymentHistory from "../agent-dashboard/payout/payment-history/paymentHistory";
import AgentPendingPayouts from "../agent-dashboard/payout/pending-payouts/pendingPayouts";
import AgentCommissionSummary from "../agent-dashboard/payout/commission-summary/commissionSummary";
import AgentBussinessDetails from "../agent-dashboard/settings/agent-bussiness-details/agentBussinessDetails";
import AgentNotificationSettings from "../agent-dashboard/settings/agent-notification-settings/agentNotificationSettings";

const routes = all_routes;

export const adminRoutes = [
  {
    path: routes.adminDashboard,
    element: <AdminDashboard />,
    route: Route,
  },
  { path: routes.adminBookings, element: <AdminBookings />, route: Route },
  { path: routes.adminBookingsPending, element: <AdminBookingsPending />, route: Route },
  { path: routes.adminBookingsConfirmed, element: <AdminBookingsConfirmed />, route: Route },
  { path: routes.adminBookingsCancelled, element: <AdminBookingsCancelled />, route: Route },
  { path: routes.adminTours, element: <AdminTours />, route: Route },
  { path: routes.adminHotels, element: <AdminHotels />, route: Route },
  { path: routes.adminResorts, element: <AdminResorts />, route: Route },
  { path: routes.adminChalets, element: <AdminChalets />, route: Route },
  { path: routes.adminActivities, element: <AdminActivities />, route: Route },
  { path: routes.adminFlights, element: <AdminFlights />, route: Route },
  { path: routes.adminCars, element: <AdminCars />, route: Route },
  { path: routes.adminAgents, element: <AdminAgents />, route: Route },
  { path: routes.adminCustomers, element: <AdminCustomers />, route: Route },
  { path: routes.adminReviews, element: <AdminReviews />, route: Route },
  { path: routes.adminCoupons, element: <AdminCoupons />, route: Route },
  { path: routes.adminPayments, element: <AdminPayments />, route: Route },
  { path: routes.adminNotifications, element: <AdminNotifications />, route: Route },
  { path: routes.adminSettings, element: <AdminSettings />, route: Route },
  { path: routes.adminMigrate, element: <AdminMigrate />, route: Route },
];

export const agentRoutes: any[] = [];
export const userRoutes: any[] = [];

const ACTIVE_GENERAL_HOME_COMPONENTS = {
  [all_routes.allService1]: HomeServiceOne,
  [all_routes.allService2]: HomeServiceTwo,
  [all_routes.home1]: HomeOne,
};

const ActiveGeneralHomeRoute = () => {
  const [activeRoute, setActiveRoute] = useState<string>(all_routes.allService1);

  useEffect(() => {
    let cancelled = false;

    const loadHomepageSettings = async () => {
      for (let attempt = 0; attempt < 3 && !cancelled; attempt += 1) {
        try {
          const settings = await fetchHomepageSettings();
          if (!cancelled) {
            setActiveRoute(resolveGeneralHomeTemplateRoute(settings?.publicTemplates?.home));
            if (settings) {
              return;
            }
          }
        } catch {
          if (!cancelled && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }

      if (!cancelled) {
        setActiveRoute(all_routes.allService1);
      }
    };

    const loadWithDelay = async () => {
      try {
        await loadHomepageSettings();
      } catch {
        if (!cancelled) {
          setActiveRoute(all_routes.allService1);
        }
      }
    };

    void loadWithDelay();

    return () => {
      cancelled = true;
    };
  }, []);

  const ActiveComponent =
    ACTIVE_GENERAL_HOME_COMPONENTS[activeRoute as keyof typeof ACTIVE_GENERAL_HOME_COMPONENTS] || HomeServiceOne;

  return <ActiveComponent />;
};

export const publicRoutes = [
  {
    path: routes.allService1,
    name: "Root",
    element: <ActiveGeneralHomeRoute />,
    route: Route,
  },
  {
    path: "/index",
    name: "LegacyRoot",
    element: <Navigate replace to={routes.allService1} />,
    route: Route,
  },
  {
    path: routes.allService2,
    element: <HomeServiceTwo />,
    route: Route,
  },
  {
    path: routes.home1,
    element: <HomeOne />,
    route: Route,
  },
  {
    path: routes.home2,
    element: <HomeTwo />,
    route: Route,
  },
  {
    path: routes.home3,
    element: <HomeThree />,
    route: Route,
  },
  {
    path: routes.home4,
    element: <HomeFour />,
    route: Route,
  },
  {
    path: routes.home5,
    element: <HomeFive />,
    route: Route,
  },
  {
    path: routes.home6,
    element: <HomeSix />,
    route: Route,
  },
  {
    path: routes.home7,
    element: <HomeSeven />,
    route: Route,
  },
  {
    path: routes.home10,
    element: <HomeTen />,
    route: Route,
  },
  {
    path: routes.home11,
    element: <HomeEleven />,
    route: Route,
  },
  {
    path: routes.home12,
    element: <HomeTwelve />,
    route: Route,
  },
  
  {
    path: routes.addFlight,
    element: <AddFlight />,
    route: Route,
  },
  {
    path: routes.payment,
    element: <Payment />,
    route: Route,
  },
  {
    path: routes.tourGrid,
    element: <TourGrid />,
    route: Route,
  },
  {
    path: routes.tourList,
    element: <TourList />,
    route: Route,
  },
  {
    path: routes.hotelList,
    element: <HotelList />,
    route: Route,
  },
  {
    path: routes.hotelGrid,
    element: <HotelGrid />,
    route: Route,
  },
  {
    path: routes.chaletGrid,
    element: <ChaletGrid />,
    route: Route,
  },
  {
    path: routes.resortGrid,
    element: <ResortGrid />,
    route: Route,
  },
  {
    path: routes.carGrid,
    element: <CarGrid />,
    route: Route,
  },
  {
    path: routes.carList,
    element: <CarList />,
    route: Route,
  },
  {
    path: routes.flightList,
    element: <FlightList />,
    route: Route,
  },
  {
    path: routes.flightGrid,
    element: <FlightGrid />,
    route: Route,
  },
  {
    path: routes.cruiseList,
    element: <CruiseList />,
    route: Route,
  },
  {
    path: routes.tourMap,
    element: <TourMap />,
    route: Route,
  },
  {
    path: routes.tourBooking,
    element: <TourBooking />,
    route: Route,
  },
  {
    path: routes.tourBookingConfirmation,
    element: <TourBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.hotelMap,
    element: <HotelMap />,
    route: Route,
  },
  {
    path: routes.hotelDetails,
    element: <HotelDetails />,
    route: Route,
  },
  {
    path: routes.chaletDetails,
    element: <ChaletDetails />,
    route: Route,
  },
  {
    path: routes.resortDetails,
    element: <ResortDetails />,
    route: Route,
  },
  {
    path: routes.cruiseGrid,
    element: <CuriseGrid />,
    route: Route,
  },
  {
    path: routes.blogList,
    element: <BlogList />,
    route: Route,
  },
  {
    path: routes.blogGrid,
    element: <BlogGrid />,
    route: Route,
  },
  {
    path: routes.blogDetails,
    element: <BlogDetails />,
    route: Route,
  },
  {
    path: routes.destination,
    element: <Destination />,
    route: Route,
  },
  {
    path: routes.about_us,
    element: <AboutUs />,
    route: Route,
  },
  {
    path: routes.teams,
    element: <Teams />,
    route: Route,
  },
  {
    path: routes.invoices,
    element: <Invoices />,
    route: Route,
  },
  {
    path: routes.notification,
    element: <Notification />,
    route: Route,
  },
  {
    path: routes.userFlightBooking,
    element: <UserFlightBooking />,
    route: Route,
  },
  {
    path: routes.userCarBooking,
    element: <UserCarBooking />,
    route: Route,
  },
  {
    path: routes.userCruiseBooking,
    element: <UserCruiseBooking />,
    route: Route,
  },
  {
    path: routes.userHotlesBooking,
    element: <UserHotelsBooking />,
    route: Route,
  },
  {
    path: routes.userChat,
    element: <UserChat />,
    route: Route,
  },
  {
    path: routes.userWishlist,
    element: <UserWishlist />,
    route: Route,
  },
  {
    path: routes.userWallet,
    element: <UserWallet />,
    route: Route,
  },
  {
    path: routes.myProfile,
    element: <MyProfile />,
    route: Route,
  },
  {
    path: routes.profileSettings,
    element: <ProfileSettings />,
    route: Route,
  },
  {
    path: routes.hotelBooking,
    element: <HotelBooking />,
    route: Route,
  },
  {
    path: routes.privacyPolicy,
    element: <PrivacyPolicy />,
    route: Route,
  },
  {
    path: routes.contactUs,
    element: <ContactUs />,
    route: Route,
  },
  {
    path: routes.addHotel,
    element: <AddHotel />,
    route: Route,
  },
  {
    path: routes.FAQ,
    element: <FAQ />,
    route: Route,
  },
  {
    path: routes.Gallery,
    element: <Gallery />,
    route: Route,
  },
  {
    path: routes.pricingPlan,
    element: <PricingPlan />,
    route: Route,
  },
  {
    path: routes.Testimonials,
    element: <Testimonials />,
    route: Route,
  },
  {
    path: routes.underMaintenance,
    element: <UnderMaintenance />,
    route: Route,
  },
  {
    path: routes.editHotel,
    element: <EditHotel />,
    route: Route,
  },
  {
    path: routes.carMap,
    element: <CarMap />,
    route: Route,
  },
  {
    path: routes.tourDetails,
    element: <TourDetails />,
    route: Route,
  },
  {
    path: routes.addTour,
    element: <AddTour />,
    route: Route,
  },
  {
    path: routes.editTour,
    element: <EditTour />,
    route: Route,
  },
  {
    path: routes.addCar,
    element: <AddCar />,
    route: Route,
  },
  {
    path: routes.editCar,
    element: <EditCar />,
    route: Route,
  },
  {
    path: routes.cruiseMap,
    element: <CruiseMap />,
    route: Route,
  },
  {
    path: routes.flightDetails,
    element: <FlightDetails />,
    route: Route,
  },
  {
    path: routes.flightBooking,
    element: <FlightBooking />,
    route: Route,
  },
  {
    path: routes.flightBookingConfirmation,
    element: <FlightBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.editFlight,
    element: <EditFlight />,
    route: Route,
  },
  {
    path: routes.carDetails,
    element: <CarDetails />,
    route: Route,
  },
  {
    path: routes.cruiseBooking,
    element: <CruiseBooking />,
    route: Route,
  },
  {
    path: routes.cruiseDetails,
    element: <CruiseDetails />,
    route: Route,
  },
  {
    path: routes.cruiseBookingConfirmation,
    element: <CruiseBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.addCruise,
    element: <AddCruise />,
    route: Route,
  },
  {
    path: routes.editCruise,
    element: <EditCruise />,
    route: Route,
  },
  {
    path: routes.carBooking,
    element: <CarBooking />,
    route: Route,
  },
  {
    path: routes.carBookingConfirmation,
    element: <CarBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.userDashboard,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.userOrders,
    element: <UserOrders />,
    route: Route,
  },
  {
    path: routes.userFlightBooking,
    element: <UserFlightBooking />,
    route: Route,
  },
  {
    path: routes.userTourBooking,
    element: <UserTourBooking />,
    route: Route,
  },
  {
    path: routes.userTourGuideBooking,
    element: <UserTourGuidesBooking />,
    route: Route,
  },
  {
    path: routes.userVisaBooking,
    element: <UserVisaBooking />,
    route: Route,
  },
  {
    path: routes.userActivitiesBooking,
    element: <UserAcitivitiesBooking />,
    route: Route,
  },
  {
    path: routes.userReviews,
    element: <UserReviews />,
    route: Route,
  },
  {
    path: routes.userChat,
    element: <UserChat />,
    route: Route,
  },
  {
    path: routes.userWishlist,
    element: <UserWishlist />,
    route: Route,
  },
  {
    path: routes.userCoupons,
    element: <UserCoupons />,
    route: Route,
  },
  {
    path: routes.userLoyaltyPoints,
    element: <UserLoyaltyPoints />,
    route: Route,
  },
  {
    path: routes.userRewardHistory,
    element: <UserRewardsHistory />,
    route: Route,
  },
  {
    path: routes.userReferralProgram,
    element: <UserReferralProgram />,
    route: Route,
  },
  {
    path: routes.userGiftCards,
    element: <UserGiftCards />,
    route: Route,
  },
  {
    path: routes.userWallet,
    element: <UserWallet />,
    route: Route,
  },
  {
    path: routes.myProfile,
    element: <MyProfile />,
    route: Route,
  },
  {
    path: routes.profileSettings,
    element: <ProfileSettings />,
    route: Route,
  },
  {
    path: routes.securitySettings,
    element: <SecuritySettings />,
    route: Route,
  },
  {
    path: routes.notificationSettings,
    element: <NotificationSettings />,
    route: Route,
  },
  {
    path: routes.integrationSettings,
    element: <IntegrationSettings />,
    route: Route,
  },
  {
    path: routes.agentDashboard,
    element: <AgentDashboard />,
    route: Route,
  },
  {
    path: routes.agentListing,
    element: <AgentListings />,
    route: Route,
  },
  {
    path: routes.agentHotelBooking,
    element: <AgentHotelBooking />,
    route: Route,
  },
  {
    path: routes.agentBookingRequests,
    element: <AgentBookingRequests />,
    route: Route,
  },
  {
    path: routes.agentCarBooking,
    element: <AgentCarBooking />,
    route: Route,
  },
  {
    path: routes.agentCruiseBooking,
    element: <AgentCruiseBooking />,
    route: Route,
  },
  {
    path: routes.agentTourBooking,
    element: <AgentTourBooking />,
    route: Route,
  },
  {
    path: routes.agentFlightBooking,
    element: <AgentFlightBooking />,
    route: Route,
  },
  {
    path: routes.agentGuideBooking,
    element: <AgentGuideBooking />,
    route: Route,
  },
  {
    path: routes.agentVisaBooking,
    element: <AgentVisaBooking />,
    route: Route,
  },
  {
    path: routes.agentActivitiesBooking,
    element: <AgentActivitiesBooking />,
    route: Route,
  },
  {
    path: routes.agentCancellationRequest,
    element: <AgentCancellationRequest />,
    route: Route,
  },
  {
    path: routes.agentPaymentHistory,
    element: <AgentPaymentHistory />,
    route: Route,
  },
  {
    path: routes.agentPendingPayouts,
    element: <AgentPendingPayouts />,
    route: Route,
  },
  {
    path: routes.agentCommissionSummary,
    element: <AgentCommissionSummary />,
    route: Route,
  },
  {
    path: routes.agentEnquirers,
    element: <AgentEnquiries />,
    route: Route,
  },
  {
    path: routes.agentEnquiriesDetails,
    element: <AgentEnquiriesDetails />,
    route: Route,
  },
  {
    path: routes.agentEarnings,
    element: <AgentEarning />,
    route: Route,
  },
  {
    path: routes.agentReview,
    element: <AgentReviews />,
    route: Route,
  },
  {
    path: routes.agentSettings,
    element: <AgentSettings />,
    route: Route,
  },
  {
    path: routes.agentAccountSettings,
    element: <AgentAccountSettings />,
    route: Route,
  },
  {
    path: routes.agentSecuritySettings,
    element: <AgentSecuritySettings />,
    route: Route,
  },
  {
    path: routes.agentPlanSettings,
    element: <AgentPlanSettings />,
    route: Route,
  },
  {
    path: routes.agentPlan,
    element: <AgentPlan />,
    route: Route,
  },
  {
    path: routes.agentChat,
    element: <AgentChat />,
    route: Route,
  },
  {
    path: routes.agentBussinessDetails,
    element: <AgentBussinessDetails />,
    route: Route,
  },
  {
    path: routes.agentNotificationSettings,
    element: <AgentNotificationSettings />,
    route: Route,
  },
  {
    path: routes.agentNotification,
    element: <AgentNotification />,
    route: Route,
  },
  {
    path: routes.homeOneRtl,
    element: <HomeOneRTL />,
    route: Route,
  },
  {
    path: routes.termsConditions,
    element: <TermsConditions />,
    route: Route,
  },
  {
    path: routes.busList,
    element: <BusList />,
    route: Route,
  },
  {
    path: routes.busBooking,
    element: <BusBooking />,
    route: Route,
  },
  {
    path: routes.busBookingConfirmation,
    element: <BusBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.busSeatSelection,
    element: <BusSeatSelection />,
    route: Route,
  },
  {
    path: routes.addBus,
    element: <AddBus />,
    route: Route,
  },
  {
    path: routes.editBus,
    element: <EditBus />,
    route: Route,
  },
  {
    path: routes.busDetails,
    element: <BusDetails />,
    route: Route,
  },
  {
    path: routes.busLeftSidebar,
    element: <BusListLeftSidebar />,
    route: Route,
  },
  {
    path: routes.busRightSidebar,
    element: <BusListRightSidebar />,
    route: Route,
  },
  {
    path: routes.userBusBooking,
    element: <UserBusBooking />,
    route: Route,
  },
  {
    path: routes.agentBusBooking,
    element: <AgentBusBooking />,
    route: Route,
  },
 {
    path: routes.pricingPlantwo,
    element: <PricingPlanTwo/>,
    route: Route,
  },
   {
    path: routes.recentlyViewed,
    element: <RecentlyViewed/>,
    route: Route,
  },
     {
    path: routes.destrinationDetails,
    element: <DestrinationDetails/>,
    route: Route,
  },
  {
    path: routes.activityGrid,
    element: <ActivityGrid />,
    route: Route,
  },
  {
    path: routes.activityList,
    element: <ActivityList />,
    route: Route,
  },
  {
    path: routes.activityMap,
    element: <ActivityMap />,
    route: Route,
  },
  {
    path: routes.activityDetails,
    element: <ActivityDetails />,
    route: Route,
  },
  {
    path: routes.activityBooking,
    element: <ActivityBooking />,
    route: Route,
  },
  {
    path: routes.activityBookingConfirmation,
    element: <ActivityBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.addActivity,
    element: <AddActivity />,
    route: Route,
  },
  {
    path: routes.visaList,
    element: <VisaList />,
    route: Route,
  },
  {
    path: routes.visaGrid,
    element: <VisaGrid />,
    route: Route,
  },
  {
    path: routes.visaDetails,
    element: <VisaDetails />,
    route: Route,
  },
  {
    path: routes.visaBookingConfirmation,
    element: <VisaBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.addVisa,
    element: <AddVisa />,
    route: Route,
  },
  {
    path: routes.trackVisa,
    element: <TrackVisa />,
    route: Route,
  },
  {
    path: routes.visaRequirements,
    element: <VisaRequirement />,
    route: Route,
  },
  {
    path: routes.guideGrid,
    element: <GuideGrid />,
    route: Route,
  },
  {
    path: routes.guideDetails,
    element: <GuideDetails />,
    route: Route,
  },
  {
    path: routes.guideBooking,
    element: <GuideBooking />,
    route: Route,
  },
  {
    path: routes.guideBookingConfirmation,
    element: <GuideBookingConfirmation />,
    route: Route,
  },
  {
    path: routes.addGuide,
    element: <AddGuide />,
    route: Route,
  },
];

export const authRoutes = [

  {
    path: routes.login,
    element: <Login />,
    route: Route,
  },
  {
    path: routes.register,
    element: <Register />,
    route: Route,
  },
  {
    path: routes.forgotPassword,
    element: <ForgotPassword />,
    route: Route,
  },
  {
    path: routes.changepassword,
    element: <ChangePassword />,
    route: Route,
  },

  {
    path: routes.Error404,
    element: <Error404 />,
    route: Route,
  },
  {
    path: routes.Error500,
    element: <Error500 />,
    route: Route,
  },
  {
    path: routes.underMaintenance,
    element: <UnderMaintenance />,
    route: Route,
  },
  {
    path: routes.comingSoon,
    element: <ComingSoon />,
    route: Route,
  },
  
 
];
