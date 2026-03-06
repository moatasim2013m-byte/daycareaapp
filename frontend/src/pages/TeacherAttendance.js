import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';

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

const getChildrenFromCache = () => {
  const candidateKeys = ['children', 'childProfiles', 'daycareChildren', 'kids'];

  for (const key of candidateKeys) {
    const list = parseCachedList(localStorage.getItem(key));
    if (list.length > 0) {
      const normalized = list
        .map((child, index) => {
          const id = child?.child_id ?? child?.childId ?? child?.id;
          if (id === undefined || id === null) return null;

          return {
            childId: String(id),
            name: child?.full_name || child?.name || child?.display_name || `الطفل ${index + 1}`,
          };
        })
        .filter(Boolean);

      if (normalized.length > 0) {
        return normalized;
      }
    }
  }

  return [1, 2, 3, 4, 5].map((n) => ({ childId: String(n), name: `الطفل ${n}` }));
};

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
    setChildren(getChildrenFromCache());
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
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">حضور الأطفال</h1>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>قائمة الأطفال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.map((child) => {
              const current = attendance[child.childId];

              return (
                <div key={child.childId} className="rounded-lg border border-gray-200 bg-white p-3">
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
