import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
import BookRide from '../tabs/BookRide';
import CustomerHistoryTab from '../tabs/CustomerHistoryTab';
import { useAuth } from '../context/AuthContext';
import { walletAPI, notificationAPI, rideAPI } from '../services/api';

const STATUS_TEXT = {
  searching: 'Driver dhundh rahe hain',
  accepted:  'Driver aa raha hai',
  arrived:   'Driver pahunch gaya',
  started:   'Safar chal raha hai',
  working:   'Kaam chal raha hai',
};

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Chal rahi ride — Rapido jaisa upar patti, ek tap mein tracking
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    rideAPI.getCurrentRideCustomer()
      .then((res) => setActiveRide(res.data?.data || null))
      .catch(() => setActiveRide(null));
  }, []);

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
            { id: 'booking', label: 'Booking karein' },
            { id: 'history', label: 'Meri rides' },
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

      {activeRide?._id && (
        <button
          onClick={() => navigate(`/ride/${activeRide._id}`)}
          className="block w-full bg-gray-900 text-left text-white"
        >
          <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-3 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-green-400" />
              <span className="truncate font-semibold">
                {STATUS_TEXT[activeRide.status] || 'Aapki ride chal rahi hai'}
                <span className="font-normal text-white/60"> · {activeRide.pickup?.address}</span>
              </span>
            </span>
            <span className="shrink-0 font-bold text-orange-400">Track karein →</span>
          </div>
        </button>
      )}

      <div className="container mx-auto px-4 py-6">
        {activeTab === 'booking' ? <BookRide /> : <CustomerHistoryTab />}
      </div>
    </div>
  );
};

export default CustomerDashboard;
