import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const ParentFeed = () => {
  const [childId, setChildId] = useState('');
  const dateKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const roomPosts = useMemo(() => {
    const saved = localStorage.getItem(`activityFeed:${dateKey}`);
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      return [];
    }
  }, [dateKey]);

  const childPosts = useMemo(() => {
    if (!childId) {
      return [];
    }

    const saved = localStorage.getItem(`activityFeedChild:${childId}:${dateKey}`);
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      return [];
    }
  }, [childId, dateKey]);

  const posts = [...roomPosts, ...childPosts];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">ولي الأمر — الخلاصة اليومية</h1>
        <label className="block">
          <span className="text-sm text-gray-700">معرّف الطفل</span>
          <input
            aria-label="childId"
            value={childId}
            onChange={(event) => setChildId(event.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        {posts.length > 0 ? (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="rounded border border-gray-200 bg-white p-3">
                {post.caption}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">لا توجد منشورات لهذا اليوم.</p>
        )}

        <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default ParentFeed;
