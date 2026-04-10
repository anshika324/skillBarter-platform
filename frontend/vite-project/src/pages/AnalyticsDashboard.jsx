import { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Calendar, DollarSign, 
  TrendingUp, Award, MessageSquare, Star,
  Download, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import StatCard from '../components/StatCard';
import LineChart from '../components/LineChart';
import toast from 'react-hot-toast';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const [usersData, bookingsData, creditsData] = await Promise.all([
        api.get(`/analytics/chart/newUsers?period=${selectedPeriod}&limit=30`),
        api.get(`/analytics/chart/newBookings?period=${selectedPeriod}&limit=30`),
        api.get(`/analytics/chart/bookingValue?period=${selectedPeriod}&limit=30`)
      ]);

      setChartData({
        users: usersData.data,
        bookings: bookingsData.data,
        credits: creditsData.data
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post('/analytics/generate', { period: selectedPeriod });
      await fetchAnalytics();
      await fetchChartData();
      toast.success('Analytics refreshed successfully');
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast.error('Failed to refresh analytics');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success('Exporting analytics...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const currentMetrics = stats?.current || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Platform performance and insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={currentMetrics.totalUsers || 0}
            change={currentMetrics.userGrowthRate}
            changeType={currentMetrics.userGrowthRate > 0 ? 'up' : currentMetrics.userGrowthRate < 0 ? 'down' : 'neutral'}
            icon={Users}
            color="blue"
          />
          
          <StatCard
            title="Total Skills"
            value={currentMetrics.totalSkills || 0}
            change={15}
            changeType="up"
            icon={BookOpen}
            color="green"
          />
          
          <StatCard
            title="Total Bookings"
            value={currentMetrics.totalBookings || 0}
            change={currentMetrics.bookingGrowthRate}
            changeType={currentMetrics.bookingGrowthRate > 0 ? 'up' : currentMetrics.bookingGrowthRate < 0 ? 'down' : 'neutral'}
            icon={Calendar}
            color="purple"
          />
          
          <StatCard
            title="Credits Exchanged"
            value={currentMetrics.bookingValue || 0}
            change={12}
            changeType="up"
            icon={DollarSign}
            color="orange"
          />
          
          <StatCard
            title="Active Users"
            value={currentMetrics.activeUsers || 0}
            icon={TrendingUp}
            color="rose"
          />
          
          <StatCard
            title="Avg Session Duration"
            value={`${currentMetrics.averageSessionDuration || 0} min`}
            icon={Award}
            color="yellow"
          />
          
          <StatCard
            title="Total Messages"
            value={currentMetrics.totalMessages || 0}
            icon={MessageSquare}
            color="blue"
          />
          
          <StatCard
            title="Average Rating"
            value={currentMetrics.averageRating ? `${currentMetrics.averageRating}/5` : '0/5'}
            icon={Star}
            color="yellow"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {chartData.users && (
            <LineChart
              data={chartData.users}
              title="New Users Over Time"
              color="#3B82F6"
            />
          )}
          
          {chartData.bookings && (
            <LineChart
              data={chartData.bookings}
              title="New Bookings Over Time"
              color="#8B5CF6"
            />
          )}
        </div>

        {/* Credits Chart */}
        {chartData.credits && (
          <div className="mb-8">
            <LineChart
              data={chartData.credits}
              title="Credits Exchanged Over Time"
              color="#F59E0B"
            />
          </div>
        )}

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h3>
            <div className="space-y-3">
              <MetricRow label="Total Sessions" value={currentMetrics.totalSessions || 0} />
              <MetricRow label="Hours Teaching" value={currentMetrics.totalHoursTeaching || 0} />
              <MetricRow label="Hours Learning" value={currentMetrics.totalHoursLearning || 0} />
              <MetricRow label="Completed Bookings" value={currentMetrics.completedBookings || 0} />
            </div>
          </div>

          {/* Credit Metrics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credits</h3>
            <div className="space-y-3">
              <MetricRow label="In Circulation" value={currentMetrics.totalCreditsInCirculation || 0} />
              <MetricRow label="Total Earned" value={currentMetrics.creditsEarned || 0} />
              <MetricRow label="Total Spent" value={currentMetrics.creditsSpent || 0} />
              <MetricRow label="Avg Per User" value={currentMetrics.averageCreditsPerUser || 0} />
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
            <div className="space-y-3">
              <MetricRow label="Active Skills" value={currentMetrics.activeSkills || 0} />
              <MetricRow label="Total Reviews" value={currentMetrics.totalReviews || 0} />
              <MetricRow label="Cancelled Bookings" value={currentMetrics.cancelledBookings || 0} />
              <MetricRow label="Active Conversations" value={currentMetrics.activeConversations || 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}