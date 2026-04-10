import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Award, Calendar, Trophy, Star } from 'lucide-react';
import api from '../utils/api';

export default function CertificateVerificationPage() {
  const { certificateId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyCertificate();
  }, [certificateId]);

  const verifyCertificate = async () => {
    try {
      const response = await api.get(`/verifications/verify/${certificateId}`);
      setResult(response.data);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setResult({ valid: false, message: 'Error verifying certificate' });
    } finally {
      setLoading(false);
    }
  };

  const badgeColors = {
    bronze: 'from-orange-400 to-orange-600',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="text-gray-600 mt-2">Verify the authenticity of a SkillBarter certificate</p>
        </div>

        {result?.valid ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              ✅ Verified Certificate
            </h2>
            <p className="text-center text-gray-600 mb-8">
              This is an authentic SkillBarter certificate
            </p>

            {/* Certificate Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              {/* Badge */}
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 bg-gradient-to-br ${badgeColors[result.certificate.badge]} rounded-full flex items-center justify-center text-white shadow-lg`}>
                  {result.certificate.badge === 'platinum' || result.certificate.badge === 'gold' ? (
                    <Trophy className="w-12 h-12" />
                  ) : (
                    <Award className="w-12 h-12" />
                  )}
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {result.certificate.recipient}
                </h3>
                <p className="text-lg text-gray-600">
                  has been verified in
                </p>
                <p className="text-2xl font-semibold text-rose-600 mt-2">
                  {result.certificate.skill}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <DetailItem
                  label="Certificate ID"
                  value={result.certificate.id}
                />
                <DetailItem
                  label="Badge Level"
                  value={result.certificate.badge}
                  capitalize
                />
                <DetailItem
                  label="Issued Date"
                  value={new Date(result.certificate.issuedDate).toLocaleDateString()}
                />
                <DetailItem
                  label="Verification Method"
                  value={result.certificate.verificationMethod.replace('_', ' ')}
                  capitalize
                />
                {result.certificate.score && (
                  <DetailItem
                    label="Quiz Score"
                    value={`${result.certificate.score}%`}
                  />
                )}
                {result.certificate.rating && (
                  <DetailItem
                    label="Rating"
                    value={`${result.certificate.rating.toFixed(1)}/5.0`}
                  />
                )}
              </div>

              {result.certificate.expiresDate && (
                <div className="text-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Expires: {new Date(result.certificate.expiresDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Verification Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 text-center">
                🔒 This certificate has been cryptographically verified and is issued by SkillBarter
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              ❌ Invalid Certificate
            </h2>
            <p className="text-center text-gray-600 mb-6">
              {result?.message || 'This certificate could not be verified'}
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This certificate ID does not match any valid SkillBarter certificates. 
                It may be fake, expired, or revoked.
              </p>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Return to Homepage
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by <span className="font-semibold text-rose-600">SkillBarter</span>
          </p>
          <p className="mt-1">
            All certificates are verified using cryptographic hashing
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, capitalize }) {
  return (
    <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`font-semibold text-gray-900 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  );
}