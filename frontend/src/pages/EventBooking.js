import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Users, Plus, XCircle } from 'lucide-react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const EVENT_TYPES = [
  'birthday',
  'school_trip',
  'private_event',
  'workshop',
];

const STATUS_STYLES = {
  scheduled: 'text-blue-700 bg-blue-50 border-blue-100',
  full: 'text-amber-700 bg-amber-50 border-amber-100',
  cancelled: 'text-red-700 bg-red-50 border-red-100',
};

const emptyForm = {
  title: '',
  type: 'birthday',
  branchId: '',
  date: '',
  startTime: '10:00',
  endTime: '12:00',
  capacity: 10,
  price: 0,
  status: 'scheduled',
  customerId: '',
  notes: '',
};

const EventBooking = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [bookingForm, setBookingForm] = useState({ eventId: '', customerId: '' });
  const [cancelForm, setCancelForm] = useState({ eventId: '', customerId: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      setEvents(res.data || []);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (events || []).filter((event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    });
  }, [events]);

  const groupedByDate = useMemo(() => {
    const group = {};
    upcomingEvents.forEach((event) => {
      if (!group[event.date]) {
        group[event.date] = [];
      }
      group[event.date].push(event);
    });
    return Object.entries(group).sort((a, b) => a[0].localeCompare(b[0]));
  }, [upcomingEvents]);

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/events', {
        ...form,
        capacity: Number(form.capacity),
        price: Number(form.price),
        customerId: form.customerId || undefined,
        notes: form.notes || undefined,
      });
      setForm(emptyForm);
      setMessage('Event created successfully');
      await fetchEvents();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const onBook = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/events/book', bookingForm);
      setBookingForm({ eventId: '', customerId: '' });
      setMessage('Booking confirmed');
      await fetchEvents();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to book event');
    } finally {
      setSaving(false);
    }
  };

  const onCancel = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/events/cancel', cancelForm);
      setCancelForm({ eventId: '', customerId: '' });
      setMessage('Cancellation completed');
      await fetchEvents();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to cancel');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="peek-page" dir="rtl">
      <div className="peek-shell space-y-6">
        <div className="peek-header flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-500" />
              Event Booking
            </h1>
            <p className="text-gray-500">Upcoming events, status clarity, and capacity tracking</p>
          </div>
        </div>

        {message && <div className="rounded-lg border px-4 py-2 text-sm bg-white">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="peek-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading events...</p>
              ) : groupedByDate.length === 0 ? (
                <p className="text-gray-500">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {groupedByDate.map(([eventDate, dateEvents]) => (
                    <div key={eventDate} className="border rounded-lg p-3">
                      <p className="font-semibold mb-2">{eventDate}</p>
                      <div className="space-y-2">
                        {dateEvents.map((event) => (
                          <div key={event.id} className="rounded-md bg-gray-50 p-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{event.title}</p>
                              <p className="text-xs text-gray-600">{event.type} • Branch: {event.branchId}</p>
                              <p className="text-xs text-gray-600">{event.startTime} - {event.endTime}</p>
                              {event.customerId && <p className="text-xs text-gray-600">Customer: {event.customerId}</p>}
                              {event.notes && <p className="text-xs text-gray-500">Notes: {event.notes}</p>}
                            </div>
                            <div className="text-left">
                              <p className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[event.status] || 'text-gray-700 bg-gray-100 border-gray-200'}`}>
                                {event.status}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Used: {event.usedCapacity}/{event.capacity}</p>
                              <p className="text-xs text-green-600">Remaining: {event.remainingCapacity}</p>
                              {(event.bookedCustomers || []).length > 0 && (
                                <p className="text-xs text-gray-500">Booked: {event.bookedCustomers.slice(0, 2).join(', ')}{event.bookedCustomers.length > 2 ? '…' : ''}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Event Form</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={onCreate}>
                <input className="w-full border rounded px-3 py-2" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <select className="w-full border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input className="w-full border rounded px-3 py-2" placeholder="Branch ID" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required />
                <input className="w-full border rounded px-3 py-2" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                <div className="grid grid-cols-2 gap-2">
                  <input className="w-full border rounded px-3 py-2" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                  <input className="w-full border rounded px-3 py-2" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="w-full border rounded px-3 py-2" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
                  <input className="w-full border rounded px-3 py-2" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <select className="w-full border rounded px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="scheduled">scheduled</option>
                  <option value="full">full</option>
                  <option value="cancelled">cancelled</option>
                </select>
                <input className="w-full border rounded px-3 py-2" placeholder="Customer ID (optional)" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
                <textarea className="w-full border rounded px-3 py-2" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                <Button type="submit" className="w-full" disabled={saving}>Create Event</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="peek-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-4 h-4" />Book Event</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={onBook}>
                <input className="w-full border rounded px-3 py-2" placeholder="Event ID" value={bookingForm.eventId} onChange={(e) => setBookingForm({ ...bookingForm, eventId: e.target.value })} required />
                <input className="w-full border rounded px-3 py-2" placeholder="Customer ID" value={bookingForm.customerId} onChange={(e) => setBookingForm({ ...bookingForm, customerId: e.target.value })} required />
                <Button type="submit" className="w-full" disabled={saving}>Book</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="peek-card">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><XCircle className="w-4 h-4" />Cancel Booking / Event</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={onCancel}>
                <input className="w-full border rounded px-3 py-2" placeholder="Event ID" value={cancelForm.eventId} onChange={(e) => setCancelForm({ ...cancelForm, eventId: e.target.value })} required />
                <input className="w-full border rounded px-3 py-2" placeholder="Customer ID (optional)" value={cancelForm.customerId} onChange={(e) => setCancelForm({ ...cancelForm, customerId: e.target.value })} />
                <Button type="submit" variant="outline" className="w-full" disabled={saving}>Cancel</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventBooking;
