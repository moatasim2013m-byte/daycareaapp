import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { resolveCachedChildContext } from '../utils/childContext';
import {
  FileText, CalendarDays, UserCheck, Utensils, Moon,
  SmilePlus, StickyNote, Activity, Camera, ChevronLeft,
  ChevronRight, MessageSquare
} from 'lucide-react';

const getToday = () => new Date().toISOString().slice(0, 10);

const formatArabicDate = (dateStr) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
};

const readArrayFromStorage = (key) => {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const readObjectFromStorage = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed;
  } catch { return null; }
};

const looksLikeImage = (url) => /(\.png|\.jpg|\.jpeg|\.webp|\.gif)(\?.*)?$/i.test((url || '').trim());

const ATTENDANCE_LABELS = {
  PRESENT: { text: 'حاضر', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ABSENT: { text: 'غائب', color: 'bg-red-50 text-red-700 border-red-200' },
  LATE: { text: 'متأخر', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  PICKED_UP: { text: 'انصرف', color: 'bg-sky-50 text-sky-700 border-sky-200' },
};

const LOG_TYPE_META = {
  MEAL: { label: 'وجبة', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
  NAP: { label: 'نوم', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  DIAPER: { label: 'حفاض', icon: SmilePlus, color: 'text-teal-500', bg: 'bg-teal-50' },
  MOOD: { label: 'مزاج', icon: SmilePlus, color: 'text-rose-500', bg: 'bg-rose-50' },
  NOTE: { label: 'ملاحظة', icon: StickyNote, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const formatLogSummary = (log) => {
  const payload = log?.payload || {};
  if (log?.type === 'MEAL') {
    const mealName = payload.mealType || payload.customMeal || payload.mealName || payload.customName || payload.preset;
    return [mealName, payload.amount, payload.notes].filter(Boolean).join(' • ');
  }
  if (log?.type === 'NAP') {
    const napRange = [payload.startTime, payload.endTime].filter(Boolean).join(' - ');
    return [napRange, payload.notes].filter(Boolean).join(' • ');
  }
  if (log?.type === 'DIAPER') return [payload.diaperType, payload.notes].filter(Boolean).join(' • ');
  if (log?.type === 'MOOD') return [payload.mood, payload.notes].filter(Boolean).join(' • ');
  if (log?.type === 'NOTE') return payload.noteText || payload.note || payload.text || '';
  return '';
};

/* ─── Section placeholder when data is empty ─── */
const EmptySection = ({ icon: Icon, iconColor, title, description }) => (
  <div className="flex items-start gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon className={`w-4 h-4 ${iconColor || 'text-gray-400'}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
  </div>
);

const ParentDailyReport = () => {
  const [childId, setChildId] = useState('1');
  const [selectedDate, setSelectedDate] = useState(getToday());

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) setChildId(context.childId);
  }, []);

  const shiftDate = (days) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === getToday();

  const logs = useMemo(() => {
    const key = `childLogs:${childId}:${selectedDate}`;
    return readArrayFromStorage(key).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [childId, selectedDate]);

  const activities = useMemo(() => {
    const roomKeyPrimary = `activityFeedRoom:${selectedDate}`;
    const roomKeyFallback = `activityFeed:${selectedDate}`;
    const childKey = `activityFeedChild:${childId}:${selectedDate}`;

    const roomPrimary = readArrayFromStorage(roomKeyPrimary).map((e) => ({ ...e, feedType: 'ROOM', sourceKey: roomKeyPrimary }));
    const roomFallback = roomPrimary.length === 0
      ? readArrayFromStorage(roomKeyFallback).map((e) => ({ ...e, feedType: 'ROOM', sourceKey: roomKeyFallback }))
      : [];
    const childPosts = readArrayFromStorage(childKey).map((e) => ({ ...e, feedType: 'CHILD', sourceKey: childKey }));

    return [...childPosts, ...roomPrimary, ...roomFallback].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [childId, selectedDate]);

  const attendanceSummary = useMemo(() => {
    const context = resolveCachedChildContext(childId);
    const roomId = context?.roomId || '1';
    const attendanceKey = `attendance:${roomId}:${selectedDate}`;
    const attendanceByChild = readObjectFromStorage(attendanceKey);
    if (!attendanceByChild) return null;
    const childAttendance = attendanceByChild[String(childId)];
    if (!childAttendance?.status) return null;
    return { roomId, status: childAttendance.status, updatedAt: childAttendance.updatedAt };
  }, [childId, selectedDate]);

  // Group logs by type
  const meals = logs.filter((l) => l.type === 'MEAL');
  const naps = logs.filter((l) => l.type === 'NAP');
  const moods = logs.filter((l) => l.type === 'MOOD');
  const notes = logs.filter((l) => l.type === 'NOTE' || l.type === 'DIAPER');

  const attendanceInfo = attendanceSummary
    ? ATTENDANCE_LABELS[attendanceSummary.status] || { text: attendanceSummary.status, color: 'bg-gray-50 text-gray-700 border-gray-200' }
    : null;

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--parent">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تقرير اليوم</h1>
              <p className="text-gray-600 text-sm">ملخص شامل ليوم طفلك: الحضور، الوجبات، النوم، المزاج، والأنشطة</p>
            </div>
          </div>
        </div>

        {/* Date navigator */}
        <Card className="peek-card">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <button onClick={() => shiftDate(1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" disabled={isToday}>
                <ChevronRight className={`w-5 h-5 ${isToday ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-gray-900">{formatArabicDate(selectedDate)}</span>
                </div>
                {isToday && <span className="text-xs text-sky-600 font-medium">اليوم</span>}
              </div>
              <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Day summary strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <Utensils className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{meals.length}</p>
            <p className="text-xs text-gray-500">وجبات</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <Moon className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{naps.length}</p>
            <p className="text-xs text-gray-500">فترات نوم</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <Activity className="w-4 h-4 text-sky-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{activities.length}</p>
            <p className="text-xs text-gray-500">أنشطة</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <StickyNote className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-900">{notes.length + moods.length}</p>
            <p className="text-xs text-gray-500">ملاحظات</p>
          </div>
        </div>

        {/* Attendance */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              الحضور
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceInfo ? (
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1.5 rounded-full border font-semibold ${attendanceInfo.color}`}>
                  {attendanceInfo.text}
                </span>
                {attendanceSummary.updatedAt && (
                  <span className="text-xs text-gray-500">
                    آخر تحديث: {new Date(attendanceSummary.updatedAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ) : (
              <EmptySection
                icon={UserCheck}
                iconColor="text-emerald-400"
                title="لا يوجد تسجيل حضور لهذا اليوم"
                description="سيظهر هنا حالة الحضور عند تسجيلها من قبل المعلمة."
              />
            )}
          </CardContent>
        </Card>

        {/* Meals */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Utensils className="w-4 h-4 text-orange-500" />
              الوجبات
              {meals.length > 0 && <Badge variant="secondary" className="text-xs">{meals.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meals.length === 0 ? (
              <EmptySection
                icon={Utensils}
                iconColor="text-orange-400"
                title="لم تُسجّل وجبات بعد"
                description="تفاصيل الوجبات ستظهر عند تسجيلها — الإفطار، الغداء، الوجبة الخفيفة."
              />
            ) : (
              <div className="space-y-2">
                {meals.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Utensils className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{formatLogSummary(log) || 'وجبة مسجلة'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Naps */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              النوم
              {naps.length > 0 && <Badge variant="secondary" className="text-xs">{naps.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {naps.length === 0 ? (
              <EmptySection
                icon={Moon}
                iconColor="text-indigo-400"
                title="لم تُسجّل فترات نوم"
                description="أوقات القيلولة ومدتها ستظهر هنا عند تسجيلها."
              />
            ) : (
              <div className="space-y-2">
                {naps.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{formatLogSummary(log) || 'فترة نوم مسجلة'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood & Notes */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-500" />
              المزاج والملاحظات
              {(moods.length + notes.length) > 0 && <Badge variant="secondary" className="text-xs">{moods.length + notes.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moods.length === 0 && notes.length === 0 ? (
              <EmptySection
                icon={SmilePlus}
                iconColor="text-amber-400"
                title="لا توجد ملاحظات أو مزاج مسجل"
                description="ملاحظات المعلمة عن مزاج الطفل وأي تنبيهات ستظهر هنا."
              />
            ) : (
              <div className="space-y-2">
                {[...moods, ...notes].map((log) => {
                  const meta = LOG_TYPE_META[log.type] || LOG_TYPE_META.NOTE;
                  const Icon = meta.icon;
                  return (
                    <div key={log.id} className={`flex items-start gap-3 rounded-xl border border-gray-100 p-3 ${meta.bg}`}>
                      <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-gray-500">{meta.label}</span>
                        </div>
                        <p className="text-sm text-gray-900">{formatLogSummary(log) || '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              أنشطة اليوم
              {activities.length > 0 && <Badge variant="secondary" className="text-xs">{activities.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <EmptySection
                icon={Activity}
                iconColor="text-sky-400"
                title="لا توجد أنشطة مسجلة لهذا اليوم"
                description="أنشطة اللعب والتعلم وأي نشاطات مشتركة ستظهر هنا."
              />
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={`${activity.sourceKey}-${activity.id}`} className="rounded-xl border border-sky-100 bg-sky-50/30 p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant={activity.feedType === 'CHILD' ? 'default' : 'secondary'} className="text-xs">
                        {activity.feedType === 'CHILD' ? 'للطفل' : 'للغرفة'}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {activity.createdAt
                          ? new Date(activity.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{activity.caption || 'نشاط مسجل'}</p>
                    {activity.mediaUrl && looksLikeImage(activity.mediaUrl) && (
                      <img src={activity.mediaUrl} alt="وسائط" className="mt-2 max-h-48 rounded-xl border border-gray-200 object-cover" />
                    )}
                    {activity.mediaUrl && !looksLikeImage(activity.mediaUrl) && (
                      <a href={activity.mediaUrl} target="_blank" rel="noreferrer"
                         className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">فتح رابط الوسائط</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All-empty message at bottom */}
        {logs.length === 0 && activities.length === 0 && !attendanceSummary && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">لم يتم تسجيل أي بيانات لهذا اليوم بعد.</p>
            <div className="flex items-center justify-center gap-2">
              {!isToday && (
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(getToday())}>العودة لليوم الحالي</Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/parent/messages"><MessageSquare className="w-3.5 h-3.5 ml-1" />مراسلة الحضانة</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDailyReport;
