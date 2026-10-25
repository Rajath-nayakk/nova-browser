import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Key, Plus, Trash2, Eye, EyeOff, ShieldCheck, Copy, Check, Download, Upload, FileText } from 'lucide-react';
import { NovaLogo } from '../components/NovaLogo';
import { VaultItem } from '@shared/types';

export const VaultView: React.FC = () => {
  const [isInit, setIsInit] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importJsonContent, setImportJsonContent] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'note' | 'credential' | 'code' | 'bookmark'>('note');
  const [newItemContent, setNewItemContent] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!window.novaAPI) return;
    try {
      const init = await window.novaAPI.vaultIsInitialized();
      const unlocked = await window.novaAPI.vaultIsUnlocked();
      setIsInit(init);
      setIsUnlocked(unlocked);
      if (unlocked) {
        const loaded = await window.novaAPI.vaultGetItems();
        setItems(loaded);
      }
    } catch (err: any) {
      console.error('Error checking vault status:', err);
    }
  };

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Master password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await window.novaAPI.vaultInit(password);
      setIsInit(true);
      setIsUnlocked(true);
      setItems([]);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize vault.');
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await window.novaAPI.vaultUnlock(password);
      if (data && Array.isArray(data.items)) {
        setIsUnlocked(true);
        setItems(data.items);
        setPassword('');
      } else {
        setError('Incorrect master password.');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect master password.');
    }
  };

  const handleLock = async () => {
    await window.novaAPI.vaultLock();
    setIsUnlocked(false);
    setItems([]);
    setRevealedIds(new Set());
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !newItemContent.trim()) return;

    const item: VaultItem = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newItemTitle.trim(),
      category: newItemCategory,
      content: newItemContent.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [item, ...items];
    await window.novaAPI.vaultSaveItems(updated);
    setItems(updated);
    setNewItemTitle('');
    setNewItemContent('');
    setShowAddModal(false);
  };

  const handleDeleteItem = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    await window.novaAPI.vaultSaveItems(updated);
    setItems(updated);
  };

  const toggleReveal = (id: string) => {
    const next = new Set(revealedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRevealedIds(next);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError('');
    if (backupPassword.length < 6) {
      setExportError('Backup password must be at least 6 characters long.');
      return;
    }
    try {
      const backupJson = await window.novaAPI.vaultExportBackup(backupPassword);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nova-vault-backup-${new Date().toISOString().split('T')[0]}.novavault`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportModal(false);
      setBackupPassword('');
    } catch (err: any) {
      setExportError(err.message || 'Failed to export backup.');
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImportJsonContent((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    setImportSuccess('');
    if (!importJsonContent) {
      setImportError('Please select a valid .novavault backup file.');
      return;
    }
    if (!backupPassword) {
      setImportError('Please enter the password used when creating this backup.');
      return;
    }
    try {
      const res = await window.novaAPI.vaultImportBackup(importJsonContent, backupPassword);
      const loaded = await window.novaAPI.vaultGetItems();
      setItems(loaded);
      setImportSuccess(`Successfully imported ${res.importedCount} items!`);
      setTimeout(() => {
        setShowImportModal(false);
        setBackupPassword('');
        setImportJsonContent('');
        setImportFileName('');
        setImportSuccess('');
      }, 1200);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import backup.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] text-white p-8 select-none animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/15 border border-purple-500/30 rounded-2xl text-purple-400">
              <Lock size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <NovaLogo size={18} />
                <h1 className="text-xl font-bold tracking-tight text-white">NOVA Encrypted Vault</h1>
              </div>
              <p className="text-xs text-gray-400">
                Client-side authenticated AES-256-GCM encryption with PBKDF2 key derivation.
              </p>
            </div>
          </div>

          {isUnlocked && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setExportError('');
                  setBackupPassword('');
                  setShowExportModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-purple-200 rounded-xl text-xs font-medium transition active:scale-95"
                title="Export encrypted vault backup (.novavault)"
              >
                <Download size={14} />
                Export
              </button>
              <button
                onClick={() => {
                  setImportError('');
                  setImportSuccess('');
                  setBackupPassword('');
                  setImportJsonContent('');
                  setImportFileName('');
                  setShowImportModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 text-indigo-200 rounded-xl text-xs font-medium transition active:scale-95"
                title="Import encrypted vault backup"
              >
                <Upload size={14} />
                Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium transition shadow-lg shadow-purple-600/20 active:scale-95"
              >
                <Plus size={15} />
                Add Item
              </button>
              <button
                onClick={handleLock}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-medium transition active:scale-95"
              >
                <Lock size={15} />
                Lock Vault
              </button>
            </div>
          )}
        </div>

        {/* Lock Screen / Setup Screen */}
        {!isUnlocked && (
          <div className="max-w-md mx-auto bg-[#161926]/90 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400 mb-3">
                <Key size={32} />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                {isInit ? 'Unlock NOVA Vault' : 'Setup Master Password'}
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isInit
                  ? 'Enter your master password to decrypt your stored items.'
                  : 'Create a strong master password to initialize your personal encrypted vault. Keys are never stored in plaintext.'}
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <form onSubmit={isInit ? handleUnlock : handleInit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0b0d14] border border-gray-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition"
                  autoFocus
                />
              </div>

              {!isInit && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Confirm Master Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0b0d14] border border-gray-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition shadow-lg shadow-purple-600/30 active:scale-95"
              >
                {isInit ? 'Unlock Vault' : 'Initialize Encrypted Vault'}
              </button>
            </form>
          </div>
        )}

        {/* Unlocked Vault Contents */}
        {isUnlocked && (
          <div>
            {items.length === 0 ? (
              <div className="text-center py-16 bg-[#161926]/40 border border-dashed border-gray-800 rounded-2xl">
                <ShieldCheck size={40} className="mx-auto text-gray-600 mb-3" />
                <h3 className="text-base font-semibold text-gray-300 mb-1">Vault is empty</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Add secure recovery keys, sensitive notes, or private credentials.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition"
                >
                  Create First Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => {
                  const isRevealed = revealedIds.has(item.id);
                  const isCopied = copiedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="bg-[#161926] border border-gray-800/80 hover:border-gray-700/80 rounded-2xl p-4 transition shadow-lg flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-semibold text-sm text-white truncate">{item.title}</span>
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-[10px] uppercase font-bold">
                            {item.category}
                          </span>
                        </div>

                        <div className="bg-[#0b0d14] border border-gray-800/60 rounded-xl p-3 font-mono text-xs text-gray-300 break-all mb-3 relative min-h-[46px] flex items-center">
                          {isRevealed ? item.content : '••••••••••••••••••••'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800/50">
                        <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleReveal(item.id)}
                            className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                            title={isRevealed ? 'Hide' : 'Reveal'}
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.id, item.content)}
                            className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                            title="Copy to clipboard"
                          >
                            {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition"
                            title="Delete item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn">
              <h3 className="text-base font-bold text-white mb-4">Add Item to Vault</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="e.g. Master Recovery Key"
                    className="w-full bg-[#0b0d14] border border-gray-800 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e: any) => setNewItemCategory(e.target.value)}
                    className="w-full bg-[#0b0d14] border border-gray-800 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="note">Secure Note</option>
                    <option value="credential">Credential</option>
                    <option value="code">Recovery Code</option>
                    <option value="bookmark">Private Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Secret Content</label>
                  <textarea
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    placeholder="Sensitive text to encrypt..."
                    rows={4}
                    className="w-full bg-[#0b0d14] border border-gray-800 focus:border-purple-500 rounded-xl p-3 text-sm text-white outline-none font-mono"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-purple-600/30"
                  >
                    Encrypt & Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Export Encrypted Backup Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#161926] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-400">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Export Encrypted Backup</h3>
                  <p className="text-xs text-gray-400">Create an authenticated AES-256-GCM portable archive.</p>
                </div>
              </div>

              {exportError && (
                <div className="p-2.5 mb-4 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
                  {exportError}
                </div>
              )}

              <form onSubmit={handleExportBackup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Backup Protection Password</label>
                  <input
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)..."
                    className="w-full bg-[#0b0d14] border border-gray-800 focus:border-purple-500 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Your backup will be encrypted with this password. You will need it to restore your vault.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
                  >
                    <Download size={14} />
                    Download Backup
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Backup Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#161926] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import Encrypted Backup</h3>
                  <p className="text-xs text-gray-400">Restore items from a .novavault backup file.</p>
                </div>
              </div>

              {importError && (
                <div className="p-2.5 mb-4 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="p-2.5 mb-4 bg-green-500/15 border border-green-500/30 rounded-xl text-xs text-green-400 text-center flex items-center justify-center gap-1.5">
                  <Check size={14} />
                  {importSuccess}
                </div>
              )}

              <form onSubmit={handleImportBackup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Select Backup File</label>
                  <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-gray-700 hover:border-indigo-500 rounded-xl cursor-pointer bg-[#0b0d14] text-xs text-gray-400 transition">
                    <FileText size={16} />
                    <span>{importFileName || 'Choose .novavault or .json backup'}</span>
                    <input
                      type="file"
                      accept=".novavault,.json"
                      onChange={handleImportFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Backup Password</label>
                  <input
                    type="password"
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Enter backup encryption password..."
                    className="w-full bg-[#0b0d14] border border-gray-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    Decrypt & Restore
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
