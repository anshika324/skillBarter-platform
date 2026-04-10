const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const LEARNING_LEVELS = ['none', ...SKILL_LEVELS];
const SESSION_MODES = ['online', 'offline', 'hybrid'];
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

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source || {}, key);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeSkillName(value) {
  if (typeof value !== 'string') return '';
  return normalizeWhitespace(value);
}

function normalizeSkillToken(value) {
  return normalizeSkillName(value).toLowerCase();
}

function sanitizeStringArray(input, maxLength = 20) {
  if (!Array.isArray(input)) return [];

  const unique = new Map();
  for (const item of input) {
    if (typeof item !== 'string') continue;
    const normalized = normalizeWhitespace(item);
    if (!normalized) continue;

    const token = normalized.toLowerCase();
    if (!unique.has(token)) {
      unique.set(token, normalized);
    }

    if (unique.size >= maxLength) {
      break;
    }
  }

  return Array.from(unique.values());
}

function sanitizeTeachingSkills(input) {
  if (!Array.isArray(input)) return [];

  const unique = new Map();

  for (const entry of input) {
    const skill = typeof entry === 'string' ? { name: entry } : entry || {};

    const name = normalizeSkillName(skill.name || skill.skill || skill.title || '');
    if (!name) continue;

    const normalizedName = name.toLowerCase();
    if (unique.has(normalizedName)) continue;

    const requestedLevel = typeof skill.level === 'string' ? skill.level.toLowerCase() : '';
    const level = SKILL_LEVELS.includes(requestedLevel) ? requestedLevel : 'intermediate';

    const yearsRaw = Number(skill.yearsOfExperience);
    const yearsOfExperience = Number.isFinite(yearsRaw) ? clamp(yearsRaw, 0, 60) : 0;

    unique.set(normalizedName, {
      name,
      normalizedName,
      level,
      yearsOfExperience,
      tags: sanitizeStringArray(skill.tags || [], 10)
    });
  }

  return Array.from(unique.values()).slice(0, 30);
}

function sanitizeLearningSkills(input) {
  if (!Array.isArray(input)) return [];

  const unique = new Map();

  for (const entry of input) {
    const skill = typeof entry === 'string' ? { name: entry } : entry || {};

    const name = normalizeSkillName(skill.name || skill.skill || skill.title || '');
    if (!name) continue;

    const normalizedName = name.toLowerCase();
    if (unique.has(normalizedName)) continue;

    const requestedCurrentLevel = typeof skill.currentLevel === 'string' ? skill.currentLevel.toLowerCase() : '';
    const currentLevel = LEARNING_LEVELS.includes(requestedCurrentLevel)
      ? requestedCurrentLevel
      : 'beginner';

    const requestedTargetLevel = typeof skill.targetLevel === 'string' ? skill.targetLevel.toLowerCase() : '';
    const targetLevel = SKILL_LEVELS.includes(requestedTargetLevel)
      ? requestedTargetLevel
      : 'intermediate';

    const priorityRaw = Number(skill.priority);
    const priority = Number.isFinite(priorityRaw) ? clamp(Math.round(priorityRaw), 1, 5) : 3;

    const learningGoal = typeof skill.learningGoal === 'string'
      ? normalizeWhitespace(skill.learningGoal).slice(0, 200)
      : '';

    unique.set(normalizedName, {
      name,
      normalizedName,
      currentLevel,
      targetLevel,
      priority,
      learningGoal
    });
  }

  return Array.from(unique.values()).slice(0, 30);
}

