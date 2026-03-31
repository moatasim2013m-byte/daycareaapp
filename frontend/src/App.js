import React from 'react';
import '@/App.css';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, ROLES, getRoleHomePath, useAuth } from './context/AuthContext';

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
import TeacherDailyReport from './pages/TeacherDailyReport';

import {
  Baby, LogOut, LayoutDashboard, UserCheck, ShoppingBag,
  UsersRound, Building2, MapPin, Receipt, CalendarDays,
  ClipboardList, MessageSquare, UserCheck2, Rss, FileText,
  Mail, Car, Menu, X, Sparkles
} from 'lucide-react';

/* ─── Navigation definitions per role ─── */
const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
    { to: '/checkin', label: 'تسجيل الحضور', icon: UserCheck },
    { to: '/pos', label: 'نقطة البيع', icon: ShoppingBag },
    { to: '/users', label: 'المستخدمون', icon: UsersRound },
    { to: '/branches', label: 'الفروع', icon: Building2 },
    { to: '/zones', label: 'المناطق', icon: MapPin },
    { to: '/billing', label: 'الفوترة', icon: Receipt },
    { to: '/events', label: 'الفعاليات', icon: CalendarDays },
  ],
  [ROLES.STAFF]: [
    { to: '/checkin', label: 'تسجيل الحضور', icon: UserCheck },
    { to: '/pos', label: 'نقطة البيع', icon: ShoppingBag },
    { to: '/events', label: 'الفعاليات', icon: CalendarDays },
    { to: '/teacher/today', label: 'اليوم', icon: ClipboardList },
    { to: '/teacher/attendance', label: 'الحضور', icon: UserCheck2 },
    { to: '/teacher/messages', label: 'الرسائل', icon: MessageSquare },
    { to: '/teacher/pickup-check', label: 'الاستلام', icon: Car },
    { to: '/teacher/daily-report', label: 'تقرير AI', icon: Sparkles },
  ], [ROLES.RECEPTION]: [
    { to: '/checkin', label: 'تسجيل الحضور', icon: UserCheck },
    { to: '/pos', label: 'نقطة البيع', icon: ShoppingBag },
    { to: '/events', label: 'الفعاليات', icon: CalendarDays },
  ],
  [ROLES.PARENT]: [
    { to: '/parent/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { to: '/parent/feed', label: 'الخلاصة', icon: Rss },
    { to: '/parent/daily-report', label: 'التقرير اليومي', icon: FileText },
    { to: '/parent/messages', label: 'الرسائل', icon: Mail },
    { to: '/parent/pickups', label: 'الاستلام', icon: Car },
  ],
};

/* ─── Role badge helper ─── */
const ROLE_LABELS = {
  [ROLES.ADMIN]: { text: 'مشرف', color: 'bg-sky-100 text-sky-700' },
  [ROLES.STAFF]: { text: 'موظف', color: 'bg-orange-100 text-orange-700' },
  [ROLES.RECEPTION]: { text: 'استقبال', color: 'bg-teal-100 text-teal-700' },
  [ROLES.PARENT]: { text: 'ولي أمر', color: 'bg-amber-100 text-amber-700' },
};

/* ─── Role-aware Navigation Shell ─── */
const RoleNavShell = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const role = user?.role;
  const navItems = NAV_ITEMS[role] || [];
  const roleBadge = ROLE_LABELS[role] || { text: role, color: 'bg-gray-100 text-gray-700' };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[76rem] mx-auto px-4 flex items-center justify-between h-14">
          {/* Logo + brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Baby className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:inline">Peekaboo</span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User info + mobile toggle */}
          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-semibold ${roleBadge.color}`}>
              {roleBadge.text}
            </span>
            <span className="hidden md:inline text-sm text-gray-600 max-w-[140px] truncate">
              {user?.display_name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 pb-3 pt-2 space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleBadge.color}`}>
                {roleBadge.text}
              </span>
              <span className="text-sm text-gray-700 truncate">{user?.display_name || user?.email}</span>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>
    </div>
  );
};

/* ─── Unauthorized page (shown instead of silent redirect) ─── */
const UnauthorizedPage = () => {
  const { user } = useAuth();
  const homePath = getRoleHomePath(user?.role);
  const location = useLocation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">غير مصرح بالوصول</h2>
        <p className="text-gray-500 mb-1">
          ليس لديك صلاحية للوصول إلى هذه الصفحة.
        </p>
        <p className="text-xs text-gray-400 mb-6 font-mono" dir="ltr">{location.pathname}</p>
        <NavLink
          to={homePath}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm hover:from-blue-600 hover:to-purple-600 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          العودة إلى صفحتك الرئيسية
        </NavLink>
      </div>
    </div>
  );
};

/* ─── Protected Route with role-aware unauthorized handling ─── */
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
    return <RoleNavShell><UnauthorizedPage /></RoleNavShell>;
  }

  return children;
};

/* ─── Role-based redirect for / ─── */
const RoleHomeRedirect = () => {
  const { user } = useAuth();
  const role = user?.role;
  // Admin stays on /, everyone else redirects
  if (role === ROLES.ADMIN) return null; // let it render Dashboard below
  const target = getRoleHomePath(role);
  return <Navigate to={target} replace />;
};

/* ─── Catch-all: redirect to role home ─── */
const CatchAllRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* All protected routes wrapped in RoleNavShell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleNavShell>
                  <RoleHomeRedirect />
                  <Dashboard />
                </RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkin"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RECEPTION, ROLES.STAFF]}>
                <RoleNavShell><CheckIn /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RECEPTION, ROLES.STAFF]}>
                <RoleNavShell><POS /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <RoleNavShell><Users /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/branches"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN]}>
                <RoleNavShell><Branches /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/zones"
            element={
              <ProtectedRoute>
                <RoleNavShell><Zones /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RECEPTION, ROLES.STAFF]}>
                <RoleNavShell><EventBooking /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/guides/parent-communication-step-4"
            element={
              <ProtectedRoute>
                <RoleNavShell><ParentCommunicationGuide /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <RoleNavShell><BillingAccountingDemo /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/today"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <RoleNavShell><TeacherToday /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <RoleNavShell><TeacherAttendance /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/child/:childId/log"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <RoleNavShell><TeacherChildLog /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/activity/new"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <RoleNavShell><TeacherNewActivity /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/messages"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <RoleNavShell><TeacherMessages /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/pickup-check"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <RoleNavShell><TeacherPickupCheck /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/teacher/daily-report"
            element={
              <ProtectedRoute roles={[ROLES.ADMIN, ROLES.STAFF]}>
                <RoleNavShell><TeacherDailyReport /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <RoleNavShell><ParentDashboard /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/feed"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <RoleNavShell><ParentFeed /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/daily-report"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <RoleNavShell><ParentDailyReport /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/messages"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <RoleNavShell><ParentMessages /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent/pickups"
            element={
              <ProtectedRoute roles={[ROLES.PARENT, ROLES.ADMIN]}>
                <RoleNavShell><ParentPickups /></RoleNavShell>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<CatchAllRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
