import browser from 'webextension-polyfill';
import { StorageStateSchema, type Bookmark, type Folder, type StorageState } from './types';

// A default folder ID so we always have somewhere to put things if the user hasn't made a folder
export const DEFAULT_FOLDER_ID = '00000000-0000-0000-0000-000000000000';
export const DEFAULT_FOLDER_NAME = 'Uncategorized';

function createBookmarkStore() {
  let state = $state<StorageState>({
    folders: [{ id: DEFAULT_FOLDER_ID, name: DEFAULT_FOLDER_NAME, createdAt: 1, isExpanded: true }],
    bookmarks: [],
    lastSavedFolderId: DEFAULT_FOLDER_ID
  });
  let isMinimized = $state(false);
  let revertState = $state<StorageState | null>(null);

  async function init() {
    try {
      const result = await browser.storage.local.get(['poe_state', 'poe_sidebar_minimized']);
      
      if (result.poe_state !== undefined) {
        const parsed = StorageStateSchema.safeParse(result.poe_state);
        if (parsed.success) {
          state = parsed.data;
        } else {
          console.error('[PoE Extension] Storage corruption detected on load!', parsed.error);
        }
      }
      
      if (typeof result.poe_sidebar_minimized === 'boolean') {
        isMinimized = result.poe_sidebar_minimized;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.poe_state?.newValue) {
        const parsed = StorageStateSchema.safeParse(changes.poe_state.newValue);
        if (parsed.success) {
          state = parsed.data;
        }
      }
    });
  }

  async function saveStateToStorage(newState: StorageState) {
    const parsed = StorageStateSchema.safeParse(newState);
    
    if (!parsed.success) {
      console.error('[PoE Extension] Prevented saving corrupted data to storage!', parsed.error);
      throw new Error('Invalid data format');
    }

    state = parsed.data;
    const rawState = $state.snapshot(parsed.data);
    await browser.storage.local.set({ poe_state: rawState });
  }

  // --- Maintenance Actions ---
  function getExportBase64() {
    const json = JSON.stringify($state.snapshot(state));
    // UTF-8 safe base64
    return btoa(unescape(encodeURIComponent(json)));
  }

  async function importFromBase64(base64: string) {
    try {
      const json = decodeURIComponent(escape(atob(base64)));
      const parsed = JSON.parse(json);
      const validated = StorageStateSchema.safeParse(parsed);
      
      if (!validated.success) {
        throw new Error('Invalid backup format');
      }

      // Save current state for potential revert (transient)
      revertState = $state.snapshot(state);
      
      await saveStateToStorage(validated.data);
    } catch (e) {
      console.error('Import failed', e);
      throw e;
    }
  }

  async function revertImport() {
    if (!revertState) return;
    const toRestore = revertState;
    revertState = null;
    await saveStateToStorage(toRestore);
  }

  // --- Folder Actions ---
  async function addFolder(name: string) {
    if (!name.trim()) return;
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: Date.now(),
      isExpanded: true
    };
    await saveStateToStorage({
      ...state,
      folders: [...state.folders, newFolder]
    });
  }

  async function deleteFolder(folderId: string) {
    if (folderId === DEFAULT_FOLDER_ID) return;
    
    await saveStateToStorage({
      ...state,
      folders: state.folders.filter(f => f.id !== folderId),
      bookmarks: state.bookmarks.filter(b => b.folderId !== folderId),
      lastSavedFolderId: state.lastSavedFolderId === folderId ? DEFAULT_FOLDER_ID : state.lastSavedFolderId
    });
  }

  async function toggleFolderExpanded(folderId: string) {
    await saveStateToStorage({
      ...state,
      folders: state.folders.map(f => f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f)
    });
  }

  async function updateFolderDetails(folderId: string, details: Partial<Folder>) {
    await saveStateToStorage({
      ...state,
      folders: state.folders.map(f => f.id === folderId ? { ...f, ...details } : f)
    });
  }

  async function updateFoldersOrder(newFolders: Folder[]) {
    const defaultFolder = state.folders.find(f => f.id === DEFAULT_FOLDER_ID);
    if (defaultFolder && !newFolders.some(f => f.id === DEFAULT_FOLDER_ID)) {
      state.folders = [defaultFolder, ...newFolders];
    } else {
      state.folders = newFolders;
    }
    await saveStateToStorage(state);
  }

  // --- Bookmark Actions ---
  async function addBookmark(name: string, url: string, folderId: string) {
    if (!name.trim()) return;
    const validFolderId = state.folders.some(f => f.id === folderId) ? folderId : DEFAULT_FOLDER_ID;
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      name: name.trim(),
      url: url,
      createdAt: Date.now(),
      folderId: validFolderId
    };
    await saveStateToStorage({
      ...state,
      bookmarks: [...state.bookmarks, newBookmark],
      lastSavedFolderId: validFolderId
    });
  }

  async function deleteBookmark(id: string) {
    await saveStateToStorage({
      ...state,
      bookmarks: state.bookmarks.filter(b => b.id !== id)
    });
  }

  async function updateBookmarkDetails(id: string, details: Partial<Bookmark>) {
    await saveStateToStorage({
      ...state,
      bookmarks: state.bookmarks.map(b => b.id === id ? { ...b, ...details } : b)
    });
  }

  async function migrateAllBookmarksLeague(newLeague: string) {
    const leagueRegex = /(pathofexile\.com\/trade\/search\/)([^\/]+)(\/.*)?$/;
    const updatedBookmarks = state.bookmarks.map(b => {
      if (leagueRegex.test(b.url)) {
        return {
          ...b,
          url: b.url.replace(leagueRegex, `$1${newLeague}$3`)
        };
      }
      return b;
    });
    await saveStateToStorage({
      ...state,
      bookmarks: updatedBookmarks
    });
  }

  async function updateFolderBookmarks(folderId: string, newFolderBookmarks: Bookmark[]) {
    const otherBookmarks = state.bookmarks.filter(
      b => b.folderId !== folderId && !newFolderBookmarks.some(nb => nb.id === b.id)
    );
    const updatedFolderBookmarks = newFolderBookmarks.map(b => ({ ...b, folderId }));
    state.bookmarks = [...otherBookmarks, ...updatedFolderBookmarks];
    await saveStateToStorage(state);
  }

  function loadBookmark(url: string) {
    window.location.href = url;
  }

  // --- UI Actions ---
  async function toggleMinimize() {
    isMinimized = !isMinimized;
    await browser.storage.local.set({ poe_sidebar_minimized: isMinimized });
  }

  // Internal test helper
  function _setStateForTest(newState: StorageState) {
    state = newState;
  }
  function _setMinimizedForTest(minimized: boolean) {
    isMinimized = minimized;
  }

  return {
    get folders() { return state.folders },
    get bookmarks() { return state.bookmarks },
    get lastSavedFolderId() { return state.lastSavedFolderId },
    get isMinimized() { return isMinimized },
    get canRevert() { return revertState !== null },
    init,
    addFolder,
    deleteFolder,
    toggleFolderExpanded,
    updateFoldersOrder,
    updateFolderDetails,
    addBookmark,
    deleteBookmark,
    updateBookmarkDetails,
    migrateAllBookmarksLeague,
    getExportBase64,
    importFromBase64,
    revertImport,
    updateFolderBookmarks,
    loadBookmark,
    toggleMinimize,
    _setStateForTest,
    _setMinimizedForTest
  };
}

export const store = createBookmarkStore();