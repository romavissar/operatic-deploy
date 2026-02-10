import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
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
  /** Allow raw HTML (e.g. &lt;img src="..." width="300" /&gt; for image size in excerpts). Use only for trusted content (e.g. admin-authored excerpts). */
  allowHtml?: boolean;
}

export function MarkdownContent({ content, allowHtml }: MarkdownContentProps) {
  const normalized = normalizeMathDelimiters(content);
  const rehypePlugins = [rehypeKatex, ...(allowHtml ? [rehypeRaw] : [])];
  return (
    <div className="prose-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={rehypePlugins}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
