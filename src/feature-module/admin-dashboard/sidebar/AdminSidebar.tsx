import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useAuth } from '../../../core/contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  submenu?: { label: string; route: string }[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', route: all_routes.adminDashboard, icon: 'isax-grid-5' },
  {
    label: 'Bookings',
    route: all_routes.adminBookings,
    icon: 'isax-calendar-tick',
    submenu: [
      { label: 'All Bookings', route: all_routes.adminBookings },
      { label: 'Pending', route: all_routes.adminBookingsPending },
      { label: 'Confirmed', route: all_routes.adminBookingsConfirmed },
      { label: 'Cancelled', route: all_routes.adminBookingsCancelled },
    ],
  },
  { label: 'Tours', route: all_routes.adminTours, icon: 'isax-map' },
  { label: 'Hotels', route: all_routes.adminHotels, icon: 'isax-building' },
  { label: 'Resorts', route: all_routes.adminResorts, icon: 'isax-buildings' },
  { label: 'Chalets', route: all_routes.adminChalets, icon: 'isax-house' },
  { label: 'Activities', route: all_routes.adminActivities, icon: 'isax-activity' },
  { label: 'Flights', route: all_routes.adminFlights, icon: 'isax-airplane' },
  { label: 'Cars', route: all_routes.adminCars, icon: 'isax-car' },
  { label: 'Agents / Vendors', route: all_routes.adminAgents, icon: 'isax-user-octagon' },
  { label: 'Customers', route: all_routes.adminCustomers, icon: 'isax-people' },
  { label: 'Reviews', route: all_routes.adminReviews, icon: 'isax-magic-star' },
  { label: 'Coupons', route: all_routes.adminCoupons, icon: 'isax-ticket-discount' },
  { label: 'Payments', route: all_routes.adminPayments, icon: 'isax-wallet' },
  { label: 'Notifications', route: all_routes.adminNotifications, icon: 'isax-notification' },
  { label: 'Website Settings', route: all_routes.adminSettings, icon: 'isax-setting-2' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isActive = (route: string) => location.pathname === route;
  const isParentActive = (item: MenuItem) =>
    isActive(item.route) || (item.submenu?.some((sub) => isActive(sub.route)) ?? false);
  const handleLogout = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    await logout();
    onClose();
    window.location.assign('/');
  };

  return (
    <aside
      className={`admin-sidebar card border-0 rounded-0 flex-shrink-0 bg-white ${
        isOpen ? 'admin-sidebar-open' : 'admin-sidebar-closed'
      }`}
      style={{ width: '280px' }}
    >
      <div className="card-body p-0">
        <div className="d-flex d-lg-none align-items-center justify-content-between p-3 border-bottom">
          <span className="fw-semibold">Menu</span>
          <button className="btn btn-sm btn-light" onClick={onClose}>
            <i className="isax isax-close-circle fs-18" />
          </button>
        </div>
        <div className="p-3 border-bottom">
          <Link
            to="/"
            onClick={handleLogout}
            className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
          >
            <i className="isax isax-arrow-left-2 fs-14" />
            Back to Website
          </Link>
        </div>
        <ul className="admin-menu list-unstyled mb-0 py-2">
          {menuItems.map((item) => {
            const active = isParentActive(item);
            const expanded = openMenus.has(item.label) || active;
            return (
              <li key={item.label} className={item.submenu ? 'submenu' : ''}>
                <Link
                  to={item.submenu ? '#' : item.route}
                  onClick={(e) => {
                    if (item.submenu) {
                      e.preventDefault();
                      toggleMenu(item.label);
                    } else {
                      onClose();
                    }
                  }}
                  className={`d-flex align-items-center px-3 py-2 text-decoration-none ${
                    active ? 'bg-primary text-white' : 'text-dark hover-bg-light'
                  }`}
                >
                  <i className={`isax ${item.icon} fs-18 me-2`} />
                  <span className="flex-grow-1">{item.label}</span>
                  {item.submenu && (
                    <i className={`isax isax-arrow-down-1 fs-12 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  )}
                </Link>
                {item.submenu && expanded && (
                  <ul className="list-unstyled mb-0 bg-light">
                    {item.submenu.map((sub) => (
                      <li key={sub.label}>
                        <Link
                          to={sub.route}
                          onClick={onClose}
                          className={`d-block px-5 py-2 fs-14 text-decoration-none ${
                            isActive(sub.route) ? 'text-primary fw-medium' : 'text-muted'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default AdminSidebar;
