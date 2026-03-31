import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { readCachedChildContexts, resolveCachedChildContext } from '../utils/childContext';
import { UserCheck, FileText, CalendarDays } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'حاضر', color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  { value: 'ABSENT', label: 'غائب', color: 'bg-red-400 hover:bg-red-500 text-white' },
  { value: 'LATE', label: 'متأخر', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { value: 'PICKED_UP', label: 'انصرف', color: 'bg-sky-500 hover:bg-sky-600 text-white' },
];

const STATUS_BADGE = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-700 border-red-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  PICKED_UP: 'bg-sky-50 text-sky-700 border-sky-200',
};

const STATUS_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  PICKED_UP: 'انصرف',
};

const today = () => new Date().toISOString().slice(0, 10);

const formatArabicDate = (dateStr) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
};

const readAttendance = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch { return {}; }
};

const TeacherAttendance = () => {
  const [roomId, setRoomId] = useState('1');
  const [selectedDate, setSelectedDate] = useState(today());
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});

  const storageKey = useMemo(() => `attendance:${roomId}:${selectedDate}`, [roomId, selectedDate]);
  const isToday = selectedDate === today();

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.roomId) setRoomId(context.roomId);
  }, []);

  useEffect(() => {
    const cachedChildren = readCachedChildContexts().map((child) => ({
      childId: child.childId,
      name: child.childName,
    }));
    if (cachedChildren.length > 0) {
      setChildren(cachedChildren);
    } else {
      setChildren([1, 2, 3, 4, 5].map((n) => ({ childId: String(n), name: `الطفل ${n}` })));
    }
  }, []);

  useEffect(() => {
    setAttendance(readAttendance(storageKey));
  }, [storageKey]);

  const setChildStatus = (childId, status) => {
    const nextAttendance = {
      ...attendance,
      [childId]: { status, updatedAt: new Date().toISOString() },
    };
    localStorage.setItem(storageKey, JSON.stringify(nextAttendance));
    setAttendance(nextAttendance);
  };

  const markedCount = children.filter((c) => attendance[c.childId]?.status).length;
  const presentCount = children.filter((c) => attendance[c.childId]?.status === 'PRESENT').length;

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-5xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">حضور الأطفال</h1>
              <p className="text-gray-600 text-sm">الغرفة {roomId} — اضغط على حالة كل طفل بسرعة</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CalendarDays className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">{formatArabicDate(selectedDate)}</span>
            {isToday && <span className="text-xs text-orange-600 font-medium mr-1">اليوم</span>}
          </div>
        </div>

        {/* Progress bar */}
        <Card className="peek-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">تقدم التسجيل</span>
              <span className="text-sm font-bold text-gray-900">{markedCount} من {children.length}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-orange-500 h-2.5 rounded-full transition-all" style={{ width: `${children.length > 0 ? (markedCount / children.length) * 100 : 0}%` }}></div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> حاضر: {presentCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> غائب: {children.filter((c) => attendance[c.childId]?.status === 'ABSENT').length}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> متأخر: {children.filter((c) => attendance[c.childId]?.status === 'LATE').length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Children list */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">قائمة الأطفال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {children.map((child) => {
              const current = attendance[child.childId];
              const statusBadge = current?.status ? STATUS_BADGE[current.status] : null;

              return (
                <div key={child.childId} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-orange-600">{child.name?.charAt(0) || '#'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{child.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {statusBadge ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge}`}>
                              {STATUS_LABELS[current.status]}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">بدون حالة</span>
                          )}
                          {current?.updatedAt && (
                            <span className="text-xs text-gray-400">
                              {new Date(current.updatedAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setChildStatus(child.childId, option.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            current?.status === option.value
                              ? option.color
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                      <Link
                        to={`/teacher/child/${child.childId}/log`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="فتح سجل الطفل"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherAttendance;
