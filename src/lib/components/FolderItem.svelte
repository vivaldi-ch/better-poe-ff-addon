<script lang="ts">
  import { store, DEFAULT_FOLDER_ID } from '../store.svelte';
  import { dndzone, type DndEvent, TRIGGERS } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Bookmark } from '../types';
  import FolderEditForm from './FolderEditForm.svelte';

  let { folder } = $props<{ folder: import('../types').Folder }>();

  let folderBookmarks = $state<Bookmark[]>([]);
  let isHoveringDrop = $state(false);

  let isSaving = $state(false);
  let isEditingFolder = $state(false);
  let newBookmarkName = $state('');

  // Editing state for live preview
  let editingName = $state(folder.name);
  let editingColor = $state(folder.color || '#a38d6d');
  let editingIcon = $state(folder.icon || '');

  // Derived display values
  let displayName = $derived(isEditingFolder ? editingName : folder.name);
  let displayColor = $derived(isEditingFolder ? editingColor : (folder.color || '#a38d6d'));
  let displayIcon = $derived(isEditingFolder ? editingIcon : folder.icon);

  $effect(() => {
    folderBookmarks = store.bookmarks.filter(b => b.folderId === folder.id);
  });

  // Keep editing state in sync if folder changes externally
  $effect(() => {
    if (!isEditingFolder) {
      editingName = folder.name;
      editingColor = folder.color || '#a38d6d';
      editingIcon = folder.icon || '';
    }
  });

  function handleToggle() {
    if (!isEditingFolder) {
      store.toggleFolderExpanded(folder.id);
    }
  }

  function handleEditFolder(e: MouseEvent) {
    e.stopPropagation();
    isEditingFolder = true;
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (folder.id === DEFAULT_FOLDER_ID) return;
    
    if (confirm(`Delete folder "${folder.name}" and all its bookmarks?`)) {
      store.deleteFolder(folder.id);
    }
  }

  function handleDndConsider(e: CustomEvent<DndEvent<Bookmark>>) {
    folderBookmarks = e.detail.items;
    
    const info = e.detail.info;
    if (info) {
        if (info.trigger === TRIGGERS.DRAGGED_ENTERED) {
            isHoveringDrop = true;
        } else if (info.trigger === TRIGGERS.DRAGGED_LEFT || info.trigger === TRIGGERS.DRAGGED_LEFT_ALL) {
            isHoveringDrop = false;
        }
    }
  }

  async function handleDndFinalize(e: CustomEvent<DndEvent<Bookmark>>) {
    folderBookmarks = e.detail.items;
    isHoveringDrop = false;
    await store.updateFolderBookmarks(folder.id, folderBookmarks);
  }

  function startSaving() {
    isSaving = true;
    newBookmarkName = '';
  }

  async function confirmSave() {
    if (!newBookmarkName.trim()) return;
    await store.addBookmark(newBookmarkName, window.location.href, folder.id);
    isSaving = false;
    newBookmarkName = '';
  }

  function cancelSave() {
    isSaving = false;
    newBookmarkName = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelSave();
    }
  }

  function getTranslucentColor(hex: string, opacity: number) {
    if (!hex) return `rgba(163, 141, 109, ${opacity})`;
    
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
</script>

<div 
  class="folder" 
  style:border-color={displayColor}
  style:background-color={getTranslucentColor(displayColor, 0.05)}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="folder-header" 
    onclick={handleToggle}
    style:background-color={getTranslucentColor(displayColor, 0.25)}
  >
    {#if displayIcon}
      <div class="header-icon-bg" style:background-image="url({displayIcon})"></div>
    {/if}
    
    {#if !displayIcon}
      <span class="folder-status-icon">{folder.isExpanded ? '📂' : '📁'}</span>
    {/if}

    <span class="folder-name">{displayName}</span>
    <span class="folder-count">({folderBookmarks.length})</span>
    
    <div class="header-actions">
      <button class="btn-icon btn-edit-folder" onclick={handleEditFolder} aria-label="Edit folder" title="Edit folder">✎</button>
      {#if folder.id !== DEFAULT_FOLDER_ID}
        <button class="btn-icon btn-delete-folder" onclick={handleDelete} aria-label="Delete folder" title="Delete folder">✕</button>
      {/if}
    </div>
  </div>

  {#if isEditingFolder}
    <FolderEditForm 
      {folder} 
      bind:name={editingName}
      bind:color={editingColor}
      bind:icon={editingIcon}
      onCancel={() => isEditingFolder = false} 
      onSave={() => isEditingFolder = false} 
    />
  {:else if folder.isExpanded}
    <div class="folder-body">
      {#if folderBookmarks.length === 0 && !isHoveringDrop}
        <div class="empty-folder">Empty</div>
      {/if}
      <div 
        class="folder-contents"
        class:drop-target={isHoveringDrop || folderBookmarks.length === 0}
        use:dndzone={{ 
            items: folderBookmarks, 
            flipDurationMs: 300, 
            dropTargetStyle: {}, 
            type: 'bookmark' 
        }}
        onconsider={handleDndConsider as any}
        onfinalize={handleDndFinalize as any}
      >
        {#each folderBookmarks as bookmark (bookmark.id)}
          <div animate:flip={{ duration: 300 }} class="bookmark-wrapper">
            <div class="bookmark-item">
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="bookmark-name" onclick={() => store.loadBookmark(bookmark.url)} title={bookmark.url}>
                {bookmark.name}
              </div>
              <button class="btn-delete" onclick={() => store.deleteBookmark(bookmark.id)} aria-label="Delete">✕</button>
            </div>
          </div>
        {/each}
      </div>

      <div class="folder-actions">
        {#if isSaving}
          <div class="save-form">
            <!-- svelte-ignore a11y_autofocus -->
            <input 
              type="text" 
              bind:value={newBookmarkName} 
              placeholder="Bookmark name..."
              onkeydown={handleKeyDown}
              autofocus
            />
            <div class="save-buttons">
              <button class="btn-base btn-confirm" onclick={confirmSave}>Save</button>
              <button class="btn-base btn-cancel" onclick={cancelSave}>Cancel</button>
            </div>
          </div>
        {:else}
          <button class="btn-primary" onclick={startSaving}>+ Save Current Search Here</button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .folder {
    margin-bottom: 8px;
    background-color: #161616;
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .folder-header {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid transparent;
    transition: background-color 0.2s;
    position: relative;
    /* Removed min-height */
  }

  .folder-header:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .header-icon-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 60%;
    background-size: cover;
    background-position: left center;
    background-repeat: no-repeat;
    opacity: 0.7;
    mask-image: linear-gradient(to right, black 20%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, black 20%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  .folder-status-icon {
    margin-right: 8px;
    font-size: 1rem;
    position: relative;
    z-index: 1;
  }

  .folder-name {
    flex: 1;
    font-weight: bold;
    color: #fff; /* White text for better visibility */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.25rem;
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,1);
  }

  .folder-count {
    color: #bbb;
    font-size: 0.95rem;
    margin: 0 8px;
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }

  .header-actions {
    display: flex;
    gap: 2px;
    position: relative;
    z-index: 1;
  }

  .btn-icon {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 2px 4px;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  .btn-icon:hover {
    color: #fff;
  }

  .btn-delete-folder:hover {
    color: #ff6b6b;
  }

  .folder-body {
    background-color: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    padding: 6px;
  }

  .folder-contents {
    min-height: 40px;
    border: 2px dashed transparent;
    border-radius: 4px;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .folder-contents.drop-target {
    border-color: #444;
    background-color: rgba(255, 255, 255, 0.02);
  }

  .empty-folder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #555;
    font-style: italic;
    font-size: 0.95rem;
    pointer-events: none;
  }

  .bookmark-wrapper {
    margin-bottom: 6px;
  }

  .bookmark-wrapper:last-child {
    margin-bottom: 0;
  }

  .bookmark-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(20, 20, 20, 0.8);
    border: 1px solid #333;
    border-radius: 3px;
    transition: border-color 0.2s;
  }

  .bookmark-item:hover {
    border-color: #555;
    background-color: rgba(30, 30, 30, 0.9);
  }

  .bookmark-name {
    flex: 1;
    padding: 8px 10px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.1rem;
    color: #ccc;
  }

  .bookmark-name:hover {
    color: #fff;
  }

  .btn-delete {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: #666;
    padding: 8px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn-delete:hover {
    color: #ff6b6b;
  }

  .folder-actions {
    margin-top: 8px;
  }

  .save-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px;
  }

  input[type="text"] {
    background-color: #000;
    border: 1px solid #444;
    color: #eee;
    padding: 6px 10px;
    border-radius: 2px;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 1.1rem;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #a38d6d;
  }

  .save-buttons {
    display: flex;
    gap: 8px;
  }

  button.btn-base {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    border: 1px solid #444;
    padding: 6px 10px;
    cursor: pointer;
    border-radius: 2px;
    background-color: #222;
    color: #ccc;
    flex: 1;
    transition: all 0.2s;
  }

  .btn-primary {
    width: 100%;
    background-color: #1a1a1a;
    border: 1px solid #444;
    color: #aaa;
    padding: 8px;
    font-size: 1.05rem;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    background-color: #2a2a2a;
    color: #e2d6b5;
    border-color: #a38d6d;
  }

  .btn-confirm {
    background-color: #1e3a24;
    border-color: #3b6343;
    color: #9bd4a9;
  }
</style>