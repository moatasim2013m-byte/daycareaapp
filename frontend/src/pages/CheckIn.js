import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { 
  CreditCard, 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Baby,
  User,
  Phone,
  Calendar,
  FileCheck,
  LogIn,
  LogOut,
  Crown,
  Scan,
  Receipt
} from 'lucide-react';

const CheckIn = () => {
  const { user } = useAuth();
  const [cardNumber, setCardNumber] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showWaiver, setShowWaiver] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [assignSessionId, setAssignSessionId] = useState('');
  const [assignedWristband, setAssignedWristband] = useState(null);
  const [scanWristbandCode, setScanWristbandCode] = useState('');
  const [wristbandScanResult, setWristbandScanResult] = useState(null);
  const [wristbandError, setWristbandError] = useState('');
  const [wristbandLookup, setWristbandLookup] = useState(null);
  const [, setClockTick] = useState(0);
  
  // Registration form
  const [registerForm, setRegisterForm] = useState({
    child_name: '',
    child_dob: '',
    guardian_name: '',
    guardian_mobile: '',
    guardian_whatsapp: '',
    guardian_email: '',
    child_gender: '',
    child_allergies: '',
    child_notes: ''
  });

  const cardInputRef = useRef(null);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response.data);
        if (response.data.length > 0) {
          const userBranch = response.data.find(b => b.branch_id === user?.branch_id);
          setSelectedBranch(userBranch || response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, [user]);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const response = await api.get('/checkin/active', {
        params: { branch_id: selectedBranch?.branch_id }
      });
      setActiveSessions(response.data);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
    }
  }, [selectedBranch]);

  // Fetch active sessions
  useEffect(() => {
    if (selectedBranch) {
      fetchActiveSessions();
    }
  }, [selectedBranch, fetchActiveSessions]);

  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-focus on card input
  useEffect(() => {
    if (cardInputRef.current) {
      cardInputRef.current.focus();
    }
  }, []);

  // Handle card scan
  const handleScan = async () => {
    if (!cardNumber.trim() || !selectedBranch) return;
    
    setScanning(true);
    try {
      const response = await api.post('/checkin/scan', {
        card_number: cardNumber.trim(),
        branch_id: selectedBranch.branch_id
      });
      setScanResult(response.data);
      
      if (response.data.status === 'NEW_CARD') {
        setShowRegister(true);
      } else if (response.data.status === 'WAIVER_REQUIRED') {
        setShowWaiver(true);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({
        status: 'ERROR',
        message: error.response?.data?.detail || 'حدث خطأ أثناء المسح'
      });
    } finally {
      setScanning(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async (useSubscription = false) => {
    if (!scanResult?.customer || !selectedBranch) return;
    
    setLoading(true);
    try {
      await api.post(`/checkin?use_subscription=${useSubscription}`, {
        card_number: scanResult.card_number,
        branch_id: selectedBranch.branch_id
      });
      
      // Reset and refresh
      setCardNumber('');
      setScanResult(null);
      fetchActiveSessions();
      
      if (cardInputRef.current) {
        cardInputRef.current.focus();
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // Handle check-out
  const handleCheckOut = async (sessionId) => {
    setLoading(true);
    try {
      const response = await api.post(`/checkin/${sessionId}/checkout`);
      const data = response.data;

      setCheckoutResult(data);

      fetchActiveSessions();
      setScanResult(null);
      setCardNumber('');
      cardInputRef.current?.focus();
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ أثناء تسجيل الخروج');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    if (!registerForm.child_name || !registerForm.child_dob || !registerForm.guardian_name || !registerForm.guardian_mobile) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/customers', {
        card_number: cardNumber.trim(),
        child_name: registerForm.child_name,
        child_dob: registerForm.child_dob,
        child_gender: registerForm.child_gender || null,
        child_allergies: registerForm.child_allergies || null,
        child_notes: registerForm.child_notes || null,
        guardian: {
          name: registerForm.guardian_name,
          mobile: registerForm.guardian_mobile || null,
          phone: registerForm.guardian_mobile || null,
          whatsapp: registerForm.guardian_whatsapp || null,
          email: registerForm.guardian_email || null
        },
        branch_id: selectedBranch.branch_id
      });
      
      setShowRegister(false);
      setRegisterForm({ child_name: '', child_dob: '', guardian_name: '', guardian_mobile: '', guardian_whatsapp: '', guardian_email: '', child_gender: '', child_allergies: '', child_notes: '' });
      
      // Show waiver acceptance
      setScanResult({
        status: 'WAIVER_REQUIRED',
        message: 'يجب الموافقة على إقرار المسؤولية',
        card_number: cardNumber,
        customer: response.data
      });
      setShowWaiver(true);
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // Handle waiver acceptance
  const handleAcceptWaiver = async () => {
    if (!scanResult?.customer) return;
    
    setLoading(true);
    try {
      await api.post(`/customers/${scanResult.customer.customer_id}/waiver`, {
        customer_id: scanResult.customer.customer_id,
        accepted_terms: true
      });
      
      setShowWaiver(false);
      
      // Refresh scan result
      const response = await api.post('/checkin/scan', {
        card_number: cardNumber.trim(),
        branch_id: selectedBranch.branch_id
      });
      setScanResult(response.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  // Calculate age display
  const getAgeDisplay = (months) => {
    if (!months) return '';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years} سنة${remainingMonths > 0 ? ` و ${remainingMonths} شهر` : ''}`;
    }
    return `${months} شهر`;
  };

  // Format time
  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedMinutes = (checkInTime) => {
    if (!checkInTime) return 0;
    const start = new Date(checkInTime).getTime();
    if (!Number.isFinite(start)) return 0;
    return Math.max(0, Math.floor((Date.now() - start) / 60000));
  };

  const toSafeNumber = (value, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const getOvertimeEstimate = (overdueMinutes) => {
    const safeOverdue = Math.max(0, toSafeNumber(overdueMinutes));
    if (safeOverdue <= 0) return 0;
    return Math.ceil(safeOverdue / 60) * 3;
  };

  const getOverdueMeta = (session) => {
    const elapsed = toSafeNumber(session.elapsed_minutes, getElapsedMinutes(session.check_in_time));
    const included = Math.max(0, toSafeNumber(session.included_minutes, 120));
    const overdue = Math.max(0, elapsed - included);
    const overtimeAmount = toSafeNumber(session.overdue_amount, getOvertimeEstimate(overdue));
    return { elapsed, included, overdue, overtimeAmount, isOverdue: overdue > 0 };
  };

  const handleAssignWristband = async () => {
    if (!assignSessionId || !selectedBranch) return;

    setWristbandError('');
    setLoading(true);
    try {
      const selectedSession = activeSessions.find((session) => session.session_id === assignSessionId);
      const response = await api.post('/wristbands/assign', {
        session_id: assignSessionId,
        branch_id: selectedBranch.branch_id,
        child_id: selectedSession?.customer_id || null,
      });
      setAssignedWristband(response.data);
      setWristbandLookup(response.data);
      setWristbandScanResult(null);
      await fetchActiveSessions();
    } catch (error) {
      setWristbandError(error.response?.data?.detail || 'تعذر إصدار السوار');
    } finally {
      setLoading(false);
    }
  };

  const handleScanWristband = async () => {
    if (!scanWristbandCode.trim()) {
      setWristbandError('يرجى إدخال كود السوار');
      return;
    }

    setWristbandError('');
    setLoading(true);
    try {
      const lookupResponse = await api.get('/wristbands', {
        params: { code: scanWristbandCode.trim() }
      });
      setWristbandLookup(lookupResponse.data);

      if (lookupResponse.data.status === 'active') {
        setWristbandScanResult(null);
        setWristbandError('هذا السوار مفعل بالفعل');
        return;
      }

      const response = await api.post('/wristbands/scan', {
        code: scanWristbandCode.trim(),
      });
      setWristbandScanResult(response.data);
      setWristbandLookup(response.data);
      await fetchActiveSessions();
    } catch (error) {
      setWristbandScanResult(null);
      setWristbandLookup(null);
      setWristbandError(error.response?.data?.detail || 'تعذر تفعيل السوار');
    } finally {
      setLoading(false);
    }
  };

  const getSessionActivationLabel = (session) => {
    if (session?.session_active) {
      return 'نشطة';
    }
    return 'بانتظار التفعيل';
  };

  return (
    <div className="peek-page peek-role-admin" dir="rtl">
      {/* Header */}
      <div className="peek-header peek-header--admin mb-4">
        <div className="peek-shell max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 peek-card bg-playful-blue/10 flex items-center justify-center">
                <Scan className="w-6 h-6 text-playful-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h1>
                <p className="text-sm text-gray-500">{selectedBranch?.name_ar}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="peek-shell max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Scan Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scan Card */}
            <Card className="peek-card peek-role-panel-admin border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-playful-blue" />
                  مسح البطاقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    ref={cardInputRef}
                    type="text"
                    placeholder="امسح البطاقة أو أدخل الرقم..."
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                    className="flex-1 h-14 text-lg rounded-input"
                    data-testid="card-input"
                  />
                  <Button
                    onClick={handleScan}
                    disabled={scanning || !cardNumber.trim()}
                    className="h-14 px-8 rounded-button bg-playful-blue hover:bg-playful-blue/90 text-white"
                    data-testid="scan-btn"
                  >
                    {scanning ? 'جاري المسح...' : 'مسح'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scan Result */}
            {scanResult && (
              <Card className={`peek-card border-2 ${
                scanResult.status === 'READY_TO_CHECK_IN' ? 'border-playful-green' :
                scanResult.status === 'ALREADY_CHECKED_IN' ? 'border-playful-orange' :
                scanResult.status === 'ERROR' ? 'border-playful-red' :
                'border-gray-200'
              }`}>
                <CardContent className="p-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3 mb-4">
                    {scanResult.status === 'READY_TO_CHECK_IN' && (
                      <div className="flex items-center gap-2 text-playful-green">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-bold">{scanResult.message}</span>
                      </div>
                    )}
                    {scanResult.status === 'ALREADY_CHECKED_IN' && (
                      <div className="flex items-center gap-2 text-playful-orange">
                        <Clock className="w-6 h-6" />
                        <span className="font-bold">{scanResult.message}</span>
                      </div>
                    )}
                    {scanResult.status === 'NEW_CARD' && (
                      <div className="flex items-center gap-2 text-playful-blue">
                        <UserPlus className="w-6 h-6" />
                        <span className="font-bold">{scanResult.message}</span>
                      </div>
                    )}
                    {scanResult.status === 'WAIVER_REQUIRED' && (
                      <div className="flex items-center gap-2 text-playful-orange">
                        <FileCheck className="w-6 h-6" />
                        <span className="font-bold">{scanResult.message}</span>
                      </div>
                    )}
                    {scanResult.status === 'ERROR' && (
                      <div className="flex items-center gap-2 text-playful-red">
                        <AlertCircle className="w-6 h-6" />
                        <span className="font-bold">{scanResult.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  {scanResult.customer && (
                    <div className="bg-gray-50 rounded-input p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Baby className="w-5 h-5 text-gray-500" />
                        <span className="font-bold text-lg">{scanResult.customer.child_name}</span>
                        {scanResult.customer.child_age_months && (
                          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-pill">
                            {getAgeDisplay(scanResult.customer.child_age_months)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <span>{scanResult.customer.guardian?.name}</span>
                      </div>
                      {scanResult.customer.guardian?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-500" />
                          <span dir="ltr">{scanResult.customer.guardian.phone}</span>
                        </div>
                      )}
                      {scanResult.has_subscription && scanResult.subscription && (
                        <div className="flex items-center gap-3 text-primary-yellow">
                          <Crown className="w-5 h-5" />
                          <span>اشتراك نشط - متبقي {scanResult.subscription.days_remaining} يوم</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    {scanResult.status === 'READY_TO_CHECK_IN' && (
                      <>
                        {scanResult.has_subscription ? (
                          <Button
                            onClick={() => handleCheckIn(true)}
                            disabled={loading}
                            className="flex-1 h-14 rounded-button bg-primary-yellow hover:bg-primary-yellow/90 text-gray-900 font-bold"
                            data-testid="checkin-subscription-btn"
                          >
                            <Crown className="w-5 h-5 ml-2" />
                            دخول بالاشتراك
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleCheckIn(false)}
                            disabled={loading}
                            className="flex-1 h-14 rounded-button bg-playful-green hover:bg-playful-green/90 text-white font-bold"
                            data-testid="checkin-hourly-btn"
                          >
                            <LogIn className="w-5 h-5 ml-2" />
                            تسجيل دخول (بالساعة)
                          </Button>
                        )}
                      </>
                    )}
                    {scanResult.status === 'ALREADY_CHECKED_IN' && scanResult.active_session && (
                      <Button
                        onClick={() => handleCheckOut(scanResult.active_session.session_id)}
                        disabled={loading}
                        className="flex-1 h-14 rounded-button bg-playful-orange hover:bg-playful-orange/90 text-white font-bold"
                        data-testid="checkout-btn"
                      >
                        <LogOut className="w-5 h-5 ml-2" />
                        تسجيل خروج
                      </Button>
                    )}
                    {scanResult.status === 'NEW_CARD' && (
                      <Button
                        onClick={() => setShowRegister(true)}
                        className="flex-1 h-14 rounded-button bg-playful-blue hover:bg-playful-blue/90 text-white font-bold"
                        data-testid="register-btn"
                      >
                        <UserPlus className="w-5 h-5 ml-2" />
                        تسجيل عميل جديد
                      </Button>
                    )}
                    {scanResult.status === 'WAIVER_REQUIRED' && (
                      <Button
                        onClick={() => setShowWaiver(true)}
                        className="flex-1 h-14 rounded-button bg-playful-orange hover:bg-playful-orange/90 text-white font-bold"
                        data-testid="waiver-btn"
                      >
                        <FileCheck className="w-5 h-5 ml-2" />
                        الموافقة على الإقرار
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCardNumber('');
                        setScanResult(null);
                        cardInputRef.current?.focus();
                      }}
                      className="h-14 px-6 rounded-button"
                    >
                      إلغاء
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Active Sessions */}
          <div className="lg:col-span-1">
            <Card className="peek-card peek-role-panel-admin border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-playful-green" />
                    الأطفال داخل الملعب
                  </div>
                  <span className="bg-playful-green text-white text-sm px-3 py-1 rounded-pill">
                    {activeSessions.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Baby className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا يوجد أطفال حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {activeSessions.map((session) => {
                      const { elapsed, included, overdue, overtimeAmount, isOverdue } = getOverdueMeta(session);
                      return (
                      <div
                        key={session.session_id}
                        className={`rounded-input p-3 flex items-center justify-between ${isOverdue ? 'bg-playful-orange/10 border border-playful-orange/40' : 'bg-gray-50'}`}
                        data-testid={`session-${session.session_id}`}
                      >
                        <div>
                          <p className="font-bold">{session.child_name}</p>
                          <p className="text-sm text-gray-500">
                            دخول: {formatTime(session.check_in_time)}
                          </p>
                          <p className="text-xs text-gray-500">
                            الوقت المنقضي: {elapsed} دقيقة
                          </p>
                          <p className="text-xs text-gray-500">
                            الوقت المشمول: {included} دقيقة
                          </p>
                          <p className="text-xs text-gray-500">
                            الحالة: {isOverdue ? 'وقت إضافي' : 'ضمن الوقت'}
                          </p>
                          {isOverdue && (
                            <>
                              <p className="text-xs text-playful-orange font-semibold">
                                وقت إضافي {overdue} دقيقة
                              </p>
                              <p className="text-xs text-playful-orange font-semibold">
                                الرسوم الحالية: {overtimeAmount.toFixed(2)} د.أ
                              </p>
                              {session.overtime_order_number && (
                                <p className="text-xs text-gray-600">
                                  طلب الوقت الإضافي: {session.overtime_order_number}
                                </p>
                              )}
                            </>
                          )}
                          {session.payment_type === 'SUBSCRIPTION' && (
                            <span className="text-xs text-primary-yellow flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              اشتراك
                            </span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(session.session_id)}
                          className="rounded-button text-playful-orange border-playful-orange hover:bg-playful-orange hover:text-white"
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      </div>
                    )})}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="peek-card border-2 border-gray-200">
              <CardHeader>
                <CardTitle>سوار QR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>إصدار سوار للجلسة</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={assignSessionId}
                  onChange={(event) => setAssignSessionId(event.target.value)}
                >
                  <option value="">اختر جلسة نشطة</option>
                  {activeSessions.map((session) => (
                    <option key={session.session_id} value={session.session_id}>
                      {session.child_name || session.customer_id} - {session.session_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
                <Button onClick={handleAssignWristband} disabled={loading || !assignSessionId} className="w-full">
                  تعيين سوار
                </Button>

                {assignedWristband && (
                  <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                    <p className="text-sm">الكود: <strong>{assignedWristband.code}</strong></p>
                    <p className="text-xs text-gray-600">الحالة: {assignedWristband.status || 'issued'}</p>
                    <img src={assignedWristband.qr_code_url} alt="Wristband QR" className="w-40 h-40 mx-auto" />
                  </div>
                )}

                {wristbandError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {wristbandError}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="peek-card border-2 border-gray-200">
              <CardHeader>
                <CardTitle>تفعيل الجلسة عبر السوار</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="text"
                  placeholder="امسح كود السوار"
                  value={scanWristbandCode}
                  onChange={(event) => setScanWristbandCode(event.target.value)}
                />
                <Button onClick={handleScanWristband} disabled={loading || !scanWristbandCode.trim()} className="w-full">
                  تفعيل السوار
                </Button>

                {wristbandLookup && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
                    <p>الجلسة: <strong>{wristbandLookup.session_id || '-'}</strong></p>
                    <p>حالة السوار: <strong>{wristbandLookup.status || '-'}</strong></p>
                    <p>وقت التفعيل: <strong>{wristbandLookup.activated_at ? formatTime(wristbandLookup.activated_at) : 'غير مفعل'}</strong></p>
                  </div>
                )}

                {wristbandScanResult && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
                    <p>تم تفعيل الجلسة بنجاح</p>
                    <p>الجلسة: {wristbandScanResult.session_id}</p>
                    <p>الحالة: {wristbandScanResult.status}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(checkoutResult)} onOpenChange={(open) => !open && setCheckoutResult(null)}>
        <DialogContent className="rounded-modal max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Receipt className="w-6 h-6 text-playful-green" />
              ملخص تسجيل الخروج
            </DialogTitle>
          </DialogHeader>

          {checkoutResult && (
            <div className="space-y-3 py-2">
              <div className="bg-gray-50 rounded-input p-3 text-sm space-y-1">
                <p>الحالة: <strong>{checkoutResult.status === 'OVERDUE' ? 'متأخر' : 'تم تسجيل الخروج'}</strong></p>
                <p>المدة: <strong>{toSafeNumber(checkoutResult.duration_minutes)} دقيقة</strong></p>
                <p>الوقت المشمول: <strong>{toSafeNumber(checkoutResult.included_minutes)} دقيقة</strong></p>
                <p>الوقت الإضافي: <strong>{toSafeNumber(checkoutResult.overdue_minutes)} دقيقة</strong></p>
              </div>

              {toSafeNumber(checkoutResult.overdue_amount) > 0 ? (
                <div className="bg-playful-orange/10 border border-playful-orange/30 rounded-input p-3 text-sm space-y-1">
                  <p className="font-bold text-playful-orange">رسوم الوقت الإضافي: {toSafeNumber(checkoutResult.overdue_amount).toFixed(2)} د.أ</p>
                  {checkoutResult.overtime_order_number && (
                    <p>رقم الطلب: <strong>{checkoutResult.overtime_order_number}</strong></p>
                  )}
                  {checkoutResult.overtime_order_id && (
                    <p className="text-xs text-gray-600">معرّف الطلب: {checkoutResult.overtime_order_id}</p>
                  )}
                </div>
              ) : (
                <div className="bg-playful-green/10 border border-playful-green/30 rounded-input p-3 text-sm">
                  لا توجد رسوم إضافية.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setCheckoutResult(null)}
              className="w-full rounded-button bg-playful-blue hover:bg-playful-blue/90 text-white"
            >
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="rounded-modal max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="w-6 h-6 text-playful-blue" />
              تسجيل عميل جديد
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-playful-blue/10 rounded-input p-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-playful-blue" />
              <span>رقم البطاقة: <strong>{cardNumber}</strong></span>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>اسم الطفل *</Label>
                <Input
                  value={registerForm.child_name}
                  onChange={(e) => setRegisterForm({...registerForm, child_name: e.target.value})}
                  placeholder="أدخل اسم الطفل"
                  className="mt-1 rounded-input"
                  data-testid="child-name-input"
                />
              </div>
              
              <div>
                <Label>تاريخ الميلاد *</Label>
                <Input
                  type="date"
                  value={registerForm.child_dob}
                  onChange={(e) => setRegisterForm({...registerForm, child_dob: e.target.value})}
                  className="mt-1 rounded-input"
                  data-testid="child-dob-input"
                />
                <p className="text-xs text-gray-500 mt-1">يجب أن يكون عمر الطفل 4 سنوات أو أقل</p>
              </div>
              
              <div>
                <Label>اسم ولي الأمر *</Label>
                <Input
                  value={registerForm.guardian_name}
                  onChange={(e) => setRegisterForm({...registerForm, guardian_name: e.target.value})}
                  placeholder="أدخل اسم ولي الأمر"
                  className="mt-1 rounded-input"
                  data-testid="guardian-name-input"
                />
              </div>
              
              <div>
                <Label>جنس الطفل (اختياري)</Label>
                <Input
                  value={registerForm.child_gender}
                  onChange={(e) => setRegisterForm({...registerForm, child_gender: e.target.value})}
                  placeholder="ذكر / أنثى"
                  className="mt-1 rounded-input"
                  data-testid="child-gender-input"
                />
              </div>

              <div>
                <Label>رقم الجوال *</Label>
                <Input
                  type="tel"
                  value={registerForm.guardian_mobile}
                  onChange={(e) => setRegisterForm({...registerForm, guardian_mobile: e.target.value})}
                  placeholder="+962..."
                  className="mt-1 rounded-input"
                  dir="ltr"
                  data-testid="guardian-mobile-input"
                />
              </div>

              <div>
                <Label>واتساب (اختياري)</Label>
                <Input
                  type="tel"
                  value={registerForm.guardian_whatsapp}
                  onChange={(e) => setRegisterForm({...registerForm, guardian_whatsapp: e.target.value})}
                  placeholder="+962..."
                  className="mt-1 rounded-input"
                  dir="ltr"
                  data-testid="guardian-whatsapp-input"
                />
              </div>

              <div>
                <Label>البريد الإلكتروني (اختياري)</Label>
                <Input
                  type="email"
                  value={registerForm.guardian_email}
                  onChange={(e) => setRegisterForm({...registerForm, guardian_email: e.target.value})}
                  placeholder="example@email.com"
                  className="mt-1 rounded-input"
                  dir="ltr"
                  data-testid="guardian-email-input"
                />
              </div>

              <div>
                <Label>الحساسية (اختياري)</Label>
                <Input
                  value={registerForm.child_allergies}
                  onChange={(e) => setRegisterForm({...registerForm, child_allergies: e.target.value})}
                  placeholder="مثال: حساسية من المكسرات"
                  className="mt-1 rounded-input"
                  data-testid="child-allergies-input"
                />
              </div>

              <div>
                <Label>ملاحظات (اختياري)</Label>
                <Input
                  value={registerForm.child_notes}
                  onChange={(e) => setRegisterForm({...registerForm, child_notes: e.target.value})}
                  placeholder="ملاحظات إضافية عن الطفل"
                  className="mt-1 rounded-input"
                  data-testid="child-notes-input"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRegister(false)}
              className="flex-1 rounded-button"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleRegister}
              disabled={loading}
              className="flex-1 rounded-button bg-playful-blue hover:bg-playful-blue/90 text-white"
              data-testid="submit-register-btn"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waiver Dialog */}
      <Dialog open={showWaiver} onOpenChange={setShowWaiver}>
        <DialogContent className="rounded-modal max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileCheck className="w-6 h-6 text-playful-orange" />
              إقرار المسؤولية
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-input p-4 max-h-60 overflow-y-auto text-sm leading-relaxed">
              <p className="font-bold mb-2">أقر أنا ولي أمر الطفل بالآتي:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>أن طفلي بصحة جيدة ولا يعاني من أي أمراض معدية</li>
                <li>أتحمل المسؤولية الكاملة عن سلامة طفلي أثناء اللعب</li>
                <li>أوافق على التزام طفلي بقواعد السلامة في منطقة اللعب</li>
                <li>أفهم أن الإدارة غير مسؤولة عن أي إصابات ناتجة عن عدم الالتزام بالقواعد</li>
                <li>أوافق على التصوير لأغراض المراقبة والأمان</li>
              </ul>
            </div>
            
            {scanResult?.customer && (
              <div className="bg-playful-blue/10 rounded-input p-3">
                <p><strong>الطفل:</strong> {scanResult.customer.child_name}</p>
                <p><strong>ولي الأمر:</strong> {scanResult.customer.guardian?.name}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWaiver(false)}
              className="flex-1 rounded-button"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAcceptWaiver}
              disabled={loading}
              className="flex-1 rounded-button bg-playful-green hover:bg-playful-green/90 text-white"
              data-testid="accept-waiver-btn"
            >
              {loading ? 'جاري الحفظ...' : 'أوافق على الشروط'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckIn;
