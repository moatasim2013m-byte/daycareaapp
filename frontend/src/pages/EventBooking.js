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

const emptyForm = {
  title: '',
  type: 'birthday',
  branchId: '',
  date: '',
  startTime: '10:00',
  endTime: '12:00',
  capacity: 10,
  price: 0,
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

  const groupedByDate = useMemo(() => {
    const group = {};
    events.forEach((event) => {
      if (!group[event.date]) {
        group[event.date] = [];
      }
      group[event.date].push(event);
    });
    return Object.entries(group).sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/events', {
        ...form,
        capacity: Number(form.capacity),
        price: Number(form.price),
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
            <p className="text-gray-500">Calendar view, booking, and capacity tracking</p>
          </div>
        </div>

        {message && <div className="rounded-lg border px-4 py-2 text-sm bg-white">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="peek-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Calendar View</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Loading events...</p>
              ) : groupedByDate.length === 0 ? (
                <p className="text-gray-500">No events scheduled.</p>
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
                              <p className="text-xs text-gray-600">{event.type} • {event.startTime} - {event.endTime}</p>
                            </div>
                            <div className="text-left">
                              <p className="text-xs text-gray-600">Status: {event.status}</p>
                              <p className="text-xs text-gray-600">{event.bookedCount}/{event.capacity}</p>
                              <p className="text-xs text-green-600">Remaining: {event.remainingCapacity}</p>
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
