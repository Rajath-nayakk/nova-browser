import { Bookmark } from './types';

export const ALL_BOOKMARKS_FOLDER = '__ALL__';
export const ROOT_FOLDER = '__ROOT__';

/**
 * Extracts a sorted list of unique folder names present in bookmarks.
 */
export function getUniqueFolders(bookmarks: Bookmark[]): string[] {
  const folders = new Set<string>();
  bookmarks.forEach((b) => {
    if (b.folder && b.folder.trim()) {
      folders.add(b.folder.trim());
    }
  });
  return Array.from(folders).sort((a, b) => a.localeCompare(b));
}

/**
 * Computes bookmark count for each folder and for root/all.
 */
export function getFolderBookmarkCounts(bookmarks: Bookmark[]): Record<string, number> {
  const counts: Record<string, number> = {
    [ALL_BOOKMARKS_FOLDER]: bookmarks.length,
    [ROOT_FOLDER]: 0,
  };

  bookmarks.forEach((b) => {
    const f = b.folder?.trim();
    if (!f) {
      counts[ROOT_FOLDER] = (counts[ROOT_FOLDER] || 0) + 1;
    } else {
      counts[f] = (counts[f] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Filters bookmarks by folder:
 * - ALL_BOOKMARKS_FOLDER returns all bookmarks
 * - ROOT_FOLDER returns unorganized bookmarks (no folder)
 * - specific string returns bookmarks matching that folder
 */
export function filterBookmarksByFolder(
  bookmarks: Bookmark[],
  activeFolder: string
): Bookmark[] {
  if (activeFolder === ALL_BOOKMARKS_FOLDER) {
    return bookmarks;
  }
  if (activeFolder === ROOT_FOLDER) {
    return bookmarks.filter((b) => !b.folder || !b.folder.trim());
  }
  return bookmarks.filter((b) => b.folder?.trim() === activeFolder.trim());
}

/**
 * Renames a folder across all containing bookmarks.
 */
export function renameFolderInBookmarks(
  bookmarks: Bookmark[],
  oldName: string,
  newName: string
): Bookmark[] {
  const trimmedNew = newName.trim();
  return bookmarks.map((b) => {
    if (b.folder?.trim() === oldName.trim()) {
      return { ...b, folder: trimmedNew || undefined };
    }
    return b;
  });
}

/**
 * Deletes a folder by resetting the folder field of affected bookmarks to undefined (moving to root).
 */
export function deleteFolderInBookmarks(
  bookmarks: Bookmark[],
  folderName: string
): Bookmark[] {
  return bookmarks.map((b) => {
    if (b.folder?.trim() === folderName.trim()) {
      return { ...b, folder: undefined };
    }
    return b;
  });
}
