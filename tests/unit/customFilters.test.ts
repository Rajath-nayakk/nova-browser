import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { FilterEngineManager } from '../../src/main/filterEngine';

describe('NOVA Shield Custom User Filter Rules', () => {
  let tempDir: string;
  let filterManager: FilterEngineManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-custom-filter-test-'));
    filterManager = new FilterEngineManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('compiles custom user network blocking rules and blocks matched requests', () => {
    const res = filterManager.setCustomRules([
      '||custom-ad-network.xyz^',
      '||malicious-telemetry.com^$third-party',
    ]);
    expect(res.success).toBe(true);
    expect(res.ruleCount).toBe(2);

    const match = filterManager.match(
      'https://custom-ad-network.xyz/serve/ad.js',
      'https://my-blog.com',
      'script'
    );
    expect(match.blocked).toBe(true);
  });

  it('compiles custom cosmetic element hiding rules', () => {
    filterManager.setCustomRules(['example.com##.sponsored-deal-banner']);

    const styles = filterManager.getCosmeticFilters('https://example.com/article', 'example.com');
    expect(styles).toContain('.sponsored-deal-banner');
  });

  it('filters out comments and empty lines safely', () => {
    const res = filterManager.setCustomRules([
      '! This is a comment',
      '   ',
      '||tracker-domain.net^',
      '! Another comment line',
    ]);
    expect(res.success).toBe(true);
    expect(res.ruleCount).toBe(1);

    const match = filterManager.match('https://tracker-domain.net/pixel.gif');
    expect(match.blocked).toBe(true);
  });

  it('exposes custom filter list entry in getFilterLists', () => {
    filterManager.setCustomRules(['||sponsor.com^']);
    const lists = filterManager.getFilterLists();
    const customList = lists.find((l) => l.id === 'user-custom-filters');
    expect(customList).toBeDefined();
    expect(customList?.name).toBe('My Custom Rules');
    expect(customList?.ruleCount).toBe(1);
    expect(customList?.isCustom).toBe(true);
  });

  it('handles clearing custom rules cleanly', () => {
    filterManager.setCustomRules(['||temporary-block.org^']);
    expect(filterManager.match('https://temporary-block.org/test').blocked).toBe(true);

    filterManager.setCustomRules([]);
    expect(filterManager.match('https://temporary-block.org/test').blocked).toBe(false);
  });
});
