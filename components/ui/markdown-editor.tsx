"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Quote, Redo2, Undo2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ToolbarLabels = {
  bold: string;
  italic: string;
  heading: string;
  subheading: string;
  bulletList: string;
  orderedList: string;
  quote: string;
  undo: string;
  redo: string;
  toolbar: string;
};

const DEFAULT_LABELS: Record<"it" | "en", ToolbarLabels> = {
  it: {
    bold: "Grassetto",
    italic: "Corsivo",
    heading: "Titolo",
    subheading: "Sottotitolo",
    bulletList: "Elenco puntato",
    orderedList: "Elenco numerato",
    quote: "Citazione",
    undo: "Annulla",
    redo: "Ripeti",
    toolbar: "Formattazione",
  },
  en: {
    bold: "Bold",
    italic: "Italic",
    heading: "Heading",
    subheading: "Subheading",
    bulletList: "Bulleted list",
    orderedList: "Numbered list",
    quote: "Quote",
    undo: "Undo",
    redo: "Redo",
    toolbar: "Formatting",
  },
};

/**
 * WYSIWYG editor that reads and writes Markdown. It posts its value through a hidden input,
 * so it drops into an uncontrolled <form> like a textarea would.
 */
export function MarkdownEditor({
  id,
  name,
  defaultValue,
  locale,
  labelledBy,
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  locale: string;
  labelledBy?: string;
  className?: string;
}) {
  const labels = DEFAULT_LABELS[locale === "en" ? "en" : "it"];
  const [value, setValue] = useState(defaultValue ?? "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Markdown,
    ],
    content: defaultValue ?? "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        role: "textbox",
        "aria-multiline": "true",
        class:
          "min-h-40 px-3.5 py-3 text-[16px] leading-relaxed outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--rule)] [&_blockquote]:pl-4 [&_blockquote]:text-[var(--muted-foreground)] [&_h2]:mt-4 [&_h2]:text-[19px] [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:text-[17px] [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold",
      },
    },
    onUpdate: ({ editor: current }) => setValue(current.getMarkdown()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            bullet: current.isActive("bulletList"),
            ordered: current.isActive("orderedList"),
            quote: current.isActive("blockquote"),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  });

  const tools: Array<{ key: string; icon: LucideIcon; label: string; active?: boolean; disabled?: boolean; run: () => void }> = editor
    ? [
        { key: "bold", icon: Bold, label: labels.bold, active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
        { key: "italic", icon: Italic, label: labels.italic, active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
        { key: "h2", icon: Heading2, label: labels.heading, active: state?.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { key: "h3", icon: Heading3, label: labels.subheading, active: state?.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { key: "ul", icon: List, label: labels.bulletList, active: state?.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
        { key: "ol", icon: ListOrdered, label: labels.orderedList, active: state?.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
        { key: "quote", icon: Quote, label: labels.quote, active: state?.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
        { key: "undo", icon: Undo2, label: labels.undo, disabled: !state?.canUndo, run: () => editor.chain().focus().undo().run() },
        { key: "redo", icon: Redo2, label: labels.redo, disabled: !state?.canRedo, run: () => editor.chain().focus().redo().run() },
      ]
    : [];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--input)] bg-[var(--surface)] focus-within:ring-2 focus-within:ring-[var(--ring)]",
        className
      )}
    >
      <div role="toolbar" aria-label={labels.toolbar} className="flex flex-wrap gap-0.5 border-b border-[var(--rule)] p-1">
        {tools.map(({ key, icon: Icon, label, active, disabled, run }) => (
          <button
            key={key}
            type="button"
            onClick={run}
            disabled={disabled}
            aria-label={label}
            title={label}
            {...(active === undefined ? {} : { "aria-pressed": active })}
            className={cn(
              "h-11 w-11 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
              active ? "bg-[var(--muted)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
              // Phones undo with the system gesture: the toolbar keeps to one row there.
              key === "undo" ? "hidden sm:ml-auto sm:inline-flex" : key === "redo" ? "hidden sm:inline-flex" : "inline-flex"
            )}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      {editor ? <EditorContent editor={editor} /> : <div className="min-h-40" aria-hidden="true" />}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
