import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPointOfSale, MdShoppingCart, MdReceipt, MdBarChart, MdSettings, MdLogout } from 'react-icons/md';
import { signOut } from 'firebase/auth'; // Added import for signOut
import { auth } from '../services/firebase'; // Added import for auth

function Sidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Updated to use imported signOut and auth
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    { to: "/", text: "Dashboard", icon: <MdDashboard className="text-xl" /> },
    { to: "/sales", text: "Sales", icon: <MdPointOfSale className="text-xl" /> },
    { to: "/purchases", text: "Purchases", icon: <MdShoppingCart className="text-xl" /> },
    { to: "/expenses", text: "Expenses", icon: <MdReceipt className="text-xl" /> },
    { to: "/reports", text: "Reports", icon: <MdBarChart className="text-xl" /> },
    { to: "/settings", text: "Settings", icon: <MdSettings className="text-xl" /> },
  ];

  return (
    <div className={`w-64 h-screen bg-black fixed left-0 transition-all duration-300 ease-in-out z-30 flex flex-col
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl`}>
      <div className="p-4 bg-[#e82c2a]">
        <h2 className="text-2xl font-bold text-white">PayMe</h2>
      </div>
      <nav className="mt-6 flex-grow">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#e82c2a] hover:text-white rounded-lg transition-all duration-200"
              >
                {item.icon}
                <span className="ml-3">{item.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="px-4 pb-6">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-[#e82c2a] hover:text-white rounded-lg transition-all duration-200"
        >
          <MdLogout className="text-xl" onClick={handleSignOut} />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;