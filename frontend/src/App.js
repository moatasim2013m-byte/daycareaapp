import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Branches from './pages/Branches';
import Zones from './pages/Zones';
import Users from './pages/Users';
import POS from './pages/POS';
import CheckIn from './pages/CheckIn';
import { Button } from './components/ui/button';
import { Receipt, LayoutDashboard, Building2, MapPin, Users as UsersIcon, Scan } from 'lucide-react';
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
              <Link to="/admin" className="text-xl font-bold text-gray-900">
                نظام إدارة منطقة اللعب
              </Link>
              <div className="flex space-x-reverse space-x-2">
                <Link 
                  to="/admin" 
                  className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium hover:bg-gray-100 transition-colors"
                  data-testid="nav-dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  الرئيسية
                </Link>
                {['ADMIN', 'MANAGER', 'CASHIER'].includes(user?.role) && (
                  <Link 
                    to="/pos" 
                    className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium bg-playful-green/10 text-playful-green hover:bg-playful-green/20 transition-colors"
                    data-testid="nav-pos"
                  >
                    <Receipt className="w-4 h-4" />
                    نقطة البيع
                  </Link>
                )}
                {['ADMIN', 'MANAGER'].includes(user?.role) && (
                  <>
                    <Link 
                      to="/admin/branches" 
                      className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium hover:bg-gray-100 transition-colors"
                      data-testid="nav-branches"
                    >
                      <Building2 className="w-4 h-4" />
                      الفروع
                    </Link>
                    <Link 
                      to="/admin/zones" 
                      className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium hover:bg-gray-100 transition-colors"
                      data-testid="nav-zones"
                    >
                      <MapPin className="w-4 h-4" />
                      المناطق
                    </Link>
                    <Link 
                      to="/admin/users" 
                      className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium hover:bg-gray-100 transition-colors"
                      data-testid="nav-users"
                    >
                      <UsersIcon className="w-4 h-4" />
                      المستخدمون
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="rounded-button"
                data-testid="logout-btn"
              >
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
          <Route path="/pos" element={
            <PrivateRoute>
              <POS />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
