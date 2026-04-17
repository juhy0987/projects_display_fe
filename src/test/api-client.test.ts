// -- API client 단위 테스트 ---------------------------------------------------

import { describe, it, expect, vi, beforeEach } from "vitest";
import { get, post, patch, del } from "@/api/client";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("API client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("get() 은 JSON 응답을 파싱하여 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ id: "1", title: "test" })),
    });

    const result = await get("/api/documents/1");
    expect(result).toEqual({ id: "1", title: "test" });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/documents/1",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("post() 는 JSON body 를 포함하여 요청한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ id: "2" })),
    });

    await post("/api/documents", { title: "new" });
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
      text: () => Promise.resolve(""),
    });

    await expect(get("/api/protected")).rejects.toThrow("로그인이 필요합니다");
  });

  it("서버 에러 시 detail 메시지를 포함한 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ detail: "유효하지 않은 입력" }),
      text: () => Promise.resolve(JSON.stringify({ detail: "유효하지 않은 입력" })),
    });

    await expect(patch("/api/blocks/1", {})).rejects.toThrow("유효하지 않은 입력");
  });

  it("del() 은 DELETE 메서드로 요청한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: () => Promise.resolve(""),
    });

    await del("/api/blocks/1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/blocks/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
