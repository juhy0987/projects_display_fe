import { post } from "./client";

export interface UrlEmbedMeta {
  title: string;
  description: string;
  image: string;
  logo: string;
  url: string;
}

export function fetchUrlEmbed(
  url: string,
  blockId: string | null = null,
): Promise<UrlEmbedMeta> {
  const body: Record<string, unknown> = { url };
  if (blockId !== null) body.block_id = blockId;
  return post<UrlEmbedMeta>("/api/url-embed/fetch", body);
}
