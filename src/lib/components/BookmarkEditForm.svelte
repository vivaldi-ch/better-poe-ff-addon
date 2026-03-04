<script lang="ts">
  import { store } from '../store.svelte';
  import type { Bookmark } from '../types';

  // Import all PNG icons from assets folder as URLs
  const iconModules = import.meta.glob('../assets/*.png', { eager: true, query: '?url' });
  const icons = Object.entries(iconModules).map(([path, module]) => {
    const name = path.split('/').pop()?.replace('.png', '') || '';
    return { name, url: (module as any).default };
  });

  let { bookmark, name = $bindable(), color = $bindable(), icon = $bindable(), onCancel, onSave } = $props<{ 
    bookmark: Bookmark,
    name: string,
    color: string,
    icon: string,
    onCancel: () => void, 
    onSave: () => void 
  }>();

  async function handleSave() {
    await store.updateBookmarkDetails(bookmark.id, {
      name,
      color,
      icon
    });
    onSave();
  }

  const colors = [
    '#333333', // Default Dark
    '#a38d6d', // PoE Gold
    '#ff6b6b', // Red
    '#51cf66', // Green
    '#339af0', // Blue
    '#cc5de8', // Purple
    '#fcc419', // Yellow
    '#ff922b', // Orange
    '#20c997', // Teal
    '#adb5bd', // Grey
  ];
</script>

<div class="edit-form">
  <div class="form-group">
    <label for="bookmark-name">Bookmark Name</label>
    <input id="bookmark-name" type="text" bind:value={name} placeholder="Bookmark name" />
  </div>

  <div class="form-group">
    <span class="label">Background Color</span>
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
    <span class="label">Icon Style</span>
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
          style:border-color={color || '#555'}
        >
          <img src={iconItem.url} alt={iconItem.name} />
        </button>
      {/each}
    </div>
  </div>

  <div class="form-actions">
    <button class="btn-base btn-confirm" onclick={handleSave}>Save</button>
    <button class="btn-base btn-cancel" onclick={onCancel}>Cancel</button>
  </div>
</div>

<style>
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    background-color: #080808;
    border: 1px solid #333;
    border-radius: 4px;
    margin: 4px 0 8px 0;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  label, .label {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 0.8rem;
    color: #888;
    text-transform: uppercase;
  }

  input[type="text"] {
    background-color: #000;
    border: 1px solid #444;
    color: #eee;
    padding: 6px;
    border-radius: 2px;
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    font-size: 0.95rem;
  }

  .color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .color-option {
    width: 18px;
    height: 18px;
    border-radius: 2px;
    border: 1px solid rgba(255,255,255,0.1);
    cursor: pointer;
    padding: 0;
  }

  .color-option.selected {
    border: 2px solid #fff;
  }

  .custom-color-wrapper {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
  }

  input[type="color"] {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .icon-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
    gap: 6px;
    max-height: 120px;
    overflow-y: auto;
    padding: 4px;
    background-color: #000;
    border: 1px solid #222;
    border-radius: 2px;
  }

  .icon-option {
    width: 32px;
    height: 32px;
    background-color: #111;
    border: 2px solid #333;
    border-radius: 50%; /* Circle shape for bookmark icons */
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    overflow: hidden;
  }

  .icon-option img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .icon-option:hover {
    background-color: #222;
    transform: scale(1.1);
  }

  .icon-option.selected {
    border-color: #fff !important;
    background-color: #333;
  }

  .icon-option.none {
    border-radius: 4px;
    font-size: 0.6rem;
    color: #666;
  }

  .form-actions {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }

  button.btn-base {
    font-family: 'FontinSmallcaps', 'Georgia', serif;
    border: 1px solid #444;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 2px;
    background-color: #222;
    color: #ccc;
    flex: 1;
    font-size: 0.9rem;
  }

  .btn-confirm {
    background-color: #1e3a24;
    border-color: #3b6343;
    color: #9bd4a9;
  }

  .btn-cancel {
    background-color: #3a1e1e;
    border-color: #633b3b;
    color: #d49b9b;
  }
</style>