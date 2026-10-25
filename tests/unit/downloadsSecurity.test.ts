import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { analyzeFileRisk, isExecutableFile } from '../../src/shared/validation';

describe('Downloads File Security and Risk Analysis', () => {
  it('correctly detects dangerous executable extensions', () => {
    expect(isExecutableFile('setup.exe')).toBe(true);
    expect(isExecutableFile('INSTALLER.MSI')).toBe(true);
    expect(isExecutableFile('script.bat')).toBe(true);
    expect(isExecutableFile('payload.cmd')).toBe(true);
    expect(isExecutableFile('automation.ps1')).toBe(true);
    expect(isExecutableFile('macro.vbs')).toBe(true);
    expect(isExecutableFile('shortcut.pif')).toBe(true);
    expect(isExecutableFile('screensaver.scr')).toBe(true);
  });

  it('does not flag benign file formats as executable', () => {
    expect(isExecutableFile('document.pdf')).toBe(false);
    expect(isExecutableFile('photo.png')).toBe(false);
    expect(isExecutableFile('archive.zip')).toBe(false);
    expect(isExecutableFile('audio.mp3')).toBe(false);
    expect(isExecutableFile('dataset.csv')).toBe(false);
    expect(isExecutableFile('README.md')).toBe(false);
  });

  it('categorizes executables with security warning', () => {
    const analysis = analyzeFileRisk('installer.exe');
    expect(analysis.category).toBe('executable');
    expect(analysis.isDangerous).toBe(true);
    expect(analysis.extension).toBe('.exe');
    expect(analysis.warning).toContain('Verify integrity before running');
  });

  it('categorizes shell scripts and command scripts as dangerous scripts', () => {
    const analysis = analyzeFileRisk('run_setup.bat');
    expect(analysis.category).toBe('script');
    expect(analysis.isDangerous).toBe(true);
    expect(analysis.extension).toBe('.bat');
    expect(analysis.warning).toContain('Script files can execute command line instructions');
  });

  it('categorizes archives, documents, media, and code safely', () => {
    const zip = analyzeFileRisk('project.zip');
    expect(zip.category).toBe('archive');
    expect(zip.isDangerous).toBe(false);

    const doc = analyzeFileRisk('report.pdf');
    expect(doc.category).toBe('document');
    expect(doc.isDangerous).toBe(false);

    const img = analyzeFileRisk('avatar.webp');
    expect(img.category).toBe('media');
    expect(img.isDangerous).toBe(false);

    const code = analyzeFileRisk('index.ts');
    expect(code.category).toBe('code');
    expect(code.isDangerous).toBe(false);
  });

  it('computes sha256 checksums reliably matching crypto standards', () => {
    const data = Buffer.from('NOVA Browser Secure File Transfer');
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);

    // Verify determinism
    const hash2 = crypto.createHash('sha256').update(data).digest('hex');
    expect(hash).toBe(hash2);
  });
});
