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

describe('ParentDailyReport', () => {
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

  it('renders NOTE logs from localStorage', async () => {
    const date = new Date().toISOString().slice(0, 10);

    localStorage.setItem('token', 'test');
    localStorage.setItem(
      'user',
      JSON.stringify({ role: 'PARENT', display_name: 'Test Parent' })
    );
    localStorage.setItem(
      `childLogs:1:${date}`,
      JSON.stringify([
        {
          id: 'n1',
          type: 'NOTE',
          payload: { text: 'ملاحظة من المعلمة' },
          createdAt: new Date().toISOString(),
        },
      ])
    );

    window.history.pushState({}, '', '/parent/daily-report');

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

    expect(container.textContent).toContain('ملاحظة من المعلمة');
  });
});
