import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
  PICKED_UP: 'انصرف',
};

const today = () => new Date().toISOString().slice(0, 10);

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

  const attendanceSummary = useMemo(() => {
    const attendance = readObjectFromStorage(`attendance:1:${selectedDate}`);
    return Object.values(attendance)
      .map((item) => STATUS_LABELS[item?.status] || null)
      .filter(Boolean);
  }, [selectedDate]);

  const activitySummary = useMemo(() => {
    const activities = readListFromStorage(`activityFeed:${selectedDate}`);
    return activities
      .map((activity) => activity?.text || activity?.content || activity?.title || '')
      .filter(Boolean);
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">المعلمات — مهام اليوم</h1>
        <p className="text-gray-600">ملخص سريع لحضور اليوم ونشاطات الغرفة.</p>

        <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">الحضور</h2>
          {attendanceSummary.length > 0 ? (
            attendanceSummary.map((status, index) => <p key={`${status}-${index}`}>{status}</p>)
          ) : (
            <p className="text-gray-500">لا توجد بيانات حضور لليوم.</p>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">النشاطات</h2>
          {activitySummary.length > 0 ? (
            activitySummary.map((text, index) => <p key={`${text}-${index}`}>{text}</p>)
          ) : (
            <p className="text-gray-500">لا توجد نشاطات مسجلة لليوم.</p>
          )}
        </section>

        <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default TeacherToday;
