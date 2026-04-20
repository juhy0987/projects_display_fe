import { postJson } from "./client";

/** POST /api/url-embed/fetch 응답. BE 의 UrlFetchResponse 와 1:1 대응. */
export interface UrlEmbedMeta {
  url: string;
  title: string;
  description: string;
  logo: string;
  provider: string;
  fetched_at: string;
  status: "pending" | "success" | "error";
  error: string;
}

export function fetchUrlEmbed(
  url: string,
  blockId: string | null = null,
): Promise<UrlEmbedMeta> {
  const body: Record<string, unknown> = { url };
  if (blockId !== null) body.block_id = blockId;
  return postJson<UrlEmbedMeta>("/api/url-embed/fetch", body);
}
