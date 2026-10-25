import { describe, it, expect } from 'vitest';
import {
  createCustomProfile,
  updateProfile,
  deleteProfile,
  getActiveProfile,
  AVAILABLE_PROFILE_AVATARS,
  AVAILABLE_PROFILE_COLORS,
} from '../../src/shared/profileUtils';
import { BrowserProfile } from '../../src/shared/types';

describe('Profile Customization & Management (profileUtils)', () => {
  const initialProfiles: BrowserProfile[] = [
    { id: 'personal', name: 'Personal', icon: '👤', color: '#8b5cf6', partition: 'persist:profile_personal' },
    { id: 'work', name: 'Work', icon: '💼', color: '#3b82f6', partition: 'persist:profile_work' },
  ];

  it('provides rich predefined avatar emojis and color palette', () => {
    expect(AVAILABLE_PROFILE_AVATARS.length).toBeGreaterThanOrEqual(10);
    expect(AVAILABLE_PROFILE_COLORS.length).toBeGreaterThanOrEqual(6);
    expect(AVAILABLE_PROFILE_AVATARS).toContain('👤');
    expect(AVAILABLE_PROFILE_COLORS).toContain('#8b5cf6');
  });

  it('creates custom profile with sanitized name, avatar, and unique partition', () => {
    const profile = createCustomProfile('Freelance Project', '💻', '#10b981');
    expect(profile.name).toBe('Freelance Project');
    expect(profile.icon).toBe('💻');
    expect(profile.color).toBe('#10b981');
    expect(profile.id).toMatch(/^profile_freelance_project_/);
    expect(profile.partition).toBe(`persist:${profile.id}`);
  });

  it('updates profile name, avatar, and color without mutating other profiles', () => {
    const updated = updateProfile(initialProfiles, 'work', {
      name: 'Client Work',
      icon: '🚀',
      color: '#f59e0b',
    });

    expect(updated.length).toBe(2);
    const work = updated.find((p) => p.id === 'work');
    expect(work?.name).toBe('Client Work');
    expect(work?.icon).toBe('🚀');
    expect(work?.color).toBe('#f59e0b');

    // Personal profile untouched
    const personal = updated.find((p) => p.id === 'personal');
    expect(personal?.name).toBe('Personal');
    expect(personal?.icon).toBe('👤');
  });

  it('deletes profile and switches active profile if the active one was deleted', () => {
    const { profiles, nextActiveId } = deleteProfile(initialProfiles, 'personal', 'personal');
    expect(profiles.length).toBe(1);
    expect(profiles[0].id).toBe('work');
    expect(nextActiveId).toBe('work');
  });

  it('does not delete the last remaining profile', () => {
    const singleProfile = [initialProfiles[0]];
    const { profiles, nextActiveId } = deleteProfile(singleProfile, 'personal', 'personal');
    expect(profiles.length).toBe(1);
    expect(nextActiveId).toBe('personal');
  });

  it('gets active profile with fallback to first profile', () => {
    const active = getActiveProfile(initialProfiles, 'work');
    expect(active.id).toBe('work');

    const fallback = getActiveProfile(initialProfiles, 'non-existent');
    expect(fallback.id).toBe('personal');
  });
});
