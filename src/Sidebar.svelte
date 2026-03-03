<svelte:options customElement="poe-sidebar" />

<script lang="ts">
  import { onMount } from 'svelte';
  import browser from 'webextension-polyfill';

  type Bookmark = {
    id: string;
    name: string;
    url: string;
    createdAt: number;
  };

  let bookmarks = $state<Bookmark[]>([]);
  let isSaving = $state(false);
  let newBookmarkName = $state('');
  let isMinimized = $state(false);

  // We need to tell the host element (which lives OUTSIDE the shadow DOM) 
  // how wide it should be so the flexbox pushes the native site correctly.
  $effect(() => {
    // Svelte 5 Custom Elements automatically provide `this` or we can find the host
    // The cleanest way is to dispatch an event or modify the host node directly
    const hostNode = document.querySelector('#poe-extension-host') as HTMLElement;
    if (hostNode) {
      hostNode.style.width = isMinimized ? '40px' : '280px';
      hostNode.style.flexShrink = '0';
      hostNode.style.transition = 'width 0.3s ease';
    }
  });

  onMount(async () => {
    try {
      const result = await browser.storage.local.get(['poe_bookmarks', 'poe_sidebar_minimized']);
      if (result.poe_bookmarks) {
        bookmarks = result.poe_bookmarks;
      }
      if (result.poe_sidebar_minimized !== undefined) {
        isMinimized = result.poe_sidebar_minimized;
      }
    } catch (e) {
      console.error('Failed to load bookmarks', e);
    }
  });

  async function saveBookmarksToStorage(updatedBookmarks: Bookmark[]) {
    await browser.storage.local.set({ poe_bookmarks: updatedBookmarks });
  }

  function startSaving() {
    isSaving = true;
    newBookmarkName = '';
  }

  async function confirmSave() {
    if (!newBookmarkName.trim()) return;

    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      name: newBookmarkName.trim(),
      url: window.location.href,
      createdAt: Date.now(),
    };

    bookmarks = [...bookmarks, newBookmark];
    await saveBookmarksToStorage(bookmarks);
    isSaving = false;
  }

  function cancelSave() {
    isSaving = false;
  }

  async function deleteBookmark(id: string) {
    bookmarks = bookmarks.filter(b => b.id !== id);
    await saveBookmarksToStorage(bookmarks);
  }

  function loadBookmark(url: string) {
    window.location.href = url;
  }

  async function toggleMinimize() {
    isMinimized = !isMinimized;
    await browser.storage.local.set({ poe_sidebar_minimized: isMinimized });
  }
</script>

<div class="sidebar" class:minimized={isMinimized}>
  {#if isMinimized}
    <div class="minimized-view" onclick={toggleMinimize}>
      <button class="toggle-btn" aria-label="Expand Sidebar">»</button>
    </div>
  {:else}
    <div class="header">
      <h2>Better PoE Trade</h2>
      <button class="toggle-btn" onclick={toggleMinimize} aria-label="Minimize Sidebar">«</button>
    </div>

    <div class="actions">
      {#if isSaving}
        <div class="save-form">
          <input 
            type="text" 
            bind:value={newBookmarkName} 
            placeholder="Bookmark name..."
            onkeydown={(e) => e.key === 'Enter' && confirmSave()}
            autofocus
          />
          <div class="save-buttons">
            <button class="btn-confirm" onclick={confirmSave}>Save</button>
            <button class="btn-cancel" onclick={cancelSave}>Cancel</button>
          </div>
        </div>
      {:else}
        <button class="btn-primary" onclick={startSaving}>+ Save Current Search</button>
      {/if}
    </div>

    <div class="bookmark-list">
      {#if bookmarks.length === 0}
        <p class="empty-state">No saved searches yet.</p>
      {:else}
        {#each bookmarks as bookmark}
          <div class="bookmark-item">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="bookmark-name" onclick={() => loadBookmark(bookmark.url)} title={bookmark.url}>
              {bookmark.name}
            </div>
            <button class="btn-delete" onclick={() => deleteBookmark(bookmark.id)} aria-label="Delete">
              ✕
            </button>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background-color: #111111;
    color: #dfcf99;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 0 15px rgba(0,0,0,0.8);
    border-right: 1px solid #3a3a3a;
    font-family: 'Fontin Regular', sans-serif;
    transition: width 0.3s ease;
    overflow: hidden;
  }

  .sidebar.minimized {
    width: 40px;
  }

  .minimized-view {
    display: flex;
    justify-content: center;
    padding-top: 15px;
    height: 100%;
    cursor: pointer;
  }

  .minimized-view:hover {
    background-color: #1a1a1a;
  }
  
  .header {
    padding: 15px;
    border-bottom: 1px solid #3a3a3a;
    background-color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: normal;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #e2d6b5;
    white-space: nowrap;
  }

  .toggle-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 5px;
    line-height: 1;
    flex: 0;
  }

  .minimized-view > .toggle-btn {
    flex: 1;
  }

  .toggle-btn:hover {
    color: #e2d6b5;
    background: none;
  }

  .actions {
    padding: 15px;
    border-bottom: 1px solid #3a3a3a;
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
    font-family: inherit;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #a38d6d;
  }

  .save-buttons {
    display: flex;
    gap: 8px;
  }

  button {
    font-family: inherit;
    border: 1px solid #444;
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 2px;
    background-color: #222;
    color: #ccc;
    flex: 1;
    transition: all 0.2s;
  }

  button:hover {
    background-color: #333;
    border-color: #555;
  }

  .btn-primary {
    width: 100%;
    background-color: #2a2a2a;
    border-color: #a38d6d;
    color: #e2d6b5;
    padding: 10px;
    font-size: 0.95rem;
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

  .btn-delete {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: #888;
    padding: 4px 8px;
    font-size: 1rem;
  }

  .btn-delete:hover {
    color: #ff6b6b;
    background: none;
  }

  .bookmark-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }

  .empty-state {
    color: #666;
    font-style: italic;
    text-align: center;
    margin-top: 20px;
  }

  .bookmark-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #1a1a1a;
    border: 1px solid #333;
    margin-bottom: 8px;
    border-radius: 3px;
    transition: border-color 0.2s;
  }

  .bookmark-item:hover {
    border-color: #555;
  }

  .bookmark-name {
    flex: 1;
    padding: 10px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bookmark-name:hover {
    color: #fff;
  }
</style>