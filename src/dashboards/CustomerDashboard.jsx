import React, { useState } from 'react';
import Header from '../components/Header';
import SideMenu from '../components/SideMenu';
// import TabNavigation from '../components/TabNavigation';
import CustomerTab from '../tabs/CustomerTab';
import TrackingTab from '../tabs/TrackingTab';
import BookingModal from '../components/BookingModal';
import { useBooking } from '../hooks/useBooking';
import { useProviders } from '../hooks/useProviders';
import { SERVICES } from '../utils/constants';
import { calculateFare } from '../utils/fareCalculator';
import { useAuth } from '../context/AuthContext';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('customer');
  const [selectedService, setSelectedService] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [walletBalance] = useState(500);

  const { bookings, tracking, createBooking, startTracking } = useBooking();
  const { providers } = useProviders();

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setShowBooking(true);
  };

  const handleBooking = (provider) => {
    const fare = calculateFare(selectedService);
    const booking = createBooking(selectedService, provider, fare);

    setShowBooking(false);
    setNotifications(n => n + 1);

    alert(`Booking Confirmed 🚜\nFare: ₹${fare}`);
    setActiveTab('tracking');
  };

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

      {/* <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} /> */}

      <div className="container mx-auto px-4 py-6">
        {activeTab === 'customer' && (
          <CustomerTab
            services={SERVICES}
            bookings={bookings}
            onServiceSelect={handleServiceSelect}
            onTrackBooking={(b) => {
              startTracking(b);
              setActiveTab('tracking');
            }}
          />
        )}

        {activeTab === 'tracking' && (
          <TrackingTab tracking={tracking} onBackToBooking={() => setActiveTab('customer')} />
        )}
      </div>

      {showBooking && (
        <BookingModal
          selectedService={selectedService}
          providers={providers}
          onClose={() => setShowBooking(false)}
          onBook={handleBooking}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;


