import { describe, it, expect } from 'vitest';
import { ToastMessage, ToastType } from '../../src/renderer/src/components/Toast';

describe('Toast Notifications System (M1.5)', () => {
  it('constructs well-formed toast message objects', () => {
    const toast: ToastMessage = {
      id: 'toast-1',
      text: 'Bookmark saved successfully',
      type: 'success',
      durationMs: 3200,
    };

    expect(toast.id).toBe('toast-1');
    expect(toast.text).toBe('Bookmark saved successfully');
    expect(toast.type).toBe('success');
    expect(toast.durationMs).toBe(3200);
  });

  it('supports all valid notification types', () => {
    const types: ToastType[] = ['info', 'success', 'warning', 'error'];
    types.forEach((type) => {
      const toast: ToastMessage = {
        id: `toast-${type}`,
        text: `Testing ${type}`,
        type,
        durationMs: 2000,
      };
      expect(toast.type).toBe(type);
    });
  });
});
