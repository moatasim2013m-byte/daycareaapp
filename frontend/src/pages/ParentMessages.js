import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { resolveCachedChildContext } from '../utils/childContext';
import { fetchRecentNotifications } from '../services/api';
import {
  MessageSquare, Send, Bell, Baby, CreditCard,
  CalendarDays, HelpCircle
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

const ParentMessages = () => {
  const [childId, setChildId] = useState('1');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
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

  const handleQuickMessage = (text) => {
    onSend(text);
  };

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
                {notifications.slice(0, 5).map((item, index) => (
                  <div key={`${item.created_at || index}`} className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-relaxed">{item.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatMessageTimestamp(item.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chat area */}
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
      </div>
    </div>
  );
};

export default ParentMessages;
