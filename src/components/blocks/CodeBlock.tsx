// -- 코드 블록 ---------------------------------------------------------------
//
// 기존 codeBlock.js 를 React 로 전환.
// highlight.js 구문 강조, Mermaid 다이어그램 렌더링, 언어 선택, 복사 버튼.

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";

declare const hljs: {
  highlightElement: (el: HTMLElement) => void;
  listLanguages: () => string[];
};
declare const mermaid: {
  render: (
    id: string,
    code: string,
  ) => Promise<{ svg: string }>;
};

const POPULAR_LANGUAGES = [
  "", "javascript", "typescript", "python", "java", "go", "rust",
  "html", "css", "sql", "bash", "json", "yaml", "markdown", "mermaid",
];

export default function CodeBlock({ block, onReload }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const codeRef = useRef<HTMLElement>(null);
  const [language, setLanguage] = useState(block.language ?? "");
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 구문 강조 적용
  useEffect(() => {
    if (codeRef.current && language && language !== "mermaid") {
      try {
        hljs.highlightElement(codeRef.current);
      } catch {
        // hljs 미로드 시 무시
      }
    }
  }, [block.code, language]);

  // Mermaid 렌더링
  useEffect(() => {
    if (language !== "mermaid" || !block.code) {
      setMermaidSvg(null);
      return;
    }
    const id = `mermaid-${block.id.replace(/[^a-zA-Z0-9]/g, "")}`;
    mermaid
      .render(id, block.code)
      .then(({ svg }) => setMermaidSvg(svg))
      .catch(() => setMermaidSvg(null));
  }, [block.id, block.code, language]);

  const handleBlur = useCallback(async () => {
    const newCode = codeRef.current?.textContent ?? "";
    if (newCode !== (block.code ?? "")) {
      await blocksApi.patchBlock(block.id, { code: newCode });
    }
  }, [block.id, block.code]);

  const handleLanguageChange = useCallback(
    async (lang: string) => {
      setLanguage(lang);
      await blocksApi.patchBlock(block.id, { language: lang });
      onReload();
    },
    [block.id, onReload],
  );

  const handleCopy = useCallback(() => {
    const text = codeRef.current?.textContent ?? "";
    void navigator.clipboard.writeText(text);
  }, []);

  const isMermaid = language === "mermaid";

  return (
    <div className={`notion-code${isMermaid ? " is-mermaid" : ""}`}>
      <div className="code-header">
        <select
          className="code-language-select"
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={!authenticated}
        >
          {POPULAR_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang || "plain text"}
            </option>
          ))}
        </select>

        {isMermaid && (
          <button
            type="button"
            className="mermaid-toggle-btn"
            onClick={() => setShowPreview((p) => !p)}
          >
            {showPreview ? "코드" : "미리보기"}
          </button>
        )}

        <button
          type="button"
          className="code-copy-btn"
          onClick={handleCopy}
          title="복사"
        >
          복사
        </button>
      </div>

      {showPreview && mermaidSvg ? (
        <div
          className="code-body mermaid-preview"
          dangerouslySetInnerHTML={{ __html: mermaidSvg }}
        />
      ) : (
        <pre className="code-body">
          <code
            ref={codeRef}
            className={`code-content${language ? ` language-${language}` : ""}`}
            contentEditable={authenticated}
            suppressContentEditableWarning
            onBlur={handleBlur}
          >
            {block.code ?? ""}
          </code>
        </pre>
      )}
    </div>
  );
}
