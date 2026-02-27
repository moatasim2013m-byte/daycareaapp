import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Zones from './pages/Zones';
import Users from './pages/Users';
import POS from './pages/POS';
import { Button } from './components/ui/button';
import { Receipt, LayoutDashboard, Building2, MapPin, Users as UsersIcon } from 'lucide-react';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-reverse space-x-8">
              <Link to="/admin" className="text-xl font-bold">
                نظام إدارة منطقة اللعب
              </Link>
              <div className="flex space-x-reverse space-x-4">
                <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
                  الرئيسية
                </Link>
                {['ADMIN', 'MANAGER'].includes(user?.role) && (
                  <>
                    <Link to="/admin/branches" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
                      الفروع
                    </Link>
                    <Link to="/admin/zones" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
                      المناطق
                    </Link>
                    <Link to="/admin/users" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100">
                      المستخدمون
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <PrivateRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/branches" element={
            <PrivateRoute>
              <AdminLayout>
                <Branches />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/zones" element={
            <PrivateRoute>
              <AdminLayout>
                <Zones />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/admin/users" element={
            <PrivateRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
