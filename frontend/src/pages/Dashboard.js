import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">لوحة التحكم</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>مرحباً، {user?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>البريد الإلكتروني:</strong> {user?.email}</p>
            <p><strong>الدور:</strong> {user?.role}</p>
            <p><strong>اللغة المفضلة:</strong> {user?.preferred_language}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الفروع</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">-</p>
            <p className="text-sm text-gray-500">سيتم عرضها قريباً</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المناطق</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">-</p>
            <p className="text-sm text-gray-500">سيتم عرضها قريباً</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الحجوزات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">-</p>
            <p className="text-sm text-gray-500">سيتم عرضها قريباً</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;