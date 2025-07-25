import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Login from "./Login";
import LandingPage from "./LandingPage";
import DashboardContent from "./DashboardContent";
import AgentsTable from "./Agent/AgentsTable";
import DistributorsTable from "./Distributor/DistributorsTable";
import RegionAgentsTable from "./RegionAgent/AgentsTable";
import RegionDistributorsTable from "./RegionDistributor/DistributorsTable";
import RegionsTable from "./Regions/RegionTable";
import SubRegionsTable from "./SubRegion/SubregionTable";
import ProductsTable from "./Products/ProductTable";
import CommissionsTable from "./Commissions/CommisionTable";
import PaidCommissionsTable from "./Commissions/PaidCommissionsTable";
import SalesTable from "./Sales/SalesTable";
import GroupedDataTable from "./Sales/GroupedDataTable";
import RegionSalesTable from "./RegionSales/SalesTable";
import UserTable from "./User/UserTable";
import GroupTable from "./Groups/GroupTable";
import UserProfile from "./Profile/UserProfile";
import ErrorPage from "./ErrorPage";
import ProtectedRoute from "./ReduxProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/landingpage",
    element: (
      <ProtectedRoute>
        <LandingPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <DashboardContent /> },
      { path: "dashboard", element: <DashboardContent /> },
      { path: "agents", element: <AgentsTable /> },
      { path: "distributors", element: <DistributorsTable /> },
      { path: "region-agents", element: <RegionAgentsTable /> },
      { path: "region-distributors", element: <RegionDistributorsTable /> },
      { path: "regions", element: <RegionsTable /> },
      { path: "sub-regions", element: <SubRegionsTable /> },
      { path: "products", element: <ProductsTable /> },
      { path: "profile", element: <UserProfile /> },
      { path: "region-sales", element: <RegionSalesTable /> },
      { path: "sales", element: <SalesTable /> },
      { path: "grouped-sales", element: <GroupedDataTable /> },
      { path: "commission-disbursement", element: <CommissionsTable /> },
      { path: "paid-commissions", element: <PaidCommissionsTable /> },
      { path: "user", element: <UserTable /> },
      { path: "group", element: <GroupTable /> },
    ],
  },
  {
    path: "/error",
    element: <ErrorPage />,
    errorElement: <ErrorPage />,
  },
]);

export default router;
