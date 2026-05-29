import React, { useState } from "react";
import { useDrivers } from "../../hooks/useAdmin";
import { FaCheck, FaTimes, FaBan, FaUnlock, FaTrash, FaEye, FaSearch } from "react-icons/fa";
import Modal from "../components/common/Modal";

const STATUS_COLORS = {
  approved: "bg-green-100 text-green-800",
  online:   "bg-emerald-100 text-emerald-800",
  pending:  "bg-yellow-100 text-yellow-800",
  offline:  "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-800",
  blocked:  "bg-orange-100 text-orange-800",
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
    {status || "N/A"}
  </span>
);

const VEHICLE_ICONS = { auto: "🛺", bike: "🏍", car: "🚗", tractor: "🚜" };

const Drivers = () => {
  const [page, setPage]               = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [modal, setModal]             = useState(null); // null | 'view' | 'reject' | 'block'
  const [selected, setSelected]       = useState(null);
  const [reason, setReason]           = useState("");

  const { drivers, pagination, loading, approveDriver, rejectDriver, blockDriver, unblockDriver, deleteDriver } =
    useDrivers(page, 20, statusFilter, search);

  const openModal = (type, driver) => { setSelected(driver); setModal(type); setReason(""); };
  const closeModal = () => { setModal(null); setSelected(null); setReason(""); };

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this driver?")) return;
    await approveDriver(id);
  };

  const handleReject = async () => {
    if (!reason.trim()) { alert("Reason required"); return; }
    await rejectDriver(selected._id, reason);
    closeModal();
  };

  const handleBlock = async () => {
    if (!reason.trim()) { alert("Reason required"); return; }
    await blockDriver(selected._id, reason);
    closeModal();
  };

  const handleUnblock = async (id) => {
    if (!window.confirm("Unblock this driver?")) return;
    await unblockDriver(id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete permanently? This cannot be undone.")) return;
    await deleteDriver(id);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Drivers Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-52">
          <input
            type="text"
            placeholder="Search name / phone..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <FaSearch />
          </button>
        </form>

        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </select>

        <button
          onClick={() => { setSearch(""); setSearchInput(""); setStatusFilter(""); setPage(1); }}
          className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading && drivers.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase border-b">
                <tr>
                  <th className="px-5 py-3 text-left">Driver</th>
                  <th className="px-5 py-3 text-left">Vehicle</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Rating</th>
                  <th className="px-5 py-3 text-left">Stats</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">No drivers found</td>
                  </tr>
                ) : (
                  drivers.map((driver) => {
                    const vehicle = driver?.vehicle?.type || "auto";
                    const vehicleNum = driver?.vehicle?.number || "—";
                    const rating = driver?.rating?.average ? Number(driver.rating.average).toFixed(1) : "N/A";

                    return (
                      <tr key={driver._id} className="hover:bg-orange-50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                              {(VEHICLE_ICONS[vehicle] || "🚗")}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{driver.user?.name || "Driver"}</p>
                              <p className="text-xs text-gray-400">{driver.user?.phone || `#${driver._id.slice(-6)}`}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium capitalize">{vehicle}</p>
                          <p className="text-xs text-gray-400">{vehicleNum}</p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={driver.status} />
                          {driver.isBlocked && (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">Blocked</span>
                          )}
                          <p className="text-xs mt-1 text-gray-400">{driver.isOnline ? "🟢 Online" : "⚫ Offline"}</p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1 font-medium">{rating}</span>
                          <p className="text-xs text-gray-400">{driver.rating?.count || 0} reviews</p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">{driver.stats?.totalTrips || 0} trips</p>
                          <p className="text-xs text-gray-400">₹{driver.stats?.totalEarnings || 0} earned</p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openModal("view", driver)} title="View" className="text-blue-500 hover:text-blue-700"><FaEye /></button>

                            {driver.status === "pending" && (
                              <>
                                <button onClick={() => handleApprove(driver._id)} title="Approve" className="text-green-500 hover:text-green-700"><FaCheck /></button>
                                <button onClick={() => openModal("reject", driver)} title="Reject" className="text-red-500 hover:text-red-700"><FaTimes /></button>
                              </>
                            )}

                            {driver.isApproved && !driver.isBlocked && (
                              <button onClick={() => openModal("block", driver)} title="Block" className="text-orange-500 hover:text-orange-700"><FaBan /></button>
                            )}

                            {driver.isBlocked && (
                              <button onClick={() => handleUnblock(driver._id)} title="Unblock" className="text-green-500 hover:text-green-700"><FaUnlock /></button>
                            )}

                            <button onClick={() => handleDelete(driver._id)} title="Delete" className="text-red-400 hover:text-red-600"><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
            >
              Prev
            </button>
            <span className="px-3 py-1 border rounded-lg bg-orange-50 text-orange-600 font-medium">
              {page} / {pagination?.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (pagination?.totalPages || 1)}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {modal === "view" && selected && (
        <Modal title="Driver Details" onClose={closeModal} size="lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Name"           value={selected.user?.name || "—"} />
            <InfoRow label="Phone"          value={selected.user?.phone || "—"} />
            <InfoRow label="Email"          value={selected.user?.email || "—"} />
            <InfoRow label="Status"         value={<StatusBadge status={selected.status} />} />
            <InfoRow label="Vehicle Type"   value={selected.vehicle?.type || "—"} />
            <InfoRow label="Vehicle Number" value={selected.vehicle?.number || "—"} />
            <InfoRow label="Rating"         value={`${selected.rating?.average?.toFixed(1) || "N/A"} ★ (${selected.rating?.count || 0})`} />
            <InfoRow label="Total Trips"    value={selected.stats?.totalTrips || 0} />
            <InfoRow label="Total Earnings" value={`₹${selected.stats?.totalEarnings || 0}`} />
            <InfoRow label="Joined"         value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN") : "—"} />
            <InfoRow label="Online"         value={selected.isOnline ? "Yes 🟢" : "No ⚫"} />
            <InfoRow label="Blocked"        value={selected.isBlocked ? "Yes 🔴" : "No"} />
          </div>
          {selected.vehicle?.rc && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">RC / Licence</p>
              <p className="text-sm">{selected.vehicle.rc}</p>
            </div>
          )}
        </Modal>
      )}

      {/* Reject Modal */}
      {modal === "reject" && selected && (
        <Modal title="Reject Driver" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Rejecting: <strong>{selected.user?.name || `Driver #${selected._id.slice(-6)}`}</strong>
            </p>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              rows={4}
              placeholder="Reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">Reject</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Block Modal */}
      {modal === "block" && selected && (
        <Modal title="Block Driver" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Blocking: <strong>{selected.user?.name || `Driver #${selected._id.slice(-6)}`}</strong>
            </p>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={4}
              placeholder="Reason for blocking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
              <button onClick={handleBlock} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">Block</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="font-medium text-gray-800 mt-0.5">{value}</span>
  </div>
);

export default Drivers;
