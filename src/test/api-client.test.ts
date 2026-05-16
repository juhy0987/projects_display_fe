// -- API client 단위 테스트 ---------------------------------------------------

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getJson, postJson, patchJson, patchVoid, delVoid } from "@/api/client";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("API client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("getJson() 은 JSON 응답을 파싱하여 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ id: "1", title: "test" })),
    });

    const result = await getJson("/api/documents/1");
    expect(result).toEqual({ id: "1", title: "test" });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents/1",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("postJson() 은 JSON body 를 포함하여 요청한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ id: "2" })),
    });

    await postJson("/api/documents", { title: "new" });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "new" }),
      }),
    );
  });

  it("403 응답 시 권한 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    });

    await expect(getJson("/api/protected")).rejects.toThrow("로그인이 필요합니다");
  });

  it("서버 에러 시 detail 메시지를 포함한 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ detail: "유효하지 않은 입력" }),
      text: () => Promise.resolve(JSON.stringify({ detail: "유효하지 않은 입력" })),
    });

    await expect(patchJson("/api/blocks/1", {})).rejects.toThrow("유효하지 않은 입력");
  });

  it("delVoid() 는 DELETE 메서드로 요청하고 void 를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: () => Promise.resolve(""),
    });

    const result = await delVoid("/api/blocks/1");
    expect(result).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/blocks/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("patchVoid() 는 204 응답을 파싱 없이 성공 처리한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: () => Promise.resolve(""),
    });

    const result = await patchVoid("/api/blocks/1/position", { before_block_id: null });
    expect(result).toBeUndefined();
  });

  it("getJson() 은 빈 응답 본문에 대해 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(""),
    });

    await expect(getJson("/api/empty")).rejects.toThrow("빈 응답 본문");
  });
});
