import { useState, useEffect } from 'react';
import { 
  Users, Gift, TrendingUp, Award, Copy, Share2, 
  Mail, MessageCircle, Facebook, Twitter, Check,
  Trophy, Zap, Star, Crown
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ReferralDashboard() {
  const [affiliate, setAffiliate] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [programRes, statsRes, leaderboardRes] = await Promise.all([
        api.get('/referrals/my-program'),
        api.get('/referrals/stats'),
        api.get('/referrals/leaderboard?limit=5')
      ]);

      setAffiliate(programRes.data);
      setStats(statsRes.data);
      const safeLeaderboard = Array.isArray(leaderboardRes.data)
        ? leaderboardRes.data.filter((item) => item && item.user)
        : [];
      setLeaderboard(safeLeaderboard);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/register?ref=${affiliate?.referralCode}`;
  };

  const copyReferralLink = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const shareViaEmail = () => {
    const subject = 'Join SkillBarter using my referral link';
    const body = `I'm using SkillBarter to exchange skills and learn new things. Join using my referral link:\n\n${getReferralLink()}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSocial = (platform) => {
    const link = getReferralLink();
    const text = 'Join me on SkillBarter using my referral link!';
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + link)}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const getTierIcon = (tier) => {
    const icons = {
      bronze: <Award className="w-6 h-6 text-orange-600" />,
      silver: <Star className="w-6 h-6 text-gray-400" />,
      gold: <Trophy className="w-6 h-6 text-yellow-500" />,
      platinum: <Crown className="w-6 h-6 text-purple-500" />
    };
    return icons[tier] || icons.bronze;
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'from-orange-400 to-orange-600',
      silver: 'from-gray-300 to-gray-500',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600'
    };
    return colors[tier] || colors.bronze;
  };

  const getNextTier = () => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(affiliate?.tier);
    if (currentIndex < tiers.length - 1) {
      const nextTier = tiers[currentIndex + 1];
      const required = affiliate?.tierProgress[nextTier]?.required || 0;
      const current = affiliate?.stats?.totalReferrals || 0;
      return { name: nextTier, required, current, remaining: required - current };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const nextTier = getNextTier();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-600 mt-1">Earn rewards by inviting friends to SkillBarter</p>
        </div>

        {/* Tier Card */}
        <div className={`bg-gradient-to-r ${getTierColor(affiliate?.tier)} rounded-xl p-6 text-white mb-8`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getTierIcon(affiliate?.tier)}
              <div>
                <h2 className="text-2xl font-bold capitalize">{affiliate?.tier} Tier</h2>
                <p className="text-white/90">
                  {affiliate?.stats?.totalReferrals} Referrals • {affiliate?.stats?.totalCreditsEarned} Credits Earned
                </p>
              </div>
            </div>
            
            {nextTier && (
              <div className="text-right">
                <p className="text-sm text-white/80">Next Tier: {nextTier.name.toUpperCase()}</p>
                <p className="text-lg font-semibold">{nextTier.remaining} more referrals</p>
                <div className="w-48 bg-white/30 rounded-full h-2 mt-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${(nextTier.current / nextTier.required) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Referrals"
            value={stats?.stats?.total || 0}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Active Referrals"
            value={affiliate?.stats?.activeReferrals || 0}
            color="green"
          />
          <StatCard
            icon={<Gift className="w-6 h-6" />}
            label="This Month"
            value={stats?.stats?.thisMonth || 0}
            color="purple"
          />
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            label="Bonus Multiplier"
            value={`${affiliate?.benefits?.bonusMultiplier}x`}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Link Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={getReferralLink()}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="text-sm text-gray-500">Share via</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={shareViaEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button
                  onClick={() => shareViaSocial('twitter')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </button>
                <button
                  onClick={() => shareViaSocial('facebook')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </button>
                <button
                  onClick={() => shareViaSocial('whatsapp')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
              
              {stats?.referrals?.length > 0 ? (
                <div className="space-y-3">
                  {stats.referrals.slice(0, 5).map((referral) => (
                    <div key={referral._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img
                          src={referral.referee?.avatar || `https://ui-avatars.com/api/?name=${referral.referee?.firstName}`}
                          alt={referral.referee?.firstName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {referral.referee?.firstName} {referral.referee?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          referral.status === 'completed' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {referral.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          +{referral.rewards.referrerCredits} credits
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No referrals yet. Start sharing your link!</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Benefits */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Benefits</h3>
              <div className="space-y-3">
                <BenefitItem
                  label="Referral Bonus"
                  value={`${affiliate?.benefits?.referralBonus} credits`}
                />
                <BenefitItem
                  label="Commission Rate"
                  value={`${affiliate?.benefits?.commissionRate}%`}
                />
                <BenefitItem
                  label="Bonus Multiplier"
                  value={`${affiliate?.benefits?.bonusMultiplier}x`}
                />
                <BenefitItem
                  label="Priority Support"
                  value={affiliate?.benefits?.prioritySupport ? 'Yes' : 'No'}
                />
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h3>
              <div className="space-y-3">
                {leaderboard.map((item, index) => (
                  <div key={item.user?._id || `${item.rank}-${index}`} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {item.rank}
                    </div>
                    <img
                      src={item.user?.avatar || `https://ui-avatars.com/api/?name=${item.user?.firstName}`}
                      alt={item.user?.firstName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.user?.firstName} {item.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{item.referrals} referrals</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function BenefitItem({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
