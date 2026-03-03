import { z } from 'zod';

export const BookmarkSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name cannot be empty").max(100, "Name is too long"),
  url: z.string().url("Must be a valid URL"),
  createdAt: z.number().int().positive(),
});

// Infer the TypeScript type directly from the Zod schema
// This ensures our types and our runtime validation are always perfectly in sync
export type Bookmark = z.infer<typeof BookmarkSchema>;

// Array schema for bulk loading/saving
export const BookmarkArraySchema = z.array(BookmarkSchema);