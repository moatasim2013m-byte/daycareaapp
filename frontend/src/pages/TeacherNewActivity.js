import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const getToday = () => new Date().toISOString().slice(0, 10);

const readEntries = (key) => {
  if (!key) return [];

  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return [...parsed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
};

const TeacherNewActivity = () => {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [targetType, setTargetType] = useState('ROOM');
  const [childId, setChildId] = useState('');
  const [entries, setEntries] = useState([]);

  const currentDate = getToday();

  const storageKey = useMemo(() => {
    if (targetType === 'CHILD') {
      const normalizedChildId = childId.trim();
      if (!normalizedChildId) return null;
      return `activityFeedChild:${normalizedChildId}:${currentDate}`;
    }

    return `activityFeed:${currentDate}`;
  }, [targetType, childId, currentDate]);

  useEffect(() => {
    setEntries(readEntries(storageKey));
  }, [storageKey]);

  const saveEntries = (nextEntries) => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(nextEntries));
    setEntries(nextEntries);
  };

  const handleSave = () => {
    const normalizedCaption = caption.trim();
    const normalizedChildId = childId.trim();

    if (!normalizedCaption) {
      alert('الرجاء إدخال نص النشاط.');
      return;
    }

    if (targetType === 'CHILD' && !normalizedChildId) {
      alert('الرجاء إدخال معرف الطفل.');
      return;
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      caption: normalizedCaption,
      targetType,
      createdAt: new Date().toISOString(),
      ...(mediaUrl.trim() ? { mediaUrl: mediaUrl.trim() } : {}),
      ...(targetType === 'CHILD' ? { childId: normalizedChildId } : {}),
    };

    const nextEntries = [entry, ...entries];
    saveEntries(nextEntries);

    setCaption('');
    setMediaUrl('');
  };

  const handleDelete = (id) => {
    const nextEntries = entries.filter((entry) => entry.id !== id);
    saveEntries(nextEntries);
  };

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl">
        <div className="peek-header peek-header--teacher flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إضافة نشاط</h1>
            <p className="text-gray-600 mt-1">إضافة منشور نشاط يومي للغرفة أو لطفل محدد</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card className="peek-card">
          <CardHeader>
            <CardTitle>نموذج النشاط</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-caption">وصف النشاط</Label>
              <Textarea
                id="activity-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="اكتب وصف النشاط هنا"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-media">رابط وسائط (اختياري)</Label>
              <Input
                id="activity-media"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>الاستهداف</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={targetType === 'ROOM' ? 'default' : 'outline'}
                  onClick={() => setTargetType('ROOM')}
                >
                  للغرفة
                </Button>
                <Button
                  type="button"
                  variant={targetType === 'CHILD' ? 'default' : 'outline'}
                  onClick={() => setTargetType('CHILD')}
                >
                  للطفل
                </Button>
              </div>
            </div>

            {targetType === 'CHILD' && (
              <div className="space-y-2">
                <Label htmlFor="activity-child-id">معرف الطفل</Label>
                <Input
                  id="activity-child-id"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  placeholder="مثال: 1"
                />
              </div>
            )}

            <Button type="button" onClick={handleSave} className="peek-action-teacher bg-orange-500 text-white hover:bg-orange-600">حفظ النشاط</Button>
          </CardContent>
        </Card>

        <Card className="peek-card">
          <CardHeader>
            <CardTitle>معاينة المنشورات ({currentDate})</CardTitle>
          </CardHeader>
          <CardContent>
            {!storageKey ? (
              <p className="text-gray-500">أدخل معرف الطفل لعرض/حفظ منشورات الطفل.</p>
            ) : entries.length === 0 ? (
              <p className="text-gray-500">لا توجد منشورات محفوظة لهذا المسار حالياً.</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{entry.caption}</p>
                        <p className="text-xs text-gray-600">
                          {entry.targetType === 'ROOM' ? 'للغرفة' : `للطفل #${entry.childId}`}
                        </p>
                        {entry.mediaUrl && (
                          <a
                            href={entry.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            عرض رابط الوسائط
                          </a>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(entry.createdAt).toLocaleTimeString('ar-JO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(entry.id)}>
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

export default TeacherNewActivity;
