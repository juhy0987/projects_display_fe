// -- App Shell 레이아웃 ------------------------------------------------------
//
// 기존 base.html + index.html 의 구조를 React 컴포넌트로 재현한다.
// .ambient-layer > .app-shell > (sidebar + main-area)

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { DocumentInfo } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import * as documentsApi from "@/api/documents";
import Sidebar from "./Sidebar";
import AuthButton from "./AuthButton";
import EditorPage from "@/pages/EditorPage";
import NotionImportModal from "@/components/modals/NotionImportModal";

export default function AppShell() {
  const { authenticated } = useAuth();
  const { docId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await documentsApi.fetchDocuments();
      setDocuments(docs);
    } catch {
      // 네트워크 오류 시 빈 목록 유지
    }
  }, []);

  // 초기 로드 + 인증 상태 변경 시 다시 로드
  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments, authenticated]);

  const handleSelect = useCallback(
    (id: string) => {
      navigate(`/docs/${id}`);
    },
    [navigate],
  );

  return (
    <>
      <div className="ambient-layer" />
      <div
        className={`app-shell${!authenticated ? " viewer-mode" : ""}`}
      >
        <Sidebar
          documents={documents}
          activeDocId={docId ?? null}
          onSelect={handleSelect}
          onReload={loadDocuments}
          onImportClick={() => setImportOpen(true)}
        />

        <div className="main-area">
          <AuthButton />
          {docId ? (
            <EditorPage
              key={docId}
              documentId={docId}
              onReloadSidebar={loadDocuments}
            />
          ) : (
            <section className="block-page empty-state">
              <p>좌측 사이드바에서 문서를 선택하세요.</p>
            </section>
          )}
        </div>
      </div>

      <NotionImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={loadDocuments}
      />
    </>
  );
}
