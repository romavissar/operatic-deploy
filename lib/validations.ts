import { z } from "zod";

const uuid = z.string().uuid();

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, hyphens only"),
  published_at: z.string().datetime().optional(),
  excerpt: z.string(),
  content: z.string(),
  published: z.boolean(),
  tag_ids: z.array(uuid).optional().default([]),
});

export const updatePostSchema = createPostSchema.partial().extend({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  tag_ids: z.array(uuid).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

const emailSchema = z.string().email("Invalid email").transform((s) => s.trim().toLowerCase());

export const newsletterSubscribeSchema = z.object({
  email: emailSchema,
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
