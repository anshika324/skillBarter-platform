import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Calendar, MessageSquare, 
  Trophy, BarChart3, User, Settings, Menu, X,
  Briefcase, LogOut, Gift, Award, GraduationCap
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';


export default function Sidebar({ isOpen, toggleSidebar, onCollapseChange }) {
  const { logout } = useAuth();
  const { getTotalUnreadCount } = useSocket();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const unreadCount = getTotalUnreadCount ? getTotalUnreadCount() : 0;

  const handleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    if (onCollapseChange) {
      onCollapseChange(newCollapsed);
    }
  }; 

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'Browse Skills',
      path: '/skills',
      icon: BookOpen
    },
    {
      name: 'My Skills',
      path: '/my-skills',
      icon: Briefcase
    },
    {
      name: 'Bookings',
      path: '/bookings',
      icon: Calendar
    },
    {
      name: 'Messages',
      path: '/messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      name: 'Achievements',
      path: '/achievements',
      icon: Trophy
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: BarChart3
    },
    { name: 'Referrals', 
      path: '/referrals', 
      icon: Gift
     },
     { name: 'Certificates',
       path: '/certificates',
       icon: Award 
    },
    { name: 'Learning Paths',
      path: '/learning-paths',
      icon: BookOpen 
    },
    { name: 'My Learning',
      path: '/my-learning',
      icon: GraduationCap
    }
  ];

  const bottomItems = [
    {
      name: 'Profile',
      path: '/profile',
      icon: User
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings
    }
  ];

  const handleLogout = () => {
    logout();
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${collapsed ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!collapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SB</span>
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-rose-600 to-rose-800 bg-clip-text text-transparent">
                  SkillBarter
                </span>
              </div>
            )}
            
            {/* Toggle buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCollapse}
                className="hidden md:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative
                      ${isActive 
                        ? 'bg-rose-50 text-rose-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-rose-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    {!collapsed && (
                      <>
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto bg-rose-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    
                    {collapsed && item.badge && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          {/* Bottom Items */}
          <div className="border-t border-gray-200 p-3 space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-rose-600' : 'text-gray-500'}`} />
                  {!collapsed && <span className="font-medium">{item.name}</span>}
                </NavLink>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
