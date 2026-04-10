import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Menu, X, Bell, User, LogOut, BookOpen, Settings, 
  Trophy, BarChart3, ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalUnreadCount, connected } = useSocket();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const renderAvatar = ({ size = 'w-8 h-8', textSize = 'text-sm' } = {}) => {
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
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">SB</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-rose-800 bg-clip-text text-transparent">
              SkillBarter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/skills" className="text-gray-700 hover:text-rose-600 font-medium transition-colors">
              Browse Skills
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/my-skills" className="text-gray-700 hover:text-rose-600 font-medium transition-colors">
                  My Skills
                </Link>
                <Link to="/bookings" className="text-gray-700 hover:text-rose-600 font-medium transition-colors">
                  Bookings
                </Link>
                <Link to="/messages" className="text-gray-700 hover:text-rose-600 font-medium transition-colors relative">
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/achievements" className="flex items-center gap-1 text-gray-700 hover:text-rose-600 font-medium transition-colors">
                  <Trophy className="w-4 h-4" />
                  <span>Achievements</span>
                </Link>
                <Link to="/analytics" className="flex items-center gap-1 text-gray-700 hover:text-rose-600 font-medium transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Socket Status */}
                {connected && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Online</span>
                  </div>
                )}

                {/* Credits Badge */}
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-rose-50 rounded-lg">
                  <BookOpen className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold text-rose-700">{user?.timeCredits || 0}</span>
                  <span className="text-sm text-rose-600">credits</span>
                </div>

                {/* Notifications Bell */}
                <button 
                  onClick={() => navigate('/messages')}
                  className="relative p-2 text-gray-600 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-1.5 pl-2 pr-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {renderAvatar({ size: 'w-8 h-8', textSize: 'text-xs' })}
                    <span className="font-medium text-gray-700 text-sm">{user?.firstName}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            {renderAvatar({ size: 'w-10 h-10', textSize: 'text-sm' })}
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">My Profile</span>
                        </Link>
                        
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Settings</span>
                        </Link>
                        
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-2 hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-600 font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-gray-700 hover:text-rose-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium transition-colors shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/skills"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
            >
              Browse Skills
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-skills"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  My Skills
                </Link>
                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  Bookings
                </Link>
                <Link
                  to="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/achievements"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Achievements</span>
                </Link>
                <Link
                  to="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
                
                {/* Credits Display */}
                <div className="flex items-center space-x-2 px-3 py-2 bg-rose-50 rounded-lg mt-3">
                  <BookOpen className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold text-rose-700">{user?.timeCredits || 0} credits</span>
                </div>
                
                <hr className="my-3 border-gray-200" />
                
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 font-medium text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-gray-100 font-medium text-gray-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg bg-rose-600 text-white font-medium text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
