<script lang="ts">
  import { store } from '../store.svelte';
  import type { Bookmark } from '../types';
  import { POE_COLORS } from '../constants';

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
</script>

<div class="edit-form">
  <div class="form-group">
    <label class="poe-label" for="bookmark-name">Bookmark Name</label>
    <input class="poe-input" id="bookmark-name" type="text" bind:value={name} placeholder="Bookmark name" />
  </div>

  <div class="form-group">
    <span class="poe-label">Background Color</span>
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
    <span class="poe-label">Icon Style</span>
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
          style:border-color={color || 'var(--poe-border-light)'}
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
    border: 1px solid var(--poe-border);
    border-radius: 4px;
    margin: 4px 0 8px 0;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
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

  .icon-picker {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
    gap: 6px;
    max-height: 120px;
    overflow-y: auto;
    padding: 4px;
    background-color: var(--poe-bg-dark);
    border: 1px solid var(--poe-border);
    border-radius: 2px;
  }

  .icon-option {
    width: 32px;
    height: 32px;
    background-color: var(--poe-bg-panel);
    border: 2px solid var(--poe-border);
    border-radius: 50%;
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
</style>