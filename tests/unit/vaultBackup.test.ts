import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LocalVaultManager, VaultItem } from '../../src/main/vault';

describe('NOVA Encrypted Vault Backup Export and Import', () => {
  let tempDir: string;
  let vault: LocalVaultManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-vault-backup-test-'));
    vault = new LocalVaultManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects backup export when vault is locked or uninitialized', () => {
    expect(() => vault.exportBackup('backupPass123')).toThrow('Vault must be unlocked first');
  });

  it('rejects backup export when password is too short', () => {
    vault.initialize('master123456');
    expect(() => vault.exportBackup('12345')).toThrow('at least 6 characters');
  });

  it('exports an authenticated AES-256-GCM encrypted backup payload', () => {
    vault.initialize('master123456');
    const items: VaultItem[] = [
      {
        id: 'vault-1',
        title: 'Master Recovery Key',
        category: 'code',
        content: 'alpha-bravo-charlie-delta',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];
    vault.saveItems(items);

    const backupJson = vault.exportBackup('secureBackupPassword!');
    const parsed = JSON.parse(backupJson);

    expect(parsed.format).toBe('novavault-v1');
    expect(parsed.version).toBe(1);
    expect(parsed.itemCount).toBe(1);
    expect(parsed.salt).toHaveLength(64); // 32 bytes hex
    expect(parsed.iv).toHaveLength(24); // 12 bytes hex
    expect(parsed.tag).toHaveLength(32); // 16 bytes hex
    expect(parsed.ciphertext).toBeDefined();
    // Ensure plaintext content does not leak into encrypted backup
    expect(backupJson.includes('alpha-bravo-charlie-delta')).toBe(false);
  });

  it('restores exported backup data with matching backup password', () => {
    vault.initialize('master123456');
    const sampleItems: VaultItem[] = [
      {
        id: 'v-item-1',
        title: 'API Secret',
        category: 'credential',
        content: 'sk-nova-secret-999',
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];
    vault.saveItems(sampleItems);

    const backupJson = vault.exportBackup('superSecret123');

    // Create a new vault instance in a separate directory
    const secondDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-vault-target-'));
    const secondVault = new LocalVaultManager(secondDir);
    secondVault.initialize('anotherMasterPass999');

    const result = secondVault.importBackup(backupJson, 'superSecret123');
    expect(result.importedCount).toBe(1);
    expect(result.totalCount).toBe(1);

    const restoredItems = secondVault.getItems();
    expect(restoredItems).toHaveLength(1);
    expect(restoredItems[0].title).toBe('API Secret');
    expect(restoredItems[0].content).toBe('sk-nova-secret-999');

    fs.rmSync(secondDir, { recursive: true, force: true });
  });

  it('fails decryption gracefully if incorrect backup password is supplied', () => {
    vault.initialize('master123456');
    vault.saveItems([
      {
        id: 'v-1',
        title: 'Test',
        category: 'note',
        content: 'sensitive data',
        createdAt: 100,
        updatedAt: 100,
      },
    ]);

    const backupJson = vault.exportBackup('correctPassword123');

    expect(() => vault.importBackup(backupJson, 'wrongPassword456')).toThrow(
      'Failed to decrypt backup. Incorrect backup password or corrupted file.'
    );
  });

  it('rejects invalid or corrupted backup payloads', () => {
    vault.initialize('master123456');

    expect(() => vault.importBackup('{ not valid json', 'anyPassword')).toThrow('Not valid JSON');
    expect(() => vault.importBackup(JSON.stringify({ format: 'legacy' }), 'anyPassword')).toThrow(
      'Unrecognized backup format'
    );
  });

  it('merges imported items without deleting existing unique items', () => {
    vault.initialize('master123456');
    vault.saveItems([
      {
        id: 'item-A',
        title: 'Original Item A',
        category: 'note',
        content: 'Keep me',
        createdAt: 100,
        updatedAt: 100,
      },
    ]);

    // Another vault with items B and updated A
    const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-vault-other-'));
    const otherVault = new LocalVaultManager(otherDir);
    otherVault.initialize('masterOther123');
    otherVault.saveItems([
      {
        id: 'item-A',
        title: 'Updated Item A',
        category: 'note',
        content: 'New content for A',
        createdAt: 100,
        updatedAt: 200,
      },
      {
        id: 'item-B',
        title: 'Item B',
        category: 'credential',
        content: 'Fresh B',
        createdAt: 200,
        updatedAt: 200,
      },
    ]);

    const backup = otherVault.exportBackup('commonBackupPass');
    const importRes = vault.importBackup(backup, 'commonBackupPass');

    expect(importRes.importedCount).toBe(2);
    expect(importRes.totalCount).toBe(2);

    const merged = vault.getItems();
    const itemA = merged.find((i) => i.id === 'item-A');
    const itemB = merged.find((i) => i.id === 'item-B');

    expect(itemA?.content).toBe('New content for A');
    expect(itemB?.content).toBe('Fresh B');

    fs.rmSync(otherDir, { recursive: true, force: true });
  });
});
