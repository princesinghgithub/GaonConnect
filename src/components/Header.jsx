import React from 'react';
import { Bell, Wallet, Menu, X, LogOut, User } from 'lucide-react';

const Header = ({ notifications, walletBalance, showMenu, setShowMenu, user, onLogout }) => {
  return (
    <header className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🚜</div>
            <div>
              <h1 className="text-2xl font-bold">GaonConnect</h1>
              <p className="text-xs text-orange-100">आपकी गाड़ी आपकी सेवा</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* User Name */}
            {user && (
              <div className="hidden md:flex items-center gap-2 bg-orange-700 px-3 py-1 rounded-full">
                <User size={16} />
                <span className="font-semibold text-sm">{user.name}</span>
              </div>
            )}

            <button className="relative p-2 hover:bg-orange-700 rounded-full transition">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 bg-orange-700 px-3 py-1 rounded-full">
              <Wallet size={16} />
              <span className="font-bold">₹{walletBalance}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 hover:bg-orange-700 rounded-full transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className="p-2 hover:bg-orange-700 rounded-full transition"
            >
              {showMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;