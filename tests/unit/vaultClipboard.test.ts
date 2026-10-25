import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Vault Clipboard Auto-Clear Manager', () => {
  let clipboardContent = '';
  let lastCopiedSecret = '';
  let countdown: number | null = null;
  let activeId: string | null = null;
  let timeoutId: any = null;
  let intervalId: any = null;

  beforeEach(() => {
    vi.useFakeTimers();
    clipboardContent = '';
    lastCopiedSecret = '';
    countdown = null;
    activeId = null;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const clearClipboardNow = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);
    // Only wipe clipboard if it still holds the copied secret
    if (clipboardContent === lastCopiedSecret) {
      clipboardContent = '';
    }
    countdown = null;
    activeId = null;
  };

  const copySecret = (id: string, text: string) => {
    clipboardContent = text;
    lastCopiedSecret = text;
    activeId = id;
    countdown = 30;

    if (timeoutId) clearTimeout(timeoutId);
    if (intervalId) clearInterval(intervalId);

    intervalId = setInterval(() => {
      if (countdown !== null) {
        countdown = countdown <= 1 ? null : countdown - 1;
      }
    }, 1000);

    timeoutId = setTimeout(() => {
      clearClipboardNow();
    }, 30000);
  };

  it('initiates 30-second countdown on copying sensitive secret', () => {
    copySecret('item-1', 'ultra-secret-password-999');

    expect(clipboardContent).toBe('ultra-secret-password-999');
    expect(countdown).toBe(30);
    expect(activeId).toBe('item-1');

    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10000);
    expect(countdown).toBe(20);
    expect(clipboardContent).toBe('ultra-secret-password-999');
  });

  it('automatically clears clipboard after 30 seconds', () => {
    copySecret('item-2', 'recovery-key-xyz');

    expect(clipboardContent).toBe('recovery-key-xyz');

    // Fast forward full 30 seconds
    vi.advanceTimersByTime(30000);

    expect(clipboardContent).toBe('');
    expect(countdown).toBeNull();
    expect(activeId).toBeNull();
  });

  it('allows user to manually clear clipboard before timeout expires', () => {
    copySecret('item-3', 'bank-pin-4321');
    expect(clipboardContent).toBe('bank-pin-4321');

    vi.advanceTimersByTime(5000);
    expect(countdown).toBe(25);

    // User clicks "Clear Now"
    clearClipboardNow();

    expect(clipboardContent).toBe('');
    expect(countdown).toBeNull();
    expect(activeId).toBeNull();
  });

  it('preserves foreign clipboard content if user copied something else in another app', () => {
    copySecret('item-4', 'vault-token-123');

    // User copies unrelated text outside the vault
    clipboardContent = 'unrelated text from notepad';

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);

    // Should NOT clear the user's new external clipboard item
    expect(clipboardContent).toBe('unrelated text from notepad');
  });

  it('resets timer when a second vault secret is copied', () => {
    copySecret('item-A', 'secret-A');
    vi.advanceTimersByTime(15000);
    expect(countdown).toBe(15);

    // Copy second item
    copySecret('item-B', 'secret-B');
    expect(clipboardContent).toBe('secret-B');
    expect(countdown).toBe(30);
    expect(activeId).toBe('item-B');

    vi.advanceTimersByTime(15000);
    expect(clipboardContent).toBe('secret-B');
    expect(countdown).toBe(15);

    vi.advanceTimersByTime(15000);
    expect(clipboardContent).toBe('');
  });
});
