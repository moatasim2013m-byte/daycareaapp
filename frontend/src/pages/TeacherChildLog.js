import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';

const EVENT_TYPES = [
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

const TeacherChildLog = () => {
  const { childId } = useParams();
  const noteStorageKey = `teacher-child-log-${childId}-note`;
  const [activeTab, setActiveTab] = useState('note');
  const [noteInput, setNoteInput] = useState('');
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    const storedNote = localStorage.getItem(noteStorageKey);
    if (storedNote) {
      setSavedNote(storedNote);
    }
  }, [noteStorageKey]);

  const handleSave = () => {
    const value = noteInput.trim();
    if (!value) {
      return;
    }

    setSavedNote(value);
    localStorage.setItem(noteStorageKey, value);
    setNoteInput('');
  };

  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [activeType, setActiveType] = useState('MEAL');
  const [childName, setChildName] = useState(`الطفل رقم ${childId}`);
  const [entries, setEntries] = useState([]);

  const [mealPreset, setMealPreset] = useState('فطور');
  const [mealCustomName, setMealCustomName] = useState('');
  const [mealAmount, setMealAmount] = useState('');
  const [mealNotes, setMealNotes] = useState('');

  const [childId, setChildId] = useState(routeChildId || '1');
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedType, setSelectedType] = useState('MEAL');
  const [summary, setSummary] = useState('');
  const [logs, setLogs] = useState([]);

  const storageKey = useMemo(() => `childLogs:${childId}:${selectedDate}`, [childId, selectedDate]);

  useEffect(() => {
    setLogs(readLogs(storageKey));
  }, [storageKey]);

  const persistLogs = (nextLogs) => {
    localStorage.setItem(storageKey, JSON.stringify(nextLogs));
    setLogs(nextLogs);
  };

  const handleAdd = () => {
    const normalizedSummary = summary.trim();

    if (!normalizedSummary) {
      alert('الرجاء إدخال ملخص السجل.');
      return;
    }

    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: selectedType,
      summary: normalizedSummary,
      createdAt: new Date().toISOString(),
    };

    persistLogs([nextEntry, ...logs]);
    setSummary('');
  };

  const handleDelete = (id) => {
    const nextLogs = logs.filter((item) => item.id !== id);
    persistLogs(nextLogs);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">سجل الطفل</h1>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="child-id">معرف الطفل</Label>
              <Input
                id="child-id"
                value={childId}
                onChange={(e) => setChildId(e.target.value || '1')}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="log-date">التاريخ</Label>
              <Input
                id="log-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || today())}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إضافة حدث</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((eventType) => (
                <Button
                  key={eventType.value}
                  type="button"
                  variant={selectedType === eventType.value ? 'default' : 'outline'}
                  onClick={() => setSelectedType(eventType.value)}
                >
                  {eventType.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">الملخص</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="اكتب ملخص الحدث"
              />
            </div>

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
                        <p className="text-sm text-gray-900">{log.summary}</p>
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
