import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveCachedChildContext } from '../utils/childContext';

const ParentPickups = () => {
  const [childId, setChildId] = useState('1');
  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) {
      setChildId(context.childId);
    }
  }, []);

  const authorizedPickups = useMemo(() => {
    const stored = localStorage.getItem(`authorizedPickups:${childId}`);
    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored);
    } catch (_error) {
      return [];
    }
  }, [childId]);

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-3xl">
        <div className="peek-header peek-header--parent"><h1 className="text-2xl font-bold text-gray-900">خطة الاستلام الآمن</h1><p className="text-gray-600">إدارة الأشخاص المخولين باستلام الطفل بطريقة واضحة وسهلة.</p></div>

        <label className="block text-sm font-medium text-gray-700" htmlFor="childId">
          رقم الطفل
        </label>
        <input
          id="childId"
          name="childId"
          value={childId}
          onChange={(event) => setChildId(event.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />

        <div className="space-y-2 peek-card p-4">
          {authorizedPickups.map((pickup) => (
            <div key={pickup.id} className="peek-feed-item p-3">
              <p className="font-medium text-gray-900">{pickup.name}</p>
              <p className="text-gray-600">{pickup.phone}</p>
            </div>
          ))}
        </div>

        <Link to="/" className="inline-block text-blue-700 hover:text-blue-800 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default ParentPickups;
