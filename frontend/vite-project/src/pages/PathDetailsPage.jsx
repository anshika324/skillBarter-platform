import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  Layers,
  PlayCircle,
  Star,
  Target,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { learningPathsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const lessonTypeLabel = {
  video: 'Video',
  reading: 'Reading',
  exercise: 'Exercise',
  quiz: 'Quiz',
  project: 'Project',
  session: 'Live Session'
};

const lessonTypeIcon = {
  video: PlayCircle,
  reading: BookOpen,
  exercise: Target,
  quiz: BarChart3,
  project: Layers,
  session: Users
};

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function PathDetailsPage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [path, setPath] = useState(null);
  const [stats, setStats] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchPathData();
  }, [identifier, isAuthenticated]);

  const totalLessons = useMemo(() => {
    if (!path?.modules?.length) return 0;
    return path.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
  }, [path]);

  const fetchPathData = async () => {
    try {
      setLoading(true);

      const pathResponse = await learningPathsAPI.getByIdentifier(identifier);
      const loadedPath = pathResponse.data;
      setPath(loadedPath);

      const promises = [
        learningPathsAPI.getStats(loadedPath._id).catch(() => null)
      ];

      if (isAuthenticated) {
        promises.push(
          learningPathsAPI.getEnrollment(loadedPath._id).catch((error) => {
            if (error?.response?.status === 404) return null;
            throw error;
          })
        );
      }

      const [statsResponse, enrollmentResponse] = await Promise.all(promises);
      setStats(statsResponse?.data || null);
      setEnrollment(enrollmentResponse?.data || null);
    } catch (error) {
      console.error('Error fetching learning path details:', error);
      toast.error(getErrorMessage(error, 'Failed to load learning path details'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!path?._id) return;

    if (!isAuthenticated) {
      toast.error('Please login to enroll in this learning path');
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      const response = await learningPathsAPI.enroll(path._id);
      setEnrollment(response.data);
      toast.success('Enrolled successfully!');
      navigate(`/learning-paths/${path._id}/learn`);
    } catch (error) {
      console.error('Enroll error:', error);
      toast.error(getErrorMessage(error, 'Failed to enroll in this path'));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!path) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center max-w-lg w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning path not found</h2>
          <p className="text-gray-600 mb-6">This path may have been removed or is unavailable right now.</p>
          <Link to="/learning-paths" className="btn btn-primary">
            Back to Learning Paths
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm">
          <Link to="/learning-paths" className="text-gray-500 hover:text-gray-700">Learning Paths</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{path.title}</span>
        </nav>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="badge badge-primary capitalize">{path.level}</span>
                {path.isFeatured && <span className="badge badge-warning">Featured</span>}
                {path.isPremium && (
                  <span className="badge bg-amber-100 text-amber-700">
                    Premium {path.price ? `• ${path.price} credits` : ''}
                  </span>
                )}
                <span className="badge bg-gray-100 text-gray-700">{path.category}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{path.title}</h1>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">{path.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox
                  icon={<BookOpen className="w-5 h-5" />}
                  label="Modules"
                  value={path.modules?.length || 0}
                />
                <StatBox
                  icon={<Layers className="w-5 h-5" />}
                  label="Lessons"
                  value={totalLessons}
                />
                <StatBox
                  icon={<Clock className="w-5 h-5" />}
                  label="Duration"
                  value={`${path.estimatedDuration?.hours || 0}h`}
                />
                <StatBox
                  icon={<Star className="w-5 h-5" />}
                  label="Rating"
                  value={path.stats?.averageRating?.toFixed(1) || 'New'}
                />
              </div>
            </div>

            {path.outcomes?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-5">What You Will Achieve</h2>
                <ul className="space-y-3">
                  {path.outcomes.map((outcome, index) => (
                    <li key={`${outcome}-${index}`} className="flex items-start gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(path.prerequisites?.description || path.prerequisites?.skills?.length || path.prerequisites?.paths?.length) && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Prerequisites</h2>
                {path.prerequisites?.description && (
                  <p className="text-gray-700 mb-4">{path.prerequisites.description}</p>
                )}

                {path.prerequisites?.skills?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {path.prerequisites.skills.map((skill, index) => (
                        <span key={skill?._id || index} className="badge bg-gray-100 text-gray-700">
                          {skill?.title || skill?.name || 'Required skill'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {path.prerequisites?.paths?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Recommended Paths</p>
                    <div className="flex flex-wrap gap-2">
                      {path.prerequisites.paths.map((item, index) => (
                        <span key={item?._id || index} className="badge bg-blue-50 text-blue-700">
                          {item?.title || 'Learning Path'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Path Curriculum</h2>

              {path.modules?.length ? (
                <div className="space-y-4">
                  {path.modules.map((module, moduleIndex) => (
                    <div key={`${module.title}-${moduleIndex}`} className="border border-gray-200 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide font-semibold text-rose-600 mb-1">
                            Module {moduleIndex + 1}
                          </p>
                          <h3 className="text-xl font-semibold text-gray-900">{module.title}</h3>
                          {module.description && (
                            <p className="text-gray-600 mt-1">{module.description}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {module.lessons?.length || 0} lessons
                        </span>
                      </div>

                      <div className="space-y-2">
                        {(module.lessons || []).map((lesson, lessonIndex) => {
                          const LessonIcon = lessonTypeIcon[lesson.type] || BookOpen;
                          return (
                            <div key={`${lesson.title}-${lessonIndex}`} className="px-3 py-2 rounded-lg bg-gray-50">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <LessonIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {lessonTypeLabel[lesson.type] || 'Lesson'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {lesson.duration ? `${lesson.duration} min` : 'Self-paced'}
                                </span>
                              </div>

                              {lesson.resources?.length > 0 && (
                                <div className="mt-2 pl-7 space-y-1">
                                  {lesson.resources.map((resource, resourceIndex) => (
                                    <a
                                      key={`${resource.url || resource.title}-${resourceIndex}`}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block text-xs text-blue-600 hover:text-blue-700"
                                    >
                                      {resource.title || `Resource ${resourceIndex + 1}`}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Curriculum will be added soon.</p>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start This Learning Path</h3>
                <p className="text-gray-600 text-sm">
                  Enroll to track progress, complete lessons, and earn your completion certificate.
                </p>
              </div>

              {path.isPremium && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-800">
                    Premium path: {path.price || 0} credits
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Credits are deducted once when you enroll.
                  </p>
                </div>
              )}

              {stats && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Enrollments</span>
                    <span className="font-semibold text-gray-900">{stats.totalEnrollments || path.stats?.enrollments || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completions</span>
                    <span className="font-semibold text-gray-900">{stats.completions || path.stats?.completions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-gray-900">{Math.round(stats.completionRate || 0)}%</span>
                  </div>
                </div>
              )}

              {path.certificate?.enabled && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <p className="font-semibold text-gray-900 mb-2">Certificate Requirements</p>
                  <div className="space-y-1 text-gray-700">
                    <p>Completion: {path.certificate?.requirements?.minCompletionRate ?? 100}%</p>
                    <p>Quiz Score: {path.certificate?.requirements?.minQuizScore ?? 0}%</p>
                    <p>Projects: {path.certificate?.requirements?.requiredProjects ?? 0}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {enrollment ? (
                  <>
                    <Link
                      to={`/learning-paths/${path._id}/learn`}
                      className="w-full btn btn-primary py-3"
                    >
                      Continue Learning
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-xs text-center text-gray-500">
                      Current progress: {enrollment.progress?.overallProgress || 0}%
                    </p>
                  </>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full btn btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                <Link to="/my-learning" className="w-full btn btn-outline py-3">
                  My Learning
                </Link>
              </div>

              {path.creator && (
                <div className="pt-5 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Created by</h4>
                  <div className="flex items-center gap-3">
                    <img
                      src={path.creator.avatar || `https://ui-avatars.com/api/?name=${path.creator.firstName || 'User'}`}
                      alt={path.creator.firstName || 'Creator'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {path.creator.firstName} {path.creator.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Path creator</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
