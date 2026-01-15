import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const UserMenu: React.FC = () => {
  const { user, userData, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAdminClick = () => {
    navigate('/admin');
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full border-2 border-white/20"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-800">
            <p className="text-white font-medium truncate">{user.displayName}</p>
            <p className="text-gray-400 text-sm truncate">{user.email}</p>
            {userData?.role && (
              <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded ${
                isAdmin ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-700 text-gray-400'
              }`}>
                {userData.role}
              </span>
            )}
          </div>

          <div className="py-2">
            {isAdmin && (
              <button
                onClick={handleAdminClick}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 flex items-center gap-3 transition-colors"
              >
                <Settings className="w-4 h-4" />
                관리자 페이지
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
