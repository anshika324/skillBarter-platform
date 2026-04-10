import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Clock, Star, TrendingUp,
  Search, Plus, Sparkles, BarChart3, ArrowUpRight, Target
} from 'lucide-react';
import { learningPathsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LearningPathsPage() {
  const { isAuthenticated, hasRole } = useAuth();
  const canCreatePath = isAuthenticated && hasRole('creator', 'admin');
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    level: '',
    search: '',
    featured: false
  });
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState({
    forYou: [],
    sameCategory: [],
    nextLevel: [],
    popular: [],
    trending: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPaths();
  }, [filters, page]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRecommendations({
        forYou: [],
        sameCategory: [],
        nextLevel: [],
        popular: [],
        trending: []
      });
      return;
    }

    fetchRecommendations();
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const response = await learningPathsAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPaths = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.level) params.append('level', filters.level);
      if (filters.search) params.append('search', filters.search);
      if (filters.featured) params.append('featured', 'true');
      params.append('page', page);
      
      const response = await learningPathsAPI.getAll(Object.fromEntries(params.entries()));
      setPaths(response.data.paths);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching paths:', error);
      toast.error('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  const normalizeRecommendations = (data) => {
    if (Array.isArray(data)) {
      return {
        forYou: data,
        sameCategory: [],
        nextLevel: [],
        popular: [],
        trending: []
      };
    }

    return {
      forYou: Array.isArray(data?.forYou) ? data.forYou : [],
      sameCategory: Array.isArray(data?.sameCategory) ? data.sameCategory : [],
      nextLevel: Array.isArray(data?.nextLevel) ? data.nextLevel : [],
      popular: Array.isArray(data?.popular) ? data.popular : [],
      trending: Array.isArray(data?.trending) ? data.trending : []
    };
  };

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const response = await learningPathsAPI.getRecommended(6);
      setRecommendations(normalizeRecommendations(response.data));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPaths();
  };

  if (loading && paths.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Paths</h1>
              <p className="text-gray-600 mt-1">Structured learning journeys to master new skills</p>
            </div>

            {isAuthenticated && (
              <div className="flex flex-wrap gap-2">
                <Link to="/my-learning" className="btn btn-outline">
                  My Learning
                </Link>
                {canCreatePath && (
                  <Link to="/learning-paths/create" className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Create Path
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search learning paths..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Search
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filters.level}
              onChange={(e) => {
                setFilters({ ...filters, level: e.target.value });
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => {
                  setFilters({ ...filters, featured: e.target.checked });
                  setPage(1);
                }}
                className="rounded text-rose-600"
              />
              <TrendingUp className="w-4 h-4" />
              <span>Featured Only</span>
            </label>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mb-8 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600" />
              <h2 className="text-xl font-semibold text-gray-900">Personalized Recommendations</h2>
            </div>

            {recommendationsLoading ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-gray-600">
                Loading recommendations...
              </div>
            ) : (
              <>
                <RecommendationSection
                  title="For You"
                  icon={<Sparkles className="w-4 h-4" />}
                  subtitle="Suggestions based on your learning activity, interests, and skills"
                  paths={recommendations.forYou}
                />

                <RecommendationSection
                  title="Same Category"
                  icon={<Target className="w-4 h-4" />}
                  subtitle="More paths in categories you are already exploring"
                  paths={recommendations.sameCategory}
                />

                <RecommendationSection
                  title="Difficulty Progression"
                  icon={<ArrowUpRight className="w-4 h-4" />}
                  subtitle="Next-level paths to help you progress step by step"
                  paths={recommendations.nextLevel}
                />

                <RecommendationSection
                  title="Popular"
                  icon={<BarChart3 className="w-4 h-4" />}
                  subtitle="Most enrolled and highly rated learning paths"
                  paths={recommendations.popular}
                />

                <RecommendationSection
                  title="Trending"
                  icon={<TrendingUp className="w-4 h-4" />}
                  subtitle="Featured and high-momentum paths right now"
                  paths={recommendations.trending}
                />
              </>
            )}
          </div>
        )}

        {/* Paths Grid */}
        {paths.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Learning Paths Found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or search criteria
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paths.map(path => (
                <PathCard key={path._id} path={path} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RecommendationSection({ title, subtitle, icon, paths }) {
  if (!paths?.length) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2 mb-1 text-gray-900">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paths.slice(0, 6).map((path) => (
          <PathCard key={path._id} path={path} />
        ))}
      </div>
    </div>
  );
}

function PathCard({ path }) {
  const levelColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-orange-100 text-orange-700',
    expert: 'bg-purple-100 text-purple-700'
  };

  return (
    <Link
      to={`/learning-paths/${path.slug || path._id}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-shadow"
    >
      {path.coverImage && (
        <img
          src={path.coverImage}
          alt={path.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${levelColors[path.level]}`}>
            {path.level}
          </span>
          {path.isFeatured && (
            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Featured
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {path.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {path.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {path.modules?.length || 0} modules
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {path.estimatedDuration?.hours || 0}h
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <img
              src={path.creator?.avatar || `https://ui-avatars.com/api/?name=${path.creator?.firstName}`}
              alt={path.creator?.firstName}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-700">
              {path.creator?.firstName} {path.creator?.lastName}
            </span>
          </div>

          {path.stats?.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">
                {path.stats.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
