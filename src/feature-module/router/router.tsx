import React from "react";
import {  Route, Routes } from "react-router";
import { authRoutes, publicRoutes, adminRoutes, agentRoutes, userRoutes } from "./router.link";
import Feature from "../feature";
import AuthFeature from "../authFeature";
import AdminLayout from "../admin-dashboard/layout/AdminLayout";
import AgentLayout from "../agent-dashboard/layout/AgentLayout";
import { ProtectedRoute, RoleProtectedRoute, AgentProtectedRoute } from "../../core/contexts/ProtectedRoute";
import Unauthorized from "../pages/error/Unauthorized";
import AgentStatusPage from "../pages/agent-status/AgentStatusPage";
import BecomeAgent from "../pages/become-agent/BecomeAgent";

type AppRoute = {
  path: string;
  element: React.ReactNode;
  route?: typeof Route;
  name?: string;
};

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <RoleProtectedRoute allowedRoles={['admin']}>
      {children}
    </RoleProtectedRoute>
  </ProtectedRoute>
);

const AgentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <AgentProtectedRoute>
      {children}
    </AgentProtectedRoute>
  </ProtectedRoute>
);

const UserGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute>
    <RoleProtectedRoute allowedRoles={['customer', 'agent', 'admin']}>
      {children}
    </RoleProtectedRoute>
  </ProtectedRoute>
);

// Existing public URLs that are actually management pages and must be guarded
// until they are refactored under /agent/* in a future phase.
const MANAGEMENT_ROUTE_PATHS = new Set([
  '/flight/add-flight',
  '/hotel/add-hotel',
  '/car/add-car',
  '/cruise/add-cruise',
  '/tour/add-tour',
  '/bus/add-bus',
  '/activity/add-activity',
  '/visa/add-visa',
  '/guide/add-guide',
  '/edit-hotel',
  '/edit-car',
  '/edit-flight',
  '/edit-cruise',
  '/bus/edit-bus',
]);

const isManagementRoute = (path: string): boolean => MANAGEMENT_ROUTE_PATHS.has(path);

const wrapRouteElement = (route: AppRoute): React.ReactNode => {
  const path = route.path;
  if (path.startsWith('/admin')) {
    return <AdminGuard>{route.element}</AdminGuard>;
  }
  if (path.startsWith('/agent')) {
    return <AgentGuard>{route.element}</AgentGuard>;
  }
  if (path.startsWith('/user')) {
    return <UserGuard>{route.element}</UserGuard>;
  }
  if (isManagementRoute(path)) {
    return <AgentGuard>{route.element}</AgentGuard>;
  }
  return route.element;
};

const ALLRoutes: React.FC = () => {
  return (
    <>
      <Routes>
        <Route element={<Feature />}>
          {publicRoutes.map((route: AppRoute, idx: number) => (
            <Route path={route.path} element={wrapRouteElement(route)} key={idx} />
          ))}

          <Route path="/become-agent" element={<ProtectedRoute><BecomeAgent /></ProtectedRoute>} />

          {/* User Routes */}
          <Route element={<UserGuard><Feature /></UserGuard>}>
             {userRoutes.map((route: AppRoute, idx: number) => (
                <Route path={route.path} element={route.element} key={idx} />
             ))}
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>

        {/* Agent Routes - completely isolated from public Feature layout */}
        <Route element={<AgentGuard><AgentLayout /></AgentGuard>}>
           {agentRoutes.map((route: AppRoute, idx: number) => (
              <Route path={route.path} element={route.element} key={idx} />
           ))}
        </Route>

        {/* Admin Routes - completely isolated from public Feature layout */}
        <Route element={<AdminGuard><AdminLayout /></AdminGuard>}>
           {adminRoutes.map((route: AppRoute, idx: number) => (
              <Route path={route.path} element={route.element} key={idx} />
           ))}
        </Route>

        <Route element={<AuthFeature />}>
          {authRoutes.map((route: AppRoute, idx: number) => (
            <Route path={route.path} element={route.element} key={idx} />
          ))}
        </Route>

        <Route path="/agent-status" element={<ProtectedRoute><AgentStatusPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

export default ALLRoutes;
