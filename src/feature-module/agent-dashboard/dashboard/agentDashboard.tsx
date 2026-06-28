import  { useEffect, useMemo, useState } from 'react'
import Sidebar from '../sidebar/sidebar'
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import { all_routes } from '../../router/all_routes';
import { Link } from 'react-router-dom';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import type { TableData } from '../../../core/common/data/interface';
import Table from "../../../core/common/dataTable/index";
import AgentDhashboardModal from './agentDhashboardModal';
import { useAuth } from '../../../core/contexts/AuthContext';
import { fetchAgentDashboardStats, type DashboardStats } from '../../../core/services/agentServices';

const AgentDashboard = () => {

  const routes = all_routes;
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;
    let isMounted = true;
    setLoading(true);
    fetchAgentDashboardStats(userProfile.uid)
      .then((data) => {
        if (isMounted) setStats(data);
      })
      .catch((err) => {
        console.error("Failed to load agent dashboard stats:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [userProfile?.uid]);
  //Breadcrumb Data
  const breadcrumbs = [
    {
      label: 'Agent Dashboard',
      active: false,
      link: routes.home1
    },
    {
      label: 'Agent Dashboard',
      active: true,
    },
  ];

  const donutLabels = ['Cruise', 'Cars', 'Hotels', 'Tour', 'Flights'];
  const donutSeries = useMemo(() => {
    if (!stats) return [0, 0, 0, 0, 0];
    const byType = stats.bookings.byType;
    return [
      byType['cruise'] || 0,
      byType['car'] || byType['cars'] || 0,
      byType['hotel'] || byType['hotels'] || 0,
      (byType['tour'] || byType['tours'] || 0) +
        (byType['activity'] || byType['activities'] || 0) +
        (byType['resort'] || byType['resorts'] || 0) +
        (byType['chalet'] || byType['chalets'] || 0),
      byType['flight'] || byType['flights'] || 0,
    ];
  }, [stats]);

  const donutChart = useMemo(() => ({
    series: donutSeries,
    options: {
      chart: {
        height: 181,
        type: 'donut' as const,
        toolbar: { show: false },
      },
      legend: { show: false },
      colors: ['#212E47', '#3538CD', '#0E9384', '#CF3425', '#98AA30'],
      labels: donutLabels,
      plotOptions: {
        pie: {
          donut: { size: '65%' },
        },
      },
      stroke: { width: 3, colors: ['#fff'] },
      dataLabels: { enabled: false },
    } as ApexOptions,
  }), [donutSeries]);

  const earningSeries = useMemo(() => {
    const income = stats?.bookings.monthlyIncome || Array(12).fill(0);
    return [
      { name: 'Income', data: income },
      { name: 'Expenses', data: Array(12).fill(0) },
    ];
  }, [stats]);

  const earningChart = useMemo(() => ({
    series: earningSeries,
    options: {
      chart: {
        height: 280,
        type: 'bar' as const,
        stacked: true,
        toolbar: { show: false },
      },
      colors: ['#0E9384', '#E4EBF1'],
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: { position: 'bottom', offsetX: -10, offsetY: 0 },
          },
        },
      ],
      plotOptions: {
        bar: {
          borderRadius: 5,
          borderRadiusWhenStacked: 'all',
          horizontal: false,
          endingShape: 'rounded',
        },
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: { colors: '#4E5561', fontSize: '12px' },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => val / 1000 + 'K',
          offsetX: -15,
          style: { colors: '#4E5561', fontSize: '13px' },
        },
      },
      grid: { show: false },
      legend: { show: false },
      dataLabels: { enabled: false },
      fill: { opacity: 1 },
    } as ApexOptions,
  }), [earningSeries]);

  const data = stats?.bookings.recent || [];
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render: (_text: any, render: any) => (
        <Link
          to="#"
          className="link-primary fw-medium"
          data-bs-toggle="modal"
          data-bs-target={`#${render.action}`}
        >
          {render.id}
        </Link>

      ),
      sorter: (a: TableData, b: TableData) => a.id.length - b.id.length,
    },
    {
      title: "Hotel",
      dataIndex: "hotel",
      key: "hotel",
      render: (_text: any, render: any) => (
        <div className="d-flex align-items-center">
          <Link to={routes.hotelDetails} className="avatar avatar-lg">
            <ImageWithBasePath
              src={render.hotelImage}
              className="img-fluid rounded-circle"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <p className="text-dark mb-0 fw-medium fs-14">
              <Link to={routes.hotelDetails}>{render.hotelName}</Link>
            </p>
            <span className="fs-14 fw-normal text-gray-6">{render.location}</span>
          </div>
        </div>
      ),
      sorter: (a: TableData, b: TableData) =>
        a.hotel.length - b.hotel.length,
    },
    {
      title: "Room & Guest",
      dataIndex: "room",
      key: "room",
      render: (_text: any, render: any) => (
        <>
          <h6 className="fs-14 mb-1">{render.room}</h6>
          <span className="fs-14 fw-normal text-gray-6">{render.guest}</span>
        </>

      ),
      sorter: (a: TableData, b: TableData) => a.room.length - b.room.length,
    },
    {
      title: "Days",
      dataIndex: "days",
      key: "days",
      sorter: (a: TableData, b: TableData) => a.days.length - b.days.length,
    },
    {
      title: "Pricing",
      dataIndex: "pricing",
      key: "pricing",
      sorter: (a: TableData, b: TableData) => a.pricing.length - b.pricing.length,
    },
    {
      title: "Booked on",
      dataIndex: "bookedOn",
      key: "bookedOn",
      sorter: (a: TableData, b: TableData) => a.date.length - b.date.length,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: any, render: any) => (
        <span className={`badge rounded-pill d-inline-flex align-items-center fs-10 ${text === 'Upcoming' ? 'badge-info' : text === 'Pending' ? 'badge-secondary' : text === 'Cancelled' ? 'badge-danger' : text === 'Completed' ? 'badge-success' : ''}`}>
          <i className="fa-solid fa-circle fs-5 me-1" />
          {render.status}
        </span>

      ),
      sorter: (a: TableData, b: TableData) => a.status.length - b.status.length,
    },
    {
      title: "",
      dataIndex: "action",
      render: (_text: any, render: any) => (
        <div className="d-flex align-items-center">
          <Link
            to="#"
            data-bs-toggle="modal"
            data-bs-target={`#${render.action}`}
          >
            <i className="isax isax-eye" />
          </Link>
        </div>
      ),
      sorter: (a: TableData, b: TableData) => a.action.length - b.action.length,
    },
  ];


  return (
    <div>

      <Breadcrumb title="Agent Dashboard" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />

      {/* Page Wrapper */}
      <div className="content">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-xl-3 col-lg-4">
              <Sidebar />
            </div>
            {/* /Sidebar */}
            <div className="col-xl-9 col-lg-8">
              <div className="row">
                <div className="col-xl-3 col-sm-6 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body text-center">
                      <span className="avatar avatar rounded-circle bg-success mb-2">
                        <i className="isax isax-calendar-15 fs-24" />
                      </span>
                      <p className="mb-1">Total Bookings</p>
                      <h5 className="mb-2">{loading ? '—' : stats?.bookings.total ?? 0}</h5>
                      <p className="d-flex align-items-center justify-content-center fs-14">
                        <span className="text-success me-1">{loading ? '—' : stats?.bookings.pending ?? 0} pending</span>
                        <span className="text-gray-6">· {loading ? '—' : stats?.bookings.confirmed ?? 0} confirmed</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-sm-6 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body text-center">
                      <span className="avatar avatar rounded-circle bg-orange mb-2">
                        <i className="isax isax-money-time5 fs-24" />
                      </span>
                      <p className="mb-1">Total Listings</p>
                      <h5 className="mb-2">{loading ? '—' : stats?.listings.total ?? 0}</h5>
                      <Link
                        to={routes.agentListing}
                        className="fs-14 link-primary text-decoration-underline"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-sm-6 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body text-center">
                      <span className="avatar avatar rounded-circle bg-info mb-2">
                        <i className="isax isax-money-send5 fs-24" />
                      </span>
                      <p className="mb-1">Total Earnings {stats?.earnings.estimated ? '(Estimated)' : ''}</p>
                      <h5 className="mb-2">{loading ? '—' : `$${(stats?.earnings.total ?? 0).toLocaleString()}`}</h5>
                      <p className="d-flex align-items-center justify-content-center fs-14">
                        <span className="text-gray-6">From confirmed/completed bookings</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-sm-6 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body text-center">
                      <span className="avatar avatar rounded-circle bg-indigo mb-2">
                        <i className="isax isax-magic-star5 fs-24" />
                      </span>
                      <p className="mb-1">Total Reviews</p>
                      <h5 className="mb-2">{loading ? '—' : stats?.reviews.total ?? 0}</h5>
                      <p className="fs-14 text-gray-6 mb-0">
                        Avg {loading ? '—' : stats?.reviews.averageRating ?? 0} / 5
                      </p>
                      <Link
                        to={routes.agentReview}
                        className="fs-14 link-primary text-decoration-underline"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                {/* Bookings Statistics */}
                <div className="col-xl-4 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6>Bookings Statistics</h6>
                        <div className="dropdown ">
                          <Link
                            to="#"
                            className="dropdown-toggle btn bg-light-200 btn-sm text-gray-6 rounded-pill fw-normal fs-14 d-inline-flex align-items-center"
                            data-bs-toggle="dropdown"
                          >
                            <i className="isax isax-calendar-2 me-2 fs-14 text-gray-6" />
                            2025
                          </Link>
                          <ul className="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1"
                              >
                                <i className="ti ti-point-filled me-1" />
                                2025
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1"
                              >
                                <i className="ti ti-point-filled me-1" />
                                2024
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1"
                              >
                                <i className="ti ti-point-filled me-1" />
                                2023
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="text-center mb-3">
                        <div id="booking-chart" >
                          <ReactApexChart
                            options={donutChart.options}
                            series={donutChart.series}
                            type="donut"
                            height={181}
                          />
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="border-icon teal">Hotels</h6>
                        <p className="fs-14">
                          <span className="text-gray-9 fw-medium">{loading ? '—' : donutSeries[2]}</span> Bookings
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="border-icon secondary">Flights</h6>
                        <p className="fs-14">
                          <span className="text-gray-9 fw-medium">{loading ? '—' : donutSeries[4]}</span> Bookings
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="border-icon purple">Cars</h6>
                        <p className="fs-14">
                          <span className="text-gray-9 fw-medium">{loading ? '—' : donutSeries[1]}</span> Bookings
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="border-icon dark">Cruise</h6>
                        <p className="fs-14">
                          <span className="text-gray-9 fw-medium">{loading ? '—' : donutSeries[0]}</span> Bookings
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-0">
                        <h6 className="border-icon primary">Tour</h6>
                        <p className="fs-14">
                          <span className="text-gray-9 fw-medium">{loading ? '—' : donutSeries[3]}</span> Bookings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Bookings Statistics */}
                {/* Earnings */}
                <div className="col-xl-8 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body pb-0">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h6>Earnings</h6>
                        <div className="dropdown ">
                          <Link
                            to="#"
                            className="dropdown-toggle btn bg-light-200 btn-sm text-gray-6 rounded-pill fw-normal fs-14 d-inline-flex align-items-center"
                            data-bs-toggle="dropdown"
                          >
                            <i className="isax isax-calendar-2 me-2 fs-14 text-gray-6" />
                            2025
                          </Link>
                          <ul className="dropdown-menu  dropdown-menu-end p-3">
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1"
                              >
                                <i className="ti ti-point-filled me-1" />
                                2025
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1"
                              >
                                <i className="ti ti-point-filled me-1" />
                                2024
                              </Link>
                            </li>
                            <li>
                              <Link
                                to="#"
                                className="dropdown-item rounded-1"
                              >
                                <i className="ti ti-point-filled me-1" />
                                2023
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="row">
                        <div className="d-flex align-items-center justify-content-between flex-wrap">
                          <div className="mb-2">
                            <p className="mb-0">Total Earnings this Year {stats?.earnings.estimated ? '(Estimated)' : ''}</p>
                            <h3>{loading ? '—' : `$${(stats?.bookings.monthlyIncome.reduce((a, b) => a + b, 0) ?? 0).toLocaleString()}`}</h3>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <p className="fs-14">
                              <span className="badge badge-soft-info badge-md border border-info rounded-pill me-2">
                                <i className="isax isax-info-circle " />
                                Real-time
                              </span>
                              from Firestore
                            </p>
                          </div>
                        </div>
                        <div id="earning-chart">
                          <ReactApexChart
                            options={earningChart.options}
                            series={earningChart.series}
                            type="bar"
                            height={280}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Earnings */}
              </div>
              <div className="row">
                {/* Recently Added */}
                <div className="col-xl-6 col-xxl-5 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body">
                      <h6 className="mb-4">Recently Added</h6>
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : stats?.listings.recentListings && stats.listings.recentListings.length > 0 ? (
                        stats.listings.recentListings.map((item, idx) => {
                          const badgeMap: Record<string, { badge: string; label: string }> = {
                            hotels: { badge: 'badge-soft-info', label: 'Hotel' },
                            tours: { badge: 'badge-soft-pink', label: 'Tour' },
                            flights: { badge: 'badge-soft-teal', label: 'Flight' },
                            cars: { badge: 'badge-soft-warning', label: 'Car' },
                            cruise: { badge: 'badge-soft-cyan', label: 'Cruise' },
                            activities: { badge: 'badge-soft-pink', label: 'Activity' },
                            resorts: { badge: 'badge-soft-info', label: 'Resort' },
                            chalets: { badge: 'badge-soft-info', label: 'Chalet' },
                          };
                          const info = badgeMap[item.collection] || { badge: 'badge-soft-secondary', label: item.collection };
                          const createdDate = (() => {
                            if (!item.createdAt) return '—';
                            const d = new Date(item.createdAt);
                            return isNaN(d.getTime()) ? 'Date not recorded' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
                          })();
                          return (
                            <div key={item.id} className={`d-flex justify-content-between align-items-center${idx < stats.listings.recentListings.length - 1 ? ' mb-4' : ''}`}>
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-lg flex-shrink-0 me-2">
                                  <ImageWithBasePath
                                    src={item.image}
                                    className="img-fluid rounded-circle"
                                    alt={item.title}
                                  />
                                </span>
                                <div>
                                  <h6 className="fs-16">
                                    <span>{item.title}</span>{" "}
                                    <span className={`badge ${info.badge} badge-xs rounded-pill`}>
                                      <i className="isax isax-signpost me-1" />
                                      {info.label}
                                    </span>
                                  </h6>
                                  <p className="fs-14">Added : {createdDate}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4">
                          <i className="isax isax-box fs-32 text-gray-4 mb-2 d-block" />
                          <p className="fw-medium mb-1">No listings yet</p>
                          <p className="fs-14 text-gray-6 mb-0">Your listings will appear here once they are created and assigned to your agent account.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* /Recently Added */}
                {/* Recent Invoices */}
                <div className="col-xxl-7 col-xl-6 d-flex">
                  <div className="card shadow-none flex-fill">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-4 gap-2">
                        <h6>Latest Invoices</h6>
                      </div>
                      <div className="text-center py-4">
                        <i className="isax isax-receipt-2 fs-32 text-gray-4 mb-2 d-block" />
                        <p className="fw-medium mb-1">No invoices yet</p>
                        <p className="fs-14 text-gray-6 mb-0">Invoices and payout documents will appear here once the finance workflow is enabled.</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* /Recent Invoices */}
              </div>
              {/* Add Lists */}
              <div className="row row-cols-1 row-cols-md-3 row-cols-xl-5 justify-content-center">
                <div className="col">
                  <div className="card bg-success-100 border-0 shadow-none">
                    <div className="card-body">
                      <h6 className="mb-1">{loading ? '—' : stats?.listings.byType['hotels'] ?? stats?.listings.byType['hotel'] ?? 0} Hotels</h6>
                      <Link
                        to={routes.addHotel}
                        className="fs-14 fw-medium link-default text-decoration-underline"
                      >
                        Add New Hotels
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card bg-pink-100 border-0 shadow-none">
                    <div className="card-body">
                      <h6 className="mb-1">{loading ? '—' : stats?.listings.byType['flights'] ?? stats?.listings.byType['flight'] ?? 0} Flights</h6>
                      <Link
                        to={routes.addFlight}
                        className="fs-14 fw-medium link-primary text-decoration-underline"
                      >
                        Add New Flight
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card bg-danger-100 border-0 shadow-none">
                    <div className="card-body">
                      <h6 className="mb-1">{loading ? '—' : stats?.listings.byType['tours'] ?? stats?.listings.byType['tour'] ?? 0} Tours</h6>
                      <Link
                        to={routes.addTour}
                        className="fs-14 fw-medium link-default text-decoration-underline"
                      >
                        Add New Tour
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card bg-purple-100 border-0 shadow-none">
                    <div className="card-body">
                      <h6 className="mb-1">{loading ? '—' : stats?.listings.byType['cars'] ?? stats?.listings.byType['car'] ?? 0} Cars</h6>
                      <Link
                        to={routes.addCar}
                        className="fs-14 fw-medium link-default text-decoration-underline"
                      >
                        Add New Car
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="card bg-cyan-100 border-0 shadow-none">
                    <div className="card-body">
                      <h6 className="mb-1">{loading ? '—' : stats?.listings.byType['cruise'] ?? 0} Cruise</h6>
                      <Link
                        to={routes.addCruise}
                        className="fs-14 fw-medium link-default text-decoration-underline"
                      >
                        Add New Cruise
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {/* /Add Lists */}
              {/* Hotel-Booking List */}
              <div className="card hotel-list mb-0">
                <div className="card-body p-0">
                  <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                    <h6 className="">Recent Bookings</h6>
                    <div className="d-flex align-items-center flex-wrap">
                      <div className="dropdown me-3">
                        <Link
                          to="#"
                          className="dropdown-toggle text-gray-6 btn  rounded border d-inline-flex align-items-center"
                          data-bs-toggle="dropdown"
                          
                        >
                          Hotels
                        </Link>
                        <ul className="dropdown-menu dropdown-menu-end p-3">
                          <li>
                            <Link
                              to="#"
                              className="dropdown-item rounded-1"
                            >
                              Single Room
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="#"
                              className="dropdown-item rounded-1"
                            >
                              Double Room
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="#"
                              className="dropdown-item rounded-1"
                            >
                              Twin Room
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <div className="input-icon-start position-relative">
                        <span className="icon-addon">
                          <i className="isax isax-search-normal-1 fs-14" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Hotel List */}
                  <Table dataSource={data} columns={columns} Selection={false} />
                  {/* /Hotel List */}
                </div>
              </div>
              {/* /Hotel-Booking List */}
            </div>
          </div>
        </div>
      </div>
      {/* /Page Wrapper */}
      <AgentDhashboardModal />

    </div>
  )
}

export default AgentDashboard
