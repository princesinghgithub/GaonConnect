// import React, { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';

// const GaonConnectLanding = () => {
//   const navigate = useNavigate();

//   // Service selection handler
//   const handleServiceSelect = (serviceName, basePrice) => {
//     // Route to booking page with service details
//     navigate('/booking', { 
//       state: { 
//         service: serviceName, 
//         price: basePrice 
//       } 
//     });
//   };

//   // Download app handler
//   const handleDownloadApp = () => {
//     alert('🎉 धन्यवाद!\n\nApp जल्द ही Google Play Store और Apple App Store पर उपलब्ध होगा!\n\nपहली राइड पर कोड GAON50 से ₹50 की छूट पाएं!');
//   };

//   // Become driver handler
//   const handleBecomeDriver = () => {
//     alert('👨‍💼 ड्राइवर पार्टनर बनें!\n\n✅ अपनी गाड़ी से पैसे कमाएं\n✅ फ्लेक्सिबल टाइमिंग\n✅ सप्ताह में पेमेंट\n\nरजिस्टर करने के लिए हमसे संपर्क करें');
//   };

//   // Smooth scroll to section
//   const scrollToSection = (sectionId) => {
//     const element = document.getElementById(sectionId);
//     if (element) {
//       element.scrollIntoView({ behavior: 'smooth' });
//     }
//   };

//   // Services data
//   const services = [
//     { name: 'Auto Rickshaw', icon: '🛺', price: '₹50+', basePrice: 50 },
//     { name: 'Bike Taxi', icon: '🏍️', price: '₹30+', basePrice: 30 },
//     { name: 'Car', icon: '🚗', price: '₹100+', basePrice: 100 },
//     { name: 'Tractor (Jutai)', icon: '🚜', price: '₹500+', basePrice: 500 },
//     { name: 'Wedding Car', icon: '🏛️', price: '₹2000+', basePrice: 2000 },
//     { name: 'Goods Transport', icon: '🚚', price: '₹200+', basePrice: 200 },
//     { name: 'Tempo', icon: '🚐', price: '₹150+', basePrice: 150 },
//     { name: 'JCB/Excavator', icon: '🏗️', price: '₹1000+', basePrice: 1000 },
//   ];

//   // Features data
//   const features = [
//     {
//       icon: '⚡',
//       title: 'तुरंत बुकिंग',
//       description: 'कुछ ही सेकंड में अपनी गाड़ी बुक करें। कोई इंतज़ार नहीं, कोई झंझट नहीं!'
//     },
//     {
//       icon: '💰',
//       title: 'सस्ते दाम',
//       description: 'मार्केट से कम कीमत पर सभी सेवाएं। पहली राइड पर ₹50 की छूट!'
//     },
//     {
//       icon: '🔒',
//       title: 'सुरक्षित यात्रा',
//       description: 'सभी ड्राइवर वेरिफाइड हैं। रियल-टाइम ट्रैकिंग से पूरी सुरक्षा!'
//     },
//     {
//       icon: '🌐',
//       title: 'हर जगह उपलब्ध',
//       description: 'गांव हो या शहर, हम हर जगह सेवा देते हैं। 24/7 उपलब्ध!'
//     },
//     {
//       icon: '📞',
//       title: 'हिंदी सपोर्ट',
//       description: 'पूरी तरह हिंदी में! कस्टमर सपोर्ट भी हिंदी में उपलब्ध।'
//     },
//     {
//       icon: '💳',
//       title: 'आसान पेमेंट',
//       description: 'कैश, UPI, वॉलेट - जैसे चाहें वैसे पेमेंट करें!'
//     }
//   ];

//   // How it works steps
//   const steps = [
//     {
//       number: '1',
//       title: 'App डाउनलोड करें',
//       description: 'GaonConnect app डाउनलोड करें और अपना मोबाइल नंबर से रजिस्टर करें'
//     },
//     {
//       number: '2',
//       title: 'गाड़ी चुनें',
//       description: 'ऑटो, बाइक, कार, ट्रैक्टर - जो चाहिए वो चुनें'
//     },
//     {
//       number: '3',
//       title: 'लोकेशन डालें',
//       description: 'कहाँ से कहाँ जाना है बताएं, हम सब संभाल लेंगे'
//     },
//     {
//       number: '4',
//       title: 'राइड एंजॉय करें',
//       description: 'ड्राइवर आ जाएगा और आप सुरक्षित यात्रा करें!'
//     }
//   ];

