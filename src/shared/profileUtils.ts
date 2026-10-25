import { BrowserProfile } from './types';

export const AVAILABLE_PROFILE_AVATARS = [
  '👤', '💼', '🛍️', '🔬', '🚀', '🔒', '🎮', '🎨', '📚', '☕', '🌟', '💻'
];

export const AVAILABLE_PROFILE_COLORS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export function createCustomProfile(
  name: string,
  icon = '👤',
  color = '#8b5cf6'
): BrowserProfile {
  const sanitizedName = name.trim() || 'New Profile';
  const slug = sanitizedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom';
  const id = `profile_${slug}_${Date.now().toString(36)}`;

  return {
    id,
    name: sanitizedName,
    icon,
    color,
    partition: `persist:${id}`,
  };
}

export function updateProfile(
  profiles: BrowserProfile[],
  id: string,
  updates: Partial<Pick<BrowserProfile, 'name' | 'icon' | 'color'>>
): BrowserProfile[] {
  return profiles.map((p) => {
    if (p.id !== id) return p;
    return {
      ...p,
      ...(updates.name ? { name: updates.name.trim() } : {}),
      ...(updates.icon ? { icon: updates.icon } : {}),
      ...(updates.color ? { color: updates.color } : {}),
    };
  });
}

export function deleteProfile(
  profiles: BrowserProfile[],
  id: string,
  activeProfileId: string
): { profiles: BrowserProfile[]; nextActiveId: string } {
  // Prevent deleting the last profile
  if (profiles.length <= 1) {
    return { profiles, nextActiveId: activeProfileId };
  }

  const remaining = profiles.filter((p) => p.id !== id);
  let nextActiveId = activeProfileId;

  if (activeProfileId === id) {
    nextActiveId = remaining[0].id;
  }

  return { profiles: remaining, nextActiveId };
}

export function getActiveProfile(
  profiles: BrowserProfile[],
  activeId: string
): BrowserProfile {
  return (
    profiles.find((p) => p.id === activeId) ||
    profiles[0] || {
      id: 'personal',
      name: 'Personal',
      icon: '👤',
      color: '#8b5cf6',
      partition: 'persist:profile_personal',
    }
  );
}
