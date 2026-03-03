import browser from 'webextension-polyfill';
import { BookmarkArraySchema, type Bookmark } from './types';

function createBookmarkStore() {
  let bookmarks = $state<Bookmark[]>([]);
  let isMinimized = $state(false);

  async function init() {
    try {
      const result = await browser.storage.local.get(['poe_bookmarks', 'poe_sidebar_minimized']);
      
      // 1. SAFELY LOAD: Validate incoming storage data at runtime
      if (result.poe_bookmarks !== undefined) {
        const parsed = BookmarkArraySchema.safeParse(result.poe_bookmarks);
        if (parsed.success) {
          bookmarks = parsed.data;
        } else {
          console.error('[PoE Extension] Storage corruption detected on load!', parsed.error);
          // If completely corrupted, default to empty to prevent UI crashes.
          // In a real app, we might offer a "recover" or "reset" prompt here.
          bookmarks = []; 
        }
      }
      
      if (typeof result.poe_sidebar_minimized === 'boolean') {
        isMinimized = result.poe_sidebar_minimized;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }

    // 2. SAFELY SYNC: Validate incoming changes from other tabs/contexts
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.poe_bookmarks?.newValue) {
        const parsed = BookmarkArraySchema.safeParse(changes.poe_bookmarks.newValue);
        if (parsed.success) {
          bookmarks = parsed.data;
        } else {
          console.warn('[PoE Extension] Ignoring corrupted sync data from other context.', parsed.error);
        }
      }
    });
  }

  async function saveBookmarksToStorage(updatedBookmarks: Bookmark[]) {
    // 3. SAFELY SAVE: Validate data before committing to disk
    const parsed = BookmarkArraySchema.safeParse(updatedBookmarks);
    
    if (!parsed.success) {
      console.error('[PoE Extension] Prevented saving corrupted data to storage!', parsed.error);
      return; // Abort save operation to protect existing valid data on disk
    }

    bookmarks = parsed.data; // Update local state with the guaranteed clean data
    
    // Strip Svelte proxies before passing to extension storage API to avoid DataCloneError
    const rawBookmarks = $state.snapshot(parsed.data);
    await browser.storage.local.set({ poe_bookmarks: rawBookmarks });
  }

  async function addBookmark(name: string, url: string) {
    if (!name.trim()) return;

    const newBookmark = {
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