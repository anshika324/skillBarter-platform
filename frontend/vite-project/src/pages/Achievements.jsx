import { useState, useEffect } from 'react';
import { Trophy, Target, TrendingUp, Users } from 'lucide-react';
import api from '../utils/api';
import LevelProgress from '../components/LevelProgress';
import AchievementCard from '../components/AchievementCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const metricActions = {
  sessionsCompleted: {
    to: '/bookings',
    label: 'Go to Bookings',
    unitLabel: 'sessions'
  },
  hoursTeaching: {
    to: '/bookings',
    label: 'Teach a Session',
    unitLabel: 'teaching hours'
  },
  hoursLearning: {
    to: '/bookings',
    label: 'Book a Session',
    unitLabel: 'learning hours'
  },
  streak: {
    to: '/bookings',
    label: 'Keep Learning Daily',
    unitLabel: 'streak days'
  },
  creditsEarned: {
    to: '/bookings',
    label: 'Complete Paid Sessions',
    unitLabel: 'credits'
  },
  referrals: {
    to: '/referrals',
    label: 'Open Referrals',
    unitLabel: 'referrals'
  },
  skillsOffered: {
    to: '/skills/create',
    label: 'Offer a New Skill',
    unitLabel: 'skills'
  },
  reviews: {
    to: '/bookings',
    label: 'Complete Sessions',
    unitLabel: 'reviews'
  }
};

function getAchievementAction(achievement) {
  return (
    metricActions[achievement?.criteria?.metric] || {
      to: '/bookings',
      label: 'Open Bookings',
      unitLabel: 'steps'
    }
  );
}

export default function Achievements() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('achievements');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, achievementsRes, leaderboardRes] = await Promise.all([
        api.get('/gamification/stats'),
        api.get('/gamification/achievements'),
        api.get('/gamification/leaderboard?limit=10')
      ]);

      setStats(statsRes.data);
      setAchievements(achievementsRes.data);
      setLeaderboard(
        Array.isArray(leaderboardRes.data)
          ? leaderboardRes.data.filter((entry) => entry?.user)
          : []
      );
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'stats', label: 'Statistics', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp },
  ];

  const earnedAchievements = achievements.filter(a => a.isEarned);
  const inProgressAchievements = achievements.filter(a => !a.isEarned);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Achievements & Progress
          </h1>
          <p className="text-gray-600">
            Track your learning journey and earn rewards
          </p>
        </div>

        {/* Level Progress Card */}
        {stats && (
          <div className="mb-8">
            <LevelProgress stats={stats} />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-rose-600 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Locked achievements unlock automatically as you complete activity. Click any locked card to jump to the next action.
              </div>

              {/* Earned Achievements */}
              {earnedAchievements.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Earned ({earnedAchievements.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {earnedAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement._id}
                        achievement={achievement}
                        action={getAchievementAction(achievement)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress */}
              {inProgressAchievements.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    In Progress ({inProgressAchievements.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement._id}
                        achievement={achievement}
                        action={getAchievementAction(achievement)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {earnedAchievements.length === 0 && inProgressAchievements.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                  <Trophy className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Achievements Are Being Prepared
                  </h3>
                  <p className="text-gray-600 mb-6">
                    No achievement definitions were found yet. Refresh to load newly seeded achievements.
                  </p>
                  <button
                    onClick={fetchData}
                    className="btn btn-primary"
                  >
                    Refresh Achievements
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Teaching Stats"
                icon="👨‍🏫"
                stats={[
                  { label: 'Sessions', value: stats.totals.sessionsAsTeacher },
                  { label: 'Hours', value: Math.round(stats.totals.hoursTeaching) },
                  { label: 'Credits Earned', value: stats.totals.creditsEarned },
                  { label: 'Current Streak', value: `${stats.streaks.teaching.current} days` },
                ]}
              />

              <StatCard
                title="Learning Stats"
                icon="📚"
                stats={[
                  { label: 'Sessions', value: stats.totals.sessionsAsStudent },
                  { label: 'Hours', value: Math.round(stats.totals.hoursLearning) },
                  { label: 'Credits Spent', value: stats.totals.creditsSpent },
                  { label: 'Current Streak', value: `${stats.streaks.learning.current} days` },
                ]}
              />

              <StatCard
                title="Overall Stats"
                icon="⭐"
                stats={[
                  { label: 'Level', value: stats.level },
                  { label: 'Experience', value: stats.experience },
                  { label: 'Badges', value: stats.badges.length },
                  { label: 'Skills Offered', value: stats.totals.skillsOffered },
                ]}
              />
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Top Contributors</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Based on total experience points
                </p>
              </div>

              {leaderboard.length === 0 ? (
                <div className="p-10 text-center">
                  <Users className="w-14 h-14 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Leaderboard Is Empty</h3>
                  <p className="text-gray-600">Complete sessions to start ranking on the board.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.user?._id || `leader-${entry.rank}-${index}`}
                      className={`p-4 flex items-center gap-4 ${
                        entry.user?._id === user?._id ? 'bg-rose-50' : ''
                      }`}
                    >
                      {/* Rank */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-600'
                            : index === 1
                            ? 'bg-gray-100 text-gray-600'
                            : index === 2
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {entry.rank}
                      </div>

                      {/* User Info */}
                      <img
                        src={entry.user?.avatar || `https://ui-avatars.com/api/?name=${entry.user?.firstName || 'User'}`}
                        alt={`${entry.user?.firstName || 'User'} ${entry.user?.lastName || ''}`}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {entry.user?.firstName} {entry.user?.lastName}
                          {entry.user?._id === user?._id && (
                            <span className="ml-2 text-xs text-rose-600 font-normal">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Level {entry.level} • {entry.badges} badges
                        </p>
                      </div>

                      {/* Experience */}
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {(entry.experience || 0).toLocaleString()} XP
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.stats?.hoursTeaching || 0} hrs teaching
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, icon, stats }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{stat.label}</span>
            <span className="font-semibold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
