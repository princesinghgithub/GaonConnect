// src/components/admin/Users/UsersList.jsx
import React, { useState } from 'react';
import { useUsers } from '../../../hooks/useAdmin';
import { FaEye, FaBan, FaUnlock } from 'react-icons/fa';
import Modal from '../../common/Modal';
import { useNavigate } from 'react-router-dom';

const UsersList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const navigate = useNavigate();

  const { users, pagination, loading, error, blockUser, unblockUser } = useUsers(
    page,
    20,
    search
  );

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      alert('Please provide a reason for blocking');
      return;
    }
    await blockUser(selectedUser._id, blockReason);
    setShowBlockModal(false);
    setBlockReason('');
  };

  const handleUnblock = async (userId) => {
    if (window.confirm('Are you sure you want to unblock this user?')) {
      await unblockUser(userId);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users Management</h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total Rides
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.profileImage || '/default-avatar.png'}
                        alt={user.name}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.totalRides || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isBlocked ? (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-semibold">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-semibold">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FaEye />
                      </button>

                      {!user.isBlocked ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowBlockModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="Block User"
                        >
                          <FaBan />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(user._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Unblock User"
                        >
                          <FaUnlock />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * 20, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <Modal
          title="Block User"
          onClose={() => {
            setShowBlockModal(false);
            setBlockReason('');
          }}
        >
          <div className="space-y-4">
            <p>
              Blocking user: <strong>{selectedUser?.name}</strong>
            </p>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter reason for blocking..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Block
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UsersList;