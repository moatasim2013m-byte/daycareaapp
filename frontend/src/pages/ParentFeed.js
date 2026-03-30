import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { resolveCachedChildContext } from '../utils/childContext';
import {
  Rss, Camera, Activity, Clock, Smile, MessageSquare,
  CalendarDays, ChevronLeft, ChevronRight
} from 'lucide-react';

const getToday = () => new Date().toISOString().slice(0, 10);

const formatArabicDate = (dateStr) => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
};

const readFeedByKey = (key) => {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const looksLikeImage = (url) => {
  if (!url) return false;
  return /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.svg)(\?.*)?$/i.test(url.trim());
};

const FEED_TYPE_META = {
  CHILD: { label: 'تحديث خاص', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Smile },
  ROOM: { label: 'نشاط الغرفة', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Activity },
};

const ParentFeed = () => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [childId, setChildId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (!context) return;
    setChildId(context.childId || '');
    if (context.roomId) setRoomId(context.roomId);
  }, []);

  const shiftDate = (days) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const mergedFeed = useMemo(() => {
    const roomKeyPrimary = `activityFeedRoom:${selectedDate}`;
    const roomKeyFallback = `activityFeed:${selectedDate}`;
    const childKey = childId ? `activityFeedChild:${childId}:${selectedDate}` : '';

    const matchesRoomContext = (entry) => {
      const entryRoomId = entry?.roomId ?? entry?.room_id ?? entry?.classroomId ?? entry?.classroom_id;
      if (entryRoomId === undefined || entryRoomId === null || entryRoomId === '') return true;
      return String(entryRoomId) === String(roomId);
    };

    const roomPostsPrimary = readFeedByKey(roomKeyPrimary)
      .filter(matchesRoomContext)
      .map((entry) => ({ ...entry, feedType: 'ROOM', sourceKey: roomKeyPrimary }));

    const roomPostsFallback = roomPostsPrimary.length === 0
      ? readFeedByKey(roomKeyFallback)
          .filter(matchesRoomContext)
          .map((entry) => ({ ...entry, feedType: 'ROOM', sourceKey: roomKeyFallback }))
      : [];

    const childPosts = readFeedByKey(childKey).map((entry) => ({
      ...entry, feedType: 'CHILD', sourceKey: childKey,
    }));

    return [...childPosts, ...roomPostsPrimary, ...roomPostsFallback].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [childId, roomId, selectedDate]);

  useEffect(() => { setFeed(mergedFeed); }, [mergedFeed]);

  const mediaItems = feed.filter((e) => e.mediaUrl && looksLikeImage(e.mediaUrl));
  const isToday = selectedDate === getToday();

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--parent">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
              <Rss className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">خلاصة يوم طفلك</h1>
              <p className="text-gray-600 text-sm">تحديثات من يوم الطفل داخل الحضانة — أنشطة، صور، وملاحظات</p>
            </div>
          </div>
        </div>

        {/* Date navigator */}
        <Card className="peek-card">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <button onClick={() => shiftDate(1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" disabled={isToday}>
                <ChevronRight className={`w-5 h-5 ${isToday ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-gray-900">{formatArabicDate(selectedDate)}</span>
                </div>
                {isToday && <span className="text-xs text-amber-600 font-medium">اليوم</span>}
              </div>
              <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        {feed.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
              <Activity className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{feed.length}</p>
              <p className="text-xs text-gray-500">تحديث</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
              <Camera className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{mediaItems.length}</p>
              <p className="text-xs text-gray-500">صورة</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
              <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">
                {feed.length > 0 && feed[0].createdAt
                  ? new Date(feed[0].createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
              <p className="text-xs text-gray-500">آخر تحديث</p>
            </div>
          </div>
        )}

        {/* Photo gallery strip */}
        {mediaItems.length > 0 && (
          <Card className="peek-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-rose-400" />
                صور اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaItems.map((item) => (
                  <img
                    key={`${item.sourceKey}-${item.id}-thumb`}
                    src={item.mediaUrl}
                    alt={item.caption || 'صورة'}
                    className="w-24 h-24 rounded-xl border border-gray-200 object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feed timeline */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Rss className="w-4 h-4 text-amber-500" />
              التحديثات
              {feed.length > 0 && <Badge variant="secondary" className="text-xs">{feed.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feed.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                  <Rss className="w-7 h-7 text-amber-300" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-1">لا توجد تحديثات لهذا اليوم</p>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
                  عندما يقوم فريق الحضانة بنشر أنشطة أو صور أو ملاحظات، ستظهر هنا مباشرة.
                </p>
                {!isToday && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(getToday())}>
                    العودة لليوم الحالي
                  </Button>
                )}
                {isToday && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/parent/messages">مراسلة الحضانة</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {feed.map((entry) => {
                  const meta = FEED_TYPE_META[entry.feedType] || FEED_TYPE_META.ROOM;
                  const Icon = meta.icon;
                  return (
                    <div key={`${entry.sourceKey}-${entry.id}`} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${entry.feedType === 'CHILD' ? 'bg-rose-50' : 'bg-sky-50'}`}>
                          <Icon className={`w-4 h-4 ${entry.feedType === 'CHILD' ? 'text-rose-500' : 'text-sky-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {entry.createdAt
                                ? new Date(entry.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })
                                : '--:--'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 leading-relaxed">{entry.caption || 'نشاط مسجل'}</p>
                          {entry.mediaUrl && looksLikeImage(entry.mediaUrl) && (
                            <img
                              src={entry.mediaUrl}
                              alt="وسائط النشاط"
                              className="mt-2 max-h-52 rounded-xl border border-gray-200 object-cover"
                            />
                          )}
                          {entry.mediaUrl && !looksLikeImage(entry.mediaUrl) && (
                            <a href={entry.mediaUrl} target="_blank" rel="noreferrer"
                               className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">
                              فتح رابط الوسائط
                            </a>
                          )}
                        </div>
                      </div>
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

export default ParentFeed;
