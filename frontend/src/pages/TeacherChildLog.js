import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  FileText, Utensils, Moon, SmilePlus, StickyNote,
  Droplets, ArrowRight, Trash2
} from 'lucide-react';

const LOG_TYPES = [
  { value: 'MEAL', label: 'وجبة', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
  { value: 'NAP', label: 'نوم', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { value: 'DIAPER', label: 'حفاض', icon: Droplets, color: 'text-teal-500', bg: 'bg-teal-50' },
  { value: 'MOOD', label: 'مزاج', icon: SmilePlus, color: 'text-rose-500', bg: 'bg-rose-50' },
  { value: 'NOTE', label: 'ملاحظة', icon: StickyNote, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const TYPE_META = {};
LOG_TYPES.forEach((t) => { TYPE_META[t.value] = t; });

const today = () => new Date().toISOString().slice(0, 10);

const readLogs = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch { return []; }
};

const getSummaryFromPayload = (log) => {
  const payload = log?.payload || {};
  if (log.type === 'MEAL') return [payload.mealName, payload.notes].filter(Boolean).join(' • ');
  if (log.type === 'NAP') { const range = [payload.startTime, payload.endTime].filter(Boolean).join(' - '); return [range, payload.notes].filter(Boolean).join(' • '); }
  if (log.type === 'DIAPER') return [payload.diaperType, payload.notes].filter(Boolean).join(' • ');
  if (log.type === 'MOOD') return [payload.mood, payload.notes].filter(Boolean).join(' • ');
  if (log.type === 'NOTE') return payload.text || '';
  return '';
};

const TeacherChildLog = () => {
  const { childId } = useParams();
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

  useEffect(() => { setLogs(readLogs(storageKey)); }, [storageKey]);

  const persistLogs = (nextLogs) => { localStorage.setItem(storageKey, JSON.stringify(nextLogs)); setLogs(nextLogs); };

  const handleAdd = () => {
    let payload = {};
    if (activeType === 'MEAL') { if (!mealName.trim()) { alert('الرجاء إدخال تفاصيل الوجبة.'); return; } payload = { mealName: mealName.trim(), notes: mealNotes.trim() }; }
    if (activeType === 'NAP') { if (!napStart || !napEnd) { alert('الرجاء إدخال وقت بداية ونهاية النوم.'); return; } payload = { startTime: napStart, endTime: napEnd, notes: napNotes.trim() }; }
    if (activeType === 'DIAPER') { payload = { diaperType, notes: diaperNotes.trim() }; }
    if (activeType === 'MOOD') { payload = { mood: moodType, notes: moodNotes.trim() }; }
    if (activeType === 'NOTE') { if (!noteText.trim()) { alert('الرجاء إدخال الملاحظة.'); return; } payload = { text: noteText.trim() }; }

    const nextEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, type: activeType, payload, createdAt: new Date().toISOString() };
    persistLogs([nextEntry, ...logs]);

    if (activeType === 'MEAL') { setMealName(''); setMealNotes(''); }
    if (activeType === 'NAP') { setNapStart(''); setNapEnd(''); setNapNotes(''); }
    if (activeType === 'DIAPER') { setDiaperNotes(''); }
    if (activeType === 'MOOD') { setMoodNotes(''); }
    if (activeType === 'NOTE') { setNoteText(''); }
  };

  const handleDelete = (id) => { persistLogs(logs.filter((item) => item.id !== id)); };

  const activeTypeMeta = TYPE_META[activeType] || TYPE_META.NOTE;

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">سجل الطفل #{childId}</h1>
                <p className="text-gray-600 text-sm">تسجيل الوجبات، النوم، المزاج، والملاحظات</p>
              </div>
            </div>
            <Link to="/teacher/attendance" className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium">
              <ArrowRight className="w-4 h-4" />
              الحضور
            </Link>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value || today())} className="w-auto text-sm" />
            <span className="text-xs text-gray-500">{logs.length} سجل لهذا اليوم</span>
          </div>
        </div>

        {/* Log type tabs */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">إضافة حدث جديد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {LOG_TYPES.map((logType) => {
                const Icon = logType.icon;
                const isActive = activeType === logType.value;
                return (
                  <button
                    key={logType.value}
                    type="button"
                    onClick={() => setActiveType(logType.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isActive ? `${logType.bg} ${logType.color} border border-current` : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {logType.label}
                  </button>
                );
              })}
            </div>

            {activeType === 'MEAL' && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>تفاصيل الوجبة</Label><Input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="مثال: فطور كامل" /></div>
                <div className="space-y-2"><Label>ملاحظات (اختياري)</Label><Textarea value={mealNotes} onChange={(e) => setMealNotes(e.target.value)} placeholder="أي ملاحظات" rows={2} /></div>
              </div>
            )}
            {activeType === 'NAP' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>وقت البداية</Label><Input type="time" value={napStart} onChange={(e) => setNapStart(e.target.value)} /></div>
                <div className="space-y-2"><Label>وقت النهاية</Label><Input type="time" value={napEnd} onChange={(e) => setNapEnd(e.target.value)} /></div>
                <div className="space-y-2 col-span-2"><Label>ملاحظات (اختياري)</Label><Textarea value={napNotes} onChange={(e) => setNapNotes(e.target.value)} rows={2} /></div>
              </div>
            )}
            {activeType === 'DIAPER' && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>النوع</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={diaperType} onChange={(e) => setDiaperType(e.target.value)}><option value="مبلل">مبلل</option><option value="متسخ">متسخ</option><option value="كلاهما">كلاهما</option></select></div>
                <div className="space-y-2"><Label>ملاحظات (اختياري)</Label><Textarea value={diaperNotes} onChange={(e) => setDiaperNotes(e.target.value)} rows={2} /></div>
              </div>
            )}
            {activeType === 'MOOD' && (
              <div className="space-y-3">
                <div className="space-y-2"><Label>المزاج</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={moodType} onChange={(e) => setMoodType(e.target.value)}><option value="سعيد">سعيد</option><option value="طبيعي">طبيعي</option><option value="زعلان">زعلان</option></select></div>
                <div className="space-y-2"><Label>ملاحظات (اختياري)</Label><Textarea value={moodNotes} onChange={(e) => setMoodNotes(e.target.value)} rows={2} /></div>
              </div>
            )}
            {activeType === 'NOTE' && (
              <div className="space-y-2"><Label>الملاحظة</Label><Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="اكتب ملاحظة عن الطفل" rows={3} /></div>
            )}

            <Button type="button" onClick={handleAdd} className="bg-orange-500 text-white hover:bg-orange-600">إضافة السجل</Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">السجل الزمني</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-orange-50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-300" />
                </div>
                <p className="text-sm font-medium text-gray-700">لا توجد سجلات بعد لهذا اليوم</p>
                <p className="text-xs text-gray-500 mt-1">استخدم النموذج أعلاه لتسجيل أول حدث.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const meta = TYPE_META[log.type] || TYPE_META.NOTE;
                  const Icon = meta.icon;
                  return (
                    <div key={log.id} className={`flex items-start gap-3 rounded-xl border border-gray-100 p-3 ${meta.bg}`}>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-gray-500">{meta.label}</span>
                          <span className="text-xs text-gray-400">
                            {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{getSummaryFromPayload(log) || '—'}</p>
                      </div>
                      <button type="button" onClick={() => handleDelete(log.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherChildLog;
