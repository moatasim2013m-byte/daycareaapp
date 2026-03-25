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

  it('renders useful parent dashboard sections and working actions', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'PARENT', display_name: 'Parent User' }));

    api.get.mockImplementation((url) => {
      if (url === '/parent/feed') return Promise.resolve({ data: [{ id: 'f1', type: 'daily_report', title: 'Daily', description: 'Report', photo_url: 'x' }] });
      if (url === '/parent/attendance') return Promise.resolve({ data: [{ session_id: 's1', date: '2026-03-01', check_in: new Date().toISOString(), check_out: new Date().toISOString(), status: 'Present' }] });
      if (url === '/parent/payments') return Promise.resolve({ data: { subscription_status: 'ACTIVE', visit_pack: { name: '10 Visits Pack', status: 'ACTIVE', visits_remaining: 5 }, payment_history: [{ payment_id: 'p1', description: 'Monthly', amount: 100, currency: 'JOD', status: 'COMPLETED' }], recent_orders: [{ order_id: 'o1', total_amount: 100, currency: 'JOD', status: 'PAID', created_at: new Date().toISOString() }] } });
      if (url === '/parent/messages') return Promise.resolve({ data: [{ id: 'm1', subject: 'Hello', body: 'Message' }] });
      if (url === '/parent/bookings') return Promise.resolve({ data: { session_visits: [{ booking_id: 'b1', service: 'Session', date: '2026-03-20T10:00:00.000Z', status: 'CONFIRMED' }], upcoming_event: { title: 'Family workshop', status: 'OPEN', start_at: '2026-03-22T11:00:00.000Z' } } });
      return Promise.resolve({ data: [] });
    });

    localStorage.setItem('children', JSON.stringify([{ child_id: '1', full_name: 'Lina', age_years: 3, status: 'ACTIVE', customer_id: 'cust-1' }]));
    window.history.pushState({}, '', '/parent/dashboard');

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('الرئيسية لولي الأمر');
    expect(container.textContent).toContain('ملخص الأطفال');
    expect(container.textContent).toContain('Lina');
    expect(container.textContent).toContain('الباقات والاشتراكات');
    expect(container.textContent).toContain('الزيارات والحضور الأخير');
    expect(container.textContent).toContain('المدفوعات والطلبات');
    expect(container.textContent).toContain('الفعالية أو الحجز القادم');
    expect(container.querySelector('a[href="/parent/messages"]')).not.toBeNull();
    expect(container.querySelector('a[href="/billing"]')).not.toBeNull();
  });

  it('shows helpful empty states when data is missing', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'PARENT', display_name: 'Parent User' }));

    api.get.mockResolvedValue({ data: [] });
    window.history.pushState({}, '', '/parent/dashboard');

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('لا يوجد طفل مرتبط بحسابك حتى الآن');
    expect(container.textContent).toContain('لا توجد باقة نشطة ظاهرة الآن');
    expect(container.textContent).toContain('لا توجد زيارات حديثة حتى الآن');
  });
});
