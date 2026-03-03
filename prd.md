# Product Requirements Document (PRD): Better PoE Trading Extension

**Document Status:** Draft - POC Phase  
**Product:** Firefox Browser Extension (Manifest V3)  
**Target Environment:** `pathofexile.com/trade`

---

## 1. Product Overview & Problem Statement
The official Path of Exile (PoE) trade website is a powerful but highly complex database querying tool. Users routinely construct searches containing 5 to 10+ specific conditional parameters (affixes, thresholds, item bases). 

**The Problem:** The native site offers no persistent state management. If a user navigates away or loses their session, the query is destroyed. Native browser bookmarks are insufficient because they force the user out of the application's context and clutter the browser's general bookmark tree with unreadable URLs (e.g., `.../trade/search/League/xyz123`).

**The Solution (POC Core):** A contextual, in-page bookmarking system injected directly into the trade site's DOM. It allows users to save, name, and hierarchically organize complex search states via a folder system without ever leaving the trade interface.

---

## 2. Scope & Success Criteria

### In Scope for POC
* Dynamic UI injection (Sidebar) into the native trade site.
* Creation, deletion, and nesting of folders.
* Capturing active search payloads and binding them to human-readable aliases.
* One-click execution of saved searches from the sidebar.
* Local state persistence via `chrome.storage.local`.
* Manual JSON data export/import (Data safety net).

### Out of Scope for POC (Future Backlog)
* Live pricing API integration (e.g., poe.ninja currency conversion).
* In-page search result highlighting (Visual parsing).
* Automated session recovery / search history logs.
* Cloud synchronization of bookmarks.

### Success Metrics (POC)
1. **Stability:** The injected UI does not break or misalign when the native site updates its CSS or when the user resizes the window.
2. **Accuracy:** 100% successful recreation of a saved search state upon clicking a bookmark.
3. **Performance:** Folder expansion/collapse and search execution occur in <200ms without browser lag.

---

## 3. Functional Requirements (User Stories)

### Epic 1: The Workspace (DOM UI)
* **REQ-1.1:** The system shall inject a collapsible sidebar into the left margin of the `pathofexile.com/trade` interface.
* **REQ-1.2:** The UI styling must inherit or closely mimic the native dark-theme CSS variables of the official site to appear seamless.
* **REQ-1.3:** The sidebar state (open/collapsed) must persist across page reloads.

### Epic 2: Folder Management
* **REQ-2.1:** Users can create a new folder and assign it a text name (max 50 characters).
* **REQ-2.2:** Users can create sub-folders nested within existing folders.
* **REQ-2.3:** Users can rename or delete folders.
* **REQ-2.4:** *Edge Case Handling:* Deleting a parent folder must trigger a warning prompt. If confirmed, all child bookmarks and sub-folders within it are also deleted.

### Epic 3: Bookmarking & Execution
* **REQ-3.1:** Users can click a "Save Current Search" button, which captures the current trade URL/payload.
* **REQ-3.2:** The system prompts the user to input a human-readable alias for the saved search.
* **REQ-3.3:** Users can drag-and-drop saved bookmarks into specific folders, or select a destination folder via a dropdown during the save prompt.
* **REQ-3.4:** Clicking a saved bookmark in the sidebar instantly updates the native site's search state and executes the query.

### Epic 4: Data Security (The Failsafe)
* **REQ-4.1:** The system must provide a "Settings" menu with an "Export Data" function that downloads the user's entire folder/bookmark tree as a `.json` file.
* **REQ-4.2:** The system must provide an "Import Data" function that validates and overwrites the current local storage with an uploaded `.json` file.

---

## 4. Technical Constraints & Architecture

### 4.1 State Management & Data Schema
Because we are dealing with a nested hierarchy (folders within folders), we cannot use a flat list. The JSON schema stored in `chrome.storage.local` must support recursive node structures. 

*Suggested approach: A node-based tree where each item (folder or bookmark) has a unique ID, a `type` ("folder" or "bookmark"), a `parentId` (null if at the root), and a `payload` (the URL string, if it's a bookmark).*

### 4.2 DOM Fragility (The Biggest Risk)
Because we are injecting HTML into a third-party site, any update pushed by the developers (Grinding Gear Games) changing DOM IDs or class names could break our UI layout or our ability to scrape the active search.
* **Mitigation:** The injected sidebar should be encapsulated within a **Shadow DOM** to prevent the native site's CSS from bleeding into our UI, and our CSS from breaking theirs. Reliance on native DOM selectors for state capture should be minimized; rely on the URL parameters wherever possible.

### 4.3 Storage Limits
`chrome.storage.local` has a default quota of 5MB. While text-based JSON is lightweight, heavy power users might hit limits if we log thousands of URLs. 
* **Mitigation:** Implement a size check on save, warning the user if they exceed 90% of the storage quota.