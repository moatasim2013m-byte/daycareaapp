import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const TeacherChildLog = () => {
  const { childId } = useParams();
  const storageKey = `teacher-child-log-${childId}-note`;
  const [activeTab, setActiveTab] = useState('note');
  const [noteInput, setNoteInput] = useState('');
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    const storedNote = localStorage.getItem(storageKey);
    if (storedNote) {
      setSavedNote(storedNote);
    }
  }, [storageKey]);

  const handleSave = () => {
    const value = noteInput.trim();
    if (!value) {
      return;
    }

    setSavedNote(value);
    localStorage.setItem(storageKey, value);
    setNoteInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">المعلمات — سجل الطفل</h1>
        <p className="text-gray-600">صفحة مبدئية لعرض سجل الأنشطة للطفل رقم: {childId}</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('note')}
            className={`px-4 py-2 rounded ${activeTab === 'note' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            ملاحظة
          </button>
        </div>

        {activeTab === 'note' && (
          <div className="space-y-2">
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="أدخل ملاحظة"
              className="w-full p-3 border rounded"
            />
            <button type="button" onClick={handleSave} className="px-4 py-2 rounded bg-green-600 text-white">
              حفظ
            </button>
          </div>
        )}

        {savedNote && (
          <div className="bg-white border rounded p-3">
            <h2 className="font-semibold mb-1">آخر ملاحظة</h2>
            <p>{savedNote}</p>
          </div>
        )}

        <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default TeacherChildLog;
