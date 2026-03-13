import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import App from './App';
import api from './services/api';

jest.mock('@/App.css', () => ({}), { virtual: true });
jest.mock('@/lib/utils', () => ({ cn: (...classes) => classes.filter(Boolean).join(' ') }), { virtual: true });

jest.mock('react-router-dom', () => {
  const React = require('react');

  const BrowserRouter = ({ children }) => <>{children}</>;
  const Route = ({ element }) => element;
  const Routes = ({ children }) => {
    const pathname = globalThis.window.location.pathname;
    const routes = React.Children.toArray(children).filter(Boolean);
    const exactMatch = routes.find((child) => child.props?.path === pathname);
    const wildcardMatch = routes.find((child) => child.props?.path === '*');
    const selected = exactMatch || wildcardMatch;
    return selected ? selected.props.element : null;
  };

  const Navigate = ({ to, replace }) => {
    if (replace) {
      globalThis.window.history.replaceState({}, '', to);
    } else {
      globalThis.window.history.pushState({}, '', to);
    }
    return null;
  };

  const Link = ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  );

  return { BrowserRouter, Navigate, Route, Routes, Link };
}, { virtual: true });

jest.mock('./pages/TeacherChildLog', () => () => <div>TeacherChildLog</div>);

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    defaults: { headers: { common: {} } },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ParentDashboard', () => {
  let container;
  let root;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders parent dashboard sections', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'PARENT', display_name: 'Parent User' }));

    api.get.mockImplementation((url) => {
      if (url === '/parent/feed') return Promise.resolve({ data: [{ id: 'f1', type: 'daily_report', title: 'Daily', description: 'Report', photo_url: 'x' }] });
      if (url === '/parent/attendance') return Promise.resolve({ data: [{ session_id: 's1', date: '2026-03-01', check_in: new Date().toISOString(), check_out: new Date().toISOString() }] });
      if (url === '/parent/payments') return Promise.resolve({ data: { subscription_status: 'ACTIVE', visit_pack: { name: '10 Visits Pack', status: 'ACTIVE', visits_remaining: 5 }, payment_history: [{ payment_id: 'p1', description: 'Monthly', amount: 100, currency: 'JOD', status: 'COMPLETED' }], recent_orders: [{ order_id: 'o1', total_amount: 100, currency: 'JOD', status: 'PAID', created_at: new Date().toISOString() }] } });
      if (url === '/parent/messages') return Promise.resolve({ data: [{ id: 'm1', subject: 'Hello', body: 'Message' }] });
      if (url === '/parent/bookings') return Promise.resolve({ data: { session_visits: [{ booking_id: 'b1', service: 'Session', date: '2026-03-10', time: '10:00', status: 'CONFIRMED' }], upcoming_event: { title: 'Family workshop', status: 'OPEN', start_at: new Date().toISOString() } } });
      return Promise.resolve({ data: [] });
    });

    localStorage.setItem('children', JSON.stringify([{ child_id: '1', full_name: 'Lina' }]));
    window.history.pushState({}, '', '/parent/dashboard');

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('Parent Portal Dashboard');
    expect(container.textContent).toContain('Activity Feed');
    expect(container.textContent).toContain('Attendance History');
    expect(container.textContent).toContain('Subscription / Pack Status');
    expect(container.textContent).toContain('Recent Payment / Order');
    expect(container.textContent).toContain('Upcoming Event / Booking');
  });
});
