// const WalletTab = () => (
//   <div className="pb-20 space-y-4">
//     <div className="bg-orange-500 text-white p-5 rounded-xl">
//       <h3 className="font-bold">Wallet Balance</h3>
//       <p className="text-3xl">₹3,250</p>
//       <button className="mt-3 bg-white text-orange-600 px-4 py-2 rounded">
//         Withdraw (Coming Soon)
//       </button>
//     </div>
//   </div>
// );

// export default WalletTab;

// import React from 'react';
// import { DollarSign, TrendingUp, Clock, ArrowUpRight, Download } from 'lucide-react';

// const WalletTab = () => {
//   const transactions = [
//     { id: 1, type: 'credit', amount: 135, date: '29 Dec, 10:30 AM', desc: 'Station → Market' },
//     { id: 2, type: 'credit', amount: 180, date: '29 Dec, 09:15 AM', desc: 'Bus Stand → Mall' },
//     { id: 3, type: 'debit', amount: 500, date: '28 Dec, 06:00 PM', desc: 'Withdrawal to Bank' },
//     { id: 4, type: 'credit', amount: 95, date: '28 Dec, 04:20 PM', desc: 'College → Home' },
//   ];

//   return (
//     <div className="pb-20 space-y-4">
      
//       {/* ✅ Main Balance Card */}
//       <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <p className="text-sm opacity-90">Available Balance</p>
//             <h2 className="text-4xl font-bold mt-1">₹3,250</h2>
//           </div>
//           <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
//             <DollarSign size={28} />
//           </div>
//         </div>
        
//         <div className="flex gap-3 mt-6">
//           <button className="flex-1 bg-white text-orange-600 py-3 rounded-xl font-bold hover:bg-orange-50 transition flex items-center justify-center gap-2">
//             <ArrowUpRight size={18} />
//             Withdraw
//           </button>
//           <button className="flex-1 bg-white/20 text-white py-3 rounded-xl font-bold hover:bg-white/30 transition">
//             Add Money
//           </button>
//         </div>
//       </div>

//       {/* ✅ Quick Stats */}
//       <div className="grid grid-cols-2 gap-3">
//         <div className="bg-white p-4 rounded-xl shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <TrendingUp className="text-green-600" size={20} />
//             <p className="text-xs text-gray-600">Today's Earnings</p>
//           </div>
//           <p className="text-2xl font-bold text-green-600">₹1,250</p>
//         </div>
        
//         <div className="bg-white p-4 rounded-xl shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <Clock className="text-blue-600" size={20} />
//             <p className="text-xs text-gray-600">This Week</p>
//           </div>
//           <p className="text-2xl font-bold text-blue-600">₹8,450</p>
//         </div>
//       </div>

//       {/* ✅ Recent Transactions */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="font-bold text-lg">Recent Transactions</h3>
//           <button className="text-orange-600 text-sm font-semibold flex items-center gap-1">
//             View All <ArrowUpRight size={14} />
//           </button>
//         </div>
        
//         <div className="space-y-3">
//           {transactions.map((txn) => (
//             <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
//               <div className="flex items-center gap-3">
//                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                   txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
//                 }`}>
//                   {txn.type === 'credit' ? '↓' : '↑'}
//                 </div>
//                 <div>
//                   <p className="font-semibold text-sm">{txn.desc}</p>
//                   <p className="text-xs text-gray-500">{txn.date}</p>
//                 </div>
//               </div>
//               <p className={`font-bold ${
//                 txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
//               }`}>
//                 {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ✅ Download Statement */}
//       <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition">
//         <Download size={18} />
//         Download Statement
//       </button>

//     </div>
//   );
// };

// export default WalletTab;



// import React, { useState, useEffect } from 'react';
// import { 
//   Wallet, TrendingUp, TrendingDown, DollarSign, 
//   Calendar, Filter, Download, ArrowUpRight, ArrowDownLeft,
//   Clock, CheckCircle, XCircle
// } from 'lucide-react';
// import { useDriver } from '../context/Drivercontext';
// import axios from 'axios';

