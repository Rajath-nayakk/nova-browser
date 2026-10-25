import { describe, it, expect } from 'vitest';
import {
  createTabGroup,
  assignTabToGroup,
  removeTabFromGroup,
  toggleGroupCollapse,
  updateTabGroup,
  deleteTabGroup,
  getTabsInGroup,
  isTabVisibleInStrip,
  DEFAULT_GROUP_COLORS,
} from '../../src/shared/tabGroupUtils';
import { Tab, TabGroup } from '../../src/shared/types';

describe('Tab Grouping and Workspace Organization Utilities', () => {
  const createMockTab = (id: string, url = 'https://example.com', groupId?: string): Tab => ({
    id,
    url,
    title: `Tab ${id}`,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    isSecure: true,
    blockedCount: 0,
    isMuted: false,
    zoomFactor: 1.0,
    groupId,
  });

  describe('createTabGroup', () => {
    it('creates a new group with default color and uncollapsed state', () => {
      const group = createTabGroup('Work Tasks');
      expect(group.id).toContain('group_');
      expect(group.title).toBe('Work Tasks');
      expect(DEFAULT_GROUP_COLORS).toContain(group.color);
      expect(group.isCollapsed).toBe(false);
    });

    it('creates a group with custom color', () => {
      const group = createTabGroup('Finance', '#ef4444');
      expect(group.title).toBe('Finance');
      expect(group.color).toBe('#ef4444');
    });

    it('falls back to "New Group" when title is empty', () => {
      const group = createTabGroup('   ');
      expect(group.title).toBe('New Group');
    });
  });

  describe('assignTabToGroup and removeTabFromGroup', () => {
    it('assigns a tab to a specified group ID', () => {
      const tabs = [createMockTab('1'), createMockTab('2')];
      const updated = assignTabToGroup(tabs, '1', 'group_work');
      expect(updated[0].groupId).toBe('group_work');
      expect(updated[1].groupId).toBeUndefined();
    });

    it('removes a tab from a group', () => {
      const tabs = [createMockTab('1', 'https://example.com', 'group_work')];
      const updated = removeTabFromGroup(tabs, '1');
      expect(updated[0].groupId).toBeUndefined();
    });
  });

  describe('toggleGroupCollapse and updateTabGroup', () => {
    it('toggles group collapse state', () => {
      const groups: TabGroup[] = [{ id: 'g1', title: 'Work', color: '#8b5cf6', isCollapsed: false }];
      const collapsed = toggleGroupCollapse(groups, 'g1');
      expect(collapsed[0].isCollapsed).toBe(true);

      const expanded = toggleGroupCollapse(collapsed, 'g1');
      expect(expanded[0].isCollapsed).toBe(false);
    });

    it('updates title and color of an existing group', () => {
      const groups: TabGroup[] = [{ id: 'g1', title: 'Old Title', color: '#8b5cf6' }];
      const updated = updateTabGroup(groups, 'g1', { title: 'New Title', color: '#10b981' });
      expect(updated[0].title).toBe('New Title');
      expect(updated[0].color).toBe('#10b981');
    });
  });

  describe('deleteTabGroup and getTabsInGroup', () => {
    it('filters member tabs in group', () => {
      const tabs = [
        createMockTab('1', 'https://a.com', 'g1'),
        createMockTab('2', 'https://b.com', 'g2'),
        createMockTab('3', 'https://c.com', 'g1'),
      ];
      const members = getTabsInGroup(tabs, 'g1');
      expect(members.map((m) => m.id)).toEqual(['1', '3']);
    });

    it('deletes group and unassigns all member tabs', () => {
      const groups: TabGroup[] = [
        { id: 'g1', title: 'Work', color: '#8b5cf6' },
        { id: 'g2', title: 'Personal', color: '#3b82f6' },
      ];
      const tabs = [
        createMockTab('1', 'https://a.com', 'g1'),
        createMockTab('2', 'https://b.com', 'g2'),
      ];

      const result = deleteTabGroup(groups, tabs, 'g1');
      expect(result.groups.map((g) => g.id)).toEqual(['g2']);
      expect(result.tabs.find((t) => t.id === '1')?.groupId).toBeUndefined();
      expect(result.tabs.find((t) => t.id === '2')?.groupId).toBe('g2');
    });
  });

  describe('isTabVisibleInStrip', () => {
    const groups: TabGroup[] = [
      { id: 'g_open', title: 'Open', color: '#10b981', isCollapsed: false },
      { id: 'g_closed', title: 'Closed', color: '#f59e0b', isCollapsed: true },
    ];

    it('shows tabs with no group', () => {
      const tab = createMockTab('1');
      expect(isTabVisibleInStrip(tab, groups, '2')).toBe(true);
    });

    it('shows tabs in an expanded group', () => {
      const tab = createMockTab('1', 'https://a.com', 'g_open');
      expect(isTabVisibleInStrip(tab, groups, '2')).toBe(true);
    });

    it('hides inactive tabs in a collapsed group', () => {
      const tab = createMockTab('1', 'https://a.com', 'g_closed');
      expect(isTabVisibleInStrip(tab, groups, '2')).toBe(false);
    });

    it('keeps active tab visible even if its group is collapsed', () => {
      const tab = createMockTab('1', 'https://a.com', 'g_closed');
      expect(isTabVisibleInStrip(tab, groups, '1')).toBe(true);
    });
  });
});
