// -- 블록 렌더러 -------------------------------------------------------------
//
// 기존 blockRenderers.js + blockWrapper.js 를 통합한 React 컴포넌트.
// Block 데이터를 받아 타입별 컴포넌트를 렌더링하고, 블록 래퍼
// (드래그 핸들, 삽입 버튼, 더보기 메뉴)를 감싼다.

import { memo, useCallback } from "react";
import type { Block, BlockType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import TextBlock from "@/components/blocks/TextBlock";
import ImageBlock from "@/components/blocks/ImageBlock";
import CodeBlock from "@/components/blocks/CodeBlock";
import ToggleBlock from "@/components/blocks/ToggleBlock";
import QuoteBlock from "@/components/blocks/QuoteBlock";
import CalloutBlock from "@/components/blocks/CalloutBlock";
import DividerBlock from "@/components/blocks/DividerBlock";
import PageBlock from "@/components/blocks/PageBlock";
import DatabaseBlock from "@/components/blocks/DatabaseBlock";
import UrlEmbedBlock from "@/components/blocks/UrlEmbedBlock";
import FileBlock from "@/components/blocks/FileBlock";
import BlockWrapper from "./BlockWrapper";

// 블록 타입 -> 컴포넌트 매핑 (기존 registry.js 패턴의 React 버전)
const BLOCK_COMPONENTS: Record<
  string,
  React.ComponentType<BlockComponentProps>
> = {
  text: TextBlock,
  image: ImageBlock,
  code: CodeBlock,
  toggle: ToggleBlock,
  quote: QuoteBlock,
  callout: CalloutBlock,
  divider: DividerBlock,
  page: PageBlock,
  database: DatabaseBlock,
  url_embed: UrlEmbedBlock,
  file: FileBlock,
};

export interface BlockComponentProps {
  block: Block;
  onReload: () => void;
  onReloadSidebar: () => void;
  onNavigate: (docId: string) => void;
  /** 중첩 블록 렌더링 함수 (toggle, quote, callout 등이 사용) */
  renderChildren: (children: Block[], parentBlockId: string) => React.ReactNode;
  onAddBlock: (type: BlockType, parentBlockId: string | null) => void;
  onAddBlockAfter: (
    type: BlockType,
    afterBlockId: string,
    parentBlockId: string | null,
  ) => void;
}

interface BlockRendererProps {
  block: Block;
  parentBlockId: string | null;
  onReload: () => void;
  onReloadSidebar: () => void;
  onAddBlock: (type: BlockType, parentBlockId: string | null) => void;
  onAddBlockAfter: (
    type: BlockType,
    afterBlockId: string,
    parentBlockId: string | null,
  ) => void;
  onNavigate: (docId: string) => void;
}

function BlockRendererImpl({
  block,
  parentBlockId,
  onReload,
  onReloadSidebar,
  onAddBlock,
  onAddBlockAfter,
  onNavigate,
}: BlockRendererProps) {
  const { authenticated } = useAuth();
  const Component = BLOCK_COMPONENTS[block.type];

  const renderChildren = useCallback(
    (children: Block[], pid: string) =>
      children.map((child) => (
        <BlockRenderer
          key={child.id}
          block={child}
          parentBlockId={pid}
          onReload={onReload}
          onReloadSidebar={onReloadSidebar}
          onAddBlock={onAddBlock}
          onAddBlockAfter={onAddBlockAfter}
          onNavigate={onNavigate}
        />
      )),
    [onReload, onReloadSidebar, onAddBlock, onAddBlockAfter, onNavigate],
  );

  if (!Component) {
    return (
      <div className="block-wrapper unsupported-block">
        <p>지원되지 않는 블록 타입: {block.type}</p>
      </div>
    );
  }

  return (
    <BlockWrapper
      block={block}
      parentBlockId={parentBlockId}
      onReload={onReload}
      onReloadSidebar={onReloadSidebar}
      onAddBlockAfter={onAddBlockAfter}
      authenticated={authenticated}
    >
      <Component
        block={block}
        onReload={onReload}
        onReloadSidebar={onReloadSidebar}
        onNavigate={onNavigate}
        renderChildren={renderChildren}
        onAddBlock={onAddBlock}
        onAddBlockAfter={onAddBlockAfter}
      />
    </BlockWrapper>
  );
}

/**
 * React.memo 로 래핑하여 block 참조와 콜백 identity 가 동일한 경우 재렌더를
 * 생략한다. 낙관적 업데이트(Step C)와 결합 시 변경된 서브트리만 갱신되어
 * 대형 문서에서 리렌더 비용이 크게 감소한다.
 */
const BlockRenderer = memo(BlockRendererImpl);
export default BlockRenderer;
