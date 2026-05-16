// -- 블록 트리 순수 조작 헬퍼 ------------------------------------------------
//
// 낙관적 업데이트 시 서버 응답을 기다리지 않고 로컬 state 를 먼저 갱신하기
// 위한 불변(immutable) 트리 조작 함수들. 모두 원본을 변형하지 않고 새 트리를
// 반환한다.

import type { Block } from "@/types";

/** blockId 와 일치하는 블록을 트리에서 제거한다. */
export function removeBlockById(blocks: Block[], blockId: string): Block[] {
  return blocks
    .filter((b) => b.id !== blockId)
    .map((b) => ({ ...b, children: removeBlockById(b.children, blockId) }));
}

/** blockId 를 찾아 newBlock 으로 치환한다. */
export function replaceBlockById(
  blocks: Block[],
  blockId: string,
  newBlock: Block,
): Block[] {
  return blocks.map((b) => {
    if (b.id === blockId) return newBlock;
    return { ...b, children: replaceBlockById(b.children, blockId, newBlock) };
  });
}

/** blockId 를 찾아 patch 를 병합한다. children 은 항상 유지 (patch 가 덮어쓰지 못하도록). */
export function patchBlockById(
  blocks: Block[],
  blockId: string,
  patch: Partial<Block>,
): Block[] {
  return blocks.map((b) => {
    if (b.id === blockId) {
      // patch 에 children 이 포함되어 있어도 무시하고 기존 children 을 보존한다.
      const { children: _ignored, ...safePatch } = patch as Partial<Block>;
      return { ...b, ...safePatch, children: b.children };
    }
    return { ...b, children: patchBlockById(b.children, blockId, patch) };
  });
}

/**
 * afterBlockId 블록 바로 뒤에 newBlock 을 삽입한다.
 * parentBlockId 는 afterBlockId 의 부모 id (루트면 null).
 * afterBlockId 를 찾지 못하면 원본 그대로 반환.
 */
export function insertBlockAfter(
  blocks: Block[],
  afterBlockId: string,
  newBlock: Block,
  parentBlockId: string | null,
): Block[] {
  if (parentBlockId === null) {
    const idx = blocks.findIndex((b) => b.id === afterBlockId);
    if (idx < 0) return blocks;
    return [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
  }
  return blocks.map((b) => {
    if (b.id === parentBlockId) {
      const idx = b.children.findIndex((c) => c.id === afterBlockId);
      if (idx < 0) return b;
      return {
        ...b,
        children: [
          ...b.children.slice(0, idx + 1),
          newBlock,
          ...b.children.slice(idx + 1),
        ],
      };
    }
    return {
      ...b,
      children: insertBlockAfter(
        b.children,
        afterBlockId,
        newBlock,
        parentBlockId,
      ),
    };
  });
}

/** 루트 레벨 맨 끝에 블록을 추가한다. */
export function appendRootBlock(blocks: Block[], newBlock: Block): Block[] {
  return [...blocks, newBlock];
}

/**
 * blockId 를 트리에서 뽑아 같은 부모의 beforeBlockId 앞으로 재배치한다.
 * beforeBlockId 가 null 이면 같은 부모의 맨 끝으로 이동.
 *
 * 원본 moveBlock API 와 동일한 계약: 같은 부모 내 재정렬만 지원한다.
 * 이동 대상을 찾지 못하면 원본 반환.
 */
export function moveBlockInTree(
  blocks: Block[],
  blockId: string,
  beforeBlockId: string | null,
): Block[] {
  // blockId 의 부모를 찾아 children 을 재정렬
  function relocate(children: Block[]): Block[] | null {
    const hasBlock = children.some((c) => c.id === blockId);
    if (hasBlock) {
      const moving = children.find((c) => c.id === blockId)!;
      const withoutMoving = children.filter((c) => c.id !== blockId);
      if (beforeBlockId === null) {
        return [...withoutMoving, moving];
      }
      const insertIdx = withoutMoving.findIndex((c) => c.id === beforeBlockId);
      if (insertIdx < 0) {
        // beforeBlockId 가 같은 부모에 없음 — 변경 없이 반환
        return children;
      }
      return [
        ...withoutMoving.slice(0, insertIdx),
        moving,
        ...withoutMoving.slice(insertIdx),
      ];
    }
    // 현재 레벨에 없음 — 자식 레벨 재귀
    const next = children.map((c) => {
      const updated = relocate(c.children);
      return updated === null ? c : { ...c, children: updated };
    });
    // 변경이 있었는지 확인하여 참조 공유
    return next.some((c, i) => c !== children[i]) ? next : null;
  }

  const result = relocate(blocks);
  return result === null ? blocks : result;
}

/** 루트 마지막 블록이 text 타입인지 확인. */
export function lastRootIsText(blocks: Block[]): boolean {
  const last = blocks[blocks.length - 1];
  return !!last && last.type === "text";
}
