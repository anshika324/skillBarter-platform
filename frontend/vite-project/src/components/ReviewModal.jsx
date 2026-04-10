import { useState } from 'react';
import { X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    aspects: {
      communication: 5,
      expertise: 5,
      punctuality: 5,
      helpfulness: 5,
    },
    wouldRecommend: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/reviews', {
        bookingId: booking._id,
        ...formData,
      });

      toast.success('Review submitted successfully!');
      onSuccess && onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-1">{booking.skill.title}</h3>
          <p className="text-sm text-gray-600">
            with {booking.provider.firstName} {booking.provider.lastName}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Rating
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review
            </label>
            <textarea
              required
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              placeholder="Share your experience with this session..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Detailed Aspects */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Rate specific aspects</h3>
            <StarRating
              label="Communication"
              value={formData.aspects.communication}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  aspects: { ...formData.aspects, communication: val },
                })
              }
            />
            <StarRating
              label="Expertise"
              value={formData.aspects.expertise}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  aspects: { ...formData.aspects, expertise: val },
                })
              }
            />
            <StarRating
              label="Punctuality"
              value={formData.aspects.punctuality}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  aspects: { ...formData.aspects, punctuality: val },
                })
              }
            />
            <StarRating
              label="Helpfulness"
              value={formData.aspects.helpfulness}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  aspects: { ...formData.aspects, helpfulness: val },
                })
              }
            />
          </div>

          {/* Would Recommend */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recommend"
              checked={formData.wouldRecommend}
              onChange={(e) =>
                setFormData({ ...formData, wouldRecommend: e.target.checked })
              }
              className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500"
            />
            <label htmlFor="recommend" className="text-sm text-gray-700">
              I would recommend this provider to others
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}