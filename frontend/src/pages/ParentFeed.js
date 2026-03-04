import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';

const getToday = () => new Date().toISOString().slice(0, 10);

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

const readFeedByKey = (key) => {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const looksLikeImage = (url) => {
  if (!url) return false;
  return /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.svg)(\?.*)?$/i.test(url.trim());
};

const ParentFeed = () => {
  const today = getToday();

  const [childId, setChildId] = useState('1');
  const [roomId, setRoomId] = useState('1');
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const candidateKeys = ['children', 'childProfiles', 'daycareChildren', 'kids'];

    for (const key of candidateKeys) {
      const children = parseCachedList(localStorage.getItem(key));
      if (children.length > 0) {
        const child = children[0];
        const cachedChildId = child?.child_id ?? child?.childId ?? child?.id;
        const cachedRoomId = child?.room_id ?? child?.roomId ?? child?.classroom_id ?? child?.zone_id;

        if (cachedChildId !== undefined && cachedChildId !== null) {
          setChildId(String(cachedChildId));
        }

        if (cachedRoomId !== undefined && cachedRoomId !== null) {
          setRoomId(String(cachedRoomId));
        }

        break;
      }
    }
  }, []);

  const mergedFeed = useMemo(() => {
    const roomKeyPrimary = `activityFeedRoom:${today}`;
    const roomKeyFallback = `activityFeed:${today}`;
    const childKey = `activityFeedChild:${childId}:${today}`;

    const matchesRoomContext = (entry) => {
      const entryRoomId = entry?.roomId ?? entry?.room_id ?? entry?.classroomId ?? entry?.classroom_id;
      if (entryRoomId === undefined || entryRoomId === null || entryRoomId === '') return true;
      return String(entryRoomId) === String(roomId);
    };

    const roomPostsPrimary = readFeedByKey(roomKeyPrimary)
      .filter(matchesRoomContext)
      .map((entry) => ({
        ...entry,
        feedType: 'ROOM',
        sourceKey: roomKeyPrimary,
      }));

    const roomPostsFallback = roomPostsPrimary.length === 0
      ? readFeedByKey(roomKeyFallback)
          .filter(matchesRoomContext)
          .map((entry) => ({
            ...entry,
            feedType: 'ROOM',
            sourceKey: roomKeyFallback,
          }))
      : [];

    const childPosts = readFeedByKey(childKey).map((entry) => ({
      ...entry,
      feedType: 'CHILD',
      sourceKey: childKey,
    }));

    return [...childPosts, ...roomPostsPrimary, ...roomPostsFallback].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [childId, roomId, today]);

  useEffect(() => {
    setFeed(mergedFeed);
  }, [mergedFeed]);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ولي الأمر — الخلاصة اليومية</h1>
            <p className="text-gray-600 mt-1">تحديثات اليوم للغرفة والطفل</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>سياق الطفل النشط</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feed-child-id">معرّف الطفل</Label>
              <Input
                id="feed-child-id"
                value={childId}
                onChange={(e) => setChildId(e.target.value || '1')}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feed-room-id">معرّف الغرفة</Label>
              <Input
                id="feed-room-id"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value || '1')}
                placeholder="1"
              />
            </div>
            <p className="text-xs text-gray-500 md:col-span-2">
              التاريخ الحالي: {today} — يتم تحميل منشورات الغرفة من activityFeedRoom:{today} مع fallback إلى activityFeed:{today}
              ومنشورات الطفل من activityFeedChild:{childId}:{today}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الخلاصة</CardTitle>
          </CardHeader>
          <CardContent>
            {feed.length === 0 ? (
              <p className="text-gray-500">لا توجد منشورات حالياً لهذا الطفل/اليوم.</p>
            ) : (
              <div className="space-y-3">
                {feed.map((entry) => (
                  <div key={`${entry.sourceKey}-${entry.id}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={entry.feedType === 'CHILD' ? 'default' : 'secondary'}>
                          {entry.feedType === 'CHILD' ? 'للطفل' : 'للغرفة'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {entry.createdAt
                            ? new Date(entry.createdAt).toLocaleTimeString('ar-JO', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '--:--'}
                        </span>
                      </div>

                      <p className="font-medium text-gray-900">{entry.caption || 'بدون وصف'}</p>

                      {entry.mediaUrl && (
                        looksLikeImage(entry.mediaUrl) ? (
                          <img
                            src={entry.mediaUrl}
                            alt="وسائط النشاط"
                            className="max-h-48 rounded-md border border-gray-200 object-cover"
                          />
                        ) : (
                          <a
                            href={entry.mediaUrl}
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

export default ParentFeed;
