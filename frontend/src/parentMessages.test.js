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

describe('ParentMessages', () => {
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

  it('renders thread messages from localStorage', async () => {
    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'PARENT', display_name: 'Test Parent' }));
    localStorage.setItem(
      'messagesThread:1',
      JSON.stringify([
        {
          id: 'm1',
          childId: '1',
          fromRole: 'TEACHER',
          text: 'مرحبا من المعلمة',
          createdAt: new Date().toISOString(),
        },
      ])
    );

    window.history.pushState({}, '', '/parent/messages');

    await act(async () => {
      root.render(<App />);
    });

    const childIdInput = container.querySelector('input[name="childId"], input#childId');
    if (childIdInput) {
      await act(async () => {
        childIdInput.value = '1';
        childIdInput.dispatchEvent(new Event('input', { bubbles: true }));
        childIdInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    expect(container.textContent).toContain('مرحبا من المعلمة');
  });
});
