import React from 'react';

const AdminPayments: React.FC = () => {
  return (
    <div>
      <h3 className="mb-4">Payments</h3>
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="isax isax-wallet-3 fs-48 text-muted mb-3" />
          <h5 className="text-muted">Payment integration is not configured yet.</h5>
          <p className="text-muted mb-0">Once a payment provider is connected, transactions and revenue will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
