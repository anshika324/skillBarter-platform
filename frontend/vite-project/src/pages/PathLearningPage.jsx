import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  Circle,
  Clock,
  FileCheck,
  FileText,
  GraduationCap,
  Layers,
  Save,
  Send,
  Trophy
} from 'lucide-react';
import { learningPathsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const lessonTypeLabels = {
  video: 'Video lesson',
  reading: 'Reading',
  exercise: 'Exercise',
  quiz: 'Quiz',
  project: 'Project',
  session: 'Live session'
};

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function normalizePosition(path, enrollment) {
  const fallback = { moduleIndex: 0, lessonIndex: 0 };
  if (!path?.modules?.length) return fallback;

  const savedModule = enrollment?.progress?.currentModule;
  const savedLesson = enrollment?.progress?.currentLesson;
  if (
    Number.isInteger(savedModule) &&
    Number.isInteger(savedLesson) &&
    path.modules[savedModule]?.lessons?.[savedLesson]
  ) {
    return { moduleIndex: savedModule, lessonIndex: savedLesson };
  }

  const completedSet = new Set(
    (enrollment?.progress?.completedLessons || []).map((lesson) => `${lesson.moduleIndex}-${lesson.lessonIndex}`)
  );

  for (let m = 0; m < path.modules.length; m += 1) {
    const moduleLessons = path.modules[m]?.lessons || [];
    for (let l = 0; l < moduleLessons.length; l += 1) {
      if (!completedSet.has(`${m}-${l}`)) {
        return { moduleIndex: m, lessonIndex: l };
      }
    }
  }

  return fallback;
}

function findNextLesson(path, moduleIndex, lessonIndex) {
  if (!path?.modules?.length) return null;

  for (let m = moduleIndex; m < path.modules.length; m += 1) {
    const lessons = path.modules[m]?.lessons || [];
    const start = m === moduleIndex ? lessonIndex + 1 : 0;

    for (let l = start; l < lessons.length; l += 1) {
      return { moduleIndex: m, lessonIndex: l };
    }
  }

  return null;
}

export default function PathLearningPage() {
  const { identifier } = useParams();

  const [path, setPath] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [projectSubmissionUrl, setProjectSubmissionUrl] = useState('');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadPathAndEnrollment();
  }, [identifier]);

  const completedLessonSet = useMemo(() => {
    const completedLessons = enrollment?.progress?.completedLessons || [];
    return new Set(completedLessons.map((lesson) => `${lesson.moduleIndex}-${lesson.lessonIndex}`));
  }, [enrollment]);

  const currentModule = path?.modules?.[currentModuleIndex] || null;
  const currentLesson = currentModule?.lessons?.[currentLessonIndex] || null;

  const isCurrentLessonCompleted = completedLessonSet.has(`${currentModuleIndex}-${currentLessonIndex}`);
  const isCurrentLessonBookmarked = (enrollment?.bookmarks || []).some(
    (bookmark) => bookmark.moduleIndex === currentModuleIndex && bookmark.lessonIndex === currentLessonIndex
  );

  const totalLessons = useMemo(() => {
    if (!path?.modules?.length) return 0;
    return path.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
  }, [path]);

  const completedCount = enrollment?.progress?.completedLessons?.length || 0;

  const loadPathAndEnrollment = async () => {
    try {
      setLoading(true);
      const pathResponse = await learningPathsAPI.getByIdentifier(identifier);
      const loadedPath = pathResponse.data;
      setPath(loadedPath);

      const enrollmentResponse = await learningPathsAPI.getEnrollment(loadedPath._id);
      const loadedEnrollment = enrollmentResponse.data;

      if (!loadedEnrollment) {
        setEnrollment(null);
        setCurrentModuleIndex(0);
        setCurrentLessonIndex(0);
      } else {
        setEnrollment(loadedEnrollment);
        const starting = normalizePosition(loadedPath, loadedEnrollment);
        setCurrentModuleIndex(starting.moduleIndex);
        setCurrentLessonIndex(starting.lessonIndex);
      }
    } catch (error) {
      console.error('Error loading path learning data:', error);
      toast.error(getErrorMessage(error, 'Failed to load learning content'));
    } finally {
      setLoading(false);
    }
  };

  const refreshEnrollment = async (pathId) => {
    const enrollmentResponse = await learningPathsAPI.getEnrollment(pathId);
    setEnrollment(enrollmentResponse.data);
    return enrollmentResponse.data;
  };

  const handleEnroll = async () => {
    if (!path?._id) return;

    try {
      setActionLoading(true);
      const response = await learningPathsAPI.enroll(path._id);
      setEnrollment(response.data);

      const starting = normalizePosition(path, response.data);
      setCurrentModuleIndex(starting.moduleIndex);
      setCurrentLessonIndex(starting.lessonIndex);

      toast.success('You are enrolled. Let\'s start learning!');
    } catch (error) {
      console.error('Enroll error:', error);
      toast.error(getErrorMessage(error, 'Failed to enroll in this path'));
    } finally {
      setActionLoading(false);
    }
  };

  const openLesson = (moduleIndex, lessonIndex) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
    setQuizResult(null);
    setQuizAnswers({});
    setProjectSubmissionUrl('');
  };

  const goToNextLesson = () => {
    const next = findNextLesson(path, currentModuleIndex, currentLessonIndex);
    if (!next) return;
    openLesson(next.moduleIndex, next.lessonIndex);
  };

  const handleCompleteLesson = async () => {
    if (!path?._id || !currentLesson) return;

    try {
      setActionLoading(true);
      const response = await learningPathsAPI.completeLesson(
        path._id,
        currentModuleIndex,
        currentLessonIndex,
        { timeSpent: currentLesson.duration || 20 }
      );

      if (response.data?.enrollment) {
        setEnrollment(response.data.enrollment);
      } else {
        await refreshEnrollment(path._id);
      }

      if (response.data?.pathCompleted) {
        toast.success('Congratulations! You completed this learning path.');
      } else {
        toast.success('Lesson marked complete.');
      }

      goToNextLesson();
    } catch (error) {
      console.error('Complete lesson error:', error);
      toast.error(getErrorMessage(error, 'Failed to mark lesson complete'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!path?._id || !currentLesson?.quiz?.length) return;

    const answers = currentLesson.quiz.map((_, index) => {
      const value = quizAnswers[index];
      return value === undefined ? null : Number(value);
    });

    if (answers.some((answer) => answer === null || Number.isNaN(answer))) {
      toast.error('Please answer all quiz questions before submitting.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await learningPathsAPI.submitQuiz(
        path._id,
        currentModuleIndex,
        currentLessonIndex,
        answers
      );

      setQuizResult(response.data);

      if (response.data?.passed) {
        toast.success(`Quiz passed with ${response.data.score}%`);
        await refreshEnrollment(path._id);
      } else {
        toast.error(`Quiz score: ${response.data.score}%. Need 70% to pass.`);
      }
    } catch (error) {
      console.error('Submit quiz error:', error);
      toast.error(getErrorMessage(error, 'Failed to submit quiz'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitProject = async () => {
    if (!path?._id) return;

    const cleanedUrl = projectSubmissionUrl.trim();
    if (!cleanedUrl) {
      toast.error('Please add a project submission URL.');
      return;
    }

    try {
      setActionLoading(true);
      await learningPathsAPI.submitProject(
        path._id,
        currentModuleIndex,
        currentLessonIndex,
        cleanedUrl
      );
      toast.success('Project submitted successfully.');
      setProjectSubmissionUrl('');
      await refreshEnrollment(path._id);
    } catch (error) {
      console.error('Submit project error:', error);
      toast.error(getErrorMessage(error, 'Failed to submit project'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!path?._id) return;

    const cleanedNote = noteText.trim();
    if (!cleanedNote) {
      toast.error('Please write a note before saving.');
      return;
    }

    try {
      setActionLoading(true);
      await learningPathsAPI.addNote(path._id, currentModuleIndex, currentLessonIndex, cleanedNote);
      toast.success('Note saved.');
      setNoteText('');
      await refreshEnrollment(path._id);
    } catch (error) {
      console.error('Save note error:', error);
      toast.error(getErrorMessage(error, 'Failed to save note'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!path?._id) return;

    try {
      setActionLoading(true);
      const response = await learningPathsAPI.toggleBookmark(
        path._id,
        currentModuleIndex,
        currentLessonIndex
      );
      setEnrollment(response.data);
      toast.success(isCurrentLessonBookmarked ? 'Bookmark removed.' : 'Lesson bookmarked.');
    } catch (error) {
      console.error('Bookmark toggle error:', error);
      toast.error(getErrorMessage(error, 'Failed to update bookmark'));
    } finally {
      setActionLoading(false);
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
        <div className="bg-white rounded-xl border border-gray-200 p-10 max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Path not found</h2>
          <p className="text-gray-600 mb-6">We could not load this learning path.</p>
          <Link to="/learning-paths" className="btn btn-primary">Back to Learning Paths</Link>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={`/learning-paths/${identifier}`} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to path details
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
            <GraduationCap className="w-16 h-16 mx-auto text-rose-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{path.title}</h1>
            <p className="text-gray-600 mb-8">Enroll first to unlock lessons and track your learning progress.</p>
            <button
              onClick={handleEnroll}
              disabled={actionLoading}
              className="btn btn-primary px-8 py-3 disabled:opacity-60"
            >
              {actionLoading ? 'Enrolling...' : 'Enroll and Start Learning'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <Link to={`/learning-paths/${path.slug || path._id}`} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Path details
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{path.title}</h1>
          </div>
          <Link to="/my-learning" className="btn btn-outline">My Learning</Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Progress</p>
            <p className="text-xl font-semibold text-gray-900">{enrollment.progress?.overallProgress || 0}%</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Completed Lessons</p>
            <p className="text-xl font-semibold text-gray-900">{completedCount}/{totalLessons}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
            <p className="text-xl font-semibold text-gray-900 capitalize">{enrollment.status}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Current Streak</p>
            <p className="text-xl font-semibold text-gray-900">{enrollment.streak?.current || 0} days</p>
          </div>
          <div className="md:col-span-4 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-rose-600"
              style={{ width: `${enrollment.progress?.overallProgress || 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 bg-white border border-gray-200 rounded-xl shadow-sm p-4 max-h-[75vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Modules</h2>
            <div className="space-y-4">
              {(path.modules || []).map((module, moduleIndex) => {
                const completedInModule = (module.lessons || []).filter((_, lessonIndex) =>
                  completedLessonSet.has(`${moduleIndex}-${lessonIndex}`)
                ).length;

                return (
                  <div key={`${module.title}-${moduleIndex}`} className="border border-gray-200 rounded-lg">
                    <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                      <p className="font-medium text-gray-900">{module.title}</p>
                      <p className="text-xs text-gray-500">
                        {completedInModule}/{module.lessons?.length || 0} lessons done
                      </p>
                    </div>
                    <div className="p-2 space-y-1">
                      {(module.lessons || []).map((lesson, lessonIndex) => {
                        const active = moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;
                        const completed = completedLessonSet.has(`${moduleIndex}-${lessonIndex}`);

                        return (
                          <button
                            key={`${lesson.title}-${lessonIndex}`}
                            onClick={() => openLesson(moduleIndex, lessonIndex)}
                            className={`w-full text-left px-2 py-2 rounded-md flex items-center gap-2 transition-colors ${
                              active ? 'bg-rose-50 text-rose-700' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="text-sm truncate">{lesson.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            {currentLesson ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-rose-600 font-semibold mb-1">
                      Module {currentModuleIndex + 1} • Lesson {currentLessonIndex + 1}
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {lessonTypeLabels[currentLesson.type] || 'Lesson'}
                      {currentLesson.duration ? ` • ${currentLesson.duration} min` : ''}
                    </p>
                  </div>

                  <button
                    onClick={handleToggleBookmark}
                    disabled={actionLoading}
                    className="btn btn-outline text-sm"
                  >
                    {isCurrentLessonBookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" /> Save
                      </>
                    )}
                  </button>
                </div>

                {currentLesson.description && (
                  <p className="text-gray-700 mb-4">{currentLesson.description}</p>
                )}

                {currentLesson.content && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 whitespace-pre-line mb-5">
                    {currentLesson.content}
                  </div>
                )}

                {currentLesson.resources?.length > 0 && (
                  <div className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-4 mb-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Lesson Resources</h3>
                    <div className="space-y-2">
                      {currentLesson.resources.map((resource, resourceIndex) => (
                        <a
                          key={`${resource.url || resource.title}-${resourceIndex}`}
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm text-indigo-700 hover:text-indigo-800 underline"
                        >
                          {resource.title || `Resource ${resourceIndex + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {currentLesson.quiz?.length > 0 && (
                  <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-4 mb-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> Quiz Assessment
                    </h3>

                    <div className="space-y-4">
                      {currentLesson.quiz.map((question, questionIndex) => (
                        <div key={`${question.question}-${questionIndex}`} className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="font-medium text-gray-900 mb-3">
                            {questionIndex + 1}. {question.question}
                          </p>
                          <div className="space-y-2">
                            {(question.options || []).map((option, optionIndex) => (
                              <label key={`${option}-${optionIndex}`} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`quiz-${questionIndex}`}
                                  value={optionIndex}
                                  checked={Number(quizAnswers[questionIndex]) === optionIndex}
                                  onChange={(event) => setQuizAnswers((prev) => ({
                                    ...prev,
                                    [questionIndex]: Number(event.target.value)
                                  }))}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleSubmitQuiz}
                      disabled={actionLoading}
                      className="btn btn-primary mt-4"
                    >
                      <Send className="w-4 h-4" /> Submit Quiz
                    </button>

                    {quizResult && (
                      <div className={`mt-4 rounded-lg p-3 text-sm ${quizResult.passed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        Score: {quizResult.score}% • {quizResult.passed ? 'Passed' : 'Try again'}
                      </div>
                    )}
                  </div>
                )}

                {currentLesson.type === 'project' && (
                  <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4 mb-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Project Submission
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        value={projectSubmissionUrl}
                        onChange={(event) => setProjectSubmissionUrl(event.target.value)}
                        placeholder="https://github.com/username/project"
                        className="input"
                      />
                      <button
                        onClick={handleSubmitProject}
                        disabled={actionLoading}
                        className="btn btn-primary whitespace-nowrap"
                      >
                        Submit
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Paste a repository/demo/documentation link for review.</p>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg p-4 mb-5">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Personal Notes
                  </h3>
                  <textarea
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    rows={3}
                    placeholder="Write a note for this lesson..."
                    className="input"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={actionLoading}
                    className="btn btn-outline mt-3"
                  >
                    <Save className="w-4 h-4" /> Save Note
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200">
                  <div className="text-sm text-gray-500 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {currentLesson.duration || 0} min
                    </span>
                    {isCurrentLessonCompleted && (
                      <span className="inline-flex items-center gap-1 text-green-700">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToNextLesson}
                      className="btn btn-outline"
                      disabled={!findNextLesson(path, currentModuleIndex, currentLessonIndex)}
                    >
                      Next Lesson <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleCompleteLesson}
                      disabled={actionLoading || isCurrentLessonCompleted}
                      className="btn btn-primary disabled:opacity-60"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isCurrentLessonCompleted ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                </div>

                {enrollment.status === 'completed' && (
                  <div className="mt-5 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <Trophy className="w-5 h-5 text-green-700 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Path completed</p>
                      <p className="text-sm text-green-700">
                        Great work. {enrollment.certificate?.issued ? `Certificate ID: ${enrollment.certificate.certificateId}` : 'Certificate will be issued once approved.'}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">Select a lesson to begin.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
