import { Lock, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AchievementCard({ achievement, action }) {
  const { isEarned, earnedAt, progress } = achievement;
  const currentProgress = progress?.current || 0;
  const totalProgress = progress?.total || achievement?.criteria?.threshold || 1;
  const progressPercent = (currentProgress / Math.max(totalProgress, 1)) * 100;
  const remaining = Math.max(totalProgress - currentProgress, 0);
  const isInteractive = !isEarned && Boolean(action?.to);

  const rarityColors = {
    common: 'border-gray-300 bg-gray-50',
    rare: 'border-blue-400 bg-blue-50',
    epic: 'border-purple-400 bg-purple-50',
    legendary: 'border-yellow-400 bg-yellow-50'
  };

  const rarityBadgeColors = {
    common: 'bg-gray-200 text-gray-700',
    rare: 'bg-blue-200 text-blue-700',
    epic: 'bg-purple-200 text-purple-700',
    legendary: 'bg-yellow-200 text-yellow-700'
  };

  const Wrapper = isInteractive ? Link : 'div';

  return (
    <Wrapper
      {...(isInteractive ? { to: action.to, title: action.hint || action.label } : {})}
      className={`relative rounded-xl border-2 p-6 transition-all ${
        rarityColors[achievement.rarity]
      } ${isEarned ? 'shadow-md' : 'shadow-sm'} ${
        isInteractive
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rose-300'
          : ''
      }`}
    >
      {/* Achievement Icon */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`text-4xl ${!isEarned && 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{achievement.name}</h3>
            {isEarned && <CheckCircle className="w-5 h-5 text-green-600" />}
            {!isEarned && <Lock className="w-4 h-4 text-gray-400" />}
          </div>
          
          <p className="text-sm text-gray-600">{achievement.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {!isEarned && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>
              {currentProgress} / {totalProgress}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-rose-500 to-rose-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            {remaining === 0
              ? 'Almost there. Refresh achievements to claim this badge.'
              : `Complete ${remaining} more ${action?.unitLabel || 'steps'} to unlock.`}
          </p>
        </div>
      )}

      {/* Earned Date */}
      {isEarned && earnedAt && (
        <p className="text-xs text-gray-500 mb-3">
          Earned {new Date(earnedAt).toLocaleDateString()}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            rarityBadgeColors[achievement.rarity]
          }`}
        >
          {achievement.rarity.toUpperCase()}
        </span>
        
        {achievement.reward?.credits > 0 && (
          <span className="text-sm font-medium text-rose-600">
            +{achievement.reward.credits} credits
          </span>
        )}
      </div>

      {isInteractive && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-sm text-rose-600 font-medium">
          <span>{action.label}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </Wrapper>
  );
}
