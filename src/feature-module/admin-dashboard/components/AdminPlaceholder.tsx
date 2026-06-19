import React from 'react';
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';

interface AdminPlaceholderProps {
  title: string;
  description?: string;
}

const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title, description }) => {
  return (
    <div className="card">
      <div className="card-body p-4 text-center">
        <span className="avatar avatar-lg bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
          <i className="isax isax-setting-2 fs-24 text-primary" />
        </span>
        <h4 className="mb-2">{title}</h4>
        <p className="text-muted mb-4">
          {description || `${title} management interface will be implemented in the next phase.`}
        </p>
        <Link to={all_routes.adminDashboard} className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
