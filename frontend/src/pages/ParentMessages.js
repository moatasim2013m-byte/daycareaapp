import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';

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

const ParentMessages = () => {
  const [childId, setChildId] = useState('1');
  const [needsChildInput, setNeedsChildInput] = useState(true);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const candidateKeys = ['children', 'childProfiles', 'daycareChildren', 'kids'];

    for (const key of candidateKeys) {
      const list = parseCachedList(localStorage.getItem(key));
      if (list.length > 0) {
        const firstChild = list[0];
        const cachedId = firstChild?.child_id ?? firstChild?.childId ?? firstChild?.id;

        if (cachedId !== undefined && cachedId !== null && String(cachedId).trim() !== '') {
          setChildId(String(cachedId));
          setNeedsChildInput(false);
          return;
        }
      }
    }

    setNeedsChildInput(true);
  }, []);

  const threadKey = useMemo(() => `messagesThread:${childId}`, [childId]);

  useEffect(() => {
    setMessages(readThread(threadKey));
  }, [threadKey]);

  const persistMessages = (nextMessages) => {
    localStorage.setItem(threadKey, JSON.stringify(nextMessages));
    setMessages(nextMessages);
  };

  const handleSend = () => {
    const normalized = text.trim();
    if (!normalized) {
      alert('الرجاء إدخال نص الرسالة.');
      return;
    }

    const nextMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childId: String(childId),
      fromRole: 'PARENT',
      text: normalized,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, nextMessage];
    persistMessages(nextMessages);
    setText('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">رسائل الحضانة</h1>
            <p className="text-gray-600 mt-1">محادثة مباشرة مع المعلمة</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        {needsChildInput && (
          <Card>
            <CardContent className="pt-6 max-w-xs space-y-2">
              <Label htmlFor="parent-child-id">معرف الطفل</Label>
              <Input
                id="parent-child-id"
                value={childId}
                onChange={(e) => setChildId(e.target.value || '1')}
                placeholder="1"
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>المحادثة</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-gray-500">لا توجد رسائل بعد</p>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isTeacher = message.fromRole === 'TEACHER';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isTeacher ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 border ${
                          isTeacher
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isTeacher ? 'default' : 'secondary'}>
                            {isTeacher ? 'المعلمة' : 'ولي الأمر'}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString('ar-JO', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إرسال رسالة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالتك هنا"
            />
            <Button type="button" onClick={handleSend}>إرسال</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentMessages;
