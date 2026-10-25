import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Distraction-Free Reader Mode View & Navigation Integration', () => {
  const readerViewPath = path.resolve(__dirname, '../../src/renderer/src/views/ReaderView.tsx');
  const appPath = path.resolve(__dirname, '../../src/renderer/src/App.tsx');
  const addressBarPath = path.resolve(__dirname, '../../src/renderer/src/components/AddressBar.tsx');

  it('verifies ReaderView component exists and includes typography and theme controls', () => {
    expect(fs.existsSync(readerViewPath)).toBe(true);
    const content = fs.readFileSync(readerViewPath, 'utf-8');

    expect(content).toContain('NOVA Reader Mode');
    expect(content).toContain('setFontFamily');
    expect(content).toContain('setReaderTheme');
    expect(content).toContain('setFontSize');
    expect(content).toContain('sepia');
    expect(content).toContain('serif');
    expect(content).toContain('Back to Page');
  });

  it('verifies App.tsx routes nova://reader to ReaderView', () => {
    const content = fs.readFileSync(appPath, 'utf-8');
    expect(content).toContain("case 'reader':");
    expect(content).toContain('<ReaderView');
  });

  it('verifies AddressBar provides reader mode toggle button', () => {
    const content = fs.readFileSync(addressBarPath, 'utf-8');
    expect(content).toContain('BookOpen');
    expect(content).toContain('nova://reader?url=');
    expect(content).toContain('Toggle Distraction-Free Reader Mode');
  });
});
