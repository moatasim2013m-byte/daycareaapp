import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Activity, AlertTriangle, Baby, CalendarDays, CreditCard, DollarSign, LineChart, ShoppingBag, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart as ReLineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const toSafeNumber = (value) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const money = (amount) => `${toSafeNumber(amount).toFixed(2)} د.أ`;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    revenue: null,
    attendance: null,
    sessions: null,
  });
  const [dashboardOps, setDashboardOps] = useState({
    openOrders: [],
    activeSubscriptions: [],
    activeCheckins: [],
    dailySummary: null,
  });
  const [children, setChildren] = useState([]);

  const safeChildren = Array.isArray(children) ? children : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (['ADMIN', 'RECEPTION', 'STAFF'].includes(user?.role)) {
          const [
            revenueRes,
            attendanceRes,
            sessionsRes,
            ordersRes,
            subscriptionsRes,
            activeCheckinsRes,
            dailySummaryRes,
          ] = await Promise.all([
            api.get('/analytics/revenue'),
            api.get('/analytics/attendance'),
            api.get('/analytics/sessions'),
            api.get('/orders', { params: { status_filter: 'OPEN', limit: 200 } }),
            api.get('/subscriptions', { params: { status_filter: 'ACTIVE' } }),
            api.get('/checkin/active'),
            api.get('/reports/daily-summary'),
          ]);

          setAnalytics({
            revenue: revenueRes.data,
            attendance: attendanceRes.data,
            sessions: sessionsRes.data,
          });

          setDashboardOps({
            openOrders: toSafeArray(ordersRes.data),
            activeSubscriptions: toSafeArray(subscriptionsRes.data),
            activeCheckins: toSafeArray(activeCheckinsRes.data),
            dailySummary: dailySummaryRes.data || null,
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

  const topProducts = useMemo(() => toSafeArray(analytics.revenue?.charts?.top_products), [analytics]);
  const membershipTrends = useMemo(() => toSafeArray(analytics.attendance?.charts?.membership_trends), [analytics]);
  const sessionMix = useMemo(() => toSafeArray(analytics.sessions?.charts?.session_mix), [analytics]);
  const sessionUtilization = useMemo(() => toSafeArray(analytics.sessions?.charts?.session_utilization), [analytics]);

  const openOrders = toSafeArray(dashboardOps.openOrders);
  const overtimeSensitiveOrders = openOrders.filter((order) => {
    const joinedItems = toSafeArray(order?.items)
      .map((item) => `${item?.product_name_en || ''} ${item?.product_name_ar || ''}`.toLowerCase())
      .join(' ');
    return joinedItems.includes('overtime') || joinedItems.includes('وقت إضافي');
  });

  const zonesSummary = sessionUtilization.reduce((acc, zone) => {
    const zoneName = zone?.name || 'غير محدد';
    acc[zoneName] = toSafeNumber(zone?.sessions);
    return acc;
  }, {});

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
            <Card className="peek-kpi peek-role-panel-admin"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">الجلسات النشطة الآن</p><p className="peek-kpi-value mt-1">{toSafeNumber(sessionsMetrics.active_sessions)}</p></div><Activity className="w-10 h-10 text-blue-500" /></div></CardContent></Card>
            <Card className="peek-kpi peek-role-panel-admin"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">زيارات اليوم</p><p className="peek-kpi-value mt-1">{toSafeNumber(attendanceMetrics.visits_today)}</p></div><Users className="w-10 h-10 text-orange-500" /></div></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShoppingBag className="w-4 h-4 text-blue-500" />طلبات مفتوحة/غير مدفوعة</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{openOrders.length}</p></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="w-4 h-4 text-playful-orange" />طلبات وقت إضافي</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{overtimeSensitiveOrders.length}</p></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="w-4 h-4 text-indigo-500" />اشتراكات نشطة</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dashboardOps.activeSubscriptions.length}</p></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="w-4 h-4 text-teal-500" />إيراد يومي (ملخص)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{money(dashboardOps.dailySummary?.revenue?.total)}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="text-base">ملخص المناطق</CardTitle></CardHeader><CardContent className="space-y-2">{Object.keys(zonesSummary).length === 0 ? <p className="text-sm text-gray-500">لا توجد بيانات مناطق</p> : Object.entries(zonesSummary).map(([name, count]) => (<div key={name} className="flex items-center justify-between text-sm"><span>{name}</span><strong>{count}</strong></div>))}</CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="text-base">جلسات دخول اليوم</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dashboardOps.activeCheckins.length}</p><p className="text-xs text-gray-500 mt-2">جلسات check-in النشطة حالياً</p></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="text-base">تحصيل الوقت الإضافي اليوم</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{money(dashboardOps.dailySummary?.revenue?.overtime)}</p><p className="text-xs text-gray-500 mt-2">من تقرير اليوم</p></CardContent></Card>
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
                  <ReLineChart data={membershipTrends}>
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

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle>Session Utilization</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionUtilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle>Session Mix</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sessionMix} dataKey="value" nameKey="name" outerRadius={90} fill="#6366f1" label />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
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