function sanitizeMatchPreferences(input) {
  const safeInput = input && typeof input === 'object' ? input : {};

  const preferredSessionMode = SESSION_MODES.includes(safeInput.preferredSessionMode)
    ? safeInput.preferredSessionMode
    : DEFAULT_MATCH_PREFERENCES.preferredSessionMode;

  const availabilityDays = Array.isArray(safeInput.availabilityDays)
    ? safeInput.availabilityDays
        .map((day) => (typeof day === 'string' ? day.toLowerCase().trim() : ''))
        .filter((day, index, arr) => AVAILABILITY_DAYS.includes(day) && arr.indexOf(day) === index)
        .slice(0, 7)
    : DEFAULT_MATCH_PREFERENCES.availabilityDays;

  const availabilityTimeSlots = Array.isArray(safeInput.availabilityTimeSlots)
    ? safeInput.availabilityTimeSlots
        .map((slot) => (typeof slot === 'string' ? slot.toLowerCase().trim() : ''))
        .filter((slot, index, arr) => AVAILABILITY_TIME_SLOTS.includes(slot) && arr.indexOf(slot) === index)
        .slice(0, 4)
    : DEFAULT_MATCH_PREFERENCES.availabilityTimeSlots;

  const timezone = typeof safeInput.timezone === 'string' && safeInput.timezone.trim()
    ? safeInput.timezone.trim().slice(0, 80)
    : DEFAULT_MATCH_PREFERENCES.timezone;

  const maxWeeklyMatchesRaw = Number(safeInput.maxWeeklyMatches);
  const maxWeeklyMatches = Number.isFinite(maxWeeklyMatchesRaw)
    ? clamp(Math.round(maxWeeklyMatchesRaw), 1, 20)
    : DEFAULT_MATCH_PREFERENCES.maxWeeklyMatches;

  const languagePreferences = sanitizeStringArray(safeInput.languagePreferences || [], 10);

  const onlyMutualBarter = typeof safeInput.onlyMutualBarter === 'boolean'
    ? safeInput.onlyMutualBarter
    : DEFAULT_MATCH_PREFERENCES.onlyMutualBarter;

  const isDiscoverable = typeof safeInput.isDiscoverable === 'boolean'
    ? safeInput.isDiscoverable
    : DEFAULT_MATCH_PREFERENCES.isDiscoverable;

  return {
    preferredSessionMode,
    availabilityDays,
    availabilityTimeSlots,
    timezone,
    maxWeeklyMatches,
    languagePreferences,
    onlyMutualBarter,
    isDiscoverable
  };
}

function buildLegacySkillsFromTeachingSkills(teachingSkills) {
  return (teachingSkills || []).map((skill) => ({
    name: skill.name,
    level: skill.level,
    yearsOfExperience: skill.yearsOfExperience || 0
  }));
}

function buildLegacyInterestsFromLearningSkills(learningSkills) {
  return (learningSkills || []).map((skill) => skill.name).filter(Boolean);
}

function normalizeMatchmakingPayload(payload, options = {}) {
  const source = payload || {};
  const includeLegacy = options.includeLegacy !== false;

  const teachingSkillsInput = hasOwn(source, 'teachingSkills')
    ? source.teachingSkills
    : source.skillsCanTeach;
  const learningSkillsInput = hasOwn(source, 'learningSkills')
    ? source.learningSkills
    : source.skillsToLearn;
  const matchPreferencesInput = hasOwn(source, 'matchPreferences')
    ? source.matchPreferences
    : source.barterPreferences;

  const teachingSkills = sanitizeTeachingSkills(teachingSkillsInput || []);

  let learningSkillsSource = learningSkillsInput || [];
  if (!hasOwn(source, 'learningSkills') && !hasOwn(source, 'skillsToLearn') && Array.isArray(source.interests)) {
    learningSkillsSource = source.interests;
  }
  const learningSkills = sanitizeLearningSkills(learningSkillsSource);

  const matchPreferences = sanitizeMatchPreferences(matchPreferencesInput || {});

  const result = {
    teachingSkills,
    learningSkills,
    matchPreferences,
    matchProfileCompleted: teachingSkills.length > 0 && learningSkills.length > 0,
    matchProfileUpdatedAt: new Date()
  };

  if (includeLegacy) {
    result.skills = buildLegacySkillsFromTeachingSkills(teachingSkills);
    result.interests = buildLegacyInterestsFromLearningSkills(learningSkills);
  }

  return result;
}

function extractMatchmakingSnapshot(user) {
  if (!user) return null;

  return {
    userId: user._id,
    teachingSkills: user.teachingSkills || [],
    learningSkills: user.learningSkills || [],
    matchPreferences: user.matchPreferences || { ...DEFAULT_MATCH_PREFERENCES },
    matchProfileCompleted: Boolean(user.matchProfileCompleted),
    matchProfileUpdatedAt: user.matchProfileUpdatedAt || null,
    location: user.location || {},
    rating: user.rating || { average: 0, count: 0 },
    completedSessions: user.completedSessions || 0,
    isActive: user.isActive !== false
  };
}

module.exports = {
  SKILL_LEVELS,
  LEARNING_LEVELS,
  SESSION_MODES,
  AVAILABILITY_DAYS,
  AVAILABILITY_TIME_SLOTS,
  DEFAULT_MATCH_PREFERENCES,
  normalizeSkillName,
  normalizeSkillToken,
  sanitizeStringArray,
  sanitizeTeachingSkills,
  sanitizeLearningSkills,
  sanitizeMatchPreferences,
  buildLegacySkillsFromTeachingSkills,
  buildLegacyInterestsFromLearningSkills,
  normalizeMatchmakingPayload,
  extractMatchmakingSnapshot,
  hasOwn
};
