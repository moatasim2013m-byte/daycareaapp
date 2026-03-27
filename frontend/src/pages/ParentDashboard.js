import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const DEFAULT_PAYMENTS = {
  subscription_status: 'NONE',
  payment_history: [],
  visit_pack: null,
  recent_orders: [],
};

const DEFAULT_BOOKINGS = {
  session_visits: [],
  upcoming_event: null,
};

const CHILD_STORAGE_KEYS = [
  'children',
  'childProfiles',
  'daycareChildren',
  'kids',
  'children:list',
  'cachedChildren',
  'parentChildren',
];

const asArray = (value) => (Array.isArray(value) ? value : []);

const parseStoredList = (raw) => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.children)) return parsed.children;
    if (Array.isArray(parsed?.items)) return parsed.items;
    return [];
  } catch {
    return [];
  }
};

const formatDate = (value, options = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ar-JO', options);
};

const formatCurrency = (amount, currency = 'JOD') => {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) return `— ${currency}`;

  return new Intl.NumberFormat('en-JO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

const getAgeLabel = (child) => {
  if (child?.age_label) return child.age_label;

  const ageYears = child?.age_years ?? child?.ageYears;
  if (ageYears !== undefined && ageYears !== null && ageYears !== '') {
    return `${ageYears} سنة`;
  }

  const ageMonths = child?.child_age_months ?? child?.age_months ?? child?.ageMonths;
  if (ageMonths !== undefined && ageMonths !== null && ageMonths !== '') {
    const months = Number(ageMonths);
    if (!Number.isNaN(months)) {
      if (months >= 12) {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0 ? `${years} سنة و${remainingMonths} شهر` : `${years} سنة`;
      }
      return `${months} شهر`;
    }
  }

  const dob = child?.date_of_birth ?? child?.dob ?? child?.child_dob ?? child?.birth_date;
  if (dob) {
    const parsed = new Date(dob);
    if (!Number.isNaN(parsed.getTime())) {
      const now = new Date();
      let months = (now.getFullYear() - parsed.getFullYear()) * 12 + (now.getMonth() - parsed.getMonth());
      if (now.getDate() < parsed.getDate()) months -= 1;
      if (months >= 12) {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        return remainingMonths > 0 ? `${years} سنة و${remainingMonths} شهر` : `${years} سنة`;
      }
      if (months >= 0) return `${months} شهر`;
    }
  }

  return 'العمر غير متوفر';
};

const getChildStatus = (child) => {
  return child?.status || child?.child_status || child?.enrollment_status || child?.state || 'الحالة غير متوفرة';
};

const readChildrenFromStorage = () => {
  for (const key of CHILD_STORAGE_KEYS) {
    const storedChildren = parseStoredList(localStorage.getItem(key));
    if (storedChildren.length > 0) {
      return storedChildren;
    }
  }

  return [];
};

const normalizeChildSummary = (child, index) => {
  const childId = child?.child_id ?? child?.childId ?? child?.id ?? child?.customer_id ?? child?.customerId ?? `child-${index + 1}`;
  const name = child?.full_name ?? child?.fullName ?? child?.child_name ?? child?.childName ?? child?.name ?? `الطفل ${index + 1}`;

  return {
    id: String(childId),
    name,
    ageLabel: getAgeLabel(child),
    status: getChildStatus(child),
    guardianName: child?.guardian_name ?? child?.guardianName ?? child?.parent_name ?? child?.guardian?.name ?? null,
    householdId: child?.household_id ?? child?.householdId ?? child?.family_id ?? null,
    customerId: child?.customer_id ?? child?.customerId ?? null,
  };
};

const pickEventDate = (entry) => entry?.date || entry?.start_at || entry?.startAt || entry?.event_date;

const isUpcoming = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= new Date(new Date().setHours(0, 0, 0, 0));
};

