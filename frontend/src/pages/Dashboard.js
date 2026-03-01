import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Users, Clock, DollarSign, Calendar, 
  TrendingUp, Baby, CreditCard, Activity 
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch daily summary for staff
        if (['ADMIN', 'RECEPTION', 'STAFF'].includes(user?.role)) {
          const [summaryRes, sessionsRes] = await Promise.all([
            api.get('/reports/daily-summary'),
            api.get('/sessions/active')
          ]);
          setStats(summaryRes.data);
          setActiveSessions(sessionsRes.data);
        } else {
          // Parent dashboard - fetch their children
          const childrenRes = await api.get('/children');
          setStats({ children: childrenRes.data });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh active sessions every 30 seconds for staff
    if (['ADMIN', 'RECEPTION', 'STAFF'].includes(user?.role)) {
      const interval = setInterval(async () => {
        try {
          const res = await api.get('/sessions/active');
          setActiveSessions(res.data);
        } catch (e) {}
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Staff Dashboard
  if (['ADMIN', 'RECEPTION', 'STAFF'].includes(user?.role)) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-500">مرحباً {user?.display_name}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/guides/parent-communication-step-4">دليل التواصل مع أولياء الأمور</Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">الجلسات النشطة</p>
                  <p className="text-3xl font-bold mt-1">{activeSessions.length}</p>
                </div>
                <Activity className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">إيرادات اليوم</p>
                  <p className="text-3xl font-bold mt-1">{stats?.revenue?.total || 0} د.أ</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">جلسات اليوم</p>
                  <p className="text-3xl font-bold mt-1">{stats?.sessions?.total || 0}</p>
                </div>
                <Clock className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">رسوم الوقت الإضافي</p>
                  <p className="text-3xl font-bold mt-1">{stats?.revenue?.overtime || 0} د.أ</p>
                </div>
                <TrendingUp className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-blue-500" />
              الأطفال داخل الحضانة ({activeSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Baby className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا يوجد أطفال حالياً</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="pb-3 font-medium text-gray-500">الطفل</th>
                      <th className="pb-3 font-medium text-gray-500">ولي الأمر</th>
                      <th className="pb-3 font-medium text-gray-500">المنطقة</th>
                      <th className="pb-3 font-medium text-gray-500">وقت الدخول</th>
                      <th className="pb-3 font-medium text-gray-500">المتبقي</th>
                      <th className="pb-3 font-medium text-gray-500">النوع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.map((session) => (
                      <tr key={session.session_id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{session.child_name}</td>
                        <td className="py-3 text-gray-600">{session.guardian_name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.area === 'DAYCARE' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {session.area === 'DAYCARE' ? 'الحضانة' : 'الرمل'}
                          </span>
                        </td>
                        <td className="py-3">{formatTime(session.checkin_at)}</td>
                        <td className="py-3">
                          {session.is_overdue ? (
                            <span className="text-red-500 font-bold">متأخر</span>
                          ) : (
                            <span className={session.time_remaining_minutes < 30 ? 'text-orange-500' : ''}>
                              {session.time_remaining_minutes} دقيقة
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            session.session_type === 'SUBSCRIPTION' 
                              ? 'bg-purple-100 text-purple-700'
                              : session.session_type === 'VISIT_PACK'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {session.session_type === 'SUBSCRIPTION' ? 'اشتراك' :
                             session.session_type === 'VISIT_PACK' ? 'باقة زيارات' : 'بالساعة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">تفاصيل الإيرادات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">دخول بالساعة</span>
                <span className="font-medium">{stats?.revenue?.walk_in || 0} د.أ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الاشتراكات</span>
                <span className="font-medium">{stats?.revenue?.subscriptions || 0} د.أ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">باقات الزيارات</span>
                <span className="font-medium">{stats?.revenue?.visit_packs || 0} د.أ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">الوقت الإضافي</span>
                <span className="font-medium">{stats?.revenue?.overtime || 0} د.أ</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>الإجمالي</span>
                <span className="text-green-600">{stats?.revenue?.total || 0} د.أ</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المبيعات اليوم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">اشتراك شهري شامل</span>
                <span className="font-medium">{stats?.sales?.subscriptions?.by_plan?.MONTHLY_ALL_ACCESS || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">نصف يوم صباحي</span>
                <span className="font-medium">{stats?.sales?.subscriptions?.by_plan?.HALF_DAY_MORNING || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">نصف يوم مسائي</span>
                <span className="font-medium">{stats?.sales?.subscriptions?.by_plan?.HALF_DAY_EVENING || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">باقات زيارات</span>
                <span className="font-medium">{stats?.sales?.visit_packs || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Parent Dashboard
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مرحباً {user?.display_name}</h1>
        <p className="text-gray-500">لوحة تحكم ولي الأمر</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-blue-500" />
              أطفالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.children?.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">لم تقم بإضافة أطفال بعد</p>
                <Button variant="outline">إضافة طفل</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.children?.map((child) => (
                  <div key={child.child_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{child.full_name}</p>
                      <p className="text-sm text-gray-500">{child.age_years} سنوات</p>
                    </div>
                    <Button variant="outline" size="sm">عرض</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-500" />
              الباقات والاشتراكات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">شراء اشتراك أو باقة زيارات</p>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                تصفح الباقات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
