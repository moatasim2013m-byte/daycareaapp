import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const today = () => new Date().toISOString().slice(0, 10);

const parseCachedList = (raw) => {
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

const readObject = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
};

const readArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getChildren = () => {
  const keys = ['children', 'childProfiles', 'daycareChildren', 'kids'];

  for (const key of keys) {
    const list = parseCachedList(localStorage.getItem(key));
    if (list.length > 0) {
      const normalized = list
        .map((child, index) => {
          const id = child?.child_id ?? child?.childId ?? child?.id;
          if (id === undefined || id === null || String(id).trim() === '') return null;

          return {
            id: String(id),
            name: child?.full_name || child?.name || child?.display_name || `الطفل ${index + 1}`,
          };
        })
        .filter(Boolean);

      if (normalized.length > 0) return normalized;
    }
  }

  return [1, 2, 3, 4, 5].map((n) => ({ id: String(n), name: `الطفل ${n}` }));
};

const TeacherToday = () => {
  const selectedDate = today();

  const attendanceSummary = useMemo(() => {
    const data = readObject(`attendance:1:${selectedDate}`);
    const values = Object.values(data);

    return {
      total: values.length,
      present: values.filter((v) => v?.status === 'PRESENT').length,
      absent: values.filter((v) => v?.status === 'ABSENT').length,
      late: values.filter((v) => v?.status === 'LATE').length,
      pickedUp: values.filter((v) => v?.status === 'PICKED_UP').length,
    };
  }, [selectedDate]);

  const latestActivities = useMemo(() => {
    const roomKey = `activityFeedRoom:${selectedDate}`;
    const fallbackKey = `activityFeed:${selectedDate}`;

    const roomActivities = readArray(roomKey);
    const source = roomActivities.length > 0 ? roomActivities : readArray(fallbackKey);

    return source
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [selectedDate]);

  const children = useMemo(() => getChildren(), []);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">مهام اليوم</h1>
            <p className="text-gray-600 mt-1">ملخص سريع وإجراءات يومية للمعلمات</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ملخص الحضور (اليوم)</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceSummary.total === 0 ? (
              <p className="text-gray-500">لا توجد سجلات حضور لهذا اليوم</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-gray-200 p-3 bg-white">
                  <p className="text-sm text-gray-600">حاضر</p>
                  <p className="text-xl font-bold text-gray-900">{attendanceSummary.present}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-white">
                  <p className="text-sm text-gray-600">غائب</p>
                  <p className="text-xl font-bold text-gray-900">{attendanceSummary.absent}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-white">
                  <p className="text-sm text-gray-600">متأخر</p>
                  <p className="text-xl font-bold text-gray-900">{attendanceSummary.late}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-white">
                  <p className="text-sm text-gray-600">انصرف</p>
                  <p className="text-xl font-bold text-gray-900">{attendanceSummary.pickedUp}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to="/teacher/attendance">الحضور</Link></Button>
            <Button asChild variant="outline"><Link to="/teacher/activity/new">إضافة نشاط</Link></Button>
            <Button asChild variant="outline"><Link to="/teacher/messages">الرسائل</Link></Button>
            <Button asChild variant="outline"><Link to="/teacher/child/1/log">سجل الطفل 1</Link></Button>
            <Button asChild variant="outline"><Link to="/teacher/child/2/log">سجل الطفل 2</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ملخص أنشطة اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            {latestActivities.length === 0 ? (
              <p className="text-gray-500">لا توجد أنشطة اليوم</p>
            ) : (
              <div className="space-y-2">
                {latestActivities.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3 bg-white">
                    <p className="text-sm font-medium text-gray-900">{item.caption || 'بدون وصف'}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الأطفال السريعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-white">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{child.name}</p>
                  <Badge variant="secondary">#{child.id}</Badge>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/teacher/child/${child.id}/log`}>فتح السجل</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherToday;
