import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Award, CheckCircle, Clock, Users, FileText, 
  Star, Download, Share2, ExternalLink, Trophy
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function SkillVerificationPage() {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [professionalQuestions, setProfessionalQuestions] = useState([]);
  const [professionalAnswers, setProfessionalAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([{
    title: '',
    description: '',
    url: '',
    type: 'project'
  }]);

  useEffect(() => {
    fetchSkill();
  }, [skillId]);

  const fetchSkill = async () => {
    try {
      const response = await api.get(`/skills/${skillId}`);
      setSkill(response.data);
    } catch (error) {
      console.error('Error fetching skill:', error);
      toast.error('Failed to load skill');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      const response = await api.get(`/verifications/quiz/${skillId}`);
      const technicalQuestions = response.data.questions || [];
      const profileQuestions = response.data.professionalQuestions || [];

      setQuizQuestions(technicalQuestions);
      setQuizAnswers(new Array(technicalQuestions.length).fill(null));
      setProfessionalQuestions(profileQuestions);
      setProfessionalAnswers(new Array(profileQuestions.length).fill(null));
      setSelectedMethod('quiz');
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to load quiz');
    }
  };

  const submitQuiz = async () => {
    try {
      if (quizAnswers.includes(null)) {
        toast.error('Please answer all questions');
        return;
      }

      const response = await api.post(`/verifications/quiz/${skillId}`, {
        answers: quizAnswers
      });

      setQuizResult(response.data);
      
      if (response.data.passed) {
        toast.success(`Congratulations! You scored ${response.data.score}%`);
      } else {
        toast.error(`Quiz score: ${response.data.score}%. Passing score is 70%`);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    }
  };

  const requestPeerReview = async () => {
    try {
      await api.post(`/verifications/peer-review/${skillId}`);
      toast.success('Peer review request submitted!');
      navigate('/certificates');
    } catch (error) {
      console.error('Error requesting peer review:', error);
      toast.error('Failed to request peer review');
    }
  };

  const submitPortfolio = async () => {
    try {
      const validItems = portfolioItems.filter(item => item.title && item.url);
      
      if (validItems.length === 0) {
        toast.error('Please add at least one portfolio item');
        return;
      }

      await api.post(`/verifications/portfolio/${skillId}`, {
        portfolioItems: validItems
      });

      toast.success('Portfolio submitted for review!');
      navigate('/certificates');
    } catch (error) {
      console.error('Error submitting portfolio:', error);
      toast.error('Failed to submit portfolio');
    }
  };

  const addPortfolioItem = () => {
    setPortfolioItems([...portfolioItems, {
      title: '',
      description: '',
      url: '',
      type: 'project'
    }]);
  };

  const updatePortfolioItem = (index, field, value) => {
    const updated = [...portfolioItems];
    updated[index][field] = value;
    setPortfolioItems(updated);
  };

  const removePortfolioItem = (index) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index));
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Get Verified</h1>
          <p className="text-gray-600 mt-1">
            Verify your skill: {skill?.title}
          </p>
        </div>

        {!selectedMethod && !quizResult && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quiz Verification */}
            <VerificationCard
              icon={<FileText className="w-8 h-8" />}
              title="Quiz Assessment"
              description="Take a 5-question quiz to prove your knowledge"
              color="blue"
              badge="Instant"
              onClick={startQuiz}
            />

            {/* Portfolio Verification */}
            <VerificationCard
              icon={<Award className="w-8 h-8" />}
              title="Portfolio Review"
              description="Submit your work samples for review"
              color="purple"
              badge="2-3 days"
              onClick={() => setSelectedMethod('portfolio')}
            />

            {/* Peer Review */}
            <VerificationCard
              icon={<Users className="w-8 h-8" />}
              title="Peer Review"
              description="Get reviewed by 3 community members"
              color="green"
              badge="3-5 days"
              onClick={requestPeerReview}
            />

            {/* Endorsements */}
            <VerificationCard
              icon={<Star className="w-8 h-8" />}
              title="Endorsements"
              description="Collect 5 endorsements from connections"
              color="orange"
              badge="Ongoing"
              onClick={() => navigate(`/skills/${skillId}`)}
            />
          </div>
        )}

        {/* Quiz */}
        {selectedMethod === 'quiz' && !quizResult && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {skill?.title} Assessment Quiz
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Technical section is scored. Professional profile questions are optional and not scored.
            </p>
            
            <div className="space-y-6">
              {quizQuestions.map((question, qIndex) => (
                <div key={qIndex} className="border-b border-gray-200 pb-6 last:border-0">
                  <p className="font-medium text-gray-900 mb-3">
                    {qIndex + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={quizAnswers[qIndex] === oIndex}
                          onChange={() => {
                            const newAnswers = [...quizAnswers];
                            newAnswers[qIndex] = oIndex;
                            setQuizAnswers(newAnswers);
                          }}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {professionalQuestions.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Professional Profile (Optional)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  These responses are for profile insights only and do not affect your quiz score.
                </p>

                <div className="space-y-6">
                  {professionalQuestions.map((question, qIndex) => (
                    <div key={`professional-${qIndex}`} className="border-b border-gray-200 pb-6 last:border-0">
                      <p className="font-medium text-gray-900 mb-3">
                        {qIndex + 1}. {question.question}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <label
                            key={oIndex}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name={`professional-question-${qIndex}`}
                              value={oIndex}
                              checked={professionalAnswers[qIndex] === oIndex}
                              onChange={() => {
                                const newAnswers = [...professionalAnswers];
                                newAnswers[qIndex] = oIndex;
                                setProfessionalAnswers(newAnswers);
                              }}
                              className="mr-3"
                            />
                            <span className="text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={submitQuiz}
                className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Submit Quiz
              </button>
              <button
                onClick={() => setSelectedMethod(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quiz Result */}
        {quizResult && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            {quizResult.passed ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Congratulations! 🎉
                </h2>
                <p className="text-gray-600 mb-2">
                  You passed the {skill?.title} assessment
                </p>
                <p className="text-3xl font-bold text-green-600 mb-6">
                  Score: {quizResult.score}%
                </p>
                <p className="text-gray-600 mb-6">
                  Your certificate is being generated and will be available in your certificates page.
                </p>
                <button
                  onClick={() => navigate('/certificates')}
                  className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  View Certificates
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Almost There!
                </h2>
                <p className="text-gray-600 mb-2">
                  You scored {quizResult.score}%
                </p>
                <p className="text-gray-600 mb-6">
                  You need at least 70% to pass. Would you like to try again?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setQuizResult(null);
                      startQuiz();
                    }}
                    className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back to Skill
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Portfolio Submission */}
        {selectedMethod === 'portfolio' && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Submit Portfolio
            </h2>
            
            <div className="space-y-4 mb-6">
              {portfolioItems.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-900">Item {index + 1}</h3>
                    {portfolioItems.length > 1 && (
                      <button
                        onClick={() => removePortfolioItem(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Title *"
                      value={item.title}
                      onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    
                    <textarea
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows="2"
                    />
                    
                    <input
                      type="url"
                      placeholder="URL *"
                      value={item.url}
                      onChange={(e) => updatePortfolioItem(index, 'url', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    
                    <select
                      value={item.type}
                      onChange={(e) => updatePortfolioItem(index, 'type', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="project">Project</option>
                      <option value="certificate">Certificate</option>
                      <option value="work_sample">Work Sample</option>
                      <option value="link">Link</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addPortfolioItem}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 mb-6"
            >
              + Add Another Item
            </button>

            <div className="flex gap-3">
              <button
                onClick={submitPortfolio}
                className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Submit Portfolio
              </button>
              <button
                onClick={() => setSelectedMethod(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationCard({ icon, title, description, color, badge, onClick }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-6 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className={`w-16 h-16 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
          {badge}
        </span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
