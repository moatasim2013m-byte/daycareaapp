import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Baby, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isRegister) {
        await register({
          email,
          password,
          display_name: displayName,
          phone: phone || null,
          role: 'PARENT'
        });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md rounded-2xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Baby className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </CardTitle>
          <p className="text-gray-500 text-sm mt-1">
            نظام إدارة الحضانة
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <Label htmlFor="displayName">الاسم الكامل</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="أدخل اسمك"
                    required
                    className="mt-1"
                    data-testid="display-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+962..."
                    className="mt-1"
                    dir="ltr"
                    data-testid="phone-input"
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="mt-1"
                dir="ltr"
                data-testid="email-input"
              />
            </div>
            
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
                data-testid="password-input"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl"
              data-testid="submit-btn"
            >
              {loading ? (
                'جاري التحميل...'
              ) : isRegister ? (
                <>
                  <UserPlus className="w-5 h-5 ml-2" />
                  إنشاء حساب
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 ml-2" />
                  دخول
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isRegister ? 'لديك حساب؟ سجل دخولك' : 'ليس لديك حساب؟ سجل الآن'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
