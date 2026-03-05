import React from 'react';
import { act, Simulate } from 'react-dom/test-utils';
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
        continue;
      }

      if (routePart !== pathPart) {
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
      if (!path || path === '*') {
        continue;
      }

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

jest.mock('./services/api', () => {
  const mockApi = {
    defaults: { headers: { common: {} } },
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  };

  return { __esModule: true, default: mockApi };
});

import App from './App';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const findButtonByText = (container, text) =>
  Array.from(container.querySelectorAll('button')).find((button) => button.textContent.includes(text));

describe('TeacherChildLog daily logs MVP', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
    globalThis.__TEST_ROUTE_PARAMS__ = {};
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
    globalThis.window.history.pushState({}, '', '/');
  });

  it('saves note and keeps it after remount', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'STAFF', display_name: 'Test' }));
    globalThis.window.history.pushState({}, '', '/teacher/child/1/log');

    await act(async () => {
      root.render(<App />);
      await flush();
      await flush();
    });

    const noteTab = findButtonByText(container, 'ملاحظة');
    expect(noteTab).toBeTruthy();

    await act(async () => {
      noteTab.click();
      await flush();
    });

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();

    await act(async () => {
      Simulate.change(textarea, { target: { value: 'ملاحظة اختبار' } });
      await flush();
    });

    const saveButton = findButtonByText(container, 'حفظ');
    expect(saveButton).toBeTruthy();

    await act(async () => {
      saveButton.click();
      await flush();
    });

    expect(container.textContent).toContain('ملاحظة اختبار');

    await act(async () => {
      root.unmount();
      await flush();
    });

    root = createRoot(container);

    await act(async () => {
      root.render(<App />);
      await flush();
      await flush();
    });

    expect(container.textContent).toContain('ملاحظة اختبار');
  });
});
