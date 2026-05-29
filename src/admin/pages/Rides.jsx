import React, { useState } from "react";
import { useRides } from "../../hooks/useAdmin";
import { FaEye, FaBan, FaSearch, FaMapMarkerAlt, FaUser, FaCar, FaMoneyBillWave } from "react-icons/fa";
import Modal from "../components/common/Modal";

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-800",
  ongoing:   "bg-blue-100 text-blue-800",
  accepted:  "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
  pending:   "bg-yellow-100 text-yellow-800",
  searching: "bg-orange-100 text-orange-800",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
    {status || "—"}
  </span>
);

const PAYMENT_COLORS = { cash: "bg-green-100 text-green-700", online: "bg-blue-100 text-blue-700", wallet: "bg-purple-100 text-purple-700" };

const PaymentBadge = ({ method }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAYMENT_COLORS[method] || "bg-gray-100 text-gray-600"}`}>
    {method || "cash"}
  </span>
);

const Rides = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: "", startDate: "", endDate: "" });
  const [searchInput, setSearchInput] = useState("");

  const [viewRide, setViewRide] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const { rides, pagination, loading, cancelRide } = useRides(page, 20, filters);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: "", startDate: "", endDate: "" });
    setSearchInput("");
    setPage(1);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { alert("Please enter a reason"); return; }
    await cancelRide(cancelModal._id, cancelReason);
    setCancelModal(null);
    setCancelReason("");
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Rides Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="searching">Searching</option>
          <option value="accepted">Accepted</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">From</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">To</label>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
          />
        </div>

        <button onClick={clearFilters} className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading && rides.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase border-b">
                <tr>
                  <th className="px-5 py-3 text-left">Ride ID</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Driver</th>
                  <th className="px-5 py-3 text-left">Route</th>
                  <th className="px-5 py-3 text-left">Fare</th>
                  <th className="px-5 py-3 text-left">Payment</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rides.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">No rides found</td>
                  </tr>
                ) : (
                  rides.map((ride) => (
                    <tr key={ride._id} className="hover:bg-orange-50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">#{ride._id?.slice(-8)}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{ride.user?.name || "—"}</p>
                        <p className="text-xs text-gray-400">{ride.user?.phone || ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium">{ride.driver?.name || "—"}</p>
                        <p className="text-xs text-gray-400">{ride.driver?.vehicleNumber || ""}</p>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-xs text-green-600 truncate">
                          <FaMapMarkerAlt className="inline mr-1" />
                          {ride.pickup?.address?.slice(0, 30) || "—"}
                        </p>
                        <p className="text-xs text-red-500 truncate mt-0.5">
                          <FaMapMarkerAlt className="inline mr-1" />
                          {ride.dropoff?.address?.slice(0, 30) || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-green-600">₹{ride.fare || 0}</td>
                      <td className="px-5 py-4"><PaymentBadge method={ride.paymentMethod} /></td>
                      <td className="px-5 py-4"><StatusBadge status={ride.status} /></td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewRide(ride)}
                            title="View details"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <FaEye />
                          </button>
                          {["pending", "searching", "accepted", "ongoing"].includes(ride.status) && (
                            <button
                              onClick={() => { setCancelModal(ride); setCancelReason(""); }}
                              title="Cancel ride"
                              className="text-red-400 hover:text-red-600"
                            >
                              <FaBan />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 py-3 flex items-center justify-between border-t text-sm text-gray-500">
          <span>
            {pagination?.total
              ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, pagination.total)} of ${pagination.total}`
              : "0 results"}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">Prev</button>
            <span className="px-3 py-1 border rounded-lg bg-orange-50 text-orange-600 font-medium">
              {page} / {pagination?.totalPages || 1}
            </span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= (pagination?.totalPages || 1)} className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">Next</button>
          </div>
        </div>
      </div>

      {/* View Ride Detail Modal */}
      {viewRide && (
        <Modal title={`Ride Details — #${viewRide._id?.slice(-8)}`} onClose={() => setViewRide(null)} size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Ride Info */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaRoute className="text-orange-500" /> Ride Info</h4>
              <div className="space-y-2">
                <InfoRow label="Status"       value={<StatusBadge status={viewRide.status} />} />
                <InfoRow label="Vehicle Type" value={viewRide.vehicleType || "—"} />
                <InfoRow label="Distance"     value={viewRide.distance ? `${viewRide.distance} km` : "—"} />
                <InfoRow label="Duration"     value={viewRide.duration ? `${viewRide.duration} min` : "—"} />
                <InfoRow label="Fare"         value={<span className="font-bold text-green-600">₹{viewRide.fare || 0}</span>} />
                <InfoRow label="Payment"      value={<PaymentBadge method={viewRide.paymentMethod} />} />
                <InfoRow label="Date"         value={viewRide.createdAt ? new Date(viewRide.createdAt).toLocaleString("en-IN") : "—"} />
              </div>
            </div>

            {/* User Info */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaUser className="text-blue-500" /> Customer</h4>
              <div className="space-y-2">
                <InfoRow label="Name"  value={viewRide.user?.name || "—"} />
                <InfoRow label="Phone" value={viewRide.user?.phone || "—"} />
                <InfoRow label="Email" value={viewRide.user?.email || "—"} />
              </div>

              <h4 className="font-semibold text-gray-700 mb-3 mt-5 flex items-center gap-2"><FaCar className="text-green-500" /> Driver</h4>
              {viewRide.driver ? (
                <div className="space-y-2">
                  <InfoRow label="Name"    value={viewRide.driver?.name || "—"} />
                  <InfoRow label="Vehicle" value={viewRide.driver?.vehicleNumber || "—"} />
                  <InfoRow label="Rating"  value={`${viewRide.driver?.rating?.toFixed(1) || "N/A"} ★`} />
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">No driver assigned</p>
              )}
            </div>

            {/* Locations */}
            <div className="md:col-span-2">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaMapMarkerAlt className="text-red-500" /> Route</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">Pickup</p>
                  <p className="text-sm text-gray-700">{viewRide.pickup?.address || "—"}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Dropoff</p>
                  <p className="text-sm text-gray-700">{viewRide.dropoff?.address || "—"}</p>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="md:col-span-2">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaMoneyBillWave className="text-purple-500" /> Fare Breakdown</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Base Fare</p>
                  <p className="text-xl font-bold text-blue-600">₹{viewRide.pricing?.baseFare || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="text-xl font-bold text-green-600">₹{viewRide.pricing?.distanceCharge || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-xl font-bold text-purple-600">₹{viewRide.pricing?.timeCharge || 0}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center border-t pt-3">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="text-2xl font-bold text-orange-600">₹{viewRide.fare || 0}</span>
              </div>
            </div>

            {/* Cancellation Info */}
            {viewRide.status === "cancelled" && (
              <div className="md:col-span-2 bg-red-50 rounded-lg p-4">
                <p className="font-semibold text-red-700 mb-2">Cancellation Info</p>
                <InfoRow label="Cancelled By" value={viewRide.cancelledBy || "—"} />
                <InfoRow label="Reason"       value={viewRide.cancellationReason || "No reason provided"} />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Ride Modal */}
      {cancelModal && (
        <Modal title="Cancel Ride" onClose={() => setCancelModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Cancelling ride <strong>#{cancelModal._id?.slice(-8)}</strong>. This will notify both customer and driver.
            </p>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={3}
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setCancelModal(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
              <button onClick={handleCancel} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Confirm Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-start py-1.5 border-b border-gray-100 last:border-0">
    <span className="text-gray-400 text-xs">{label}</span>
    <span className="font-medium text-gray-800 text-right">{value}</span>
  </div>
);

const FaRoute = ({ className }) => (
  <svg className={className} viewBox="0 0 576 512" fill="currentColor" width="1em" height="1em">
    <path d="M575.8 255.5C575.8 273.5 558.5 288 537.8 288H205.8L307.4 389.3c6.2 6.2 9.7 14.4 9.7 23.1 0 18.1-14.9 32-33.7 32-8.5 0-16.7-3.4-22.8-9.5L9.4 283.7C3.2 277.5 0 269.3 0 261s3.2-16.5 9.4-22.7L260.7 96.2C266.8 90 275 86.5 283.5 86.5c18.8 0 33.7 14 33.7 32 0 8.7-3.5 17-9.7 23.1L205.8 243.5H537.8C558.5 224 575.8 237.5 575.8 255.5z"/>
  </svg>
);

export default Rides;
