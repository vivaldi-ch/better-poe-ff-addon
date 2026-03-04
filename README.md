# Better PoE Trading Extension

A Firefox browser extension (Manifest V3) designed to enhance the Path of Exile trade experience by providing a contextual, in-page bookmarking system.

## Overview

The official Path of Exile trade website is powerful but lacks persistent state management for complex searches. This extension injects a collapsible sidebar directly into the trade site, allowing users to save, name, and organize their searches into a hierarchical folder system without leaving the page.

## Key Features

- **In-Page Sidebar:** A seamless, collapsible UI injected directly into `pathofexile.com/trade`.
- **Hierarchical Folders:** Create and manage folders to group related searches.
- **Customization:**
  - **Folders:** Customize with PoE-themed icons and specific colors. Icons feature a cinematic fade-out effect.
  - **Bookmarks:** Customize with names, colors, and circular, bordered icons.
- **Drag & Drop:** Reorder folders and move bookmarks between folders with ease.
- **Live Preview:** Real-time visual updates in the header while editing folder or bookmark details.
- **Persistent State:** All configurations are saved locally via `browser.storage.local`.

## Technical Stack

- **Framework:** [Svelte 5](https://svelte.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** TypeScript
- **Styling:** Vanilla CSS
- **Utilities:** 
  - `svelte-dnd-action` for drag-and-drop.
  - `zod` for state validation.
  - `vite-plugin-web-extension` for extension bundling.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd better-poe-ff-addon
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server with hot-reloading:
```bash
npm run dev
```
*Note: The extension targets Firefox by default. You can change the target by setting the `TARGET` environment variable.*

### Building

To build the extension for production:
```bash
npm run build
```
The build artifacts will be located in the `dist/` directory.

### Loading in Firefox

1. Open Firefox and navigate to `about:debugging`.
2. Click on "This Firefox" in the sidebar.
3. Click "Load Temporary Add-on...".
4. Select the `manifest.json` file from the `dist/` directory (after running `npm run build`) or from the project root if running in dev mode.

## Project Structure

- `src/content.ts`: Handles the injection of the sidebar into the PoE trade site.
- `src/Sidebar.svelte`: The main entry point for the sidebar UI.
- `src/lib/store.svelte.ts`: Svelte 5 reactive store for managing state and persistence.
- `src/lib/components/`: Reusable Svelte components (Folders, Bookmarks, Edit Forms).
- `src/lib/assets/`: PoE-themed icons and images.
- `src/lib/constants.ts`: Shared constants like the PoE color palette.

## Future Refactors (Architectural Roadmap)

- [ ] **URL Deconstruction (Data Modeling):** Store bookmarks as objects `{ searchId, league }` instead of full URL strings to simplify migrations and future PoE 2 support.
- [ ] **Component Decomposition:** Extract `BookmarkItem.svelte` from `FolderItem.svelte` to resolve the "God Component" pattern and encapsulate bookmark-specific logic.
- [ ] **Logic & Service Separation:** Decouple browser storage I/O and validation into a `StorageService.ts`, keeping the store focused on reactive state.
- [ ] **Shared Style System:** Move duplicated PoE-themed design tokens and component styles into a centralized `theme.css`.
- [ ] **Robust Notifications:** Replace blocking native `alert()`/`confirm()` calls with a non-blocking, PoE-themed Toast or Modal system.
- [ ] **Utility Extraction:** Move pure logic like color conversion (`getTranslucentColor`) into dedicated utility modules for better testability.

## License

MIT
