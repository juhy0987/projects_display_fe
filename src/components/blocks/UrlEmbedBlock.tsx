// -- URL 임베드 블록 ---------------------------------------------------------
//
// 원본 urlEmbedBlock.js 의 상태 머신을 React 로 재현:
//
//   [기존 블록 / 타입 변환]                 [신규 생성]
//          ↓                                    ↓
//   placeholder (편집 유도)              inputMode (자동 오픈)
//          ↓ "URL 입력" 버튼                    ↓ Enter
//     inputMode                            fetch 요청
//          ↓ Enter                          ├─ success → card
//   fetch 요청                             └─ error   → inputMode + error
//     ├─ success → card                         ↑ 재시도
//     └─ error   → inputMode + error
//
//   [card 상태]
//     호버 → ✎ 버튼 → inputMode
//
// BE 의 UrlEmbedBlock 필드 (url, title, description, logo, provider, status)
// 를 그대로 사용한다. 카드 여부는 status === "success" && url 으로 판정한다.

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as urlEmbedApi from "@/api/urlEmbed";

type Mode = "card" | "input" | "placeholder";

export default function UrlEmbedBlock({ block, onReload }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // 초기 모드: status 가 success 이고 url 이 있으면 card, 아니면 placeholder
  const initialMode: Mode =
    block.status === "success" && block.url ? "card" : "placeholder";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [inputValue, setInputValue] = useState(block.url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 서버에서 블록이 갱신될 때마다 모드/값을 동기화
  useEffect(() => {
    if (block.status === "success" && block.url) {
      setMode("card");
    }
    setInputValue(block.url ?? "");
  }, [block.status, block.url]);

  // input 모드 진입 시 자동 포커스
  useEffect(() => {
    if (mode === "input") inputRef.current?.focus();
  }, [mode]);

  const fetchMeta = useCallback(
    async (url: string) => {
      if (!url || loading) return;
      setLoading(true);
      setError("");
      try {
        const meta = await urlEmbedApi.fetchUrlEmbed(url, block.id);
        // BE 가 DB 의 블록을 이미 갱신했으므로 onReload 로 최신 상태를 받아온다.
        if (meta.status === "success") {
          onReload();
          // onReload 후 useEffect 가 mode 를 card 로 전환한다.
        } else {
          setError(meta.error || "메타데이터를 가져올 수 없습니다.");
          setMode("input");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "서버 오류가 발생했습니다.");
        setMode("input");
      } finally {
        setLoading(false);
      }
    },
    [block.id, loading, onReload],
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const url = inputValue.trim();
        if (url) void fetchMeta(url);
      }
      if (e.key === "Escape") {
        // 기존 카드가 있으면 카드로, 없으면 placeholder 로
        if (block.status === "success" && block.url) {
          setMode("card");
        } else {
          setMode("placeholder");
        }
        setError("");
      }
    },
    [block.status, block.url, fetchMeta, inputValue],
  );

  const enterInputMode = useCallback(() => {
    setInputValue(block.url ?? "");
    setMode("input");
    setError("");
  }, [block.url]);

  const handleRetry = useCallback(() => {
    const url = inputValue.trim() || block.url || "";
    if (url) void fetchMeta(url);
  }, [block.url, fetchMeta, inputValue]);

  // 블록에 url 이 비어 있는데 viewer 모드면 빈 placeholder
  const hasUrl = !!block.url;

  return (
    <div className="notion-block notion-url-embed">
      {/* 편집 유도 placeholder */}
      <div
        className="url-embed-placeholder"
        hidden={mode !== "placeholder"}
      >
        <span className="url-embed-placeholder-icon">🔗</span>
        <span className="url-embed-placeholder-text">
          {hasUrl ? block.url : "URL 임베드"}
        </span>
        {authenticated && (
          <button
            type="button"
            className="url-embed-placeholder-edit-btn"
            onClick={enterInputMode}
          >
            ✎ URL 입력
          </button>
        )}
      </div>

      {/* 입력 폼 */}
      <div className="url-embed-input-wrap" hidden={mode !== "input"}>
        <span className="url-embed-input-icon">🔗</span>
        <input
          ref={inputRef}
          type="url"
          className="url-embed-input"
          placeholder={loading ? "가져오는 중..." : "URL을 붙여넣으세요..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          disabled={loading}
        />
      </div>

      {/* 에러 메시지 (입력 모드 아래에 표시) */}
      <div className="url-embed-error" hidden={!error}>
        <span className="url-embed-error-msg">{error}</span>
        <button
          type="button"
          className="url-embed-retry-btn"
          onClick={handleRetry}
          disabled={loading}
        >
          재시도
        </button>
      </div>

      {/* 북마크 카드 */}
      <div className="url-embed-card-wrap" hidden={mode !== "card"}>
        <a
          className="url-embed-card"
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="url-embed-info">
            <strong className="url-embed-title">
              {block.title || block.url || "제목 없음"}
            </strong>
            {block.description && (
              <p className="url-embed-description">{block.description}</p>
            )}
            <span className="url-embed-provider">
              {block.logo && (
                <img
                  className="url-embed-logo"
                  src={block.logo}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).hidden = true;
                  }}
                />
              )}
              {block.provider || block.url}
            </span>
          </div>
        </a>
        {authenticated && (
          <button
            type="button"
            className="url-embed-edit-btn"
            onClick={enterInputMode}
            aria-label="URL 수정"
          >
            ✎
          </button>
        )}
      </div>
    </div>
  );
}
