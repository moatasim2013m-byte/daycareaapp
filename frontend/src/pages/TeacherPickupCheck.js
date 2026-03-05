import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const readPickups = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const TeacherPickupCheck = () => {
  const [childId, setChildId] = useState('1');
  const [pickups, setPickups] = useState([]);

  const storageKey = useMemo(() => `authorizedPickups:${childId}`, [childId]);

  useEffect(() => {
    setPickups(readPickups(storageKey));
  }, [storageKey]);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التحقق من الاستلام</h1>
            <p className="text-gray-600 mt-1">تحقق سريع من الأشخاص المخولين لاستلام الطفل</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 max-w-xs space-y-2">
            <Label htmlFor="pickup-check-child-id">معرف الطفل</Label>
            <Input
              id="pickup-check-child-id"
              value={childId}
              onChange={(e) => setChildId(e.target.value || '1')}
              placeholder="1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>قائمة المخولين</CardTitle>
          </CardHeader>
          <CardContent>
            {pickups.length === 0 ? (
              <p className="text-gray-500">لا يوجد أشخاص مخولين لهذا الطفل</p>
            ) : (
              <div className="space-y-3">
                {pickups.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-700">صلة القرابة: {item.relation || '-'}</p>
                    <p className="text-sm text-gray-700">الهاتف: {item.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherPickupCheck;
