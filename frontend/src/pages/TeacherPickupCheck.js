import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const getToday = () => new Date().toISOString().slice(0, 10);

const readArrayFromStorage = (key) => {
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
  const [authorizedPeople, setAuthorizedPeople] = useState([]);
  const [verificationLog, setVerificationLog] = useState([]);

  const pickupsKey = useMemo(() => `authorizedPickups:${String(childId || '1')}`, [childId]);
  const checksKey = useMemo(
    () => `pickupChecks:${String(childId || '1')}:${getToday()}`,
    [childId]
  );

  useEffect(() => {
    setAuthorizedPeople(readArrayFromStorage(pickupsKey));
  }, [pickupsKey]);

  useEffect(() => {
    const sortedChecks = readArrayFromStorage(checksKey).sort(
      (a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
    );
    setVerificationLog(sortedChecks);
  }, [checksKey]);

  const filteredAuthorizedPeople = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return authorizedPeople;
    }

    return authorizedPeople.filter((person) => {
      const personName = String(person?.name || '').toLowerCase();
      const phone = String(person?.phone || '').toLowerCase();
      return personName.includes(query) || phone.includes(query);
    });
  }, [authorizedPeople, search]);

  const handleVerify = (person) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childId: String(childId || '1'),
      personName: person?.name || '',
      relation: person?.relation || '',
      phone: person?.phone || '',
      verifiedAt: new Date().toISOString(),
    };

    const nextLog = [entry, ...verificationLog].sort(
      (a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
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
            {filteredAuthorizedPeople.length === 0 ? (
              <p className="text-gray-500">لا يوجد أشخاص مخولين لهذا الطفل</p>
            ) : (
              <div className="space-y-3">
                {filteredAuthorizedPeople.map((person, index) => (
                  <div
                    key={person?.id || `${person?.name || 'person'}-${index}`}
                    className="rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <p className="text-sm text-gray-700">الاسم: {person?.name || '-'}</p>
                    <p className="text-sm text-gray-700">صلة القرابة: {person?.relation || '-'}</p>
                    <p className="text-sm text-gray-700">رقم الهاتف: {person?.phone || '-'}</p>
                    {person?.createdAt ? (
                      <p className="text-sm text-gray-700">تاريخ الإضافة: {person.createdAt}</p>
                    ) : null}
                    <div className="mt-3">
                      <Button type="button" onClick={() => handleVerify(person)}>
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
                {verificationLog.map((entry) => (
                  <p key={entry.id} className="text-sm text-gray-700">
                    {entry.personName || '-'} -{' '}
                    {entry.verifiedAt ? new Date(entry.verifiedAt).toLocaleTimeString('ar-EG') : '-'}
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
