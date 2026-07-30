"use client";

import React, { useRef, useEffect } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2,
  List, ListOrdered, Quote, Highlighter, RemoveFormatting,
  Type, Sparkles
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your thoughts, feelings, and experiences here...",
  minHeight = "240px"
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync value from outside if changed externally (e.g. AI suggestions inserted)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Avoid wiping cursor position if user is typing
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleExecCommand = (command: string, value: string | undefined = undefined) => {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        handleExecCommand("bold");
      } else if (e.key === "i" || e.key === "I") {
        e.preventDefault();
        handleExecCommand("italic");
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        handleExecCommand("underline");
      }
    }
  };

  // Helper to extract text only for word count
  const plainText = typeof window !== "undefined"
    ? (editorRef.current?.innerText || "").trim()
    : value.replace(/<[^>]+>/g, "").trim();

  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md shadow-xl transition-all focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-950/80 border-b border-slate-800/80 text-slate-400">
        <button
          type="button"
          onClick={() => handleExecCommand("bold")}
          title="Bold (Ctrl+B)"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("italic")}
          title="Italic (Ctrl+I)"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("underline")}
          title="Underline (Ctrl+U)"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Underline className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("strikeThrough")}
          title="Strikethrough"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-800 my-auto mx-1" />

        <button
          type="button"
          onClick={() => handleExecCommand("formatBlock", "<h1>")}
          title="Heading 1"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("formatBlock", "<h2>")}
          title="Heading 2"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("formatBlock", "<p>")}
          title="Normal Paragraph"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Type className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-800 my-auto mx-1" />

        <button
          type="button"
          onClick={() => handleExecCommand("insertUnorderedList")}
          title="Bullet List"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("insertOrderedList")}
          title="Numbered List"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("formatBlock", "<blockquote>")}
          title="Quote Block"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleExecCommand("hiliteColor", "#3b82f640")}
          title="Highlight Text"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Highlighter className="w-4 h-4 text-violet-400" />
        </button>

        <div className="w-px h-5 bg-slate-800 my-auto mx-1" />

        <button
          type="button"
          onClick={() => handleExecCommand("removeFormat")}
          title="Clear Formatting"
          className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center gap-2 px-2 text-xs text-slate-500">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative">
        {(!value || value === "<br>") && (
          <div className="absolute top-4 left-4 pointer-events-none text-slate-600 text-sm leading-relaxed select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{ minHeight }}
          className="p-4 text-slate-200 text-sm leading-relaxed outline-none prose prose-invert max-w-none focus:outline-none"
        />
      </div>
    </div>
  );
}
