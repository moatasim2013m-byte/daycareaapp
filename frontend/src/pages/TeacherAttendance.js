import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  LATE: 'متأخر',
};

const TeacherAttendance = () => {
  const today = new Date().toISOString().slice(0, 10);
  const attendanceKey = `attendance:1:${today}`;
  const rawAttendance = localStorage.getItem(attendanceKey);

  let statusLabel = 'غير مسجل';
  if (rawAttendance) {
    try {
      const attendance = JSON.parse(rawAttendance);
      const childStatus = attendance?.['1']?.status;
      statusLabel = STATUS_LABELS[childStatus] || childStatus || statusLabel;
    } catch {
      statusLabel = 'غير مسجل';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">حضور الأطفال</h1>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الطفل</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الحالة</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm text-gray-900">1</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{statusLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default TeacherAttendance;
