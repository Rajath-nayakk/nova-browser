import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Production Packaging & Installer Configuration', () => {
  const pkgPath = path.resolve(__dirname, '../../package.json');

  it('validates package.json build configuration', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    expect(pkg.build).toBeDefined();
    expect(pkg.build.appId).toBe('com.novabrowser.app');
    expect(pkg.build.productName).toBe('NOVA Browser');
    expect(pkg.build.copyright).toContain('NOVA Browser');
    expect(pkg.build.directories.output).toBe('release');
  });

  it('configures hardened Windows NSIS and portable targets', () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const win = pkg.build.win;
    const nsis = pkg.build.nsis;
    const portable = pkg.build.portable;

    expect(win.target).toContain('nsis');
    expect(win.target).toContain('portable');
    expect(win.requestedExecutionLevel).toBe('asInvoker');

    expect(nsis.oneClick).toBe(false);
    expect(nsis.allowToChangeInstallationDirectory).toBe(true);
    expect(nsis.shortcutName).toBe('NOVA Browser');
    expect(nsis.artifactName).toBe('${productName}-Setup-${version}.${ext}');

    expect(portable.artifactName).toBe('${productName}-Portable-${version}.${ext}');
  });

  it('includes packaging scripts in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.scripts['package:dir']).toBeDefined();
    expect(pkg.scripts['package:win']).toBeDefined();
    expect(pkg.scripts['package:portable']).toBeDefined();
    expect(pkg.scripts['package:all']).toBeDefined();
  });
});
