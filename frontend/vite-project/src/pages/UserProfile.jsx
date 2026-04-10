import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Calendar, Award, BookOpen, Edit, MessageSquare } from 'lucide-react';
import { usersAPI, skillsAPI, reviewsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getSkillLevelColor } from '../utils/helpers';
import ReviewCard from '../components/ReviewCard';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  const isOwnProfile = currentUser?._id === id || (!id && isAuthenticated);
  const userId = id || currentUser?._id;

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const [userRes, skillsRes, reviewsRes] = await Promise.all([
        usersAPI.getById(userId),
        skillsAPI.getByUser(userId),
        reviewsAPI.getByUser(userId)
      ]);

      setUser(userRes.data);
      setSkills(skillsRes.data);
      setReviews(reviewsRes.data.reviews);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const teachingSkills =
    user.teachingSkills && user.teachingSkills.length > 0
      ? user.teachingSkills
      : user.skills || [];

  const learningSkills =
    user.learningSkills && user.learningSkills.length > 0
      ? user.learningSkills
      : (user.interests || []).map((name) => ({
          name,
          currentLevel: 'beginner',
          targetLevel: 'intermediate',
          priority: 3
        }));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <img
              src={user.avatar}
              alt={user.firstName}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
            />

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user.firstName} {user.lastName}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="font-semibold">{user.rating?.average?.toFixed(1) || 'New'}</span>
                  <span className="ml-1">({user.rating?.count || 0} reviews)</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-5 h-5 mr-1" />
                  <span>{user.completedSessions || 0} sessions completed</span>
                </div>
                {user.location?.city && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-1" />
                    <span>{user.location.city}, {user.location.country}</span>
                  </div>
                )}
              </div>

              {user.bio && (
                <p className="text-gray-700 leading-relaxed mb-4">
                  {user.bio}
                </p>
              )}

              {/* Credits Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-semibold">
                <BookOpen className="w-5 h-5 mr-2" />
                {user.timeCredits} time credits
              </div>
              {user.matchProfileCompleted && (
                <div className="inline-flex items-center ml-3 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-semibold">
                  <Award className="w-5 h-5 mr-2" />
                  Match Profile Ready
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              {isOwnProfile ? (
                <Link
                  to="/settings"
                  className="btn btn-primary"
                >
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </Link>
              ) : (
                <>
                  <Link
                    to={`/messages?user=${user._id}`}
                    className="btn btn-primary"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Send Message
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'skills'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Skills ({skills.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-8">
                {/* Skills You Can Teach */}
                {teachingSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills They Can Teach</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teachingSkills.map((skill, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                            <span className={`badge ${getSkillLevelColor(skill.level)}`}>
                              {skill.level}
                            </span>
                          </div>
                          {skill.yearsOfExperience && (
                            <p className="text-sm text-gray-600">
                              {skill.yearsOfExperience} years experience
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills To Learn */}
                {learningSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills They Want To Learn</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {learningSkills.map((skill, index) => (
                        <div key={index} className="bg-secondary-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{skill.name}</h4>
                          <p className="text-sm text-gray-600 mt-1 capitalize">
                            {skill.currentLevel || 'beginner'} to {skill.targetLevel || 'intermediate'}
                          </p>
                          {skill.priority && (
                            <p className="text-xs text-gray-600 mt-1">Priority: {skill.priority}/5</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match Preferences */}
                {user.matchPreferences && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Session mode</p>
                        <p className="font-medium capitalize">
                          {user.matchPreferences.preferredSessionMode || 'online'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Timezone</p>
                        <p className="font-medium">{user.matchPreferences.timezone || 'UTC'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Languages */}
                {user.languages && user.languages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {user.languages.map((lang, index) => (
                        <div key={index} className="text-center bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-900">{lang.language}</div>
                          <div className="text-sm text-gray-600 capitalize">{lang.proficiency}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Member Since */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Since</h3>
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <div>
                {skills.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No skills offered yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {skills.map((skill) => (
                      <Link
                        key={skill._id}
                        to={`/skills/${skill._id}`}
                        className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className={`badge ${getSkillLevelColor(skill.skillLevel)}`}>
                            {skill.skillLevel}
                          </span>
                          <span className="text-sm text-gray-600">
                            {Math.ceil((skill.duration / 60) * skill.creditsPerHour)} credits
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {skill.title}
                        </h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {skill.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            {skill.rating?.average?.toFixed(1) || 'New'}
                          </div>
                          <div className="text-gray-600">
                            {skill.totalBookings} bookings
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <ReviewCard key={review._id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
