import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Comprehensive ARIA Accessibility & Focus Trap Audit', () => {
  const cssPath = path.resolve(__dirname, '../../src/renderer/src/index.css');
  const componentsDir = path.resolve(__dirname, '../../src/renderer/src/components');

  it('defines accessible focus-visible styles in index.css', () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain(':focus-visible');
    expect(cssContent).toContain('outline: 2px solid var(--accent)');
    expect(cssContent).toContain('button:focus-visible');
    expect(cssContent).toContain('input:focus-visible');
  });

  it('verifies PermissionModal implements accessible dialog standards', () => {
    const modalPath = path.join(componentsDir, 'PermissionModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('role="alertdialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain('aria-labelledby=');
    expect(content).toContain('aria-describedby=');
    expect(content).toContain("e.key === 'Escape'");
  });

  it('verifies ShortcutsModal implements accessible dialog standards', () => {
    const modalPath = path.join(componentsDir, 'ShortcutsModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain('aria-label="Keyboard Shortcuts"');
    expect(content).toContain("e.key === 'Escape'");
  });

  it('verifies BlockedElementsModal implements accessible dialog standards', () => {
    const modalPath = path.join(componentsDir, 'BlockedElementsModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain('aria-labelledby="blocked-elements-inspector-title"');
    expect(content).toContain("e.key === 'Escape'");
  });

  it('verifies ClearDataModal implements accessible dialog standards', () => {
    const modalPath = path.join(componentsDir, 'ClearDataModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain('aria-labelledby="cleardata-modal-title"');
    expect(content).toContain("e.key === 'Escape'");
  });

  it('verifies AboutModal implements accessible dialog standards', () => {
    const modalPath = path.join(componentsDir, 'AboutModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain('aria-labelledby="about-browser-title"');
    expect(content).toContain("e.key === 'Escape'");
  });

  it('verifies LinkLensModal implements accessible dialog standards', () => {
    const modalPath = path.join(componentsDir, 'LinkLensModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('role="dialog"');
    expect(content).toContain('aria-modal="true"');
    expect(content).toContain('aria-labelledby="linklens-modal-title"');
    expect(content).toContain("e.key === 'Escape'");
  });
});
