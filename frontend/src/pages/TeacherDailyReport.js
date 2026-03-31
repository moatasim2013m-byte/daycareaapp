import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { readCachedChildContexts, resolveCachedChildContext } from '../utils/childContext';
import api from '../services/api';
import {
  Sparkles, FileText, Camera, Users, Send,
  Loader2, CheckCircle2, AlertTriangle, Globe
} from 'lucide-react';

const TeacherDailyReport = () => {
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [recentReports, setRecentReports] = useState([]);
  const [showAr, setShowAr] = useState(true);

  const children = readCachedChildContexts();
  const childList = children.length > 0
    ? children.map((c) => ({ id: c.childId, name: c.childName }))
    : [1, 2, 3, 4, 5].map((n) => ({ id: String(n), name: `الطفل ${n}` }));

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) {
      setChildId(context.childId);
      setChildName(context.childName || '');
    } else if (childList.length > 0) {
      setChildId(childList[0].id);
      setChildName(childList[0].name);
    }
  }, []);

  useEffect(() => {
    if (!childId) return;
    const fetchReports = async () => {
      try {
        const res = await api.get(`/daily-reports/child/${childId}`);
        setRecentReports(Array.isArray(res.data) ? res.data.slice(0, 5) : []);
      } catch { setRecentReports([]); }
    };
    fetchReports();
  }, [childId, result]);

  const handleChildSelect = (child) => {
    setChildId(child.id);
    setChildName(child.name);
    setResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!notes.trim()) { setError('الرجاء إدخال ملاحظات عن يوم الطفل.'); return; }
    if (!childId) { setError('الرجاء اختيار الطفل.'); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await api.post('/daily-reports', {
        child_id: childId,
        child_name: childName,
        notes: notes.trim(),
        photo_url: photoUrl.trim() || null,
      });
      setResult(res.data);
      setNotes('');
      setPhotoUrl('');
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء إنشاء التقرير. حاولي مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">تقرير يومي بالذكاء الاصطناعي</h1>
              <p className="text-gray-600 text-sm">اكتبي ملاحظاتك وسيتم إنشاء تقرير جميل لولي الأمر بالعربية والإنجليزية</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            يتم إنشاء التقرير تلقائياً وإرساله لخلاصة ولي الأمر
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
                  onClick={() => handleChildSelect(child)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    childId === child.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes form */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              ملاحظات المعلمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ماذا فعل الطفل اليوم؟</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: الطفل كان سعيداً جداً اليوم. أكل فطوره كاملاً. لعب مع أصدقائه في الحديقة. رسم لوحة جميلة..."
                rows={4}
              />
              <p className="text-xs text-gray-400">اكتبي ملاحظاتك بشكل طبيعي — الذكاء الاصطناعي سيحولها لتقرير مرتب وجميل</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-gray-400" />
                رابط صورة (اختياري)
              </Label>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading || !notes.trim()}
              className="bg-purple-500 text-white hover:bg-purple-600 w-full sm:w-auto"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري إنشاء التقرير...</>
              ) : (
                <><Sparkles className="w-4 h-4 ml-2" />إنشاء التقرير بالذكاء الاصطناعي</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated result */}
        {result && (
          <Card className="peek-card border-purple-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  تم إنشاء التقرير بنجاح
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowAr(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${showAr ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    عربي
                  </button>
                  <button
                    onClick={() => setShowAr(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${!showAr ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    English
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.photo_url && (
                <img
                  src={result.photo_url}
                  alt="صورة النشاط"
                  className="w-full max-h-48 object-cover rounded-xl mb-3 border border-gray-200"
                />
              )}
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-purple-600">{showAr ? 'التقرير بالعربية' : 'English Report'}</span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" dir={showAr ? 'rtl' : 'ltr'}>
                  {showAr ? result.report_ar : result.report_en}
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                تم إرسال التقرير تلقائياً لخلاصة ولي الأمر
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent reports */}
        {recentReports.length > 0 && (
          <Card className="peek-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                آخر التقارير لهذا الطفل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentReports.map((report) => (
                <div key={report.report_id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      {new Date(report.created_at).toLocaleDateString('ar-JO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 ml-1" />
                      AI
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{report.report_ar}</p>
                  {report.photo_url && (
                    <img src={report.photo_url} alt="" className="mt-2 h-16 w-24 rounded-lg object-cover border border-gray-200" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherDailyReport;
