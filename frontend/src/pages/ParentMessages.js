import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { resolveCachedChildContext } from '../utils/childContext';
import { fetchRecentNotifications } from '../services/api';
import api from '../services/api';
import {
  MessageSquare, Send, Bell, Baby, CreditCard,
  CalendarDays, HelpCircle, Sparkles, Globe, FileText,
  Loader2, ChevronDown, ChevronUp, Clock
} from 'lucide-react';

const parseCachedList = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const readThread = (key) => {
  const items = parseCachedList(localStorage.getItem(key));
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

const resolveChildName = (targetChildId) => {
  const candidateKeys = ['children', 'children:list', 'cachedChildren', 'parentChildren'];
  for (const key of candidateKeys) {
    const list = parseCachedList(localStorage.getItem(key));
    const matchedChild = list.find(
      (child) => String(child?.child_id ?? child?.childId ?? child?.id) === String(targetChildId)
    );
    if (!matchedChild) continue;
    const name = matchedChild?.full_name ?? matchedChild?.fullName ?? matchedChild?.name ?? matchedChild?.childName;
    if (typeof name === 'string' && name.trim() !== '') return name.trim();
  }
  return null;
};

const formatMessageTimestamp = (value) => {
  if (!value) return 'الآن';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'الآن';
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const QUICK_MESSAGES = [
  { icon: Baby, label: 'إضافة طفل', text: 'مرحباً، أود إضافة طفلي في النظام. هل يمكنكم مساعدتي؟' },
  { icon: CreditCard, label: 'استفسار عن الباقات', text: 'مرحباً، أريد الاستفسار عن الباقات المتاحة والأسعار.' },
  { icon: CalendarDays, label: 'حجز جلسة', text: 'مرحباً، أريد حجز جلسة لطفلي. ما المواعيد المتاحة؟' },
  { icon: HelpCircle, label: 'سؤال عام', text: 'مرحباً، لدي استفسار أود مساعدتكم فيه.' },
];

/* ─── AI Report Thread Component ─── */
const ReportThread = ({ report, showEnglish, onReplyAdded }) => {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const replies = Array.isArray(report.replies) ? report.replies : [];

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/daily-reports/${report.report_id}/reply`, { text: replyText.trim() });
      setReplyText('');
      if (onReplyAdded) onReplyAdded();
    } catch (err) {
      console.error('Reply error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-white overflow-hidden shadow-sm">
      {/* Report header */}
      <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-semibold text-purple-600">تقرير من المعلمة</span>
            {report.session_id && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-500">جلسة مرتبطة</span>
            )}
          </div>
          <span className="text-xs text-gray-400">{formatMessageTimestamp(report.created_at)}</span>
        </div>

        {report.photo_url && (
          <img src={report.photo_url} alt="" className="w-full max-h-40 object-cover rounded-xl mb-3 border border-gray-200" />
        )}

        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap" dir={showEnglish ? 'ltr' : 'rtl'}>
          {showEnglish ? report.report_en : report.report_ar}
        </p>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-500">
            <Globe className="w-3 h-3 inline ml-1" />
            {report.teacher_name || 'المعلمة'}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            {replies.length > 0 && <Badge variant="secondary" className="text-xs ml-1">{replies.length}</Badge>}
            {expanded ? <><ChevronUp className="w-3 h-3" />إخفاء الردود</> : <><ChevronDown className="w-3 h-3" />الردود</>}
          </button>
        </div>
      </div>

      {/* Replies section */}
      {expanded && (
        <div className="border-t border-purple-100">
          {/* Existing replies */}
          {replies.length > 0 && (
            <div className="p-3 space-y-2 bg-gray-50/50">
              {replies.map((reply) => (
                <div key={reply.reply_id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{reply.parent_name}</span>
                      <span className="text-xs text-gray-400">{formatMessageTimestamp(reply.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-0.5">{reply.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply compose */}
          <div className="p-3 flex gap-2 bg-white">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب رداً على التقرير..."
              rows={2}
              className="flex-1 resize-none text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
              className="bg-purple-500 text-white hover:bg-purple-600 self-end px-3"
              size="sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const ParentMessages = () => {
  const [childId, setChildId] = useState('1');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [aiReports, setAiReports] = useState([]);
  const [showEnglish, setShowEnglish] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) setChildId(context.childId);
  }, []);

  useEffect(() => {
    setMessages(readThread(`messagesThread:${childId}`));
  }, [childId]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const rows = await fetchRecentNotifications(15);
        setNotifications(rows.filter((item) => item?.message && item?.status === 'SENT'));
      } catch { setNotifications([]); }
    };
    loadNotifications();
  }, []);

  // Fetch AI reports
  const loadAiReports = async () => {
    try {
      const res = await api.get('/daily-reports');
      setAiReports(Array.isArray(res.data) ? res.data : []);
    } catch { setAiReports([]); }
  };

  useEffect(() => { loadAiReports(); }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const childName = useMemo(() => resolveChildName(childId), [childId]);

  const onSend = (text) => {
    const nextText = (text || draft).trim();
    if (!nextText) return;
    const nextMessage = {
      id: `${Date.now()}`,
      text: nextText,
      createdAt: new Date().toISOString(),
      senderType: 'PARENT',
    };
    const nextThread = [...messages, nextMessage];
    localStorage.setItem(`messagesThread:${childId}`, JSON.stringify(nextThread));
    setMessages(nextThread);
    setDraft('');
  };

  const handleQuickMessage = (text) => { onSend(text); };

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-3xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--parent">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">رسائل العائلة</h1>
              <p className="text-sm text-gray-600">
                {childName ? `محادثة حول ${childName}` : 'تواصل مع الحضانة'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <Card className="peek-card">
          <CardContent className="p-2">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'reports' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                تقارير المعلمة
                {aiReports.length > 0 && <Badge variant="secondary" className="text-xs">{aiReports.length}</Badge>}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === 'chat' ? 'bg-rose-100 text-rose-700' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                المحادثة
                {messages.length > 0 && <Badge variant="secondary" className="text-xs">{messages.length}</Badge>}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ═══ REPORTS TAB ═══ */}
        {activeTab === 'reports' && (
          <>
            {/* Language toggle */}
            {aiReports.length > 0 && (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => setShowEnglish(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${!showEnglish ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setShowEnglish(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${showEnglish ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  English
                </button>
              </div>
            )}

            {/* Notifications */}
            {notifications.length > 0 && (
              <Card className="peek-card border-amber-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    إشعارات الحضانة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map((item, index) => (
                      <div key={`${item.created_at || index}`} className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5">
                        <Bell className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-800">{item.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatMessageTimestamp(item.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Reports feed */}
            {aiReports.length === 0 ? (
              <Card className="peek-card">
                <CardContent className="py-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-purple-300" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-1">لا توجد تقارير بعد</p>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    عندما ترسل المعلمة تقريراً يومياً عن طفلك ستجده هنا مع إمكانية الرد.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {aiReports.map((report) => (
                  <ReportThread
                    key={report.report_id}
                    report={report}
                    showEnglish={showEnglish}
                    onReplyAdded={loadAiReports}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ CHAT TAB ═══ */}
        {activeTab === 'chat' && (
          <Card className="peek-card">
            <CardContent className="p-0">
              {/* Messages thread */}
              <div className="min-h-[320px] max-h-[480px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-orange-50/30 to-white">
                {messages.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-rose-300" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-1">ابدأ محادثتك الأولى</p>
                    <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
                      أرسل رسالة للحضانة — استفسر عن الباقات، أضف طفلك، أو اطرح أي سؤال.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {QUICK_MESSAGES.map((qm) => {
                        const Icon = qm.icon;
                        return (
                          <button
                            key={qm.label}
                            onClick={() => handleQuickMessage(qm.text)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors shadow-sm"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {qm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const isParent = (message?.senderType || '').toUpperCase() === 'PARENT';
                      return (
                        <div key={message.id} className={`flex ${isParent ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                            isParent
                              ? 'bg-rose-500 text-white rounded-br-md'
                              : 'bg-white text-gray-900 border border-orange-100 rounded-bl-md'
                          }`}>
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                            <p className={`mt-1.5 text-xs ${isParent ? 'text-rose-200' : 'text-gray-400'}`}>
                              {formatMessageTimestamp(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endOfMessagesRef} />
                  </>
                )}
              </div>

              {/* Compose area */}
              <div className="border-t border-gray-100 p-3 bg-white rounded-b-2xl">
                {messages.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {QUICK_MESSAGES.slice(0, 3).map((qm) => {
                      const Icon = qm.icon;
                      return (
                        <button
                          key={qm.label}
                          onClick={() => handleQuickMessage(qm.text)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-xs text-gray-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors"
                        >
                          <Icon className="w-3 h-3" />
                          {qm.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="اكتب رسالتك للحضانة..."
                    rows={2}
                    className="flex-1 resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                  />
                  <Button
                    onClick={() => onSend()}
                    disabled={!draft.trim()}
                    className="bg-rose-500 text-white hover:bg-rose-600 self-end px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParentMessages;
