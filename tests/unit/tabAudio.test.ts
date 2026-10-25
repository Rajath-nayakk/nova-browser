import { describe, it, expect } from 'vitest';
import { Tab } from '../../src/shared/types';

describe('Tab Audio Playback & Mute Management', () => {
  function createTestTab(partial?: Partial<Tab>): Tab {
    return {
      id: 'tab-audio-1',
      url: 'https://youtube.com/watch?v=test',
      title: 'Music Video',
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      isSecure: true,
      blockedCount: 0,
      isMuted: false,
      isPlayingAudio: false,
      zoomFactor: 1.0,
      ...partial,
    };
  }

  it('initializes tab with audio stopped and unmuted', () => {
    const tab = createTestTab();
    expect(tab.isPlayingAudio).toBe(false);
    expect(tab.isMuted).toBe(false);
  });

  it('updates state when media playback starts and stops', () => {
    const tab = createTestTab();

    // Media starts playing
    tab.isPlayingAudio = true;
    expect(tab.isPlayingAudio).toBe(true);

    // Media paused
    tab.isPlayingAudio = false;
    expect(tab.isPlayingAudio).toBe(false);
  });

  it('toggles mute status independently of playback state', () => {
    const tab = createTestTab({ isPlayingAudio: true, isMuted: false });

    // User clicks audio mute button
    tab.isMuted = !tab.isMuted;
    expect(tab.isMuted).toBe(true);
    expect(tab.isPlayingAudio).toBe(true);

    // User un-mutes
    tab.isMuted = !tab.isMuted;
    expect(tab.isMuted).toBe(false);
  });

  it('provides correct context menu labels depending on mute state', () => {
    const unmutedTab = createTestTab({ isMuted: false });
    const mutedTab = createTestTab({ isMuted: true });

    const getMenuLabel = (t: Tab) => (t.isMuted ? 'Unmute tab' : 'Mute tab');

    expect(getMenuLabel(unmutedTab)).toBe('Mute tab');
    expect(getMenuLabel(mutedTab)).toBe('Unmute tab');
  });
});
