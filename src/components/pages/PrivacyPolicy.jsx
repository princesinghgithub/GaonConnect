import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-6 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-orange-100 transition-colors"
          >
            ← वापस जाएं
          </button>
          <div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-orange-100 text-sm">GaonConnect — गोपनीयता नीति</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 space-y-8">

          {/* Last updated */}
          <p className="text-gray-500 text-sm">
            Last updated: June 6, 2025
          </p>

          {/* Intro */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              GaonConnect ("हम", "हमारा", या "कंपनी") आपकी गोपनीयता की परवाह करता है।
              यह Privacy Policy बताती है कि जब आप हमारी मोबाइल एप्लिकेशन और वेबसाइट
              ("सेवा") का उपयोग करते हैं तो हम कौन सी जानकारी एकत्र करते हैं, उसका
              उपयोग कैसे करते हैं, और उसे कैसे सुरक्षित रखते हैं।
            </p>
          </section>

          <hr className="border-orange-100" />

          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              1. हम कौन सी जानकारी एकत्र करते हैं
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">व्यक्तिगत जानकारी</h3>
                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed ml-2">
                  <li>नाम, मोबाइल नंबर, ईमेल पता</li>
                  <li>पता और पिनकोड</li>
                  <li>प्रोफाइल फोटो (वैकल्पिक)</li>
                  <li>ड्राइवर / सेवा प्रदाता के लिए: आधार कार्ड, ड्राइविंग लाइसेंस, वाहन पंजीकरण दस्तावेज़</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">स्थान की जानकारी (Location Data)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed ml-2">
                  <li>राइड बुक करते समय पिकअप और ड्रॉप लोकेशन</li>
                  <li>ड्राइवर की रियल-टाइम GPS लोकेशन (राइड के दौरान)</li>
                  <li>पृष्ठभूमि (background) लोकेशन एक्सेस — केवल तभी जब ड्राइवर ऑनलाइन हो</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">डिवाइस और उपयोग की जानकारी</h3>
                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed ml-2">
                  <li>डिवाइस ID, ऑपरेटिंग सिस्टम, ऐप वर्शन</li>
                  <li>राइड इतिहास और बुकिंग डेटा</li>
                  <li>पेमेंट इतिहास (कार्ड/UPI विवरण हम store नहीं करते)</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-orange-100" />

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              2. हम जानकारी का उपयोग कैसे करते हैं
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed ml-2">
              <li>राइड बुकिंग और ड्राइवर मैचिंग के लिए</li>
              <li>रियल-टाइम राइड ट्रैकिंग प्रदान करने के लिए</li>
              <li>ग्राहक सहायता और शिकायत निवारण के लिए</li>
              <li>SMS / WhatsApp / Push Notification के माध्यम से बुकिंग अपडेट भेजने के लिए</li>
              <li>धोखाधड़ी रोकने और सुरक्षा बनाए रखने के लिए</li>
              <li>सेवा में सुधार और नई सुविधाएं विकसित करने के लिए</li>
              <li>कानूनी अनुपालन और नियामक आवश्यकताओं को पूरा करने के लिए</li>
            </ul>
          </section>

          <hr className="border-orange-100" />

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              3. जानकारी साझा करना (Data Sharing)
            </h2>
            <p className="text-gray-700 text-sm mb-3">
              हम आपकी व्यक्तिगत जानकारी किसी तीसरे पक्ष को बेचते नहीं हैं। हम निम्नलिखित
              परिस्थितियों में जानकारी साझा कर सकते हैं:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed ml-2">
              <li><strong>ड्राइवर / सेवा प्रदाता के साथ:</strong> राइड पूरी करने के लिए आवश्यक जानकारी (नाम, फोन नंबर, लोकेशन)</li>
              <li><strong>पेमेंट प्रोसेसर के साथ:</strong> सुरक्षित भुगतान के लिए (Razorpay, UPI गेटवे)</li>
              <li><strong>Google Maps API:</strong> मैप और नेविगेशन सेवाओं के लिए</li>
              <li><strong>कानूनी आवश्यकता होने पर:</strong> सरकारी या न्यायिक आदेश पर</li>
            </ul>
          </section>

          <hr className="border-orange-100" />

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              4. लोकेशन परमिशन का उपयोग
            </h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-gray-700 space-y-2">
              <p><strong>Foreground Location:</strong> राइड बुक करते और ट्रैक करते समय उपयोग होता है।</p>
              <p><strong>Background Location (केवल ड्राइवर के लिए):</strong> जब ड्राइवर ऑनलाइन मोड में हो, तब उनकी लोकेशन अपडेट होती रहती है ताकि नजदीकी राइड रिक्वेस्ट मिल सके। ऑफलाइन होने पर लोकेशन ट्रैकिंग बंद हो जाती है।</p>
              <p>आप कभी भी अपने डिवाइस की Settings से लोकेशन परमिशन बंद कर सकते हैं, लेकिन इससे कुछ सुविधाएं काम नहीं करेंगी।</p>
            </div>
          </section>

          <hr className="border-orange-100" />

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              5. डेटा सुरक्षा (Data Security)
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed ml-2">
              <li>सभी डेटा HTTPS/SSL एन्क्रिप्शन के साथ ट्रांसमिट होता है</li>
              <li>पासवर्ड bcrypt hashing के साथ स्टोर किए जाते हैं</li>
              <li>संवेदनशील दस्तावेज़ encrypted storage में रखे जाते हैं</li>
              <li>हम नियमित सुरक्षा ऑडिट करते हैं</li>
            </ul>
          </section>

          <hr className="border-orange-100" />

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              6. डेटा कितने समय तक रखा जाता है
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed ml-2">
              <li>अकाउंट डेटा: अकाउंट डिलीट करने तक</li>
              <li>राइड इतिहास: 3 वर्ष (कानूनी आवश्यकता)</li>
              <li>लोकेशन डेटा: राइड पूरी होने के 90 दिन बाद हटा दिया जाता है</li>
              <li>KYC दस्तावेज़: 5 वर्ष (नियामक अनुपालन)</li>
            </ul>
          </section>

          <hr className="border-orange-100" />

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              7. आपके अधिकार (Your Rights)
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed ml-2">
              <li>अपना डेटा देखने का अधिकार</li>
              <li>गलत जानकारी सुधारने का अधिकार</li>
              <li>अकाउंट और डेटा डिलीट करने का अधिकार</li>
              <li>मार्केटिंग संदेशों से opt-out करने का अधिकार</li>
            </ul>
            <p className="text-gray-600 text-sm mt-3">
              इन अधिकारों का उपयोग करने के लिए हमसे संपर्क करें।
            </p>
          </section>

          <hr className="border-orange-100" />

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              8. बच्चों की गोपनीयता
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              हमारी सेवा 18 वर्ष से कम आयु के बच्चों के लिए नहीं है। हम जानबूझकर
              18 वर्ष से कम आयु के व्यक्तियों से व्यक्तिगत जानकारी एकत्र नहीं करते।
            </p>
          </section>

          <hr className="border-orange-100" />

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              9. Third-Party सेवाएं
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm leading-relaxed ml-2">
              <li><strong>Google Maps Platform</strong> — नेविगेशन और मैप्स</li>
              <li><strong>Firebase</strong> — Push Notifications और Authentication</li>
              <li><strong>Razorpay</strong> — पेमेंट प्रोसेसिंग</li>
              <li><strong>Twilio / MSG91</strong> — OTP और SMS सेवाएं</li>
            </ul>
            <p className="text-gray-600 text-sm mt-3">
              ये सेवाएं अपनी स्वयं की Privacy Policy के अनुसार संचालित होती हैं।
            </p>
          </section>

          <hr className="border-orange-100" />

          {/* Section 10 */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              10. नीति में बदलाव
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              हम इस Privacy Policy को समय-समय पर अपडेट कर सकते हैं। महत्वपूर्ण बदलाव
              होने पर हम आपको ऐप नोटिफिकेशन या ईमेल के माध्यम से सूचित करेंगे।
              नवीनतम नीति हमेशा इस पेज पर उपलब्ध रहेगी।
            </p>
          </section>

          <hr className="border-orange-100" />

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              11. संपर्क करें
            </h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-gray-700 space-y-1">
              <p className="font-semibold text-gray-800">GaonConnect — Privacy Team</p>
              <p>Email: <a href="mailto:gaonconnect.in@gmail.com" className="text-orange-600 hover:underline">gaonconnect.in@gmail.com</a></p>
              <p>WhatsApp: <a href="https://wa.me/916260132613" className="text-orange-600 hover:underline">+91 62601 32613</a></p>
              <p>पता: GaonConnect, [आपका पता], भारत</p>
            </div>
          </section>

        </div>

        {/* Footer note */}
        <p className="text-center text-gray-400 text-xs mt-6 mb-8">
          © 2025 GaonConnect. All rights reserved. | Governed by Indian IT Act 2000 & PDPB 2023
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
