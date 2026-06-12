import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './components/layout/AppLayout';
import type { UserRole } from './types';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';
import CellGroups from './pages/admin/CellGroups';
import AllMembers from './pages/admin/AllMembers';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';
import MemberTransfers from './pages/admin/MemberTransfers';
import Reports from './pages/admin/Reports';
import SoulWinners from './pages/admin/SoulWinners';
import Partnerships from './pages/admin/Partnerships';
import EventsPrograms from './pages/admin/EventsPrograms';
import Meetings from './pages/admin/Meetings';
import JoinMeeting from './pages/meeting/JoinMeeting';
import EnvSetupScreen from './components/shared/EnvSetupScreen';
import BulkMessagingView from './components/shared/BulkMessagingView';
import ReflectionsView from './components/shared/ReflectionsView';
import DepartmentsView from './components/shared/DepartmentsView';
import SCLDashboard from './pages/scl/Dashboard';
import MyMembers from './pages/scl/MyMembers';
import Attendance from './pages/scl/Attendance';

// Welfare pages
import WelfareDashboard from './pages/welfare/Dashboard';
import MemberDatabase from './pages/welfare/MemberDatabase';
import BirthdayManagement from './pages/welfare/BirthdayManagement';
import Programs from './pages/welfare/Programs';
import PrayerRequests from './pages/welfare/PrayerRequests';

// Follow-up pages
import FollowUpDashboard from './pages/followup/Dashboard';
import FollowUpList from './pages/followup/FollowUpList';
import Visitations from './pages/followup/Visitations';

