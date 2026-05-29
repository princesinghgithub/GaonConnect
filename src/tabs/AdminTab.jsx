import React, { useState } from "react";
import { AdminProvider } from "../context/AdminContext";
import AdminSidebar from "../admin/components/AdminSidebar";
import Dashboard from "../admin/pages/Dashboard";
import Drivers from "../admin/pages/Drivers";
import Rides from "../admin/pages/Rides";
import LiveMap from "../admin/pages/LiveMap";
import Payments from "../admin/pages/Payments";
import Customers from "../admin/pages/Customers";
import Analytics from "../admin/pages/Analytics";
import Pricing from "../admin/pages/Pricing";
import Notifications from "../admin/pages/Notifications";
import Settings from "../admin/pages/Settings";

const AdminTab = () => {
  const [active, setActive] = useState("dashboard");

  const renderPage = () => {
    switch (active) {
      case "drivers":       return <Drivers />;
      case "rides":         return <Rides />;
      case "liveMap":       return <LiveMap />;
      case "payments":      return <Payments />;
      case "customers":     return <Customers />;
      case "analytics":     return <Analytics />;
      case "pricing":       return <Pricing />;
      case "notifications": return <Notifications />;
      case "settings":      return <Settings />;
      default:              return <Dashboard />;
    }
  };

  return (
    <AdminProvider>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <AdminSidebar active={active} setActive={setActive} />
        <div className="flex-1 overflow-y-auto">
          {active !== "liveMap" ? (
            <div className="p-6">{renderPage()}</div>
          ) : (
            renderPage()
          )}
        </div>
      </div>
    </AdminProvider>
  );
};

export default AdminTab;
