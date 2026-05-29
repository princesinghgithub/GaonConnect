import React, { useState } from "react";
import { useUsers } from "../../hooks/useAdmin";
import { FaEye, FaBan, FaUnlock, FaSearch } from "react-icons/fa";
import Modal from "../components/common/Modal";

const Customers = () => {
  const [page, setPage]           = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]       = useState("");

  const [modal, setModal]         = useState(null); // null | 'view' | 'block'
  const [selected, setSelected]   = useState(null);
  const [blockReason, setBlockReason] = useState("");

  const { users, pagination, loading, blockUser, unblockUser } = useUsers(page, 20, search);

  const openModal = (type, user) => { setSelected(user); setModal(type); setBlockReason(""); };
  const closeModal = () => { setModal(null); setSelected(null); setBlockReason(""); };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) { alert("Reason required"); return; }
    await blockUser(selected._id, blockReason);
    closeModal();
  };

  const handleUnblock = async (id) => {
    if (!window.confirm("Unblock this user?")) return;
    await unblockUser(id);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Customers Management</h1>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-52">
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <FaSearch />
          </button>
        </form>
        <button
          onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
          className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-400 uppercase border-b">
                <tr>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">Total Rides</th>
                  <th className="px-5 py-3 text-left">Total Spent</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">No customers found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-orange-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {(user.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{user.name || "—"}</p>
                            <p className="text-xs text-gray-400">#{user._id?.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-800">{user.email || "—"}</p>
                        <p className="text-xs text-gray-400">{user.phone || "—"}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-700">{user.totalRides || 0}</td>
                      <td className="px-5 py-4 font-semibold text-green-600">₹{user.totalSpent || 0}</td>
                      <td className="px-5 py-4">
                        {user.isBlocked ? (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-semibold">Blocked</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-semibold">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openModal("view", user)} title="View" className="text-blue-500 hover:text-blue-700"><FaEye /></button>
                          {!user.isBlocked ? (
                            <button onClick={() => openModal("block", user)} title="Block" className="text-orange-500 hover:text-orange-700"><FaBan /></button>
                          ) : (
                            <button onClick={() => handleUnblock(user._id)} title="Unblock" className="text-green-500 hover:text-green-700"><FaUnlock /></button>
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

      {/* View Modal */}
      {modal === "view" && selected && (
        <Modal title="Customer Details" onClose={closeModal} size="md">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {(selected.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{selected.name || "—"}</p>
                <p className={`text-xs font-semibold ${selected.isBlocked ? "text-red-600" : "text-green-600"}`}>
                  {selected.isBlocked ? "Blocked" : "Active"}
                </p>
              </div>
            </div>

            <InfoRow label="Email"       value={selected.email || "—"} />
            <InfoRow label="Phone"       value={selected.phone || "—"} />
            <InfoRow label="Total Rides" value={selected.totalRides || 0} />
            <InfoRow label="Total Spent" value={`₹${selected.totalSpent || 0}`} />
            <InfoRow label="Joined"      value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN") : "—"} />

            {selected.isBlocked && selected.blockReason && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-500 font-medium">Block Reason</p>
                <p className="text-sm text-red-700 mt-1">{selected.blockReason}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Block Modal */}
      {modal === "block" && selected && (
        <Modal title="Block Customer" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Blocking <strong>{selected.name}</strong>. They won't be able to book rides.
            </p>
            <textarea
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={3}
              placeholder="Reason for blocking..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
              <button onClick={handleBlock} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Block</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-400 text-xs">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

export default Customers;