// Call Center pages
import CallCenterDashboard from './pages/callcenter/Dashboard';
import MemberOutreach from './pages/callcenter/MemberOutreach';
import CallHistory from './pages/callcenter/CallHistory';
import PartnershipComplete from './pages/partnership/PartnershipComplete';
import PartnershipSubscriptionComplete from './pages/partnership/PartnershipSubscriptionComplete';
import PartnershipSubscriptionView from './pages/partnership/PartnershipSubscriptionView';
import WelfarePartnerships from './pages/welfare/WelfarePartnerships';
import PartnershipSubscriptions from './pages/admin/PartnershipSubscriptions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const roleDefaultRoutes: Record<UserRole, string> = {
  MASTER_ADMIN: '/admin/dashboard',
  SCL: '/scl/dashboard',
  WELFARE: '/welfare/dashboard',
  FOLLOWUP: '/followup/dashboard',
  CALL_CENTER: '/callcenter/dashboard',
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to={roleDefaultRoutes[profile.role] || '/login'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { profile, loading } = useAuth();

  // Never block public pages — show login immediately while auth initializes
  if (loading) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/partnership/complete" element={<PartnershipComplete />} />
        <Route path="/partnership/subscription-complete" element={<PartnershipSubscriptionComplete />} />
        <Route path="/join/:slug" element={<JoinMeeting />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/partnership/complete" element={<PartnershipComplete />} />
      <Route path="/partnership/subscription-complete" element={<PartnershipSubscriptionComplete />} />
      <Route path="/join/:slug" element={<JoinMeeting />} />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          profile
            ? <Navigate to={roleDefaultRoutes[profile.role]} replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['MASTER_ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="password-requests" element={<PasswordResetRequests />} />
        <Route path="cell-groups" element={<CellGroups />} />
        <Route path="members" element={<AllMembers />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="transfers" element={<MemberTransfers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="soul-winners" element={<SoulWinners />} />
        <Route path="partnerships" element={<Partnerships />} />
        <Route path="events" element={<EventsPrograms />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="bulk-messaging" element={<BulkMessagingView />} />
        <Route path="reflections" element={<ReflectionsView />} />
        <Route path="departments" element={<DepartmentsView />} />
        <Route path="departments/:departmentId" element={<DepartmentsView />} />
        <Route path="welfare-partnerships" element={<WelfarePartnerships />} />
        <Route path="partnership-subscriptions" element={<PartnershipSubscriptions />} />
        <Route path="partnership-subscription" element={<PartnershipSubscriptionView />} />
      </Route>
      <Route
        path="/scl"
        element={
          <ProtectedRoute allowedRoles={['SCL', 'MASTER_ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SCLDashboard />} />
        <Route path="members" element={<MyMembers />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="birthdays" element={<BirthdayManagement />} />
        <Route path="followups" element={<FollowUpList />} />
        <Route path="events" element={<EventsPrograms />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="reflections" element={<ReflectionsView />} />
        <Route path="departments" element={<DepartmentsView />} />
        <Route path="departments/:departmentId" element={<DepartmentsView />} />
        <Route path="notifications" element={<div className="p-4"><h1 className="text-xl font-heading font-bold">Notifications</h1><p className="text-slate-500 mt-2">Check your notification bell above.</p></div>} />
        <Route path="partnership-subscription" element={<PartnershipSubscriptionView />} />
      </Route>

      {/* Welfare Portal */}
      <Route
        path="/welfare"
        element={
          <ProtectedRoute allowedRoles={['WELFARE', 'MASTER_ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<WelfareDashboard />} />
        <Route path="members" element={<MemberDatabase />} />
        <Route path="birthdays" element={<BirthdayManagement />} />
        <Route path="programs" element={<Programs />} />
        <Route path="events" element={<EventsPrograms />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="prayer-requests" element={<PrayerRequests />} />
        <Route path="calendar" element={<Visitations />} />
        <Route path="bulk-sms" element={<BulkMessagingView />} />
        <Route path="reflections" element={<ReflectionsView />} />
        <Route path="departments" element={<DepartmentsView />} />
        <Route path="departments/:departmentId" element={<DepartmentsView />} />
        <Route path="welfare-partnerships" element={<WelfarePartnerships />} />
        <Route path="partnership-subscriptions" element={<PartnershipSubscriptions />} />
        <Route path="partnership-subscription" element={<PartnershipSubscriptionView />} />
        <Route path="reports" element={<div className="p-4"><h1 className="text-xl font-heading font-bold">Welfare Reports</h1><p className="text-slate-500 mt-2">Coming soon</p></div>} />
      </Route>

      {/* Follow-up Portal */}
      <Route
        path="/followup"
        element={
          <ProtectedRoute allowedRoles={['FOLLOWUP', 'MASTER_ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<FollowUpDashboard />} />
        <Route path="list" element={<FollowUpList />} />
        <Route path="visitations" element={<Visitations />} />
        <Route path="events" element={<EventsPrograms />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="reflections" element={<ReflectionsView />} />
        <Route path="departments" element={<DepartmentsView />} />
        <Route path="departments/:departmentId" element={<DepartmentsView />} />
        <Route path="reports" element={<div className="p-4"><h1 className="text-xl font-heading font-bold">Follow-up Reports</h1><p className="text-slate-500 mt-2">Coming soon</p></div>} />
        <Route path="partnership-subscription" element={<PartnershipSubscriptionView />} />
      </Route>

      {/* Call Center Portal */}
      <Route
        path="/callcenter"
        element={
          <ProtectedRoute allowedRoles={['CALL_CENTER', 'MASTER_ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<CallCenterDashboard />} />
        <Route path="outreach" element={<MemberOutreach />} />
        <Route path="call" element={<MemberOutreach />} />
        <Route path="sms" element={<MemberOutreach />} />
        <Route path="history" element={<CallHistory />} />
        <Route path="events" element={<EventsPrograms />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="reflections" element={<ReflectionsView />} />
        <Route path="departments" element={<DepartmentsView />} />
        <Route path="departments/:departmentId" element={<DepartmentsView />} />
        <Route path="bulk-sms" element={<BulkMessagingView />} />
        <Route path="reports" element={<div className="p-4"><h1 className="text-xl font-heading font-bold">Call Reports</h1><p className="text-slate-500 mt-2">Coming soon</p></div>} />
        <Route path="partnership-subscription" element={<PartnershipSubscriptionView />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <EnvSetupScreen>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </EnvSetupScreen>
    </QueryClientProvider>
  );
};

export default App;
