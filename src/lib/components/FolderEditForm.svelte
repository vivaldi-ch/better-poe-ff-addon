<script lang="ts">
  import { store } from '../store.svelte';
  import type { Folder } from '../types';

  // Import all PNG icons from assets folder as URLs
  const iconModules = import.meta.glob('../assets/*.png', { eager: true, query: '?url' });
  const icons = Object.entries(iconModules).map(([path, module]) => {
    const name = path.split('/').pop()?.replace('.png', '') || '';
    return { name, url: (module as any).default };
  });

  let { folder, name = $bindable(), color = $bindable(), icon = $bindable(), onCancel, onSave } = $props<{ 
    folder: Folder,
    name: string,
    color: string,
    icon: string,
    onCancel: () => void, 
    onSave: () => void 
  }>();

  async function handleSave() {
    await store.updateFolderDetails(folder.id, {
      name,
      color,
      icon
    });
    onSave();
  }

  const colors = [
    '#a38d6d', // Default PoE Gold
    '#e2d6b5', // Light Gold
    '#ff6b6b', // Red
    '#c92a2a', // Dark Red
    '#51cf66', // Green
    '#2b8a3e', // Dark Green
    '#339af0', // Blue
    '#1864ab', // Dark Blue
    '#cc5de8', // Purple
    '#862e9c', // Dark Purple
    '#fcc419', // Yellow
    '#ff922b', // Orange
    '#d9480f', // Dark Orange
    '#20c997', // Teal
    '#087f5b', // Dark Teal
    '#adb5bd', // Grey
    '#495057', // Dark Grey
    '#ffffff', // White
  ];
</script>

<div class="edit-form">
  <div class="form-group">
    <label for="folder-name">Name</label>
    <input id="folder-name" type="text" bind:value={name} placeholder="Folder name" />
  </div>

  <div class="form-group">
    <span class="label">Color Options</span>
    <div class="color-picker">
      {#each colors as c}
        <button 
          class="color-option" 
          style:background-color={c} 
          class:selected={color === c}
          onclick={() => color = c}
          aria-label="Select color {c}"
        ></button>
      {/each}
      <div class="custom-color-wrapper">
        <input type="color" bind:value={color} title="Custom color" />
      </div>
    </div>
  </div>

  <div class="form-group">
    <span class="label">Background Icon</span>
    <div class="icon-picker">
      <button 
        class="icon-option none" 
        class:selected={icon === ''}
        onclick={() => icon = ''}
      >
        None
      </button>
      {#each icons as iconItem}
        <button 
          class="icon-option" 
          class:selected={icon === iconItem.url}
          onclick={() => icon = iconItem.url}
          title={iconItem.name}
        >
          <img src={iconItem.url} alt={iconItem.name} />
        </button>
      {/each}
    </div>
  </div>

  <div class="form-actions">
    <button class="btn-base btn-confirm" onclick={handleSave}>Save Changes</button>
    <button class="btn-base btn-cancel" onclick={onCancel}>Cancel</button>
  </div>
</div>

<style>
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    background-color: #000;
    border-top: 1px solid #333;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 0.85rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input[type="text"] {
    background-color: #111;
    border: 1px solid #444;
    color: #eee;
    padding: 8px;
    border-radius: 2px;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 1rem;
  }

  .color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    background: #111;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #222;
  }

  .color-option {
    width: 20px;
    height: 20px;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s, border-color 0.1s;
  }

  .color-option:hover {
    transform: scale(1.15);
    border-color: rgba(255,255,255,0.5);
  }

  .color-option.selected {
    border: 2px solid #fff;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
  }

  .custom-color-wrapper {
    position: relative;
    width: 24px;
    height: 24px;
    margin-left: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  input[type="color"] {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #444;
    background: none;
    cursor: pointer;
  }

  .icon-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
    padding: 6px;
    background-color: #111;
    border: 1px solid #222;
    border-radius: 4px;
  }

  /* Custom scrollbar for icon picker */
  .icon-picker::-webkit-scrollbar {
    width: 6px;
  }
  .icon-picker::-webkit-scrollbar-track {
    background: #000;
  }
  .icon-picker::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
  }

  .icon-option {
    aspect-ratio: 1;
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 3px;
    cursor: pointer;
    padding: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .icon-option img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .icon-option:hover {
    background-color: #2a2a2a;
    border-color: #555;
  }

  .icon-option.selected {
    background-color: #3a3324;
    border-color: #a38d6d;
    box-shadow: 0 0 5px rgba(163, 141, 109, 0.4);
  }

  .icon-option.none {
    font-size: 0.6rem;
    color: #777;
    text-transform: uppercase;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  button.btn-base {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    border: 1px solid #444;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 2px;
    background-color: #222;
    color: #ccc;
    flex: 1;
    transition: all 0.2s;
    font-size: 0.95rem;
  }

  button.btn-base:hover {
    background-color: #333;
    border-color: #666;
    color: #fff;
  }

  .btn-confirm {
    background-color: #1e3a24;
    border-color: #3b6343;
    color: #9bd4a9;
  }
  
  .btn-confirm:hover {
    background-color: #2a5233;
    border-color: #4a7a53;
  }

  .btn-cancel {
    background-color: #3a1e1e;
    border-color: #633b3b;
    color: #d49b9b;
  }

  .btn-cancel:hover {
    background-color: #522a2a;
    border-color: #7a4a4a;
  }
</style>