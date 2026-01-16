import React, { useState } from 'react';

import Header from '../components/Header';
import ProviderTab from '../tabs/ProviderTab';
import { useAuth } from '../context/AuthContext';

const ProviderDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-orange-50">
      <Header user={user} onLogout={logout} />
      <ProviderTab />
    </div>
  );
};

export default ProviderDashboard;
