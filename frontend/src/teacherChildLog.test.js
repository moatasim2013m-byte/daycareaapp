import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@/App.css', () => ({}), { virtual: true });
jest.mock('@/lib/utils', () => ({ cn: (...classes) => classes.filter(Boolean).join(' ') }), { virtual: true });

jest.mock('react-router-dom', () => {
  const React = require('react');

  const BrowserRouter = ({ children }) => <>{children}</>;
  const Route = ({ element }) => element;

  const matchPath = (routePath, pathname) => {
    const routeParts = routePath.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < routeParts.length; i += 1) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(':')) {
        params[routePart.slice(1)] = pathPart;
      } else if (routePart !== pathPart) {
        return null;
      }
    }

    return params;
  };

  const Routes = ({ children }) => {
    const pathname = globalThis.window.location.pathname;
    const routes = React.Children.toArray(children).filter(Boolean);

    for (const child of routes) {
      const path = child.props?.path;
      if (!path || path === '*') continue;

      const params = matchPath(path, pathname);
      if (params) {
        globalThis.__TEST_ROUTE_PARAMS__ = params;
        return child.props.element;
      }
    }

    const wildcardMatch = routes.find((child) => child.props?.path === '*');
    return wildcardMatch ? wildcardMatch.props.element : null;
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

  const useParams = () => globalThis.__TEST_ROUTE_PARAMS__ || {};

  return { BrowserRouter, Navigate, Route, Routes, Link, useParams };
}, { virtual: true });

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    defaults: { headers: { common: {} } },
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

import App from './App';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('TeacherChildLog', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
    globalThis.__TEST_ROUTE_PARAMS__ = {};
    globalThis.window.history.pushState({}, '', '/');
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
      await flush();
    });
    container.remove();
    localStorage.clear();
    globalThis.__TEST_ROUTE_PARAMS__ = {};
    jest.clearAllMocks();
  });

  it('renders title and NOTE logs stored in localStorage', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'STAFF', display_name: 'Test Teacher' }));

    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      `childLogs:1:${today}`,
      JSON.stringify([
        {
          id: 'log1',
          type: 'NOTE',
          payload: { text: 'ملاحظة اختبار' },
          createdAt: new Date().toISOString(),
        },
      ])
    );

    globalThis.window.history.pushState({}, '', '/teacher/child/1/log');

    await act(async () => {
      root.render(<App />);
      await flush();
      await flush();
    });

    expect(container.textContent).toContain('سجل الطفل');
    expect(container.textContent).toContain('ملاحظة اختبار');
  });
});
