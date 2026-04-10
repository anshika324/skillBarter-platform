import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, Download, Share2, ExternalLink, Trophy,
  CheckCircle, Clock, AlertCircle, Copy
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('certificates');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, verifRes, statsRes] = await Promise.all([
        api.get('/verifications/my-certificates'),
        api.get('/verifications/my-verifications'),
        api.get('/verifications/stats')
      ]);

      setCertificates(certsRes.data);
      setVerifications(verifRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const shareCertificate = (certificateId) => {
    const url = `${window.location.origin}/certificates/verify/${certificateId}`;
    navigator.clipboard.writeText(url);
    toast.success('Certificate link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Certificates & Verifications</h1>
          <p className="text-gray-600 mt-1">Manage your skill certifications and verifications</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<Trophy className="w-6 h-6" />}
              label="Certificates"
              value={stats.certificates}
              color="yellow"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              label="Verified Skills"
              value={stats.verified}
              color="green"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              label="Pending"
              value={stats.pending}
              color="blue"
            />
            <StatCard
              icon={<Award className="w-6 h-6" />}
              label="Total Verifications"
              value={stats.total}
              color="purple"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('certificates')}
            className={`pb-3 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'certificates'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Certificates ({certificates.length})
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`pb-3 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'verifications'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Verifications ({verifications.length})
          </button>
        </div>

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div>
            {certificates.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Certificates Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Complete skill verifications to earn certificates
                </p>
                <Link
                  to="/skills"
                  className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Browse Skills
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <CertificateCard
                    key={cert._id}
                    certificate={cert}
                    onShare={shareCertificate}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verifications Tab */}
        {activeTab === 'verifications' && (
          <div>
            {verifications.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Verifications Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start verifying your skills to build credibility
                </p>
                <Link
                  to="/skills"
                  className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Browse Skills
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {verifications.map((verification) => (
                  <VerificationCard
                    key={verification._id}
                    verification={verification}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600'
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

function CertificateCard({ certificate, onShare }) {
  const badgeColors = {
    bronze: 'from-orange-400 to-orange-600',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600'
  };

  const getBadgeIcon = (badge) => {
    if (badge === 'platinum' || badge === 'gold') return <Trophy className="w-5 h-5" />;
    return <Award className="w-5 h-5" />;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Badge */}
      <div className={`w-16 h-16 bg-gradient-to-br ${badgeColors[certificate.badge]} rounded-full flex items-center justify-center text-white mb-4`}>
        {getBadgeIcon(certificate.badge)}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {certificate.skill?.title || certificate.title}
      </h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Badge:</span>
          <span className="font-medium text-gray-900 capitalize">{certificate.badge}</span>
        </div>
        
        {certificate.score && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Score:</span>
            <span className="font-medium text-green-600">{certificate.score}%</span>
          </div>
        )}
        
        {certificate.rating && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rating:</span>
            <span className="font-medium text-green-600">{certificate.rating.toFixed(1)}/5.0</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Issued:</span>
          <span className="text-gray-900">
            {new Date(certificate.issuedDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onShare(certificate.certificateId)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <Link
          to={`/certificates/verify/${certificate.certificateId}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
        >
          <ExternalLink className="w-4 h-4" />
          View
        </Link>
      </div>
    </div>
  );
}

function VerificationCard({ verification }) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_review: 'bg-blue-100 text-blue-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    in_review: <Clock className="w-4 h-4" />,
    verified: <CheckCircle className="w-4 h-4" />,
    rejected: <AlertCircle className="w-4 h-4" />
  };

  const methodLabels = {
    quiz: 'Quiz Assessment',
    portfolio: 'Portfolio Review',
    peer_review: 'Peer Review',
    expert_review: 'Expert Review',
    endorsement: 'Endorsements'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {verification.skill?.title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span>{methodLabels[verification.verificationMethod]}</span>
            <span>•</span>
            <span>{new Date(verification.createdAt).toLocaleDateString()}</span>
          </div>

          {verification.quiz?.score !== undefined && (
            <p className="text-sm text-gray-600">
              Score: <span className="font-medium">{verification.quiz.score}%</span>
            </p>
          )}

          {verification.peerReview?.averageRating && (
            <p className="text-sm text-gray-600">
              Average Rating: <span className="font-medium">{verification.peerReview.averageRating.toFixed(1)}/5.0</span>
            </p>
          )}

          {verification.endorsements?.length > 0 && (
            <p className="text-sm text-gray-600">
              Endorsements: <span className="font-medium">{verification.endorsements.length}</span>
            </p>
          )}
        </div>

        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusColors[verification.status]}`}>
          {statusIcons[verification.status]}
          {verification.status.replace('_', ' ')}
        </span>
      </div>

      {verification.rejectionReason && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <span className="font-medium">Rejection Reason:</span> {verification.rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
}