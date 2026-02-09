import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * remark-math only parses $ and $$. Convert LaTeX-style \( \), \[ \] so they render.
 */
function normalizeMathDelimiters(text: string): string {
  return text
    .replace(/\\\]/g, "$$")
    .replace(/\\\[/g, "$$")
    .replace(/\\\)/g, "$")
    .replace(/\\\(/g, "$");
}

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const normalized = normalizeMathDelimiters(content);
  return (
    <div className="prose-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
