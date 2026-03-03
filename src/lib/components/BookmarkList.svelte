<script lang="ts">
  import { store } from '../store.svelte';
</script>

<div class="bookmark-list">
  {#if store.bookmarks.length === 0}
    <p class="empty-state">No saved searches yet.</p>
  {:else}
    {#each store.bookmarks as bookmark}
      <div class="bookmark-item">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="bookmark-name" onclick={() => store.loadBookmark(bookmark.url)} title={bookmark.url}>
          {bookmark.name}
        </div>
        <button class="btn-delete" onclick={() => store.deleteBookmark(bookmark.id)} aria-label="Delete">
          ✕
        </button>
      </div>
    {/each}
  {/if}
</div>

<style>
  .btn-delete {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: #888;
    padding: 4px 8px;
    font-size: 1rem;
    cursor: pointer;
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