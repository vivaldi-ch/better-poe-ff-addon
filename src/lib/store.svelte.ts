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
      return;
    }

    state = parsed.data;
    const rawState = $state.snapshot(parsed.data);
    await browser.storage.local.set({ poe_state: rawState });
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
    if (folderId === DEFAULT_FOLDER_ID) return; // Prevent deleting the fallback folder
    
    // Deleting a folder also deletes all its child bookmarks.
    // If it was the last saved folder, reset the pointer to default.
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
    // Ensure the default folder is preserved if it's hidden from the UI
    const defaultFolder = state.folders.find(f => f.id === DEFAULT_FOLDER_ID);
    if (defaultFolder && !newFolders.some(f => f.id === DEFAULT_FOLDER_ID)) {
      state.folders = [defaultFolder, ...newFolders];
    } else {
      state.folders = newFolders;
    }
    // Sync state immediately for UI fluidity
    await saveStateToStorage(state);
  }

  // --- Bookmark Actions ---
  async function addBookmark(name: string, url: string, folderId: string) {
    if (!name.trim()) return;

    // Ensure the folder exists, otherwise fallback to default
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
      lastSavedFolderId: validFolderId // Remember this folder for next time
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

  async function updateFolderBookmarks(folderId: string, newFolderBookmarks: Bookmark[]) {
    // 1. We must synchronously calculate new bookmarks to avoid race conditions when dragging between folders
    const otherBookmarks = state.bookmarks.filter(
      b => b.folderId !== folderId && !newFolderBookmarks.some(nb => nb.id === b.id)
    );
    
    // 2. Set the folderId on the new list (vital for when an item was dragged from another folder)
    const updatedFolderBookmarks = newFolderBookmarks.map(b => ({ ...b, folderId }));

    // 3. Update the state synchronously and save
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
    init,
    addFolder,
    deleteFolder,
    toggleFolderExpanded,
    updateFoldersOrder,
    updateFolderDetails,
    addBookmark,
    deleteBookmark,
    updateBookmarkDetails,
    updateFolderBookmarks,
    loadBookmark,
    toggleMinimize,
    _setStateForTest,
    _setMinimizedForTest
  };
}

export const store = createBookmarkStore();