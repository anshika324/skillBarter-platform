import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Star, BookOpen } from 'lucide-react';
import { skillsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getSkillLevelColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const MySkills = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    if (!user?._id) return;
    fetchMySkills(user._id);
  }, [user?._id]);

  const fetchMySkills = async (userId) => {
    try {
      const response = await skillsAPI.getByUser(userId);
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load your skills');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await skillsAPI.delete(id);
      setSkills(skills.filter(s => s._id !== id));
      toast.success('Skill deleted successfully');
      setDeleteModal(null);
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Skills</h1>
            <p className="text-xl text-gray-600">
              Manage your skill offerings
            </p>
          </div>
          <Link
            to="/skills/create"
            className="btn btn-primary w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Offer New Skill
          </Link>
        </div>

        {/* Skills Grid */}
        {skills.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No skills yet</h3>
            <p className="text-gray-600 mb-6">
              Start sharing your expertise by offering your first skill
            </p>
            <Link
              to="/skills/create"
              className="btn btn-primary inline-flex"
            >
              <Plus className="w-5 h-5" />
              Offer Your First Skill
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <div
                key={skill._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="h-32 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary-600 opacity-50" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge ${getSkillLevelColor(skill.skillLevel)}`}>
                      {skill.skillLevel}
                    </span>
                    <span className={`badge ${skill.isActive ? 'badge-success' : 'bg-gray-100 text-gray-800'}`}>
                      {skill.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {skill.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {skill.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-gray-600">Bookings</div>
                      <div className="font-semibold text-gray-900">{skill.totalBookings}</div>
                    </div>
                    <div className="bg-gray-50 px-3 py-2 rounded">
                      <div className="text-gray-600">Rating</div>
                      <div className="font-semibold text-gray-900 flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        {skill.rating?.average?.toFixed(1) || 'New'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                    <Link
                      to={`/skills/${skill._id}`}
                      className="btn btn-ghost text-xs sm:text-sm py-2 px-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      to={`/skills/${skill._id}/edit`}
                      className="btn btn-outline text-xs sm:text-sm py-2 px-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteModal(skill)}
                      className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50 text-xs sm:text-sm py-2 px-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 animate-scale-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Skill?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deleteModal.title}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal._id)}
                className="flex-1 btn bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySkills;
