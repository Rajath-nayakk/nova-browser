import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LocalStorageManager } from '../../src/main/storage';

describe('NOVA Site Permissions Manager', () => {
  let tempDir: string;
  let storage: LocalStorageManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-perm-mgr-test-'));
    storage = new LocalStorageManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('stores and retrieves per-site hardware permissions independently', () => {
    storage.setSitePermission('https://meet.google.com', 'camera', 'allow');
    storage.setSitePermission('https://meet.google.com', 'microphone', 'allow');
    storage.setSitePermission('https://sketchy-site.xyz', 'camera', 'deny');
    storage.setSitePermission('https://sketchy-site.xyz', 'geolocation', 'deny');

    expect(storage.getSitePermission('https://meet.google.com', 'camera')).toBe('allow');
    expect(storage.getSitePermission('https://meet.google.com', 'microphone')).toBe('allow');
    expect(storage.getSitePermission('https://sketchy-site.xyz', 'camera')).toBe('deny');
    expect(storage.getSitePermission('https://sketchy-site.xyz', 'geolocation')).toBe('deny');
    expect(storage.getSitePermission('https://sketchy-site.xyz', 'notifications')).toBeUndefined();
  });

  it('updates an existing permission decision from allow to deny', () => {
    storage.setSitePermission('https://example.com', 'notifications', 'allow');
    expect(storage.getSitePermission('https://example.com', 'notifications')).toBe('allow');

    storage.setSitePermission('https://example.com', 'notifications', 'deny');
    expect(storage.getSitePermission('https://example.com', 'notifications')).toBe('deny');
  });

  it('revokes a specific permission without affecting other permissions for the same origin', () => {
    storage.setSitePermission('https://app.slack.com', 'notifications', 'allow');
    storage.setSitePermission('https://app.slack.com', 'microphone', 'allow');

    storage.revokeSitePermission('https://app.slack.com', 'microphone');

    expect(storage.getSitePermission('https://app.slack.com', 'microphone')).toBeUndefined();
    expect(storage.getSitePermission('https://app.slack.com', 'notifications')).toBe('allow');
  });

  it('removes the origin record when its last permission is revoked', () => {
    storage.setSitePermission('https://single-perm.com', 'camera', 'allow');
    storage.revokeSitePermission('https://single-perm.com', 'camera');

    const allPerms = storage.getSettings().sitePermissions;
    expect(allPerms['https://single-perm.com']).toBeUndefined();
  });

  it('revokes all permissions for an origin in one action', () => {
    storage.setSitePermission('https://multi-perm.com', 'camera', 'allow');
    storage.setSitePermission('https://multi-perm.com', 'microphone', 'allow');
    storage.setSitePermission('https://multi-perm.com', 'geolocation', 'deny');

    storage.revokeSitePermission('https://multi-perm.com');

    const allPerms = storage.getSettings().sitePermissions;
    expect(allPerms['https://multi-perm.com']).toBeUndefined();
  });

  it('clears all site permissions across all origins', () => {
    storage.setSitePermission('https://site-a.com', 'camera', 'allow');
    storage.setSitePermission('https://site-b.com', 'microphone', 'deny');
    storage.setSitePermission('https://site-c.com', 'notifications', 'allow');

    storage.updateSettings({ sitePermissions: {} });

    const allPerms = storage.getSettings().sitePermissions;
    expect(Object.keys(allPerms)).toHaveLength(0);
  });
});
