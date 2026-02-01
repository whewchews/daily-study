"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface SeasonEditFormProps {
  season: {
    id: string;
    seasonNumber: number;
    name: string;
    startDate: Date;
    endDate: Date;
    entryFee: number;
  };
}

export function SeasonEditForm({ season }: SeasonEditFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(season.name);
  const [startDate, setStartDate] = useState(
    format(new Date(season.startDate), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(
    format(new Date(season.endDate), "yyyy-MM-dd"),
  );
  const [entryFee, setEntryFee] = useState(season.entryFee);

  const handleCancel = () => {
    setName(season.name);
    setStartDate(format(new Date(season.startDate), "yyyy-MM-dd"));
    setEndDate(format(new Date(season.endDate), "yyyy-MM-dd"));
    setEntryFee(season.entryFee);
    setIsEditing(false);
    setError("");
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/seasons/${season.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
          entryFee,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    firstFieldRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditing]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("disabled"));

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || active === dialog) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div className="flex justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {season.seasonNumber}기 - {season.name}
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date(season.startDate).toLocaleDateString("ko-KR")} ~{" "}
            {new Date(season.endDate).toLocaleDateString("ko-KR")}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            참가비: {season.entryFee.toLocaleString()}원
          </p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded-md hover:bg-blue-50"
        >
          수정
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="닫기"
            onClick={handleCancel}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
            onKeyDown={handleDialogKeyDown}
            className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              기수 정보 수정
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  기수 번호
                </label>
                <input
                  type="text"
                  value={`${season.seasonNumber}기`}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 sm:text-sm border p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  ref={firstFieldRef}
                  className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md text-gray-700 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  참가비 (원)
                </label>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(parseInt(e.target.value) || 0)}
                  min="0"
                  step="1000"
                  className="mt-1 block w-full text-gray-700 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
