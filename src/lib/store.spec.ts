import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import browser from 'webextension-polyfill';
import { store, DEFAULT_FOLDER_ID, DEFAULT_FOLDER_NAME } from './store.svelte';

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
      onChanged: {
        addListener: vi.fn(),
      }
    }
  }
}));

const VALID_UUID_1 = '123e4567-e89b-12d3-a456-426614174001';
const VALID_UUID_2 = '123e4567-e89b-12d3-a456-426614174002';
const VALID_UUID_3 = '123e4567-e89b-12d3-a456-426614174003';
const VALID_FOLDER_ID = 'f13e4567-e89b-12d3-a456-426614174000';

describe('store.svelte.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset to default state
    store._setStateForTest({
      folders: [{ id: DEFAULT_FOLDER_ID, name: DEFAULT_FOLDER_NAME, createdAt: 1, isExpanded: true }],
      bookmarks: [],
      lastSavedFolderId: DEFAULT_FOLDER_ID
    });
    store._setMinimizedForTest(false);
    
    (browser.storage.local.get as Mock).mockResolvedValue({});
  });

  describe('init()', () => {
    it('should load state and minimized state from storage', async () => {
      const mockState = {
        folders: [{ id: VALID_FOLDER_ID, name: 'Builds', createdAt: 100, isExpanded: false }],
        bookmarks: [{ id: VALID_UUID_1, name: 'Test', url: 'http://test.com', createdAt: 123, folderId: VALID_FOLDER_ID }],
        lastSavedFolderId: VALID_FOLDER_ID
      };
      
      (browser.storage.local.get as Mock).mockResolvedValue({
        poe_state: mockState,
        poe_sidebar_minimized: true
      });

      await store.init();

      expect(store.folders).toEqual(mockState.folders);
      expect(store.bookmarks).toEqual(mockState.bookmarks);
      expect(store.lastSavedFolderId).toBe(mockState.lastSavedFolderId);
      expect(store.isMinimized).toBe(true);
    });

    it('should ignore corrupted state data', async () => {
      (browser.storage.local.get as Mock).mockResolvedValue({
        poe_state: { folders: [], bookmarks: [{ id: '1', name: 'Bad Data' }] } // Fails schema
      });

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await store.init();

      expect(spy).toHaveBeenCalled();
      // Should remain at default state
      expect(store.bookmarks).toEqual([]);
      expect(store.folders[0].id).toBe(DEFAULT_FOLDER_ID);
      
      spy.mockRestore();
    });
  });

  describe('Folder Actions', () => {
    it('should add a folder', async () => {
      const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue(VALID_FOLDER_ID);
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(100);

      await store.addFolder('My Builds');

      expect(store.folders.length).toBe(2); // Default + new
      expect(store.folders[1]).toEqual({
        id: VALID_FOLDER_ID,
        name: 'My Builds',
        createdAt: 100,
        isExpanded: true
      });

      uuidSpy.mockRestore();
      nowSpy.mockRestore();
    });

    it('should delete a folder and its child bookmarks', async () => {
      store._setStateForTest({
        folders: [
          { id: DEFAULT_FOLDER_ID, name: DEFAULT_FOLDER_NAME, createdAt: 1, isExpanded: true },
          { id: VALID_FOLDER_ID, name: 'Delete Me', createdAt: 2, isExpanded: true }
        ],
        bookmarks: [
          { id: VALID_UUID_1, name: 'Keep', url: 'http://a.com', createdAt: 1, folderId: DEFAULT_FOLDER_ID },
          { id: VALID_UUID_2, name: 'Delete', url: 'http://b.com', createdAt: 2, folderId: VALID_FOLDER_ID }
        ],
        lastSavedFolderId: DEFAULT_FOLDER_ID
      });

      await store.deleteFolder(VALID_FOLDER_ID);

      expect(store.folders.length).toBe(1);
      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0].id).toBe(VALID_UUID_1);
    });

    it('should prevent deleting the default folder', async () => {
      await store.deleteFolder(DEFAULT_FOLDER_ID);
      expect(store.folders.length).toBe(1); // Still there
    });

    it('should reset lastSavedFolderId to default if the target folder is deleted', async () => {
      store._setStateForTest({
        folders: [
          { id: DEFAULT_FOLDER_ID, name: DEFAULT_FOLDER_NAME, createdAt: 1, isExpanded: true },
          { id: VALID_FOLDER_ID, name: 'Custom Folder', createdAt: 2, isExpanded: true }
        ],
        bookmarks: [],
        lastSavedFolderId: VALID_FOLDER_ID // Target is the custom folder
      });

      await store.deleteFolder(VALID_FOLDER_ID);

      expect(store.lastSavedFolderId).toBe(DEFAULT_FOLDER_ID);
    });
  });

  describe('Bookmark Actions', () => {
    it('should add a bookmark to a specific folder and update lastSavedFolderId', async () => {
      store._setStateForTest({
        folders: [{ id: VALID_FOLDER_ID, name: 'F1', createdAt: 1, isExpanded: true }],
        bookmarks: [],
        lastSavedFolderId: DEFAULT_FOLDER_ID
      });

      const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue(VALID_UUID_1);
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(500);

      await store.addBookmark('My Search', 'https://poe.com', VALID_FOLDER_ID);

      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0].folderId).toBe(VALID_FOLDER_ID);
      expect(store.lastSavedFolderId).toBe(VALID_FOLDER_ID);

      uuidSpy.mockRestore();
      nowSpy.mockRestore();
    });

    it('should fallback to default folder if target folder does not exist', async () => {
      const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue(VALID_UUID_1);
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(500);
      
      // Attempting to add to a completely missing folder
      await store.addBookmark('My Search', 'https://poe.com', 'ffffffff-ffff-ffff-ffff-ffffffffffff');
      
      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0].folderId).toBe(DEFAULT_FOLDER_ID);
      expect(store.lastSavedFolderId).toBe(DEFAULT_FOLDER_ID);
      
      uuidSpy.mockRestore();
      nowSpy.mockRestore();
    });

    it('should update bookmark details', async () => {
      store._setStateForTest({
        folders: [],
        bookmarks: [{ id: VALID_UUID_1, name: 'Old', url: 'http://old.com', createdAt: 1, folderId: DEFAULT_FOLDER_ID }],
        lastSavedFolderId: DEFAULT_FOLDER_ID
      });

      await store.updateBookmarkDetails(VALID_UUID_1, { name: 'New', color: '#ff0000' });

      expect(store.bookmarks[0].name).toBe('New');
      expect(store.bookmarks[0].color).toBe('#ff0000');
    });
  });

  describe('League Migration', () => {
    it('should migrate all bookmarks to a new league', async () => {
      store._setStateForTest({
        folders: [],
        bookmarks: [
          { id: VALID_UUID_1, name: 'S1', url: 'https://www.pathofexile.com/trade/search/Standard/abc', createdAt: 1, folderId: VALID_FOLDER_ID },
          { id: VALID_UUID_2, name: 'S2', url: 'https://www.pathofexile.com/trade/search/Hardcore/def', createdAt: 2, folderId: VALID_FOLDER_ID },
          { id: VALID_UUID_3, name: 'Other', url: 'https://google.com', createdAt: 3, folderId: VALID_FOLDER_ID }
        ],
        lastSavedFolderId: VALID_FOLDER_ID
      });

      await store.migrateAllBookmarksLeague('Ruthless');

      expect(store.bookmarks[0].url).toBe('https://www.pathofexile.com/trade/search/Ruthless/abc');
      expect(store.bookmarks[1].url).toBe('https://www.pathofexile.com/trade/search/Ruthless/def');
      expect(store.bookmarks[2].url).toBe('https://google.com'); // Unchanged
    });
  });

  describe('Import/Export', () => {
    it('should export state to base64 and import it back', async () => {
      const mockState = {
        folders: [{ id: VALID_FOLDER_ID, name: 'Exported', createdAt: 100, isExpanded: true }],
        bookmarks: [{ id: VALID_UUID_1, name: 'B1', url: 'http://b1.com', createdAt: 101, folderId: VALID_FOLDER_ID }],
        lastSavedFolderId: VALID_FOLDER_ID
      };
      store._setStateForTest(mockState);

      const exported = store.getExportBase64();
      expect(typeof exported).toBe('string');

      // Clear state
      store._setStateForTest({ folders: [], bookmarks: [], lastSavedFolderId: undefined });

      await store.importFromBase64(exported);

      expect(store.folders).toEqual(mockState.folders);
      expect(store.bookmarks).toEqual(mockState.bookmarks);
    });

    it('should allow reverting an import', async () => {
      const initialState = {
        folders: [{ id: VALID_FOLDER_ID, name: 'Initial', createdAt: 1, isExpanded: true }],
        bookmarks: [],
        lastSavedFolderId: VALID_FOLDER_ID
      };
      store._setStateForTest(initialState);

      const newState = {
        folders: [{ id: '223e4567-e89b-12d3-a456-426614174002', name: 'New', createdAt: 2, isExpanded: true }],
        bookmarks: [],
        lastSavedFolderId: '223e4567-e89b-12d3-a456-426614174002'
      };
      const exportedNew = btoa(JSON.stringify(newState));

      await store.importFromBase64(exportedNew);
      expect(store.folders[0].name).toBe('New');
      expect(store.canRevert).toBe(true);

      await store.revertImport();
      expect(store.folders[0].name).toBe('Initial');
      expect(store.canRevert).toBe(false);
    });

    it('should throw error on invalid import', async () => {
      await expect(store.importFromBase64('invalid-base64')).rejects.toThrow();
      await expect(store.importFromBase64(btoa(JSON.stringify({ bad: 'data' })))).rejects.toThrow();
    });
  });
});