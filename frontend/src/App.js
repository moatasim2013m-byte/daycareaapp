import React from 'react';
import '@/App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import POS from './pages/POS';
import Users from './pages/Users';
import Branches from './pages/Branches';
import Zones from './pages/Zones';
import BillingAccountingDemo from './pages/BillingAccountingDemo';
import ParentCommunicationGuide from './pages/ParentCommunicationGuide';
import TeacherToday from './pages/TeacherToday';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherChildLog from './pages/TeacherChildLog';
import TeacherNewActivity from './pages/TeacherNewActivity';
import TeacherMessages from './pages/TeacherMessages';
import TeacherPickupCheck from './pages/TeacherPickupCheck';
import ParentFeed from './pages/ParentFeed';
import ParentDailyReport from './pages/ParentDailyReport';
import ParentMessages from './pages/ParentMessages';
import ParentPickups from './pages/ParentPickups';
import ParentDashboard from './pages/ParentDashboard';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkin"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGER', 'CASHIER', 'ATTENDANT', 'RECEPTION', 'STAFF']}>
                <CheckIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGER', 'CASHIER', 'RECEPTION', 'STAFF']}>
                <POS />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branches"
            element={
              <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                <Branches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/zones"
            element={
              <ProtectedRoute>
                <Zones />
              </ProtectedRoute>
            }
          />


          <Route
            path="/guides/parent-communication-step-4"
            element={
              <ProtectedRoute>
                <ParentCommunicationGuide />
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <BillingAccountingDemo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/today"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <TeacherToday />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <TeacherAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/child/:childId/log"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <TeacherChildLog />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/activity/new"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <TeacherNewActivity />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/messages"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <TeacherMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/pickup-check"
            element={
              <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                <TeacherPickupCheck />
              </ProtectedRoute>
            }
          />


          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute roles={['PARENT', 'ADMIN']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/feed"
            element={
              <ProtectedRoute roles={['PARENT', 'ADMIN']}>
                <ParentFeed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/daily-report"
            element={
              <ProtectedRoute roles={['PARENT', 'ADMIN']}>
                <ParentDailyReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/messages"
            element={
              <ProtectedRoute roles={['PARENT', 'ADMIN']}>
                <ParentMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/pickups"
            element={
              <ProtectedRoute roles={['PARENT', 'ADMIN']}>
                <ParentPickups />
              </ProtectedRoute>
            }
          />


          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
