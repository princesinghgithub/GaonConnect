import React from "react";

const menu = [
  { key: "dashboard", label: "Dashboard" },
  { key: "drivers", label: "Drivers" },
  { key: "rides", label: "Rides" },
  { key: "liveMap", label: "Live Map" },
  { key: "payments", label: "Payments" },
  { key: "settings", label: "Settings" }
];

const AdminSidebar = ({ active, setActive }) => {
  return (
    <div className="w-64 bg-gray-900 text-white p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">GoanConnect Admin</h2>

      {menu.map((item) => (
        <button
          key={item.key}
          onClick={() => setActive(item.key)}
          className={`w-full text-left px-4 py-2 rounded-lg transition
            ${active === item.key ? "bg-orange-500" : "hover:bg-gray-700"}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default AdminSidebar;
