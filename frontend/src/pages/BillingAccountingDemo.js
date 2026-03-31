import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Receipt, DollarSign, FileText, Plus, CheckCircle2,
  Clock, AlertTriangle, Loader2, CreditCard, Users,
  CalendarDays, ChevronDown, ChevronUp
} from 'lucide-react';

const money = (v) => `${(Number(v) || 0).toFixed(2)} د.أ`;

const BillingAccountingDemo = () => {
  const { user, isAdmin, isParent } = useAuth();
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [feePlans, setFeePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

  // Admin: generate invoice form
  const [genChildId, setGenChildId] = useState('');
  const [genStart, setGenStart] = useState('');
  const [genEnd, setGenEnd] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // Admin: create fee plan form
  const [fpChildId, setFpChildId] = useState('');
  const [fpName, setFpName] = useState('');
  const [fpFee, setFpFee] = useState('');
  const [fpDesc, setFpDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showFpForm, setShowFpForm] = useState(false);

  // Balance for parent
  const [balance, setBalance] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, fpRes] = await Promise.allSettled([
        api.get('/billing/invoices'),
        isAdmin ? api.get('/billing/fee-plans') : Promise.resolve({ data: [] }),
      ]);
      setInvoices(invRes.status === 'fulfilled' && Array.isArray(invRes.value?.data) ? invRes.value.data : []);
      setFeePlans(fpRes.status === 'fulfilled' && Array.isArray(fpRes.value?.data) ? fpRes.value.data : []);

      // Parent: fetch balance for first child
      if (isParent) {
        try {
          const childRes = await api.get('/children');
          const children = Array.isArray(childRes.data) ? childRes.data : [];
          if (children.length > 0) {
            const cid = children[0].child_id;
            const balRes = await api.get(`/billing/balance/${cid}`);
            setBalance(balRes.data);
          }
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async () => {
    if (!genChildId || !genStart || !genEnd) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await api.post('/billing/invoices/generate', {
        child_id: genChildId, period_start: genStart, period_end: genEnd,
      });
      setGenResult(res.data);
      fetchData();
    } catch (err) {
      setGenResult({ error: err.response?.data?.detail || 'خطأ في إنشاء الفاتورة' });
    }
    setGenerating(false);
  };

  const handleCreatePlan = async () => {
    if (!fpChildId || !fpName || !fpFee) return;
    setCreating(true);
    try {
      await api.post('/billing/fee-plans', {
        child_id: fpChildId, plan_name: fpName, monthly_fee: parseFloat(fpFee), description: fpDesc,
      });
      setFpChildId(''); setFpName(''); setFpFee(''); setFpDesc(''); setShowFpForm(false);
      fetchData();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await api.post(`/billing/invoices/${invoiceId}/pay`);
      fetchData();
    } catch { /* ignore */ }
  };

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
  const paidInvoices = invoices.filter((i) => i.status === 'PAID');
  const totalOutstanding = pendingInvoices.reduce((s, i) => s + (i.total_due || 0), 0);

  if (loading) {
    return (
      <div className="peek-page peek-role-admin flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="peek-page peek-role-admin" dir="rtl">
      <div className="peek-shell max-w-5xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--admin">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">الفوترة والمحاسبة</h1>
              <p className="text-gray-600 text-sm">
                {isAdmin ? 'إدارة الخطط الشهرية، إنشاء الفواتير، ومتابعة الأرصدة' : 'فواتيرك وأرصدة أطفالك'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <FileText className="w-5 h-5 text-sky-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
            <p className="text-xs text-gray-500">إجمالي الفواتير</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{pendingInvoices.length}</p>
            <p className="text-xs text-gray-500">قيد الانتظار</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{paidInvoices.length}</p>
            <p className="text-xs text-gray-500">مدفوعة</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
            <DollarSign className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-gray-900">{money(totalOutstanding)}</p>
            <p className="text-xs text-gray-500">مستحق</p>
          </div>
        </div>

        {/* Parent balance card */}
        {isParent && balance && (
          <Card className="peek-card border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">رصيد {balance.child_name || 'طفلك'}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{money(balance.outstanding)}</p>
                  <p className="text-xs text-gray-500 mt-1">{balance.pending_invoices} فاتورة معلقة</p>
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${balance.outstanding > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  {balance.outstanding > 0
                    ? <AlertTriangle className="w-7 h-7 text-amber-500" />
                    : <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {isAdmin && (
          <Card className="peek-card">
            <CardContent className="p-2">
              <div className="flex gap-1">
                {['invoices', 'fee-plans', 'generate'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      activeTab === tab ? 'bg-sky-100 text-sky-700' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {tab === 'invoices' ? 'الفواتير' : tab === 'fee-plans' ? 'خطط الرسوم' : 'إنشاء فاتورة'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ INVOICES TAB ═══ */}
        {(activeTab === 'invoices' || isParent) && (
          <Card className="peek-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                الفواتير
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">لا توجد فواتير بعد</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isAdmin ? 'استخدم تبويب "إنشاء فاتورة" لإنشاء أول فاتورة.' : 'ستظهر فواتيرك هنا عند إصدارها.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => {
                    const isExpanded = expandedInvoice === inv.invoice_id;
                    return (
                      <div key={inv.invoice_id} className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                        <button
                          onClick={() => setExpandedInvoice(isExpanded ? null : inv.invoice_id)}
                          className="w-full p-3 flex items-center justify-between text-right"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              inv.status === 'PAID' ? 'bg-emerald-50' : 'bg-amber-50'
                            }`}>
                              {inv.status === 'PAID'
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                : <Clock className="w-4 h-4 text-amber-500" />
                              }
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{inv.child_name || inv.child_id}</p>
                              <p className="text-xs text-gray-500">{inv.period_start} → {inv.period_end}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-left">
                              <p className="text-sm font-bold text-gray-900">{money(inv.total_due)}</p>
                              <Badge variant={inv.status === 'PAID' ? 'default' : 'secondary'} className="text-xs">
                                {inv.status === 'PAID' ? 'مدفوعة' : 'معلقة'}
                              </Badge>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                            <div className="space-y-1.5">
                              {(inv.line_items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">{item.description}</span>
                                  <span className="font-medium text-gray-900">{money(item.total)}</span>
                                </div>
                              ))}
                              <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between text-sm font-bold">
                                <span>الإجمالي</span>
                                <span className="text-sky-700">{money(inv.total_due)}</span>
                              </div>
                            </div>
                            {isAdmin && inv.status === 'PENDING' && (
                              <Button
                                onClick={() => handleMarkPaid(inv.invoice_id)}
                                size="sm"
                                className="mt-3 bg-emerald-500 text-white hover:bg-emerald-600"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                                تسجيل دفع
                              </Button>
                            )}
                            {inv.paid_at && (
                              <p className="text-xs text-gray-400 mt-2">تم الدفع: {new Date(inv.paid_at).toLocaleDateString('ar-JO')}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ FEE PLANS TAB (Admin) ═══ */}
        {isAdmin && activeTab === 'fee-plans' && (
          <Card className="peek-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-500" />
                  خطط الرسوم الشهرية
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowFpForm(!showFpForm)}>
                  <Plus className="w-3.5 h-3.5 ml-1" />
                  خطة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showFpForm && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>معرّف الطفل</Label>
                      <Input value={fpChildId} onChange={(e) => setFpChildId(e.target.value)} placeholder="child-id" />
                    </div>
                    <div className="space-y-1">
                      <Label>اسم الخطة</Label>
                      <Input value={fpName} onChange={(e) => setFpName(e.target.value)} placeholder="مثال: خطة شهرية" />
                    </div>
                    <div className="space-y-1">
                      <Label>الرسوم الشهرية (د.أ)</Label>
                      <Input type="number" value={fpFee} onChange={(e) => setFpFee(e.target.value)} placeholder="50" />
                    </div>
                    <div className="space-y-1">
                      <Label>وصف (اختياري)</Label>
                      <Input value={fpDesc} onChange={(e) => setFpDesc(e.target.value)} placeholder="تفاصيل الخطة" />
                    </div>
                  </div>
                  <Button onClick={handleCreatePlan} disabled={creating} className="bg-sky-500 text-white hover:bg-sky-600">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Plus className="w-4 h-4 ml-1" />}
                    إنشاء الخطة
                  </Button>
                </div>
              )}

              {feePlans.length === 0 ? (
                <div className="text-center py-6">
                  <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">لا توجد خطط رسوم بعد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {feePlans.map((plan) => (
                    <div key={plan.plan_id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4 h-4 text-sky-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{plan.plan_name}</p>
                          <p className="text-xs text-gray-500">
                            {plan.child_name || plan.child_id} • {plan.description || 'بدون وصف'}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-sky-700">{money(plan.monthly_fee)}/شهر</p>
                        <Badge variant={plan.active ? 'default' : 'secondary'} className="text-xs">
                          {plan.active ? 'نشطة' : 'متوقفة'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ GENERATE INVOICE TAB (Admin) ═══ */}
        {isAdmin && activeTab === 'generate' && (
          <Card className="peek-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-sky-500" />
                إنشاء فاتورة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">أدخل معرّف الطفل والفترة لحساب الفاتورة تلقائياً من الجلسات والوقت الإضافي والرسوم الشهرية.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>معرّف الطفل</Label>
                  <Input value={genChildId} onChange={(e) => setGenChildId(e.target.value)} placeholder="child-id" />
                </div>
                <div className="space-y-1">
                  <Label>من تاريخ</Label>
                  <Input type="date" value={genStart} onChange={(e) => setGenStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>إلى تاريخ</Label>
                  <Input type="date" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="bg-emerald-500 text-white hover:bg-emerald-600">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin ml-1" />جاري الحساب...</> : <><Receipt className="w-4 h-4 ml-1" />إنشاء الفاتورة</>}
              </Button>

              {genResult && !genResult.error && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-800">تم إنشاء الفاتورة بنجاح</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div><span className="text-gray-500">الطفل:</span> <strong>{genResult.child_name}</strong></div>
                    <div><span className="text-gray-500">الجلسات:</span> <strong>{genResult.sessions_count}</strong></div>
                    <div><span className="text-gray-500">وقت إضافي:</span> <strong>{genResult.overtime_minutes} دقيقة</strong></div>
                    <div><span className="text-gray-500">الإجمالي:</span> <strong className="text-emerald-700">{money(genResult.total_due)}</strong></div>
                  </div>
                </div>
              )}
              {genResult?.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {genResult.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BillingAccountingDemo;
