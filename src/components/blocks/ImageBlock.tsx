// -- 이미지 블록 -------------------------------------------------------------
//
// 기존 imageBlock.js 를 React 로 전환. 업로드, 캡션 편집, 라이트박스.
// global.css 의 카노니컬 구조에 맞춘다:
//   .notion-image-wrap
//     .image-media-wrap        (hover 시 .image-actions 노출)
//       img.notion-image
//       .image-actions
//         button.image-action-btn
//     .notion-caption[.is-empty]
//   .image-lightbox-overlay
//     img.image-lightbox-img
//     button.image-lightbox-close

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";
import { useAuth } from "@/contexts/AuthContext";
import * as blocksApi from "@/api/blocks";
import * as uploadApi from "@/api/upload";

export default function ImageBlock({ block, onReload }: BlockComponentProps) {
  const { authenticated } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const captionRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImage = !!block.url;
  const captionText = block.caption ?? "";
  const captionEmpty = captionText.trim() === "";

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const result = await uploadApi.uploadImage(file);
        await blocksApi.patchBlock(block.id, {
          url: result.url,
          thumbnail_url: result.thumbnail_url,
        });
        onReload();
      } catch (e) {
        alert(e instanceof Error ? e.message : "이미지 업로드 실패");
      } finally {
        setUploading(false);
      }
    },
    [block.id, onReload],
  );

  const handleCaptionBlur = useCallback(async () => {
    const text = captionRef.current?.textContent ?? "";
    if (text !== captionText) {
      await blocksApi.patchBlock(block.id, { caption: text });
    }
  }, [block.id, captionText]);

  // 라이트박스 오픈 시 스크롤 잠금 + Escape 닫기
  useEffect(() => {
    if (!lightbox) return;
    document.body.classList.add("lightbox-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("lightbox-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  // -- 빈 이미지 플레이스홀더 --
  if (!hasImage) {
    return (
      <div className="notion-image-wrap">
        {uploading ? (
          <div className="image-placeholder">업로드 중...</div>
        ) : (
          <div
            className="image-placeholder"
            onClick={() => authenticated && fileInputRef.current?.click()}
          >
            {authenticated ? "클릭하여 이미지를 업로드" : "이미지 없음"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // -- 이미지 렌더 --
  return (
    <>
      <div className="notion-image-wrap">
        <div className="image-media-wrap">
          <img
            className="notion-image"
            src={block.url}
            alt={captionText}
            loading="lazy"
            onClick={() => setLightbox(true)}
          />
          {authenticated && (
            <div className="image-actions">
              <button
                type="button"
                className="image-action-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                교체
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />
            </div>
          )}
        </div>

        <figcaption
          ref={captionRef}
          className={`notion-caption${captionEmpty ? " is-empty" : ""}`}
          data-placeholder="캡션을 입력하세요"
          contentEditable={authenticated}
          suppressContentEditableWarning
          onBlur={handleCaptionBlur}
        >
          {captionText}
        </figcaption>
      </div>

      {lightbox && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setLightbox(false)}
        >
          <img
            className="image-lightbox-img"
            src={block.url}
            alt={captionText}
          />
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setLightbox(false)}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
