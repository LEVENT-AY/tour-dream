import { useEffect, useMemo, useState } from 'react'
import { all_routes } from '../../router/all_routes';
import Breadcrumb from '../../../core/common/Breadcrumb/breadcrumb';
import Sidebar from '../sidebar/sidebar';
import { Link } from 'react-router-dom';
import AgentEarningModal from './agentEarningModal';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useAuth } from '../../../core/contexts/AuthContext';
import { calculateAgentEarnings, fetchAgentBookings, type Booking } from '../../../core/services/agentServices';

const AgentEarning = () => {

    const routes = all_routes;
    const { userProfile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [earnings, setEarnings] = useState({ totalEstimated: 0, confirmedCount: 0, completedCount: 0, currency: 'USD' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userProfile?.uid) return;
        let isMounted = true;
        setLoading(true);
        Promise.all([
            fetchAgentBookings(userProfile.uid),
            calculateAgentEarnings(userProfile.uid),
        ])
            .then(([bookingsData, earningsData]) => {
                if (!isMounted) return;
                setBookings(bookingsData);
                setEarnings(earningsData);
            })
            .catch((err) => {
                if (!isMounted) return;
                setError(err instanceof Error ? err.message : 'Failed to load earnings');
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });
        return () => { isMounted = false; };
    }, [userProfile?.uid]);

    //Breadcrumb Data
    const breadcrumbs = [
        {
            label: 'Earnings',
            active: false,
            link: routes.home1
        },
        {
            label: 'Earnings',
            active: true,
        },
    ];

    const currentYear = new Date().getFullYear();

    const monthlyIncome = useMemo(() => {
        const arr = Array(12).fill(0);
        bookings.forEach((b) => {
            if (b.status !== 'confirmed' && b.status !== 'completed') return;
            const raw = b.createdAt || b.bookingDate;
            if (!raw) return;
            try {
                const date = new Date(raw);
                if (date.getFullYear() === currentYear) {
                    const amount =
                        typeof b.totalAmount === 'number'
                            ? b.totalAmount
                            : typeof b.price === 'number'
                            ? b.price
                            : 0;
                    arr[date.getMonth()] += amount;
                }
            } catch {
                // ignore invalid dates
            }
        });
        return arr;
    }, [bookings, currentYear]);

    const earningChart = useMemo(() => ({
        series: [
            { name: 'Estimated Income', data: monthlyIncome },
            { name: 'Expenses', data: Array(12).fill(0) },
        ],
        options: {
            chart: {
                height: 295,
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
    }), [monthlyIncome]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat(undefined, { style: 'currency', currency: earnings.currency }).format(val);

    return (
        <div>
            <Breadcrumb title="Earnings" breadcrumbs={breadcrumbs} backgroundClass="breadcrumb-bg-04" />


            {/* Page Wrapper */}
            <div className="content">
                <div className="container">
                    <div className="row">
                        {/* Sidebar */}
                        <div className="col-xl-3 col-lg-4 ">
                            <Sidebar />
                        </div>
                        {/* /Sidebar */}
                        <div className="col-xl-9 col-lg-8">
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
                                </div>
                            )}

                            <div className="row">
                                <div className="col-xl-3">
                                    <div className="card earning-box bg-primary">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <span className="avatar avatar-md rounded-circle mb-2">
                                                    <i className="isax isax-graph5 fs-24" />
                                                </span>
                                                <p className="text-white mb-1">Estimated Earnings</p>
                                                <h3 className="text-white mb-1">
                                                    {loading ? '—' : formatCurrency(earnings.totalEstimated)}
                                                </h3>
                                                <span className="badge badge-light mb-2">Estimated</span>
                                                <p className="text-white-50 fs-12 mb-0">
                                                    From {earnings.confirmedCount + earnings.completedCount} confirmed/completed bookings
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-9">
                                    <div className="card card-detail shadow-none">
                                        <div className="card-body">
                                            <h5 className="mb-3">Payout Account</h5>
                                            <div className="alert alert-info mb-0">
                                                <i className="isax isax-info-circle5 me-2" />
                                                Payment and payout integration is not configured yet.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card border-0 bg-light">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h5>Payout Details</h5>
                                        <span className="badge badge-info">Estimated only</span>
                                    </div>
                                    <div className="row align-items-center g-4">
                                        <div className="col-md-4">
                                            <div>
                                                <p className="mb-1">Estimated eligible amount</p>
                                                <h5>{loading ? '—' : formatCurrency(earnings.totalEstimated)}</h5>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div>
                                                <p className="mb-1">Confirmed/Completed bookings</p>
                                                <h5>{loading ? '—' : earnings.confirmedCount + earnings.completedCount}</h5>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="text-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    disabled
                                                    title="Payout integration is not configured yet"
                                                >
                                                    Withdraw Payment
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card shadow-none flex-fill">
                                <div className="card-body pb-0">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h6>Estimated Earnings ({currentYear})</h6>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-2">
                                                <p className="mb-0">Total Estimated Earnings this Year</p>
                                                <div className="d-flex align-items-center">
                                                    <h3>{loading ? '—' : formatCurrency(monthlyIncome.reduce((a, b) => a + b, 0))}</h3>
                                                    <p className="fs-14 ms-2">
                                                        <span className="badge badge-soft-info badge-md border border-info rounded-pill me-2">
                                                            <i className="isax isax-info-circle " />
                                                            Estimated
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div id="earning-chart" >
                                                <ReactApexChart
                                                    options={earningChart.options}
                                                    series={earningChart.series}
                                                    type="bar"
                                                    height={295}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="place-nav listing-nav">
                                <ul className="nav mb-2">
                                    <li className="me-2">
                                        <Link
                                            to="#"
                                            className="nav-link active"
                                            data-bs-toggle="tab"
                                            data-bs-target="#earning-list"
                                        >
                                            Eligible Bookings
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="tab-content">
                                <div className="tab-pane fade active show" id="earning-list">
                                    {/* Earning List */}
                                    <div className="card hotel-list">
                                        <div className="card-body p-0">
                                            <div className="list-header d-flex align-items-center justify-content-between flex-wrap">
                                                <h6 className="">Eligible Bookings</h6>
                                            </div>
                                            <div className="custom-datatable-filter table-responsive">
                                                <table className="table datatable">
                                                    <thead className="thead-light">
                                                        <tr>
                                                            <th>Booking ID</th>
                                                            <th>Service</th>
                                                            <th>Customer</th>
                                                            <th>Date</th>
                                                            <th>Amount</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {loading ? (
                                                            <tr>
                                                                <td colSpan={6} className="text-center py-4">
                                                                    <span className="spinner-border spinner-border-sm text-primary me-2" />
                                                                    Loading...
                                                                </td>
                                                            </tr>
                                                        ) : bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="text-center py-4 text-muted">
                                                                    No confirmed or completed bookings yet.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            bookings
                                                                .filter((b) => b.status === 'confirmed' || b.status === 'completed')
                                                                .map((b) => (
                                                                    <tr key={b.id}>
                                                                        <td>
                                                                            <span className="fw-medium">#{b.id?.slice(-6).toUpperCase()}</span>
                                                                        </td>
                                                                        <td>{b.itemTitle}</td>
                                                                        <td>{b.userName || b.userEmail || '—'}</td>
                                                                        <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</td>
                                                                        <td>{formatCurrency(typeof b.totalAmount === 'number' ? b.totalAmount : b.price || 0)}</td>
                                                                        <td>
                                                                            <span className={`badge rounded-pill fs-10 ${b.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                                                                                <i className="fa-solid fa-circle fs-5 me-1" />
                                                                                {b.status}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    {/* /Earning List */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* /Page Wrapper */}
            <AgentEarningModal />

        </div>
    )
}

export default AgentEarning
