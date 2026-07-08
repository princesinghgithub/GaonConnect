// import React, { useState } from 'react';
// import { User, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

// const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     phone: '',
//     email: '',
//     city: '',
//     role: 'customer'
//   });
//   const [showOTP, setShowOTP] = useState(false);
//   const [otp, setOtp] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleRegister = (e) => {
//     e.preventDefault();

//     // Validation
//     if (!formData.name || formData.phone.length !== 10) {
//       alert('Please fill all required fields correctly');
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
//       if (otp === '123456') {
//         const userData = {
//           ...formData,
//           id: Date.now(),
//           wallet: 0
//         };
//         localStorage.setItem('user', JSON.stringify(userData));
//         onRegisterSuccess(userData);
//         alert('Registration Successful! 🎉');
//       } else {
//         alert('Invalid OTP. Try: 123456');
//       }
//       setLoading(false);
//     }, 1000);
//   };

//   if (showOTP) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
//           <div className="text-center mb-8">
//             <div className="text-6xl mb-4">🚜</div>
//             <h2 className="text-2xl font-bold text-gray-800">Verify OTP</h2>
//           </div>

//           <form onSubmit={handleVerifyOTP}>
//             <div className="mb-6">
//               <input
//                 type="text"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                 placeholder="Enter 6-digit OTP"
//                 className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-center text-2xl tracking-widest font-bold"
//                 maxLength="6"
//                 required
//               />
//               <p className="text-xs text-gray-500 mt-2 text-center">
//                 OTP sent to +91 {formData.phone}
//               </p>
//             </div>

//             <button
//               type="submit"
//               disabled={loading || otp.length !== 6}
//               className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
//             >
//               {loading ? 'Verifying...' : 'Verify & Register'}
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <div className="text-6xl mb-4">🚜</div>
//           <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
//           <p className="text-gray-600 mt-2">Join GaonConnect today!</p>
//         </div>

//         <form onSubmit={handleRegister} className="space-y-4">
//           {/* Name */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Full Name *
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <User className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 placeholder="Enter your full name"
//                 className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
//                 required
//               />
//             </div>
//           </div>

