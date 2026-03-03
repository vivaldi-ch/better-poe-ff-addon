<script lang="ts">
  import { store, DEFAULT_FOLDER_ID } from '../store.svelte';

  let { folder } = $props<{ folder: import('../types').Folder }>();

  // Derived array of bookmarks that belong to this specific folder
  let folderBookmarks = $derived(store.bookmarks.filter(b => b.folderId === folder.id));

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
    <div class="folder-contents">
      {#if folderBookmarks.length === 0}
        <div class="empty-folder">Empty</div>
      {:else}
        {#each folderBookmarks as bookmark}
          <div class="bookmark-item">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="bookmark-name" onclick={() => store.loadBookmark(bookmark.url)} title={bookmark.url}>
              {bookmark.name}
            </div>
            <button class="btn-delete" onclick={() => store.deleteBookmark(bookmark.id)} aria-label="Delete">✕</button>
          </div>
        {/each}
      {/if}
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
  }

  .folder-count {
    color: #666;
    font-size: 0.85em;
    margin: 0 8px;
  }

  .btn-delete-folder {
    background: none;
    border: none;
    color: #555;
    cursor: pointer;
    padding: 2px 6px;
    font-size: 0.9rem;
  }

  .btn-delete-folder:hover {
    color: #ff6b6b;
  }

  .folder-contents {
    padding: 6px;
    background-color: #111;
    border-top: 1px solid #2a2a2a;
  }

  .empty-folder {
    color: #555;
    font-style: italic;
    font-size: 0.9em;
    padding: 4px 8px;
  }

  /* Bookmark item styles matched from previous list */
  .bookmark-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #1a1a1a;
    border: 1px solid #333;
    margin-bottom: 4px;
    border-radius: 3px;
    transition: border-color 0.2s;
  }

  .bookmark-item:last-child {
    margin-bottom: 0;
  }

  .bookmark-item:hover {
    border-color: #555;
  }

  .bookmark-name {
    flex: 1;
    padding: 6px 10px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.95em;
  }

  .bookmark-name:hover {
    color: #fff;
  }

  .btn-delete {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: #888;
    padding: 4px 8px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn-delete:hover {
    color: #ff6b6b;
  }
</style>