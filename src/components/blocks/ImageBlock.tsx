// -- 이미지 블록 -------------------------------------------------------------
//
// 기존 imageBlock.js 를 React 로 전환. URL/파일 업로드, 캡션 편집, 라이트박스.

import { useCallback, useRef, useState } from "react";
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
    if (text !== (block.caption ?? "")) {
      await blocksApi.patchBlock(block.id, { caption: text });
    }
  }, [block.id, block.caption]);

  if (!hasImage) {
    return (
      <figure className="notion-image empty-image">
        {uploading ? (
          <p className="upload-progress">업로드 중...</p>
        ) : (
          authenticated && (
            <div
              className="image-upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <p>클릭하여 이미지를 업로드하세요</p>
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
          )
        )}
      </figure>
    );
  }

  return (
    <>
      <figure className="notion-image">
        <img
          src={block.url}
          alt={block.caption ?? ""}
          loading="lazy"
          onClick={() => setLightbox(true)}
        />
        <figcaption
          ref={captionRef}
          className="notion-caption"
          contentEditable={authenticated}
          suppressContentEditableWarning
          onBlur={handleCaptionBlur}
        >
          {block.caption ?? ""}
        </figcaption>
      </figure>

      {lightbox && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightbox(false)}
        >
          <img src={block.url} alt={block.caption ?? ""} />
        </div>
      )}
    </>
  );
}
