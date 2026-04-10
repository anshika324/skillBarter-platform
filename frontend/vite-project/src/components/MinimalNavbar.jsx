import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Menu, Bell, BookOpen, ChevronDown, 
  User, Settings, LogOut, Search
} from 'lucide-react';

export default function MinimalNavbar({ toggleSidebar }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalUnreadCount, connected } = useSocket();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = getTotalUnreadCount ? getTotalUnreadCount() : 0;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'User';
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  const avatarSeed = `${user?._id || ''}${fullName}`;
  const avatarThemes = [
    'from-rose-500 to-orange-400',
    'from-sky-500 to-cyan-400',
    'from-emerald-500 to-teal-400',
    'from-fuchsia-500 to-violet-500',
    'from-amber-500 to-orange-500'
  ];
  const avatarThemeIndex = Array.from(avatarSeed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarThemes.length;
  const avatarTheme = avatarThemes[avatarThemeIndex];
  const hasCustomAvatar = Boolean(user?.avatar) && !user.avatar.includes('ui-avatars.com');

  const renderAvatar = ({ size = 'w-9 h-9', textSize = 'text-sm' } = {}) => {
    if (hasCustomAvatar) {
      return (
        <img
          src={user.avatar}
          alt={user?.firstName || 'User'}
          className={`${size} rounded-full object-cover ring-2 ring-white shadow-sm border border-rose-100`}
        />
      );
    }

    return (
      <div className={`${size} relative rounded-full bg-gradient-to-br ${avatarTheme} flex items-center justify-center ring-2 ring-white shadow-sm`}>
        <span className="absolute inset-[2px] rounded-full border border-white/30"></span>
        <span className={`relative font-semibold text-white ${textSize}`}>{initials}</span>
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/skills?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show navbar when not logged in
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 h-16">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side - Mobile Menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills, keywords, or providers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>

        {/* Right Side - User Info */}
        <div className="flex items-center gap-4">
          {/* Online Status */}
          {connected && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>
          )}

          {/* Credits Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg">
            <BookOpen className="w-4 h-4 text-rose-600" />
            <span className="font-semibold text-rose-700">{user?.timeCredits || 0}</span>
            <span className="hidden sm:inline text-sm text-rose-600">credits</span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => navigate('/messages')}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {renderAvatar({ size: 'w-9 h-9', textSize: 'text-sm' })}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.firstName}</p>
                <p className="text-xs text-gray-500">View profile</p>
              </div>
              <ChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {renderAvatar({ size: 'w-11 h-11', textSize: 'text-base' })}
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setUserMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
