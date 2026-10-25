import { describe, it, expect } from 'vitest';

interface ShortcutDefinition {
  keys: string[];
  description: string;
  category: 'Tabs & Windows' | 'Navigation' | 'Page & Zoom' | 'Tools & Security';
}

const SHORTCUTS_DATA: ShortcutDefinition[] = [
  { keys: ['Ctrl', 'T'], description: 'Open a new tab', category: 'Tabs & Windows' },
  { keys: ['Ctrl', 'W'], description: 'Close current tab', category: 'Tabs & Windows' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Reopen last closed tab', category: 'Tabs & Windows' },
  { keys: ['Ctrl', 'Shift', 'N'], description: 'Open new private browsing window', category: 'Tabs & Windows' },
  { keys: ['Ctrl', '1 - 8'], description: 'Switch to tab 1 through 8', category: 'Tabs & Windows' },
  { keys: ['Ctrl', '9'], description: 'Switch to the last tab', category: 'Tabs & Windows' },
  { keys: ['Alt', '←'], description: 'Go back to previous page', category: 'Navigation' },
  { keys: ['Alt', '→'], description: 'Go forward to next page', category: 'Navigation' },
  { keys: ['Ctrl', 'R'], description: 'Reload current tab', category: 'Navigation' },
  { keys: ['Ctrl', 'L'], description: 'Focus address bar', category: 'Navigation' },
  { keys: ['Ctrl', 'D'], description: 'Bookmark current page', category: 'Navigation' },
  { keys: ['Ctrl', '+'], description: 'Zoom in (+10%)', category: 'Page & Zoom' },
  { keys: ['Ctrl', '-'], description: 'Zoom out (-10%)', category: 'Page & Zoom' },
  { keys: ['Ctrl', '0'], description: 'Reset zoom to 100%', category: 'Page & Zoom' },
  { keys: ['Ctrl', 'F'], description: 'Find in page', category: 'Page & Zoom' },
  { keys: ['Esc'], description: 'Close find in page / dialogs', category: 'Page & Zoom' },
  { keys: ['Ctrl', 'H'], description: 'Open Browsing History', category: 'Tools & Security' },
  { keys: ['Ctrl', 'J'], description: 'Open Downloads Manager', category: 'Tools & Security' },
  { keys: ['Ctrl', 'B'], description: 'Toggle Bookmarks Toolbar', category: 'Tools & Security' },
  { keys: ['Ctrl', '/'], description: 'Toggle Keyboard Shortcuts Cheat Sheet', category: 'Tools & Security' },
];

function filterShortcuts(items: ShortcutDefinition[], query: string, category: string): ShortcutDefinition[] {
  const lowerQ = query.toLowerCase();
  return items.filter((s) => {
    const matchesCat = category === 'all' || s.category === category;
    const matchesQuery =
      s.description.toLowerCase().includes(lowerQ) ||
      s.keys.some((k) => k.toLowerCase().includes(lowerQ));
    return matchesCat && matchesQuery;
  });
}

describe('Keyboard Shortcuts Cheat Sheet System', () => {
  it('contains comprehensive coverage across all key browser domains', () => {
    const categories = new Set(SHORTCUTS_DATA.map((s) => s.category));
    expect(categories.has('Tabs & Windows')).toBe(true);
    expect(categories.has('Navigation')).toBe(true);
    expect(categories.has('Page & Zoom')).toBe(true);
    expect(categories.has('Tools & Security')).toBe(true);
    expect(SHORTCUTS_DATA.length).toBeGreaterThanOrEqual(18);
  });

  it('filters shortcuts by search query', () => {
    const zoomResults = filterShortcuts(SHORTCUTS_DATA, 'zoom', 'all');
    expect(zoomResults.length).toBeGreaterThanOrEqual(3);
    expect(zoomResults.every((s) => s.description.toLowerCase().includes('zoom'))).toBe(true);

    const privateResults = filterShortcuts(SHORTCUTS_DATA, 'private', 'all');
    expect(privateResults).toHaveLength(1);
    expect(privateResults[0].keys).toContain('Shift');
  });

  it('filters shortcuts by category', () => {
    const nav = filterShortcuts(SHORTCUTS_DATA, '', 'Navigation');
    expect(nav.every((s) => s.category === 'Navigation')).toBe(true);
    expect(nav.some((s) => s.description.includes('Reload'))).toBe(true);
  });

  it('ensures each shortcut has valid, non-empty key bindings', () => {
    for (const item of SHORTCUTS_DATA) {
      expect(item.keys.length).toBeGreaterThan(0);
      expect(item.keys.every((k) => k.trim().length > 0)).toBe(true);
      expect(item.description.trim().length).toBeGreaterThan(0);
    }
  });
});
