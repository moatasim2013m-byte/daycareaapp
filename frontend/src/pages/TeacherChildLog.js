import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';

const LOG_TYPES = [
  { value: 'MEAL', label: 'وجبة' },
  { value: 'NAP', label: 'نوم' },
  { value: 'DIAPER', label: 'حفاض' },
  { value: 'MOOD', label: 'مزاج' },
  { value: 'NOTE', label: 'ملاحظة' },
];

const TYPE_LABELS = {
  MEAL: 'وجبة',
  NAP: 'نوم',
  DIAPER: 'حفاض',
  MOOD: 'مزاج',
  NOTE: 'ملاحظة',
};

const today = () => new Date().toISOString().slice(0, 10);

const readLogs = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return [...parsed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
};

const getSummaryFromPayload = (log) => {
  const payload = log?.payload || {};

  if (log.type === 'MEAL') {
    return [payload.mealName, payload.notes].filter(Boolean).join(' • ');
  }

  if (log.type === 'NAP') {
    const range = [payload.startTime, payload.endTime].filter(Boolean).join(' - ');
    return [range, payload.notes].filter(Boolean).join(' • ');
  }

  if (log.type === 'DIAPER') {
    return [payload.diaperType, payload.notes].filter(Boolean).join(' • ');
  }

  if (log.type === 'MOOD') {
    return [payload.mood, payload.notes].filter(Boolean).join(' • ');
  }

  if (log.type === 'NOTE') {
    return payload.text || '';
  }

  return '';
};

const TeacherChildLog = () => {
  const { childId: routeChildId } = useParams();
  const childId = String(routeChildId || '1');

  const [selectedDate, setSelectedDate] = useState(today());
  const [activeType, setActiveType] = useState('MEAL');
  const [logs, setLogs] = useState([]);

  const [mealName, setMealName] = useState('');
  const [mealNotes, setMealNotes] = useState('');

  const [napStart, setNapStart] = useState('');
  const [napEnd, setNapEnd] = useState('');
  const [napNotes, setNapNotes] = useState('');

  const [diaperType, setDiaperType] = useState('مبلل');
  const [diaperNotes, setDiaperNotes] = useState('');

  const [moodType, setMoodType] = useState('سعيد');
  const [moodNotes, setMoodNotes] = useState('');

  const [noteText, setNoteText] = useState('');

  const storageKey = useMemo(() => `childLogs:${childId}:${selectedDate}`, [childId, selectedDate]);

  useEffect(() => {
    setLogs(readLogs(storageKey));
  }, [storageKey]);

  const persistLogs = (nextLogs) => {
    localStorage.setItem(storageKey, JSON.stringify(nextLogs));
    setLogs(nextLogs);
  };

  const handleAdd = () => {
    let payload = {};

    if (activeType === 'MEAL') {
      if (!mealName.trim()) {
        alert('الرجاء إدخال تفاصيل الوجبة.');
        return;
      }

      payload = {
        mealName: mealName.trim(),
        notes: mealNotes.trim(),
      };
    }

    if (activeType === 'NAP') {
      if (!napStart || !napEnd) {
        alert('الرجاء إدخال وقت بداية ونهاية النوم.');
        return;
      }

      payload = {
        startTime: napStart,
        endTime: napEnd,
        notes: napNotes.trim(),
      };
    }

    if (activeType === 'DIAPER') {
      payload = {
        diaperType,
        notes: diaperNotes.trim(),
      };
    }

    if (activeType === 'MOOD') {
      payload = {
        mood: moodType,
        notes: moodNotes.trim(),
      };
    }

    if (activeType === 'NOTE') {
      if (!noteText.trim()) {
        alert('الرجاء إدخال الملاحظة.');
        return;
      }

      payload = {
        text: noteText.trim(),
      };
    }

    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: activeType,
      payload,
      createdAt: new Date().toISOString(),
    };

    persistLogs([nextEntry, ...logs]);

    if (activeType === 'MEAL') {
      setMealName('');
      setMealNotes('');
    }
    if (activeType === 'NAP') {
      setNapStart('');
      setNapEnd('');
      setNapNotes('');
    }
    if (activeType === 'DIAPER') {
      setDiaperNotes('');
    }
    if (activeType === 'MOOD') {
      setMoodNotes('');
    }
    if (activeType === 'NOTE') {
      setNoteText('');
    }
  };

  const handleDelete = (id) => {
    persistLogs(logs.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل الطفل</h1>
            <p className="text-gray-600 mt-1">معرف الطفل: {childId}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 max-w-xs space-y-2">
            <Label htmlFor="log-date">التاريخ</Label>
            <Input
              id="log-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || today())}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إضافة حدث</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {LOG_TYPES.map((logType) => (
                <Button
                  key={logType.value}
                  type="button"
                  variant={activeType === logType.value ? 'default' : 'outline'}
                  onClick={() => setActiveType(logType.value)}
                >
                  {logType.label}
                </Button>
              ))}
            </div>

            {activeType === 'MEAL' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="meal-name">تفاصيل الوجبة</Label>
                  <Input
                    id="meal-name"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="مثال: فطور كامل"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal-notes">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="meal-notes"
                    value={mealNotes}
                    onChange={(e) => setMealNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية"
                  />
                </div>
              </div>
            )}

            {activeType === 'NAP' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="nap-start">وقت البداية</Label>
                  <Input id="nap-start" type="time" value={napStart} onChange={(e) => setNapStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nap-end">وقت النهاية</Label>
                  <Input id="nap-end" type="time" value={napEnd} onChange={(e) => setNapEnd(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="nap-notes">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="nap-notes"
                    value={napNotes}
                    onChange={(e) => setNapNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية"
                  />
                </div>
              </div>
            )}

            {activeType === 'DIAPER' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="diaper-type">النوع</Label>
                  <select
                    id="diaper-type"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={diaperType}
                    onChange={(e) => setDiaperType(e.target.value)}
                  >
                    <option value="مبلل">مبلل</option>
                    <option value="متسخ">متسخ</option>
                    <option value="كلاهما">كلاهما</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diaper-notes">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="diaper-notes"
                    value={diaperNotes}
                    onChange={(e) => setDiaperNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeType === 'MOOD' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="mood-type">المزاج</Label>
                  <select
                    id="mood-type"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={moodType}
                    onChange={(e) => setMoodType(e.target.value)}
                  >
                    <option value="سعيد">سعيد</option>
                    <option value="طبيعي">طبيعي</option>
                    <option value="زعلان">زعلان</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mood-notes">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="mood-notes"
                    value={moodNotes}
                    onChange={(e) => setMoodNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {activeType === 'NOTE' && (
              <div className="space-y-2">
                <Label htmlFor="note-text">الملاحظة</Label>
                <Textarea
                  id="note-text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="اكتب ملاحظة عن الطفل"
                />
              </div>
            )}

            <Button type="button" onClick={handleAdd}>إضافة السجل</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>السجل الزمني</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-gray-500">لا يوجد سجلات بعد</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Badge>{TYPE_LABELS[log.type] || 'سجل'}</Badge>
                        <p className="text-sm text-gray-900">{getSummaryFromPayload(log) || '—'}</p>
                        <p className="text-xs text-gray-500">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString('ar-JO', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '--:--'}
                        </p>
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(log.id)}>
                        حذف
                      </Button>
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

export default TeacherChildLog;
