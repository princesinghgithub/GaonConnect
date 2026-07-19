// import React, { useState } from 'react';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import LoginForm from './components/auth/LoginForm';
// import RegisterForm from './components/auth/RegisterForm';
// import Header from './components/Header';
// import SideMenu from './components/SideMenu';
// import TabNavigation from './components/TabNavigation';
// import CustomerTab from './tabs/CustomerTab';
// import TrackingTab from './tabs/TrackingTab';
// import ProviderTab from './tabs/ProviderTab';
// import AdminTab from './tabs/AdminTab';
// import BookingModal from './components/BookingModal';
// import { useBooking } from './hooks/useBooking';
// import { useProviders } from './hooks/useProviders';
// import { SERVICES } from './utils/constants';
// import { calculateFare } from './utils/fareCalculator';

// const MainApp = () => {
//   const { user, isAuthenticated, login, logout } = useAuth();
//   const [showAuthScreen, setShowAuthScreen] = useState('login'); // 'login' or 'register'
//   const [activeTab, setActiveTab] = useState('customer');
//   const [selectedService, setSelectedService] = useState(null);
//   const [showBooking, setShowBooking] = useState(false);
//   const [showMenu, setShowMenu] = useState(false);
//   const [notifications, setNotifications] = useState(3);
//   const [walletBalance, setWalletBalance] = useState(500);

//   const { bookings, tracking, createBooking, startTracking } = useBooking();
//   const { providers } = useProviders();

//   // If not authenticated, show auth screens
//   if (!isAuthenticated) {
//     if (showAuthScreen === 'login') {
//       return (
//         <LoginForm
//           onSwitchToRegister={() => setShowAuthScreen('register')}
//           onLoginSuccess={login}
//         />
//       );
//     } else {
//       return (
//         <RegisterForm
//           onSwitchToLogin={() => setShowAuthScreen('login')}
//           onRegisterSuccess={login}
//         />
//       );
//     }
//   }

//   // Handlers
//   const handleServiceSelect = (service) => {
//     setSelectedService(service);
//     setShowBooking(true);
//   };

//   const handleBooking = (provider) => {
//     const fare = calculateFare(selectedService);
//     const booking = createBooking(selectedService, provider, fare);
    
//     setShowBooking(false);
//     setNotifications(prev => prev + 1);
    
//     alert(`✅ Booking Confirmed!\n\nDriver: ${provider.name}\nVehicle: ${provider.vehicle}\nFare: ₹${fare}\nTracking ID: ${booking.trackingId}\n\nDriver aa raha hai...`);
    
//     setTimeout(() => {
//       setActiveTab('tracking');
//     }, 1000);
//   };

//   const handleTrackBooking = (booking) => {
//     startTracking(booking);
//     setActiveTab('tracking');
//   };

//   const handleBackToBooking = () => {
//     setActiveTab('customer');
//   };

//   const handleLogout = () => {
//     if (window.confirm('Are you sure you want to logout?')) {
//       logout();
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
//       <Header
//         notifications={notifications}
//         walletBalance={walletBalance}
//         showMenu={showMenu}
//         setShowMenu={setShowMenu}
//         user={user}
//         onLogout={handleLogout}
//       />

//       <SideMenu 
//         showMenu={showMenu} 
//         setShowMenu={setShowMenu}
//         user={user}
//         onLogout={handleLogout}
//       />

//       <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

//       <div className="container mx-auto px-4 py-6">
//         {activeTab === 'customer' && (
//           <CustomerTab
//             services={SERVICES}
//             bookings={bookings}
//             onServiceSelect={handleServiceSelect}
//             onTrackBooking={handleTrackBooking}
//           />
//         )}

//         {activeTab === 'tracking' && (
//           <TrackingTab
//             tracking={tracking}
//             onBackToBooking={handleBackToBooking}
//           />
//         )}

//         {activeTab === 'provider' && <ProviderTab />}

//         {activeTab === 'admin' && <AdminTab />}
//       </div>

//       {showBooking && (
//         <BookingModal
//           selectedService={selectedService}
//           providers={providers}
//           onClose={() => setShowBooking(false)}
//           onBook={handleBooking}
//         />
//       )}
//     </div>
//   );
// };

// function App() {
//   return (
//     <AuthProvider>
//       <MainApp />
//     </AuthProvider>
//   );
// }

// export default App;
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SeoCanonical from './components/SeoCanonical';
import NotFound from './components/pages/NotFound';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

