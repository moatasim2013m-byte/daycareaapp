import React from 'react';
import { Link } from 'react-router-dom';

const TeacherMessages = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">المعلمات — الرسائل</h1>
        <p className="text-gray-600">صفحة مبدئية لمتابعة رسائل أولياء الأمور والتواصل.</p>
        <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default TeacherMessages;
