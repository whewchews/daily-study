"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";

type ProblemType = "REGULAR" | "FREE" | "REST";

interface ProblemRow {
  dayNumber: number;
  title: string;
  url: string;
  assignedDate: string;
  problemType: ProblemType;
  isPractice: boolean;
}

interface ExistingProblem {
  id: string;
  dayNumber: number;
  title: string;
  url: string | null;
  assignedDate: Date;
  problemType: ProblemType;
  isPractice: boolean;
}

const TOTAL_DAYS = 14;

const getDefaultProblemType = (dayNumber: number): ProblemType => {
  if (dayNumber === 6 || dayNumber === 13) return "FREE";
  if (dayNumber === 7 || dayNumber === 14) return "REST";
  return "REGULAR";
};

const getDefaultTitle = (dayNumber: number): string => {
  if (dayNumber === 6 || dayNumber === 13) return "자율 문제";
  if (dayNumber === 7 || dayNumber === 14) return "휴식일";
  return "";
};

const problemTypeLabels: Record<ProblemType, string> = {
  REGULAR: "일반",
  FREE: "자율",
  REST: "휴식",
};

export function ProblemTableEditor({
  seasonId,
  startDate,
  existingProblems,
}: {
  seasonId: string;
  startDate: Date;
  existingProblems: ExistingProblem[];
}) {
  const router = useRouter();
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [loading, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const existingMap = new Map(existingProblems.map((p) => [p.dayNumber, p]));

    const initialProblems: ProblemRow[] = Array.from(
      { length: TOTAL_DAYS },
      (_, i) => {
        const dayNumber = i + 1;
        const existing = existingMap.get(dayNumber);
        const assignedDate = format(
          addDays(new Date(startDate), dayNumber - 1),
          "yyyy-MM-dd",
        );

        if (existing) {
          return {
            dayNumber,
            title: existing.title,
            url: existing.url || "",
            assignedDate,
            problemType: existing.problemType,
            isPractice: existing.isPractice,
          };
        }

        return {
          dayNumber,
          title: getDefaultTitle(dayNumber),
          url: "",
          assignedDate,
          problemType: getDefaultProblemType(dayNumber),
          isPractice: dayNumber === 1,
        };
      },
    );

    setProblems(initialProblems);
  }, [startDate, existingProblems]);

  const updateProblem = (
    dayNumber: number,
    field: keyof ProblemRow,
    value: string | boolean,
  ) => {
    setProblems((prev) =>
      prev.map((p) =>
        p.dayNumber === dayNumber ? { ...p, [field]: value } : p,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/seasons/${seasonId}/problems`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problems }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to save");
      }

      setMessage({ type: "success", text: "저장되었습니다." });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "저장 중 오류가 발생했습니다.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                  일차
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  날짜
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                  유형
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  문제 제목
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  URL
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">
                  연습
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {problems.map((problem) => {
                const isRest = problem.problemType === "REST";
                const isFree = problem.problemType === "FREE";

                return (
                  <tr
                    key={problem.dayNumber}
                    className={
                      isRest ? "bg-gray-100" : isFree ? "bg-blue-50" : ""
                    }
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        Day {problem.dayNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {problem.assignedDate}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        value={problem.problemType}
                        onChange={(e) =>
                          updateProblem(
                            problem.dayNumber,
                            "problemType",
                            e.target.value,
                          )
                        }
                        className={`text-xs rounded px-2 py-1 border ${
                          isRest
                            ? "bg-gray-200 text-gray-700"
                            : isFree
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        <option value="REGULAR">일반</option>
                        <option value="FREE">자율</option>
                        <option value="REST">휴식</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={problem.title}
                        onChange={(e) =>
                          updateProblem(
                            problem.dayNumber,
                            "title",
                            e.target.value,
                          )
                        }
                        disabled={isRest}
                        placeholder={isRest ? "휴식일" : "문제 제목"}
                        className={`w-full text-sm rounded border px-2 py-1 ${
                          isRest
                            ? "bg-gray-100 text-gray-500"
                            : "bg-white text-gray-700 placeholder-gray-300"
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="url"
                        value={problem.url}
                        onChange={(e) =>
                          updateProblem(
                            problem.dayNumber,
                            "url",
                            e.target.value,
                          )
                        }
                        disabled={isRest}
                        placeholder={
                          isRest ? "-" : isFree ? "(자율 선택)" : "https://..."
                        }
                        className={`w-full text-sm rounded border px-2 py-1 ${
                          isRest
                            ? "bg-gray-100 text-gray-500"
                            : "bg-white text-gray-700 placeholder-gray-300"
                        }`}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={problem.isPractice}
                        onChange={(e) =>
                          updateProblem(
                            problem.dayNumber,
                            "isPractice",
                            e.target.checked,
                          )
                        }
                        disabled={isRest}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-green-100 rounded"></span>
            <span>일반 문제</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-blue-50 rounded"></span>
            <span>자율 문제 (6, 13일차)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-gray-100 rounded"></span>
            <span>휴식일 (7, 14일차)</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "저장 중..." : "전체 저장"}
        </button>
      </div>
    </div>
  );
}
