import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { readCachedChildContexts, resolveCachedChildContext } from '../utils/childContext';
import {
  Shield, UserCheck, Search, Clock, CheckCircle2,
  AlertTriangle, Phone, Users
} from 'lucide-react';

const getToday = () => new Date().toISOString().slice(0, 10);

const readArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const TeacherPickupCheck = () => {
  const [childId, setChildId] = useState('1');
  const [search, setSearch] = useState('');
  const [pickups, setPickups] = useState([]);
  const [verificationLog, setVerificationLog] = useState([]);

  const children = readCachedChildContexts();
  const childList = children.length > 0
    ? children.map((c) => ({ id: c.childId, name: c.childName }))
    : [1, 2, 3, 4, 5].map((n) => ({ id: String(n), name: `الطفل ${n}` }));

  const normalizedChildId = useMemo(() => {
    const trimmed = String(childId ?? '').trim();
    return trimmed || '1';
  }, [childId]);

  const pickupsKey = useMemo(() => `authorizedPickups:${normalizedChildId}`, [normalizedChildId]);
  const checksKey = useMemo(() => `pickupChecks:${normalizedChildId}:${getToday()}`, [normalizedChildId]);

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) setChildId(context.childId);
  }, []);

  useEffect(() => { setPickups(readArray(pickupsKey)); }, [pickupsKey]);
  useEffect(() => {
    const sortedChecks = readArray(checksKey).sort(
      (a, b) => new Date(b?.verifiedAt || 0).getTime() - new Date(a?.verifiedAt || 0).getTime()
    );
    setVerificationLog(sortedChecks);
  }, [checksKey]);

  const filteredPickups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pickups;
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

  const selectedChild = childList.find((c) => c.id === childId);

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-5xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">التحقق من الاستلام</h1>
              <p className="text-gray-600 text-sm">تأكدي من هوية المستلم قبل تسليم الطفل — السلامة أولاً</p>
            </div>
          </div>
        </div>

        {/* Child picker */}
        <Card className="peek-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">اختر الطفل</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {childList.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setChildId(child.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    childId === child.id
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="peek-card">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو رقم الهاتف..."
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Authorized persons */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-violet-500" />
                المخولون باستلام {selectedChild?.name || `الطفل #${childId}`}
              </CardTitle>
              {filteredPickups.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold">{filteredPickups.length}</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredPickups.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">لا يوجد مخولون مسجلون لهذا الطفل</p>
                <p className="text-xs text-gray-500 mt-1">يجب أن يقوم ولي الأمر أو الإدارة بتسجيل المخولين أولاً.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPickups.map((item, index) => (
                  <div key={item.id || `${item.name || 'person'}-${index}`} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{item.name || 'غير محدد'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {item.relation && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.relation}</span>}
                        {item.phone && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" /><span dir="ltr">{item.phone}</span></span>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleVerify(item)}
                      className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs px-3"
                      size="sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                      تحقق
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification log */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              سجل التحقق اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationLog.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
                <Clock className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-600">لا توجد عمليات تحقق اليوم</p>
                  <p className="text-xs text-gray-400 mt-0.5">عند التحقق من مستلم سيظهر التوقيت هنا.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {verificationLog.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">{item.personName || 'غير محدد'}</span>
                      {item.relation && <span className="text-xs text-gray-500 mr-2">({item.relation})</span>}
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {item.verifiedAt ? new Date(item.verifiedAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
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
