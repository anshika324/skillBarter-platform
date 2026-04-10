import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, Clock, Filter, GraduationCap, Plus, Trophy } from 'lucide-react';
import { learningPathsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusFilters = ['all', 'active', 'completed', 'paused', 'dropped'];

function getStatusColor(status) {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'paused') return 'bg-yellow-100 text-yellow-700';
  if (status === 'dropped') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function MyLearningPage() {
  const { hasRole } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const filteredEnrollments = useMemo(() => {
    if (statusFilter === 'all') return enrollments;
    return enrollments.filter((item) => item.status === statusFilter);
  }, [enrollments, statusFilter]);

  const stats = useMemo(() => {
    return enrollments.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.status === 'active') acc.active += 1;
        if (item.status === 'completed') acc.completed += 1;
        if (item.status === 'paused') acc.paused += 1;
        return acc;
      },
      { total: 0, active: 0, completed: 0, paused: 0 }
    );
  }, [enrollments]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await learningPathsAPI.getMyEnrollments();
      setEnrollments(response.data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error(getErrorMessage(error, 'Failed to load your learning paths'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Learning</h1>
            <p className="text-gray-600 mt-1">Track your enrolled paths and continue lessons from where you left off.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/learning-paths" className="btn btn-outline">
              <BookOpen className="w-4 h-4" /> Browse Paths
            </Link>
            {hasRole('creator', 'admin') && (
              <Link to="/learning-paths/create" className="btn btn-primary">
                <Plus className="w-4 h-4" /> Create Path
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard icon={<GraduationCap className="w-5 h-5" />} label="Enrolled" value={stats.total} />
          <SummaryCard icon={<Clock className="w-5 h-5" />} label="Active" value={stats.active} />
          <SummaryCard icon={<Trophy className="w-5 h-5" />} label="Completed" value={stats.completed} />
          <SummaryCard icon={<Calendar className="w-5 h-5" />} label="Paused" value={stats.paused} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 text-gray-700 text-sm font-medium">
            <Filter className="w-4 h-4" /> Filter by status
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredEnrollments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No learning paths found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all'
                ? 'You have not enrolled in any learning path yet.'
                : `No ${statusFilter} learning paths yet.`}
            </p>
            <Link to="/learning-paths" className="btn btn-primary">
              Browse Learning Paths
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => {
              const path = enrollment.path;
              const totalLessons = path?.modules?.reduce((sum, module) => sum + (module.lessons?.length || 0), 0) || 0;
              const completedLessons = enrollment.progress?.completedLessons?.length || 0;
              const progress = enrollment.progress?.overallProgress || 0;

              return (
                <div key={enrollment._id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className={`badge capitalize ${getStatusColor(enrollment.status)}`}>{enrollment.status}</span>
                      <h3 className="text-xl font-semibold text-gray-900 mt-2">{path?.title || 'Untitled Path'}</h3>
                    </div>
                    <span className="badge bg-gray-100 text-gray-700 capitalize">{path?.level || 'beginner'}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{path?.description || 'No description available.'}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-600" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{completedLessons}/{totalLessons} lessons complete</span>
                      <span>{path?.estimatedDuration?.hours || 0}h est.</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    <Link
                      to={`/learning-paths/${path?.slug || path?._id}/learn`}
                      className="btn btn-primary flex-1"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/learning-paths/${path?.slug || path?._id}`}
                      className="btn btn-outline"
                    >
                      View
                    </Link>
                  </div>

                  {enrollment.certificate?.issued && (
                    <div className="mt-3">
                      <p className="text-xs text-green-700 font-medium">
                        Certificate issued: {enrollment.certificate.certificateId}
                      </p>
                      <Link
                        to={`/certificates/verify/${enrollment.certificate.certificateId}`}
                        className="text-xs text-rose-600 hover:text-rose-700"
                      >
                        View public verification
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="text-rose-600 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