import CustomerDashboard from './dashboards/CustomerDashboard';
import ProviderDashboard from './dashboards/ProviderDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

import ProtectedRoute from './context/ProtectedRoute';
import { RideProvider } from './context/RideContext';
import { DriverProvider } from './context/Drivercontext';
import BookRide from './tabs/BookRide';
import RideTracking from './components/RideTracking';
import GaonConnectLanding from './GaonConnect/Gaonconnectlanding'
import WhatsAppFloat from "./components/pages/WhatsAppFloat";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";
import AccountDeletion from "./components/pages/AccountDeletion";
import DataDeletion from "./components/pages/DataDeletion";
import Safety from "./components/pages/Safety";
import Careers from "./components/pages/Careers";
import Blog from "./components/pages/Blog";
import Press from "./components/pages/Press";
import ContactUs from "./components/pages/ContactUs";

const AuthScreens = () => {
  const { login } = useAuth();
  const [screen, setScreen] = React.useState('login');

  return screen === 'login' ? (
    <LoginForm
      onSwitchToRegister={() => setScreen('register')}
      onLoginSuccess={login}
    />
  ) : (
    <RegisterForm
      onSwitchToLogin={() => setScreen('login')}
      onRegisterSuccess={login}
    />
  );
};

function App() {
  return (
  //   <AuthProvider>
  //     <RideProvider>
  //         <DriverProvider>

  //       <Routes>
  //         {/* PUBLIC */}
  //         <Route path="/" element={<AuthScreens />} />

  //         {/* CUSTOMER */}
  //         <Route
  //           path="/customer"
  //           element={
  //             <ProtectedRoute allowedRoles={['customer']}>
  //               <CustomerDashboard />
  //             </ProtectedRoute>
  //           }
  //         />

  //         {/* PROVIDER / DRIVER */}
  //         <Route
  //           path="/driver"
  //           element={
  //             <ProtectedRoute allowedRoles={['provider']}>
  //               <ProviderDashboard />
  //             </ProtectedRoute>
  //           }
  //         />

  //         {/* ADMIN */}
  //         <Route
  //           path="/admin"
  //           element={
  //             <ProtectedRoute allowedRoles={['admin']}>
  //               <AdminDashboard />
  //             </ProtectedRoute>
  //           }
  //         />

  //           <Route path="/book-ride" element={<BookRide />} />
  //           <Route 
  //   path="/ride/:rideId" 
  //   element={
  //     <ProtectedRoute allowedRoles={['customer', 'user']}>
  //       <RideTracking />
  //     </ProtectedRoute>
  //   } 

  // />
  
  //       </Routes>
  //       </DriverProvider>
  //     </RideProvider>
  //   </AuthProvider>


  <AuthProvider>
      <RideProvider>
        <DriverProvider>
          <SeoCanonical />
          <Routes>
            {/* LANDING PAGE - First thing users see */}
            <Route path="/" element={<GaonConnectLanding />} />

            {/* AUTH PAGE - Opens when user selects a service */}
            <Route path="/auth" element={<AuthScreens />} />
            <Route path="/register" element={<Navigate to="/auth" replace />} />

            {/* CUSTOMER */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* PROVIDER / DRIVER */}
            <Route
              path="/driver"
              element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderDashboard />
                </ProtectedRoute>
              }
            />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* BOOK RIDE - Protected route after auth */}
            <Route
              path="/book-ride"
              element={
                <ProtectedRoute allowedRoles={['customer', 'user']}>
                  <BookRide />
                </ProtectedRoute>
              }
            />

            {/* RIDE TRACKING */}
            <Route
              path="/ride/:rideId"
              element={
                <ProtectedRoute allowedRoles={['customer', 'user']}>
                  <RideTracking />
                </ProtectedRoute>
              }
            />

            {/* PRIVACY POLICY - Public page for Play Store */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* ACCOUNT / DATA DELETION - Public pages for Play Store */}
            <Route path="/account-deletion" element={<AccountDeletion />} />
            <Route path="/data-deletion" element={<DataDeletion />} />

            {/* MARKETING PAGES */}
            <Route path="/safety" element={<Safety />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/press" element={<Press />} />
            <Route path="/contact" element={<ContactUs />} />

            {/* CATCH-ALL - avoids serving a blank 200 page for dead/unknown links */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DriverProvider>
          <WhatsAppFloat /> 
      </RideProvider>
     
    </AuthProvider>
  );
}

export default App;
