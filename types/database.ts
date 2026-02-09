export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          published_at: string;
          excerpt: string;
          content: string;
          published: boolean;
          author_email: string | null;
          author_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          published_at: string;
          excerpt: string;
          content: string;
          published: boolean;
          author_email?: string | null;
          author_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          published_at?: string;
          excerpt?: string;
          content?: string;
          published?: boolean;
          author_email?: string | null;
          author_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          body: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title?: string;
          body?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          body?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          parent_id: string | null;
          author_id: string;
          author_name: string;
          author_image_url: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          parent_id?: string | null;
          author_id: string;
          author_name?: string;
          author_image_url?: string | null;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          parent_id?: string | null;
          author_id?: string;
          author_name?: string;
          author_image_url?: string | null;
          body?: string;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
      };
      post_tags: {
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
      };
      comment_votes: {
        Row: {
          comment_id: string;
          user_id: string;
          vote: number;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          vote: number;
        };
        Update: {
          comment_id?: string;
          user_id?: string;
          vote?: number;
        };
      };
    };
  };
}

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Page = Database["public"]["Tables"]["pages"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type PostTag = Database["public"]["Tables"]["post_tags"]["Row"];
export type CommentVote = Database["public"]["Tables"]["comment_votes"]["Row"];
