// import React, { useState } from "react";
// import AdminSidebar from "../admin/components/AdminSidebar";
// import Dashboard from "../admin/pages/Dashboard";
// import Drivers from "../admin/pages/Drivers";
// import LiveMap from "../admin/pages/LiveMap";

// const AdminTab = () => {
//   const [active, setActive] = useState("dashboard");

//   const renderPage = () => {
//     if (active === "drivers") return <Drivers />;
//     if (active === "liveMap") return <LiveMap />;
//     return <Dashboard />;
//   };

//   return (
//     <div className="flex h-screen">
//       <AdminSidebar active={active} setActive={setActive} />
//       <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
//         {renderPage()}
//       </div>
//     </div>
//   );
// };

// export default AdminTab;


import React, { useState } from "react";
import { AdminProvider } from "../context/AdminContext";
import AdminSidebar from "../admin/components/AdminSidebar";
import Dashboard from "../admin/pages/Dashboard";
import Drivers from "../admin/pages/Drivers";
import Rides from "../admin/pages/Rides";
import LiveMap from "../admin/pages/LiveMap";
import Payments from "../admin/pages/Payments";
import Settings from "../admin/pages/Settings";

const AdminTab = () => {
  const [active, setActive] = useState("dashboard");

  const renderPage = () => {
    switch(active) {
      case "drivers":
        return <Drivers />;
      case "rides":
        return <Rides />;
      case "liveMap":
        return <LiveMap />;
      case "payments":
        return <Payments />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminProvider>
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar active={active} setActive={setActive} />
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderPage()}
          </div>
        </div>
      </div>
    </AdminProvider>
  );
};

export default AdminTab;