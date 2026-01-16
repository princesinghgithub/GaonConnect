import React from 'react';
import { Users, Gift, Award, MessageCircle } from 'lucide-react';

const SideMenu = ({ showMenu, setShowMenu }) => {
  if (!showMenu) return null;
  
  const menuItems = [
    { icon: Users, label: 'My Profile' },
    { icon: Gift, label: 'Refer & Earn' },
    { icon: Award, label: 'Rewards' },
    { icon: MessageCircle, label: 'Support' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40" 
      onClick={() => setShowMenu(false)}
    >
      <div 
        className="absolute right-0 top-16 bg-white rounded-l-2xl shadow-2xl p-6 w-72" 
        onClick={e => e.stopPropagation()}
      >
        <div className="space-y-4">
          {menuItems.map((item, idx) => (
            <button 
              key={idx}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 rounded-lg transition flex items-center gap-3"
            >
              <item.icon size={20} className="text-orange-600" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideMenu;