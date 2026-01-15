import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginButton from './auth/LoginButton';
import UserMenu from './auth/UserMenu';

const Navbar: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <nav className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3 md:px-8 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 cursor-pointer">
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-200 leading-none">TB</span>
        <span className="text-lg md:text-xl font-medium text-gray-300 tracking-wider leading-none">아트콜렉션</span>
      </Link>

      {/* Search Bar - Hidden on small mobile, visible on md+ */}
      <div className="hidden md:flex flex-1 max-w-xl mx-8 relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="프롬프트 검색..."
          className="w-full bg-[#1f1f1f] border border-gray-800 text-gray-200 text-sm rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
        <div className="absolute inset-y-0 right-1 flex items-center">
          <button className="p-1.5 bg-gray-700/50 hover:bg-gray-600 rounded text-gray-400">
            <Search className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Auth Section */}
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <LoginButton />
        )}

        <button className="md:hidden p-2 text-gray-300">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
