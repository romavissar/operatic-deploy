const WORDS_PER_MINUTE = 200;

/**
 * Strip markdown syntax to approximate plain text for word count.
 */
function stripMarkdown(text: string): string {
  return (
    text
      // Code blocks
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]+`/g, " ")
      // Links: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Images: ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Headers (# ## ###)
      .replace(/^#{1,6}\s+/gm, " ")
      // Bold/italic
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
      .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
      // Blockquote
      .replace(/^\s*>/gm, " ")
      // List markers
      .replace(/^\s*[-*+]\s+/gm, " ")
      .replace(/^\s*\d+\.\s+/gm, " ")
      // Horizontal rule
      .replace(/^[-*_]{3,}\s*$/gm, " ")
      // Inline math \( \) \[ \]
      .replace(/\\?[()[\]$]+/g, " ")
      .trim()
  );
}

export function getReadingTimeMinutes(content: string): number {
  const plain = stripMarkdown(content ?? "");
  const words = plain.split(/\s+/).filter(Boolean).length;
  const minutes = words / WORDS_PER_MINUTE;
  return Math.max(1, Math.ceil(minutes));
}
