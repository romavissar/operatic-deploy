"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { formatInEET } from "@/lib/datetime";
import { MarkdownContent } from "@/components/MarkdownContent";

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  excerpt: string;
  published: boolean;
  author_name: string | null;
  author_email: string | null;
  readingMinutes: number;
  likeCount: number;
  tags: { id: string; name: string }[];
};

interface PostsListWithSearchProps {
  posts: PostListItem[];
}

function matchPost(q: string, post: PostListItem): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  return (
    post.title.toLowerCase().includes(term) ||
    post.slug.toLowerCase().includes(term) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(term)) ||
    (post.author_name && post.author_name.toLowerCase().includes(term)) ||
    (post.author_email && post.author_email.toLowerCase().includes(term))
  );
}

export function PostsListWithSearch({ posts }: PostsListWithSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return query.trim() ? posts.filter((p) => matchPost(query, p)) : posts;
  }, [posts, query]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-light tracking-tight text-foreground">
          Posts
        </h1>
        <label className="flex items-center gap-2 font-light text-sm text-foreground/80">
          <span className="sr-only">Search posts</span>
          <input
            type="search"
            placeholder="Search posts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-56 border border-border bg-background px-3 py-2 text-foreground font-light text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/30"
            aria-label="Search posts by title, excerpt, or author"
          />
        </label>
      </div>
      {filtered.length ? (
        <ul className="space-y-8">
          {filtered.map((post) => (
            <li key={post.id} className="border-b border-border pb-6">
              <Link href={`/posts/${post.slug}`} className="block group">
                <h2 className="text-lg font-light tracking-tight text-foreground group-hover:opacity-70">
                  {post.title}
                </h2>
                <div className="text-sm text-foreground/60 font-light mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <time dateTime={new Date(post.published_at).toISOString()}>
                    {formatInEET(post.published_at, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span>{post.readingMinutes} min read</span>
                  <span>{post.likeCount} {post.likeCount === 1 ? "like" : "likes"}</span>
                  {post.tags.length > 0 && (
                    <>
                      {post.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-block px-2 py-0.5 text-xs font-light rounded border border-foreground/20 text-foreground/70"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </>
                  )}
                </div>
                {(post.author_name ?? post.author_email) && (
                  <span className="text-sm text-foreground/60 font-light mt-0.5 block">
                    {post.author_name ?? post.author_email}
                  </span>
                )}
                {post.excerpt && (
                  <div className="text-foreground/80 font-light mt-2 text-sm leading-relaxed [&_.prose-markdown]:text-sm [&_.prose-markdown]:font-light">
                    <MarkdownContent content={post.excerpt} />
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-foreground/60 font-light">
          {query.trim() ? "No posts match your search." : "No posts yet."}
        </p>
      )}
    </div>
  );
}
