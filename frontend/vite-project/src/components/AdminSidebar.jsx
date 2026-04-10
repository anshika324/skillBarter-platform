import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  Star, 
  Settings,
  FileText,
  TrendingUp
} from 'lucide-react';

export default function AdminSidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BookOpen, label: 'Skills', path: '/admin/skills' },
    { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
    { icon: Star, label: 'Reviews', path: '/admin/reviews' },
    { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
    { icon: FileText, label: 'Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">SkillBarter Management</p>
      </div>

      <nav className="px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}