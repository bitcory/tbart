import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginButton from './auth/LoginButton';
import UserMenu from './auth/UserMenu';

const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="px-4 py-3 md:px-8 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer shrink-0">
          <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-200 leading-none">TB</span>
          <span className="text-base md:text-xl font-medium text-gray-300 tracking-wider leading-none hidden sm:block">아트콜렉션</span>
        </Link>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4 relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="프롬프트 검색..."
            className="w-full bg-[#1f1f1f] border border-gray-800 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* Auth Section */}
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <LoginButton />
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="프롬프트 검색..."
              autoFocus
              className="w-full bg-[#1f1f1f] border border-gray-800 text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
