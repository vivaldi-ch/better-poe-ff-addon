import { z } from 'zod';

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name cannot be empty").max(100, "Name is too long"),
  url: z.string().url("Must be a valid URL"),
  createdAt: z.number().int().positive(),
  folderId: z.string().uuid(), // Links back to parent folder
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Folder name cannot be empty").max(50, "Folder name is too long"),
  createdAt: z.number().int().positive(),
  isExpanded: z.boolean().default(false), // UI state saved so it remembers what was open
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;
export type Folder = z.infer<typeof FolderSchema>;

// The entire state to be saved
export const StorageStateSchema = z.object({
  folders: z.array(FolderSchema),
  bookmarks: z.array(BookmarkSchema),
  lastSavedFolderId: z.string().uuid().optional(), // Persists the last used folder across sessions
});

export type StorageState = z.infer<typeof StorageStateSchema>;