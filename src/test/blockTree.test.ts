// -- blockTree 순수 함수 테스트 ----------------------------------------------

import { describe, it, expect } from "vitest";
import type { Block, BlockType } from "@/types";
import {
  appendRootBlock,
  insertBlockAfter,
  lastRootIsText,
  moveBlockInTree,
  patchBlockById,
  removeBlockById,
  replaceBlockById,
} from "@/utils/blockTree";

function mk(id: string, type: BlockType = "text", children: Block[] = []): Block {
  return {
    id,
    type,
    document_id: "doc",
    parent_block_id: null,
    children,
  };
}

describe("blockTree", () => {
  describe("removeBlockById", () => {
    it("루트 레벨 블록을 제거한다", () => {
      const tree = [mk("a"), mk("b"), mk("c")];
      const result = removeBlockById(tree, "b");
      expect(result.map((b) => b.id)).toEqual(["a", "c"]);
    });

    it("중첩된 블록을 제거한다", () => {
      const tree = [mk("a", "toggle", [mk("a1"), mk("a2")])];
      const result = removeBlockById(tree, "a1");
      expect(result[0]?.children.map((b) => b.id)).toEqual(["a2"]);
    });
  });

  describe("insertBlockAfter", () => {
    it("루트 레벨 afterId 뒤에 삽입한다", () => {
      const tree = [mk("a"), mk("b"), mk("c")];
      const result = insertBlockAfter(tree, "b", mk("x"), null);
      expect(result.map((b) => b.id)).toEqual(["a", "b", "x", "c"]);
    });

    it("중첩된 부모의 children 안에 삽입한다", () => {
      const tree = [mk("a", "toggle", [mk("a1"), mk("a2")])];
      const result = insertBlockAfter(tree, "a1", mk("x"), "a");
      expect(result[0]?.children.map((b) => b.id)).toEqual(["a1", "x", "a2"]);
    });
  });

  describe("moveBlockInTree", () => {
    it("같은 부모 내에서 beforeId 앞으로 이동한다", () => {
      const tree = [mk("a"), mk("b"), mk("c"), mk("d")];
      const result = moveBlockInTree(tree, "c", "a");
      expect(result.map((b) => b.id)).toEqual(["c", "a", "b", "d"]);
    });

    it("beforeId 가 null 이면 맨 끝으로 이동한다", () => {
      const tree = [mk("a"), mk("b"), mk("c")];
      const result = moveBlockInTree(tree, "a", null);
      expect(result.map((b) => b.id)).toEqual(["b", "c", "a"]);
    });

    it("중첩된 부모의 자식들을 재정렬한다", () => {
      const tree = [mk("p", "toggle", [mk("x"), mk("y"), mk("z")])];
      const result = moveBlockInTree(tree, "z", "x");
      expect(result[0]?.children.map((b) => b.id)).toEqual(["z", "x", "y"]);
    });
  });

  describe("replaceBlockById", () => {
    it("블록을 통째로 교체한다", () => {
      const tree = [mk("a", "text"), mk("b", "code")];
      const result = replaceBlockById(tree, "b", mk("b", "callout"));
      expect(result[1]?.type).toBe("callout");
    });
  });

  describe("patchBlockById", () => {
    it("블록 필드를 부분 갱신하고 children 은 유지한다", () => {
      const tree = [mk("a", "toggle", [mk("a1")])];
      const result = patchBlockById(tree, "a", { is_open: false });
      expect(result[0]?.is_open).toBe(false);
      expect(result[0]?.children.map((b) => b.id)).toEqual(["a1"]);
    });
  });

  describe("lastRootIsText", () => {
    it("빈 배열은 false", () => {
      expect(lastRootIsText([])).toBe(false);
    });
    it("마지막이 text 이면 true", () => {
      expect(lastRootIsText([mk("a", "image"), mk("b", "text")])).toBe(true);
    });
    it("마지막이 text 가 아니면 false", () => {
      expect(lastRootIsText([mk("a", "text"), mk("b", "image")])).toBe(false);
    });
  });

  describe("appendRootBlock", () => {
    it("루트 배열 끝에 추가한다", () => {
      const result = appendRootBlock([mk("a")], mk("b"));
      expect(result.map((b) => b.id)).toEqual(["a", "b"]);
    });
  });
});
