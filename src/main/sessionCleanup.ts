import { session } from 'electron';

export interface CleanupResult {
  clearedStorage: boolean;
  clearedCache: boolean;
  error?: string;
}

/**
 * Performs secure session data cleanup (cookies, cache, local storage, indexedDB, service workers)
 */
export async function performSessionDataCleanup(
  targetSession?: Electron.Session
): Promise<CleanupResult> {
  const sess = targetSession || session.defaultSession;
  try {
    await sess.clearStorageData({
      storages: [
        'cookies',
        'filesystem',
        'indexdb',
        'localstorage',
        'shadercache',
        'serviceworkers',
        'cachestorage',
      ],
    });
    await sess.clearCache();
    return { clearedStorage: true, clearedCache: true };
  } catch (err: any) {
    return {
      clearedStorage: false,
      clearedCache: false,
      error: err?.message || String(err),
    };
  }
}