//           {/* Phone */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Mobile Number *
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Phone className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="tel"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={(e) => setFormData({
//                   ...formData,
//                   phone: e.target.value.replace(/\D/g, '').slice(0, 10)
//                 })}
//                 placeholder="10-digit mobile number"
//                 className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
//                 maxLength="10"
//                 required
//               />
//             </div>
//           </div>

//           {/* Email */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Email (Optional)
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Mail className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="your@email.com"
//                 className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
//               />
//             </div>
//           </div>

//           {/* City */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               City/Village
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <MapPin className="h-5 w-5 text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 name="city"
//                 value={formData.city}
//                 onChange={handleChange}
//                 placeholder="Enter your city"
//                 className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
//               />
//             </div>
//           </div>

//           {/* Role Selection */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Register As
//             </label>
//             <div className="grid grid-cols-2 gap-3">
//               <button
//                 type="button"
//                 onClick={() => setFormData({ ...formData, role: 'customer' })}
//                 className={`py-3 rounded-lg font-semibold transition ${
//                   formData.role === 'customer'
//                     ? 'bg-orange-600 text-white'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 🎯 Customer
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setFormData({ ...formData, role: 'provider' })}
//                 className={`py-3 rounded-lg font-semibold transition ${
//                   formData.role === 'provider'
//                     ? 'bg-orange-600 text-white'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 🚗 Driver
//               </button>
//             </div>
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
//           >
//             {loading ? 'Processing...' : 'Continue'}
//             <ArrowRight size={20} />
//           </button>
//         </form>

//         {/* Login Link */}
//         <div className="mt-6 text-center">
//           <p className="text-gray-600">
//             Already have an account?{' '}
//             <button
//               onClick={onSwitchToLogin}
//               className="text-orange-600 font-bold hover:underline"
//             >
//               Login
//             </button>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RegisterForm;








import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    role: 'customer',
  });

  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* =====================
        REGISTER → SEND OTP
  ====================== */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || formData.phone.length !== 10 || !formData.email) {
      setError('Please fill all required fields correctly');
      return;
    }

    try {
      setLoading(true);
      await authAPI.register(formData);
      const res = await authAPI.sendOTP(formData.email);
      const receivedOTP = res?.data?.otp;
      if (receivedOTP) alert(`Your OTP is: ${receivedOTP}`);
      setShowOTP(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  /* =====================
        VERIFY OTP API
  ====================== */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter valid 6 digit OTP');
      return;
    }

    try {
      setLoading(true);

      const res = await authAPI.verifyOTP(formData.email, otp, { role: formData.role });

      const data = res?.data;

      if (!data?.success) {
        setError(data?.message || "Invalid OTP");
        return;
      }

      const role = data.user.role;

      // ⭐ AuthContext.login() stores the token/user and updates auth state
      if (onRegisterSuccess) {
        onRegisterSuccess(data.user, data.accessToken, data.refreshToken);
      }

      // ⭐ REDIRECT BASED ON ROLE
      if (role === "customer") {
        navigate("/customer");
      } else if (role === "provider") {
        navigate("/driver");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

    } catch (err) {
      console.error("👉 OTP ERROR:", err);
      setError(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
        OTP SCREEN
  ====================== */
  if (showOTP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

          {error && (
            <div className="mb-3 text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚜</div>
            <h2 className="text-2xl font-bold text-gray-800">Verify OTP</h2>
            <p className="text-sm text-gray-500 mt-1">OTP sent to {formData.email}</p>
          </div>

          <form onSubmit={handleVerifyOTP}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-center text-2xl tracking-widest font-bold"
              maxLength="6"
              required
            />

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="mt-6 w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setShowOTP(false)}
              className="mt-3 w-full text-orange-600 font-semibold text-sm hover:underline"
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* =====================
        REGISTER SCREEN
  ====================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚜</div>
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Join GaonConnect today!</p>
        </div>

        {error && (
          <div className="mb-3 text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mobile Number *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value.replace(/\D/g, '').slice(0, 10)
                  })
                }
                placeholder="10-digit mobile number"
                className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                maxLength="10"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City/Village
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter your city"
                className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Register As
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'customer' })}
                className={`py-3 rounded-lg font-semibold transition ${
                  formData.role === 'customer'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎯 Customer
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'provider' })}
                className={`py-3 rounded-lg font-semibold transition ${
                  formData.role === 'provider'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🚗 Driver
              </button>
            </div>
          </div>

          {formData.role === 'provider' && (
            <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              Vehicle details aur documents aap apne Driver Portal mein complete kar sakte hain.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : 'Continue'}
            <ArrowRight size={20} />
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-orange-600 font-bold hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;


// import React, { useState } from 'react';
// import { ArrowRight } from 'lucide-react';
// import { authAPI } from '../../services/api';

// const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     phone: '',
//     email: '',
//     city: '',
//     role: 'customer',
//   });

//   const [showOTP, setShowOTP] = useState(false);
//   const [otp, setOtp] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   /* ================= INPUT ================= */
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   /* ================= REGISTER ================= */
//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (!formData.name || formData.phone.length !== 10) {
//       setError('Please enter valid name & phone number');
//       return;
//     }

//     try {
//       setLoading(true);
//       await authAPI.register(formData);
//       setShowOTP(true);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= VERIFY OTP ================= */
//   const handleVerifyOTP = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (otp.length !== 6) {
//       setError('Enter valid 6-digit OTP');
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await authAPI.verifyOTP(formData.phone, otp);

//       /**
//        * Expected:
//        * {
//        *   success: true,
//        *   token: "...",
//        *   user: {...}
//        * }
//        */

//       onRegisterSuccess(res.data.user, res.data.token);

//     } catch (err) {
//       setError(err.response?.data?.message || 'OTP verification failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= OTP SCREEN ================= */
//   if (showOTP) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

//           <h2 className="text-2xl font-bold text-center mb-4">Verify OTP</h2>

//           {error && (
//             <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleVerifyOTP}>
//             <input
//               value={otp}
//               onChange={(e) =>
//                 setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
//               }
//               placeholder="Enter OTP"
//               className="w-full border rounded-lg px-4 py-3 text-center text-2xl tracking-widest"
//             />

//             <button
//               disabled={loading}
//               className="mt-4 w-full bg-orange-600 text-white py-3 rounded-lg font-bold"
//             >
//               {loading ? 'Verifying...' : 'Verify & Continue'}
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   /* ================= REGISTER SCREEN ================= */
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
//       <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

//         <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>

//         {error && (
//           <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleRegister} className="space-y-4">

//           <div className="grid grid-cols-2 gap-4">
//             <input
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="Full Name"
//               className="border rounded-lg px-4 py-3"
//             />

//             <input
//               value={formData.phone}
//               onChange={(e) =>
//                 setFormData({
//                   ...formData,
//                   phone: e.target.value.replace(/\D/g, '').slice(0, 10),
//                 })
//               }
//               placeholder="Mobile Number"
//               className="border rounded-lg px-4 py-3"
//             />

//             <input
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="Email (optional)"
//               className="border rounded-lg px-4 py-3"
//             />

//             <input
//               name="city"
//               value={formData.city}
//               onChange={handleChange}
//               placeholder="City / Village"
//               className="border rounded-lg px-4 py-3"
//             />
//           </div>

//           {/* ROLE */}
//           <div className="grid grid-cols-2 gap-3">
//             {['customer', 'provider'].map((role) => (
//               <button
//                 key={role}
//                 type="button"
//                 onClick={() => setFormData({ ...formData, role })}
//                 className={`py-3 rounded-lg font-semibold ${
//                   formData.role === role
//                     ? 'bg-orange-600 text-white'
//                     : 'bg-gray-100'
//                 }`}
//               >
//                 {role === 'customer' ? '🎯 Customer' : '🚗 Driver'}
//               </button>
//             ))}
//           </div>

//           <button
//             disabled={loading}
//             className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold flex justify-center gap-2"
//           >
//             Continue <ArrowRight size={18} />
//           </button>
//         </form>

//         <p className="text-center mt-4 text-sm">
//           Already have an account?{' '}
//           <button
//             onClick={onSwitchToLogin}
//             className="text-orange-600 font-bold"
//           >
//             Login
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default RegisterForm;



// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { ArrowRight } from 'lucide-react';
// import { authAPI } from '../../services/api';

// const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: '',
//     phone: '',
//     role: 'customer', // customer / provider
//     vehicleType: '',
//     vehicleNumber: ''
//   });
//   const [otp, setOtp] = useState('');
//   const [showOTP, setShowOTP] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   /* =====================
//      SEND OTP
//   ====================== */
//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (formData.phone.length !== 10) {
//       setError('Enter valid 10-digit mobile number');
//       return;
//     }

//     if (formData.role === 'provider' && !formData.vehicleType) {
//       setError('Vehicle type is required for providers');
//       return;
//     }

//     try {
//       setLoading(true);
//       await authAPI.sendOTP(formData.phone);
//       setShowOTP(true);
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to send OTP');
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* =====================
//      VERIFY OTP & REGISTER
//   ====================== */
//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setError('');

//     if (otp.length !== 6) {
//       setError('Enter valid 6-digit OTP');
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await authAPI.register({
//         ...formData,
//         otp
//       });

//       // Update auth context
//       onRegisterSuccess(res.data.user, res.data.token);

//       // Navigate based on role
//       const userRole = res.data.user.role;
      
//       if (userRole === 'customer') {
//         navigate('/customer');
//       } else if (userRole === 'provider') {
//         navigate('/driver');
//       } else if (userRole === 'admin') {
//         navigate('/admin');
//       } else {
//         navigate('/');
//       }

//     } catch (err) {
//       setError(err.response?.data?.message || 'Registration failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="text-6xl mb-4">🚜</div>
//           <h1 className="text-3xl font-bold">Register</h1>
//           <p className="text-gray-600">Create your account</p>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
//             {error}
//           </div>
//         )}

//         {!showOTP ? (
//           <form onSubmit={handleSendOTP} className="space-y-4">
//             {/* Name */}
//             <div>
//               <label className="text-sm font-semibold">Full Name</label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="w-full mt-2 px-4 py-3 border rounded-lg"
//                 placeholder="Enter your name"
//                 required
//               />
//             </div>

//             {/* Phone */}
//             <div>
//               <label className="text-sm font-semibold">Mobile Number</label>
//               <input
//                 type="tel"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={(e) =>
//                   setFormData({
//                     ...formData,
//                     phone: e.target.value.replace(/\D/g, '').slice(0, 10)
//                   })
//                 }
//                 className="w-full mt-2 px-4 py-3 border rounded-lg"
//                 placeholder="10-digit mobile"
//                 required
//               />
//             </div>

//             {/* Role */}
//             <div>
//               <label className="text-sm font-semibold">Register As</label>
//               <select
//                 name="role"
//                 value={formData.role}
//                 onChange={handleChange}
//                 className="w-full mt-2 px-4 py-3 border rounded-lg"
//               >
//                 <option value="customer">Customer</option>
//                 <option value="provider">Vehicle Provider</option>
//               </select>
//             </div>

//             {/* Vehicle Details (if provider) */}
//             {formData.role === 'provider' && (
//               <>
//                 <div>
//                   <label className="text-sm font-semibold">Vehicle Type</label>
//                   <select
//                     name="vehicleType"
//                     value={formData.vehicleType}
//                     onChange={handleChange}
//                     className="w-full mt-2 px-4 py-3 border rounded-lg"
//                     required
//                   >
//                     <option value="">Select vehicle</option>
//                     <option value="tractor">Tractor</option>
//                     <option value="harvester">Harvester</option>
//                     <option value="rotavator">Rotavator</option>
//                     <option value="truck">Truck</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="text-sm font-semibold">Vehicle Number</label>
//                   <input
//                     type="text"
//                     name="vehicleNumber"
//                     value={formData.vehicleNumber}
//                     onChange={handleChange}
//                     className="w-full mt-2 px-4 py-3 border rounded-lg"
//                     placeholder="e.g. HR-01-AB-1234"
//                   />
//                 </div>
//               </>
//             )}

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-orange-600 text-white py-3 rounded-lg flex justify-center items-center gap-2"
//             >
//               {loading ? 'Sending...' : 'Send OTP'}
//               <ArrowRight />
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleRegister}>
//             <label className="text-sm font-semibold">Enter OTP</label>
//             <input
//               value={otp}
//               onChange={(e) =>
//                 setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
//               }
//               className="w-full mt-2 px-4 py-3 border rounded-lg text-center text-xl"
//               placeholder="******"
//               required
//             />

//             <button
//               type="submit"
//               disabled={loading}
//               className="mt-6 w-full bg-orange-600 text-white py-3 rounded-lg"
//             >
//               {loading ? 'Verifying...' : 'Verify & Register'}
//             </button>
//           </form>
//         )}

//         {/* Switch */}
//         <p className="text-center mt-6">
//           Already have an account?{' '}
//           <button
//             onClick={onSwitchToLogin}
//             className="text-orange-600 font-bold"
//           >
//             Login
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default RegisterForm;
