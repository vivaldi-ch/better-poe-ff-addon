<script lang="ts">
  import { store } from '../store.svelte';
</script>

<div class="header">
  <h2>Better PoE Trade</h2>
  <button class="toggle-btn" onclick={() => store.toggleMinimize()} aria-label="Minimize Sidebar">«</button>
</div>

<style>
  .header {
    padding: 15px;
    border-bottom: 1px solid #3a3a3a;
    background-color: #1a1a1a;
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

  .toggle-btn {
    margin-left: auto;
    background: none;
    border: none;
    color: #888;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 5px;
    line-height: 1;
    flex: 0;
  }

  .toggle-btn:hover {
    color: #e2d6b5;
    background: none;
  }
</style>