<script lang="ts">
  import { store } from '../store.svelte';
  import { slide } from 'svelte/transition';

  let isSettingsOpen = $state(false);
  let activeTab = $state<'migration' | 'backup'>('migration');
  
  // Migration state
  let newLeague = $state('');
  
  // Backup state
  let importString = $state('');
  let exportString = $derived(isSettingsOpen ? store.getExportBase64() : '');

  async function handleMigrate() {
    if (!newLeague.trim()) return;
    if (confirm(`This will update ALL existing bookmarks to the "${newLeague}" league. Continue?`)) {
      await store.migrateAllBookmarksLeague(newLeague.trim());
      newLeague = '';
      alert('All bookmarks migrated.');
    }
  }

  async function handleImport() {
    if (!importString.trim()) return;
    try {
      await store.importFromBase64(importString.trim());
      importString = '';
      alert('Import successful! You can revert this change until the page is refreshed if something looks wrong.');
    } catch (e) {
      alert('Import failed: Invalid data format.');
    }
  }

  function copyExport() {
    navigator.clipboard.writeText(exportString);
    alert('Backup string copied to clipboard!');
  }

  async function handleRevert() {
    if (confirm('Revert to the state before the last import?')) {
      await store.revertImport();
      alert('Reverted successfully.');
    }
  }
</script>

<div class="header-container">
  <div class="header">
    <h2>Better PoE Trade</h2>
    <div class="header-actions">
      <button 
        class="btn-icon" 
        onclick={() => isSettingsOpen = !isSettingsOpen} 
        title="Settings & Maintenance"
        class:active={isSettingsOpen}
      >
        ⚙
      </button>
      <button class="toggle-btn" onclick={() => store.toggleMinimize()} aria-label="Minimize Sidebar">«</button>
    </div>
  </div>

  {#if isSettingsOpen}
    <div class="settings-panel" transition:slide>
      <div class="tabs">
        <button class:active={activeTab === 'migration'} onclick={() => activeTab = 'migration'}>Migration</button>
        <button class:active={activeTab === 'backup'} onclick={() => activeTab = 'backup'}>Backup</button>
      </div>

      <div class="settings-content">
        {#if activeTab === 'migration'}
          <div class="panel-section">
            <span class="section-title">Bulk League Migration</span>
            <p class="description">Updates all bookmark URLs to a new league name.</p>
            <div class="input-group">
              <input type="text" bind:value={newLeague} placeholder="e.g. Ruthless" />
              <button class="btn-action" onclick={handleMigrate} disabled={!newLeague.trim()}>Migrate</button>
            </div>
          </div>
        {:else}
          <div class="panel-section">
            <span class="section-title">Export Data</span>
            <p class="description">Copy this string to backup your folders and bookmarks.</p>
            <div class="input-group">
              <input type="text" readonly value={exportString} />
              <button class="btn-action" onclick={copyExport}>Copy</button>
            </div>
          </div>

          <div class="panel-section">
            <span class="section-title">Import Data</span>
            <p class="description">Paste a backup string to overwrite current data.</p>
            <div class="input-group">
              <input type="text" bind:value={importString} placeholder="Paste backup string..." />
              <button class="btn-action btn-confirm" onclick={handleImport} disabled={!importString.trim()}>Import</button>
            </div>
            {#if store.canRevert}
              <button class="btn-revert" onclick={handleRevert}>↺ Undo Last Import</button>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .header-container {
    border-bottom: 1px solid #3a3a3a;
    background-color: #1a1a1a;
  }

  .header {
    padding: 12px 15px;
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-icon {
    background: none;
    border: none;
    color: #888;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    transition: color 0.2s;
  }

  .btn-icon:hover, .btn-icon.active {
    color: #e2d6b5;
  }

  .toggle-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 5px;
    line-height: 1;
  }

  .settings-panel {
    background-color: #111;
    border-top: 1px solid #333;
    display: flex;
    flex-direction: column;
  }

  .tabs {
    display: flex;
    background-color: #080808;
    border-bottom: 1px solid #222;
  }

  .tabs button {
    flex: 1;
    background: none;
    border: none;
    padding: 8px;
    color: #666;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 0.85rem;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .tabs button.active {
    color: #e2d6b5;
    background-color: #111;
    box-shadow: inset 0 -2px 0 #a38d6d;
  }

  .settings-content {
    padding: 12px 15px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .panel-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .section-title {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 0.9rem;
    color: #ccc;
    text-transform: uppercase;
  }

  .description {
    margin: 0;
    font-size: 0.75rem;
    color: #777;
    line-height: 1.2;
  }

  .input-group {
    display: flex;
    gap: 6px;
  }

  input[type="text"] {
    flex: 1;
    background-color: #000;
    border: 1px solid #333;
    color: #aaa;
    padding: 6px 8px;
    border-radius: 2px;
    font-size: 0.85rem;
    min-width: 0;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #555;
    color: #eee;
  }

  input[readonly] {
    cursor: default;
    background-color: #0a0a0a;
  }

  .btn-action {
    background-color: #222;
    border: 1px solid #444;
    color: #ccc;
    padding: 4px 10px;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    cursor: pointer;
    border-radius: 2px;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .btn-action:hover:not(:disabled) {
    background-color: #333;
    border-color: #666;
    color: #fff;
  }

  .btn-confirm {
    background-color: #1e3a24;
    border-color: #3b6343;
    color: #9bd4a9;
  }

  .btn-confirm:hover:not(:disabled) {
    background-color: #2a5233;
  }

  .btn-revert {
    margin-top: 4px;
    background: none;
    border: 1px dashed #444;
    color: #888;
    padding: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .btn-revert:hover {
    border-color: #a38d6d;
    color: #e2d6b5;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>