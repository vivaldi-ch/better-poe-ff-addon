import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookmarkEditForm from './BookmarkEditForm.svelte';
import { store } from '../store.svelte';

// Mock the store
vi.mock('../store.svelte', () => ({
  store: {
    updateBookmarkDetails: vi.fn()
  }
}));

describe('BookmarkEditForm.svelte', () => {
  const mockBookmark = {
    id: 'b1',
    name: 'Old Name',
    url: 'https://poe.com',
    createdAt: Date.now(),
    folderId: 'f1'
  };

  let name = mockBookmark.name;
  let color = '';
  let icon = '';
  const onCancel = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial values', () => {
    render(BookmarkEditForm, { 
      bookmark: mockBookmark, 
      name, 
      color, 
      icon, 
      onCancel, 
      onSave 
    });
    
    const input = screen.getByPlaceholderText('Bookmark name') as HTMLInputElement;
    expect(input.value).toBe('Old Name');
  });

  it('calls updateBookmarkDetails and onSave when Save is clicked', async () => {
    render(BookmarkEditForm, { 
      bookmark: mockBookmark, 
      name: 'New Name', 
      color: '#ff0000', 
      icon: 'some-icon.png', 
      onCancel, 
      onSave 
    });

    const saveBtn = screen.getByText('Save');
    await fireEvent.click(saveBtn);

    expect(store.updateBookmarkDetails).toHaveBeenCalledWith('b1', {
      name: 'New Name',
      color: '#ff0000',
      icon: 'some-icon.png'
    });
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    render(BookmarkEditForm, { 
      bookmark: mockBookmark, 
      name, 
      color, 
      icon, 
      onCancel, 
      onSave 
    });

    const cancelBtn = screen.getByText('Cancel');
    await fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalled();
    expect(store.updateBookmarkDetails).not.toHaveBeenCalled();
  });
});
