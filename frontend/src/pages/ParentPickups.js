import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { resolveCachedChildContext } from '../utils/childContext';
import {
  Shield, UserCheck, Phone, Mail, MessageSquare,
  AlertTriangle, Info
} from 'lucide-react';

const ParentPickups = () => {
  const [childId, setChildId] = useState('1');

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) setChildId(context.childId);
  }, []);

  const authorizedPickups = useMemo(() => {
    const stored = localStorage.getItem(`authorizedPickups:${childId}`);
    if (!stored) return [];
    try { return JSON.parse(stored); } catch { return []; }
  }, [childId]);

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-3xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--parent">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">خطة الاستلام الآمن</h1>
              <p className="text-gray-600 text-sm">إدارة الأشخاص المخولين باستلام طفلك من الحضانة</p>
            </div>
          </div>
        </div>

        {/* Safety info banner */}
        <Card className="peek-card border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-800">كيف يعمل نظام الاستلام الآمن؟</p>
                <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                  يُسمح فقط للأشخاص المسجلين أدناه باستلام طفلك. يتم التحقق من الهوية عند الاستلام.
                  لتعديل القائمة أو إضافة أشخاص جدد، تواصل مع إدارة الحضانة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authorized persons list */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-500" />
                المخولون بالاستلام
                {authorizedPickups.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold">
                    {authorizedPickups.length}
                  </span>
                )}
              </CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link to="/parent/messages">
                  <MessageSquare className="w-3.5 h-3.5 ml-1" />
                  تعديل القائمة
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {authorizedPickups.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-lg font-semibold text-gray-700 mb-1">لا يوجد مخولون مسجلون</p>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-4">
                  يجب تسجيل شخص واحد على الأقل كمخول باستلام طفلك. تواصل مع إدارة الحضانة لإضافة المخولين.
                </p>
                <Button asChild size="sm">
                  <Link to="/parent/messages">
                    <MessageSquare className="w-3.5 h-3.5 ml-1" />
                    مراسلة الحضانة لإضافة مخولين
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {authorizedPickups.map((pickup, index) => (
                  <div key={pickup.id || index} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{pickup.name || 'غير محدد'}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        {pickup.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span dir="ltr">{pickup.phone}</span>
                          </span>
                        )}
                        {pickup.email && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span dir="ltr">{pickup.email}</span>
                          </span>
                        )}
                        {pickup.relation && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {pickup.relation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick tips */}
        <Card className="peek-card border-dashed border-gray-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-2">نصائح مهمة</p>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                تأكد من تحديث أرقام الهواتف باستمرار لسهولة التواصل عند الاستلام.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                أبلغ الحضانة مسبقاً إذا كان شخص مختلف سيستلم طفلك في يوم معين.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                لإضافة أو حذف مخولين، استخدم صفحة الرسائل للتواصل مع الإدارة.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentPickups;
