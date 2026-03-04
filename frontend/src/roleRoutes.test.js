import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

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

import App from './App';

jest.mock('./services/api', () => {
  const mockApi = {
    defaults: { headers: { common: {} } },
    get: jest.fn((url) => {
      if (url === '/reports/daily-summary') {
        return Promise.resolve({ data: { revenue: { total: 0, overtime: 0 }, sessions: { total: 0 } } });
      }
      if (url === '/sessions/active' || url === '/children') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    }),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  };

  return { __esModule: true, default: mockApi };
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('role routes', () => {
  let container;
  let root;

  const renderAtRoute = async ({ role, route }) => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ role, display_name: 'Test User' }));
    globalThis.window.history.pushState({}, '', route);

    await act(async () => {
      root.render(<App />);
      await flush();
      await flush();
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
      await flush();
    });
    container.remove();
    localStorage.clear();
    jest.clearAllMocks();
    globalThis.window.history.pushState({}, '', '/');
  });

  it('allows STAFF to access /teacher/today', async () => {
    await renderAtRoute({ role: 'STAFF', route: '/teacher/today' });
    expect(container.textContent).toContain('المعلمات — مهام اليوم');
  });

  it('allows PARENT to access /parent/feed', async () => {
    await renderAtRoute({ role: 'PARENT', route: '/parent/feed' });
    expect(container.textContent).toContain('ولي الأمر — الخلاصة اليومية');
  });

  it('redirects PARENT away from /teacher/today to dashboard', async () => {
    await renderAtRoute({ role: 'PARENT', route: '/teacher/today' });
    expect(globalThis.window.location.pathname).toBe('/');
  });
});
