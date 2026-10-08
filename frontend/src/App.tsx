import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useChildren } from './contexts/ChildContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import StoryGeneratePage from './pages/StoryGeneratePage';
import StoryReaderPage from './pages/StoryReaderPage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/DashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import ChildManagementPage from './pages/ChildManagementPage';
import StoryHistoryPage from './pages/StoryHistoryPage';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function ChildRequiredRoute({ children }: { children: React.ReactNode }) {
  const { selectedChild } = useChildren();
  
  if (!selectedChild) {
    return <Navigate to="/children" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/children" element={<ChildManagementPage />} />
        <Route path="/history" element={<StoryHistoryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/teacher" element={<TeacherDashboardPage />} />
        
        <Route element={<ChildRequiredRoute><Layout /></ChildRequiredRoute>}>
          <Route path="/generate" element={<StoryGeneratePage />} />
          <Route path="/story/:storyId" element={<StoryReaderPage />} />
          <Route path="/assess/:storyId" element={<AssessmentPage />} />
          <Route path="/results/:assessmentId" element={<ResultsPage />} />
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;