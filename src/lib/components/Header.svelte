<script lang="ts">
  import { store } from '../store.svelte';
  import { slide } from 'svelte/transition';

  let isMigrating = $state(false);
  let newLeague = $state('');

  async function handleMigrate() {
    if (!newLeague.trim()) return;
    
    if (confirm(`This will update ALL existing bookmarks to the "${newLeague}" league. This action cannot be easily undone. Continue?`)) {
      await store.migrateAllBookmarksLeague(newLeague.trim());
      isMigrating = false;
      newLeague = '';
      alert('All bookmarks have been migrated to the new league.');
    }
  }
</script>

<div class="header-container">
  <div class="header">
    <h2>Better PoE Trade</h2>
    <div class="header-actions">
      <button 
        class="btn-icon" 
        onclick={() => isMigrating = !isMigrating} 
        title="League Migration"
        class:active={isMigrating}
      >
        ⚙
      </button>
      <button class="toggle-btn" onclick={() => store.toggleMinimize()} aria-label="Minimize Sidebar">«</button>
    </div>
  </div>

  {#if isMigrating}
    <div class="migration-panel" transition:slide>
      <div class="migration-content">
        <span class="panel-title">Bulk League Migration</span>
        <p class="warning">Updates all bookmark URLs to a new league.</p>
        
        <div class="input-group">
          <input 
            type="text" 
            bind:value={newLeague} 
            placeholder="e.g. Ruthless, Settlers" 
          />
          <button 
            class="btn-migrate" 
            onclick={handleMigrate}
            disabled={!newLeague.trim()}
          >
            Migrate
          </button>
        </div>
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

  .toggle-btn:hover {
    color: #e2d6b5;
  }

  .migration-panel {
    background-color: #111;
    border-top: 1px solid #333;
    overflow: hidden;
  }

  .migration-content {
    padding: 12px 15px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .panel-title {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 0.9rem;
    color: #e2d6b5;
    text-transform: uppercase;
  }

  .warning {
    margin: 0;
    font-size: 0.8rem;
    color: #888;
  }

  .input-group {
    display: flex;
    gap: 8px;
  }

  input[type="text"] {
    flex: 1;
    background-color: #000;
    border: 1px solid #444;
    color: #eee;
    padding: 6px 10px;
    border-radius: 2px;
    font-size: 0.95rem;
  }

  input[type="text"]:focus {
    outline: none;
    border-color: #a38d6d;
  }

  .btn-migrate {
    background-color: #2a2a2a;
    border: 1px solid #444;
    color: #e2d6b5;
    padding: 6px 12px;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
  }

  .btn-migrate:hover:not(:disabled) {
    background-color: #3a3324;
    border-color: #a38d6d;
  }

  .btn-migrate:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>