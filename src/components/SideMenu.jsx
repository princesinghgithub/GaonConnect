import React from 'react';
import { Users, Gift, Award, MessageCircle } from 'lucide-react';

const SUPPORT_PHONE = '916260132613';

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.8 8.1a2.9 2.9 0 0 0-2-2C18.1 5.6 12 5.6 12 5.6s-6.1 0-7.8.5a2.9 2.9 0 0 0-2 2A30.4 30.4 0 0 0 1.6 12a30.4 30.4 0 0 0 .6 3.9 2.9 2.9 0 0 0 2 2c1.7.5 7.8.5 7.8.5s6.1 0 7.8-.5a2.9 2.9 0 0 0 2-2 30.4 30.4 0 0 0 .6-3.9 30.4 30.4 0 0 0-.6-3.9zM9.8 15.3V8.7l5.6 3.3z"/>
  </svg>
);

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

        {/* Social Media Links */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3 text-center">Follow GaonConnect</p>
          <div className="flex gap-3 justify-center">
            <a
              href="https://www.instagram.com/gaonconnect/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <InstagramIcon />
              Instagram
            </a>
            <a
              href="https://facebook.com/profile.php?id=61591245161485"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-blue-600"
            >
              <FacebookIcon />
              Facebook
            </a>
            <a
              href="https://www.youtube.com/@Gaonconnenct"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowMenu(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-red-600"
            >
              <YoutubeIcon />
              YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;