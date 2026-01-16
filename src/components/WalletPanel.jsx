import React from 'react';

const WalletPanel = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl p-5 shadow-lg">
      <h3 className="text-xl font-bold mb-2">💰 Wallet</h3>
      <p className="text-3xl font-bold">₹3,250</p>
      <p className="text-sm opacity-90">Pending payout</p>

      <button className="mt-4 bg-white text-orange-600 px-4 py-2 rounded-lg font-bold">
        Withdraw (Coming Soon)
      </button>
    </div>
  );
};

export default WalletPanel;
