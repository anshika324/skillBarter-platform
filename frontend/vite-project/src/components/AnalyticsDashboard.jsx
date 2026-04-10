import { TrendingUp, TrendingDown, Users, BookOpen, Calendar, DollarSign } from 'lucide-react';

export default function AnalyticsDashboard({ stats }) {
  const metrics = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Active Skills',
      value: stats?.totalSkills || 0,
      change: '+8%',
      trend: 'up',
      icon: BookOpen,
      color: 'green'
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings || 0,
      change: '+23%',
      trend: 'up',
      icon: Calendar,
      color: 'purple'
    },
    {
      label: 'Credits Exchanged',
      value: stats?.totalCredits || 0,
      change: '-5%',
      trend: 'down',
      icon: DollarSign,
      color: 'orange'
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
        
        return (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${colorClasses[metric.color]}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span className="font-medium">{metric.change}</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500">{metric.label}</p>
          </div>
        );
      })}
    </div>
  );
}