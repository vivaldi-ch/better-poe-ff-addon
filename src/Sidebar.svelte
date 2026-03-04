<svelte:options customElement="poe-sidebar" />

<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './lib/store.svelte';
  import Header from './lib/components/Header.svelte';
  import FolderList from './lib/components/FolderList.svelte';

  $effect(() => {
    const hostNode = document.querySelector('#poe-extension-host') as HTMLElement;
    if (hostNode) {
      hostNode.style.width = store.isMinimized ? '40px' : '280px';
      hostNode.style.flexShrink = '0';
      hostNode.style.transition = 'width 0.3s ease';
    }
  });

  onMount(() => {
    store.init();
  });
</script>

<div class="sidebar" class:minimized={store.isMinimized}>
  {#if store.isMinimized}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="minimized-view" onclick={() => store.toggleMinimize()}>
      <button class="toggle-btn" aria-label="Expand Sidebar">»</button>
    </div>
  {:else}
    <Header />
    <FolderList />
  {/if}
</div>

<style>
  /* 
     For Custom Elements, styles MUST be in the <style> block to be injected into the Shadow DOM.
     Global imports in <script> tags only inject into the main document head, which is ignored by Shadow DOM.
  */
  @import './lib/styles/sidebar.css';

  /* Base styles for Sidebar structure not covered in components */
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
</style>
