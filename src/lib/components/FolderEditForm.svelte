<script lang="ts">
  import { store } from '../store.svelte';
  import type { Folder } from '../types';
  import { POE_COLORS } from '../constants';

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
</script>

<div class="edit-form">
  <div class="form-group">
    <label class="poe-label" for="folder-name">Name</label>
    <input class="poe-input" id="folder-name" type="text" bind:value={name} placeholder="Folder name" />
  </div>

  <div class="form-group">
    <span class="poe-label">Color Options</span>
    <div class="color-picker">
      {#each POE_COLORS as c}
        <button 
          class="color-option" 
          style:background-color={c} 
          class:selected={color === c}
          onclick={() => color = c}
          aria-label="Select color {c}"
        ></button>
      {/each}
    </div>
  </div>

  <div class="form-group">
    <span class="poe-label">Background Icon</span>
    <div class="icon-picker poe-scrollbar">
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
    background-color: var(--poe-bg-dark);
    border-top: 1px solid var(--poe-border);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    background: var(--poe-bg-panel);
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--poe-border);
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

  .icon-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
    padding: 6px;
    background-color: var(--poe-bg-panel);
    border: 1px solid var(--poe-border);
    border-radius: 4px;
  }

  .icon-option {
    aspect-ratio: 1;
    background-color: var(--poe-bg-header);
    border: 1px solid var(--poe-border);
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
    border-color: var(--poe-gold);
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
</style>