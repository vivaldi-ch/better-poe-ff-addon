import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FolderItem from './FolderItem.svelte';
import { store } from '../store.svelte';

// Mock the store
vi.mock('../store.svelte', () => ({
  store: {
    bookmarks: [],
    toggleFolderExpanded: vi.fn(),
    deleteFolder: vi.fn(),
    addBookmark: vi.fn(),
    updateFolderBookmarks: vi.fn(),
    loadBookmark: vi.fn(),
    deleteBookmark: vi.fn()
  },
  DEFAULT_FOLDER_ID: '00000000-0000-0000-0000-000000000000'
}));

// Mock svelte-dnd-action
vi.mock('svelte-dnd-action', () => ({
  dndzone: vi.fn(),
  TRIGGERS: {
    DRAGGED_ENTERED: 'DRAGGED_ENTERED',
    DRAGGED_LEFT: 'DRAGGED_LEFT',
    DRAGGED_LEFT_ALL: 'DRAGGED_LEFT_ALL'
  }
}));

describe('FolderItem.svelte', () => {
  const mockFolder = {
    id: 'folder-1',
    name: 'Test Folder',
    createdAt: Date.now(),
    isExpanded: false,
    color: '#ff0000'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (store as any).bookmarks = [];
  });

  it('renders folder name', () => {
    render(FolderItem, { folder: mockFolder });
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('toggles expansion on header click', async () => {
    render(FolderItem, { folder: mockFolder });
    const header = screen.getByText('Test Folder');
    await fireEvent.click(header);
    expect(store.toggleFolderExpanded).toHaveBeenCalledWith('folder-1');
  });

  it('shows edit form when edit button is clicked', async () => {
    render(FolderItem, { folder: mockFolder });
    const editBtn = screen.getByTitle('Edit folder');
    await fireEvent.click(editBtn);
    
    // Check for some edit form element (e.g., the name input label)
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('confirms before deleting a folder', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(FolderItem, { folder: mockFolder });
    
    const deleteBtn = screen.getByTitle('Delete folder');
    await fireEvent.click(deleteBtn);
    
    expect(confirmSpy).toHaveBeenCalled();
    expect(store.deleteFolder).toHaveBeenCalledWith('folder-1');
    confirmSpy.mockRestore();
  });

  it('does not delete if confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(FolderItem, { folder: mockFolder });
    
    const deleteBtn = screen.getByTitle('Delete folder');
    await fireEvent.click(deleteBtn);
    
    expect(store.deleteFolder).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
