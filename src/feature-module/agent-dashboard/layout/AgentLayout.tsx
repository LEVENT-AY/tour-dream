import React from 'react';
import { Outlet } from 'react-router-dom';

const AgentLayout: React.FC = () => {
  return (
    <div className="agent-dashboard-wrapper">
      <Outlet />
    </div>
  );
};

export default AgentLayout;
