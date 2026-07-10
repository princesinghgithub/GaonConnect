import React from 'react';
import { useNavigate } from 'react-router-dom';

const AccountDeletion = () => {
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
            <h1 className="text-2xl font-bold">Account Deletion</h1>
            <p className="text-orange-100 text-sm">GaonConnect — अकाउंट डिलीट करें</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 space-y-8">

          <section>
            <p className="text-gray-700 leading-relaxed">
              आप किसी भी समय अपना GaonConnect अकाउंट और उससे जुड़ा सारा व्यक्तिगत डेटा
              स्थायी रूप से डिलीट करने का अनुरोध कर सकते हैं।
            </p>
          </section>

          <hr className="border-orange-100" />

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              डिलीशन का अनुरोध कैसे करें
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm leading-relaxed ml-2">
              <li>
                अपने रजिस्टर्ड ईमेल से{' '}
                <a
                  href="mailto:gaonconnect.in@gmail.com?subject=Delete%20My%20Account"
                  className="text-orange-600 hover:underline"
                >
                  gaonconnect.in@gmail.com
                </a>{' '}
                पर "Delete My Account" subject के साथ ईमेल भेजें।
              </li>
              <li>पहचान वेरीफाई करने के लिए अपना रजिस्टर्ड मोबाइल नंबर ईमेल में शामिल करें।</li>
              <li>
                या हमें WhatsApp/कॉल करें:{' '}
                <a href="https://wa.me/916260132613" className="text-orange-600 hover:underline">
                  +91 62601 32613
                </a>
              </li>
            </ol>
          </section>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-gray-700">
            <strong>प्रोसेसिंग समय:</strong> पहचान वेरीफाई होने के 7 कार्य दिवसों के भीतर अकाउंट और डेटा डिलीट कर दिया जाएगा।
          </div>

          <hr className="border-orange-100" />

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              क्या डिलीट होगा
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm leading-relaxed ml-2">
              <li>प्रोफाइल — नाम, ईमेल, फोन नंबर, प्रोफाइल फोटो</li>
              <li>सेव की गई जगहें (होम, वर्क, हाल की खोजें)</li>
              <li>राइड इतिहास और आपके द्वारा दी गई रेटिंग</li>
            </ul>
          </section>

          <hr className="border-orange-100" />

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              क्या डेटा सुरक्षित रखा जा सकता है
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              कानूनी या टैक्स/अकाउंटिंग आवश्यकताओं के तहत कुछ पेमेंट/इनवॉइस रिकॉर्ड
              सीमित समय के लिए रखे जा सकते हैं, भले ही अकाउंट डिलीट हो चुका हो। इस डेटा
              का किसी अन्य उद्देश्य के लिए उपयोग नहीं किया जाता और कानूनी अवधि खत्म होने
              पर इसे भी हटा दिया जाता है।
            </p>
          </section>

          <hr className="border-orange-100" />

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">संबंधित</h2>
            <p className="text-gray-700 text-sm">
              हम क्या डेटा एकत्र करते हैं इसके बारे में हमारी{' '}
              <a href="/privacy-policy" className="text-orange-600 hover:underline">Privacy Policy</a> देखें, या केवल कुछ डेटा
              डिलीट करना चाहते हैं तो{' '}
              <a href="/data-deletion" className="text-orange-600 hover:underline">Data Deletion</a> पेज देखें।
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
