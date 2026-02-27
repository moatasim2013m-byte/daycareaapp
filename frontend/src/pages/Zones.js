import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const response = await api.get('/zones');
      setZones(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">جاري التحميل...</div>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المناطق</h1>
        {['ADMIN', 'MANAGER'].includes(user?.role) && (
          <Button>+ إضافة منطقة</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone) => (
          <Card key={zone.zone_id}>
            <CardHeader>
              <CardTitle>{zone.zone_name_ar}</CardTitle>
              <p className="text-sm text-gray-500">{zone.zone_type}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>السعة:</strong> {zone.capacity_per_slot} طفل</p>
                <p><strong>مدة الجلسة:</strong> {zone.session_length_minutes} دقيقة</p>
                <p><strong>فترة السماح:</strong> {zone.grace_period_minutes} دقيقة</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            لا توجد مناطق حالياً
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Zones;