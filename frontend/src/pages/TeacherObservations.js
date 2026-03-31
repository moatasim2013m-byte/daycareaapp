import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { readCachedChildContexts, resolveCachedChildContext } from '../utils/childContext';
import api from '../services/api';
import {
  Eye, Users, Star, Brain, HeartHandshake, Footprints,
  MessageCircle, Smile, Loader2, CheckCircle2, Award
} from 'lucide-react';

const CATEGORIES = [
  { value: 'social', label: 'اجتماعي', icon: HeartHandshake, color: 'text-rose-500', bg: 'bg-rose-50' },
  { value: 'cognitive', label: 'إدراكي', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { value: 'physical', label: 'حركي', icon: Footprints, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { value: 'language', label: 'لغوي', icon: MessageCircle, color: 'text-sky-500', bg: 'bg-sky-50' },
  { value: 'emotional', label: 'عاطفي', icon: Smile, color: 'text-amber-500', bg: 'bg-amber-50' },
  { value: 'general', label: 'عام', icon: Eye, color: 'text-gray-500', bg: 'bg-gray-50' },
];

const CATEGORY_MAP = {};
CATEGORIES.forEach((c) => { CATEGORY_MAP[c.value] = c; });

const TeacherObservations = () => {
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');
  const [category, setCategory] = useState('general');
  const [notes, setNotes] = useState('');
  const [milestone, setMilestone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [observations, setObservations] = useState([]);

  const children = readCachedChildContexts();
  const childList = children.length > 0
    ? children.map((c) => ({ id: c.childId, name: c.childName }))
    : [1, 2, 3, 4, 5].map((n) => ({ id: String(n), name: `الطفل ${n}` }));

  useEffect(() => {
    const ctx = resolveCachedChildContext();
    if (ctx?.childId) { setChildId(ctx.childId); setChildName(ctx.childName || ''); }
    else if (childList.length > 0) { setChildId(childList[0].id); setChildName(childList[0].name); }
  }, []);

  const fetchObservations = async (cid) => {
    if (!cid) return;
    try {
      const res = await api.get(`/learning/observations/child/${cid}`);
      setObservations(Array.isArray(res.data) ? res.data : []);
    } catch { setObservations([]); }
  };

  useEffect(() => { fetchObservations(childId); }, [childId]);

  const handleChildSelect = (child) => {
    setChildId(child.id);
    setChildName(child.name);
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    if (!notes.trim()) { setError('الرجاء إدخال ملاحظة الملاحظة.'); return; }
    if (!childId) { setError('الرجاء اختيار الطفل.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/learning/observations', {
        child_id: childId,
        child_name: childName,
        category,
        notes: notes.trim(),
        milestone,
      });
      setNotes('');
      setMilestone(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      fetchObservations(childId);
    } catch (err) {
      setError(err.response?.data?.detail || 'حدث خطأ أثناء الحفظ.');
    }
    setSaving(false);
  };

  const milestoneCount = observations.filter((o) => o.milestone).length;
  const categoryCounts = {};
  observations.forEach((o) => { categoryCounts[o.category] = (categoryCounts[o.category] || 0) + 1; });

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">سجل الملاحظات والتطور</h1>
              <p className="text-gray-600 text-sm">سجلي ملاحظاتك عن تطور كل طفل — اجتماعي، إدراكي، حركي، لغوي، عاطفي</p>
            </div>
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
                    childId === child.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats strip */}
        {observations.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
              <Eye className="w-5 h-5 text-teal-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{observations.length}</p>
              <p className="text-xs text-gray-500">ملاحظة</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
              <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{milestoneCount}</p>
              <p className="text-xs text-gray-500">إنجاز</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
              <Brain className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{Object.keys(categoryCounts).length}</p>
              <p className="text-xs text-gray-500">مجال</p>
            </div>
          </div>
        )}

        {/* Observation form */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-500" />
              تسجيل ملاحظة جديدة — {childName || `الطفل #${childId}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category picker */}
            <div className="space-y-2">
              <Label>مجال التطور</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        isActive ? `${cat.bg} ${cat.color} border border-current` : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>الملاحظة</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: لاحظت أن الطفل بدأ يشارك ألعابه مع زملائه بشكل تلقائي..."
                rows={3}
              />
            </div>

            {/* Milestone toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={milestone}
                onChange={(e) => setMilestone(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Star className={`w-4 h-4 ${milestone ? 'text-amber-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700">تسجيل كإنجاز / محطة تطورية</span>
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <Button onClick={handleSave} disabled={saving || !notes.trim()} className="bg-teal-500 text-white hover:bg-teal-600">
              {saving ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الحفظ...</>
                : saved ? <><CheckCircle2 className="w-4 h-4 ml-2" />تم الحفظ</>
                : 'حفظ الملاحظة'}
            </Button>
          </CardContent>
        </Card>

        {/* Observations timeline */}
        <Card className="peek-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-500" />
              سجل الملاحظات — {childName || `الطفل #${childId}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {observations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-teal-50 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-teal-300" />
                </div>
                <p className="text-sm font-medium text-gray-700">لا توجد ملاحظات بعد لهذا الطفل</p>
                <p className="text-xs text-gray-500 mt-1">استخدمي النموذج أعلاه لتسجيل أول ملاحظة.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {observations.map((obs) => {
                  const cat = CATEGORY_MAP[obs.category] || CATEGORY_MAP.general;
                  const Icon = cat.icon;
                  return (
                    <div key={obs.observation_id} className={`flex items-start gap-3 rounded-xl border border-gray-100 p-3 ${cat.bg}`}>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-medium text-gray-500">{cat.label}</span>
                          {obs.milestone && (
                            <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                              <Star className="w-3 h-3" />إنجاز
                            </span>
                          )}
                          {obs.session_id && <Badge variant="secondary" className="text-xs">جلسة مرتبطة</Badge>}
                          <span className="text-xs text-gray-400 mr-auto">
                            {new Date(obs.created_at).toLocaleDateString('ar-JO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{obs.notes}</p>
                        <p className="text-xs text-gray-400 mt-1">{obs.teacher_name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherObservations;
