import { useState, useEffect } from 'react';
import {
  Save,
  User,
  Bell,
  Shield,
  Trash2,
  Sparkles,
  Target,
  Clock3,
  Globe2
} from 'lucide-react';
import { usersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SKILL_LEVELS } from '../utils/helpers';
import toast from 'react-hot-toast';

const AVAILABILITY_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const AVAILABILITY_TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night'];

const DEFAULT_MATCH_PREFERENCES = {
  preferredSessionMode: 'online',
  availabilityDays: [],
  availabilityTimeSlots: [],
  timezone: 'UTC',
  maxWeeklyMatches: 3,
  languagePreferences: [],
  onlyMutualBarter: true,
  isDiscoverable: true
};

const LEARNING_LEVELS = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];

const buildProfileData = (sourceUser) => {
  if (!sourceUser) {
    return {
      firstName: '',
      lastName: '',
      bio: '',
      location: { city: '', country: '' },
      skills: [],
      interests: [],
      languages: [],
      teachingSkills: [],
      learningSkills: [],
      matchPreferences: { ...DEFAULT_MATCH_PREFERENCES }
    };
  }

  const fallbackTeachingSkills = Array.isArray(sourceUser.skills) ? sourceUser.skills : [];
  const teachingSkills = Array.isArray(sourceUser.teachingSkills) && sourceUser.teachingSkills.length > 0
    ? sourceUser.teachingSkills
    : fallbackTeachingSkills;

  const fallbackLearningSkills = Array.isArray(sourceUser.interests)
    ? sourceUser.interests.map((name) => ({
        name,
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        priority: 3,
        learningGoal: ''
      }))
    : [];

  const learningSkills = Array.isArray(sourceUser.learningSkills) && sourceUser.learningSkills.length > 0
    ? sourceUser.learningSkills
    : fallbackLearningSkills;

  return {
    firstName: sourceUser.firstName || '',
    lastName: sourceUser.lastName || '',
    bio: sourceUser.bio || '',
    location: sourceUser.location || { city: '', country: '' },
    skills: fallbackTeachingSkills,
    interests: Array.isArray(sourceUser.interests) ? sourceUser.interests : [],
    languages: Array.isArray(sourceUser.languages) ? sourceUser.languages : [],
    teachingSkills,
    learningSkills,
    matchPreferences: {
      ...DEFAULT_MATCH_PREFERENCES,
      ...(sourceUser.matchPreferences || {})
    }
  };
};

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState(buildProfileData(user));

  const [newTeachingSkill, setNewTeachingSkill] = useState({
    name: '',
    level: 'beginner',
    yearsOfExperience: 0
  });
  const [newLearningSkill, setNewLearningSkill] = useState({
    name: '',
    currentLevel: 'beginner',
    targetLevel: 'intermediate',
    priority: 3,
    learningGoal: ''
  });
  const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'conversational' });
  const [newMatchLanguage, setNewMatchLanguage] = useState('');

  useEffect(() => {
    setProfileData(buildProfileData(user));
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const normalizedTeachingSkills = profileData.teachingSkills.map((skill) => ({
        name: skill.name,
        level: skill.level || 'intermediate',
        yearsOfExperience: Number(skill.yearsOfExperience) || 0,
        tags: Array.isArray(skill.tags) ? skill.tags : []
      }));

      const normalizedLearningSkills = profileData.learningSkills.map((skill) => ({
        name: skill.name,
        currentLevel: skill.currentLevel || 'beginner',
        targetLevel: skill.targetLevel || 'intermediate',
        priority: Number(skill.priority) || 3,
        learningGoal: skill.learningGoal || ''
      }));

      const payload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        location: profileData.location,
        languages: profileData.languages,
        teachingSkills: normalizedTeachingSkills,
        learningSkills: normalizedLearningSkills,
        matchPreferences: profileData.matchPreferences,
        // keep legacy fields in sync with matchmaking fields
        skills: normalizedTeachingSkills.map((skill) => ({
          name: skill.name,
          level: skill.level,
          yearsOfExperience: skill.yearsOfExperience
        })),
        interests: normalizedLearningSkills.map((skill) => skill.name)
      };

      const response = await usersAPI.update(payload);
      const updatedProfile = response?.data || payload;

      updateUser(updatedProfile);
      setProfileData(buildProfileData(updatedProfile));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addTeachingSkill = () => {
    const name = newTeachingSkill.name.trim();
    if (!name) return;

    const alreadyExists = profileData.teachingSkills.some(
      (skill) => skill.name?.toLowerCase() === name.toLowerCase()
    );
    if (alreadyExists) return;

    setProfileData((prev) => ({
      ...prev,
      teachingSkills: [...prev.teachingSkills, { ...newTeachingSkill, name }]
    }));

    setNewTeachingSkill({ name: '', level: 'beginner', yearsOfExperience: 0 });
  };

  const removeTeachingSkill = (index) => {
    setProfileData((prev) => ({
      ...prev,
      teachingSkills: prev.teachingSkills.filter((_, i) => i !== index)
    }));
  };

  const addLearningSkill = () => {
    const name = newLearningSkill.name.trim();
    if (!name) return;

    const alreadyExists = profileData.learningSkills.some(
      (skill) => skill.name?.toLowerCase() === name.toLowerCase()
    );
    if (alreadyExists) return;

    setProfileData((prev) => ({
      ...prev,
      learningSkills: [...prev.learningSkills, { ...newLearningSkill, name }]
    }));

    setNewLearningSkill({
      name: '',
      currentLevel: 'beginner',
      targetLevel: 'intermediate',
      priority: 3,
      learningGoal: ''
    });
  };

  const removeLearningSkill = (index) => {
    setProfileData((prev) => ({
      ...prev,
      learningSkills: prev.learningSkills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    const language = newLanguage.language.trim();
    if (!language) return;

    setProfileData((prev) => ({
      ...prev,
      languages: [...prev.languages, { ...newLanguage, language }]
    }));

    setNewLanguage({ language: '', proficiency: 'conversational' });
  };

  const removeLanguage = (index) => {
    setProfileData((prev) => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addMatchLanguage = () => {
    const language = newMatchLanguage.trim();
    if (!language) return;

    setProfileData((prev) => {
      const existing = prev.matchPreferences.languagePreferences || [];
      if (existing.some((entry) => entry.toLowerCase() === language.toLowerCase())) {
        return prev;
      }

      return {
        ...prev,
        matchPreferences: {
          ...prev.matchPreferences,
          languagePreferences: [...existing, language]
        }
      };
    });

    setNewMatchLanguage('');
  };

  const removeMatchLanguage = (languageToRemove) => {
    setProfileData((prev) => ({
      ...prev,
      matchPreferences: {
        ...prev.matchPreferences,
        languagePreferences: (prev.matchPreferences.languagePreferences || []).filter(
          (language) => language !== languageToRemove
        )
      }
    }));
  };

  const toggleAvailabilityDay = (day) => {
    setProfileData((prev) => {
      const days = prev.matchPreferences.availabilityDays || [];
      const updatedDays = days.includes(day)
        ? days.filter((item) => item !== day)
        : [...days, day];

      return {
        ...prev,
        matchPreferences: {
          ...prev.matchPreferences,
          availabilityDays: updatedDays
        }
      };
    });
  };

  const toggleAvailabilityTimeSlot = (slot) => {
    setProfileData((prev) => {
      const slots = prev.matchPreferences.availabilityTimeSlots || [];
      const updatedSlots = slots.includes(slot)
        ? slots.filter((item) => item !== slot)
        : [...slots, slot];

      return {
        ...prev,
        matchPreferences: {
          ...prev.matchPreferences,
          availabilityTimeSlots: updatedSlots
        }
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-xl text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-5 h-5 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bell className="w-5 h-5 inline mr-2" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Shield className="w-5 h-5 inline mr-2" />
                Security
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    className="input"
                    placeholder="Tell others about yourself..."
                  />
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={profileData.location.city || ''}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            location: { ...profileData.location, city: e.target.value }
                          })
                        }
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={profileData.location.country || ''}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            location: { ...profileData.location, country: e.target.value }
                          })
                        }
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Skills You Can Teach */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold">Skills You Can Teach</h3>
                  </div>

                  <div className="space-y-3 mb-4">
                    {profileData.teachingSkills.map((skill, index) => (
                      <div key={`${skill.name}-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className="font-medium">{skill.name}</span>
                          <span className="mx-2">•</span>
                          <span className="text-sm text-gray-600 capitalize">{skill.level}</span>
                          {Number(skill.yearsOfExperience) > 0 && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-sm text-gray-600">{skill.yearsOfExperience} years</span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => removeTeachingSkill(index)}
                          className="text-red-600 hover:text-red-700"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      type="text"
                      placeholder="Skill name"
                      value={newTeachingSkill.name}
                      onChange={(e) => setNewTeachingSkill({ ...newTeachingSkill, name: e.target.value })}
                      className="input md:col-span-2"
                    />
                    <select
                      value={newTeachingSkill.level}
                      onChange={(e) => setNewTeachingSkill({ ...newTeachingSkill, level: e.target.value })}
                      className="input"
                    >
                      {SKILL_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={newTeachingSkill.yearsOfExperience}
                        onChange={(e) =>
                          setNewTeachingSkill({
                            ...newTeachingSkill,
                            yearsOfExperience: Number(e.target.value) || 0
                          })
                        }
                        className="input w-20"
                        title="Years of experience"
                      />
                      <button onClick={addTeachingSkill} className="btn btn-secondary flex-1" type="button">
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Skills You Want To Learn */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-secondary-600" />
                    <h3 className="text-lg font-semibold">Skills You Want To Learn</h3>
                  </div>

                  <div className="space-y-3 mb-4">
                    {profileData.learningSkills.map((skill, index) => (
                      <div key={`${skill.name}-${index}`} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{skill.name}</span>
                            <span className="mx-2">•</span>
                            <span className="text-sm text-gray-600 capitalize">
                              {skill.currentLevel || 'beginner'} → {skill.targetLevel || 'intermediate'}
                            </span>
                            <span className="mx-2">•</span>
                            <span className="text-sm text-gray-600">Priority {skill.priority || 3}/5</span>
                          </div>
                          <button
                            onClick={() => removeLearningSkill(index)}
                            className="text-red-600 hover:text-red-700"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {skill.learningGoal && (
                          <p className="text-sm text-gray-600 mt-2">Goal: {skill.learningGoal}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <input
                      type="text"
                      placeholder="Skill to learn"
                      value={newLearningSkill.name}
                      onChange={(e) => setNewLearningSkill({ ...newLearningSkill, name: e.target.value })}
                      className="input md:col-span-2"
                    />
                    <select
                      value={newLearningSkill.currentLevel}
                      onChange={(e) =>
                        setNewLearningSkill({ ...newLearningSkill, currentLevel: e.target.value })
                      }
                      className="input"
                    >
                      {LEARNING_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newLearningSkill.targetLevel}
                      onChange={(e) => setNewLearningSkill({ ...newLearningSkill, targetLevel: e.target.value })}
                      className="input"
                    >
                      {SKILL_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newLearningSkill.priority}
                      onChange={(e) =>
                        setNewLearningSkill({
                          ...newLearningSkill,
                          priority: Number(e.target.value) || 3
                        })
                      }
                      className="input"
                      title="Priority"
                    />
                    <button onClick={addLearningSkill} className="btn btn-secondary" type="button">
                      Add
                    </button>
                    <textarea
                      value={newLearningSkill.learningGoal}
                      onChange={(e) => setNewLearningSkill({ ...newLearningSkill, learningGoal: e.target.value })}
                      rows={2}
                      placeholder="Learning goal (optional)"
                      className="input md:col-span-6"
                    />
                  </div>
                </div>

                {/* Match Preferences */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock3 className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold">Match Preferences</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Session Mode</label>
                      <select
                        value={profileData.matchPreferences.preferredSessionMode}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            matchPreferences: {
                              ...prev.matchPreferences,
                              preferredSessionMode: e.target.value
                            }
                          }))
                        }
                        className="input"
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <input
                        type="text"
                        value={profileData.matchPreferences.timezone || 'UTC'}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            matchPreferences: {
                              ...prev.matchPreferences,
                              timezone: e.target.value
                            }
                          }))
                        }
                        className="input"
                        placeholder="Asia/Kolkata"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Weekly Matches</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={profileData.matchPreferences.maxWeeklyMatches || 3}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            matchPreferences: {
                              ...prev.matchPreferences,
                              maxWeeklyMatches: Number(e.target.value) || 3
                            }
                          }))
                        }
                        className="input"
                      />
                    </div>

                    <div className="flex items-end gap-4 pb-2">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={Boolean(profileData.matchPreferences.onlyMutualBarter)}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              matchPreferences: {
                                ...prev.matchPreferences,
                                onlyMutualBarter: e.target.checked
                              }
                            }))
                          }
                        />
                        Only show mutual barter matches
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={Boolean(profileData.matchPreferences.isDiscoverable)}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              matchPreferences: {
                                ...prev.matchPreferences,
                                isDiscoverable: e.target.checked
                              }
                            }))
                          }
                        />
                        Discoverable in match search
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_DAYS.map((day) => {
                        const active = (profileData.matchPreferences.availabilityDays || []).includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleAvailabilityDay(day)}
                            className={`px-3 py-1 rounded-full text-sm border ${
                              active
                                ? 'bg-primary-100 border-primary-400 text-primary-700'
                                : 'bg-white border-gray-300 text-gray-600'
                            }`}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time Slots</label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_TIME_SLOTS.map((slot) => {
                        const active = (profileData.matchPreferences.availabilityTimeSlots || []).includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => toggleAvailabilityTimeSlot(slot)}
                            className={`px-3 py-1 rounded-full text-sm border ${
                              active
                                ? 'bg-secondary-100 border-secondary-400 text-secondary-700'
                                : 'bg-white border-gray-300 text-gray-600'
                            }`}
                          >
                            {slot.charAt(0).toUpperCase() + slot.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe2 className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold">Languages</h3>
                  </div>

                  <div className="space-y-3 mb-4">
                    {profileData.languages.map((language, index) => (
                      <div key={`${language.language}-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className="font-medium">{language.language}</span>
                          <span className="mx-2">•</span>
                          <span className="text-sm text-gray-600 capitalize">{language.proficiency}</span>
                        </div>
                        <button
                          onClick={() => removeLanguage(index)}
                          className="text-red-600 hover:text-red-700"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <input
                      type="text"
                      placeholder="Language"
                      value={newLanguage.language}
                      onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                      className="input"
                    />
                    <select
                      value={newLanguage.proficiency}
                      onChange={(e) => setNewLanguage({ ...newLanguage, proficiency: e.target.value })}
                      className="input"
                    >
                      <option value="basic">Basic</option>
                      <option value="conversational">Conversational</option>
                      <option value="fluent">Fluent</option>
                      <option value="native">Native</option>
                    </select>
                    <button onClick={addLanguage} className="btn btn-secondary" type="button">
                      Add Language
                    </button>
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Match Languages</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(profileData.matchPreferences.languagePreferences || []).map((language, index) => (
                      <span
                        key={`${language}-${index}`}
                        className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 rounded-full"
                      >
                        {language}
                        <button
                          onClick={() => removeMatchLanguage(language)}
                          className="ml-2 hover:text-primary-900"
                          type="button"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add preferred match language"
                      value={newMatchLanguage}
                      onChange={(e) => setNewMatchLanguage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addMatchLanguage();
                        }
                      }}
                      className="flex-1 input"
                    />
                    <button onClick={addMatchLanguage} className="btn btn-secondary" type="button">
                      Add
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="btn btn-primary disabled:opacity-50"
                    type="button"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                {['Email Notifications', 'Message Notifications', 'Booking Notifications'].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">{pref}</span>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                ))}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                <p className="text-gray-600">Password and security features coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
