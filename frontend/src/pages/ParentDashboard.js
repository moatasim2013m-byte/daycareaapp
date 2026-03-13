import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { readCachedChildContexts } from '../utils/childContext';

const DEFAULT_PAYMENTS = {
  subscription_status: 'NONE',
  payment_history: [],
  visit_pack: null,
  recent_orders: [],
};

const DEFAULT_BOOKINGS = {
  session_visits: [],
  upcoming_event: null,
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const formatDate = (value, options = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, options);
};

const pickEventDate = (entry) => entry?.date || entry?.start_at || entry?.startAt || entry?.event_date;

const ParentDashboard = () => {
  const [feed, setFeed] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState(DEFAULT_BOOKINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feedRes, attendanceRes, paymentsRes, messagesRes, bookingsRes] = await Promise.all([
          api.get('/parent/feed'),
          api.get('/parent/attendance'),
          api.get('/parent/payments'),
          api.get('/parent/messages'),
          api.get('/parent/bookings'),
        ]);

        setFeed(asArray(feedRes?.data));
        setAttendance(asArray(attendanceRes?.data));
        setPayments({ ...DEFAULT_PAYMENTS, ...(paymentsRes?.data || {}) });
        setMessages(asArray(messagesRes?.data));
        setBookings({ ...DEFAULT_BOOKINGS, ...(bookingsRes?.data || {}) });
      } catch (error) {
        console.error('Failed to load parent dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const children = useMemo(() => readCachedChildContexts(), []);
  const latestVisit = attendance[0] || null;
  const upcomingBooking = useMemo(() => {
    const allVisits = asArray(bookings?.session_visits);
    if (allVisits.length === 0) return null;

    const sorted = [...allVisits].sort((a, b) => {
      const left = new Date(pickEventDate(a)).getTime();
      const right = new Date(pickEventDate(b)).getTime();
      return left - right;
    });

    const now = Date.now();
    return sorted.find((entry) => new Date(pickEventDate(entry)).getTime() >= now) || sorted[0];
  }, [bookings]);

  const latestPayment = asArray(payments?.payment_history)[0] || null;
  const latestMessage = messages[0] || null;

  const stats = useMemo(
    () => ({
      childCount: children.length,
      attendanceCount: attendance.length,
      sessionVisits: asArray(bookings?.session_visits).length,
      paymentCount: asArray(payments?.payment_history).length,
    }),
    [children, attendance, bookings, payments]
  );

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
            <p className="text-gray-600 mt-1">Quick overview for attendance, billing, visits, and updates.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="peek-card"><CardContent className="p-4"><p className="text-xs text-gray-500">Children</p><p className="text-2xl font-semibold">{stats.childCount}</p></CardContent></Card>
          <Card className="peek-card"><CardContent className="p-4"><p className="text-xs text-gray-500">Attendance logs</p><p className="text-2xl font-semibold">{stats.attendanceCount}</p></CardContent></Card>
          <Card className="peek-card"><CardContent className="p-4"><p className="text-xs text-gray-500">Visit sessions</p><p className="text-2xl font-semibold">{stats.sessionVisits}</p></CardContent></Card>
          <Card className="peek-card"><CardContent className="p-4"><p className="text-xs text-gray-500">Payments</p><p className="text-2xl font-semibold">{stats.paymentCount}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="peek-card">
            <CardHeader><CardTitle>Child Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {children.length === 0 ? (
                <p className="text-gray-500">No child profile found in cached context.</p>
              ) : (
                children.slice(0, 3).map((child) => (
                  <div key={child.childId} className="rounded-lg border border-orange-100 bg-orange-50 p-3">
                    <p className="font-medium text-gray-900">{child.childName}</p>
                    <p className="text-gray-600">ID: {child.childId}</p>
                    <p className="text-gray-600">Room: {child.roomId || 'Not assigned yet'}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader><CardTitle>Latest Attendance / Visit</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!latestVisit ? (
                <p className="text-gray-500">No recent attendance record found.</p>
              ) : (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-900">{latestVisit?.status || 'Recorded visit'}</p>
                  <p className="text-gray-600">Date: {latestVisit?.date || formatDate(latestVisit?.check_in, { dateStyle: 'medium' })}</p>
                  <p className="text-gray-600">Check-in: {formatDate(latestVisit?.check_in, { timeStyle: 'short' })}</p>
                  <p className="text-gray-600">Check-out: {formatDate(latestVisit?.check_out, { timeStyle: 'short' })}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="peek-card">
            <CardHeader><CardTitle>Subscription / Pack Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-gray-700">Subscription: <span className="font-semibold">{payments?.subscription_status || 'NONE'}</span></p>
              {payments?.visit_pack ? (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-900">{payments.visit_pack.name || 'Visit Pack'}</p>
                  <p className="text-gray-600">Status: {payments.visit_pack.status || 'N/A'}</p>
                  <p className="text-gray-600">Visits remaining: {payments.visit_pack.visits_remaining ?? 'N/A'}</p>
                  <p className="text-gray-600">Renewal / expiry: {formatDate(payments.visit_pack.renewal_date || payments.visit_pack.expiry_date, { dateStyle: 'medium' })}</p>
                </div>
              ) : (
                <p className="text-gray-500">No active visit pack available.</p>
              )}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader><CardTitle>Recent Payment / Order</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!latestPayment ? (
                <p className="text-gray-500">No payment history available.</p>
              ) : (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-900">{latestPayment.description || 'Payment'}</p>
                  <p className="text-gray-600">Amount: {latestPayment.amount ?? 0} {latestPayment.currency || 'JOD'}</p>
                  <p className="text-gray-600">Type: {latestPayment.method || latestPayment.type || 'N/A'}</p>
                  <p className="text-gray-600">Date: {formatDate(latestPayment.paid_at, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              )}
              {asArray(payments?.recent_orders).slice(0, 1).map((order) => (
                <div key={order.order_id || order.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-900">Order #{order.order_id || order.id || '—'}</p>
                  <p className="text-gray-600">Amount: {order.total_amount ?? order.amount ?? 0} {order.currency || 'JOD'}</p>
                  <p className="text-gray-600">Status: {order.status || 'N/A'}</p>
                  <p className="text-gray-600">Date: {formatDate(order.created_at || order.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="peek-card">
            <CardHeader><CardTitle>Upcoming Event / Booking</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!upcomingBooking && !bookings?.upcoming_event ? (
                <p className="text-gray-500">No upcoming booking found.</p>
              ) : (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-900">{upcomingBooking?.service || bookings?.upcoming_event?.title || 'Upcoming event'}</p>
                  <p className="text-gray-600">Status: {upcomingBooking?.status || bookings?.upcoming_event?.status || 'N/A'}</p>
                  <p className="text-gray-600">Date: {formatDate(pickEventDate(upcomingBooking || bookings?.upcoming_event), { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader><CardTitle>Latest Message</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!latestMessage ? (
                <p className="text-gray-500">No messages yet.</p>
              ) : (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-900">{latestMessage.subject || 'Message'}</p>
                  <p className="text-gray-600 line-clamp-3">{latestMessage.body || latestMessage.text || '—'}</p>
                  <p className="text-gray-500">{formatDate(latestMessage.created_at || latestMessage.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="peek-card">
          <CardHeader><CardTitle>Recent Attendance History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {attendance.length === 0 ? (
              <p className="text-sm text-gray-500">No attendance records.</p>
            ) : (
              attendance.slice(0, 5).map((entry, index) => (
                <div key={entry?.session_id || `attendance-${index}`} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <p className="font-medium">{entry?.status || 'Visit'}</p>
                  <p className="text-gray-600">Date: {entry?.date || formatDate(entry?.check_in, { dateStyle: 'medium' })}</p>
                  <p className="text-gray-600">Check-in: {formatDate(entry?.check_in, { timeStyle: 'short' })}</p>
                  <p className="text-gray-600">Check-out: {formatDate(entry?.check_out, { timeStyle: 'short' })}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="peek-card">
          <CardHeader><CardTitle>Activity Feed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {feed.length === 0 ? <p className="text-sm text-gray-500">No activities yet.</p> : feed.slice(0, 4).map((item, index) => (
              <div key={item?.id || `feed-${index}`} className="rounded-lg border border-gray-100 p-3">
                <p className="font-medium">{item?.title || 'Update'}</p>
                <p className="text-sm text-gray-600">{item?.description || 'No additional details.'}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;
