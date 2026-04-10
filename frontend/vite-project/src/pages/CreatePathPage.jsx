import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Layers,
  Plus,
  Save,
  Trash2
} from 'lucide-react';
import { learningPathsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const levelOptions = ['beginner', 'intermediate', 'advanced', 'expert'];
const lessonTypeOptions = ['reading', 'video', 'exercise', 'quiz', 'project', 'session'];

const newLesson = () => ({
  title: '',
  description: '',
  type: 'reading',
  duration: 20,
  content: '',
  resourcesText: '',
  quizText: '',
  projectRequirementsText: ''
});

const newModule = () => ({
  title: '',
  description: '',
  lessons: [newLesson()]
});

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function CreatePathPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    coverImage: '',
    thumbnail: '',
    tagsText: '',
    outcomesText: '',
    prerequisitesDescription: '',
    prerequisitePathIdsText: '',
    prerequisiteSkillIdsText: '',
    targetAudience: '',
    isPremium: false,
    price: 0,
    publishNow: true,
    isFeatured: false,
    certificateMinCompletionRate: 100,
    certificateMinQuizScore: 70,
    certificateRequiredProjects: 0,
    modules: [newModule()]
  });
  const [saving, setSaving] = useState(false);

  const estimatedHours = useMemo(() => {
    const totalMinutes = form.modules.reduce((sum, module) => {
      const moduleMinutes = (module.lessons || []).reduce((lessonSum, lesson) => {
        return lessonSum + (Number(lesson.duration) || 0);
      }, 0);
      return sum + moduleMinutes;
    }, 0);

    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [form.modules]);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateModule = (moduleIndex, field, value) => {
    setForm((prev) => {
      const modules = [...prev.modules];
      modules[moduleIndex] = { ...modules[moduleIndex], [field]: value };
      return { ...prev, modules };
    });
  };

  const updateLesson = (moduleIndex, lessonIndex, field, value) => {
    setForm((prev) => {
      const modules = [...prev.modules];
      const lessons = [...modules[moduleIndex].lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
      modules[moduleIndex] = { ...modules[moduleIndex], lessons };
      return { ...prev, modules };
    });
  };

  const addModule = () => {
    setForm((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule()]
    }));
  };

  const removeModule = (moduleIndex) => {
    setForm((prev) => {
      if (prev.modules.length === 1) return prev;
      const modules = prev.modules.filter((_, index) => index !== moduleIndex);
      return { ...prev, modules };
    });
  };

  const addLesson = (moduleIndex) => {
    setForm((prev) => {
      const modules = [...prev.modules];
      modules[moduleIndex] = {
        ...modules[moduleIndex],
        lessons: [...modules[moduleIndex].lessons, newLesson()]
      };
      return { ...prev, modules };
    });
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    setForm((prev) => {
      const modules = [...prev.modules];
      const currentLessons = modules[moduleIndex].lessons;
      if (currentLessons.length === 1) return prev;

      modules[moduleIndex] = {
        ...modules[moduleIndex],
        lessons: currentLessons.filter((_, index) => index !== lessonIndex)
      };

      return { ...prev, modules };
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Path title is required';
    if (!form.description.trim()) return 'Description is required';
    if (!form.category.trim()) return 'Category is required';

    const hasValidModule = form.modules.some((module) => {
      const hasTitle = module.title.trim();
      const hasLesson = module.lessons.some((lesson) => lesson.title.trim());
      return hasTitle && hasLesson;
    });

    if (!hasValidModule) return 'Add at least one module with one lesson';

    return null;
  };

  const buildPayload = () => {
    const tags = form.tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const outcomes = form.outcomesText
      .split('\n')
      .map((outcome) => outcome.trim())
      .filter(Boolean);

    const modules = form.modules
      .map((module, moduleIndex) => ({
        title: module.title.trim(),
        description: module.description.trim(),
        order: moduleIndex + 1,
        lessons: (module.lessons || [])
          .map((lesson) => {
            const resources = lesson.resourcesText
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, index) => {
                const [title, url, type] = line.split('|').map((item) => item?.trim());
                if (!url && !title) return null;

                if (!url) {
                  return {
                    title: `Resource ${index + 1}`,
                    url: title,
                    type: 'link'
                  };
                }

                return {
                  title: title || `Resource ${index + 1}`,
                  url,
                  type: type || 'link'
                };
              })
              .filter(Boolean);

            const baseLesson = {
              title: lesson.title.trim(),
              description: lesson.description.trim(),
              type: lesson.type,
              duration: Number(lesson.duration) || 15,
              content: lesson.content.trim(),
              resources
            };

            if (lesson.type === 'quiz') {
              const quiz = lesson.quizText
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const parts = line.split('|').map((part) => part.trim());
                  if (parts.length < 6) return null;

                  const question = parts[0];
                  const options = parts.slice(1, 5);
                  const correctAnswer = Number(parts[5]) - 1;
                  const explanation = parts[6] || '';

                  if (!question || options.some((option) => !option)) return null;
                  if (Number.isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) return null;

                  return { question, options, correctAnswer, explanation };
                })
                .filter(Boolean);

              baseLesson.quiz = quiz;
            }

            if (lesson.type === 'project') {
              const requirements = lesson.projectRequirementsText
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean);

              baseLesson.project = {
                requirements,
                submissionInstructions: lesson.content.trim()
              };
            }

            return baseLesson;
          })
          .filter((lesson) => lesson.title)
      }))
      .filter((module) => module.title && module.lessons.length > 0);

    const prerequisitePaths = form.prerequisitePathIdsText
      .split(',')
      .map((item) => item.trim())
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

    const prerequisiteSkills = form.prerequisiteSkillIdsText
      .split(',')
      .map((item) => item.trim())
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

    return {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      level: form.level,
      coverImage: form.coverImage.trim() || undefined,
      thumbnail: form.thumbnail.trim() || undefined,
      tags,
      outcomes,
      prerequisites: {
        description: form.prerequisitesDescription.trim(),
        paths: prerequisitePaths,
        skills: prerequisiteSkills
      },
      targetAudience: form.targetAudience.trim(),
      isPremium: form.isPremium,
      price: form.isPremium ? Math.max(0, Number(form.price) || 0) : 0,
      status: form.publishNow ? 'published' : 'draft',
      publishedAt: form.publishNow ? new Date().toISOString() : undefined,
      isFeatured: form.isFeatured,
      modules,
      certificate: {
        enabled: true,
        title: `${form.title.trim()} Completion Certificate`,
        requirements: {
          minCompletionRate: Math.min(100, Math.max(1, Number(form.certificateMinCompletionRate) || 100)),
          minQuizScore: Math.min(100, Math.max(0, Number(form.certificateMinQuizScore) || 0)),
          requiredProjects: Math.max(0, Number(form.certificateRequiredProjects) || 0)
        }
      }
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      const response = await learningPathsAPI.create(payload);

      toast.success(form.publishNow ? 'Learning path published successfully!' : 'Learning path saved as draft');
      navigate(`/learning-paths/${response.data?.slug || response.data?._id}`);
    } catch (error) {
      console.error('Create path error:', error);
      toast.error(getErrorMessage(error, 'Failed to create learning path'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/learning-paths" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Learning Paths
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Create Learning Path</h1>
          <p className="text-gray-600 mt-1">Design a structured path with modules and lessons for learners.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Path Basics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                  className="input"
                  placeholder="e.g., Backend Fundamentals with Node.js"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  rows={4}
                  className="input"
                  placeholder="What will learners gain from this path?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                  className="input"
                  placeholder="Development, Data Science, Product..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={form.level}
                  onChange={(event) => updateForm('level', event.target.value)}
                  className="input"
                >
                  {levelOptions.map((option) => (
                    <option key={option} value={option} className="capitalize">{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={form.tagsText}
                  onChange={(event) => updateForm('tagsText', event.target.value)}
                  className="input"
                  placeholder="comma,separated,tags"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={form.coverImage}
                  onChange={(event) => updateForm('coverImage', event.target.value)}
                  className="input"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  value={form.thumbnail}
                  onChange={(event) => updateForm('thumbnail', event.target.value)}
                  className="input"
                  placeholder="https://example.com/thumb.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={form.targetAudience}
                  onChange={(event) => updateForm('targetAudience', event.target.value)}
                  className="input"
                  placeholder="Beginners, career switchers, students..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes</label>
                <textarea
                  value={form.outcomesText}
                  onChange={(event) => updateForm('outcomesText', event.target.value)}
                  rows={4}
                  className="input"
                  placeholder="Write one outcome per line"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisites</label>
                <textarea
                  value={form.prerequisitesDescription}
                  onChange={(event) => updateForm('prerequisitesDescription', event.target.value)}
                  rows={2}
                  className="input"
                  placeholder="Describe what learners should know before starting this path"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisite Path IDs (optional)</label>
                <input
                  type="text"
                  value={form.prerequisitePathIdsText}
                  onChange={(event) => updateForm('prerequisitePathIdsText', event.target.value)}
                  className="input"
                  placeholder="Comma-separated Learning Path IDs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prerequisite Skill IDs (optional)</label>
                <input
                  type="text"
                  value={form.prerequisiteSkillIdsText}
                  onChange={(event) => updateForm('prerequisiteSkillIdsText', event.target.value)}
                  className="input"
                  placeholder="Comma-separated Skill IDs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-5 pt-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.publishNow}
                  onChange={(event) => updateForm('publishNow', event.target.checked)}
                />
                Publish immediately
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => updateForm('isFeatured', event.target.checked)}
                />
                Mark as featured
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(event) => updateForm('isPremium', event.target.checked)}
                />
                Premium path (paid)
              </label>

              {form.isPremium && (
                <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <span>Price (credits)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(event) => updateForm('price', event.target.value)}
                    className="input w-28"
                  />
                </div>
              )}

              <div className="text-sm text-gray-500 inline-flex items-center gap-1">
                <Clock className="w-4 h-4" /> Estimated duration: {estimatedHours}h
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Certificate Rules</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Completion (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.certificateMinCompletionRate}
                  onChange={(event) => updateForm('certificateMinCompletionRate', event.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Quiz Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.certificateMinQuizScore}
                  onChange={(event) => updateForm('certificateMinQuizScore', event.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Projects</label>
                <input
                  type="number"
                  min="0"
                  value={form.certificateRequiredProjects}
                  onChange={(event) => updateForm('certificateRequiredProjects', event.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {form.modules.map((module, moduleIndex) => (
              <div key={`module-${moduleIndex}`} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-rose-600" /> Module {moduleIndex + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeModule(moduleIndex)}
                    className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" /> Remove Module
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module Title *</label>
                    <input
                      type="text"
                      value={module.title}
                      onChange={(event) => updateModule(moduleIndex, 'title', event.target.value)}
                      className="input"
                      placeholder="e.g., APIs and Data Handling"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module Description</label>
                    <input
                      type="text"
                      value={module.description}
                      onChange={(event) => updateModule(moduleIndex, 'description', event.target.value)}
                      className="input"
                      placeholder="What this module covers"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={`lesson-${moduleIndex}-${lessonIndex}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" /> Lesson {lessonIndex + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeLesson(moduleIndex, lessonIndex)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'title', event.target.value)}
                          className="input md:col-span-2"
                          placeholder="Lesson title *"
                        />

                        <select
                          value={lesson.type}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'type', event.target.value)}
                          className="input"
                        >
                          {lessonTypeOptions.map((option) => (
                            <option key={option} value={option} className="capitalize">{option}</option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={lesson.duration}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'duration', event.target.value)}
                          className="input"
                          placeholder="Minutes"
                        />

                        <input
                          type="text"
                          value={lesson.description}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'description', event.target.value)}
                          className="input md:col-span-4"
                          placeholder="Lesson description"
                        />

                        <textarea
                          value={lesson.content}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'content', event.target.value)}
                          rows={3}
                          className="input md:col-span-4"
                          placeholder="Lesson content or instructions"
                        />

                        <textarea
                          value={lesson.resourcesText}
                          onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'resourcesText', event.target.value)}
                          rows={2}
                          className="input md:col-span-4"
                          placeholder="Resources (one per line): Title | URL | type"
                        />

                        {lesson.type === 'quiz' && (
                          <textarea
                            value={lesson.quizText}
                            onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'quizText', event.target.value)}
                            rows={3}
                            className="input md:col-span-4"
                            placeholder="Quiz lines: Question | Option 1 | Option 2 | Option 3 | Option 4 | Correct Option Number (1-4) | Explanation (optional)"
                          />
                        )}

                        {lesson.type === 'project' && (
                          <textarea
                            value={lesson.projectRequirementsText}
                            onChange={(event) => updateLesson(moduleIndex, lessonIndex, 'projectRequirementsText', event.target.value)}
                            rows={3}
                            className="input md:col-span-4"
                            placeholder="Project requirements (one per line)"
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={() => addLesson(moduleIndex)} className="btn btn-outline">
                    <Plus className="w-4 h-4" /> Add Lesson
                  </button>
                </div>
              </div>
            ))}

            <button type="button" onClick={addModule} className="btn btn-outline w-full">
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <p className="text-sm text-gray-600 inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {form.publishNow ? 'This path will be visible to learners immediately.' : 'This path will be saved as a draft.'}
              </p>

              <div className="flex gap-2">
                <Link to="/learning-paths" className="btn btn-outline">Cancel</Link>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-60">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : form.publishNow ? 'Publish Path' : 'Save Draft'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
