"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Markdown } from "@tiptap/markdown";
import { common, createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import c from "highlight.js/lib/languages/c";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import kotlin from "highlight.js/lib/languages/kotlin";
import swift from "highlight.js/lib/languages/swift";
import { useProblemSubmissions } from "@/hooks/useProblemSubmissions";

const lowlight = createLowlight(common);

lowlight.register({
  javascript,
  typescript,
  python,
  java,
  cpp,
  c,
  go,
  rust,
  kotlin,
  swift,
});

interface ProblemSubmissionsViewerProps {
  problemId: string;
  problemTitle: string;
  onClose: () => void;
}

export function ProblemSubmissionsViewer({
  problemId,
  problemTitle,
  onClose,
}: ProblemSubmissionsViewerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const { data, isLoading: loading } = useProblemSubmissions(problemId);
  const submissions = useMemo(() => data?.submissions ?? [], [data?.submissions]);

  const currentUserEmail = session?.user?.email?.toLowerCase();
  const currentUserGithub = session?.user?.githubUsername?.toLowerCase();

  const effectiveSelectedId = selectedSubmissionId ?? submissions[0]?.id ?? null;

  const selectedSubmission = submissions.find(
    (s) => s.id === effectiveSelectedId
  );

  const isMySubmission = selectedSubmission && (
    (currentUserEmail && selectedSubmission.participant.email?.toLowerCase() === currentUserEmail) ||
    (currentUserGithub && selectedSubmission.participant.githubUsername?.toLowerCase() === currentUserGithub)
  );

  const handleEdit = () => {
    router.push(`/submit?problemId=${problemId}`);
    onClose();
  };

  const editorExtensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Markdown,
    ],
    []
  );

  const editor = useEditor(
    {
      extensions: editorExtensions,
      content: selectedSubmission?.code || "",
      contentType: "markdown",
      editable: false,
      immediatelyRender: false,
    },
    [effectiveSelectedId]
  );

  useEffect(() => {
    if (editor && selectedSubmission) {
      editor.commands.setContent(selectedSubmission.code, {
        contentType: "markdown",
      });
    }
  }, [editor, selectedSubmission]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            {problemTitle} <span className="text-gray-500 font-normal text-sm ml-2">제출 내역</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (Tabs) */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto shrink-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : submissions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                제출된 코드가 없습니다.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <li key={submission.id}>
                    <button
                      onClick={() => setSelectedSubmissionId(submission.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-white transition flex flex-col ${
                        effectiveSelectedId === submission.id
                          ? "bg-white border-l-4 border-blue-600 shadow-sm"
                          : "border-l-4 border-transparent text-gray-600"
                      }`}
                    >
                      <span className="font-medium text-sm text-gray-900">
                        {submission.participant.githubUsername ||
                          submission.participant.email ||
                          "알 수 없음"}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {new Date(submission.submittedAt).toLocaleString(
                          "ko-KR",
                          {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      <span className="text-xs text-blue-500 mt-0.5 uppercase">
                        {submission.language}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Main Content (Code Viewer) */}
          <div className="flex-1 bg-white overflow-y-auto p-6 flex flex-col">
            {selectedSubmission ? (
              <>
                {isMySubmission && (
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={handleEdit}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      수정하기
                    </button>
                  </div>
                )}
                <div
                  id="code"
                  className="flex-1 rounded-md border border-gray-300 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-gray-50"
                >
                  <EditorContent
                    editor={editor}
                    className="tiptap-editor h-full"
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                {!loading && "참여자를 선택하여 코드를 확인하세요."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
