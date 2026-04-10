import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, CheckCircle, XCircle, MessageSquare, Star, Video } from 'lucide-react';
import { bookingsAPI, videoCallsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime, getBookingStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';
import ReviewModal from '../components/ReviewModal';

const Bookings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, pending
  const [role, setRole] = useState('all'); // all, provider, student
  const [reviewModal, setReviewModal] = useState(null);
  const [joiningCallBookingId, setJoiningCallBookingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [role]);

  const fetchBookings = async () => {
    try {
      const params = role === 'all' ? {} : { role };
      const response = await bookingsAPI.getAll(params);
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      const response = await bookingsAPI.confirm(bookingId);
      setBookings(bookings.map(b => b._id === bookingId ? response.data : b));
      toast.success('Booking confirmed!');
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    }
  };

  const handleComplete = async (bookingId) => {
    try {
      const response = await bookingsAPI.complete(bookingId, {});
      setBookings(bookings.map(b => b._id === bookingId ? response.data : b));
      updateUser({ timeCredits: user.timeCredits + response.data.creditsUsed });
      toast.success('Session completed! Credits earned.');
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    }
  };

  const handleCancel = async (bookingId) => {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    try {
      const response = await bookingsAPI.cancel(bookingId, { reason });
      setBookings(bookings.map(b => b._id === bookingId ? response.data : b));
      toast.success('Booking cancelled. Credits refunded.');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleJoinCall = async (booking) => {
    try {
      setJoiningCallBookingId(booking._id);

      const response = await videoCallsAPI.createFromBooking(booking._id);
      const roomId = response.data?.roomId;

      if (!roomId) {
        throw new Error('Call room was not created');
      }

      navigate(`/video-call/${roomId}`);
    } catch (error) {
      console.error('Error joining call:', error);
      toast.error(error.response?.data?.message || 'Failed to open video call');
    } finally {
      setJoiningCallBookingId(null);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (filter === 'upcoming') {
      filtered = filtered.filter(b => 
        (b.status === 'pending' || b.status === 'confirmed') && 
        new Date(b.scheduledDate) >= new Date()
      );
    } else if (filter === 'past') {
      filtered = filtered.filter(b => 
        b.status === 'completed' || 
        (b.status === 'cancelled' && new Date(b.scheduledDate) < new Date())
      );
    } else if (filter === 'pending') {
      filtered = filtered.filter(b => b.status === 'pending');
    }

    return filtered.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
  };

  const filteredBookings = filterBookings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-xl text-gray-600">Manage your skill exchange sessions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View as:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setRole('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    role === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRole('student')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    role === 'student'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  As Student
                </button>
                <button
                  onClick={() => setRole('provider')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    role === 'provider'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  As Provider
                </button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Show:</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'upcoming'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'past'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Past
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'You have no bookings yet. Start browsing skills!' 
                : `No ${filter} bookings found.`}
            </p>
            <Link to="/skills" className="btn btn-primary inline-flex">
              Browse Skills
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const isProvider = booking.provider._id === user._id;
              const otherUser = isProvider ? booking.student : booking.provider;
              const canConfirm = isProvider && booking.status === 'pending';
              const canComplete = isProvider && booking.status === 'confirmed' && new Date(booking.scheduledDate) < new Date();
              const canReview = !isProvider && booking.status === 'completed';
              const canCancel = booking.status === 'confirmed' || booking.status === 'pending';
              const canJoinVideoCall = booking.status === 'confirmed';
              const isJoiningThisCall = joiningCallBookingId === booking._id;

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.skill?.title}
                        </h3>
                        <span className={`badge ${getBookingStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="badge badge-secondary">
                          {isProvider ? 'As Provider' : 'As Student'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {booking.skill?.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {booking.creditsUsed} credits
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Date & Time */}
                    <div className="flex items-center text-gray-700">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <div className="font-medium">{formatDate(booking.scheduledDate)}</div>
                        <div className="text-sm text-gray-500">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </div>
                      </div>
                    </div>

                    {/* Other User */}
                    <div className="flex items-center text-gray-700">
                      <User className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {otherUser?.firstName} {otherUser?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {isProvider ? 'Student' : 'Provider'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {canConfirm && (
                      <button
                        onClick={() => handleConfirm(booking._id)}
                        className="btn btn-primary text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirm Booking
                      </button>
                    )}

                    {canComplete && (
                      <button
                        onClick={() => handleComplete(booking._id)}
                        className="btn bg-green-600 text-white hover:bg-green-700 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Completed
                      </button>
                    )}

                    {canReview && (
                      <button
                        onClick={() => setReviewModal(booking)}
                        className="btn btn-secondary text-sm"
                      >
                        <Star className="w-4 h-4" />
                        Leave Review
                      </button>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    )}

                    {canJoinVideoCall && (
                      <button
                        onClick={() => handleJoinCall(booking)}
                        disabled={isJoiningThisCall}
                        className="btn btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Video className="w-4 h-4" />
                        {isJoiningThisCall ? 'Joining...' : 'Join Video Call'}
                      </button>
                    )}

                    <Link
                      to={`/messages?user=${otherUser?._id}`}
                      className="btn btn-ghost text-sm"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <ReviewModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onSuccess={() => {
            setReviewModal(null);
            toast.success('Review submitted!');
            fetchBookings();
          }}
        />
      )}
    </div>
  );
};

export default Bookings;
