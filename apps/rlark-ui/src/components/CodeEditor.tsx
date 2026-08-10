import { useMemo, useState, type ChangeEventHandler } from "react";
import { Braces, TerminalSquare } from "lucide-react";

function LineNumbers({ count, offset = 0 }: { count: number; offset?: number }) {
  return (
    <div className="code-editor-lines" aria-hidden="true" style={{ transform: `translateY(${-offset}px)` }}>
      {Array.from({ length: Math.max(1, count) }, (_, index) => <span key={index}>{index + 1}</span>)}
    </div>
  );
}

function EditorHeader({ label, language }: { label: string; language: string }) {
  return (
    <div className="code-editor-header">
      <span><TerminalSquare size={13} />{label}</span>
      <em><Braces size={12} />{language}</em>
    </div>
  );
}

export function CodeEditorField({
  value,
  onChange,
  placeholder,
  minHeight = 112,
  label = "script.sh",
  language = "Shell",
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  minHeight?: number;
  label?: string;
  language?: string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const lineCount = useMemo(() => value.split("\n").length, [value]);
  return (
    <div className="code-editor-shell code-editor-input">
      <EditorHeader label={label} language={language} />
      <div className="code-editor-body">
        <LineNumbers count={lineCount} offset={scrollTop} />
        <textarea
          value={value}
          onChange={onChange}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

export function CodeBlock({
  code,
  label = "script.sh",
  language = "Shell",
}: {
  code: string;
  label?: string;
  language?: string;
}) {
  const lines = code.split("\n");
  return (
    <div className="code-editor-shell code-editor-viewer">
      <EditorHeader label={label} language={language} />
      <div className="code-editor-body">
        <LineNumbers count={lines.length} />
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
}
