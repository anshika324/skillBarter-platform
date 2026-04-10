import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Save } from 'lucide-react';
import { skillsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SKILL_CATEGORIES, SKILL_LEVELS, DAYS_OF_WEEK } from '../utils/helpers';
import toast from 'react-hot-toast';

const CreateEditSkill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: SKILL_CATEGORIES[1],
    description: '',
    skillLevel: 'beginner',
    duration: 60,
    creditsPerHour: 1,
    tags: [],
    availableDays: [],
    prerequisites: [],
    whatYouWillLearn: [],
    maxStudentsPerSession: 1
  });

  const [newTag, setNewTag] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newLearning, setNewLearning] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchSkill();
    }
  }, [id]);

  const fetchSkill = async () => {
    try {
      const response = await skillsAPI.getById(id);
      const skill = response.data;
      
      // Check if user owns this skill
      if (skill.provider._id !== user._id) {
        toast.error('You can only edit your own skills');
        navigate('/my-skills');
        return;
      }

      setFormData({
        title: skill.title,
        category: skill.category,
        description: skill.description,
        skillLevel: skill.skillLevel,
        duration: skill.duration,
        creditsPerHour: skill.creditsPerHour,
        tags: skill.tags || [],
        availableDays: skill.availableDays || [],
        prerequisites: skill.prerequisites || [],
        whatYouWillLearn: skill.whatYouWillLearn || [],
        maxStudentsPerSession: skill.maxStudentsPerSession || 1
      });
    } catch (error) {
      console.error('Error fetching skill:', error);
      toast.error('Failed to load skill');
      navigate('/my-skills');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDayToggle = (day) => {
    setFormData({
      ...formData,
      availableDays: formData.availableDays.includes(day)
        ? formData.availableDays.filter(d => d !== day)
        : [...formData.availableDays, day]
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      setFormData({ ...formData, prerequisites: [...formData.prerequisites, newPrerequisite.trim()] });
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index) => {
    setFormData({
      ...formData,
      prerequisites: formData.prerequisites.filter((_, i) => i !== index)
    });
  };

  const addLearning = () => {
    if (newLearning.trim()) {
      setFormData({ ...formData, whatYouWillLearn: [...formData.whatYouWillLearn, newLearning.trim()] });
      setNewLearning('');
    }
  };

  const removeLearning = (index) => {
    setFormData({
      ...formData,
      whatYouWillLearn: formData.whatYouWillLearn.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await skillsAPI.update(id, formData);
        toast.success('Skill updated successfully!');
      } else {
        await skillsAPI.create(formData);
        toast.success('Skill created successfully!');
      }
      navigate('/my-skills');
    } catch (error) {
      console.error('Error saving skill:', error);
      toast.error(error.response?.data?.message || 'Failed to save skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {isEdit ? 'Edit Skill' : 'Offer a New Skill'}
          </h1>
          <p className="text-xl text-gray-600">
            Share your expertise and help others learn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Python Programming for Beginners"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="input"
                  >
                    {SKILL_CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level *
                  </label>
                  <select
                    name="skillLevel"
                    required
                    value={formData.skillLevel}
                    onChange={handleChange}
                    className="input"
                  >
                    {SKILL_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="input"
                  placeholder="Describe what you'll teach, your experience, and what makes your approach unique..."
                />
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Session Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  required
                  min="15"
                  max="480"
                  step="15"
                  value={formData.duration}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credits per Hour *
                </label>
                <input
                  type="number"
                  name="creditsPerHour"
                  required
                  min="1"
                  max="5"
                  value={formData.creditsPerHour}
                  onChange={handleChange}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">Standard: 1 credit/hour</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Students
                </label>
                <input
                  type="number"
                  name="maxStudentsPerSession"
                  min="1"
                  max="10"
                  value={formData.maxStudentsPerSession}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Availability</h2>
            <p className="text-gray-600 mb-4">Select the days you're typically available</p>
            
            <div className="flex flex-wrap gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.availableDays.includes(day)
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tags</h2>
            <p className="text-gray-600 mb-4">Add tags to help students find your skill</p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 input"
                placeholder="e.g., python, web development, beginner-friendly"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn btn-secondary"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-primary-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* What You'll Learn */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Students Will Learn</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newLearning}
                onChange={(e) => setNewLearning(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearning())}
                className="flex-1 input"
                placeholder="e.g., Build a simple web application"
              />
              <button
                type="button"
                onClick={addLearning}
                className="btn btn-secondary"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2">
              {formData.whatYouWillLearn.map((item, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <span className="text-gray-700">• {item}</span>
                  <button
                    type="button"
                    onClick={() => removeLearning(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Prerequisites */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Prerequisites (Optional)</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPrerequisite}
                onChange={(e) => setNewPrerequisite(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                className="flex-1 input"
                placeholder="e.g., Basic computer knowledge"
              />
              <button
                type="button"
                onClick={addPrerequisite}
                className="btn btn-secondary"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2">
              {formData.prerequisites.map((item, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                  <span className="text-gray-700">• {item}</span>
                  <button
                    type="button"
                    onClick={() => removePrerequisite(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/my-skills')}
              className="flex-1 btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : isEdit ? 'Update Skill' : 'Create Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditSkill;