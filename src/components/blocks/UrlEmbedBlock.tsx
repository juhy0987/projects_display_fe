// -- URL 임베드 블록 ---------------------------------------------------------
//
// 상태 머신: 입력 -> 로딩/에러 -> 카드 표시. 기존 urlEmbedBlock.js 의
// DOM 구조(.notion-url-embed > .url-embed-input-wrap / .url-embed-error /
// .url-embed-card-wrap > .url-embed-card) 를 그대로 유지한다.

import { useCallback, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import * as urlEmbedApi from "@/api/urlEmbed";

export default function UrlEmbedBlock({ block, onReload }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const hasCard = !!block.url && !!block.embed_title;
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!hasCard);

  const handleFetch = useCallback(async () => {
    if (!inputUrl.trim()) return;
    setLoading(true);
    setError("");
    try {
      const meta = await urlEmbedApi.fetchUrlEmbed(inputUrl, block.id);
      await blocksApi.patchBlock(block.id, {
        url: inputUrl,
        embed_title: meta.title,
        embed_description: meta.description,
        embed_image: meta.image,
        embed_logo: meta.logo,
      });
      setEditing(false);
      onReload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "URL 정보를 가져올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [block.id, inputUrl, onReload]);

  const showInput = editing || !hasCard;

  return (
    <div className="notion-block notion-url-embed">
      {/* 입력 폼 */}
      <div className="url-embed-input-wrap" hidden={!showInput}>
        <span className="url-embed-input-icon">&#128279;</span>
        <input
          type="url"
          className="url-embed-input"
          placeholder="URL 을 입력하고 Enter"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleFetch();
          }}
          disabled={loading || !authenticated}
        />
      </div>

      {/* 에러 */}
      <div className="url-embed-error" hidden={!error}>
        <span>{error}</span>
        <button
          type="button"
          className="url-embed-retry-btn"
          onClick={handleFetch}
        >
          재시도
        </button>
      </div>

      {/* 북마크 카드 */}
      <div className="url-embed-card-wrap" hidden={showInput}>
        <a
          className="url-embed-card"
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {block.embed_image && (
            <img
              className="url-embed-image"
              src={block.embed_image}
              alt=""
              loading="lazy"
            />
          )}
          <div className="url-embed-info">
            <strong className="url-embed-title">{block.embed_title}</strong>
            {block.embed_description && (
              <p className="url-embed-description">{block.embed_description}</p>
            )}
            <span className="url-embed-url">
              {block.embed_logo && (
                <img className="url-embed-logo" src={block.embed_logo} alt="" />
              )}
              {block.url}
            </span>
          </div>
        </a>
        {authenticated && (
          <button
            type="button"
            className="url-embed-placeholder-edit-btn"
            onClick={() => {
              setInputUrl(block.url ?? "");
              setEditing(true);
            }}
          >
            수정
          </button>
        )}
      </div>
    </div>
  );
}
