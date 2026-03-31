import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import api from '../services/api';
import {
  BookOpen, Sparkles, Loader2, Globe, Clock,
  Users, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';

const AGE_GROUPS = [
  { value: '0-1 سنة', label: '0-1 سنة (رضع)' },
  { value: '1-2 سنة', label: '1-2 سنة (مشاة)' },
  { value: '2-3 سنوات', label: '2-3 سنوات' },
  { value: '3-4 سنوات', label: '3-4 سنوات (ما قبل الروضة)' },
  { value: '4-5 سنوات', label: '4-5 سنوات (روضة)' },
  { value: '5-6 سنوات', label: '5-6 سنوات (تمهيدي)' },
];

const TeacherLessonPlanner = () => {
  const [topic, setTopic] = useState('');
  const [ageGroup, setAgeGroup] = useState('3-4 سنوات');
  const [duration, setDuration] = useState('30');
  const [objectives, setObjectives] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [lessons, setLessons] = useState([]);
  const [showEnglish, setShowEnglish] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState(null);

  const fetchLessons = async () => {
    try {
      const res = await api.get('/learning/lessons');
      setLessons(Array.isArray(res.data) ? res.data : []);
    } catch { setLessons([]); }
  };

  useEffect(() => { fetchLessons(); }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('الرجاء إدخال موضوع الدرس.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/learning/lessons', {
        topic: topic.trim(),
        age_group: ageGroup,
        duration_minutes: parseInt(duration) || 30,
        objectives: objectives.trim(),
      });
      setResult(res.data);
      setTopic('');
      setObjectives('');
      fetchLessons();
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء إنشاء الخطة.');
    }
    setLoading(false);
  };

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مخطط الدروس بالذكاء الاصطناعي</h1>
              <p className="text-gray-600 text-sm">أدخلي الموضوع والفئة العمرية وسيتم إنشاء خطة درس كاملة بالعربية والإنجليزية</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              إنشاء خطة درس جديدة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>موضوع الدرس</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثال: الألوان والأشكال، الحيوانات، الأرقام..." />
              </div>
              <div className="space-y-2">
                <Label>الفئة العمرية</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
                  {AGE_GROUPS.map((ag) => <option key={ag.value} value={ag.value}>{ag.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>المدة (دقيقة)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="10" max="120" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>أهداف تعليمية (اختياري)</Label>
                <Textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="مثال: أن يتعرف الطفل على 5 ألوان أساسية..." rows={2} />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="bg-indigo-500 text-white hover:bg-indigo-600">
              {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري إنشاء الخطة...</> : <><Sparkles className="w-4 h-4 ml-2" />إنشاء بالذكاء الاصطناعي</>}
            </Button>
          </CardContent>
        </Card>

        {/* Generated result */}
        {result && (
          <Card className="peek-card border-indigo-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  تم إنشاء خطة الدرس
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowEnglish(false)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${!showEnglish ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>عربي</button>
                  <button onClick={() => setShowEnglish(true)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${showEnglish ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>English</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">{result.topic}</Badge>
                <Badge variant="secondary"><Users className="w-3 h-3 ml-1" />{result.age_group}</Badge>
                <Badge variant="secondary"><Clock className="w-3 h-3 ml-1" />{result.duration_minutes} دقيقة</Badge>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-medium text-indigo-600">{showEnglish ? 'English Plan' : 'الخطة بالعربية'}</span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" dir={showEnglish ? 'ltr' : 'rtl'}>
                  {showEnglish ? result.plan_en : result.plan_ar}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent lessons */}
        {lessons.length > 0 && (
          <Card className="peek-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                خطط الدروس السابقة
                <Badge variant="secondary" className="text-xs">{lessons.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lessons.map((lesson) => {
                const isExpanded = expandedLesson === lesson.lesson_id;
                return (
                  <div key={lesson.lesson_id} className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                    <button onClick={() => setExpandedLesson(isExpanded ? null : lesson.lesson_id)} className="w-full p-3 flex items-center justify-between text-right">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{lesson.topic}</p>
                          <p className="text-xs text-gray-500">{lesson.age_group} • {lesson.duration_minutes} دقيقة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(lesson.created_at).toLocaleDateString('ar-JO', { month: 'short', day: 'numeric' })}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-3 bg-indigo-50/30">
                        <div className="flex items-center justify-end gap-1 mb-2">
                          <button onClick={() => setShowEnglish(false)} className={`px-2 py-0.5 rounded text-xs font-semibold ${!showEnglish ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>عربي</button>
                          <button onClick={() => setShowEnglish(true)} className={`px-2 py-0.5 rounded text-xs font-semibold ${showEnglish ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>EN</button>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" dir={showEnglish ? 'ltr' : 'rtl'}>
                          {showEnglish ? lesson.plan_en : lesson.plan_ar}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherLessonPlanner;
