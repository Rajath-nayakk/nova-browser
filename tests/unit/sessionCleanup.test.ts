import { describe, it, expect } from 'vitest';
import { performSessionDataCleanup } from '../../src/main/sessionCleanup';

describe('Automatic Session Data Cleanup on Exit', () => {
  it('correctly purges all sensitive storage types and cache on the session', async () => {
    let clearedStorages: string[] = [];
    let cacheCleared = false;

    const mockSession = {
      clearStorageData: async (options: { storages: string[] }) => {
        clearedStorages = options.storages;
      },
      clearCache: async () => {
        cacheCleared = true;
      },
    } as any;

    const result = await performSessionDataCleanup(mockSession);
    expect(result.clearedStorage).toBe(true);
    expect(result.clearedCache).toBe(true);
    expect(cacheCleared).toBe(true);

    expect(clearedStorages).toContain('cookies');
    expect(clearedStorages).toContain('filesystem');
    expect(clearedStorages).toContain('indexdb');
    expect(clearedStorages).toContain('localstorage');
    expect(clearedStorages).toContain('shadercache');
    expect(clearedStorages).toContain('serviceworkers');
    expect(clearedStorages).toContain('cachestorage');
  });

  it('catches and reports storage clearance failures gracefully', async () => {
    const failingSession = {
      clearStorageData: async () => {
        throw new Error('Database locked by active process');
      },
      clearCache: async () => {},
    } as any;

    const result = await performSessionDataCleanup(failingSession);
    expect(result.clearedStorage).toBe(false);
    expect(result.clearedCache).toBe(false);
    expect(result.error).toBe('Database locked by active process');
  });
});
