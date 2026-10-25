import { describe, it, expect } from 'vitest';
import {
  ALL_BOOKMARKS_FOLDER,
  ROOT_FOLDER,
  getUniqueFolders,
  getFolderBookmarkCounts,
  filterBookmarksByFolder,
  renameFolderInBookmarks,
  deleteFolderInBookmarks,
} from '../../src/shared/bookmarkFolderUtils';
import { Bookmark } from '../../src/shared/types';

describe('Bookmark Folder Hierarchy and Organization', () => {
  const sampleBookmarks: Bookmark[] = [
    { id: '1', title: 'GitHub', url: 'https://github.com', folder: 'Work', createdAt: 1000 },
    { id: '2', title: 'GitLab', url: 'https://gitlab.com', folder: 'Work', createdAt: 2000 },
    { id: '3', title: 'Arxiv', url: 'https://arxiv.org', folder: 'Research', createdAt: 3000 },
    { id: '4', title: 'Reddit', url: 'https://reddit.com', createdAt: 4000 }, // root / unsorted
    { id: '5', title: 'Wikipedia', url: 'https://wikipedia.org', folder: '', createdAt: 5000 }, // root / unsorted
  ];

  it('extracts sorted unique folder names excluding empty/root folders', () => {
    const folders = getUniqueFolders(sampleBookmarks);
    expect(folders).toEqual(['Research', 'Work']);
  });

  it('computes accurate counts for all, root, and individual folders', () => {
    const counts = getFolderBookmarkCounts(sampleBookmarks);
    expect(counts[ALL_BOOKMARKS_FOLDER]).toBe(5);
    expect(counts[ROOT_FOLDER]).toBe(2);
    expect(counts['Work']).toBe(2);
    expect(counts['Research']).toBe(1);
  });

  it('filters bookmarks accurately according to selected folder', () => {
    const all = filterBookmarksByFolder(sampleBookmarks, ALL_BOOKMARKS_FOLDER);
    expect(all).toHaveLength(5);

    const root = filterBookmarksByFolder(sampleBookmarks, ROOT_FOLDER);
    expect(root).toHaveLength(2);
    expect(root.map((b) => b.id)).toEqual(['4', '5']);

    const work = filterBookmarksByFolder(sampleBookmarks, 'Work');
    expect(work).toHaveLength(2);
    expect(work.every((b) => b.folder === 'Work')).toBe(true);
  });

  it('renames a folder across all matching bookmarks', () => {
    const updated = renameFolderInBookmarks(sampleBookmarks, 'Work', 'Development');
    const devBookmarks = updated.filter((b) => b.folder === 'Development');
    expect(devBookmarks).toHaveLength(2);
    expect(updated.find((b) => b.id === '3')?.folder).toBe('Research');
  });

  it('deletes a folder and moves contained bookmarks to unsorted without losing items', () => {
    const updated = deleteFolderInBookmarks(sampleBookmarks, 'Work');
    expect(updated).toHaveLength(5);
    const bm1 = updated.find((b) => b.id === '1');
    const bm2 = updated.find((b) => b.id === '2');
    expect(bm1?.folder).toBeUndefined();
    expect(bm2?.folder).toBeUndefined();
    expect(updated.find((b) => b.id === '3')?.folder).toBe('Research');
  });
});
