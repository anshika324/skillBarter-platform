import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Star, Clock, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Exchange Skills',
      description: 'Share your expertise and learn from others using time-based credits instead of money.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Build Community',
      description: 'Connect with passionate individuals and grow together through knowledge sharing.'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Verified Reviews',
      description: 'Build trust through transparent ratings and authentic feedback from real users.'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Flexible Scheduling',
      description: 'Book sessions that fit your schedule with easy-to-use calendar integration.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Platform',
      description: 'Your data is protected with industry-standard security measures.'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'AI Matching',
      description: 'Get personalized skill recommendations based on your interests and goals.'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Skills Shared' },
    { value: '5,000+', label: 'Active Users' },
    { value: '50+', label: 'Countries' },
    { value: '4.9/5', label: 'Average Rating' }
  ];

  const categories = [
    { name: 'Programming & Tech', count: '1,234', color: 'from-blue-500 to-cyan-500' },
    { name: 'Design & Creative', count: '987', color: 'from-purple-500 to-pink-500' },
    { name: 'Business & Marketing', count: '756', color: 'from-orange-500 to-red-500' },
    { name: 'Teaching & Academics', count: '654', color: 'from-green-500 to-teal-500' },
    { name: 'Music & Audio', count: '543', color: 'from-indigo-500 to-purple-500' },
    { name: 'Language Learning', count: '432', color: 'from-yellow-500 to-orange-500' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm mb-6 animate-slide-down">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">Join 5,000+ learners today</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              Exchange{' '}
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 bg-clip-text text-transparent">
                Skills
              </span>
              ,<br />Not Money
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up text-balance">
              Learn new skills, share your expertise, and grow together with a global community. 
              All powered by time credits, not cash.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
              {isAuthenticated ? (
                <Link to="/skills" className="btn btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl">
                  Browse Skills
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link to="/skills" className="btn btn-outline text-lg px-8 py-3">
                    Explore Skills
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 animate-fade-in">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Categories</h2>
            <p className="text-xl text-gray-600">Explore skills across diverse fields</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/skills?category=${encodeURIComponent(category.name)}`}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-gray-200 p-6 hover:border-transparent hover:shadow-xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-600">{category.count} skills available</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why SkillBarter?</h2>
            <p className="text-xl text-gray-600">Everything you need to exchange skills effectively</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Start exchanging skills in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-3">Create Your Profile</h3>
              <p className="text-gray-600">
                Sign up and showcase your skills, expertise, and what you want to learn.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-3">Find & Book Skills</h3>
              <p className="text-gray-600">
                Browse skills, connect with providers, and schedule sessions that fit your schedule.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-3">Exchange & Earn</h3>
              <p className="text-gray-600">
                Attend sessions, earn time credits, and use them to learn new skills from others.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of people exchanging skills and growing together
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3 shadow-xl">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;