// const API_URL =  'http://localhost:5000/api';

// const WalletTab = () => {
//   const { driver, wallet: contextWallet, loadWallet } = useDriver();
//   const [wallet, setWallet] = useState(null);
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('all'); // all, credit, debit
//   const [period, setPeriod] = useState('week'); // week, month, year

//   useEffect(() => {
//     if (driver) {
//       fetchWalletData();
//     }
//   }, [driver, filter]);

//   const fetchWalletData = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');
      
//       const [walletRes, transactionsRes] = await Promise.all([
//         axios.get(`${API_URL}/wallet/balance`, {
//           headers: { Authorization: `Bearer ${token}` }
//         }),
//         axios.get(`${API_URL}/wallet/transactions`, {
//           headers: { Authorization: `Bearer ${token}` },
//           params: { type: filter === 'all' ? undefined : filter, limit: 20 }
//         })
//       ]);
      
//       setWallet(walletRes.data.data);
//       setTransactions(transactionsRes.data.data || []);
//     } catch (error) {
//       console.error('Wallet fetch error:', error);
//       // Use context wallet as fallback
//       setWallet(contextWallet);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const requestWithdrawal = async () => {
//     const amount = prompt('Enter withdrawal amount:');
//     if (!amount || isNaN(amount)) {
//       alert('Please enter a valid amount');
//       return;
//     }

//     if (parseFloat(amount) < 100) {
//       alert('Minimum withdrawal amount is ₹100');
//       return;
//     }

//     if (parseFloat(amount) > (wallet?.balance || 0)) {
//       alert('Insufficient balance');
//       return;
//     }

//     try {
//       const token = localStorage.getItem('token');
//       await axios.post(
//         `${API_URL}/wallet/withdraw`,
//         { amount: parseFloat(amount) },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
      
//       alert('Withdrawal request submitted successfully!');
//       fetchWalletData();
//     } catch (error) {
//       alert(error.response?.data?.message || 'Withdrawal failed');
//     }
//   };

//   if (loading && !wallet) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
//       </div>
//     );
//   }

//   const balance = wallet?.balance || 0;
//   const pendingAmount = wallet?.pendingAmount || 0;
//   const totalEarnings = wallet?.totalEarnings || 0;

//   return (
//     <div className="pb-20 space-y-4">
      
//       {/* Balance Card */}
//       <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
//         <div className="flex items-center justify-between mb-4">
//           <div className="flex items-center gap-2">
//             <Wallet size={24} />
//             <span className="text-sm opacity-90">Available Balance</span>
//           </div>
//           <button 
//             onClick={fetchWalletData}
//             className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition"
//           >
//             Refresh
//           </button>
//         </div>
        
//         <h1 className="text-4xl font-bold mb-6">₹{balance.toFixed(2)}</h1>
        
//         <div className="flex gap-3">
//           <button 
//             onClick={requestWithdrawal}
//             disabled={balance < 100}
//             className="flex-1 bg-white text-orange-600 hover:bg-orange-50 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//           >
//             <Download size={18} />
//             Withdraw
//           </button>
//           <button className="flex-1 bg-white/20 hover:bg-white/30 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2">
//             <TrendingUp size={18} />
//             Add Money
//           </button>
//         </div>
//       </div>

//       {/* Quick Stats */}
//       <div className="grid grid-cols-2 gap-4">
//         <div className="bg-white p-4 rounded-xl shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <Clock className="text-yellow-600" size={20} />
//             <span className="text-sm text-gray-600">Pending</span>
//           </div>
//           <p className="text-2xl font-bold text-gray-800">₹{pendingAmount.toFixed(2)}</p>
//         </div>
        
