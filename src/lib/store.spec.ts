import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import browser from 'webextension-polyfill';
import { store } from './store.svelte';

// Mock the webextension-polyfill
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
    
    // Reset store state safely via test helpers
    store._setBookmarksForTest([]);
    store._setMinimizedForTest(false);
    
    // Default mocks to returning empty
    (browser.storage.local.get as Mock).mockResolvedValue({});
  });

  describe('init()', () => {
    it('should load bookmarks and minimized state from storage', async () => {
      const mockBookmarks = [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test', url: 'http://test.com', createdAt: 123 }
      ];
      
      (browser.storage.local.get as Mock).mockResolvedValue({
        poe_bookmarks: mockBookmarks,
        poe_sidebar_minimized: true
      });

      await store.init();

      expect(store.bookmarks).toEqual(mockBookmarks);
      expect(store.isMinimized).toBe(true);
    });

    it('should handle corrupted bookmark data by falling back to empty array', async () => {
      (browser.storage.local.get as Mock).mockResolvedValue({
        poe_bookmarks: [{ id: '1', name: 'Bad Data (Missing URL/Date)' }] // Fails schema
      });

      // Suppress the expected console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await store.init();

      expect(spy).toHaveBeenCalled();
      expect(store.bookmarks).toEqual([]);
      
      spy.mockRestore();
    });
  });

  describe('addBookmark()', () => {
    it('should add a bookmark and save to storage', async () => {
      // Mock window.crypto.randomUUID to return a valid UUID that Zod accepts
      const uuidSpy = vi.spyOn(crypto, 'randomUUID').mockReturnValue('123e4567-e89b-12d3-a456-426614174000');
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1234567890);

      await store.addBookmark('My Search', 'https://pathofexile.com/trade');

      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0]).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'My Search',
        url: 'https://pathofexile.com/trade',
        createdAt: 1234567890
      });

      // Verify it called the storage API with the updated array (un-proxied)
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        poe_bookmarks: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'My Search',
          url: 'https://pathofexile.com/trade',
          createdAt: 1234567890
        }]
      });

      uuidSpy.mockRestore();
      nowSpy.mockRestore();
    });

    it('should not add empty names', async () => {
      await store.addBookmark('   ', 'https://pathofexile.com/trade');
      expect(store.bookmarks.length).toBe(0);
      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('deleteBookmark()', () => {
    it('should remove bookmark by id and update storage', async () => {
      store._setBookmarksForTest([
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'A', url: 'http://a.com', createdAt: 1 },
        { id: '223e4567-e89b-12d3-a456-426614174000', name: 'B', url: 'http://b.com', createdAt: 2 }
      ]);

      await store.deleteBookmark('123e4567-e89b-12d3-a456-426614174000');

      expect(store.bookmarks.length).toBe(1);
      expect(store.bookmarks[0].id).toBe('223e4567-e89b-12d3-a456-426614174000');
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        poe_bookmarks: [
           { id: '223e4567-e89b-12d3-a456-426614174000', name: 'B', url: 'http://b.com', createdAt: 2 }
        ]
      });
    });
  });

  describe('toggleMinimize()', () => {
    it('should toggle state and save', async () => {
      store._setMinimizedForTest(false);
      
      await store.toggleMinimize();
      
      expect(store.isMinimized).toBe(true);
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        poe_sidebar_minimized: true
      });
    });
  });
});