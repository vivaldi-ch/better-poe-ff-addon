<svelte:options customElement="poe-sidebar" />

<script lang="ts">
  let count = $state(0);
</script>

<div class="sidebar">
  <h2>Better PoE Trade</h2>
  <p>Hello World! (POC)</p>
  <button onclick={() => count++}>
    Clicks: {count}
  </button>
</div>

<style>
  .sidebar {
    position: fixed;
    top: 50px;
    left: 0;
    width: 250px;
    height: calc(100vh - 50px);
    background-color: #1a1a1a;
    color: #eee;
    z-index: 999999;
    padding: 1rem;
    box-shadow: 2px 0 5px rgba(0,0,0,0.5);
    border-right: 1px solid #333;
    font-family: sans-serif;
  }
  
  h2 {
    margin-top: 0;
    font-size: 1.2rem;
    color: #e2d6b5;
  }

  button {
    background-color: #333;
    color: #fff;
    border: 1px solid #555;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px;
  }
  
  button:hover {
    background-color: #444;
  }
</style>
