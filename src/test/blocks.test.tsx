// -- 블록 컴포넌트 단위 테스트 ------------------------------------------------

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
import type { Block } from "@/types";
import TextBlock from "@/components/blocks/TextBlock";
import DividerBlock from "@/components/blocks/DividerBlock";
import PageBlock from "@/components/blocks/PageBlock";
import type { BlockComponentProps } from "@/components/editor/BlockRenderer";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: "block-1",
    type: "text",
    document_id: "doc-1",
    parent_block_id: null,
    children: [],
    ...overrides,
  };
}

const noopProps: Omit<BlockComponentProps, "block"> = {
  onReload: vi.fn(),
  onReloadSidebar: vi.fn(),
  onNavigate: vi.fn(),
  renderChildren: () => null,
  onAddBlock: vi.fn(),
  onAddBlockAfter: vi.fn(),
};

function renderWithAuth(ui: React.ReactElement) {
  // 미인증 상태로 렌더링 (초기 fetch mock)
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(JSON.stringify({ authenticated: false, username: null })),
  });
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("TextBlock", () => {
  beforeEach(() => mockFetch.mockReset());

  it("formatted_text 가 있으면 HTML 로 렌더링한다", () => {
    renderWithAuth(
      <TextBlock
        block={makeBlock({ formatted_text: "<strong>굵은 글씨</strong>" })}
        {...noopProps}
      />,
    );
    const el = document.querySelector(".notion-text");
    expect(el).toBeTruthy();
    expect(el?.innerHTML).toContain("<strong>굵은 글씨</strong>");
  });

  it("level 이 지정되면 data-level 속성이 설정된다", () => {
    renderWithAuth(
      <TextBlock block={makeBlock({ level: 2 })} {...noopProps} />,
    );
    const el = document.querySelector(".notion-text");
    expect(el?.getAttribute("data-level")).toBe("2");
  });
});

describe("DividerBlock", () => {
  beforeEach(() => mockFetch.mockReset());

  it("hr 요소를 렌더링한다", () => {
    renderWithAuth(
      <DividerBlock block={makeBlock({ type: "divider" })} {...noopProps} />,
    );
    expect(document.querySelector("hr.notion-block.notion-divider")).toBeTruthy();
  });
});

describe("PageBlock", () => {
  beforeEach(() => mockFetch.mockReset());

  it("자식 문서 제목을 표시한다", () => {
    renderWithAuth(
      <PageBlock
        block={makeBlock({
          type: "page",
          child_document: { id: "child-1", title: "하위 문서" },
        })}
        {...noopProps}
      />,
    );
    expect(screen.getByText("하위 문서")).toBeTruthy();
  });

  it("깨진 참조일 때 버튼이 disabled 된다", () => {
    renderWithAuth(
      <PageBlock
        block={makeBlock({
          type: "page",
          is_broken_ref: true,
          title: "삭제된 문서",
        })}
        {...noopProps}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
  });
});
