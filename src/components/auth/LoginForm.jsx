// import React, { useState } from 'react';
// import { Phone, ArrowRight, Lock } from 'lucide-react';

// const LoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
//   const [phone, setPhone] = useState('');
//   const [showOTP, setShowOTP] = useState(false);
//   const [otp, setOtp] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSendOTP = (e) => {
//     e.preventDefault();
    
//     // Validation
//     if (phone.length !== 10) {
//       alert('Please enter valid 10-digit phone number');
//       return;
//     }

//     setLoading(true);
    
//     // Simulate API call
//     setTimeout(() => {
//       setShowOTP(true);
//       setLoading(false);
//       alert('OTP sent to your phone: 123456 (Demo)');
//     }, 1000);
//   };

//   const handleVerifyOTP = (e) => {
//     e.preventDefault();
    
//     if (otp.length !== 6) {
//       alert('Please enter 6-digit OTP');
//       return;
//     }

//     setLoading(true);
    
//     // Simulate API call
//     setTimeout(() => {
//       // Demo verification
//       if (otp === '123456') {
//         const userData = {
//           phone: phone,
//           name: 'Demo User',
//           role: 'customer'
//         };
//         localStorage.setItem('user', JSON.stringify(userData));
//         onLoginSuccess(userData);
//         alert('Login Successful! 🎉');
//       } else {
//         alert('Invalid OTP. Try: 123456');
//       }
//       setLoading(false);
//     }, 1000);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <div className="text-6xl mb-4">🚜</div>
//           <h1 className="text-3xl font-bold text-gray-800">GaonConnect</h1>
//           <p className="text-gray-600 mt-2">आपकी गाड़ी आपकी सेवा</p>
//         </div>

//         {!showOTP ? (
//           // Phone Number Form
//           <form onSubmit={handleSendOTP}>
//             <div className="mb-6">
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Mobile Number
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Phone className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="tel"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
//                   placeholder="Enter 10-digit number"
//                   className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
//                   maxLength="10"
//                   required
//                 />
//               </div>
//               <p className="text-xs text-gray-500 mt-2">
//                 We'll send you an OTP to verify your number
//               </p>
//             </div>

//             <button
//               type="submit"
//               disabled={loading || phone.length !== 10}
//               className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               {loading ? 'Sending OTP...' : 'Send OTP'}
//               <ArrowRight size={20} />
//             </button>
//           </form>
//         ) : (
//           // OTP Verification Form
//           <form onSubmit={handleVerifyOTP}>
//             <div className="mb-6">
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Enter OTP
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                   <Lock className="h-5 w-5 text-gray-400" />
//                 </div>
//                 <input
//                   type="text"
//                   value={otp}
//                   onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                   placeholder="Enter 6-digit OTP"
//                   className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-center text-2xl tracking-widest font-bold"
//                   maxLength="6"
//                   required
//                 />
//               </div>
//               <p className="text-xs text-gray-500 mt-2">
//                 OTP sent to +91 {phone}
//               </p>
//               <button
//                 type="button"
//                 onClick={() => setShowOTP(false)}
//                 className="text-sm text-orange-600 hover:underline mt-2"
//               >
//                 Change number
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={loading || otp.length !== 6}
//               className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? 'Verifying...' : 'Verify & Login'}
//             </button>

//             <button
//               type="button"
//               onClick={handleSendOTP}
//               className="w-full mt-3 text-orange-600 font-semibold hover:underline"
//             >
//               Resend OTP
//             </button>
//           </form>
//         )}

//         {/* Register Link */}
//         <div className="mt-6 text-center">
//           <p className="text-gray-600">
//             Don't have an account?{' '}
//             <button
//               onClick={onSwitchToRegister}
//               className="text-orange-600 font-bold hover:underline"
//             >
//               Register Now
//             </button>
//           </p>
//         </div>

//         {/* Demo Info */}
//         <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
//           <p className="text-sm text-blue-800 font-semibold mb-2">🎯 Demo Mode:</p>
//           <p className="text-xs text-blue-700">
//             • Enter any 10-digit number<br/>
//             • Use OTP: <span className="font-bold">123456</span>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginForm;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { authAPI } from '../../services/api';

const LoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* =====================
     SEND OTP
  ====================== */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Valid email address enter karo');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.sendOTP(email);
      const receivedOTP = res.data.otp;
      if (receivedOTP) alert(`Your OTP is: ${receivedOTP}`);
      setShowOTP(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     VERIFY OTP
  ====================== */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const res = await authAPI.verifyOTP(email, otp);
      const data = res?.data;

      if (!data?.success) {
        setError(data?.message || 'Invalid OTP');
        return;
      }

      onLoginSuccess(data.user, data.accessToken, data.refreshToken);

      const role = data.user.role;
      if (role === 'customer') navigate('/customer');
      else if (role === 'provider') navigate('/driver');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚜</div>
          <h1 className="text-3xl font-bold">GaonConnect</h1>
          <p className="text-gray-600">आपकी गाड़ी आपकी सेवा</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Email / OTP */}
        {!showOTP ? (
          <form onSubmit={handleSendOTP}>
            <label className="text-sm font-semibold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 px-4 py-3 border rounded-lg"
              placeholder="your@email.com"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-orange-600 text-white py-3 rounded-lg flex justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send OTP'}
              <ArrowRight />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <p className="text-sm text-gray-500 mb-3">OTP sent to {email}</p>
            <label className="text-sm font-semibold">Enter OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full mt-2 px-4 py-3 border rounded-lg text-center text-xl tracking-widest"
              placeholder="******"
              maxLength="6"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-orange-600 text-white py-3 rounded-lg"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => setShowOTP(false)}
              className="mt-3 w-full text-orange-600 text-sm font-semibold hover:underline"
            >
              Change Email
            </button>
          </form>
        )}

        {/* Switch */}
        <p className="text-center mt-6">
          No account?{' '}
          <button onClick={onSwitchToRegister} className="text-orange-600 font-bold">
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
