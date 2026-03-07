import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { readCachedChildContexts, resolveCachedChildContext } from '../utils/childContext';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'حاضر' },
  { value: 'ABSENT', label: 'غائب' },
  { value: 'LATE', label: 'متأخر' },
  { value: 'PICKED_UP', label: 'انصرف' },
];

const STATUS_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  PICKED_UP: 'انصرف',
};

const today = () => new Date().toISOString().slice(0, 10);

const readAttendance = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
};
const TeacherAttendance = () => {
  const [roomId, setRoomId] = useState('1');
  const [selectedDate, setSelectedDate] = useState(today());
  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});

  const storageKey = useMemo(() => `attendance:${roomId}:${selectedDate}`, [roomId, selectedDate]);

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.roomId) {
      setRoomId(context.roomId);
    }
  }, []);

  useEffect(() => {
    const cachedChildren = readCachedChildContexts().map((child) => ({
      childId: child.childId,
      name: child.childName,
    }));

    if (cachedChildren.length > 0) {
      setChildren(cachedChildren);
      return;
    }

    setChildren([1, 2, 3, 4, 5].map((n) => ({ childId: String(n), name: `الطفل ${n}` })));
  }, []);

  useEffect(() => {
    setAttendance(readAttendance(storageKey));
  }, [storageKey]);

  const setChildStatus = (childId, status) => {
    const nextAttendance = {
      ...attendance,
      [childId]: {
        status,
        updatedAt: new Date().toISOString(),
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(nextAttendance));
    setAttendance(nextAttendance);
  };

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-5xl">
        <div className="peek-header peek-header--teacher flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">حضور الأطفال</h1>
            <p className="text-sm text-gray-600 mt-1">واجهة سريعة مع أزرار لمس كبيرة لحالة كل طفل.</p>
          </div>
          <Button asChild variant="outline" className="peek-action-teacher">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card className="peek-card">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendance-date">التاريخ</Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || today())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendance-room">الغرفة</Label>
              <Input
                id="attendance-room"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value || '1')}
                placeholder="1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="peek-card">
          <CardHeader>
            <CardTitle>قائمة الأطفال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.map((child) => {
              const current = attendance[child.childId];

              return (
                <div key={child.childId} className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{child.name}</p>
                      <p className="text-xs text-gray-500">ID: {child.childId}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{STATUS_LABELS[current?.status] || 'بدون حالة'}</Badge>
                        {current?.updatedAt && (
                          <span className="text-xs text-gray-500">
                            آخر تحديث: {new Date(current.updatedAt).toLocaleTimeString('ar-JO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
                          className="peek-action-teacher"
                          variant={current?.status === option.value ? 'default' : 'outline'}
                          onClick={() => setChildStatus(child.childId, option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
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
