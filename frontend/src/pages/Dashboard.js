import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Activity, Baby, CalendarDays, CreditCard, DollarSign, LineChart, ShoppingBag, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart as ReLineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const toSafeNumber = (value) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const money = (amount) => `${toSafeNumber(amount).toFixed(2)} د.أ`;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    revenue: null,
    attendance: null,
    sessions: null,
  });
  const [children, setChildren] = useState([]);

  const safeChildren = Array.isArray(children) ? children : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (['ADMIN', 'RECEPTION', 'STAFF'].includes(user?.role)) {
          const [revenueRes, attendanceRes, sessionsRes] = await Promise.all([
            api.get('/analytics/revenue'),
            api.get('/analytics/attendance'),
            api.get('/analytics/sessions'),
          ]);

          setAnalytics({
            revenue: revenueRes.data,
            attendance: attendanceRes.data,
            sessions: sessionsRes.data,
          });
        } else {
          const childrenRes = await api.get('/children');
          setChildren(Array.isArray(childrenRes.data) ? childrenRes.data : []);
        }
      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const topProducts = useMemo(() => analytics.revenue?.charts?.top_products || [], [analytics]);

  const getElapsedMinutes = (session) => {
    if (typeof session.durationMinutes === 'number' && session.durationMinutes >= 0) {
      return session.durationMinutes;
    }

    const start = session.sessionStart || session.started_at || session.checkin_at;
    if (!start) return 0;

    const startedAt = new Date(start);
    return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 60000));
  };

  const getCurrentCost = (session) => {
    const totalCharge = toSafeNumber(session.totalCharge);
    if (totalCharge > 0 || session.totalCharge === 0 || session.totalCharge === '0') {
      return totalCharge.toFixed(2);
    }
    return '0.00';
  };

  if (loading) {
    return (
      <div className="peek-page peek-role-admin flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (['ADMIN', 'RECEPTION', 'STAFF'].includes(user?.role)) {
    const revenueMetrics = analytics.revenue?.metrics || {};
    const attendanceMetrics = analytics.attendance?.metrics || {};
    const sessionsMetrics = analytics.sessions?.metrics || {};

    return (
      <div className="peek-page peek-role-admin" dir="rtl">
        <div className="peek-shell space-y-6">
          <div className="peek-header peek-header--admin flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">لوحة تحليلات الأعمال</h1>
              <p className="text-gray-500">تحليلات الإيرادات والجلسات والحضور في الوقت الحقيقي</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/guides/parent-communication-step-4">دليل التواصل مع أولياء الأمور</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="peek-kpi peek-role-panel-admin"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">إيراد اليوم</p><p className="peek-kpi-value mt-1">{money(revenueMetrics.revenue_today)}</p></div><DollarSign className="w-10 h-10 text-emerald-500" /></div></CardContent></Card>
            <Card className="peek-kpi peek-role-panel-admin"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">إيراد هذا الأسبوع</p><p className="peek-kpi-value mt-1">{money(revenueMetrics.revenue_this_week)}</p></div><LineChart className="w-10 h-10 text-violet-500" /></div></CardContent></Card>
            <Card className="peek-kpi peek-role-panel-admin"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">الجلسات النشطة</p><p className="peek-kpi-value mt-1">{sessionsMetrics.active_sessions || 0}</p></div><Activity className="w-10 h-10 text-blue-500" /></div></CardContent></Card>
            <Card className="peek-kpi peek-role-panel-admin"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">زيارات اليوم</p><p className="peek-kpi-value mt-1">{attendanceMetrics.visits_today || 0}</p></div><Users className="w-10 h-10 text-orange-500" /></div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="w-4 h-4 text-indigo-500" />إيراد الاشتراكات</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{money(revenueMetrics.membership_revenue)}</p></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShoppingBag className="w-4 h-4 text-emerald-500" />إيراد نقاط البيع POS</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{money(revenueMetrics.pos_revenue)}</p></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="w-4 h-4 text-rose-500" />إيراد حجوزات الفعاليات</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{money(revenueMetrics.event_bookings_revenue)}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle>Daily Revenue Chart</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={analytics.revenue?.charts?.daily_revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </ReLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle>Session Utilization</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sessions?.charts?.session_utilization || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {topProducts.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">لا توجد مبيعات كافية لعرض المنتجات الأعلى</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ left: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle>Membership Trends</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={analytics.attendance?.charts?.membership_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="memberships" stroke="#f59e0b" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                  </ReLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="peek-card peek-role-panel-admin">
            <CardHeader><CardTitle>Session Mix</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.sessions?.charts?.session_mix || []} dataKey="value" nameKey="name" outerRadius={90} fill="#6366f1" label />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell space-y-6">
        <div className="peek-header peek-header--parent">
          <h1 className="text-2xl font-bold text-gray-900">مرحباً {user?.display_name}</h1>
          <p className="text-gray-500">واجهة Peekaboo العائلية</p>
        </div>

        {user?.role === 'PARENT' && (
          <Card className="peek-card peek-role-panel-admin">
            <CardHeader><CardTitle className="text-lg">قسم ولي الأمر</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/parent/dashboard">لوحة ولي الأمر</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/parent/feed">الخلاصة اليومية</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/parent/daily-report">التقرير اليومي</Link></Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="peek-card peek-role-panel-admin">
            <CardHeader><CardTitle className="flex items-center gap-2"><Baby className="w-5 h-5 text-blue-500" />أطفالي</CardTitle></CardHeader>
            <CardContent>
              {safeChildren.length === 0 ? (
                <div className="peek-empty"><p className="text-gray-500 mb-4">لم تقم بإضافة أطفال بعد</p><Button variant="outline">إضافة طفل</Button></div>
              ) : (
                <div className="space-y-3">{safeChildren.map((child) => (<div key={child.child_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><p className="font-medium">{child.full_name}</p><p className="text-sm text-gray-500">{child.age_years} سنوات</p></div><Button variant="outline" size="sm">عرض</Button></div>))}</div>
              )}
            </CardContent>
          </Card>

          <Card className="peek-card peek-role-panel-admin">
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-green-500" />الباقات والاشتراكات</CardTitle></CardHeader>
            <CardContent>
              <div className="peek-empty"><p className="text-gray-500 mb-4">شراء اشتراك أو باقة زيارات</p><Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">تصفح الباقات</Button></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
