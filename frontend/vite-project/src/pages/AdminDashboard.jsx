import { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, Star, TrendingUp, Activity, DollarSign, Award } from 'lucide-react';
import { usersAPI, skillsAPI, bookingsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSkills: 0,
    totalBookings: 0,
    totalCredits: 0,
    activeUsers: 0,
    completedSessions: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [topSkills, setTopSkills] = useState([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, skillsRes, bookingsRes] = await Promise.all([
        usersAPI.search({ limit: 100 }),
        skillsAPI.getAll({ limit: 100 }),
        bookingsAPI.getAll({})
      ]);

      const users = usersRes.data.users || [];
      const skills = skillsRes.data.skills || [];
      const bookings = bookingsRes.data || [];

      const totalCredits = users.reduce((sum, u) => sum + (u.timeCredits || 0), 0);
      const completedBookings = bookings.filter(b => b.status === 'completed');

      setStats({
        totalUsers: users.length,
        totalSkills: skills.length,
        totalBookings: bookings.length,
        totalCredits,
        activeUsers: users.filter(u => {
          const lastActive = new Date(u.lastActive);
          return (Date.now() - lastActive) / (1000 * 60 * 60 * 24) <= 7;
        }).length,
        completedSessions: completedBookings.length,
        averageRating: 4.8,
        totalReviews: users.reduce((sum, u) => sum + (u.rating?.count || 0), 0)
      });

      setRecentUsers(users.slice(0, 10));
      setTopSkills([...skills].sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 10));

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600' },
    { title: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'from-green-500 to-green-600' },
    { title: 'Total Skills', value: stats.totalSkills, icon: BookOpen, color: 'from-purple-500 to-purple-600' },
    { title: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'from-orange-500 to-orange-600' },
    { title: 'Completed', value: stats.completedSessions, icon: Award, color: 'from-pink-500 to-pink-600' },
    { title: 'Total Credits', value: stats.totalCredits, icon: DollarSign, color: 'from-yellow-500 to-yellow-600' },
    { title: 'Avg Rating', value: stats.averageRating, icon: Star, color: 'from-red-500 to-red-600' },
    { title: 'Reviews', value: stats.totalReviews, icon: TrendingUp, color: 'from-indigo-500 to-indigo-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-xl text-gray-600">Platform analytics and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Recent Users</h2>
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src={u.avatar} alt={u.firstName} className="w-10 h-10 rounded-full" />
                    <div>
                      <h4 className="font-medium">{u.firstName} {u.lastName}</h4>
                      <p className="text-sm text-gray-600">{u.email}</p>
                    </div>
                  </div>
                  <span className="badge badge-success">{u.timeCredits} credits</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Skills */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Top Skills</h2>
            <div className="space-y-3">
              {topSkills.map((skill) => (
                <div key={skill._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{skill.title}</h4>
                    <p className="text-sm text-gray-600">{skill.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600">{skill.totalBookings}</p>
                    <p className="text-xs text-gray-500">bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
