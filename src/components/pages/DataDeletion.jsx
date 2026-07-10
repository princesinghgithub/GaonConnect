import React from 'react';
import { useNavigate } from 'react-router-dom';

const DataDeletion = () => {
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
            <h1 className="text-2xl font-bold">Data Deletion</h1>
            <p className="text-orange-100 text-sm">GaonConnect — डेटा डिलीट करें</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 space-y-8">

          <section>
            <p className="text-gray-700 leading-relaxed">
              आप GaonConnect के पास मौजूद अपने व्यक्तिगत डेटा को डिलीट करने का अनुरोध
              कर सकते हैं, बिना अपना पूरा अकाउंट बंद किए।
            </p>
          </section>

          <hr className="border-orange-100" />

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              कौन सा डेटा डिलीट किया जा सकता है
            </h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm leading-relaxed ml-2">
              <li>सेव की गई जगहें (होम, वर्क, हाल की खोजें)</li>
              <li>राइड इतिहास और आपके द्वारा दी गई रेटिंग/समीक्षा</li>
              <li>प्रोफाइल विवरण — नाम, ईमेल, प्रोफाइल फोटो</li>
              <li>आपके अकाउंट से जुड़ा डिवाइस और लोकेशन डेटा</li>
            </ul>
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
                  href="mailto:gaonconnect.in@gmail.com?subject=Delete%20My%20Data"
                  className="text-orange-600 hover:underline"
                >
                  gaonconnect.in@gmail.com
                </a>{' '}
                पर "Delete My Data" subject के साथ ईमेल भेजें, जिसमें बताएं कि क्या डिलीट करना है।
              </li>
              <li>
                या हमें WhatsApp/कॉल करें:{' '}
                <a href="https://wa.me/916260132613" className="text-orange-600 hover:underline">
                  +91 62601 32613
                </a>
              </li>
            </ol>
          </section>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-gray-700">
            <strong>प्रोसेसिंग समय:</strong> पहचान वेरीफाई होने के बाद 7 कार्य दिवसों के भीतर अनुरोध पूरा कर दिया जाएगा।
          </div>

          <hr className="border-orange-100" />

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">
              क्या डेटा सुरक्षित रखा जा सकता है
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              कानूनी (जैसे टैक्स/अकाउंटिंग) आवश्यकताओं के तहत पेमेंट/इनवॉइस रिकॉर्ड
              सीमित समय के लिए रखे जा सकते हैं। इस डेटा का किसी अन्य उद्देश्य के लिए
              उपयोग नहीं किया जाता और कानूनी अवधि खत्म होने पर इसे भी हटा दिया जाता है।
            </p>
          </section>

          <hr className="border-orange-100" />

          <section>
            <h2 className="text-xl font-bold text-orange-600 mb-3">संबंधित</h2>
            <p className="text-gray-700 text-sm">
              पूरा अकाउंट डिलीट करना चाहते हैं?{' '}
              <a href="/account-deletion" className="text-orange-600 hover:underline">Account Deletion</a> पेज देखें, या हम क्या
              डेटा एकत्र करते हैं इसके बारे में हमारी{' '}
              <a href="/privacy-policy" className="text-orange-600 hover:underline">Privacy Policy</a> देखें।
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default DataDeletion;
