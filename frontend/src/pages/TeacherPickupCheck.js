import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const today = () => new Date().toISOString().slice(0, 10);

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

  const dateKey = today();
  const pickupsKey = useMemo(() => `authorizedPickups:${childId}`, [childId]);
  const checksKey = useMemo(() => `pickupChecks:${childId}:${dateKey}`, [childId, dateKey]);

  useEffect(() => {
    setPickups(readArray(pickupsKey));
  }, [pickupsKey]);

  useEffect(() => {
    const entries = readArray(checksKey).sort(
      (a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
    );
    setVerificationLog(entries);
  }, [checksKey]);

  const filteredPickups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pickups;

    return pickups.filter((item) => {
      const name = String(item?.name || '').toLowerCase();
      const phone = String(item?.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [pickups, search]);

  const handleVerify = (person) => {
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childId: String(childId),
      personName: person?.name || '',
      relation: person?.relation || '',
      phone: person?.phone || '',
      verifiedAt: new Date().toISOString(),
    };

    const nextLog = [event, ...verificationLog];
    localStorage.setItem(checksKey, JSON.stringify(nextLog));
    setVerificationLog(nextLog);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التحقق من الاستلام</h1>
            <p className="text-gray-600 mt-1">التحقق من الأشخاص المخولين لاستلام الطفل</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="pickup-check-search">بحث بالاسم أو الهاتف</Label>
              <Input
                id="pickup-check-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث هنا"
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
                {filteredPickups.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">الاسم: {item.name}</p>
                        <p className="text-sm text-gray-700">صلة القرابة: {item.relation || '-'}</p>
                        <p className="text-sm text-gray-700">رقم الهاتف: {item.phone}</p>
                        {item.createdAt && (
                          <p className="text-xs text-gray-500">
                            أضيف في: {new Date(item.createdAt).toLocaleTimeString('ar-JO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                      <Button type="button" onClick={() => handleVerify(item)}>تم التحقق</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل التحقق اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            {verificationLog.length === 0 ? (
              <p className="text-gray-500">لا توجد عمليات تحقق اليوم</p>
            ) : (
              <div className="space-y-2">
                {verificationLog.map((log) => (
                  <div key={log.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="font-medium text-gray-900">{log.personName}</p>
                    <p className="text-xs text-gray-500">
                      {log.verifiedAt
                        ? new Date(log.verifiedAt).toLocaleTimeString('ar-JO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '--:--'}
                    </p>
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
