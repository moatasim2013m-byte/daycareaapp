import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { resolveCachedChildContext, readCachedChildContexts } from '../utils/childContext';
import { MessageSquare, Send, Users } from 'lucide-react';

const readThread = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return [...parsed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch { return []; }
};

const TeacherMessages = () => {
  const [childId, setChildId] = useState('1');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const children = readCachedChildContexts();
  const childList = children.length > 0
    ? children.map((c) => ({ id: c.childId, name: c.childName }))
    : [1, 2, 3, 4, 5].map((n) => ({ id: String(n), name: `الطفل ${n}` }));

  const threadKey = useMemo(() => `messagesThread:${childId}`, [childId]);

  useEffect(() => {
    const context = resolveCachedChildContext();
    if (context?.childId) setChildId(context.childId);
  }, []);

  useEffect(() => { setMessages(readThread(threadKey)); }, [threadKey]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);

  const persistMessages = (nextMessages) => {
    localStorage.setItem(threadKey, JSON.stringify(nextMessages));
    setMessages(nextMessages);
  };

  const handleSend = (msgText) => {
    const normalized = (msgText || text).trim();
    if (!normalized) return;
    const nextMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      childId: String(childId),
      fromRole: 'TEACHER',
      text: normalized,
      createdAt: new Date().toISOString(),
    };
    persistMessages([...messages, nextMessage]);
    setText('');
  };

  const selectedChild = childList.find((c) => c.id === childId);

  return (
    <div className="peek-page peek-role-teacher" dir="rtl">
      <div className="peek-shell max-w-4xl space-y-4">
        {/* Header */}
        <div className="peek-header peek-header--teacher">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">رسائل أولياء الأمور</h1>
              <p className="text-gray-600 text-sm">تواصل مع ولي أمر كل طفل — اختر الطفل ثم ابدأ المحادثة</p>
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
                  onClick={() => setChildId(child.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    childId === child.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="peek-card">
          <CardContent className="p-0">
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                محادثة {selectedChild?.name || `الطفل #${childId}`}
              </span>
              <Badge variant="secondary" className="text-xs">{messages.length} رسالة</Badge>
            </div>

            {/* Messages */}
            <div className="min-h-[280px] max-h-[420px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-blue-50/30 to-white">
              {messages.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-emerald-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">لا توجد رسائل بعد</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    ابدأ التواصل مع ولي أمر {selectedChild?.name || `الطفل #${childId}`}.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['تقرير اليوم: الطفل بحالة ممتازة', 'يرجى إحضار ملابس بديلة غداً', 'تذكير: غداً رحلة ميدانية'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSend(suggestion)}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isTeacher = message.fromRole === 'TEACHER';
                    return (
                      <div key={message.id} className={`flex ${isTeacher ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                          isTeacher ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                        }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-xs font-medium ${isTeacher ? 'text-blue-100' : 'text-gray-400'}`}>
                              {isTeacher ? 'أنتِ (المعلمة)' : 'ولي الأمر'}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-6">{message.text}</p>
                          <p className={`text-xs mt-1 ${isTeacher ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(message.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Compose */}
            <div className="border-t border-gray-100 p-3 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`رسالة لولي أمر ${selectedChild?.name || `الطفل #${childId}`}...`}
                  rows={2}
                  className="flex-1 resize-none text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button onClick={() => handleSend()} disabled={!text.trim()} className="bg-emerald-500 text-white hover:bg-emerald-600 self-end px-4">
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

export default TeacherMessages;
