import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const ParentDashboard = () => {
  const [feed, setFeed] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState({ subscription_status: 'NONE', payment_history: [] });
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState({ session_visits: [] });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feedRes, attendanceRes, paymentsRes, messagesRes, bookingsRes, eventsRes] = await Promise.all([
          api.get('/parent/feed'),
          api.get('/parent/attendance'),
          api.get('/parent/payments'),
          api.get('/parent/messages'),
          api.get('/parent/bookings'),
          api.get('/events'),
        ]);

        setFeed(Array.isArray(feedRes.data) ? feedRes.data : []);
        setAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
        setPayments(paymentsRes.data || { subscription_status: 'NONE', payment_history: [] });
        setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
        setBookings(bookingsRes.data || { session_visits: [] });
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      } catch (error) {
        console.error('Failed to load parent dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => ({
    dailyReports: feed.filter((item) => item.type === 'daily_report').length,
    photoFeed: feed.filter((item) => item.photo_url).length,
    sessionVisits: (bookings.session_visits || []).length,
    upcomingEvents: events.filter((event) => new Date(event.date) >= new Date(new Date().setHours(0, 0, 0, 0))).length,
  }), [feed, bookings, events]);

  if (loading) {
    return (
      <div className="peek-page peek-role-parent flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="peek-page peek-role-parent" dir="rtl">
      <div className="peek-shell max-w-5xl space-y-4 md:space-y-6">
        <div className="peek-header peek-header--parent flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parent Portal Dashboard</h1>
            <p className="text-gray-600 mt-1">Activities, attendance, payments, messages, and bookings in one place.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="peek-card"><CardContent className="p-4"><p className="text-sm text-gray-500">Daily reports</p><p className="text-2xl font-semibold">{stats.dailyReports}</p></CardContent></Card>
          <Card className="peek-card"><CardContent className="p-4"><p className="text-sm text-gray-500">Photo feed</p><p className="text-2xl font-semibold">{stats.photoFeed}</p></CardContent></Card>
          <Card className="peek-card"><CardContent className="p-4"><p className="text-sm text-gray-500">Subscription</p><p className="text-2xl font-semibold">{payments.subscription_status || 'NONE'}</p></CardContent></Card>
          <Card className="peek-card"><CardContent className="p-4"><p className="text-sm text-gray-500">Session visits</p><p className="text-2xl font-semibold">{stats.sessionVisits}</p></CardContent></Card>
          <Card className="peek-card"><CardContent className="p-4"><p className="text-sm text-gray-500">Upcoming events</p><p className="text-2xl font-semibold">{stats.upcomingEvents}</p></CardContent></Card>
        </div>

        <Card className="peek-card">
          <CardHeader><CardTitle>Activity Feed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {feed.length === 0 ? <p className="text-sm text-gray-500">No activities yet.</p> : feed.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>


        <Card className="peek-card">
          <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? <p className="text-sm text-gray-500">No upcoming events.</p> : events
              .filter((event) => new Date(event.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
              .slice(0, 4)
              .map((event) => (
                <div key={event.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-gray-600">{event.date} {event.startTime}-{event.endTime}</p>
                  <p className="text-gray-600">Status: {event.status} • Capacity: {event.usedCapacity}/{event.capacity}</p>
                </div>
              ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="peek-card">
            <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {attendance.length === 0 ? <p className="text-sm text-gray-500">No attendance records.</p> : attendance.map((entry) => (
                <div key={entry.session_id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium">{entry.date}</p>
                  <p className="text-gray-600">Check-in: {entry.check_in ? new Date(entry.check_in).toLocaleTimeString() : '-'}</p>
                  <p className="text-gray-600">Check-out: {entry.check_out ? new Date(entry.check_out).toLocaleTimeString() : '-'}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">Subscription status: <span className="font-semibold">{payments.subscription_status}</span></p>
              {(payments.payment_history || []).length === 0 ? <p className="text-sm text-gray-500">No payment history.</p> : (payments.payment_history || []).map((payment) => (
                <div key={payment.payment_id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium">{payment.description}</p>
                  <p className="text-gray-600">{payment.amount} {payment.currency} • {payment.status}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="peek-card">
            <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {messages.length === 0 ? <p className="text-sm text-gray-500">No messages.</p> : messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium">{msg.subject}</p>
                  <p className="text-gray-600">{msg.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader><CardTitle>Bookings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(bookings.session_visits || []).length === 0 ? <p className="text-sm text-gray-500">No bookings.</p> : (bookings.session_visits || []).map((booking) => (
                <div key={booking.booking_id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium">{booking.service}</p>
                  <p className="text-gray-600">{booking.date} {booking.time} • {booking.status}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
