<script lang="ts">
  import { untrack } from 'svelte';
  import { slide } from 'svelte/transition';
  import { store, DEFAULT_FOLDER_ID } from '../store.svelte';
  import { dndzone, type DndEvent, TRIGGERS } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Bookmark } from '../types';
  import FolderEditForm from './FolderEditForm.svelte';
  import BookmarkItem from './BookmarkItem.svelte';
  import { getTranslucentColor } from '../utils/color';

  let { folder } = $props<{ folder: import('../types').Folder }>();

  let folderBookmarks = $state<Bookmark[]>([]);
  let isHoveringDrop = $state(false);

  let isSaving = $state(false);
  let isEditingFolder = $state(false);
  let newBookmarkName = $state('');

  // Folder Editing state for live preview
  let editingName = $state(untrack(() => folder.name));
  let editingColor = $state(untrack(() => folder.color || '#a38d6d'));
  let editingIcon = $state(untrack(() => folder.icon || ''));

  // Derived folder display values
  let displayName = $derived(isEditingFolder ? editingName : folder.name);
  let displayColor = $derived(isEditingFolder ? editingColor : (folder.color || '#a38d6d'));
  let displayIcon = $derived(isEditingFolder ? editingIcon : folder.icon);

  $effect(() => {
    folderBookmarks = store.bookmarks.filter(b => b.folderId === folder.id);
  });

  // Keep folder editing state in sync if folder changes externally
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

  function handleDeleteFolder(e: MouseEvent) {
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
      <button class="btn-icon-small btn-edit-folder" onclick={handleEditFolder} aria-label="Edit folder" title="Edit folder">✎</button>
      {#if folder.id !== DEFAULT_FOLDER_ID}
        <button class="btn-icon-small btn-delete-folder" onclick={handleDeleteFolder} aria-label="Delete folder" title="Delete folder">✕</button>
      {/if}
    </div>
  </div>

  {#if isEditingFolder}
    <div transition:slide={{ duration: 300 }}>
      <FolderEditForm 
        {folder} 
        bind:name={editingName}
        bind:color={editingColor}
        bind:icon={editingIcon}
        onCancel={() => isEditingFolder = false} 
        onSave={() => isEditingFolder = false} 
      />
    </div>
  {:else if folder.isExpanded}
    <div class="folder-body" transition:slide={{ duration: 300 }}>
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
            <BookmarkItem {bookmark} />
          </div>
        {/each}
      </div>

      <div class="folder-actions">
        {#if isSaving}
          <div class="save-form">
            <!-- svelte-ignore a11y_autofocus -->
            <input 
              class="poe-input"
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
    background-color: var(--poe-bg-panel);
    border: 1px solid var(--poe-border);
    border-radius: 4px;
    overflow: hidden;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .folder-header {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    transition: background-color 0.2s;
    position: relative;
    z-index: 10;
  }

  .folder-header:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }

  .header-icon-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 35%;
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
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.25rem;
    position: relative;
    z-index: 1;
    text-shadow: 0 1px 3px rgba(0,0,0,0.9), 0 0 1px rgba(0,0,0,1);
  }

  .folder-count {
    color: var(--poe-text-dim);
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

  .btn-icon-small {
    background: none;
    border: none;
    color: var(--poe-text-dim);
    cursor: pointer;
    padding: 2px 4px;
    font-size: 0.9rem;
    transition: color 0.2s;
  }

  .btn-icon-small:hover {
    color: #fff;
  }

  .btn-delete-folder:hover {
    color: #ff6b6b;
  }

  .folder-body {
    background-color: rgba(0, 0, 0, 0.3);
    border-top: 1px solid var(--poe-border);
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
    border-color: var(--poe-border-light);
    background-color: rgba(255, 255, 255, 0.02);
  }

  .empty-folder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--poe-text-dim);
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

  .folder-actions {
    margin-top: 8px;
  }

  .save-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px;
  }

  .save-buttons {
    display: flex;
    gap: 8px;
  }
</style>