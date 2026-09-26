import React from "react";

/**
 * Minimal, safe rich-text renderer for event bodies.
 *
 * Editors write a small subset of Markdown. Everything is escaped first and
 * then a fixed whitelist of formatting is re-applied, so pasted HTML or a
 * script tag renders as literal text rather than executing. No dependency,
 * no dangerouslySetInnerHTML on unescaped input.
 *
 * Supported:
 *   # Heading          -> h3
 *   ## Subheading      -> h4
 *   - item             -> bullet list
 *   1. item            -> numbered list
 *   > quote            -> blockquote
 *   **bold**  *italic*
 *   [text](https://…)  -> link (http/https only)
 *   blank line         -> new paragraph
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Inline formatting, applied to already-escaped text. */
function inline(escaped: string): string {
  return (
    escaped
      // [label](url) — only http(s), and the label is already escaped
      .replace(
        /\[([^\]]{1,120})\]\((https?:\/\/[^\s)]{1,500})\)/g,
        (_m, label, href) =>
          `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow" class="text-gold-600 underline underline-offset-2 hover:text-gold-700">${label}</a>`
      )
      .replace(/\*\*([^*]{1,200})\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]{1,200})\*/g, "$1<em>$2</em>")
  );
}

interface Block {
  type: "p" | "h3" | "h4" | "ul" | "ol" | "quote";
  lines: string[];
}

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;

  const push = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const rawLine of src.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") { push(); continue; }

    const h1 = line.match(/^#\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const quote = line.match(/^>\s?(.*)$/);

    if (h2) { push(); blocks.push({ type: "h4", lines: [h2[1]] }); continue; }
    if (h1) { push(); blocks.push({ type: "h3", lines: [h1[1]] }); continue; }

    if (bullet) {
      if (current?.type !== "ul") { push(); current = { type: "ul", lines: [] }; }
      current.lines.push(bullet[1]);
      continue;
    }
    if (numbered) {
      if (current?.type !== "ol") { push(); current = { type: "ol", lines: [] }; }
      current.lines.push(numbered[1]);
      continue;
    }
    if (quote) {
      if (current?.type !== "quote") { push(); current = { type: "quote", lines: [] }; }
      current.lines.push(quote[1]);
      continue;
    }

    if (current?.type !== "p") { push(); current = { type: "p", lines: [] }; }
    current.lines.push(line);
  }
  push();

  return blocks;
}

export default function RichText({ content }: { content: string }) {
  if (!content?.trim()) return null;

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const html = (text: string) => ({ __html: inline(escapeHtml(text)) });

        switch (block.type) {
          case "h3":
            return (
              <h3
                key={i}
                className="font-display text-2xl font-bold text-brown-900 pt-2"
                dangerouslySetInnerHTML={html(block.lines[0])}
              />
            );
          case "h4":
            return (
              <h4
                key={i}
                className="font-display text-lg font-bold text-brown-800 pt-1"
                dangerouslySetInnerHTML={html(block.lines[0])}
              />
            );
          case "ul":
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 text-brown-700 leading-relaxed">
                {block.lines.map((li, j) => (
                  <li key={j} dangerouslySetInnerHTML={html(li)} />
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal pl-5 space-y-1.5 text-brown-700 leading-relaxed">
                {block.lines.map((li, j) => (
                  <li key={j} dangerouslySetInnerHTML={html(li)} />
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-3 border-gold-400 pl-4 italic text-brown-600 leading-relaxed"
                style={{ borderLeftWidth: 3 }}
                dangerouslySetInnerHTML={html(block.lines.join(" "))}
              />
            );
          default:
            return (
              <p
                key={i}
                className="text-brown-700 leading-relaxed"
                dangerouslySetInnerHTML={html(block.lines.join(" "))}
              />
            );
        }
      })}
    </div>
  );
}
