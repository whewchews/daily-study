"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
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
import {
  CodeBlockLanguageWithAuto,
  DEFAULT_CODE_BLOCK_LANGUAGE,
  getCodeBlockLanguageOptions,
} from "@/lib/editor/codeBlockLanguages";
import { LoginModal } from "@/components/auth/LoginModal";

type ProblemType = "REGULAR" | "FREE" | "REST";

interface Problem {
  id: string;
  title: string;
  url: string | null;
  dayNumber: number;
  problemType: ProblemType;
  isPractice: boolean;
  assignedDate: string | Date;
}

interface SeasonSummary {
  id: string;
  seasonNumber: number;
  name: string;
  problems: Problem[];
  participants: Array<{
    githubUsername?: string | null;
    email?: string | null;
  }>;
}

interface SubmitFormProps {
  seasons: SeasonSummary[];
  defaultSeasonId?: string;
  initialGithubUsername: string;
  initialEmail: string;
}

const COMMENT_PREFIX_BY_LANGUAGE: Record<string, string> = {
  javascript: "//",
  typescript: "//",
  python: "#",
  java: "//",
  cpp: "//",
  c: "//",
  go: "//",
  rust: "//",
  kotlin: "//",
  swift: "//",
};

const buildDefaultMarkdown = (language: CodeBlockLanguageWithAuto) => {
  const normalized = (language || DEFAULT_CODE_BLOCK_LANGUAGE).toLowerCase();
  const commentPrefix = COMMENT_PREFIX_BY_LANGUAGE[normalized] || "//";
  return `\`\`\`${normalized}\n${commentPrefix} 여기에 코드를 작성하세요\n\`\`\``;
};

const normalizeMarkdown = (value: string) => value.trim();
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

