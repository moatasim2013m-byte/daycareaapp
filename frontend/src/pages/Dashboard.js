import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Activity, AlertTriangle, Baby, CalendarDays, CreditCard, DollarSign, LineChart, ShoppingBag, Users, WifiOff } from 'lucide-react';

const toSafeNumber = (value) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const toSafeArray = (value) => (Array.isArray(value) ? value : []);

const money = (amount) => `${toSafeNumber(amount).toFixed(2)} د.أ`;

const safeIsoDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

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
    paidOrders: [],
    activeSubscriptions: [],
    activeCheckins: [],
    upcomingEvents: [],
    dailySummary: null,
  });
  const [children, setChildren] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState([]);
  const [errors, setErrors] = useState([]);

  const safeChildren = Array.isArray(children) ? children : [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (['ADMIN', 'RECEPTION', 'STAFF'].includes(user?.role)) {
          const adminRequests = [
            { key: 'revenue', label: 'تحليلات الإيرادات', request: api.get('/analytics/revenue') },
            { key: 'attendance', label: 'تحليلات الحضور', request: api.get('/analytics/attendance') },
            { key: 'sessions', label: 'تحليلات الجلسات', request: api.get('/analytics/sessions') },
            { key: 'openOrders', label: 'الطلبات المفتوحة', request: api.get('/orders', { params: { status_filter: 'OPEN', limit: 200 } }) },
            { key: 'paidOrders', label: 'المدفوعات الحديثة', request: api.get('/orders', { params: { status_filter: 'PAID', limit: 10 } }) },
            { key: 'subscriptions', label: 'الاشتراكات النشطة', request: api.get('/subscriptions', { params: { status_filter: 'ACTIVE' } }) },
            { key: 'activeCheckins', label: 'جلسات الحضور النشطة', request: api.get('/checkin/active') },
            { key: 'dailySummary', label: 'الملخص اليومي', request: api.get('/reports/daily-summary') },
            { key: 'deviceStatus', label: 'حالة الأجهزة', request: api.get('/devices/status') },
            { key: 'events', label: 'الفعاليات', request: api.get('/events') },
          ];
          const settled = await Promise.allSettled(adminRequests.map((item) => item.request));

          const payloadByKey = {};
          const failures = [];
          settled.forEach((result, idx) => {
            const descriptor = adminRequests[idx];
            if (result.status === 'fulfilled') {
              payloadByKey[descriptor.key] = result.value?.data;
            } else {
              payloadByKey[descriptor.key] = null;
              failures.push(descriptor.label);
            }
          });

          setAnalytics({
            revenue: payloadByKey.revenue || null,
            attendance: payloadByKey.attendance || null,
            sessions: payloadByKey.sessions || null,
          });

          setDashboardOps({
            openOrders: toSafeArray(payloadByKey.openOrders),
            paidOrders: toSafeArray(payloadByKey.paidOrders),
            activeSubscriptions: toSafeArray(payloadByKey.subscriptions),
            activeCheckins: toSafeArray(payloadByKey.activeCheckins),
            upcomingEvents: toSafeArray(payloadByKey.events),
            dailySummary: payloadByKey.dailySummary || null,
          });

          setDeviceStatuses(toSafeArray(payloadByKey.deviceStatus));
          setErrors(failures);
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

  const sessionUtilization = useMemo(() => toSafeArray(analytics.sessions?.charts?.session_utilization), [analytics]);

  const openOrders = toSafeArray(dashboardOps.openOrders);
  const paidOrders = toSafeArray(dashboardOps.paidOrders);
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

  const onlineDevices = deviceStatuses.filter((device) => device?.effectiveStatus === 'online').length;
  const offlineDevices = deviceStatuses.filter((device) => device?.effectiveStatus === 'offline').length;
  const maintenanceDevices = deviceStatuses.filter((device) => device?.effectiveStatus === 'maintenance').length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingEvents = toSafeArray(dashboardOps.upcomingEvents).filter((event) => {
    const eventDate = safeIsoDate(event?.date);
    return eventDate && eventDate.toISOString().slice(0, 10) >= todayIso && event?.status !== 'cancelled';
  });
  const upcomingEventsByStatus = upcomingEvents.reduce((acc, event) => {
    const status = event?.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
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

          {errors.length > 0 && (
            <Card className="peek-card peek-role-panel-admin border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <p className="text-sm text-amber-800">
                  بعض مصادر البيانات غير متاحة حالياً: {errors.join('، ')}. يتم عرض البيانات المتوفرة فقط.
                </p>
              </CardContent>
            </Card>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="text-base">ملخص المناطق</CardTitle></CardHeader><CardContent className="space-y-2">{Object.keys(zonesSummary).length === 0 ? <p className="text-sm text-gray-500">لا توجد بيانات مناطق</p> : Object.entries(zonesSummary).map(([name, count]) => (<div key={name} className="flex items-center justify-between text-sm"><span>{name}</span><strong>{count}</strong></div>))}</CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="text-base">جلسات دخول اليوم</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dashboardOps.activeCheckins.length}</p><p className="text-xs text-gray-500 mt-2">جلسات check-in النشطة حالياً</p></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="text-base">إشارات الإيراد</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><div className="flex items-center justify-between"><span>اشتراكات</span><strong>{money(revenueMetrics.membership_revenue || dashboardOps.dailySummary?.revenue?.subscriptions)}</strong></div><div className="flex items-center justify-between"><span>باقات/زيارة</span><strong>{money(dashboardOps.dailySummary?.revenue?.visit_packs)}</strong></div><div className="flex items-center justify-between"><span>فعاليات</span><strong>{money(revenueMetrics.event_bookings_revenue)}</strong></div></CardContent></Card>
            <Card className="peek-card peek-role-panel-admin"><CardHeader><CardTitle className="text-base">ملخص الفعاليات القادمة</CardTitle></CardHeader><CardContent>{upcomingEvents.length === 0 ? <p className="text-sm text-gray-500">لا توجد فعاليات قادمة حالياً</p> : <div className="space-y-2"><p className="text-2xl font-bold">{upcomingEvents.length}</p>{Object.entries(upcomingEventsByStatus).map(([status, count]) => (<div key={status} className="flex items-center justify-between text-sm"><span>{status}</span><strong>{count}</strong></div>))}</div>}</CardContent></Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle>آخر المدفوعات</CardTitle></CardHeader>
              <CardContent>
                {paidOrders.length === 0 ? (
                  <p className="text-sm text-gray-500">لا توجد مدفوعات حديثة متاحة</p>
                ) : (
                  <div className="space-y-2">
                    {paidOrders.slice(0, 6).map((order) => (
                      <div key={order.order_id || order.order_number} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{order.order_number || order.order_id || 'طلب'}</div>
                          <div className="text-xs text-gray-500">{order.guardian_name || order.child_name || 'عميل غير محدد'}</div>
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{money(order.total_amount)}</div>
                          <div className="text-xs text-gray-500">{safeIsoDate(order.paid_at || order.created_at)?.toLocaleString() || 'وقت غير متاح'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="peek-card peek-role-panel-admin">
              <CardHeader><CardTitle className="flex items-center gap-2"><WifiOff className="w-4 h-4" />حالة أجهزة الاستقبال</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-center"><div className="text-xs">Online</div><div className="text-xl font-semibold">{onlineDevices}</div></div>
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-center"><div className="text-xs">Maintenance</div><div className="text-xl font-semibold">{maintenanceDevices}</div></div>
                  <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-center"><div className="text-xs">Offline</div><div className="text-xl font-semibold">{offlineDevices}</div></div>
                </div>
                {deviceStatuses.length === 0 ? (
                  <div className="text-sm text-gray-500">لا توجد أجهزة مسجلة حالياً</div>
                ) : (
                  <div className="space-y-2">
                    {deviceStatuses.slice(0, 5).map((device) => (
                      <div key={device.id} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
                        <div>
                          <div className="font-medium text-sm">{device.id}</div>
                          <div className="text-xs text-gray-500">{device.deviceType} • {device.branchId}</div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {device.effectiveStatus || 'unknown'} {device.lastSeen ? `• ${new Date(device.lastSeen).toLocaleTimeString()}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
