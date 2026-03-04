<script lang="ts">
  import { untrack } from 'svelte';
  import { store } from '../store.svelte';
  import type { Bookmark } from '../types';
  import { getTranslucentColor } from '../utils/color';
  import BookmarkEditForm from './BookmarkEditForm.svelte';

  let { bookmark } = $props<{ bookmark: Bookmark }>();

  let isEditing = $state(false);
  
  // Editing state for live preview
  let editingName = $state(untrack(() => bookmark.name));
  let editingColor = $state(untrack(() => bookmark.color || ''));
  let editingIcon = $state(untrack(() => bookmark.icon || ''));

  // Derived display values
  let displayColor = $derived(isEditing ? editingColor : bookmark.color);
  let displayName = $derived(isEditing ? editingName : bookmark.name);
  let displayIcon = $derived(isEditing ? editingIcon : bookmark.icon);

  function handleEdit(e: MouseEvent) {
    e.stopPropagation();
    isEditing = true;
    editingName = bookmark.name;
    editingColor = bookmark.color || '';
    editingIcon = bookmark.icon || '';
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (confirm(`Delete bookmark "${bookmark.name}"?`)) {
      store.deleteBookmark(bookmark.id);
    }
  }
</script>

<div 
  class="bookmark-item" 
  style:background-color={isEditing ? getTranslucentColor(editingColor, 0.1) : (displayColor ? getTranslucentColor(displayColor, 0.15) : 'rgba(20, 20, 20, 0.8)')}
  style:border-color={isEditing ? editingColor : (displayColor || 'var(--poe-border)')}
>
  {#if isEditing}
    <BookmarkEditForm 
      {bookmark}
      bind:name={editingName}
      bind:color={editingColor}
      bind:icon={editingIcon}
      onCancel={() => isEditing = false}
      onSave={() => isEditing = false}
    />
  {:else}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bookmark-main" onclick={() => store.loadBookmark(bookmark.url)} title={bookmark.url}>
      {#if displayIcon}
        <div class="bookmark-icon" style:border-color={displayColor || 'var(--poe-border-light)'}>
          <img src={displayIcon} alt="" />
        </div>
      {/if}
      <div class="bookmark-name" style:color={displayColor || 'var(--poe-text)'}>
        {displayName}
      </div>
    </div>
    <div class="bookmark-actions">
      <button class="btn-icon-small" onclick={handleEdit} aria-label="Edit" title="Edit">✎</button>
      <button class="btn-delete" onclick={handleDelete} aria-label="Delete">✕</button>
    </div>
  {/if}
</div>

<style>
  .bookmark-item {
    display: flex;
    flex-direction: column;
    background-color: rgba(20, 20, 20, 0.8);
    border: 1px solid var(--poe-border);
    border-radius: 3px;
    transition: border-color 0.2s, background-color 0.2s;
    overflow: hidden;
    position: relative;
  }

  .bookmark-item:has(.bookmark-main:hover) {
    border-color: #555;
    background-color: rgba(30, 30, 30, 0.9);
  }

  .bookmark-main {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 6px 8px;
    cursor: pointer;
    min-height: 28px;
  }

  .bookmark-icon {
    width: 16px;
    height: 16px;
    min-width: 16px;
    margin-right: 8px;
    border: 1px solid var(--poe-border-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    background-color: rgba(0,0,0,0.3);
  }

  .bookmark-icon img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .bookmark-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 1.15rem;
    color: var(--poe-text);
  }

  .bookmark-main:hover .bookmark-name {
    color: #fff;
  }

  .bookmark-actions {
    display: flex;
    position: absolute;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(20, 20, 20, 0.9);
    padding: 2px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 5;
  }

  .bookmark-item:hover .bookmark-actions {
    opacity: 1;
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

  .btn-delete {
    flex: 0 0 auto;
    background: none;
    border: none;
    color: var(--poe-text-dim);
    padding: 4px 6px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .btn-delete:hover {
    color: #ff6b6b;
  }
</style>