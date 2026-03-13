import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { resolveCachedChildContext } from '../utils/childContext';
import { fetchRecentNotifications } from '../services/api';

const parseCachedList = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const ParentMessages = () => {
  const [childId, setChildId] = useState('1');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) {
      setChildId(context.childId);
    }
  }, []);

  useEffect(() => {
    setMessages(readThread(`messagesThread:${childId}`));
  }, [childId]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const rows = await fetchRecentNotifications(15);
        setNotifications(rows.filter((item) => item?.message && item?.status === 'SENT'));
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const childName = useMemo(() => resolveChildName(childId), [childId]);

  const onSend = () => {
    const nextText = draft.trim();
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

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-3xl">
        <div className="peek-header peek-header--parent flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">رسائل العائلة</h1>
            <p className="mt-1 text-sm text-gray-600">{childName ? `${childName}` : `الطفل رقم ${childId}`}</p>
            <p className="text-sm text-gray-500">تواصل إنساني سريع مع الحضانة</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة</Link>
          </Button>
        </div>

        <div className="peek-card p-4">
          <div className="space-y-2">
            <Label htmlFor="childId">رقم الطفل</Label>
            <Input
              id="childId"
              name="childId"
              value={childId}
              onChange={(event) => setChildId(event.target.value || '1')}
              placeholder="1"
            />
          </div>

          {notifications.length > 0 && (
            <div className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-800">آخر إشعارات الحضانة</p>
              <div className="mt-2 space-y-2">
                {notifications.slice(0, 5).map((item, index) => (
                  <div key={`${item.created_at || index}`} className="rounded-xl bg-white px-3 py-2 text-sm text-gray-700">
                    <p>{item.message}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatMessageTimestamp(item.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-orange-50/50 p-3">
            {messages.length === 0 ? (
              <div className="peek-empty">
                <p className="text-lg font-medium text-gray-700">لا توجد رسائل بعد 💛</p>
                <p className="mt-1 text-sm text-gray-500">ابدأ المحادثة بإرسال رسالة قصيرة إلى الحضانة.</p>
              </div>
            ) : (
              messages.map((message) => {
                const isParentMessage = (message?.senderType || '').toUpperCase() === 'PARENT';

                return (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      isParentMessage
                        ? 'mr-auto bg-rose-500 text-white'
                        : 'ml-auto bg-white text-gray-900 border border-orange-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                    <p className={`mt-2 text-xs ${isParentMessage ? 'text-rose-100' : 'text-gray-500'}`}>
                      {formatMessageTimestamp(message.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
            <div ref={endOfMessagesRef} />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="parent-message-draft">اكتب رسالتك</Label>
            <Textarea
              id="parent-message-draft"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="اكتب رسالة للحضانة..."
              rows={3}
            />
            <div className="flex justify-start">
              <Button type="button" onClick={onSend} disabled={!draft.trim()} className="bg-rose-500 text-white hover:bg-rose-600">
                إرسال
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentMessages;
