import { Tab, TabGroup } from './types';

export const DEFAULT_GROUP_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
];

/**
 * Creates a new TabGroup with a generated ID and default color.
 */
export function createTabGroup(title: string, color?: string): TabGroup {
  const chosenColor = color || DEFAULT_GROUP_COLORS[Math.floor(Math.random() * DEFAULT_GROUP_COLORS.length)];
  return {
    id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim() || 'New Group',
    color: chosenColor,
    isCollapsed: false,
  };
}

/**
 * Assigns a specific tab to a tab group.
 */
export function assignTabToGroup(tabs: Tab[], tabId: string, groupId?: string): Tab[] {
  return tabs.map((tab) => {
    if (tab.id === tabId) {
      return { ...tab, groupId: groupId || undefined };
    }
    return tab;
  });
}

/**
 * Removes a specific tab from its group.
 */
export function removeTabFromGroup(tabs: Tab[], tabId: string): Tab[] {
  return assignTabToGroup(tabs, tabId, undefined);
}

/**
 * Toggles the collapsed state of a tab group.
 */
export function toggleGroupCollapse(groups: TabGroup[], groupId: string): TabGroup[] {
  return groups.map((g) => {
    if (g.id === groupId) {
      return { ...g, isCollapsed: !g.isCollapsed };
    }
    return g;
  });
}

/**
 * Renames or changes color for an existing tab group.
 */
export function updateTabGroup(
  groups: TabGroup[],
  groupId: string,
  updates: Partial<Pick<TabGroup, 'title' | 'color' | 'isCollapsed'>>
): TabGroup[] {
  return groups.map((g) => {
    if (g.id === groupId) {
      return { ...g, ...updates };
    }
    return g;
  });
}

/**
 * Deletes a tab group and unassigns all member tabs.
 */
export function deleteTabGroup(
  groups: TabGroup[],
  tabs: Tab[],
  groupId: string
): { groups: TabGroup[]; tabs: Tab[] } {
  return {
    groups: groups.filter((g) => g.id !== groupId),
    tabs: tabs.map((t) => (t.groupId === groupId ? { ...t, groupId: undefined } : t)),
  };
}

/**
 * Filters tabs belonging to a specific tab group.
 */
export function getTabsInGroup(tabs: Tab[], groupId: string): Tab[] {
  return tabs.filter((t) => t.groupId === groupId);
}

/**
 * Determines whether a tab should be rendered in the tab strip.
 * Collapsed group tabs are hidden unless that tab is the currently active tab.
 */
export function isTabVisibleInStrip(tab: Tab, groups: TabGroup[], activeTabId: string): boolean {
  if (!tab.groupId) return true;
  if (tab.id === activeTabId) return true;

  const group = groups.find((g) => g.id === tab.groupId);
  if (!group) return true;

  return !group.isCollapsed;
}
