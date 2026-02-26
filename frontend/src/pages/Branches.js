import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    address: '',
    city: '',
    phone: '',
    email: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/branches', formData);
      setShowForm(false);
      setFormData({
        name: '',
        name_ar: '',
        address: '',
        city: '',
        phone: '',
        email: '',
      });
      fetchBranches();
    } catch (error) {
      alert('Error creating branch: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return <div className="p-6 text-center">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الفروع</h1>
        {user?.role === 'ADMIN' && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'إلغاء' : '+ إضافة فرع جديد'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>فرع جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم (English)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (العربية)</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    dir="ltr"
                  />
                </div>
              </div>
              <Button type="submit">حفظ</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <Card key={branch.branch_id}>
            <CardHeader>
              <CardTitle>{branch.name_ar}</CardTitle>
              <p className="text-sm text-gray-500">{branch.name}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>المدينة:</strong> {branch.city}</p>
                <p><strong>العنوان:</strong> {branch.address}</p>
                <p><strong>الهاتف:</strong> {branch.phone}</p>
                <p><strong>البريد:</strong> {branch.email}</p>
                <div className={`inline-block px-2 py-1 rounded text-xs ${
                  branch.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {branch.status === 'active' ? 'نشط' : 'غير نشط'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {branches.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            لا توجد فروع حالياً
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Branches;
