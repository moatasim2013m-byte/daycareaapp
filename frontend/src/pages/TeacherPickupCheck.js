import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const getToday = () => new Date().toISOString().slice(0, 10);

const readArray = (key) => {
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
  const [search, setSearch] = useState('');
  const [pickups, setPickups] = useState([]);
  const [verificationLog, setVerificationLog] = useState([]);

  const normalizedChildId = useMemo(() => {
    const trimmed = String(childId ?? '').trim();
    return trimmed || '1';
  }, [childId]);

  const pickupsKey = useMemo(
    () => `authorizedPickups:${normalizedChildId}`,
    [normalizedChildId]
  );

  const checksKey = useMemo(
    () => `pickupChecks:${normalizedChildId}:${getToday()}`,
    [normalizedChildId]
  );

  useEffect(() => {
    setPickups(readArray(pickupsKey));
  }, [pickupsKey]);

  useEffect(() => {
    const sortedChecks = readArray(checksKey).sort(
      (a, b) => new Date(b?.verifiedAt || 0).getTime() - new Date(a?.verifiedAt || 0).getTime()
    );
    setVerificationLog(sortedChecks);
  }, [checksKey]);

  const filteredPickups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return pickups;
    }

    return pickups.filter((item) => {
      const name = String(item?.name || '').toLowerCase();
      const phone = String(item?.phone || '').toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [pickups, search]);

  const handleVerify = (person) => {
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childId: normalizedChildId,
      personName: person?.name || '',
      relation: person?.relation || '',
      phone: person?.phone || '',
      verifiedAt: new Date().toISOString(),
    };

    const nextLog = [event, ...verificationLog].sort(
      (a, b) => new Date(b?.verifiedAt || 0).getTime() - new Date(a?.verifiedAt || 0).getTime()
    );

    localStorage.setItem(checksKey, JSON.stringify(nextLog));
    setVerificationLog(nextLog);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">التحقق من الاستلام</h1>
          <Button asChild variant="outline">
            <Link to="/">العودة</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup-check-child-id">معرف الطفل</Label>
              <Input
                id="pickup-check-child-id"
                value={childId}
                onChange={(e) => setChildId(e.target.value || '1')}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-check-search">بحث بالاسم أو الهاتف (اختياري)</Label>
              <Input
                id="pickup-check-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اكتب الاسم أو رقم الهاتف"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>قائمة المخولين</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPickups.length === 0 ? (
              <p className="text-gray-500">لا يوجد أشخاص مخولين لهذا الطفل</p>
            ) : (
              <div className="space-y-3">
                {filteredPickups.map((item, index) => (
                  <div
                    key={item.id || `${item.name || 'person'}-${index}`}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <p className="text-sm text-gray-700">الاسم: {item.name || '-'}</p>
                    <p className="text-sm text-gray-700">صلة القرابة: {item.relation || '-'}</p>
                    <p className="text-sm text-gray-700">رقم الهاتف: {item.phone || '-'}</p>
                    {item.createdAt ? (
                      <p className="text-sm text-gray-700">
                        وقت الإضافة: {new Date(item.createdAt).toLocaleString('ar-EG')}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <Button type="button" onClick={() => handleVerify(item)}>
                        تم التحقق
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
            <CardTitle>سجل تحقق اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            {verificationLog.length === 0 ? (
              <p className="text-gray-500">لا توجد عمليات تحقق اليوم</p>
            ) : (
              <div className="space-y-2">
                {verificationLog.map((item) => (
                  <p key={item.id} className="text-sm text-gray-700">
                    {item.personName || '-'} -{' '}
                    {item.verifiedAt ? new Date(item.verifiedAt).toLocaleTimeString('ar-EG') : '-'}
                  </p>
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
