<script lang="ts">
  import { store, DEFAULT_FOLDER_ID } from '../store.svelte';

  let isSaving = $state(false);
  let newBookmarkName = $state('');
  let selectedFolderId = $state(DEFAULT_FOLDER_ID);

  function startSaving() {
    isSaving = true;
    newBookmarkName = '';
    // Default to the first folder if it exists, otherwise the unchangeable default
    selectedFolderId = store.folders.length > 0 ? store.folders[0].id : DEFAULT_FOLDER_ID;
  }

  async function confirmSave() {
    if (!newBookmarkName.trim()) return;
    await store.addBookmark(newBookmarkName, window.location.href, selectedFolderId);
    isSaving = false;
    newBookmarkName = '';
  }

  function cancelSave() {
    isSaving = false;
    newBookmarkName = '';
  }
</script>

<div class="actions">
  {#if isSaving}
    <div class="save-form">
      <!-- svelte-ignore a11y_autofocus -->
      <input 
        type="text" 
        bind:value={newBookmarkName} 
        placeholder="Bookmark name..."
        onkeydown={(e) => e.key === 'Enter' && confirmSave()}
        autofocus
      />
      
      <select bind:value={selectedFolderId} class="folder-select">
        {#each store.folders as folder}
          <option value={folder.id}>{folder.name}</option>
        {/each}
      </select>

      <div class="save-buttons">
        <button class="btn-confirm" onclick={confirmSave}>Save</button>
        <button class="btn-cancel" onclick={cancelSave}>Cancel</button>
      </div>
    </div>
  {:else}
    <button class="btn-primary" onclick={startSaving}>+ Save Current Search</button>
  {/if}
</div>

<style>
  .actions {
    padding: 15px;
    border-bottom: 1px solid #3a3a3a;
  }

  .save-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  input[type="text"], .folder-select {
    background-color: #000;
    border: 1px solid #444;
    color: #eee;
    padding: 8px;
    border-radius: 2px;
    font-family: inherit;
    font-size: 0.95rem;
  }

  input[type="text"]:focus, .folder-select:focus {
    outline: none;
    border-color: #a38d6d;
  }

  .folder-select {
    cursor: pointer;
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
</style>