const ParentDashboard = () => {
  const [feed, setFeed] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState(DEFAULT_BOOKINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/parent/feed'),
          api.get('/parent/attendance'),
          api.get('/parent/payments'),
          api.get('/parent/messages'),
          api.get('/parent/bookings'),
        ]);

        const [feedRes, attendanceRes, paymentsRes, messagesRes, bookingsRes] = results;

        setFeed(feedRes.status === 'fulfilled' ? asArray(feedRes.value?.data) : []);
        setAttendance(attendanceRes.status === 'fulfilled' ? asArray(attendanceRes.value?.data) : []);
        setPayments(paymentsRes.status === 'fulfilled' ? (paymentsRes.value?.data || DEFAULT_PAYMENTS) : DEFAULT_PAYMENTS);
        setMessages(messagesRes.status === 'fulfilled' ? asArray(messagesRes.value?.data) : []);
        setBookings(bookingsRes.status === 'fulfilled' ? (bookingsRes.value?.data || DEFAULT_BOOKINGS) : DEFAULT_BOOKINGS);
      } catch (error) {
        console.error('Failed to load parent dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const children = useMemo(
    () => readChildrenFromStorage().map(normalizeChildSummary).filter(Boolean),
    [],
  );

  const recentVisits = useMemo(
    () => asArray(attendance).slice(0, 3),
    [attendance],
  );

  const recentPayments = useMemo(
    () => asArray(payments?.payment_history).slice(0, 2),
    [payments],
  );

  const recentOrders = useMemo(
    () => asArray(payments?.recent_orders).slice(0, 2),
    [payments],
  );

  const upcomingVisit = useMemo(
    () => asArray(bookings?.session_visits).find((entry) => isUpcoming(pickEventDate(entry))) || null,
    [bookings],
  );

  const upcomingEvent = useMemo(() => {
    if (bookings?.upcoming_event && isUpcoming(pickEventDate(bookings.upcoming_event))) {
      return bookings.upcoming_event;
    }
    return null;
  }, [bookings]);

  const latestMessage = useMemo(() => asArray(messages)[0] || null, [messages]);

  const stats = useMemo(() => ({
    childrenCount: children.length,
    dailyReports: asArray(feed).filter((item) => item?.type === 'daily_report').length,
    upcomingCount: [upcomingVisit, upcomingEvent].filter(Boolean).length,
    paymentItems: recentPayments.length + recentOrders.length,
    packageStatus: payments?.visit_pack?.status || payments?.subscription_status || 'NONE',
  }), [children.length, feed, upcomingVisit, upcomingEvent, recentPayments.length, recentOrders.length, payments]);

  if (loading) {
    return (
      <div className="peek-page peek-role-parent flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-5xl space-y-4 md:space-y-6">
        <div className="peek-header peek-header--parent flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">الرئيسية لولي الأمر</h1>
            <p className="text-sm text-gray-600 sm:text-base">
              ملخص سريع للأطفال، الزيارات، الباقات، الدفعات، وأقرب التحديثات المهمة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/parent/messages">إضافة طفل</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/billing">تصفح الباقات</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card className="peek-card">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 sm:text-sm">الأطفال المرتبطون</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.childrenCount}</p>
            </CardContent>
          </Card>
          <Card className="peek-card">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 sm:text-sm">التقارير اليومية</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.dailyReports}</p>
            </CardContent>
          </Card>
          <Card className="peek-card">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 sm:text-sm">حالة الباقة</p>
              <p className="text-lg font-semibold text-gray-900">{stats.packageStatus}</p>
            </CardContent>
          </Card>
          <Card className="peek-card">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 sm:text-sm">القادم قريبًا</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.upcomingCount}</p>
            </CardContent>
          </Card>
          <Card className="peek-card col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 sm:text-sm">حركات مالية حديثة</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.paymentItems}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="peek-card">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>ملخص الأطفال</CardTitle>
                <p className="mt-1 text-sm text-gray-500">عرض سريع لكل طفل مرتبط بحسابك.</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/parent/messages">إضافة طفل</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {children.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4 text-gray-700">
                  <p className="font-medium text-gray-900">لا يوجد طفل مرتبط بحسابك حتى الآن.</p>
                  <p className="mt-1 text-sm text-gray-600">
                    استخدم زر <span className="font-semibold">إضافة طفل</span> لفتح الرسائل وطلب ربط أو إنشاء ملف الطفل مع الفريق.
                  </p>
                </div>
              ) : (
                children.map((child) => (
                  <div key={child.id} className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{child.name}</p>
                        <p className="text-gray-600">العمر: {child.ageLabel}</p>
                        <p className="text-gray-600">الحالة: {child.status}</p>
                      </div>
                      {child.customerId && (
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">
                          #{child.customerId}
                        </span>
                      )}
                    </div>
                    {(child.guardianName || child.householdId) && (
                      <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-gray-500 sm:grid-cols-2">
                        <p>ولي الأمر: {child.guardianName || '—'}</p>
                        <p>الأسرة: {child.householdId || '—'}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>الباقات والاشتراكات</CardTitle>
                <p className="mt-1 text-sm text-gray-500">حالة الاشتراك الحالي والزيارات المتبقية إن وجدت.</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/billing">تصفح الباقات</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-gray-600">حالة الاشتراك</p>
                <p className="text-lg font-semibold text-gray-900">{payments?.subscription_status || 'NONE'}</p>
              </div>

              {payments?.visit_pack ? (
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="font-semibold text-gray-900">{payments.visit_pack.name || 'باقة زيارات'}</p>
                  <div className="mt-2 space-y-1 text-gray-600">
                    <p>الحالة: {payments.visit_pack.status || '—'}</p>
                    <p>الزيارات المتبقية: {payments.visit_pack.visits_remaining ?? payments.visit_pack.remaining_visits ?? '—'}</p>
                    <p>التجديد / الانتهاء: {formatDate(payments.visit_pack.renewal_date || payments.visit_pack.expiry_date || payments.visit_pack.expires_at, { dateStyle: 'medium' })}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-600">
                  <p className="font-medium text-gray-900">لا توجد باقة نشطة ظاهرة الآن.</p>
                  <p className="mt-1">يمكنك تصفح الباقات أو مراسلة الفريق لمعرفة الأنسب لطفلك.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/billing">تصفح الباقات</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/parent/messages">مراسلة الفريق</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="peek-card">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>الزيارات والحضور الأخير</CardTitle>
                <p className="mt-1 text-sm text-gray-500">آخر 3 سجلات حضور أو زيارات متاحة.</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/parent/daily-report">التقرير اليومي</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentVisits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-600">
                  لا توجد زيارات حديثة حتى الآن. عند تسجيل أول حضور سيظهر هنا وقت الدخول والخروج.
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/parent/daily-report">عرض التقرير اليومي</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                recentVisits.map((visit) => (
                  <div key={visit.session_id || `${visit.date}-${visit.check_in || visit.checkin_at || 'visit'}`} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-gray-900">{visit.status || visit.session_status || 'زيارة مسجلة'}</p>
                      <p className="text-xs text-gray-500">{visit.date || formatDate(visit.check_in || visit.checkin_at, { dateStyle: 'medium' })}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-1 text-gray-600 sm:grid-cols-2">
                      <p>الدخول: {formatDate(visit.check_in || visit.checkin_at, { timeStyle: 'short' })}</p>
                      <p>الخروج: {formatDate(visit.check_out || visit.checkout_at, { timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader>
              <CardTitle>المدفوعات والطلبات</CardTitle>
              <p className="mt-1 text-sm text-gray-500">ملخص مختصر لآخر المدفوعات والطلبات فقط للمتابعة.</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentPayments.length === 0 && recentOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-600">
                  لا توجد مدفوعات أو طلبات حديثة معروضة حاليًا.
                </div>
              ) : (
                <>
                  {recentPayments.map((payment) => (
                    <div key={payment.payment_id || payment.id || payment.paid_at} className="rounded-2xl border border-gray-100 p-4">
                      <p className="font-semibold text-gray-900">{payment.description || payment.type || 'دفعة'}</p>
                      <div className="mt-2 grid grid-cols-1 gap-1 text-gray-600 sm:grid-cols-2">
                        <p>المبلغ: {formatCurrency(payment.amount, payment.currency || 'JOD')}</p>
                        <p>الحالة: {payment.status || '—'}</p>
                        <p>النوع: {payment.method || payment.type || '—'}</p>
                        <p>التاريخ: {formatDate(payment.paid_at || payment.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                    </div>
                  ))}

                  {recentOrders.map((order) => (
                    <div key={order.order_id || order.id || order.created_at} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">طلب #{order.order_id || order.id || '—'}</p>
                      <div className="mt-2 grid grid-cols-1 gap-1 text-gray-600 sm:grid-cols-2">
                        <p>المبلغ: {formatCurrency(order.total_amount ?? order.amount, order.currency || 'JOD')}</p>
                        <p>الحالة: {order.status || '—'}</p>
                        <p>النوع: {order.type || order.order_type || 'طلب'}</p>
                        <p>التاريخ: {formatDate(order.created_at || order.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="peek-card">
            <CardHeader>
              <CardTitle>الفعالية أو الحجز القادم</CardTitle>
              <p className="mt-1 text-sm text-gray-500">أقرب حجز أو فعالية مرتبطة بحسابك.</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!upcomingVisit && !upcomingEvent ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-600">
                  لا يوجد حجز أو فعالية قادمة الآن. راجع الرسائل أو تواصل مع المركز إذا كنت تنتظر تأكيدًا.
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/parent/messages">مراسلة المركز</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {upcomingVisit && (
                    <div className="rounded-2xl border border-gray-100 p-4">
                      <p className="font-semibold text-gray-900">{upcomingVisit.service || upcomingVisit.title || 'الحجز القادم'}</p>
                      <div className="mt-2 space-y-1 text-gray-600">
                        <p>الحالة: {upcomingVisit.status || '—'}</p>
                        <p>التاريخ: {formatDate(pickEventDate(upcomingVisit), { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                    </div>
                  )}
                  {upcomingEvent && (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="font-semibold text-gray-900">{upcomingEvent.title || 'فعالية قادمة'}</p>
                      <div className="mt-2 space-y-1 text-gray-600">
                        <p>الحالة: {upcomingEvent.status || '—'}</p>
                        <p>التاريخ: {formatDate(pickEventDate(upcomingEvent), { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>آخر رسالة</CardTitle>
                <p className="mt-1 text-sm text-gray-500">آخر تحديث من الفريق حتى لا يفوتك شيء.</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/parent/messages">الرسائل</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!latestMessage ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-600">
                  لا توجد رسائل بعد. يمكنك فتح الرسائل للسؤال عن إضافة طفل أو الباقات أو أي تحديث يخص الحضور.
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/parent/messages">فتح الرسائل</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="font-semibold text-gray-900">{latestMessage.subject || 'رسالة'}</p>
                  <p className="mt-2 text-gray-600">{latestMessage.body || latestMessage.text || '—'}</p>
                  <p className="mt-3 text-xs text-gray-500">
                    {formatDate(latestMessage.created_at || latestMessage.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
