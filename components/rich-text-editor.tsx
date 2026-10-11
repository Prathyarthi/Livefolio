"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

function getMarkdown(editor: Editor): string {
  const storage = editor.storage as {
    markdown?: { getMarkdown?: () => string };
  };
  return storage.markdown?.getMarkdown?.() ?? editor.getText();
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "size-7 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        active && "bg-zinc-100 text-zinc-900",
      )}
    >
      {children}
    </Button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-zinc-200" aria-hidden />;
}

function getClipRect(el: Element | null): DOMRect | null {
  if (!el || typeof window === "undefined") return null;
  let node = el.parentElement;
  while (node) {
    const { overflow, overflowX, overflowY } = window.getComputedStyle(node);
    if (/(auto|scroll|overlay|hidden)/.test(`${overflow}${overflowX}${overflowY}`)) {
      return node.getBoundingClientRect();
    }
    node = node.parentElement;
  }
  return null;
}

function isSelectionInClip(editor: Editor): boolean {
  const { from, to } = editor.state.selection;
  if (from === to) return false;
  try {
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const top = Math.min(start.top, end.top);
    const bottom = Math.max(start.bottom, end.bottom);
    const clip = getClipRect(editor.view.dom);
    if (!clip) return true;
    return bottom > clip.top + 8 && top < clip.bottom - 8;
  } catch {
    return false;
  }
}

function isToolbarEventTarget(target: EventTarget | null, menu: HTMLElement | null) {
  if (!(target instanceof Node)) return false;
  if (menu?.contains(target)) return true;
  if (target instanceof Element) {
    return Boolean(target.closest("[data-slot='popover-content']"));
  }
  return false;
}

function SelectionToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [tick, setTick] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", bump);
    editor.on("focus", bump);
    editor.on("blur", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("focus", bump);
      editor.off("blur", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setTick((n) => n + 1);
      });
    };
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;
  const shouldShow =
    editor.isEditable &&
    (linkOpen || (editor.isFocused && hasSelection)) &&
    isSelectionInClip(editor);

  useEffect(() => {
    if (!shouldShow && !hasSelection) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (editor.view.dom.contains(target as Node)) return;
      if (isToolbarEventTarget(target, menuRef.current)) return;
      setLinkOpen(false);
      if (hasSelection) {
        editor.chain().setTextSelection(from).blur().run();
      } else {
        editor.commands.blur();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [editor, from, hasSelection, shouldShow]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu || !shouldShow) return;
    try {
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const selTop = Math.min(start.top, end.top);
      const selBottom = Math.max(start.bottom, end.bottom);
      const selLeft = Math.min(start.left, end.left);
      const selRight = Math.max(start.right, end.right);
      const wrap = menu.offsetParent as HTMLElement | null;
      const wrapRect = wrap?.getBoundingClientRect() ?? { top: 0, left: 0, width: 0 };
      const menuRect = menu.getBoundingClientRect();
      const gap = 8;
      const placeBelow = selTop - wrapRect.top < menuRect.height + gap;
      const top = placeBelow
        ? selBottom - wrapRect.top + gap
        : selTop - wrapRect.top - menuRect.height - gap;
      const rawLeft = (selLeft + selRight) / 2 - wrapRect.left - menuRect.width / 2;
      const maxLeft = Math.max(
        4,
        (wrap?.clientWidth ?? menuRect.width) - menuRect.width - 4,
      );
      const left = Math.min(maxLeft, Math.max(4, rawLeft));
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    } catch {
      /* selection positions can be stale while the editor unmounts */
    }
  }, [editor, from, to, shouldShow, tick]);

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href, target: "_blank", rel: "noopener noreferrer" })
        .run();
    }
    setLinkOpen(false);
  };

  if (!shouldShow) return null;

  return (
    <div
      ref={menuRef}
      data-rich-text-toolbar=""
      className={cn(
        "absolute z-20 flex items-center gap-0.5",
        "rounded-xl border border-zinc-200/90 bg-white px-1.5 py-1",
        "shadow-[0_8px_30px_rgba(0,0,0,0.08)]",
      )}
    >
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" strokeWidth={2.5} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="size-3.5" />
      </ToolbarButton>

      <ToolbarDivider />

      <Popover
        open={linkOpen}
        onOpenChange={(open) => {
          setLinkOpen(open);
          if (open) {
            setLinkUrl(editor.getAttributes("link").href ?? "");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Link"
            aria-pressed={editor.isActive("link")}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "size-7 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              editor.isActive("link") && "bg-zinc-100 text-zinc-900",
            )}
          >
            <Link2 className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-2 p-3" align="start" sideOffset={8}>
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            {editor.isActive("link") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkOpen(false);
                }}
              >
                Remove
              </Button>
            )}
            <Button type="button" size="sm" onClick={applyLink}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Compact single-line field (titles, names, etc.). */
  singleLine?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
  minHeight?: string;
};

export function RichTextEditor({
  value,
  onChange,
  onBlur,
  id,
  placeholder = "Write something…",
  disabled,
  singleLine = false,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
  minHeight,
}: RichTextEditorProps) {
  const resolvedMinHeight = minHeight ?? (singleLine ? "2.5rem" : "7rem");

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: singleLine ? false : undefined,
        orderedList: singleLine ? false : undefined,
        listItem: singleLine ? false : undefined,
        hardBreak: singleLine ? false : undefined,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    [placeholder, singleLine],
  );

  const editor = useEditor({
    extensions,
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none outline-none focus-visible:outline-none",
          singleLine
            ? "px-3 py-2 [&_p]:m-0"
            : "px-3 py-2.5 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5",
          "[&_a]:text-primary [&_a]:underline",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        ),
        ...(ariaInvalid ? { "aria-invalid": "true" } : {}),
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
        role: "textbox",
        "aria-multiline": singleLine ? "false" : "true",
      },
      handleKeyDown: (_view, event) => {
        if (singleLine && event.key === "Enter") {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(getMarkdown(ed));
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = getMarkdown(editor);
    if ((value || "") === current) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-md border border-input bg-transparent shadow-xs",
          className,
        )}
        style={{ minHeight: resolvedMinHeight }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        ariaInvalid &&
          "border-destructive ring-destructive/20 aria-invalid:ring-destructive/20",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {!disabled && <SelectionToolbar editor={editor} />}

      <EditorContent
        editor={editor}
        style={{ minHeight: resolvedMinHeight }}
        className={cn(
          "[&_.ProseMirror]:min-h-[inherit] [&_.ProseMirror]:outline-none",
          singleLine
            ? "[&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2 [&_.ProseMirror]:whitespace-nowrap [&_.ProseMirror]:overflow-x-auto"
            : "[&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2.5",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  );
}