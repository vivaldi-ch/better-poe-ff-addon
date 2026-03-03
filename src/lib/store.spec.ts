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
        folders: [{ id: 'f13e4567-e89b-12d3-a456-426614174000', name: 'Builds', createdAt: 100, isExpanded: false }],
        bookmarks: [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', url: 'http://test.com', createdAt: 123, folderId: 'f13e4567-e89b-12d3-a456-426614174000' }],
        lastSavedFolderId: 'f13e4567-e89b-12d3-a456-426614174000'
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
      const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('f23e4567-e89b-12d3-a456-426614174000');
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(100);

      await store.addFolder('My Builds');

      expect(store.folders.length).toBe(2); // Default + new
      expect(store.folders[1]).toEqual({
        id: 'f23e4567-e89b-12d3-a456-426614174000',
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
          { id: 'f13e4567-e89b-12d3-a456-426614174000', name: 'Delete Me', createdAt: 2, isExpanded: true }
        ],
        bookmarks: [
          { id: 'b13e4567-e89b-12d3-a456-426614174000', name: 'Keep', url: 'http://a.com', createdAt: 1, folderId: DEFAULT_FOLDER_ID },
          { id: 'b23e4567-e89b-12d3-a456-426614174000', name: 'Delete', url: 'http://b.com', createdAt: 2, folderId: 'f13e4567-e89b-12d3-a456-426614174000' }
        ],
        lastSavedFolderId: DEFAULT_FOLDER_ID
      });

      await store.deleteFolder('f13e4567-e89b-12d3-a456-426614174000');

      expect(store.folders.length).toBe(1);
      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0].id).toBe('b13e4567-e89b-12d3-a456-426614174000');
    });

    it('should prevent deleting the default folder', async () => {
      await store.deleteFolder(DEFAULT_FOLDER_ID);
      expect(store.folders.length).toBe(1); // Still there
    });

    it('should reset lastSavedFolderId to default if the target folder is deleted', async () => {
      store._setStateForTest({
        folders: [
          { id: DEFAULT_FOLDER_ID, name: DEFAULT_FOLDER_NAME, createdAt: 1, isExpanded: true },
          { id: 'f13e4567-e89b-12d3-a456-426614174000', name: 'Custom Folder', createdAt: 2, isExpanded: true }
        ],
        bookmarks: [],
        lastSavedFolderId: 'f13e4567-e89b-12d3-a456-426614174000' // Target is the custom folder
      });

      await store.deleteFolder('f13e4567-e89b-12d3-a456-426614174000');

      expect(store.lastSavedFolderId).toBe(DEFAULT_FOLDER_ID);
    });
  });

  describe('Bookmark Actions', () => {
    it('should add a bookmark to a specific folder and update lastSavedFolderId', async () => {
      store._setStateForTest({
        folders: [{ id: 'f13e4567-e89b-12d3-a456-426614174000', name: 'F1', createdAt: 1, isExpanded: true }],
        bookmarks: [],
        lastSavedFolderId: DEFAULT_FOLDER_ID
      });

      const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(500);

      await store.addBookmark('My Search', 'https://poe.com', 'f13e4567-e89b-12d3-a456-426614174000');

      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0].folderId).toBe('f13e4567-e89b-12d3-a456-426614174000');
      expect(store.lastSavedFolderId).toBe('f13e4567-e89b-12d3-a456-426614174000');

      uuidSpy.mockRestore();
      nowSpy.mockRestore();
    });

    it('should fallback to default folder if target folder does not exist', async () => {
      const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(500);
      
      // Attempting to add to a completely missing folder
      await store.addBookmark('My Search', 'https://poe.com', 'f99e4567-e89b-12d3-a456-426614174000');
      
      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0].folderId).toBe(DEFAULT_FOLDER_ID);
      expect(store.lastSavedFolderId).toBe(DEFAULT_FOLDER_ID);
      
      uuidSpy.mockRestore();
      nowSpy.mockRestore();
    });
  });
});