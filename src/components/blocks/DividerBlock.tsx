// -- 구분선 블록 -------------------------------------------------------------

import type { BlockComponentProps } from "@/components/editor/BlockRenderer";

export default function DividerBlock(_props: BlockComponentProps) {
  return <hr className="divider-block" />;
}
