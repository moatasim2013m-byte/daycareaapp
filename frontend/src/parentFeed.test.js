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

  const Routes = ({ children }) => {
    const pathname = globalThis.window.location.pathname;
    const routes = React.Children.toArray(children).filter(Boolean);
    const activeRoute = routes.find((child) => child.props?.path === pathname);
    if (activeRoute) {
      return activeRoute.props.element;
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

  return { BrowserRouter, Navigate, Route, Routes, Link };
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

describe('ParentFeed', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    localStorage.clear();
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

  it('shows room and child posts from localStorage', async () => {
    const date = new Date().toISOString().slice(0, 10);
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ role: 'PARENT' }));
    localStorage.setItem(
      `activityFeed:${date}`,
      JSON.stringify([
        { id: 'r1', caption: 'نشاط للغرفة', createdAt: new Date().toISOString(), targetType: 'ROOM' },
      ]),
    );
    localStorage.setItem(
      `activityFeedChild:1:${date}`,
      JSON.stringify([
        {
          id: 'c1',
          caption: 'نشاط للطفل',
          createdAt: new Date().toISOString(),
          targetType: 'CHILD',
          childId: '1',
        },
      ]),
    );
    globalThis.window.history.pushState({}, '', '/parent/feed');

    await act(async () => {
      root.render(<App />);
      await flush();
      await flush();
    });

    const childIdInput = container.querySelector('input[aria-label="childId"]');
    if (childIdInput) {
      await act(async () => {
        Simulate.change(childIdInput, { target: { value: '1' } });
        await flush();
      });
    }

    expect(container.textContent).toContain('نشاط للغرفة');
    expect(container.textContent).toContain('نشاط للطفل');
  });
});