export function SubmitForm({
  seasons,
  defaultSeasonId,
  initialGithubUsername,
  initialEmail,
}: SubmitFormProps) {
  const [githubUsername, setGithubUsername] = useState(initialGithubUsername);
  const [problemId, setProblemId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [codeBlockLanguage, setCodeBlockLanguage] = useState<CodeBlockLanguageWithAuto>(
    DEFAULT_CODE_BLOCK_LANGUAGE
  );
  const [code, setCode] = useState(() =>
    buildDefaultMarkdown(DEFAULT_CODE_BLOCK_LANGUAGE)
  );
  const [viewMode, setViewMode] = useState<"write" | "preview">("write");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    commitUrl?: string;
  } | null>(null);
  const previousCodeBlockLanguageRef = useRef(codeBlockLanguage);
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
      content: buildDefaultMarkdown(codeBlockLanguage),
      contentType: "markdown",
      immediatelyRender: false,
      onSelectionUpdate: ({ editor }) => {
        if (!editor.isActive("codeBlock")) return;
        const nextLanguage = (
          editor.getAttributes("codeBlock").language || ""
        ) as CodeBlockLanguageWithAuto;
        setCodeBlockLanguage(nextLanguage);
      },
      onUpdate: ({ editor }) => {
        setCode(editor.getMarkdown());
      },
    },
    [editorExtensions]
  );

  const initialSeasonId =
    seasons.find((season) => season.id === defaultSeasonId)?.id ||
    seasons[0]?.id ||
    "";
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);

  useEffect(() => {
    if (!defaultSeasonId) {
      return;
    }
    const exists = seasons.some((season) => season.id === defaultSeasonId);
    if (exists) {
      setSelectedSeasonId(defaultSeasonId);
    }
  }, [defaultSeasonId, seasons]);

  useEffect(() => {
    setProblemId("");
    setCustomTitle("");
    setCustomUrl("");
  }, [selectedSeasonId]);

  const selectedSeason =
    seasons.find((season) => season.id === selectedSeasonId) || seasons[0];
  const problems = selectedSeason?.problems ?? [];
  const participants = selectedSeason?.participants ?? [];
  const seasonNumber = selectedSeason?.seasonNumber;

  const normalizedEmail = initialEmail?.trim().toLowerCase() || "";
  const isRegistered = participants.some((participant) => {
    if (normalizedEmail && participant.email) {
      return participant.email.toLowerCase() === normalizedEmail;
    }
    if (participant.githubUsername && githubUsername) {
      return participant.githubUsername.toLowerCase() === githubUsername.toLowerCase();
    }
    return false;
  });
  const selectedProblem = problems.find((p) => p.id === problemId);
  const isFreeChoice = selectedProblem?.problemType === "FREE";
  const languageOptions = getCodeBlockLanguageOptions();
  const defaultMarkdown = buildDefaultMarkdown(codeBlockLanguage);
  const previousDefaultMarkdown = buildDefaultMarkdown(
    previousCodeBlockLanguageRef.current
  );
  const isDefaultMarkdown =
    normalizeMarkdown(code) === normalizeMarkdown(defaultMarkdown) ||
    normalizeMarkdown(code) === normalizeMarkdown(previousDefaultMarkdown);
  const activeCodeBlockLanguage = (
    editor?.getAttributes("codeBlock").language || codeBlockLanguage
  ) as CodeBlockLanguageWithAuto;
  const isPreview = viewMode === "preview";
  const [isEditMode, setIsEditMode] = useState(false);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // 휴식일(REST)은 제외하고 표시
  const submittableProblems = problems.filter((p) => p.problemType !== "REST");

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(viewMode === "write");
  }, [editor, viewMode]);

  useEffect(() => {
    async function fetchMySubmission() {
      if (!problemId) {
        setIsEditMode(false);
        return;
      }

      try {
        const res = await fetch(`/api/submissions/me?problemId=${problemId}`);
        const data = await res.json();

        if (data.submission) {
          setCode(data.submission.code);
          editor?.commands.setContent(data.submission.code);
          setIsEditMode(true);
        } else {
          setIsEditMode(false);
          const nextContent = buildDefaultMarkdown(codeBlockLanguage);
          setCode(nextContent);
          editor?.commands.setContent(nextContent);
        }
      } catch (error) {
        console.error("Failed to fetch submission:", error);
      }
    }

    fetchMySubmission();
  }, [problemId, editor]); // codeBlockLanguage 의존성 제거 (초기화 시 현재 선택된 언어 유지)

  useEffect(() => {
    if (!editor) return;

    // 편집 모드일 때는 언어 변경에 따른 강제 초기화를 방지하거나
    // 사용자가 언어를 바꿨을 때만 적용하도록 함.
    // 여기서는 간단히 isEditMode가 아닐 때만 초기화 로직이 돌도록 수정하거나,
    // 기존 로직을 유지하되 fetchMySubmission이 덮어쓰도록 함.
    // 하지만 fetchMySubmission이 비동기라 충돌 가능성 있음.
    
    // 기존 로직: 언어 변경 시 템플릿 변경
    // 이 로직이 fetchMySubmission보다 늦게 돌면 덮어써버림.
    // 따라서 isEditMode 체크 추가.
    if (isEditMode) return;

    const previousDefault = buildDefaultMarkdown(
      previousCodeBlockLanguageRef.current
    );
    const currentMarkdown = editor.getMarkdown();
    const normalizedCurrent = normalizeMarkdown(currentMarkdown);

    if (
      !normalizedCurrent ||
      normalizedCurrent === normalizeMarkdown(previousDefault)
    ) {
      const nextContent = buildDefaultMarkdown(codeBlockLanguage);
      editor.commands.setContent(nextContent, {
        contentType: "markdown",
      });
      setCode(nextContent);
    }

    previousCodeBlockLanguageRef.current = codeBlockLanguage;
  }, [codeBlockLanguage, editor, isEditMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const submissionCode = editor?.getMarkdown() ?? code;

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUsername,
          problemId,
          code: submissionCode,
          // 자율 문제인 경우 사용자가 입력한 제목과 URL 전달
          ...(isFreeChoice && {
            customTitle,
            customUrl,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, message: data.error });
      } else {
        setResult({
          success: true,
          message: data.message,
          commitUrl: data.commit?.url,
        });
        const nextContent = buildDefaultMarkdown(codeBlockLanguage);
        editor?.commands.setContent(nextContent, {
          contentType: "markdown",
        });
        setCode(nextContent);
        setProblemId("");
        setCustomTitle("");
        setCustomUrl("");
      }
    } catch {
      setResult({ success: false, message: "제출 중 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  }

  const formatProblemDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${month}.${day} (${dayOfWeek})`;
  };

  const getProblemLabel = (problem: Problem) => {
    const dateLabel = formatProblemDate(problem.assignedDate);
    let label = `Day ${problem.dayNumber}: ${problem.title}`;
    if (dateLabel) {
      label += ` - ${dateLabel}`;
    }
    if (problem.problemType === "FREE") label += " (자율)";
    if (problem.isPractice) label += " (연습)";
    return label;
  };

  const handleCodeBlockLanguageChange = (
    value: CodeBlockLanguageWithAuto
  ) => {
    setCodeBlockLanguage(value);
    if (!editor) return;
    if (editor.isActive("codeBlock")) {
      editor
        .chain()
        .focus()
        .updateAttributes("codeBlock", { language: value || null })
        .run();
    }
  };

  const menuButtonClass = (isActive?: boolean) =>
    `inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
      isActive
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p>{result.message}</p>
          {result.commitUrl && (
            <a
              href={result.commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline mt-2 inline-block"
            >
              GitHub 커밋 보기
            </a>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="githubUsername"
              className="block text-sm font-medium text-gray-700"
            >
              GitHub 아이디
            </label>
            <input
              type="text"
              id="githubUsername"
              value={githubUsername}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 shadow-sm sm:text-sm border p-2 cursor-not-allowed"
            />
            {githubUsername && !isRegistered && (
              <p className="mt-1 text-sm text-red-500">
                등록되지 않은 참여자입니다.
              </p>
            )}
            {githubUsername && isRegistered && (
              <p className="mt-1 text-sm text-green-600">등록된 참여자입니다.</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              커밋 이메일
            </label>
            <input
              type="text"
              id="email"
              value={initialEmail}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 shadow-sm sm:text-sm border p-2 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="season"
            className="block text-sm font-medium text-gray-700"
          >
            기수 선택
          </label>
          {seasons.length > 1 ? (
            <select
              id="season"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
              required
              className="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            >
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.seasonNumber}기 - {season.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="season"
              type="text"
              value={
                selectedSeason
                  ? `${selectedSeason.seasonNumber}기 - ${selectedSeason.name}`
                  : ""
              }
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 sm:text-sm border p-2"
            />
          )}
        </div>

        <div>
          <label
            htmlFor="problem"
            className="block text-sm font-medium text-gray-700 "
          >
            문제 선택
          </label>
          <select
            id="problem"
            value={problemId}
            onChange={(e) => setProblemId(e.target.value)}
            required
            className="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 "
          >
            <option value="">문제를 선택하세요</option>
            {submittableProblems.map((problem) => (
              <option key={problem.id} value={problem.id}>
                {getProblemLabel(problem)}
              </option>
            ))}
          </select>
          {selectedProblem?.url && !isFreeChoice && (
            <a
              href={selectedProblem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-sm text-blue-600 hover:underline inline-block"
            >
              문제 링크 열기
            </a>
          )}
        </div>

        {/* 자율 문제인 경우 문제 제목과 URL 입력 */}
        {isFreeChoice && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
            <p className="text-sm text-blue-700 font-medium">
              자율 문제입니다. 풀이한 문제 정보를 입력해주세요.
            </p>
            <div>
              <label
                htmlFor="customTitle"
                className="block text-sm font-medium text-gray-700"
              >
                문제 제목
              </label>
              <input
                type="text"
                id="customTitle"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
                placeholder="예: 두 수의 합"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>
            <div>
              <label
                htmlFor="customUrl"
                className="block text-sm font-medium text-gray-700"
              >
                문제 URL (선택)
              </label>
              <input
                type="url"
                id="customUrl"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              풀이 내용
            </label>
            <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode("write")}
                className={`rounded-md px-3 py-1.5 transition ${
                  viewMode === "write"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                작성
              </button>
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className={`rounded-md px-3 py-1.5 transition ${
                  viewMode === "preview"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                미리보기
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            코드 블록은 자동으로 하이라이트되며, 이미지는 지원하지 않습니다.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() => editor?.chain().focus().setParagraph().run()}
              className={menuButtonClass(editor?.isActive("paragraph"))}
            >
              본문
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={menuButtonClass(
                editor?.isActive("heading", { level: 1 })
              )}
            >
              제목 1
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={menuButtonClass(
                editor?.isActive("heading", { level: 2 })
              )}
            >
              제목 2
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={menuButtonClass(
                editor?.isActive("heading", { level: 3 })
              )}
            >
              제목 3
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={menuButtonClass(editor?.isActive("bulletList"))}
            >
              불릿
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={menuButtonClass(editor?.isActive("orderedList"))}
            >
              번호
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={menuButtonClass(editor?.isActive("blockquote"))}
            >
              인용
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
            onClick={() => {
              const attributes =
                activeCodeBlockLanguage === ""
                  ? undefined
                  : { language: activeCodeBlockLanguage };
              editor?.chain().focus().setCodeBlock(attributes).run();
            }}
              className={menuButtonClass(editor?.isActive("codeBlock"))}
            >
              코드블럭
            </button>
            <button
              type="button"
              disabled={!editor || isPreview}
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              className={menuButtonClass()}
            >
              구분선
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">코드 언어</span>
              <select
                value={activeCodeBlockLanguage || ""}
                onChange={(e) =>
                  handleCodeBlockLanguageChange(
                    e.target.value as CodeBlockLanguageWithAuto
                  )
                }
                disabled={!editor || isPreview}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">자동</option>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            id="code"
            className={`mt-2 rounded-md border border-gray-300 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${
              viewMode === "preview" ? "bg-gray-50" : "bg-white"
            }`}
          >
            <EditorContent editor={editor} className="tiptap-editor" />
          </div>
          {isDefaultMarkdown && (
            <p className="mt-2 text-xs text-red-500">
              기본 안내 문구를 수정해 내용을 작성해주세요.
            </p>
          )}
        </div>

        {isAuthenticated ? (
          <button
            type="submit"
            disabled={
              loading ||
              !isRegistered ||
              (isFreeChoice && !customTitle) ||
              !code.trim() ||
              (isDefaultMarkdown && !isEditMode) // 수정 모드일 때는 내용이 로드된 상태이므로 default check 완화 가능하나, 일단 안전하게
            }
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "처리 중..." : isEditMode ? "코드 수정" : "코드 제출"}
          </button>
        ) : (
          <LoginModal
            triggerLabel={isEditMode ? "코드 수정" : "코드 제출"}
            triggerClassName="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          />
        )}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>
          {seasonNumber
            ? `${seasonNumber}기 스터디에 제출됩니다.`
            : "선택한 기수에 제출됩니다."}{" "}
          제출된 코드는 GitHub 공용 레포지토리에 자동으로 커밋됩니다.
        </p>
      </div>
    </form>
  );
}
