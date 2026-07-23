import React from "react";
import {
  FaTachometerAlt,
  FaCar,
  FaRoute,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaUsers,
  FaChartBar,
  FaTags,
  FaBell,
  FaCog,
  FaPercent,
} from "react-icons/fa";

const menu = [
  { key: "dashboard",    label: "Dashboard",    icon: <FaTachometerAlt /> },
  { key: "drivers",      label: "Drivers",      icon: <FaCar /> },
  { key: "rides",        label: "Rides",        icon: <FaRoute /> },
  { key: "liveMap",      label: "Live Map",     icon: <FaMapMarkedAlt /> },
  { key: "payments",     label: "Payments",     icon: <FaMoneyBillWave /> },
  { key: "customers",    label: "Customers",    icon: <FaUsers /> },
  { key: "analytics",    label: "Analytics",    icon: <FaChartBar /> },
  { key: "pricing",      label: "Pricing",      icon: <FaTags /> },
  { key: "promos",       label: "Promo Codes",  icon: <FaPercent /> },
  { key: "notifications",label: "Notifications",icon: <FaBell /> },
  { key: "settings",     label: "Settings",     icon: <FaCog /> },
];

const AdminSidebar = ({ active, setActive }) => {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold text-orange-400">GaonConnect</h2>
        <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {menu.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${active === item.key
                ? "bg-orange-500 text-white shadow"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700 text-xs text-gray-500 text-center">
        v1.0.0 &copy; GaonConnect
      </div>
    </div>
  );
};

export default AdminSidebar;
