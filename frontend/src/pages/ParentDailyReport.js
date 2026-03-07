import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { resolveCachedChildContext } from '../utils/childContext';

const getToday = () => new Date().toISOString().slice(0, 10);


const readArrayFromStorage = (key) => {
  if (!key) return [];

  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readObjectFromStorage = (key) => {
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const looksLikeImage = (url) => /(\.png|\.jpg|\.jpeg|\.webp|\.gif)(\?.*)?$/i.test((url || '').trim());

const LOG_BADGES = {
  MEAL: 'وجبة',
  NAP: 'نوم',
  DIAPER: 'حفاض',
  MOOD: 'مزاج',
  NOTE: 'ملاحظة',
};

const ATTENDANCE_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  PICKED_UP: 'انصرف',
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

  if (log?.type === 'DIAPER') {
    return [payload.diaperType, payload.notes].filter(Boolean).join(' • ');
  }

  if (log?.type === 'MOOD') {
    return [payload.mood, payload.notes].filter(Boolean).join(' • ');
  }

  if (log?.type === 'NOTE') {
    return payload.noteText || payload.note || payload.text || '';
  }

  return '';
};


const ParentDailyReport = () => {
  const [childId, setChildId] = useState('1');
  const [needsChildInput, setNeedsChildInput] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getToday());

  useEffect(() => {
    const context = resolveCachedChildContext();

    if (context?.childId) {
      setChildId(context.childId);
      setNeedsChildInput(false);
      return;
    }

    setNeedsChildInput(true);
  }, []);

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

    const roomPrimary = readArrayFromStorage(roomKeyPrimary).map((entry) => ({
      ...entry,
      feedType: 'ROOM',
      sourceKey: roomKeyPrimary,
    }));

    const roomFallback = roomPrimary.length === 0
      ? readArrayFromStorage(roomKeyFallback).map((entry) => ({
          ...entry,
          feedType: 'ROOM',
          sourceKey: roomKeyFallback,
        }))
      : [];

    const childPosts = readArrayFromStorage(childKey).map((entry) => ({
      ...entry,
      feedType: 'CHILD',
      sourceKey: childKey,
    }));

    return [...childPosts, ...roomPrimary, ...roomFallback].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [childId, selectedDate]);

  const attendanceSummary = useMemo(() => {
    const context = resolveCachedChildContext(childId);
    const roomId = context?.roomId || '1';

    const attendanceKey = `attendance:${roomId}:${selectedDate}`;
    const attendanceByChild = readObjectFromStorage(attendanceKey);

    if (!attendanceByChild) {
      return null;
    }

    const childAttendance = attendanceByChild[String(childId)];

    if (!childAttendance?.status) {
      return null;
    }

    return {
      roomId,
      status: childAttendance.status,
      updatedAt: childAttendance.updatedAt,
    };
  }, [childId, selectedDate]);

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-4xl">
        <div className="peek-header peek-header--parent flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تقرير اليوم</h1>
            <p className="text-gray-600 mt-1">ملخص لطيف ليوم الطفل: حضور، سجل يومي، ونشاطات</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card className="peek-card">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {needsChildInput && (
              <div className="space-y-2">
                <Label htmlFor="daily-report-child-id">معرف الطفل</Label>
                <Input
                  id="daily-report-child-id"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value || '1')}
                  placeholder="1"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="daily-report-date">التاريخ</Label>
              <Input
                id="daily-report-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || getToday())}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="peek-card">
          <CardHeader>
            <CardTitle>ملخص الحضور</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceSummary ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>{ATTENDANCE_LABELS[attendanceSummary.status] || attendanceSummary.status}</Badge>
                  <span className="text-sm text-gray-500">الغرفة: {attendanceSummary.roomId}</span>
                </div>
                {attendanceSummary.updatedAt && (
                  <p className="text-sm text-gray-600">
                    آخر تحديث: {new Date(attendanceSummary.updatedAt).toLocaleTimeString('ar-JO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-600">🌈 لا يوجد تسجيل حضور لهذا اليوم</p>
            )}
          </CardContent>
        </Card>

        <Card className="peek-card">
          <CardHeader>
            <CardTitle>سجل اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-gray-500">🌷 لا يوجد سجلات لهذا اليوم</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="peek-feed-item p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Badge>{LOG_BADGES[log.type] || 'سجل'}</Badge>
                        <p className="text-sm text-gray-800">{formatLogSummary(log) || '—'}</p>
                        <p className="text-xs text-gray-500">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="peek-card">
          <CardHeader>
            <CardTitle>أنشطة اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-gray-500">🌷 لا يوجد أنشطة لهذا اليوم</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={`${activity.sourceKey}-${activity.id}`} className="peek-feed-item p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={activity.feedType === 'CHILD' ? 'default' : 'secondary'}>
                          {activity.feedType === 'CHILD' ? 'للطفل' : 'للغرفة'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {activity.createdAt
                            ? new Date(activity.createdAt).toLocaleTimeString('ar-JO', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '--:--'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-900 font-medium">{activity.caption || 'بدون وصف'}</p>

                      {activity.mediaUrl && (
                        looksLikeImage(activity.mediaUrl) ? (
                          <img
                            src={activity.mediaUrl}
                            alt="وسائط النشاط"
                            className="max-h-48 rounded-md border border-gray-200 object-cover"
                          />
                        ) : (
                          <a
                            href={activity.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            فتح رابط الوسائط
                          </a>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDailyReport;
