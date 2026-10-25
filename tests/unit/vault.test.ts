import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LocalVaultManager, VaultItem } from '../../src/main/vault';

describe('LocalVaultManager (NOVA Vault)', () => {
  let tempDir: string;
  let vaultManager: LocalVaultManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-vault-test-'));
    vaultManager = new LocalVaultManager(tempDir);
  });

  afterEach(() => {
    vaultManager.lock();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports uninitialized state on a fresh directory', () => {
    expect(vaultManager.isInitialized()).toBe(false);
    expect(vaultManager.isUnlocked()).toBe(false);
  });

  it('enforces minimum master password length', () => {
    expect(() => vaultManager.initialize('12345')).toThrow(
      'Master password must be at least 6 characters long.'
    );
  });

  it('initializes and saves vault securely', () => {
    const initialized = vaultManager.initialize('MasterP@ssw0rd!');
    expect(initialized).toBe(true);
    expect(vaultManager.isInitialized()).toBe(true);
    expect(vaultManager.isUnlocked()).toBe(true);
    expect(vaultManager.getItems()).toEqual([]);

    const vaultFile = path.join(tempDir, 'vault.enc');
    expect(fs.existsSync(vaultFile)).toBe(true);
    const content = fs.readFileSync(vaultFile);
    // [32 salt] + [12 IV] + [16 tag] = 60 bytes minimum header
    expect(content.length).toBeGreaterThanOrEqual(60);
  });

  it('locks vault and securely zeroes memory', () => {
    vaultManager.initialize('MasterP@ssw0rd!');
    expect(vaultManager.isUnlocked()).toBe(true);

    vaultManager.lock();
    expect(vaultManager.isUnlocked()).toBe(false);
    expect(() => vaultManager.getItems()).toThrow('Vault is locked.');
  });

  it('unlocks vault with correct password and retrieves stored items', () => {
    vaultManager.initialize('MasterP@ssw0rd!');
    const items: VaultItem[] = [
      {
        id: 'item-1',
        title: 'Recovery Seed',
        category: 'code',
        content: 'alpha bravo charlie delta',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    vaultManager.saveItems(items);
    vaultManager.lock();

    // Create a new manager instance simulating browser restart
    const reopenedManager = new LocalVaultManager(tempDir);
    expect(reopenedManager.isInitialized()).toBe(true);
    expect(reopenedManager.isUnlocked()).toBe(false);

    const unlockedData = reopenedManager.unlock('MasterP@ssw0rd!');
    expect(unlockedData.items.length).toBe(1);
    expect(unlockedData.items[0].title).toBe('Recovery Seed');
    expect(unlockedData.items[0].content).toBe('alpha bravo charlie delta');
  });

  it('rejects incorrect master password', () => {
    vaultManager.initialize('CorrectPassword123');
    vaultManager.lock();

    const reopenedManager = new LocalVaultManager(tempDir);
    expect(() => reopenedManager.unlock('WrongPassword')).toThrow(
      'Incorrect master password or corrupted vault file.'
    );
    expect(reopenedManager.isUnlocked()).toBe(false);
  });

  it('detects tampering or corrupted vault data (authenticated encryption tag)', () => {
    vaultManager.initialize('CorrectPassword123');
    vaultManager.lock();

    // Tamper with ciphertext bytes in vault.enc
    const vaultFile = path.join(tempDir, 'vault.enc');
    const data = fs.readFileSync(vaultFile);
    data[data.length - 1] ^= 0xff; // Flip bits in ciphertext
    fs.writeFileSync(vaultFile, data);

    const tamperedManager = new LocalVaultManager(tempDir);
    expect(() => tamperedManager.unlock('CorrectPassword123')).toThrow(
      'Incorrect master password or corrupted vault file.'
    );
  });
});
