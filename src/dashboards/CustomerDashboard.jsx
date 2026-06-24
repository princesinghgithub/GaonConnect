import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import BookRide from '../tabs/BookRide';
import CustomerHistoryTab from '../tabs/CustomerHistoryTab';
import { useAuth } from '../context/AuthContext';
import { walletAPI, notificationAPI } from '../services/api';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('booking');
  const [showMenu, setShowMenu] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    walletAPI.getBalance()
      .then((res) => setWalletBalance(res.data?.data?.balance ?? 0))
      .catch(() => setWalletBalance(0));

    notificationAPI.getUnreadCount()
      .then((res) => setNotifications(res.data?.data?.count ?? 0))
      .catch(() => setNotifications(0));
  }, []);

  return (
    <div className="min-h-screen bg-orange-50">
      <Header
        notifications={notifications}
        walletBalance={walletBalance}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        user={user}
        onLogout={logout}
      />

      <SideMenu showMenu={showMenu} setShowMenu={setShowMenu} user={user} />

      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 flex">
          {[
            { id: 'booking', label: 'Book a Ride' },
            { id: 'history', label: 'Ride History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {activeTab === 'booking' ? <BookRide /> : <CustomerHistoryTab />}
      </div>
    </div>
  );
};

export default CustomerDashboard;
