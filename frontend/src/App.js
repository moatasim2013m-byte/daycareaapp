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
import ParentDashboard from './pages/ParentDashboard';
import ParentDailyReport from './pages/ParentDailyReport';
import ParentMessages from './pages/ParentMessages';
import ParentPickups from './pages/ParentPickups';
import EventBooking from './pages/EventBooking';

const ROLES = {
  ADMIN: 'ADMIN',
  RECEPTION: 'RECEPTION',
  STAFF: 'STAFF',
  PARENT: 'PARENT'
};

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toUpperCase?.() || user?.role;

  if (roles && !roles.includes(userRole)) {
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
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RECEPTION, ROLES.STAFF]}>
                <CheckIn />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RECEPTION, ROLES.STAFF]}>
                <POS />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <Users />
              </ProtectedRoute>
            }
          />

          <Route
            path="/branches"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
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
            path="/events"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RECEPTION, ROLES.STAFF]}>
                <EventBooking />
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
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <TeacherToday />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <TeacherAttendance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/child/:childId/log"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <TeacherChildLog />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/activity/new"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <TeacherNewActivity />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/messages"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <TeacherMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/pickup-check"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <TeacherPickupCheck />
              </ProtectedRoute>
            }
          />


          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/feed"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <ParentFeed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/daily-report"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <ParentDailyReport />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/messages"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <ParentMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/pickups"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
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
