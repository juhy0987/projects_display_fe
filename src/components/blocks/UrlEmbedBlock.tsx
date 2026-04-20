// -- URL 임베드 블록 ---------------------------------------------------------
//
// 상태 머신: 입력 -> 로딩 -> 카드 표시. 기존 urlEmbedBlock.js 와 동일.

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

  if (editing || !hasCard) {
    return (
      <div className="notion-url-embed url-embed-input-state">
        <input
          type="url"
          className="url-embed-input"
          placeholder="URL을 입력하세요"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleFetch();
          }}
          disabled={loading}
        />
        <button
          type="button"
          className="url-embed-fetch-btn"
          onClick={handleFetch}
          disabled={loading}
        >
          {loading ? "로딩 중..." : "임베드"}
        </button>
        {error && <p className="url-embed-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="notion-url-embed">
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
          className="url-embed-edit-btn"
          onClick={() => {
            setInputUrl(block.url ?? "");
            setEditing(true);
          }}
        >
          수정
        </button>
      )}
    </div>
  );
}
