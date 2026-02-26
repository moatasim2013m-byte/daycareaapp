import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">جاري التحميل...</div>;

  const roleNames = {
    ADMIN: 'مدير النظام',
    MANAGER: 'مدير الفرع',
    CASHIER: 'أمين الصندوق',
    RECEPTION: 'موظف الاستقبال',
    STAFF: 'موظف',
    PARENT: 'ولي أمر'
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المستخدمون</h1>
        {['ADMIN', 'MANAGER'].includes(user?.role) && (
          <Button>+ إضافة مستخدم</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الاسم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">البريد</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الدور</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{u.name}</td>
                    <td className="px-6 py-4" dir="ltr">{u.email}</td>
                    <td className="px-6 py-4">{roleNames[u.role] || u.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                      }`}>
                        {u.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;