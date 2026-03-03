import './Sidebar.svelte';

console.log('--- BETTER POE TRADING EXTENSION CONTENT SCRIPT INJECTED ---');

function init() {
  if (document.querySelector('#poe-extension-host')) return;

  // Create a host element and attach a shadow root to isolate it
  const host = document.createElement('div');
  host.id = 'poe-extension-host';
  
  // Svelte 5 custom elements sometimes throw "Permission denied to access property 'nodeType'" 
  // in Firefox if placed directly in the body due to Xray vision. 
  // Placing it inside another element or shadow root shields it.
  const shadowRoot = host.attachShadow({ mode: 'open' });

  const sidebar = document.createElement('poe-sidebar');
  shadowRoot.appendChild(sidebar);
  
  document.body.appendChild(host);
  console.log('Better PoE Trading extension initialized and attached.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
