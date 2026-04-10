import { useEffect, useState } from 'react';
import { X, Clock, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function BookingModal({ skill, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    startTime: '',
    duration: skill.duration || 60,
    notes: '',
  });

  const creditsNeeded = Math.ceil((formData.duration / 60) * skill.creditsPerHour);
  const hasEnoughCredits = user.timeCredits >= creditsNeeded;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasEnoughCredits) {
      toast.error('Insufficient credits for this booking');
      return;
    }

    setLoading(true);
    try {
      const endTime = calculateEndTime(formData.startTime, formData.duration);
      
      const response = await api.post('/bookings', {
        skillId: skill._id,
        providerId: skill.provider._id,
        scheduledDate: formData.scheduledDate,
        startTime: formData.startTime,
        endTime,
        duration: formData.duration,
        notes: formData.notes,
      });

      toast.success('Booking created successfully!');
      onSuccess && onSuccess(response.data);
      onClose();
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4 sm:p-6">
      <div className="min-h-full flex items-start sm:items-center justify-center">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto">
          <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Book Session</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skill Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-1">{skill.title}</h3>
          <p className="text-sm text-gray-600">
            with {skill.provider.firstName} {skill.provider.lastName}
          </p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{skill.duration} mins</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              <span>{skill.creditsPerHour} credits/hr</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any specific topics or questions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Credits Info */}
          <div className={`p-4 rounded-lg ${hasEnoughCredits ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Credits needed:</span>
              <span className="font-semibold">{creditsNeeded}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-700">Your balance:</span>
              <span className={`font-semibold ${hasEnoughCredits ? 'text-green-600' : 'text-red-600'}`}>
                {user.timeCredits}
              </span>
            </div>
            {!hasEnoughCredits && (
              <p className="text-xs text-red-600 mt-2">
                You need {creditsNeeded - user.timeCredits} more credits
              </p>
            )}
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
              disabled={loading || !hasEnoughCredits}
              className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
}
