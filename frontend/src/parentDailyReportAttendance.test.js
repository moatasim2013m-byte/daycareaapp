import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import App from './App';

jest.mock('@/App.css', () => ({}), { virtual: true });

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

describe('ParentDailyReport attendance', () => {
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

  it('shows attendance summary with present status', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    localStorage.setItem('token', 'test');
    localStorage.setItem('user', JSON.stringify({ role: 'PARENT', display_name: 'Test Parent' }));
    localStorage.setItem('children', JSON.stringify([{ child_id: 1, full_name: 'طفل 1' }]));
    localStorage.setItem(
      `attendance:1:${today}`,
      JSON.stringify({
        '1': { status: 'PRESENT', updatedAt: now },
      })
    );

    window.history.pushState({}, '', '/parent/daily-report');

    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('ملخص الحضور');
    expect(container.textContent).toContain('حاضر');
  });
});
