import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const parseCachedList = (raw) => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.children)) return parsed.children;
    if (Array.isArray(parsed?.items)) return parsed.items;
    return [];
  } catch {
    return [];
  }
};

const readThread = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch {
    return [];
  }
};

const resolveChildName = (targetChildId) => {
  const candidateKeys = ['children', 'childProfiles', 'daycareChildren', 'kids'];

  for (const key of candidateKeys) {
    const list = parseCachedList(localStorage.getItem(key));
    if (list.length === 0) continue;

    const matchedChild = list.find(
      (child) => String(child?.child_id ?? child?.childId ?? child?.id) === String(targetChildId)
    );

    if (!matchedChild) continue;

    const name = matchedChild?.full_name ?? matchedChild?.fullName ?? matchedChild?.name ?? matchedChild?.childName;
    if (typeof name === 'string' && name.trim() !== '') {
      return name.trim();
    }
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
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    setMessages(readThread(`messagesThread:${childId}`));
  }, [childId]);

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
            <p className="mt-1 text-sm text-gray-600">{childName ? `${childName}` : `الطفل رقم ${childId}`}</p>
            <p className="text-sm text-gray-500">محادثة مع الحضانة</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-3">
            {messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center">
                <p className="text-lg font-medium text-gray-700">لا توجد رسائل بعد</p>
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
                        ? 'mr-auto bg-blue-600 text-white'
                        : 'ml-auto bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                    <p className={`mt-2 text-xs ${isParentMessage ? 'text-blue-100' : 'text-gray-500'}`}>
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
              <Button type="button" onClick={onSend} disabled={!draft.trim()}>
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
