import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('react-router-dom', () => {
  const React = require('react');

  const BrowserRouter = ({ children }) => {
    const [, setTick] = React.useState(0);

    React.useEffect(() => {
      const onChange = () => setTick((value) => value + 1);
      globalThis.window.addEventListener('popstate', onChange);
      return () => globalThis.window.removeEventListener('popstate', onChange);
    }, []);

    return <>{children}</>;
  };

  const Route = () => null;

  const Routes = ({ children }) => {
    const routeList = React.Children.toArray(children);
    const currentPath = globalThis.window.location.pathname;

    const exactMatch = routeList.find((child) => child?.props?.path === currentPath);
    if (exactMatch) {
      return exactMatch.props.element;
    }

    const wildcardMatch = routeList.find((child) => child?.props?.path === '*');
    return wildcardMatch ? wildcardMatch.props.element : null;
  };

  const Navigate = ({ to, replace }) => {
    React.useEffect(() => {
      if (replace) {
        globalThis.window.history.replaceState({}, '', to);
      } else {
        globalThis.window.history.pushState({}, '', to);
      }
      globalThis.window.dispatchEvent(new globalThis.PopStateEvent('popstate'));
    }, [to, replace]);

    return null;
  };

  const Link = ({ to, children, ...props }) => (
    <a
      href={to}
      onClick={(event) => {
        event.preventDefault();
        globalThis.window.history.pushState({}, '', to);
        globalThis.window.dispatchEvent(new globalThis.PopStateEvent('popstate'));
      }}
      {...props}
    >
      {children}
    </a>
  );

  return { BrowserRouter, Navigate, Route, Routes, Link };
}, { virtual: true });

jest.mock('@/App.css', () => ({}), { virtual: true });
jest.mock('@/lib/utils', () => ({ cn: (...classes) => classes.filter(Boolean).join(' ') }), { virtual: true });

jest.mock('./services/api', () => {
  const mockApi = {
    get: jest.fn((url) => {
      if (url === '/reports/daily-summary') {
        return Promise.resolve({
          data: {
            revenue: { total: 0, overtime: 0, walk_in: 0, subscriptions: 0, visit_packs: 0 },
            sessions: { total: 0 },
            sales: { subscriptions: { by_plan: {} }, visit_packs: 0 }
          }
        });
      }

      if (url === '/sessions/active') {
        return Promise.resolve({ data: [] });
      }

      return Promise.resolve({ data: {} });
    }),
    post: jest.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  };

  return {
    __esModule: true,
    default: mockApi
  };
});

import App from './App';

describe('Dashboard guide navigation', () => {
  let container;
  let root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', display_name: 'Test Admin' }));

    globalThis.window.history.pushState({}, '', '/');

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount();
      });
    }

    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    localStorage.clear();
    jest.clearAllMocks();
  });

  it('routes to the parent communication guide when clicking dashboard guide link', async () => {
    await act(async () => {
      root.render(<App />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const guideLink = Array.from(container.querySelectorAll('a')).find((anchor) =>
      anchor.textContent.includes('دليل التواصل مع أولياء الأمور')
    );

    expect(guideLink).toBeTruthy();

    await act(async () => {
      guideLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    });

    await act(async () => {
      await Promise.resolve();
      root.render(<App />);
    });

    expect(globalThis.window.location.pathname).toBe('/guides/parent-communication-step-4');
    expect(container.textContent).toContain('Step 4/7');
    expect(container.textContent).toContain('Share Activity Updates');
  });
});
