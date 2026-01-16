// // src/components/admin/Drivers/DriversList.jsx
// import React, { useState } from 'react';
// import { useDrivers } from '../../hooks/useAdmin';
// import { FaCheck, FaTimes, FaBan, FaUnlock, FaTrash, FaEye } from 'react-icons/fa';
// import Modal from '../components/common/Modal';  // ✅ CORRECT PATH
// import { useNavigate } from 'react-router-dom';

// const StatusBadge = ({ status }) => {
//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'approved':
//         return 'bg-green-100 text-green-800';
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'rejected':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   return (
//     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
//       {status || 'N/A'}
//     </span>
//   );
// };

// const DriversList = () => {
//   const [page, setPage] = useState(1);
//   const [status, setStatus] = useState('');
//   const [search, setSearch] = useState('');
//   const [selectedDriver, setSelectedDriver] = useState(null);
//   const [showRejectModal, setShowRejectModal] = useState(false);
//   const [showBlockModal, setShowBlockModal] = useState(false);
//   const [rejectReason, setRejectReason] = useState('');
//   const [blockReason, setBlockReason] = useState('');

//   const navigate = useNavigate();

//   const {
//     drivers,
//     pagination,
//     loading,
//     error,
//     approveDriver,
//     rejectDriver,
//     blockDriver,
//     unblockDriver,
//     deleteDriver,
//   } = useDrivers(page, 20, status, search);

//   const handleApprove = async (driverId) => {
//     if (window.confirm('Are you sure you want to approve this driver?')) {
//       await approveDriver(driverId);
//     }
//   };

//   const handleReject = async () => {
//     if (!rejectReason.trim()) {
//       alert('Please provide a reason for rejection');
//       return;
//     }
//     await rejectDriver(selectedDriver._id, rejectReason);
//     setShowRejectModal(false);
//     setRejectReason('');
//   };

//   const handleBlock = async () => {
//     if (!blockReason.trim()) {
//       alert('Please provide a reason for blocking');
//       return;
//     }
//     await blockDriver(selectedDriver._id, blockReason);
//     setShowBlockModal(false);
//     setBlockReason('');
//   };

//   const handleUnblock = async (driverId) => {
//     if (window.confirm('Are you sure you want to unblock this driver?')) {
//       await unblockDriver(driverId);
//     }
//   };

//   const handleDelete = async (driverId) => {
//     if (window.confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
//       await deleteDriver(driverId);
//     }
//   };

//   if (loading && drivers.length === 0) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold">Drivers Management</h1>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-lg shadow p-4">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <input
//             type="text"
//             placeholder="Search by name, email, or phone..."
//             className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <select
//             className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             value={status}
//             onChange={(e) => setStatus(e.target.value)}
//           >
//             <option value="">All Status</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//             <option value="rejected">Rejected</option>
//           </select>
//         </div>
//       </div>

//       {/* Drivers Table */}
//       <div className="bg-white rounded-lg shadow overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Driver Info
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Contact
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Vehicle
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Rating
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {drivers.map((driver) => {
//                 // Handle rating from your data structure
//                 const rating = driver?.rating?.average 
//                   ? Number(driver.rating.average).toFixed(1)
//                   : 'N/A';

//                 // Get user info (since driver has user reference)
//                 const userName = driver?.user?.name || 'N/A';
//                 const userEmail = driver?.user?.email || 'N/A';
//                 const userPhone = driver?.user?.phone || 'N/A';

//                 // Get vehicle info
//                 const vehicleType = driver?.vehicle?.type || 'N/A';
//                 const vehicleNumber = driver?.vehicle?.number || 'N/A';

//                 return (
//                   <tr key={driver._id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <img
//                           className="h-10 w-10 rounded-full"
//                           src={driver.profileImage || '/default-avatar.png'}
//                           alt={userName}
//                           onError={(e) => {
//                             e.target.src = '/default-avatar.png';
//                           }}
//                         />
//                         <div className="ml-4">
//                           <div className="text-sm font-medium text-gray-900">
//                             {userName}
//                           </div>
//                           <div className="text-sm text-gray-500">
//                             ID: {driver._id.slice(-8)}
//                           </div>
//                         </div>
//                       </div>
//                     </td>

//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900">{userEmail}</div>
//                       <div className="text-sm text-gray-500">{userPhone}</div>
//                     </td>

//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-900 capitalize">
//                         {vehicleType}
//                       </div>
//                       <div className="text-sm text-gray-500">{vehicleNumber}</div>
//                     </td>

//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <StatusBadge status={driver.status} />
//                       {driver.isBlocked && (
//                         <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
//                           Blocked
//                         </span>
//                       )}
//                     </td>

//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <span className="text-yellow-500">★</span>
//                         <span className="ml-1 text-sm text-gray-900">
//                           {rating}
//                         </span>
//                       </div>
//                     </td>

//                     <td className="px-6 py-4 whitespace-nowrap text-sm">
//                       <div className="flex space-x-2">
//                         <button
//                           onClick={() => navigate(`/admin/drivers/${driver._id}`)}
//                           className="text-blue-600 hover:text-blue-900"
//                           title="View Details"
//                         >
//                           <FaEye />
//                         </button>

//                         {(!driver.isApproved || driver.status === 'pending') && (
//                           <>
//                             <button
//                               onClick={() => handleApprove(driver._id)}
//                               className="text-green-600 hover:text-green-900"
//                               title="Approve"
//                             >
//                               <FaCheck />
//                             </button>
//                             <button
//                               onClick={() => {
//                                 setSelectedDriver(driver);
//                                 setShowRejectModal(true);
//                               }}
//                               className="text-red-600 hover:text-red-900"
//                               title="Reject"
//                             >
//                               <FaTimes />
//                             </button>
//                           </>
//                         )}

//                         {driver.isApproved && !driver.isBlocked && (
//                           <button
//                             onClick={() => {
//                               setSelectedDriver(driver);
//                               setShowBlockModal(true);
//                             }}
//                             className="text-orange-600 hover:text-orange-900"
//                             title="Block"
//                           >
//                             <FaBan />
//                           </button>
//                         )}

//                         {driver.isBlocked && (
//                           <button
//                             onClick={() => handleUnblock(driver._id)}
//                             className="text-green-600 hover:text-green-900"
//                             title="Unblock"
//                           >
//                             <FaUnlock />
//                           </button>
//                         )}

//                         <button
//                           onClick={() => handleDelete(driver._id)}
//                           className="text-red-600 hover:text-red-900"
//                           title="Delete"
//                         >
//                           <FaTrash />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
//           <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//             <div>
//               <p className="text-sm text-gray-700">
//                 Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
//                 <span className="font-medium">
//                   {Math.min(page * 20, pagination?.total || 0)}
//                 </span>{' '}
//                 of <span className="font-medium">{pagination?.total || 0}</span> results
//               </p>
//             </div>
//             <div>
//               <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
//                 <button
//                   onClick={() => setPage(page - 1)}
//                   disabled={page === 1}
//                   className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
//                 >
//                   Previous
//                 </button>
//                 {[...Array(pagination?.totalPages || 1)].map((_, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setPage(i + 1)}
//                     className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
//                       page === i + 1
//                         ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
//                         : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
//                     }`}
//                   >
//                     {i + 1}
//                   </button>
//                 ))}
//                 <button
//                   onClick={() => setPage(page + 1)}
//                   disabled={page === pagination?.totalPages}
//                   className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
//                 >
//                   Next
//                 </button>
//               </nav>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Reject Modal */}
//       {showRejectModal && (
//         <Modal
//           title="Reject Driver"
//           onClose={() => {
//             setShowRejectModal(false);
//             setRejectReason('');
//           }}
//         >
//           <div className="space-y-4">
//             <p>
//               Rejecting driver: <strong>{selectedDriver?.user?.name}</strong>
//             </p>
//             <textarea
//               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               rows="4"
//               placeholder="Enter reason for rejection..."
//               value={rejectReason}
//               onChange={(e) => setRejectReason(e.target.value)}
//             />
//             <div className="flex justify-end space-x-2">
//               <button
//                 onClick={() => setShowRejectModal(false)}
//                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleReject}
//                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//               >
//                 Reject
//               </button>
//             </div>
//           </div>
//         </Modal>
//       )}

//       {/* Block Modal */}
//       {showBlockModal && (
//         <Modal
//           title="Block Driver"
//           onClose={() => {
//             setShowBlockModal(false);
//             setBlockReason('');
//           }}
//         >
//           <div className="space-y-4">
//             <p>
//               Blocking driver: <strong>{selectedDriver?.user?.name}</strong>
//             </p>
//             <textarea
//               className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               rows="4"
//               placeholder="Enter reason for blocking..."
//               value={blockReason}
//               onChange={(e) => setBlockReason(e.target.value)}
//             />
//             <div className="flex justify-end space-x-2">
//               <button
//                 onClick={() => setShowBlockModal(false)}
//                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleBlock}
//                 className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
//               >
//                 Block
//               </button>
//             </div>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// };

// export default DriversList;




// src/components/admin/Drivers/DriversList.jsx
import React, { useState } from 'react';
import { useDrivers } from '../../hooks/useAdmin';
import { FaCheck, FaTimes, FaBan, FaUnlock, FaTrash, FaEye } from 'react-icons/fa';
import Modal from '../components/common/Modal';

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'offline':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {status || 'N/A'}
    </span>
  );
};

const DriversList = ({ onViewDriver }) => {  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);
const [viewDriver, setViewDriver] = useState(null);

  // ❌ REMOVE useNavigate - not needed for state-based navigation
  // const navigate = useNavigate();

  const {
    drivers,
    pagination,
    loading,
    error,
    approveDriver,
    rejectDriver,
    blockDriver,
    unblockDriver,
    deleteDriver,
  } = useDrivers(page, 20, status, search);

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

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Drivers Management</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="offline">Offline</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Driver Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => {
                // Handle rating from your data structure
                const rating = driver?.rating?.average 
                  ? Number(driver.rating.average).toFixed(1)
                  : 'N/A';

                // Get vehicle info
                const vehicleType = driver?.vehicle?.type || 'N/A';
                const vehicleNumber = driver?.vehicle?.number || 'N/A';

                return (
                  <tr key={driver._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-xl font-bold text-white">
                              {vehicleType.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Driver ID
                          </div>
                          <div className="text-sm text-gray-500">
                            {driver._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">
                        {vehicleType}
                      </div>
                      <div className="text-sm text-gray-500">{vehicleNumber}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={driver.status} />
                      {driver.isBlocked && (
                        <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Blocked
                        </span>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {driver.isOnline ? '🟢 Online' : '⚫ Offline'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-sm text-gray-900">
                          {rating}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.rating?.count || 0} reviews
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {driver.stats?.totalTrips || 0} trips
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{driver.stats?.totalEarnings || 0} earned
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {/* ✅ FIXED VIEW BUTTON - Use onViewDriver prop instead of navigate */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            if (onViewDriver) {
                              onViewDriver(driver._id);
                            } else {
                              console.error('onViewDriver prop not provided');
                            }
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
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * 20, pagination?.total || 0)}
                </span>{' '}
                of <span className="font-medium">{pagination?.total || 0}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {page} of {pagination?.totalPages || 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination?.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <Modal
          title="Reject Driver"
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
        >
          <div className="space-y-4">
            <p>
              Rejecting driver: <strong>ID {selectedDriver?._id?.slice(-8)}</strong>
            </p>
            <textarea
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <Modal
          title="Block Driver"
          onClose={() => {
            setShowBlockModal(false);
            setBlockReason('');
          }}
        >
          <div className="space-y-4">
            <p>
              Blocking driver: <strong>ID {selectedDriver?._id?.slice(-8)}</strong>
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



      {showViewModal && viewDriver && (
  <Modal
    title={`Driver Details - ${viewDriver._id.slice(-8)}`}
    onClose={() => setShowViewModal(false)}
  >
    <div className="space-y-2">
      <p><strong>Name:</strong> {viewDriver.name || 'N/A'}</p>
      <p><strong>Email:</strong> {viewDriver.email || 'N/A'}</p>
      <p><strong>Phone:</strong> {viewDriver.phone || 'N/A'}</p>
      <p><strong>Status:</strong> {viewDriver.status}</p>
      <p><strong>Vehicle:</strong> {viewDriver.vehicle?.type} - {viewDriver.vehicle?.number}</p>
      <p><strong>Total Trips:</strong> {viewDriver.stats?.totalTrips || 0}</p>
      <p><strong>Total Earnings:</strong> ₹{viewDriver.stats?.totalEarnings || 0}</p>
    </div>
  </Modal>
)}
    </div>
  );
};

export default DriversList;