import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ title, value, change, changeType, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    rose: 'bg-rose-100 text-rose-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  const getTrendIcon = () => {
    if (changeType === 'up') return <TrendingUp className="w-4 h-4" />;
    if (changeType === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (changeType === 'up') return 'text-green-600';
    if (changeType === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <h3 className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </h3>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}