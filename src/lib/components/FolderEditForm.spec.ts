import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FolderEditForm from './FolderEditForm.svelte';
import { store } from '../store.svelte';

// Mock the store
vi.mock('../store.svelte', () => ({
  store: {
    updateFolderDetails: vi.fn()
  }
}));

describe('FolderEditForm.svelte', () => {
  const mockFolder = {
    id: 'f1',
    name: 'Old Folder Name',
    createdAt: Date.now(),
    isExpanded: true
  };

  let name = mockFolder.name;
  let color = '#a38d6d';
  let icon = '';
  const onCancel = vi.fn();
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial values', () => {
    render(FolderEditForm, { 
      folder: mockFolder, 
      name, 
      color, 
      icon, 
      onCancel, 
      onSave 
    });
    
    const input = screen.getByPlaceholderText('Folder name') as HTMLInputElement;
    expect(input.value).toBe('Old Folder Name');
  });

  it('calls updateFolderDetails and onSave when Save is clicked', async () => {
    render(FolderEditForm, { 
      folder: mockFolder, 
      name: 'New Folder Name', 
      color: '#ff0000', 
      icon: 'folder-icon.png', 
      onCancel, 
      onSave 
    });

    const saveBtn = screen.getByText('Save Changes');
    await fireEvent.click(saveBtn);

    expect(store.updateFolderDetails).toHaveBeenCalledWith('f1', {
      name: 'New Folder Name',
      color: '#ff0000',
      icon: 'folder-icon.png'
    });
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    render(FolderEditForm, { 
      folder: mockFolder, 
      name, 
      color, 
      icon, 
      onCancel, 
      onSave 
    });

    const cancelBtn = screen.getByText('Cancel');
    await fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalled();
    expect(store.updateFolderDetails).not.toHaveBeenCalled();
  });
});
