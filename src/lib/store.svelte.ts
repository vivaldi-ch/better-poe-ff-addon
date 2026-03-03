import browser from 'webextension-polyfill';
import type { Bookmark } from './types';

function createBookmarkStore() {
  let bookmarks = $state<Bookmark[]>([]);
  let isMinimized = $state(false);

  async function init() {
    try {
      const result = await browser.storage.local.get(['poe_bookmarks', 'poe_sidebar_minimized']);
      if (result.poe_bookmarks) {
        bookmarks = result.poe_bookmarks;
      }
      if (result.poe_sidebar_minimized !== undefined) {
        isMinimized = result.poe_sidebar_minimized;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.poe_bookmarks?.newValue) {
        bookmarks = changes.poe_bookmarks.newValue;
      }
    });
  }

  async function saveBookmarksToStorage(updatedBookmarks: Bookmark[]) {
    bookmarks = updatedBookmarks; 
    await browser.storage.local.set({ poe_bookmarks: updatedBookmarks });
  }

  async function addBookmark(name: string, url: string) {
    if (!name.trim()) return;

    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      name: name.trim(),
      url: url,
      createdAt: Date.now(),
    };

    const updated = [...bookmarks, newBookmark];
    await saveBookmarksToStorage(updated);
  }

  async function deleteBookmark(id: string) {
    const updated = bookmarks.filter(b => b.id !== id);
    await saveBookmarksToStorage(updated);
  }

  function loadBookmark(url: string) {
    window.location.href = url;
  }

  async function toggleMinimize() {
    isMinimized = !isMinimized;
    await browser.storage.local.set({ poe_sidebar_minimized: isMinimized });
  }

  return {
    get bookmarks() { return bookmarks },
    get isMinimized() { return isMinimized },
    init,
    addBookmark,
    deleteBookmark,
    loadBookmark,
    toggleMinimize
  };
}

export const store = createBookmarkStore();