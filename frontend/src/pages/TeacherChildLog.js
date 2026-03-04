import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const LOG_TYPES = [
  { id: 'MEAL', label: 'وجبة' },
  { id: 'NAP', label: 'نوم' },
  { id: 'DIAPER', label: 'حفاض' },
  { id: 'MOOD', label: 'مزاج' },
  { id: 'NOTE', label: 'ملاحظة' },
];

const TYPE_LABELS = {
  MEAL: 'وجبة',
  NAP: 'نوم',
  DIAPER: 'حفاض',
  MOOD: 'مزاج',
  NOTE: 'ملاحظة',
};

const todayDate = () => new Date().toISOString().slice(0, 10);

const parseListFromCache = (raw) => {
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

const getChildNameFromLocalCache = (childId) => {
  const possibleKeys = ['children', 'childProfiles', 'daycareChildren', 'kids'];

  for (const key of possibleKeys) {
    const list = parseListFromCache(localStorage.getItem(key));
    const found = list.find(
      (child) => String(child?.child_id ?? child?.childId ?? child?.id) === String(childId)
    );

    if (found) {
      return found.full_name || found.name || found.display_name || null;
    }
  }

  return null;
};

const getEntrySummary = (entry) => {
  const payload = entry.payload || {};

  switch (entry.type) {
    case 'MEAL':
      return `${payload.mealName || 'وجبة'}${payload.amount ? ` • ${payload.amount}` : ''}`;
    case 'NAP':
      return `${payload.startTime || '--:--'} → ${payload.endTime || '--:--'}`;
    case 'DIAPER':
      return payload.diaperType || '-';
    case 'MOOD':
      return payload.mood || '-';
    case 'NOTE':
      return payload.noteText || '-';
    default:
      return '-';
  }
};

const TeacherChildLog = () => {
  const { childId } = useParams();

  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [activeType, setActiveType] = useState('MEAL');
  const [childName, setChildName] = useState(`الطفل رقم ${childId}`);
  const [entries, setEntries] = useState([]);

  const [mealPreset, setMealPreset] = useState('فطور');
  const [mealCustomName, setMealCustomName] = useState('');
  const [mealAmount, setMealAmount] = useState('');
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
    const cachedName = getChildNameFromLocalCache(childId);
    setChildName(cachedName || `الطفل رقم ${childId}`);
  }, [childId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        const sorted = [...parsed].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEntries(sorted);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    }
  }, [storageKey]);

  const persistEntries = (nextEntries) => {
    localStorage.setItem(storageKey, JSON.stringify(nextEntries));
    setEntries(nextEntries);
  };

  const saveEntry = () => {
    let payload = {};

    if (activeType === 'MEAL') {
      const mealName = mealCustomName.trim() || mealPreset;
      if (!mealName) {
        alert('يرجى إدخال اسم الوجبة.');
        return;
      }

      payload = {
        mealName,
        preset: mealPreset,
        customName: mealCustomName.trim(),
        amount: mealAmount.trim(),
        notes: mealNotes.trim(),
      };
    }

    if (activeType === 'NAP') {
      if (!napStart || !napEnd) {
        alert('يرجى إدخال وقت بداية ونهاية النوم.');
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
        alert('يرجى إدخال الملاحظة.');
        return;
      }

      payload = {
        noteText: noteText.trim(),
      };
    }

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: activeType,
      payload,
      createdAt: new Date().toISOString(),
    };

    const nextEntries = [newEntry, ...entries];
    persistEntries(nextEntries);

    if (activeType === 'MEAL') {
      setMealCustomName('');
      setMealAmount('');
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

  const deleteEntry = (entryId) => {
    const nextEntries = entries.filter((entry) => entry.id !== entryId);
    persistEntries(nextEntries);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل الطفل اليومي</h1>
            <p className="text-gray-600 mt-1">{childName}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="max-w-xs space-y-2">
              <Label htmlFor="log-date">التاريخ</Label>
              <Input
                id="log-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value || todayDate())}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إضافة سجل جديد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {LOG_TYPES.map((type) => (
                <Button
                  key={type.id}
                  type="button"
                  variant={activeType === type.id ? 'default' : 'outline'}
                  onClick={() => setActiveType(type.id)}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            {activeType === 'MEAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meal-preset">نوع الوجبة</Label>
                  <select
                    id="meal-preset"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={mealPreset}
                    onChange={(e) => setMealPreset(e.target.value)}
                  >
                    <option value="فطور">فطور</option>
                    <option value="غداء">غداء</option>
                    <option value="سناك">سناك</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal-custom">اسم وجبة مخصص (اختياري)</Label>
                  <Input
                    id="meal-custom"
                    value={mealCustomName}
                    onChange={(e) => setMealCustomName(e.target.value)}
                    placeholder="مثال: حساء"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="meal-amount">الكمية (اختياري)</Label>
                  <Input
                    id="meal-amount"
                    value={mealAmount}
                    onChange={(e) => setMealAmount(e.target.value)}
                    placeholder="مثال: نصف وجبة"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nap-start">وقت البداية</Label>
                  <Input
                    id="nap-start"
                    type="time"
                    value={napStart}
                    onChange={(e) => setNapStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nap-end">وقت النهاية</Label>
                  <Input
                    id="nap-end"
                    type="time"
                    value={napEnd}
                    onChange={(e) => setNapEnd(e.target.value)}
                  />
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
              <div className="space-y-4">
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
              <div className="space-y-4">
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

            <Button type="button" onClick={saveEntry}>حفظ السجل</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجلات اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-gray-500">لا توجد سجلات لهذا الطفل في هذا التاريخ.</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-gray-200 p-3 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{TYPE_LABELS[entry.type]}</p>
                        <p className="text-sm text-gray-600">{getEntrySummary(entry)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entry.createdAt).toLocaleTimeString('ar-JO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => deleteEntry(entry.id)}>
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