//   // Benefits data
//   const benefits = [
//     {
//       icon: '🎁',
//       title: 'रेफरल बोनस',
//       description: 'दोस्तों को बुलाएं और हर रेफरल पर ₹100 कमाएं!'
//     },
//     {
//       icon: '⭐',
//       title: 'रेटिंग सिस्टम',
//       description: 'ड्राइवर को रेटिंग दें और बेहतर सेवा पाएं'
//     },
//     {
//       icon: '📍',
//       title: 'लाइव ट्रैकिंग',
//       description: 'अपनी गाड़ी को रियल-टाइम में ट्रैक करें'
//     },
//     {
//       icon: '🎫',
//       title: 'डिजिटल बिल',
//       description: 'हर राइड का डिजिटल रिसीप्ट मिलेगा'
//     },
//     {
//       icon: '👨‍💼',
//       title: 'ड्राइवर बनें',
//       description: 'अपनी गाड़ी से पैसे कमाएं, ड्राइवर पार्टनर बनें!'
//     },
//     {
//       icon: '🏆',
//       title: 'रिवॉर्ड प्रोग्राम',
//       description: 'ज्यादा राइड लें, ज्यादा रिवॉर्ड पाएं'
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       {/* Hero Section */}
//       <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden">
//         <div className="absolute inset-0 opacity-10">
//           <svg className="w-full h-full" viewBox="0 0 1440 320">
//             <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
//           </svg>
//         </div>
        
//         <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
//           <div className="text-7xl md:text-8xl mb-6 animate-bounce">🛺</div>
//           <h1 className="text-4xl md:text-6xl font-bold mb-4">GaonConnect</h1>
//           <p className="text-xl md:text-2xl mb-6 opacity-95">आपकी गाड़ी आपकी सेवा</p>
//           <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
//             गांव और शहर को जोड़ने वाला पहला ट्रांसपोर्ट प्लेटफॉर्म! 
//             ऑटो से लेकर ट्रैक्टर तक, हर गाड़ी अब आपकी मुट्ठी में। 
//             आसान बुकिंग, सस्ते दाम, भरोसेमंद सेवा!
//           </p>
          
//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//             <button 
//               onClick={handleDownloadApp}
//               className="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
//             >
//               📱 App डाउनलोड करें
//             </button>
//             <button 
//               onClick={() => scrollToSection('how-it-works')}
//               className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
//             >
//               🎯 कैसे काम करता है?
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="py-16 md:py-20 px-6 bg-gray-50">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
//             🌟 क्यों चुनें GaonConnect?
//           </h2>
//           <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
//             हम आपको देते हैं सबसे बेहतर सुविधाएं और सेवाएं
//           </p>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {features.map((feature, index) => (
//               <div 
//                 key={index}
//                 className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
//               >
//                 <div className="text-5xl mb-4">{feature.icon}</div>
//                 <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
//                 <p className="text-gray-600 leading-relaxed">{feature.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* How It Works Section */}
//       <section id="how-it-works" className="py-16 md:py-20 px-6 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
//             📱 कैसे काम करता है?
//           </h2>
//           <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
//             बस 4 आसान स्टेप में अपनी गाड़ी बुक करें
//           </p>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {steps.map((step, index) => (
//               <div key={index} className="text-center">
//                 <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
//                   {step.number}
//                 </div>
//                 <h3 className="text-xl font-semibold mb-3 text-gray-800">{step.title}</h3>
//                 <p className="text-gray-600 leading-relaxed">{step.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Services Section - WITH BOOKING NAVIGATION */}
//       <section className="py-16 md:py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
//             🚗 हमारी सेवाएं
//           </h2>
//           <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
//             हर ज़रूरत के लिए सही गाड़ी - अभी बुक करें!
//           </p>
          
//           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//             {services.map((service, index) => (
//               <div 
//                 key={index}
//                 onClick={() => handleServiceSelect(service.name, service.basePrice)}
//                 className="bg-white p-6 rounded-xl shadow-md hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
//               >
//                 <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
//                   {service.icon}
//                 </div>
//                 <h4 className="text-lg font-semibold mb-2 text-gray-800">{service.name}</h4>
//                 <div className="text-green-600 font-semibold">{service.price}</div>
//                 <div className="mt-3 text-sm text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                   बुक करने के लिए क्लिक करें →
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Benefits Section */}
//       <section className="py-16 md:py-20 px-6 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
//             ✨ और भी फायदे
//           </h2>
//           <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
//             GaonConnect के साथ मिलते हैं ये खास फायदे
//           </p>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {benefits.map((benefit, index) => (
//               <div 
//                 key={index}
//                 className="flex gap-4 items-start p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300"
//               >
//                 <div className="text-4xl flex-shrink-0">{benefit.icon}</div>
//                 <div>
//                   <h4 className="text-lg font-semibold mb-2 text-gray-800">{benefit.title}</h4>
//                   <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Final CTA Section */}
//       <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16 md:py-20 px-6 text-center">
//         <h2 className="text-3xl md:text-5xl font-bold mb-6">🚀 आज ही शुरू करें!</h2>
//         <p className="text-lg md:text-xl mb-10 opacity-95">
//           अपनी पहली राइड पर ₹50 की छूट पाएं। कोड: GAON50
//         </p>
        
