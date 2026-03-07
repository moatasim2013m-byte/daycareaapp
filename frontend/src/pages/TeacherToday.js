import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { resolveCachedChildContext } from '../utils/childContext';

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  PICKED_UP: 'انصرف',
};

const readObjectFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
};

const readListFromStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const TeacherToday = () => {
  const selectedDate = today();
  const context = resolveCachedChildContext();
  const roomId = context?.roomId || '1';

  const attendanceSummary = useMemo(() => {
    const attendance = readObjectFromStorage(`attendance:${roomId}:${selectedDate}`);
    return Object.values(attendance)
      .map((item) => STATUS_LABELS[item?.status] || null)
      .filter(Boolean);
  }, [roomId, selectedDate]);

  const activitySummary = useMemo(() => {
    const roomEntries = readListFromStorage(`activityFeedRoom:${selectedDate}`)
      .filter((entry) => {
        const entryRoomId = entry?.roomId ?? entry?.room_id ?? entry?.classroomId ?? entry?.classroom_id;
        if (entryRoomId === undefined || entryRoomId === null || entryRoomId === '') return true;
        return String(entryRoomId) === String(roomId);
      });

    const activities = roomEntries.length > 0 ? roomEntries : readListFromStorage(`activityFeed:${selectedDate}`);

    return activities
      .map((activity) => activity?.text || activity?.content || activity?.title || '')
      .filter(Boolean);
  }, [roomId, selectedDate]);

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-3xl">
        <div className="peek-header peek-header--teacher">
          <h1 className="text-2xl font-bold text-gray-900">المعلمات — مهام اليوم</h1>
          <p className="text-gray-600 mt-1">لوحة سريعة للغرفة {roomId} مع مسارات تنفيذ يومية.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="peek-action-teacher inline-flex items-center bg-orange-500 px-4 text-white" to="/teacher/attendance">تسجيل الحضور</Link>
            <Link className="peek-action-teacher inline-flex items-center bg-sky-500 px-4 text-white" to="/teacher/activity/new">إضافة نشاط</Link>
            <Link className="peek-action-teacher inline-flex items-center bg-emerald-500 px-4 text-white" to="/teacher/messages">مراسلة أولياء الأمور</Link>
          </div>
        </div>

        <section className="peek-card p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">الحضور</h2>
          {attendanceSummary.length > 0 ? (
            attendanceSummary.map((status, index) => (
              <p key={`${status}-${index}`} className="rounded-xl bg-orange-50 px-3 py-2 text-sm">{status}</p>
            ))
          ) : (
            <div className="peek-empty text-gray-500">لا توجد بيانات حضور لليوم.</div>
          )}
        </section>

        <section className="peek-card p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">النشاطات</h2>
          {activitySummary.length > 0 ? (
            activitySummary.map((text, index) => (
              <p key={`${text}-${index}`} className="rounded-xl bg-sky-50 px-3 py-2 text-sm">{text}</p>
            ))
          ) : (
            <div className="peek-empty text-gray-500">لا توجد نشاطات مسجلة لليوم.</div>
          )}
        </section>

        <Link to="/" className="inline-block text-blue-700 hover:text-blue-800 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default TeacherToday;
