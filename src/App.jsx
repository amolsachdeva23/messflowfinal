import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { MessDataProvider } from '@/lib/MessDataContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import DashboardLayout from '@/components/layout/DashboardLayout';
import StudentLayout from '@/components/student/StudentLayout';
import Overview from '@/pages/Overview';
import LiveQueue from '@/pages/LiveQueue';
import FoodPlanning from '@/pages/FoodPlanning';
import MenuTimings from '@/pages/MenuTimings';
import InventoryLeftovers from '@/pages/InventoryLeftovers';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import StudentHome from '@/pages/student/StudentHome';
import StudentMenu from '@/pages/student/StudentMenu';
import StudentQueue from '@/pages/student/StudentQueue';
import StudentNotices from '@/pages/student/StudentNotices';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/queue" element={<LiveQueue />} />
        <Route path="/planning" element={<FoodPlanning />} />
        <Route path="/menu" element={<MenuTimings />} />
        <Route path="/inventory" element={<InventoryLeftovers />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentHome />} />
        <Route path="menu" element={<StudentMenu />} />
        <Route path="queue" element={<StudentQueue />} />
        <Route path="notices" element={<StudentNotices />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <MessDataProvider>
            <AuthenticatedApp />
          </MessDataProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App