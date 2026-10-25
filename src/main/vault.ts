import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface VaultItem {
  id: string;
  title: string;
  category: 'note' | 'credential' | 'code' | 'bookmark';
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  items: VaultItem[];
}

export class LocalVaultManager {
  private vaultFile: string;
  private currentKey: Buffer | null = null;
  private currentSalt: Buffer | null = null;
  private unlockedData: VaultData | null = null;

  constructor(dataDir: string) {
    this.vaultFile = path.join(dataDir, 'vault.enc');
  }

  public isInitialized(): boolean {
    return fs.existsSync(this.vaultFile);
  }

  public isUnlocked(): boolean {
    return this.currentKey !== null && this.unlockedData !== null;
  }

  /**
   * Derives a 256-bit AES key using PBKDF2 with 100,000 iterations
   */
  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  /**
   * Initializes a brand-new encrypted vault with master password
   */
  public initialize(masterPassword: string): boolean {
    if (!masterPassword || masterPassword.length < 6) {
      throw new Error('Master password must be at least 6 characters long.');
    }

    const salt = crypto.randomBytes(32);
    const key = this.deriveKey(masterPassword, salt);
    this.currentSalt = salt;
    this.currentKey = key;
    this.unlockedData = { items: [] };

    this.saveEncrypted(salt);
    return true;
  }

  /**
   * Unlocks existing vault with master password
   */
  public unlock(masterPassword: string): VaultData {
    if (!this.isInitialized()) {
      throw new Error('Vault is not yet initialized.');
    }

    try {
      const fileBuffer = fs.readFileSync(this.vaultFile);
      // Format: [32 bytes salt][12 bytes IV][16 bytes auth tag][ciphertext]
      if (fileBuffer.length < 60) {
        throw new Error('Vault file is corrupted or incomplete.');
      }

      const salt = fileBuffer.subarray(0, 32);
      const iv = fileBuffer.subarray(32, 44);
      const tag = fileBuffer.subarray(44, 60);
      const ciphertext = fileBuffer.subarray(60);

      const key = this.deriveKey(masterPassword, salt);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const data: VaultData = JSON.parse(decrypted.toString('utf-8'));

      this.currentSalt = salt;
      this.currentKey = key;
      this.unlockedData = data;
      return data;
    } catch {
      throw new Error('Incorrect master password or corrupted vault file.');
    }
  }

  /**
   * Saves updated vault items using AES-256-GCM
   */
  public saveItems(items: VaultItem[]): boolean {
    if (!this.currentKey || !this.currentSalt) {
      throw new Error('Vault is locked. Cannot save items.');
    }

    this.unlockedData = { items };
    this.saveEncrypted(this.currentSalt);
    return true;
  }

  private saveEncrypted(salt: Buffer): void {
    if (!this.currentKey || !this.unlockedData) return;

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.currentKey, iv);
    const payload = Buffer.from(JSON.stringify(this.unlockedData), 'utf-8');

    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    const tag = cipher.getAuthTag();

    const outputBuffer = Buffer.concat([salt, iv, tag, encrypted]);
    fs.writeFileSync(this.vaultFile, outputBuffer);
  }

  /**
   * Immediately clears key from memory and locks the vault
   */
  public lock(): void {
    if (this.currentKey) {
      this.currentKey.fill(0); // Zero out key memory
      this.currentKey = null;
    }
    if (this.currentSalt) {
      this.currentSalt.fill(0);
      this.currentSalt = null;
    }
    this.unlockedData = null;
  }

  public getItems(): VaultItem[] {
    if (!this.unlockedData) {
      throw new Error('Vault is locked.');
    }
    return this.unlockedData.items;
  }
}
