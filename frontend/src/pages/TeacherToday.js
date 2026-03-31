import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { resolveCachedChildContext, readCachedChildContexts } from '../utils/childContext';
import {
  ClipboardList, UserCheck, Activity, MessageSquare, Car,
  CalendarDays, Utensils, Camera, ShoppingBag
} from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

const formatArabicDate = (dateStr) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
};

const STATUS_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  PICKED_UP: 'انصرف',
};

const readObjectFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch { return {}; }
};

const readListFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch { return []; }
};

const TeacherToday = () => {
  const selectedDate = today();
  const context = resolveCachedChildContext();
  const roomId = context?.roomId || '1';
  const children = readCachedChildContexts();

  const attendance = useMemo(() => {
    return readObjectFromStorage(`attendance:${roomId}:${selectedDate}`);
  }, [roomId, selectedDate]);

  const attendanceEntries = Object.entries(attendance);
  const presentCount = attendanceEntries.filter(([, v]) => v?.status === 'PRESENT').length;
  const absentCount = attendanceEntries.filter(([, v]) => v?.status === 'ABSENT').length;
  const totalMarked = attendanceEntries.filter(([, v]) => v?.status).length;
  const totalChildren = Math.max(children.length, 5);

  const activities = useMemo(() => {
    const roomEntries = readListFromStorage(`activityFeedRoom:${selectedDate}`)
      .filter((entry) => {
        const entryRoomId = entry?.roomId ?? entry?.room_id ?? entry?.classroomId ?? entry?.classroom_id;
        if (entryRoomId === undefined || entryRoomId === null || entryRoomId === '') return true;
        return String(entryRoomId) === String(roomId);
      });
    return roomEntries.length > 0 ? roomEntries : readListFromStorage(`activityFeed:${selectedDate}`);
  }, [roomId, selectedDate]);

  const QUICK_ACTIONS = [
    { to: '/teacher/attendance', label: 'تسجيل الحضور', icon: UserCheck, color: 'bg-orange-500 hover:bg-orange-600' },
    { to: '/teacher/activity/new', label: 'إضافة نشاط', icon: Camera, color: 'bg-sky-500 hover:bg-sky-600' },
    { to: '/teacher/messages', label: 'رسائل أولياء الأمور', icon: MessageSquare, color: 'bg-emerald-500 hover:bg-emerald-600' },
    { to: '/teacher/pickup-check', label: 'التحقق من الاستلام', icon: Car, color: 'bg-violet-500 hover:bg-violet-600' },
    { to: '/checkin', label: 'تسجيل الدخول', icon: ClipboardList, color: 'bg-amber-500 hover:bg-amber-600' },
    { to: '/pos', label: 'نقطة البيع', icon: ShoppingBag, color: 'bg-rose-500 hover:bg-rose-600' },
  ];

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مركز مهام اليوم</h1>
              <p className="text-gray-600 text-sm">لوحة تحكم المعلمة — الغرفة {roomId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CalendarDays className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">{formatArabicDate(selectedDate)}</span>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <UserCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{totalMarked}<span className="text-sm font-normal text-gray-400">/{totalChildren}</span></p>
            <p className="text-xs text-gray-500">حضور مسجل</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <Activity className="w-5 h-5 text-sky-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{activities.length}</p>
            <p className="text-xs text-gray-500">نشاط اليوم</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <Utensils className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{presentCount}</p>
            <p className="text-xs text-gray-500">حاضر الآن</p>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm ${action.color}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Attendance overview */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-orange-500" />
                ملخص الحضور
              </CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link to="/teacher/attendance">فتح الحضور</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {totalMarked === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-orange-200 bg-orange-50/50 p-4">
                <UserCheck className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">لم يتم تسجيل الحضور بعد</p>
                  <p className="text-xs text-gray-500 mt-0.5">ابدأ بتسجيل حضور الأطفال لهذا اليوم.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> حاضر: {presentCount}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> غائب: {absentCount}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span> إجمالي: {totalMarked}/{totalChildren}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((totalMarked / totalChildren) * 100, 100)}%` }}></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities overview */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-500" />
                أنشطة اليوم
              </CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link to="/teacher/activity/new">إضافة نشاط</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-4">
                <Camera className="w-5 h-5 text-sky-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">لا توجد أنشطة مسجلة لليوم</p>
                  <p className="text-xs text-gray-500 mt-0.5">أضف نشاطاً ليظهر في خلاصة أولياء الأمور.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 4).map((a, i) => (
                  <div key={a.id || i} className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/30 px-3 py-2 text-sm">
                    <Activity className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                    <span className="text-gray-800 truncate">{a.caption || a.text || a.content || a.title || 'نشاط مسجل'}</span>
                    {a.createdAt && <span className="text-xs text-gray-400 mr-auto flex-shrink-0">{new Date(a.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                ))}
                {activities.length > 4 && <p className="text-xs text-gray-400 text-center">+{activities.length - 4} أنشطة أخرى</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherToday;
