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
import ParentCommunicationGuide from './pages/ParentCommunicationGuide';

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
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/checkin"
            element={(
              <ProtectedRoute roles={['ADMIN', 'MANAGER', 'CASHIER', 'ATTENDANT', 'RECEPTION', 'STAFF']}>
                <CheckIn />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/pos"
            element={(
              <ProtectedRoute roles={['ADMIN', 'MANAGER', 'CASHIER', 'RECEPTION', 'STAFF']}>
                <POS />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/users"
            element={(
              <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                <Users />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/branches"
            element={(
              <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                <Branches />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/zones"
            element={(
              <ProtectedRoute>
                <Zones />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/guides/parent-communication-step-4"
            element={(
              <ProtectedRoute>
                <ParentCommunicationGuide />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
