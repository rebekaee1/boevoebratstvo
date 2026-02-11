import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PrivacyPage from './pages/PrivacyPage';

// Dashboard pages
import StudentDashboard from './pages/student/StudentDashboard';
import SubmitWorkPage from './pages/student/SubmitWorkPage';
import ExpertDashboard from './pages/expert/ExpertDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import WorksPage from './pages/admin/WorksPage';
import CreateExpertPage from './pages/admin/CreateExpertPage';
import SettingsPage from './pages/admin/SettingsPage';

// Временная заглушка
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark">
      <div className="text-center">
        <h1 className="text-4xl font-display font-bold text-accent-gold-DEFAULT mb-4">
          {title}
        </h1>
        <p className="text-white/60">Страница в разработке...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* Toast уведомления */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#d4a017',
              secondary: '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#c41e3a',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Публичные страницы */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Личный кабинет участника */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/submit" element={<SubmitWorkPage />} />

        {/* Личный кабинет эксперта */}
        <Route path="/expert" element={<ExpertDashboard />} />

        {/* Панель администратора */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/works" element={<WorksPage />} />
        <Route path="/admin/experts" element={<CreateExpertPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />

        {/* 404 */}
        <Route path="*" element={<ComingSoon title="404 - Страница не найдена" />} />
      </Routes>
    </Router>
  );
}

export default App;
