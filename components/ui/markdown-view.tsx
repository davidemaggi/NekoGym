import ReactMarkdown, { type Components } from "react-markdown";

import { cn } from "@/lib/utils";

// Raw HTML is never rendered (react-markdown's default): descriptions are written by staff but read by everyone.
const components: Components = {
  h1: ({ children }) => <h3 className="mt-5 text-[19px] font-semibold leading-snug first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-5 text-[17px] font-semibold leading-snug first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-4 text-[15px] font-semibold leading-snug first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-4 text-[15px] font-semibold leading-snug first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="mt-3 first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-5 first:mt-0">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-5 first:mt-0">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="mt-3 border-l-2 border-[var(--rule)] pl-4 text-[var(--muted-foreground)] first:mt-0">{children}</blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-[1.5px] underline-offset-4">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  hr: () => <hr className="my-4 border-[var(--rule)]" />,
  code: ({ children }) => <code className="rounded bg-[var(--muted)] px-1 py-0.5 text-[0.9em]">{children}</code>,
  img: () => null,
};

/** A course (or lesson) description written in Markdown, set in the app's reading type. */
export function MarkdownView({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cn("max-w-[65ch] text-[15px] leading-relaxed", className)}>
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
