import React from 'react';
import { Users, Gift, Award, MessageCircle } from 'lucide-react';

const SUPPORT_PHONE = '916260132613';

const SideMenu = ({ showMenu, setShowMenu }) => {
  if (!showMenu) return null;

  const handleSupport = () => {
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=Namaste%2C%20mujhe%20GaonConnect%20support%20chahiye`, '_blank');
    setShowMenu(false);
  };

  const menuItems = [
    { icon: Users,          label: 'My Profile',   onClick: null },
    { icon: Gift,           label: 'Refer & Earn', onClick: null },
    { icon: Award,          label: 'Rewards',      onClick: null },
    { icon: MessageCircle,  label: 'Support',      onClick: handleSupport },
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
              onClick={item.onClick}
              disabled={!item.onClick}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 rounded-lg transition flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <item.icon size={20} className="text-orange-600" />
              <span>{item.label}</span>
              {item.label === 'Support' && (
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">WhatsApp</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideMenu;