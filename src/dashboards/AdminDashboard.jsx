import React, { useState } from 'react';
import Header from '../components/Header';
import AdminTab from '../tabs/AdminTab';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-orange-50">
      <Header user={user} onLogout={logout} />
      <AdminTab />
    </div>
  );
};

export default AdminDashboard;
