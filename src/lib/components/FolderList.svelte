<script lang="ts">
  import { store } from '../store.svelte';
  import FolderItem from './FolderItem.svelte';
  import { dndzone, type DndEvent } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Folder } from '../types';

  let isCreatingFolder = $state(false);
  let newFolderName = $state('');

  // Local state for dragging animations
  let folders = $state<Folder[]>(store.folders);

  $effect(() => {
    folders = store.folders;
  });

  function startCreating() {
    isCreatingFolder = true;
    newFolderName = '';
  }

  async function confirmCreate() {
    if (!newFolderName.trim()) return;
    await store.addFolder(newFolderName);
    isCreatingFolder = false;
    newFolderName = '';
  }

  function cancelCreate() {
    isCreatingFolder = false;
    newFolderName = '';
  }
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission or bubbling
      confirmCreate();
    } else if (e.key === 'Escape') {
      cancelCreate();
    }
  }

  function handleDndConsider(e: CustomEvent<DndEvent<Folder>>) {
    folders = e.detail.items;
  }

  async function handleDndFinalize(e: CustomEvent<DndEvent<Folder>>) {
    folders = e.detail.items;
    await store.updateFoldersOrder(folders);
  }
</script>

<div class="folder-list-container">
  <div class="folder-actions">
    {#if isCreatingFolder}
      <div class="create-folder-form">
        <!-- svelte-ignore a11y_autofocus -->
        <input 
          type="text" 
          bind:value={newFolderName} 
          placeholder="New folder name..."
          onkeydown={handleKeyDown}
          autofocus
        />
        <button class="btn-icon" onclick={confirmCreate} title="Save Folder">✓</button>
        <button class="btn-icon" onclick={cancelCreate} title="Cancel">✕</button>
      </div>
    {:else}
      <button class="btn-text" onclick={startCreating}>+ New Folder</button>
    {/if}
  </div>

  <div 
    class="folder-list" 
    use:dndzone={{ items: folders, flipDurationMs: 300, dropTargetStyle: {} }} 
    onconsider={handleDndConsider as any} 
    onfinalize={handleDndFinalize as any}
  >
    {#if store.folders.length === 0}
      <p class="empty-state">No folders exist.</p>
    {:else}
      {#each folders as folder (folder.id)}
        <div animate:flip={{ duration: 300 }}>
          <FolderItem folder={folder} />
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .folder-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .folder-actions {
    padding: 10px 15px;
    border-bottom: 1px solid #2a2a2a;
    background-color: #111;
  }

  .btn-text {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    background: none;
    border: none;
    color: #a38d6d;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0;
    text-transform: uppercase;
  }

  .btn-text:hover {
    color: #e2d6b5;
  }

  .create-folder-form {
    display: flex;
    gap: 5px;
  }

  input[type="text"] {
    flex: 1;
    background-color: #000;
    border: 1px solid #444;
    color: #eee;
    padding: 4px 8px;
    border-radius: 2px;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 1.2rem;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #a38d6d;
  }

  .btn-icon {
    background-color: #222;
    border: 1px solid #444;
    color: #ccc;
    cursor: pointer;
    border-radius: 2px;
    padding: 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-icon:hover {
    background-color: #333;
    border-color: #555;
  }

  .folder-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    min-height: 50px;
  }

  .empty-state {
    color: #666;
    font-style: italic;
    text-align: center;
    margin-top: 20px;
  }
</style>