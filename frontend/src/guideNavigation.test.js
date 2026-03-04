import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('@/App.css', () => ({}), { virtual: true });
jest.mock('@/lib/utils', () => ({ cn: (...classes) => classes.filter(Boolean).join(' ') }), { virtual: true });

jest.mock('react-router-dom', () => {
  const React = require('react');

  const RouterContext = React.createContext({ pathname: '/', navigate: () => {} });

  const BrowserRouter = ({ children }) => {
    const [pathname, setPathname] = React.useState(globalThis.window.location.pathname);

    React.useEffect(() => {
      const onPopstate = () => setPathname(globalThis.window.location.pathname);
      globalThis.window.addEventListener('popstate', onPopstate);
      return () => globalThis.window.removeEventListener('popstate', onPopstate);
    }, []);

    const navigate = (to, replace = false) => {
      if (replace) {
        globalThis.window.history.replaceState({}, '', to);
      } else {
        globalThis.window.history.pushState({}, '', to);
      }
      globalThis.window.dispatchEvent(new Event('popstate'));
    };

    return React.createElement(RouterContext.Provider, { value: { pathname, navigate } }, children);
  };

  const Link = ({ to, children, ...props }) => {
    const { navigate } = React.useContext(RouterContext);

    return React.createElement(
      'a',
      {
        href: to,
        onClick: (event) => {
          event.preventDefault();
          navigate(to, false);
        },
        ...props
      },
      children
    );
  };

  const Navigate = ({ to, replace }) => {
    const { navigate } = React.useContext(RouterContext);
    React.useEffect(() => {
      navigate(to, replace);
    }, [to, replace, navigate]);
    return null;
  };

  const Route = () => null;

  const Routes = ({ children }) => {
    const { pathname } = React.useContext(RouterContext);
    const routeElements = React.Children.toArray(children);
    const matched =
      routeElements.find((route) => route.props.path === pathname) ||
      routeElements.find((route) => route.props.path === '*');

    return matched ? matched.props.element : null;
  };

  return { BrowserRouter, Link, Navigate, Route, Routes };
}, { virtual: true });

var mockGet = jest.fn((url) => {
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
});

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    defaults: { headers: { common: {} } }
  }
}));

import App from './App';

const waitFor = async (assertion, timeout = 3000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      assertion();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  assertion();
};

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('Dashboard guide navigation', () => {
  let container;
  let root;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'ADMIN', display_name: 'Admin User' }));
    globalThis.window.history.pushState({}, '', '/');

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(<App />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('routes to the parent communication guide from dashboard link', async () => {
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/reports/daily-summary');
      expect(mockGet).toHaveBeenCalledWith('/sessions/active');
    });

    let guideLink;
    await waitFor(() => {
      guideLink = Array.from(container.querySelectorAll('a')).find((anchor) =>
        anchor.textContent.includes('دليل التواصل مع أولياء الأمور')
      );
      expect(guideLink).toBeTruthy();
    });

    await act(async () => {
      guideLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    });

    await waitFor(() => {
      expect(globalThis.window.location.pathname).toBe('/guides/parent-communication-step-4');
      expect(container.textContent).toContain('Step 4/7');
      expect(container.textContent).toContain('Share Activity Updates');
    });
  });
});
