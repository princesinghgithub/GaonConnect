// import React from 'react';
// import { TABS } from '../utils/constants';

// const TabNavigation = ({ activeTab, setActiveTab }) => {
//   return (
//     <div className="bg-white shadow-md sticky top-20 z-30">
//       <div className="container mx-auto px-4">
//         <div className="flex overflow-x-auto">
//           {TABS.map(tab => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`px-6 py-4 font-semibold transition whitespace-nowrap ${
//                 activeTab === tab.id
//                   ? 'text-orange-600 border-b-4 border-orange-600'
//                   : 'text-gray-600 hover:text-orange-600'
//               }`}
//             >
//               <span className="mr-2">{tab.icon}</span>
//               {tab.label}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TabNavigation;