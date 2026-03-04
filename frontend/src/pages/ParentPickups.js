import React from 'react';
import { Link } from 'react-router-dom';

const ParentPickups = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">ولي الأمر — الاستلام</h1>
        <p className="text-gray-600">صفحة مبدئية لإدارة طلبات وتسليم الاستلام.</p>
        <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default ParentPickups;
