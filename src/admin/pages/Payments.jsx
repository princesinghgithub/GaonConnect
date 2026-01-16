// src/components/admin/Payments/PaymentsList.jsx
import React, { useState } from 'react';
import { usePayments } from '../../hooks/useAdmin';
import { toast } from 'react-hot-toast';
import { FaDownload, FaMoneyBillWave, FaCreditCard, FaCheckCircle } from 'react-icons/fa';

const PaymentsList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    startDate: '',
    endDate: '',
  });

  const { payments, pagination, stats, loading, error } = usePayments(page, 20, filters);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const exportPayments = async () => {
    try {
      const response = await adminAPI.exportReport(
        'payments',
        filters.startDate,
        filters.endDate
      );
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export payments');
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments Management</h1>
        <button
          onClick={exportPayments}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FaDownload />
          <span>Export</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            icon={<FaMoneyBillWave />}
            title="Total Amount"
            value={`₹${stats.totalAmount?.toFixed(2) || 0}`}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<FaCreditCard />}
            title="Total Transactions"
            value={stats.totalTransactions || 0}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<FaCheckCircle />}
            title="Successful"
            value={stats.successfulPayments || 0}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={<FaMoneyBillWave />}
            title="Commission"
            value={`₹${stats.totalCommission?.toFixed(2) || 0}`}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.method}
            onChange={(e) => handleFilterChange('method', e.target.value)}
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="wallet">Wallet</option>
          </select>

          <input
            type="date"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />

          <input
            type="date"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />

          <button
            onClick={() => {
              setFilters({ status: '', method: '', startDate: '', endDate: '' });
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ride ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.ride?._id?.slice(-8) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.user?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payment.driver?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ₹{payment.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                    ₹{payment.commission || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentMethodBadge method={payment.paymentMethod} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
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
    </div>
  );
};

const StatCard = ({ icon, title, value, color, bgColor }) => {
  return (
    <div className={`${bgColor} rounded-lg shadow p-6`}>
      <div className="flex items-center space-x-4">
        <div className={`${color} text-3xl`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
};

const PaymentMethodBadge = ({ method }) => {
  const getMethodColor = (method) => {
    switch (method) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'online':
        return 'bg-blue-100 text-blue-800';
      case 'wallet':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${getMethodColor(method)}`}
    >
      {method || 'N/A'}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}
    >
      {status}
    </span>
  );
};

export default PaymentsList;