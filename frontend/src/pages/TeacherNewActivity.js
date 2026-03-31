import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Camera, Users, User, Trash2, Check, Rss } from 'lucide-react';

const getToday = () => new Date().toISOString().slice(0, 10);

const readEntries = (key) => {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch { return []; }
};

const TeacherNewActivity = () => {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [targetType, setTargetType] = useState('ROOM');
  const [childId, setChildId] = useState('');
  const [entries, setEntries] = useState([]);
  const [saved, setSaved] = useState(false);

  const currentDate = getToday();

  const storageKey = useMemo(() => {
    if (targetType === 'CHILD') {
      const normalizedChildId = childId.trim();
      if (!normalizedChildId) return null;
      return `activityFeedChild:${normalizedChildId}:${currentDate}`;
    }
    return `activityFeed:${currentDate}`;
  }, [targetType, childId, currentDate]);

  useEffect(() => { setEntries(readEntries(storageKey)); }, [storageKey]);

  const saveEntries = (nextEntries) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(nextEntries));
    setEntries(nextEntries);
  };

  const handleSave = () => {
    const normalizedCaption = caption.trim();
    const normalizedChildId = childId.trim();
    if (!normalizedCaption) { alert('الرجاء إدخال نص النشاط.'); return; }
    if (targetType === 'CHILD' && !normalizedChildId) { alert('الرجاء إدخال معرف الطفل.'); return; }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      caption: normalizedCaption,
      targetType,
      createdAt: new Date().toISOString(),
      ...(mediaUrl.trim() ? { mediaUrl: mediaUrl.trim() } : {}),
      ...(targetType === 'CHILD' ? { childId: normalizedChildId } : {}),
    };

    saveEntries([entry, ...entries]);
    setCaption('');
    setMediaUrl('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = (id) => { saveEntries(entries.filter((entry) => entry.id !== id)); };

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إضافة نشاط</h1>
              <p className="text-gray-600 text-sm">انشر تحديثاً يظهر في خلاصة أولياء الأمور مباشرة</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Rss className="w-3.5 h-3.5 text-sky-400" />
            سيظهر النشاط في صفحة "الخلاصة" لأولياء الأمور تلقائياً
          </div>
        </div>

        {/* Compose form */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">نموذج النشاط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>وصف النشاط</Label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="اكتب وصف النشاط — مثال: حصة رسم جماعي في الحديقة" rows={3} />
            </div>

            <div className="space-y-2">
              <Label>رابط صورة (اختياري)</Label>
              <Input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://example.com/image.jpg" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label>الاستهداف</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('ROOM')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    targetType === 'ROOM' ? 'bg-sky-100 text-sky-700 border border-sky-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  للغرفة كلها
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('CHILD')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    targetType === 'CHILD' ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <User className="w-4 h-4" />
                  لطفل محدد
                </button>
              </div>
            </div>

            {targetType === 'CHILD' && (
              <div className="space-y-2">
                <Label>معرف الطفل</Label>
                <Input value={childId} onChange={(e) => setChildId(e.target.value)} placeholder="مثال: 1" className="max-w-xs" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="button" onClick={handleSave} className="bg-orange-500 text-white hover:bg-orange-600">
                {saved ? <><Check className="w-4 h-4 ml-1" />تم الحفظ</> : 'حفظ النشاط'}
              </Button>
              <Link to="/teacher/today" className="text-sm text-gray-500 hover:text-gray-700">العودة لمهام اليوم</Link>
            </div>
          </CardContent>
        </Card>

        {/* Published activities */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Rss className="w-4 h-4 text-sky-500" />
              المنشورات ({currentDate})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!storageKey ? (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
                <User className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">أدخل معرف الطفل</p>
                  <p className="text-xs text-gray-400 mt-0.5">لعرض وحفظ منشورات خاصة بطفل محدد.</p>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-6">
                <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">لا توجد منشورات بعد لهذا المسار.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/30 p-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      {entry.targetType === 'ROOM'
                        ? <Users className="w-4 h-4 text-sky-500" />
                        : <User className="w-4 h-4 text-rose-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{entry.caption}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.targetType === 'ROOM' ? 'للغرفة' : `للطفل #${entry.childId}`} •{' '}
                        {new Date(entry.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {entry.mediaUrl && (
                        <a href={entry.mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">عرض الصورة</a>
                      )}
                    </div>
                    <button type="button" onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

export default TeacherNewActivity;