//         <div className="bg-white p-4 rounded-xl shadow">
//           <div className="flex items-center gap-2 mb-2">
//             <TrendingUp className="text-green-600" size={20} />
//             <span className="text-sm text-gray-600">Total Earned</span>
//           </div>
//           <p className="text-2xl font-bold text-gray-800">₹{totalEarnings.toFixed(2)}</p>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="bg-white p-4 rounded-xl shadow">
//         <div className="flex items-center justify-between gap-4">
//           <div className="flex gap-2 flex-1">
//             <button
//               onClick={() => setFilter('all')}
//               className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
//                 filter === 'all'
//                   ? 'bg-orange-600 text-white'
//                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//               }`}
//             >
//               All
//             </button>
//             <button
//               onClick={() => setFilter('credit')}
//               className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
//                 filter === 'credit'
//                   ? 'bg-green-600 text-white'
//                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//               }`}
//             >
//               Credit
//             </button>
//             <button
//               onClick={() => setFilter('debit')}
//               className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
//                 filter === 'debit'
//                   ? 'bg-red-600 text-white'
//                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//               }`}
//             >
//               Debit
//             </button>
//           </div>
          
//           <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
//             <Filter size={20} className="text-gray-600" />
//           </button>
//         </div>
//       </div>

//       {/* Transactions List */}
//       <div className="bg-white rounded-xl shadow overflow-hidden">
//         <div className="p-4 border-b">
//           <h3 className="font-bold text-lg">Recent Transactions</h3>
//         </div>
        
//         <div className="divide-y">
//           {transactions.length > 0 ? (
//             transactions.map((txn) => (
//               <TransactionItem key={txn._id} transaction={txn} />
//             ))
//           ) : (
//             <div className="p-8 text-center text-gray-500">
//               <Wallet size={48} className="mx-auto mb-3 opacity-30" />
//               <p>No transactions yet</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Withdrawal Info */}
//       <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
//         <p className="text-sm text-blue-800">
//           <strong>💡 Withdrawal Info:</strong><br />
//           • Minimum withdrawal: ₹100<br />
//           • Processing time: 2-3 business days<br />
//           • Free withdrawals (no charges)
//         </p>
//       </div>

//     </div>
//   );
// };

// // Transaction Item Component
// const TransactionItem = ({ transaction }) => {
//   const isCredit = transaction.type === 'credit';
//   const { amount, description, createdAt, status, ride } = transaction;

//   const getStatusIcon = () => {
//     switch (status) {
//       case 'completed':
//         return <CheckCircle size={16} className="text-green-600" />;
//       case 'pending':
//         return <Clock size={16} className="text-yellow-600" />;
//       case 'failed':
//         return <XCircle size={16} className="text-red-600" />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="p-4 hover:bg-gray-50 transition">
//       <div className="flex items-center gap-3">
//         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//           isCredit ? 'bg-green-100' : 'bg-red-100'
//         }`}>
//           {isCredit ? (
//             <ArrowDownLeft className="text-green-600" size={20} />
//           ) : (
//             <ArrowUpRight className="text-red-600" size={20} />
//           )}
//         </div>
        
//         <div className="flex-1">
//           <div className="flex items-center justify-between mb-1">
//             <p className="font-semibold text-gray-800">
//               {description || (isCredit ? 'Ride Payment' : 'Withdrawal')}
//             </p>
//             <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
//               {isCredit ? '+' : '-'}₹{amount.toFixed(2)}
//             </p>
//           </div>
          
//           <div className="flex items-center justify-between text-xs text-gray-500">
//             <div className="flex items-center gap-2">
//               <span>{new Date(createdAt).toLocaleDateString('en-IN')}</span>
//               {ride && (
//                 <span className="text-orange-600">#{ride.slice(-6)}</span>
//               )}
//             </div>
//             <div className="flex items-center gap-1">
//               {getStatusIcon()}
//               <span className="capitalize">{status}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WalletTab;


import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, DollarSign, 
  Calendar, Filter, Download, ArrowUpRight, ArrowDownLeft,
  Clock, CheckCircle, XCircle
} from 'lucide-react';

import { useDriver } from '../context/Drivercontext';
import { walletAPI } from '../services/api';