//         <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
//           <button 
//             onClick={handleDownloadApp}
//             className="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
//           >
//             📱 अभी App डाउनलोड करें
//           </button>
//           <button 
//             onClick={handleBecomeDriver}
//             className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
//           >
//             👨‍💼 ड्राइवर पार्टनर बनें
//           </button>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12 px-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
//             <a href="#about" className="hover:text-orange-400 transition-colors">हमारे बारे में</a>
//             <a href="#contact" className="hover:text-orange-400 transition-colors">संपर्क करें</a>
//             <a href="#privacy" className="hover:text-orange-400 transition-colors">प्राइवेसी पॉलिसी</a>
//             <a href="#terms" className="hover:text-orange-400 transition-colors">नियम और शर्तें</a>
//             <a href="#support" className="hover:text-orange-400 transition-colors">सहायता</a>
//           </div>
//           <p className="text-center text-gray-400 text-sm mb-2">
//             © 2026 GaonConnect. सर्वाधिकार सुरक्षित.
//           </p>
//           <p className="text-center text-gray-500 text-sm">
//             🛺 आपकी गाड़ी आपकी सेवा 🛺
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default GaonConnectLanding;


import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GaonConnectLanding = () => {
  const navigate = useNavigate();

  // Service selection handler - redirects to auth page with service data
  const handleServiceSelect = (serviceName, basePrice) => {
    // Store selected service in sessionStorage so it persists after auth
    sessionStorage.setItem('selectedService', JSON.stringify({
      service: serviceName,
      price: basePrice
    }));
    
    // Redirect to auth page
    navigate('/auth');
  };

  // Download app handler
  const handleDownloadApp = () => {
    alert('🎉 धन्यवाद!\n\nApp जल्द ही Google Play Store और Apple App Store पर उपलब्ध होगा!\n\nपहली राइड पर कोड GAON50 से ₹50 की छूट पाएं!');
  };

  // Become driver handler
  const handleBecomeDriver = () => {
    // Redirect to auth page with driver flag
    sessionStorage.setItem('registerAsDriver', 'true');
    navigate('/auth');
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Services data
  const services = [
    { name: 'Auto Rickshaw', icon: '🛺', price: '₹30+', basePrice: 50 },
    { name: 'Bike Taxi', icon: '🏍️', price: '₹30+', basePrice: 30 },
    { name: 'Car', icon: '🚗', price: '₹100+', basePrice: 100 },
    { name: 'Tractor (Jutai)', icon: '🚜', price: '₹400+', basePrice: 400 },
    { name: 'Wedding Car', icon: '🏛️', price: '₹500+', basePrice: 2000 },
    { name: 'Goods Transport', icon: '🚚', price: '₹200+', basePrice: 200 },
    { name: 'Tempo', icon: '🚐', price: '₹150+', basePrice: 150 },
    { name: 'JCB/Excavator', icon: '🏗️', price: '₹1000+', basePrice: 1000 },
  ];

  // Features data
  const features = [
    {
      icon: '⚡',
      title: 'तुरंत बुकिंग',
      description: 'कुछ ही सेकंड में अपनी गाड़ी बुक करें। कोई इंतज़ार नहीं, कोई झंझट नहीं!'
    },
    {
      icon: '💰',
      title: 'सस्ते दाम',
      description: 'मार्केट से कम कीमत पर सभी सेवाएं। पहली राइड पर ₹50 की छूट!'
    },
    {
      icon: '🔒',
      title: 'सुरक्षित यात्रा',
      description: 'सभी ड्राइवर वेरिफाइड हैं। रियल-टाइम ट्रैकिंग से पूरी सुरक्षा!'
    },
    {
      icon: '🌐',
      title: 'हर जगह उपलब्ध',
      description: 'गांव हो या शहर, हम हर जगह सेवा देते हैं। 24/7 उपलब्ध!'
    },
    {
      icon: '📞',
      title: 'हिंदी सपोर्ट',
      description: 'पूरी तरह हिंदी में! कस्टमर सपोर्ट भी हिंदी में उपलब्ध।'
    },
    {
      icon: '💳',
      title: 'आसान पेमेंट',
      description: 'कैश, UPI, वॉलेट - जैसे चाहें वैसे पेमेंट करें!'
    }
  ];

  // How it works steps
  const steps = [
    {
      number: '1',
      title: 'App डाउनलोड करें',
      description: 'GaonConnect app डाउनलोड करें और अपना मोबाइल नंबर से रजिस्टर करें'
    },
    {
      number: '2',
      title: 'गाड़ी चुनें',
      description: 'ऑटो, बाइक, कार, ट्रैक्टर - जो चाहिए वो चुनें'
    },
    {
      number: '3',
      title: 'लोकेशन डालें',
      description: 'कहाँ से कहाँ जाना है बताएं, हम सब संभाल लेंगे'
    },
    {
      number: '4',
      title: 'राइड एंजॉय करें',
      description: 'ड्राइवर आ जाएगा और आप सुरक्षित यात्रा करें!'
    }
  ];

  // Benefits data
  const benefits = [
    {
      icon: '🎁',
      title: 'रेफरल बोनस',
      description: 'दोस्तों को बुलाएं और हर रेफरल पर ₹100 कमाएं!'
    },
    {
      icon: '⭐',
      title: 'रेटिंग सिस्टम',
      description: 'ड्राइवर को रेटिंग दें और बेहतर सेवा पाएं'
    },
    {
      icon: '📍',
      title: 'लाइव ट्रैकिंग',
      description: 'अपनी गाड़ी को रियल-टाइम में ट्रैक करें'
    },
    {
      icon: '🎫',
      title: 'डिजिटल बिल',
      description: 'हर राइड का डिजिटल रिसीप्ट मिलेगा'
    },
    {
      icon: '👨‍💼',
      title: 'ड्राइवर बनें',
      description: 'अपनी गाड़ी से पैसे कमाएं, ड्राइवर पार्टनर बनें!'
    },
    {
      icon: '🏆',
      title: 'रिवॉर्ड प्रोग्राम',
      description: 'ज्यादा राइड लें, ज्यादा रिवॉर्ड पाएं'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1440 320">
            <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="text-7xl md:text-8xl mb-6 animate-bounce">🚜</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">GaonConnect</h1>
          <p className="text-xl md:text-2xl mb-6 opacity-95">आपकी गाड़ी आपकी सेवा</p>
          <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            गांव और शहर को जोड़ने वाला पहला ट्रांसपोर्ट प्लेटफॉर्म! 
            ऑटो से लेकर ट्रैक्टर तक, हर गाड़ी अब आपकी मुट्ठी में। 
            आसान बुकिंग, सस्ते दाम, भरोसेमंद सेवा!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleDownloadApp}
              className="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              📱 App डाउनलोड करें
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
            >
              🎯 कैसे काम करता है?
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
            🌟 क्यों चुनें GaonConnect?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            हम आपको देते हैं सबसे बेहतर सुविधाएं और सेवाएं
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
            📱 कैसे काम करता है?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            बस 4 आसान स्टेप में अपनी गाड़ी बुक करें
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section - REDIRECTS TO AUTH ON CLICK */}
      <section className="py-16 md:py-20 px-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
            🚗 हमारी सेवाएं
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            हर ज़रूरत के लिए सही गाड़ी - सेवा चुनें और शुरू करें!
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div 
                key={index}
                onClick={() => handleServiceSelect(service.name, service.basePrice)}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-800">{service.name}</h4>
                <div className="text-green-600 font-semibold">{service.price}</div>
                <div className="mt-3 text-sm text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  चुनने के लिए क्लिक करें →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
            ✨ और भी फायदे
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            GaonConnect के साथ मिलते हैं ये खास फायदे
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex gap-4 items-start p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300"
              >
                <div className="text-4xl flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-800">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-16 md:py-20 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">🚀 आज ही शुरू करें!</h2>
        <p className="text-lg md:text-xl mb-10 opacity-95">
          अपनी पहली राइड पर ₹50 की छूट पाएं। कोड: GAON50
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
          <button 
            onClick={handleDownloadApp}
            className="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            📱 अभी App डाउनलोड करें
          </button>
          <button 
            onClick={handleBecomeDriver}
            className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300"
          >
            👨‍💼 ड्राइवर पार्टनर बनें
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <a href="#about" className="hover:text-orange-400 transition-colors">हमारे बारे में</a>
            <a href="#contact" className="hover:text-orange-400 transition-colors">संपर्क करें</a>
            <button onClick={() => navigate('/privacy-policy')} className="hover:text-orange-400 transition-colors">प्राइवेसी पॉलिसी</button>
            <a href="#terms" className="hover:text-orange-400 transition-colors">नियम और शर्तें</a>
            <a href="#support" className="hover:text-orange-400 transition-colors">सहायता</a>
          </div>
          <p className="text-center text-gray-400 text-sm mb-2">
            © 2026 GaonConnect. सर्वाधिकार सुरक्षित.
          </p>
          <p className="text-center text-gray-500 text-sm">
            🛺 आपकी गाड़ी आपकी सेवा 🛺
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GaonConnectLanding;
