import { TrendingUp, Award, Zap } from 'lucide-react';

export default function LevelProgress({ stats }) {
  const progressPercent = ((stats.experience - (Math.pow(stats.level - 1, 2) * 50)) / 
    (Math.pow(stats.level, 2) * 50 - Math.pow(stats.level - 1, 2) * 50)) * 100;

  return (
    <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-rose-100 text-sm font-medium">Your Level</p>
          <h2 className="text-4xl font-bold mt-1">Level {stats.level}</h2>
        </div>
        <div className="bg-white/20 p-4 rounded-xl">
          <Award className="w-8 h-8" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-rose-100">Experience</span>
          <span className="font-medium">
            {stats.experience} / {Math.pow(stats.level, 2) * 50}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4" />
            <p className="text-2xl font-bold">{stats.totals.sessionsAsTeacher + stats.totals.sessionsAsStudent}</p>
          </div>
          <p className="text-xs text-rose-100">Sessions</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4" />
            <p className="text-2xl font-bold">
              {Math.max(stats.streaks.teaching.current, stats.streaks.learning.current)}
            </p>
          </div>
          <p className="text-xs text-rose-100">Day Streak</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="w-4 h-4" />
            <p className="text-2xl font-bold">{stats.badges.length}</p>
          </div>
          <p className="text-xs text-rose-100">Badges</p>
        </div>
      </div>
    </div>
  );
}