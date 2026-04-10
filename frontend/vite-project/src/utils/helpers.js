import { format, formatDistance, isPast, isFuture, parseISO } from 'date-fns';

// Format date helpers
export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

// Skill categories
export const SKILL_CATEGORIES = [
  'Programming & Tech',
  'Design & Creative',
  'Writing & Translation',
  'Business & Marketing',
  'Music & Audio',
  'Video & Animation',
  'Teaching & Academics',
  'Lifestyle & Health',
  'Photography',
  'Language Learning',
  'Career & Professional',
  'Other'
];

// Skill levels
export const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', color: 'blue' },
  { value: 'intermediate', label: 'Intermediate', color: 'green' },
  { value: 'advanced', label: 'Advanced', color: 'orange' },
  { value: 'expert', label: 'Expert', color: 'purple' }
];

// Days of week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Get skill level color
export const getSkillLevelColor = (level) => {
  const colors = {
    beginner: 'bg-blue-100 text-blue-800',
    intermediate: 'bg-green-100 text-green-800',
    advanced: 'bg-orange-100 text-orange-800',
    expert: 'bg-purple-100 text-purple-800'
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
};

// Get booking status color
export const getBookingStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    'no-show': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Calculate credits from duration and rate
export const calculateCredits = (durationMinutes, creditsPerHour = 1) => {
  return Math.ceil((durationMinutes / 60) * creditsPerHour);
};

// Generate avatar URL
export const getAvatarUrl = (user) => {
  if (user.avatar) return user.avatar;
  const name = `${user.firstName}+${user.lastName}`;
  return `https://ui-avatars.com/api/?name=${name}&background=random`;
};

// Truncate text
export const truncate = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Format time (e.g., "14:30" to "2:30 PM")
export const formatTime = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};

// Generate time slots
export const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({
        value: timeString,
        label: formatTime(timeString)
      });
    }
  }
  return slots;
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Star rating display
export const getStarRating = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < fullStars; i++) {
    stars.push('★');
  }
  if (hasHalfStar) {
    stars.push('½');
  }
  while (stars.length < 5) {
    stars.push('☆');
  }
  
  return stars.join('');
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  getSkillLevelColor,
  getBookingStatusColor,
  calculateCredits,
  getAvatarUrl,
  truncate,
  generateTimeSlots,
  isValidEmail,
  getStarRating,
  debounce,
  SKILL_CATEGORIES,
  SKILL_LEVELS,
  DAYS_OF_WEEK
};