import React from 'react';
import { useAuth } from '../../../core/contexts/AuthContext';

const AgentStatusPage: React.FC = () => {
  const { userProfile, logout, isApprovedAgent, isSuspendedOrRejected } = useAuth();

  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light p-3">
      <div className="card shadow-sm" style={{ maxWidth: '540px', width: '100%' }}>
        <div className="card-body text-center p-5">
          <div className="mb-4">
            <i className="isax isax-info-circle fs-48 text-warning" />
          </div>
          <h3 className="mb-3">Agent Account Status</h3>
          {isSuspendedOrRejected ? (
            <>
              <p className="text-danger fs-16">
                Your agent account is currently <strong>{userProfile?.agentStatus}</strong>.
              </p>
              <p className="text-muted">
                Please contact the administrator for more information.
              </p>
            </>
          ) : isApprovedAgent ? (
            <p className="text-success fs-16">
              Your agent account is approved. You can now access the agent dashboard.
            </p>
          ) : (
            <>
              <p className="text-warning fs-16">
                Your agent application is currently <strong>pending review</strong>.
              </p>
              <p className="text-muted">
                An administrator will review your application soon. You will be notified once it is approved.
              </p>
            </>
          )}
          <div className="mt-4">
            <p className="text-muted mb-1">Signed in as {userProfile?.email}</p>
            <button className="btn btn-primary mt-3" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusPage;