const WalletTab = () => {

  const { wallet: contextWallet } = useDriver();

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');   // all, credit, debit

  useEffect(() => {
    fetchWalletData();
  }, [filter]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      const [bal, tx] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions({
          type: filter === "all" ? undefined : filter,
          limit: 20
        })
      ]);

      setWallet(bal.data.data);
      setTransactions(tx.data.data || []);

    } catch (err) {
      console.log("Wallet error", err);
      setWallet(contextWallet); // fallback
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async () => {
    const amount = prompt('Enter withdrawal amount:');
    if (!amount || isNaN(amount)) return alert("Invalid amount");

    const amt = parseFloat(amount);

    if (amt < 100) return alert("Minimum withdrawal ₹100 hai");
    if (amt > (wallet?.balance || 0)) return alert("Insufficient balance");

    try {
      await walletAPI.withdraw(amt);
      alert("Withdrawal request submitted");
      fetchWalletData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const balance = wallet?.balance || 0;
  const pendingAmount = wallet?.pendingAmount || 0;
  const totalEarnings = wallet?.totalEarnings || 0;

  return (
    <div className="pb-20 space-y-4">

      {/* BALANCE CARD */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={24} />
            <span className="text-sm opacity-90">Available Balance</span>
          </div>

          <button 
            onClick={fetchWalletData}
            className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition"
          >
            Refresh
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-6">₹{balance.toFixed(2)}</h1>

        <div className="flex gap-3">
          <button 
            onClick={requestWithdrawal}
            disabled={balance < 100}
            className="flex-1 bg-white text-orange-600 hover:bg-orange-50 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Withdraw
          </button>

          <button className="flex-1 bg-white/20 hover:bg-white/30 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2">
            <TrendingUp size={18} />
            Add Money
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={<Clock className="text-yellow-600" size={20} />}
          label="Pending"
          value={`₹${pendingAmount.toFixed(2)}`}
        />
        <StatCard 
          icon={<TrendingUp className="text-green-600" size={20} />}
          label="Total Earned"
          value={`₹${totalEarnings.toFixed(2)}`}
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex items-center justify-between gap-4">

          <div className="flex gap-2 flex-1">
            <FilterBtn title="All" active={filter==="all"} onClick={()=>setFilter("all")} color="orange" />
            <FilterBtn title="Credit" active={filter==="credit"} onClick={()=>setFilter("credit")} color="green" />
            <FilterBtn title="Debit" active={filter==="debit"} onClick={()=>setFilter("debit")} color="red" />
          </div>

          <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
            <Filter size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="bg-white rounded-xl shadow overflow-hidden">

        <div className="p-4 border-b">
          <h3 className="font-bold text-lg">Recent Transactions</h3>
        </div>

        <div className="divide-y">
          {transactions.length ? (
            transactions.map(tx => (
              <TransactionItem key={tx._id} transaction={tx} />
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Wallet size={48} className="mx-auto mb-3 opacity-30" />
              No transactions yet
            </div>
          )}
        </div>
      </div>

      {/* INFO */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>💡 Withdrawal Info:</strong><br />
          • Minimum ₹100<br />
          • 2–3 business days<br />
          • No charges
        </p>
      </div>

    </div>
  );
};

const StatCard = ({icon,label,value}) => (
  <div className="bg-white p-4 rounded-xl shadow">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

const FilterBtn = ({title,active,onClick,color}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
      active
        ? `bg-${color}-600 text-white`
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`}
  >
    {title}
  </button>
);

// ================== Transaction Row ==================
const TransactionItem = ({ transaction }) => {
  const isCredit = transaction.type === 'credit';

  return (
    <div className="p-4 hover:bg-gray-50 transition">
      <div className="flex items-center gap-3">

        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isCredit ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isCredit 
            ? <ArrowDownLeft className="text-green-600" size={20}/>
            : <ArrowUpRight className="text-red-600" size={20}/>
          }
        </div>

        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <p className="font-semibold">
              {transaction.description || (isCredit ? "Ride Payment" : "Withdrawal")}
            </p>
            <p className={`font-bold ${isCredit ? "text-green-600":"text-red-600"}`}>
              {isCredit?"+":"-"}₹{transaction.amount.toFixed(2)}
            </p>
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{new Date(transaction.createdAt).toLocaleDateString("en-IN")}</span>
            <span className="capitalize">{transaction.status}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WalletTab;
