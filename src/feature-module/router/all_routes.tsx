
export const all_routes = {
    //Home

    allService1: "/", // canonical home
    allService2: "/index-2", // all service 1
    home1: "/index-3", // all service 3
    home2: "/index-4", // hotels
    home3: "/index-5", // cars
    home4: "/index-6", // flight
    home5: "/index-7", // cruise
    home6: "/index-8", // tour
    home7: "/index-9", // bus
    home10: "/index-10", // Guide
    home11: "/index-11", // activity
    home12: "/index-12", // visa

    // auth routes routes
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    changepassword: "/change-password",

    //Flight
    addFlight: "/flight/add-flight",
    flightGrid: "/flight/flight-grid",
    flightList: "/flight/flight-list",
    flightDetails: "/flight/flight-details",
    flightBooking: "/flight/flight-booking",
    flightBookingConfirmation: "/flight/flight-booking-confirmation",


    //Hotel
    addHotel: "/hotel/add-hotel",
    hotelGrid: "/hotel/hotel-grid",
    hotelList: "/hotel/hotel-list",
    hotelMap: "/hotel/hotel-map",
    hotelDetails: "/hotel/hotel-details",
    hotelBooking: "/hotel/hotel-booking",
    hotelBookingConfirmation: "/hotel/hotel-booking-confirmation",
    chaletGrid: "/chalet/chalet-grid",
    chaletDetails: "/chalet/chalet-details",
    resortGrid: "/resort/resort-grid",
    resortDetails: "/resort/resort-details",

    //Car
    addCar: "/car/add-car",
    carGrid: "/car/car-grid",
    carList: "/car/car-list",
    carMap: "/car/car-map",
    carDetails: "/car/car-details",
    carBooking: "/car/car-booking",
    carBookingConfirmation: "/car/car-booking-confirmation",

    //cruise
    addCruise: "/cruise/add-cruise",
    cruiseGrid: "/cruise/cruise-grid",
    cruiseList: "/cruise/cruise-list",
    cruiseDetails: "/cruise/cruise-details",
    cruiseBookingConfirmation: "/cruise/cruise-booking-confirmation",
    cruiseBooking: "/cruise/cruise-booking",
    cruiseMap: "/cruise/cruise-map",
    //tour
    addTour: "/tour/add-tour",
    editTour: "/tour/edit-tour",
    tourGrid: "/tour/tour-grid",
    tourList: "/tour/tour-list",
    tourMap: "/tour/tour-map",
    tourBooking: "/tour/tour-booking",
    tourBookingConfirmation: "/tour/tour-booking-confirmation",
    tourDetails: "/tour/tour-details",

    //bus
    busDashboard: "/bus/bus-dashboard",
    busList: "/bus/bus-list",
    busLeftSidebar: "/bus/bus-left-sidebar",
    busRightSidebar: "/bus/bus-right-sidebar",
    busDetails: "/bus/bus-details",
    busBooking: "/bus/bus-booking",
    addBus: "/bus/add-bus",
    editBus: "/bus/edit-bus",
    busBookingConfirmation: "/bus/bus-booking-confirmation",
    busSeatSelection: "/bus/bus-seat-selection",

    //Activity
    activityGrid:"/activity/activity-grid",
    activityList:"/activity/activity-list",
    activityMap:"/activity/activity-map",
    addActivity:"/activity/add-activity",
    activityDetails:"/activity/activity-details",
    activityBooking:"/activity/activity-booking",
    activityBookingConfirmation:"/activity/activity-booking-confirmation",
    
    //Visa
    visaList:"/visa/visa-list",
    visaGrid:"/visa/visa-grid",
    visaDetails:"/visa/visa-details",
    visaBookingConfirmation:"/visa/visa-booking-confirmation",
    addVisa:"/visa/add-visa",
    trackVisa:"/visa/track-visa",
    visaRequirements:"/visa/visa-requirements",

    //Guide
    guideGrid:"/guide/guide-grid",
    guideDetails:"/guide/guide-details",
    guideBooking:"/guide/guide-booking",
    guideBookingConfirmation:"/guide/guide-booking-confirmation",
    addGuide:"/guide/add-guide",

    //Admin
    adminDashboard: "/admin/dashboard",
    adminBookings: "/admin/bookings",
    adminBookingsPending: "/admin/bookings/pending",
    adminBookingsConfirmed: "/admin/bookings/confirmed",
    adminBookingsCancelled: "/admin/bookings/cancelled",
    adminTours: "/admin/tours",
    adminHotels: "/admin/hotels",
    adminResorts: "/admin/resorts",
    adminChalets: "/admin/chalets",
    adminActivities: "/admin/activities",
    adminFlights: "/admin/flights",
    adminCars: "/admin/cars",
    adminCruises: "/admin/cruises",
    adminBuses: "/admin/buses",
    adminVisas: "/admin/visas",
    adminGuides: "/admin/guides",
    adminServiceRequests: "/admin/service-requests",
    adminAgents: "/admin/agents",
    adminCustomers: "/admin/customers",
    adminReviews: "/admin/reviews",
    adminCoupons: "/admin/coupons",
    adminPayments: "/admin/payments",
    adminNotifications: "/admin/notifications",
    adminSettings: "/admin/settings",
    adminMigrate: "/admin/migrate",

    //Agent 
    agentDashboard: "/agent/agent-dashboard",
    agentListing:"/agent/agent-listings",
    agentBookingRequests: "/agent/agent-booking-requests",
    editHotel: "/edit-hotel",
    editCar: "/edit-car",
    editFlight: "/edit-flight",
    editCruise: "/edit-cruise",
    agentHotelBooking: "/agent/agent-hotel-booking",
    agentCarBooking: "/agent/agent-car-booking",
    agentCruiseBooking: "/agent/agent-cruise-booking",
    agentTourBooking: "/agent/agent-tour-booking",
    agentFlightBooking: "/agent/agent-flight-booking",
    agentBusBooking: "/agent/agent-bus-booking",
    agentGuideBooking: "/agent/agent-guide-booking",
    agentVisaBooking: "/agent/agent-visa-booking",
    agentPaymentHistory: "/agent/agent-payment-history",
    agentPendingPayouts: "/agent/agent-pending-payouts",
    agentCommissionSummary: "/agent/agent-commission-summary",
    agentActivitiesBooking: "/agent/agent-activities-booking",
    agentCancellationRequest: "/agent/agent-cancellation-request",
    agentEnquirers: "/agent/agent-enquirers",
    agentEarnings: "/agent/agent-earnings",
    agentReview: "/agent/agent-review",
    agentSettings: "/agent/agent-settings",
    agentBussinessDetails:"/agent/agent-bussiness-details",
    agentNotificationSettings:"/agent/agent-notification-settings",
    agentNotification:"/agent/agent-notifications",
    agentChat:"/agent/agent-chat",
    agentEnquiriesDetails:"/agent/agent-enquiry-details",
    agentAccountSettings:"/agent/agent-account-settings",
    agentSecuritySettings:"/agent/agent-security-settings",
    agentPlanSettings:"/agent/agent-plans-settings",
    agentPlan:"/agent/agent-plans",




    //User DashBoard
    userDashboard: "/user/dashboard",


    payment: "/user/payment",
    userOrders: "/user/orders",
    customerHotelBooking: "/user/customer-hotel-booking",
    userMyProfile: "/user/my-profile",
    userProfileSettings: "/user/profile-settings",
    chat: "/user/chat",

    userFlightBooking: "/user/customer-flight-booking",
    userCarBooking: "/user/customer-car-booking",
    userCruiseBooking: "/user/customer-cruise-booking",
    userHotlesBooking: "/user/customer-hotel-booking",
    userTourBooking: "/user/customer-tour-booking",
    userBusBooking: "/user/customer-bus-booking",
    userTourGuideBooking: "/user/customer-tour-guides-booking",
    userVisaBooking: "/user/customer-visa-booking",
    userActivitiesBooking: "/user/customer-activities-booking",
    userReviews: "/user/review",
    userChat: "/user/chat",
    userWishlist: "/user/wishlist",
    userCoupons: "/user/customer-coupons",
    userLoyaltyPoints: "/user/customer-loyalty-points",
    userRewardHistory: "/user/customer-reward-history",
    userReferralProgram: "/user/customer-referral-program",
    userGiftCards: "/user/customer-gift-cards",
    userWallet: "/user/wallet",
    myProfile: "/user/my-profile",
    profileSettings: "/user/profile-settings",
    notification: "/user/notifications",
    securitySettings: "/user/security-settings",
    notificationSettings: "/user/notification-settings",
    integrationSettings: "/user/integration-settings",


    //Pages

    wishlist: "/user/wishlist",
    becomeAnExpert: "/become-an-expert",
    becomeAgent: "/become-agent",
    privacyPolicy: "/pages/privacy-policy",
    termsConditions: "/terms-conditions",
    contactUs: "/contact-us",
    blogList: "/blog/blog-list",
    blogGrid: "blog/blog-grid",
    blogDetails: "blog/blog-details",
    destination: "/pages/destination",
    about_us: "/pages/about-us",
    teams: "/pages/team",
    invoices: "/pages/invoices",
    Gallery: "/pages/gallery",
    Testimonials: "/pages/testimonials",
    FAQ: "/pages/faq",
    pricingPlan: "/pages/pricing-plan",
    pricingPlantwo: "/pages/pricing-plan-two",
    recentlyViewed:"/pages/recently-viewed",
    destrinationDetails:"/pages/destrination-details",
    Error404: "/pages/error-404",
    Error500: "/pages/error-500",
    underMaintenance: "/pages/under-maintenance",
    homeOneRtl: "/pages/rtl",
    comingSoon: "/pages/coming-soon",
    destinationDetails:"",
    

    
};
