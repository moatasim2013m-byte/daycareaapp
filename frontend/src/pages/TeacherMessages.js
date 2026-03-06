import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';

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

const TeacherMessages = () => {
  const [childId, setChildId] = useState('1');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const threadKey = useMemo(() => `messagesThread:${childId}`, [childId]);

  useEffect(() => {
    setMessages(readThread(threadKey));
  }, [threadKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

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
      fromRole: 'TEACHER',
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
            <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
            <p className="text-gray-600 mt-1">محادثة ولي الأمر للطفل</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">العودة إلى لوحة التحكم</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-sm font-medium text-gray-900">سياق المحادثة الحالي</p>
                <p className="text-xs text-gray-600 mt-1">
                  جميع الرسائل في هذه الصفحة محفوظة محليًا لكل طفل حسب المعرّف.
                </p>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                الطفل رقم: {childId || '—'}
              </Badge>
            </div>

            <div className="max-w-xs space-y-2">
              <Label htmlFor="teacher-child-id">معرف الطفل</Label>
              <Input
                id="teacher-child-id"
                value={childId}
                onChange={(e) => setChildId(e.target.value || '1')}
                placeholder="1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المحادثة</CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center space-y-2">
                <p className="text-gray-700 font-medium">لا توجد رسائل في هذه المحادثة حتى الآن.</p>
                <p className="text-sm text-gray-500">
                  اكتب أول رسالة للطفل رقم {childId || '—'} لتبدأ التواصل مع ولي الأمر.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto pl-1">
                {messages.map((message) => {
                  const isTeacher = message.fromRole === 'TEACHER';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isTeacher ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 border shadow-sm ${
                          isTeacher
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={isTeacher ? 'default' : 'secondary'}>
                            {isTeacher ? 'المعلمة' : 'ولي الأمر'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-6">{message.text}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(message.createdAt).toLocaleString('ar-JO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
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

export default TeacherMessages;
