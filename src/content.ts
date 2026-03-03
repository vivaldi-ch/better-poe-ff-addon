import './Sidebar.svelte';

function init() {
  if (document.querySelector('#poe-extension-host')) return;

  const host = document.createElement('div');
  host.id = 'poe-extension-host';
  
  // To prevent overlapping the native site, we insert our host div
  // and modify the body to display as a flex row, pushing the native site to the right.
  document.body.style.display = 'flex';
  document.body.style.flexDirection = 'row';
  
  // Ensure the body doesn't collapse horizontally if the native site relies on block layout
  document.body.style.minWidth = '100vw'; 

  // The native site container needs to take up the remaining space
  const mainAppWrapper = document.body.firstElementChild;
  if (mainAppWrapper && mainAppWrapper instanceof HTMLElement) {
     mainAppWrapper.style.flex = '1';
     mainAppWrapper.style.minWidth = '0'; // Prevent flex child from overflowing screen
  }

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const sidebar = document.createElement('poe-sidebar');
  
  shadowRoot.appendChild(sidebar);
  
  // Prepend the host to the body so it sits on the left side of the flex container
  document.body.prepend(host);
  console.log('Better PoE Trading extension initialized and attached.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
