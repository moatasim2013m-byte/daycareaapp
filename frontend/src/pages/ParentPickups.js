import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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

const readPickups = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return [...parsed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
};

const ParentPickups = () => {
  const [childId, setChildId] = useState('1');

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
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">ولي الأمر — الاستلام</h1>
        <p className="text-gray-600">صفحة مبدئية لإدارة طلبات وتسليم الاستلام.</p>

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

        <div className="space-y-2">
          {authorizedPickups.map((pickup) => (
            <div key={pickup.id} className="rounded border border-gray-200 bg-white p-3">
              <p className="font-medium text-gray-900">{pickup.name}</p>
              <p className="text-gray-600">{pickup.phone}</p>
            </div>
          ))}
        </div>

        <Link to="/" className="inline-block text-blue-600 hover:text-blue-700 font-medium">
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

export default ParentPickups;
