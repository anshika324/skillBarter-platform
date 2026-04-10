import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Clock, BookOpen, MapPin, Calendar, MessageSquare, Award, TrendingUp } from 'lucide-react';
import { skillsAPI, reviewsAPI, bookingsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getSkillLevelColor, formatTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import BookingModal from '../components/BookingModal';
import ReviewCard from '../components/ReviewCard';

const SkillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [skill, setSkill] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchSkillDetails();
    fetchReviews();
  }, [id]);

  const fetchSkillDetails = async () => {
    try {
      const response = await skillsAPI.getById(id);
      setSkill(response.data);
    } catch (error) {
      console.error('Error fetching skill:', error);
      toast.error('Failed to load skill details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewsAPI.getBySkill(id);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a session');
      navigate('/login');
      return;
    }
    setShowBookingModal(true);
  };

  const handleMessage = () => {
    if (!isAuthenticated) {
      toast.error('Please login to send a message');
      navigate('/login');
      return;
    }
    navigate(`/messages?user=${skill.provider._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Skill not found</h2>
          <Link to="/skills" className="text-primary-600 hover:text-primary-700">
            Browse all skills
          </Link>
        </div>
      </div>
    );
  }

  const isOwnSkill = user?._id === skill.provider._id;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link to="/skills" className="text-gray-500 hover:text-gray-700">Skills</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{skill.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <span className={`badge ${getSkillLevelColor(skill.skillLevel)} mb-4`}>
                {skill.skillLevel}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{skill.title}</h1>
              
              <div className="flex items-center space-x-6 text-gray-600 mb-6">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-400 mr-1" />
                  <span className="font-semibold">{skill.rating?.average?.toFixed(1) || 'New'}</span>
                  <span className="ml-1">({skill.rating?.count || 0} reviews)</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-1" />
                  <span>{skill.totalBookings} sessions completed</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {skill.tags?.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About this skill</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{skill.description}</p>
            </div>

            {/* What you'll learn */}
            {skill.whatYouWillLearn && skill.whatYouWillLearn.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What you'll learn</h2>
                <ul className="space-y-3">
                  {skill.whatYouWillLearn.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Award className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {skill.prerequisites && skill.prerequisites.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {skill.prerequisites.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Reviews ({reviews.length})
              </h2>
              
              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to book and review!</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24 mb-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center text-3xl font-bold text-primary-600 mb-2">
                  <BookOpen className="w-8 h-8 mr-2" />
                  {Math.ceil((skill.duration / 60) * skill.creditsPerHour)} credits
                </div>
                <p className="text-gray-600 text-sm">per session</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{skill.duration} minutes</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{skill.availableDays?.join(', ') || 'Flexible'}</span>
                </div>
              </div>

              {isOwnSkill ? (
                <>
                  <Link
                    to={`/skills/${skill._id}/edit`}
                    className="w-full btn btn-secondary py-3 text-lg mb-3"
                  >
                    Edit Your Skill
                  </Link>
                  <Link
                    to={`/skills/${skill._id}/verify`}
                    className="w-full btn btn-primary py-3 text-lg"
                  >
                    Get Verified
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={handleBooking}
                    className="w-full btn btn-primary py-3 text-lg mb-3"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Session
                  </button>
                  <button
                    onClick={handleMessage}
                    className="w-full btn btn-outline py-3"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message Provider
                  </button>
                </>
              )}
            </div>

            {/* Provider Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the provider</h3>
              
              <Link 
                to={`/profile/${skill.provider._id}`}
                className="flex items-center mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <img
                  src={skill.provider.avatar}
                  alt={skill.provider.firstName}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {skill.provider.firstName} {skill.provider.lastName}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span>{skill.provider.rating?.average?.toFixed(1) || 'New'}</span>
                    <span className="mx-1">•</span>
                    <span>{skill.provider.completedSessions || 0} sessions</span>
                  </div>
                </div>
              </Link>

              {skill.provider.bio && (
                <p className="text-gray-700 text-sm leading-relaxed">
                  {skill.provider.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          skill={skill}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            toast.success('Booking request sent!');
            navigate('/bookings');
          }}
        />
      )}
    </div>
  );
};

export default SkillDetail;
