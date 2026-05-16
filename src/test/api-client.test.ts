// -- API client 단위 테스트 ---------------------------------------------------

import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiUrl, getJson, postJson, patchJson, patchVoid, delVoid } from "@/api/client";

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

  describe("apiUrl()", () => {
    it("상대 경로는 BASE prefix 가 붙는다 (BASE 가 빈 dev 환경에서는 경로 그대로)", () => {
      expect(apiUrl("/api/files/1")).toBe("/api/files/1");
      expect(apiUrl("/static/uploads/x.webp")).toBe("/static/uploads/x.webp");
    });

    it("빈 값은 빈 문자열로 그대로 반환한다 (BASE 만 남는 깨진 URL 방지)", () => {
      expect(apiUrl("")).toBe("");
    });

    it("이미 절대 URL 이면 BASE 를 중복으로 붙이지 않는다", () => {
      expect(apiUrl("https://cdn.example.com/x.webp")).toBe("https://cdn.example.com/x.webp");
      expect(apiUrl("http://example.com/x")).toBe("http://example.com/x");
      expect(apiUrl("//cdn.example.com/x")).toBe("//cdn.example.com/x");
    });
  });
});
