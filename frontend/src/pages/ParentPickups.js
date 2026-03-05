import React, { useEffect, useMemo, useState } from 'react';
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
    return parsed;
  } catch {
    return [];
  }
};

const ParentPickups = () => {
  const [childId, setChildId] = useState('1');
  const [needsChildInput, setNeedsChildInput] = useState(true);
  const [pickups, setPickups] = useState([]);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const candidateKeys = ['children', 'childProfiles', 'daycareChildren', 'kids'];

    for (const key of candidateKeys) {
      const list = parseCachedList(localStorage.getItem(key));
      if (list.length > 0) {
        const firstChild = list[0];
        const cachedId = firstChild?.child_id ?? firstChild?.childId ?? firstChild?.id;

        if (cachedId !== undefined && cachedId !== null && String(cachedId).trim() !== '') {
          setChildId(String(cachedId));
          setNeedsChildInput(false);
          return;
        }
      }
    }

    setNeedsChildInput(true);
  }, []);

  const storageKey = useMemo(() => `authorizedPickups:${childId}`, [childId]);

  useEffect(() => {
    setPickups(readPickups(storageKey));
  }, [storageKey]);

  const persistPickups = (nextPickups) => {
    localStorage.setItem(storageKey, JSON.stringify(nextPickups));
    setPickups(nextPickups);
  };

  const handleAdd = () => {
    const normalizedName = name.trim();
    const normalizedRelation = relation.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedName || !normalizedRelation || !normalizedPhone) {
      alert('الرجاء تعبئة الاسم، صلة القرابة، ورقم الهاتف.');
      return;
    }

    const nextItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: normalizedName,
      relation: normalizedRelation,
      phone: normalizedPhone,
      createdAt: new Date().toISOString(),
    };

    persistPickups([nextItem, ...pickups]);

    setName('');
    setRelation('');
    setPhone('');
  };

  const handleDelete = (id) => {
    const nextPickups = pickups.filter((item) => item.id !== id);
    persistPickups(nextPickups);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المخولين للاستلام</h1>
            <p className="text-gray-600 mt-1">إدارة الأشخاص المصرح لهم باستلام الطفل</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        {needsChildInput && (
          <Card>
            <CardContent className="pt-6 max-w-xs space-y-2">
              <Label htmlFor="pickup-child-id">معرف الطفل</Label>
              <Input
                id="pickup-child-id"
                value={childId}
                onChange={(e) => setChildId(e.target.value || '1')}
                placeholder="1"
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pickup List</CardTitle>
          </CardHeader>
          <CardContent>
            {pickups.length === 0 ? (
              <p className="text-gray-500">لا يوجد أشخاص مخولين بعد</p>
            ) : (
              <div className="space-y-3">
                {pickups.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-700">صلة القرابة: {item.relation}</p>
                        <p className="text-sm text-gray-700">الهاتف: {item.phone}</p>
                      </div>
                      <Button type="button" variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إضافة شخص مخول</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="pickup-name">الاسم</Label>
              <Input
                id="pickup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-relation">صلة القرابة</Label>
              <Input
                id="pickup-relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="مثال: خال / جدة"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-phone">رقم الهاتف</Label>
              <Input
                id="pickup-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07xxxxxxxx"
              />
            </div>

            <Button type="button" onClick={handleAdd}>إضافة شخص مخول</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentPickups;
