import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppLayout from './components/AppLayout'; // ← NEW: Import AppLayout instead of Navbar
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Skills from './pages/Skills';
import SkillDetail from './pages/SkillDetail';
import CreateEditSkill from './pages/CreateEditSkill';
import MySkills from './pages/MySkills';
import Bookings from './pages/Bookings';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import Achievements from './pages/Achievements'; 
import AnalyticsDashboard from './pages/AnalyticsDashboard'; 
import Settings from './pages/Settings';
import ReferralDashboard from './pages/ReferralDashboard';
import SkillVerificationPage from './pages/SkillVerificationPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateVerificationPage from './pages/CertificateVerificationPage';
import VideoCallRoom from './pages/VideoCallRoom';
import LearningPathsPage from './pages/LearningPathsPage';
import PathDetailsPage from './pages/PathDetailsPage';
import PathLearningPage from './pages/PathLearningPage';
import MyLearningPage from './pages/MyLearningPage';
import CreatePathPage from './pages/CreatePathPage';
import WhiteboardPage from './pages/WhiteboardPage';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length === 0) {
    return children;
  }

  const userRole = user?.role || 'creator';
  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Your role ({userRole}) does not have permission to view this page.
          </p>
          <a href="/" className="btn btn-primary">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

// Public Route (redirect to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/" />;
};

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

function AppRoutes() {
  return (
    <>
      {/* ← REMOVED: <Navbar /> - Now handled by AppLayout */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/skills/:id" element={<SkillDetail />} />
        <Route path="/profile/:id" element={<UserProfile />} />
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/my-skills" 
          element={
            <ProtectedRoute>
              <MySkills />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/skills/create" 
          element={
            <ProtectedRoute>
              <CreateEditSkill />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/skills/:id/edit" 
          element={
            <ProtectedRoute>
              <CreateEditSkill />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/bookings" 
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } 
        />

        {/* ← NEW: Achievements Route */}
        <Route 
          path="/achievements" 
          element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          } 
        />

        {/* ← NEW: Analytics Route */}
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/skills/:skillId/verify" 
          element={
            <ProtectedRoute>
              <SkillVerificationPage />
            </ProtectedRoute>
          } 
        />

        <Route
         path="/certificates" 
         element={
           <ProtectedRoute>
             <CertificatesPage />
           </ProtectedRoute>
          } 
        />

        <Route
          path="/certificates/verify/:certificateId"
          element={
              <CertificateVerificationPage />
          }
        />

        <Route 
          path="/learning-paths" 
          element={<LearningPathsPage />} 
        />

        <Route 
          path="/learning-paths/create" 
          element={
            <RoleProtectedRoute allowedRoles={['creator', 'admin']}>
              <CreatePathPage />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/my-learning" 
          element={
            <ProtectedRoute>
              <MyLearningPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/learning-paths/:identifier" 
          element={<PathDetailsPage />} 
        />

        <Route 
          path="/learning-paths/:identifier/learn" 
          element={
            <ProtectedRoute>
              <PathLearningPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/referrals" 
          element={
            <ProtectedRoute>
              <ReferralDashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/video-call/:roomId" 
          element={
            <ProtectedRoute>
              <VideoCallRoom />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/whiteboard/:roomId" 
          element={
            <ProtectedRoute>
              <WhiteboardPage />
            </ProtectedRoute>
          } 
        />

        {/* 404 Route */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Page not found</p>
              <a href="/" className="px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                Go Home
              </a>
            </div>
          </div>
        } />
      </Routes>

      {/* Footer - Only show on public pages */}
      <Footer />
    </>
  );
}

// Footer Component
function Footer() {
  const { isAuthenticated } = useAuth();

  // Don't show footer on authenticated pages (sidebar handles it)
  if (isAuthenticated) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-white py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">SB</span>
              </div>
              <span className="text-xl font-bold">SkillBarter</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Exchange skills and knowledge using time-based credits. Learn, teach, and grow together.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/skills" className="hover:text-white transition-colors">Browse Skills</a></li>
              <li><a href="/my-skills" className="hover:text-white transition-colors">My Skills</a></li>
              <li><a href="/bookings" className="hover:text-white transition-colors">Bookings</a></li>
              <li><a href="/messages" className="hover:text-white transition-colors">Messages</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 SkillBarter. All rights reserved. Built with ❤️ for skill sharing.</p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <AuthProvider>
        <SocketProvider>
          {/* ← NEW: Wrap AppRoutes with AppLayout */}
          <AppLayout>
            <AppRoutes />
          </AppLayout>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#363636',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
