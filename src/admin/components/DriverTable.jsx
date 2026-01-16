// src/admin/pages/Drivers.jsx
import React, { useState } from 'react';
import { useDrivers } from '../../hooks/useAdmin';
import { FaCheck, FaTimes, FaBan, FaUnlock, FaTrash, FaEye } from 'react-icons/fa';
import Modal from '../../admin/components/common/Modal';

const Drivers = ({ onViewDriver }) => {
  // ... existing code ...

  const handleApprove = async (driverId) => {
    if (window.confirm('Are you sure you want to approve this driver?')) {
      await approveDriver(driverId);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    await rejectDriver(selectedDriver._id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      alert('Please provide a reason for blocking');
      return;
    }
    await blockDriver(selectedDriver._id, blockReason);
    setShowBlockModal(false);
    setBlockReason('');
  };

  const handleUnblock = async (driverId) => {
    if (window.confirm('Are you sure you want to unblock this driver?')) {
      await unblockDriver(driverId);
    }
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
      await deleteDriver(driverId);
    }
  };

  return (
    <div className="space-y-6">
      {/* ... existing JSX ... */}
      
      <tbody className="bg-white divide-y divide-gray-200">
        {drivers.map((driver) => {
          const rating = driver?.rating?.average 
            ? Number(driver.rating.average).toFixed(1)
            : 'N/A';
          const vehicleType = driver?.vehicle?.type || 'N/A';
          const vehicleNumber = driver?.vehicle?.number || 'N/A';

          return (
            <tr key={driver._id} className="hover:bg-gray-50">
              {/* ... other columns ... */}

              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex space-x-2">
                  {/* ✅ CORRECT WAY - Don't use navigate */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onViewDriver(driver._id);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <FaEye />
                  </button>

                  {(!driver.isApproved || driver.status === 'pending' || driver.status === 'offline') && (
                    <>
                      <button
                        onClick={() => handleApprove(driver._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Approve"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowRejectModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Reject"
                      >
                        <FaTimes />
                      </button>
                    </>
                  )}

                  {driver.isApproved && !driver.isBlocked && (
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowBlockModal(true);
                      }}
                      className="text-orange-600 hover:text-orange-900"
                      title="Block"
                    >
                      <FaBan />
                    </button>
                  )}

                  {driver.isBlocked && (
                    <button
                      onClick={() => handleUnblock(driver._id)}
                      className="text-green-600 hover:text-green-900"
                      title="Unblock"
                    >
                      <FaUnlock />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(driver._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </div>
  );
};

export default Drivers;