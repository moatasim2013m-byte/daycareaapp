import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import App from './App';

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

describe('Teacher pickup check', () => {
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

  it('renders pickup check flow and writes verification to today log', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'STAFF', display_name: 'Test Staff' }));
    localStorage.setItem(
      'authorizedPickups:1',
      JSON.stringify([
        {
          id: 'p1',
          name: 'أبو أحمد',
          relation: 'الأب',
          phone: '0790000000',
          createdAt: new Date().toISOString(),
        },
      ])
    );

    window.history.pushState({}, '', '/teacher/pickup-check');

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('التحقق من الاستلام');
    expect(container.textContent).toContain('أبو أحمد');

    const verifyButton = Array.from(container.querySelectorAll('button')).find((el) =>
      el.textContent.includes('تم التحقق')
    );

    await act(async () => {
      verifyButton.click();
    });

    expect(container.textContent).toContain('سجل اليوم');
    expect(container.textContent).toContain('أبو أحمد');
  });
});
