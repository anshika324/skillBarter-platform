import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, Clock, BookOpen } from 'lucide-react';
import { skillsAPI } from '../utils/api';
import { getSkillLevelColor, truncate, formatTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    skillLevel: '',
    minRating: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSkills: 0
  });

  const categories = [
    'All Categories',
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

  const skillLevels = ['All Levels', 'beginner', 'intermediate', 'advanced', 'expert'];

  useEffect(() => {
    fetchSkills();
  }, [filters, pagination.currentPage]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        category: filters.category === 'All Categories' ? '' : filters.category,
        skillLevel: filters.skillLevel === 'All Levels' ? '' : filters.skillLevel,
        page: pagination.currentPage
      };

      const response = await skillsAPI.getAll(params);
      setSkills(response.data.skills);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalSkills: response.data.totalSkills
      });
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSkills();
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Skills</h1>
          <p className="text-xl text-gray-600">
            Discover and learn from {pagination.totalSkills}+ skills offered by our community
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search skills, keywords, or providers..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filters.skillLevel}
                onChange={(e) => handleFilterChange('skillLevel', e.target.value)}
                className="input"
              >
                {skillLevels.map((level) => (
                  <option key={level} value={level}>
                    {level === 'All Levels' ? level : level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
                className="input"
              >
                <option value="">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input"
              >
                <option value="createdAt">Newest</option>
                <option value="rating.average">Highest Rated</option>
                <option value="totalBookings">Most Popular</option>
              </select>
            </div>
          </form>
        </div>

        {/* Skills Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No skills found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {skills.map((skill) => (
                <Link
                  key={skill._id}
                  to={`/skills/${skill._id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Skill Image or Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-primary-600 opacity-50" />
                  </div>

                  <div className="p-6">
                    {/* Category Badge */}
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full mb-3">
                      {skill.category}
                    </span>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {skill.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {truncate(skill.description, 100)}
                    </p>

                    {/* Provider Info */}
                    <div className="flex items-center mb-4">
                      <img
                        src={skill.provider?.avatar}
                        alt={skill.provider?.firstName}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {skill.provider?.firstName} {skill.provider?.lastName}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span>{skill.provider?.rating?.average?.toFixed(1) || 'New'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">{skill.duration} min</span>
                      </div>
                      <span className={`badge ${getSkillLevelColor(skill.skillLevel)}`}>
                        {skill.skillLevel}
                      </span>
                      <div className="flex items-center font-semibold text-primary-600">
                        <BookOpen className="w-4 h-4 mr-1" />
                        <span>{Math.ceil((skill.duration / 60) * skill.creditsPerHour)} credits</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                  disabled={pagination.currentPage === 1}
                  className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="flex items-center px-4 text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
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
};

export default Skills;