<script lang="ts">
  import { store, DEFAULT_FOLDER_ID } from '../store.svelte';
  import { dndzone, type DndEvent, TRIGGERS } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Bookmark } from '../types';

  let { folder } = $props<{ folder: import('../types').Folder }>();

  let folderBookmarks = $state<Bookmark[]>([]);
  let isHoveringDrop = $state(false);

  let isSaving = $state(false);
  let newBookmarkName = $state('');

  $effect(() => {
    folderBookmarks = store.bookmarks.filter(b => b.folderId === folder.id);
  });

  function handleToggle() {
    store.toggleFolderExpanded(folder.id);
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
    
    // svelte-dnd-action fires info about drop state
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

<div class="folder">
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="folder-header" onclick={handleToggle}>
    <span class="folder-icon">{folder.isExpanded ? '📂' : '📁'}</span>
    <span class="folder-name">{folder.name}</span>
    <span class="folder-count">({folderBookmarks.length})</span>
    
    {#if folder.id !== DEFAULT_FOLDER_ID}
      <button class="btn-delete-folder" onclick={handleDelete} aria-label="Delete folder" title="Delete folder">✕</button>
    {/if}
  </div>

  {#if folder.isExpanded}
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
            dropTargetStyle: {}, // disable default inline styles 
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
  }

  .folder-header {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    background-color: #1f1f1f;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid transparent;
    transition: background-color 0.2s;
  }

  .folder-header:hover {
    background-color: #2a2a2a;
  }

  .folder-icon {
    margin-right: 8px;
    font-size: 1.1rem;
  }

  .folder-name {
    flex: 1;
    font-weight: bold;
    color: #e2d6b5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.25rem; /* Increased size to match 20% bump request */
  }

  .folder-count {
    color: #666;
    font-size: 1rem;
    margin: 0 8px;
  }

  .btn-delete-folder {
    background: none;
    border: none;
    color: #555;
    cursor: pointer;
    padding: 2px 6px;
    font-size: 1rem;
  }

  .btn-delete-folder:hover {
    color: #ff6b6b;
  }

  .folder-body {
    background-color: #111;
    border-top: 1px solid #2a2a2a;
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
    font-size: 1rem;
    pointer-events: none; /* Crucial so it doesn't block drops */
  }

  .bookmark-wrapper {
    margin-bottom: 8px; /* Added spacing between items */
  }

  .bookmark-wrapper:last-child {
    margin-bottom: 0;
  }

  /* Bookmark item styles matched from previous list */
  .bookmark-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 3px;
    transition: border-color 0.2s;
  }

  .bookmark-item:hover {
    border-color: #555;
  }

  .bookmark-name {
    flex: 1;
    padding: 10px; /* Increased padding */
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.15rem; /* Converted to rem for consistency */
  }

  .bookmark-name:hover {
    color: #fff;
  }

  .btn-delete {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: #888;
    padding: 8px; /* Increased hit area */
    font-size: 1rem;
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
  }

  input[type="text"] {
    background-color: #000;
    border: 1px solid #444;
    color: #eee;
    padding: 8px;
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
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 2px;
    background-color: #222;
    color: #ccc;
    flex: 1;
    transition: all 0.2s;
  }

  button.btn-base:hover {
    background-color: #333;
    border-color: #555;
  }

  .btn-primary {
    width: 100%;
    background-color: #2a2a2a;
    border-color: #a38d6d;
    color: #e2d6b5;
    padding: 8px;
    font-size: 1.1rem;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    cursor: pointer;
    border-radius: 2px;
  }

  .btn-primary:hover {
    background-color: #3a3324;
    border-color: #c4a983;
  }

  .btn-confirm {
    background-color: #1e3a24;
    border-color: #3b6343;
    color: #9bd4a9;
  }
  
  .btn-confirm:hover {
    background-color: #2a5233;
  }
</style>