"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useRefundQuery, RefundApiResponse } from "@/hooks/useRefundQuery";

type RefundStatus = "NOT_REGISTERED" | "UNPAID" | "ACTIVE" | "DROPPED";

const formatCurrency = (value: number) => `${value.toLocaleString()}원`;

const statusLabelMap: Record<RefundStatus, string> = {
  ACTIVE: "완주",
  DROPPED: "중도포기",
  UNPAID: "미납",
  NOT_REGISTERED: "미등록",
};

const statusToneMap: Record<RefundStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DROPPED: "bg-red-100 text-red-700",
  UNPAID: "bg-yellow-100 text-yellow-700",
  NOT_REGISTERED: "bg-gray-100 text-gray-600",
};

interface RefundLookupPanelProps {
  seasonId: string;
  endDate: string;
  isParticipant: boolean;
}

export function RefundLookupPanel({ seasonId, endDate, isParticipant }: RefundLookupPanelProps) {
  const { status } = useSession();
  const [hasQueried, setHasQueried] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const rulesDialogRef = useRef<HTMLDivElement | null>(null);
  const detailFirstRef = useRef<HTMLButtonElement | null>(null);
  const rulesFirstRef = useRef<HTMLButtonElement | null>(null);

  const isAuthenticated = status === "authenticated";

  // 마지막날 2일 전부터 환급액 조회 버튼 표시
  const canShowRefundQuery = useMemo(() => {
    const end = new Date(endDate);
    const twoDaysBefore = new Date(end);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
    twoDaysBefore.setHours(0, 0, 0, 0);
    const now = new Date();
    return now >= twoDaysBefore;
  }, [endDate]);

  // 환급액 조회 버튼 표시 조건: 참여자이고 마지막날 2일 전 이후
  const showRefundQueryButton = isParticipant && canShowRefundQuery;

  const {
    data: refundData,
    error,
    isFetching,
    refetch,
  } = useRefundQuery(seasonId, hasQueried && isAuthenticated);

  const refundError = error?.message || "";

  useEffect(() => {
    if (!isAuthenticated) {
      setHasQueried(false);
      return;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isDetailOpen) {
      return;
    }

    detailFirstRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsDetailOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDetailOpen]);

  useEffect(() => {
    if (!isRulesOpen) {
      return;
    }

    rulesFirstRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsRulesOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isRulesOpen]);

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
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
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

  const handleRulesKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const dialog = rulesDialogRef.current;
    if (!dialog) {
      return;
    }

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
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

  const handleQuery = () => {
    if (!isAuthenticated) {
      return;
    }

    if (hasQueried) {
      refetch();
    } else {
      setHasQueried(true);
    }
  };

  const statusBadge = useMemo(() => {
    if (!refundData) return null;
    const label = statusLabelMap[refundData.my.status];
    const tone = statusToneMap[refundData.my.status];
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${tone}`}>
        {label}
      </span>
    );
  }, [refundData]);

  const rankSummaryRows = useMemo(() => {
    if (!refundData) return [];
    return refundData.summary.rankSummaries
      .filter((group) => group.rank <= 3)
      .map((group) => ({
        label: `${group.rank}등 그룹`,
        ...group,
      }));
  }, [refundData]);

  const detailSummary = refundData?.summary;
  const myResult = refundData?.my;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">환급 정보</h2>
          <p className="text-sm text-gray-500">
            {showRefundQueryButton
              ? "조회 버튼을 누르면 예상 환급액을 확인할 수 있어요."
              : "환급 규칙을 확인할 수 있어요."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsRulesOpen(true)}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            환급 규칙
          </button>
          {showRefundQueryButton && (
            <button
              type="button"
              onClick={handleQuery}
              disabled={!isAuthenticated || isFetching}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isFetching ? "조회 중..." : "환급액 조회"}
            </button>
          )}
        </div>
      </div>

      {showRefundQueryButton && status === "loading" && (
        <p className="mt-4 text-sm text-gray-500">로그인 상태 확인 중...</p>
      )}

      {showRefundQueryButton && !isAuthenticated && status !== "loading" && (
        <div className="mt-4 p-4 rounded-md bg-gray-50 text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>로그인 후 환급액을 조회할 수 있어요.</span>
          <LoginModal
            triggerLabel="로그인"
            triggerClassName="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
          />
        </div>
      )}

      {refundError && (
        <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {refundError}
        </div>
      )}

      {refundData && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900">
                  조회 결과
                </h3>
                {statusBadge}
              </div>

              {myResult?.status === "ACTIVE" && (
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p className="text-green-700 font-semibold">
                    예상 환급액: {formatCurrency(myResult.refundAmount)}
                  </p>
                  <p>
                    미인증 {myResult.missedCount}회 · 제출{" "}
                    {myResult.submittedCount}/{myResult.totalProblems}
                  </p>
                </div>
              )}

              {myResult?.status === "DROPPED" && (
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <p className="text-red-600 font-semibold">
                    중도포기로 환급액이 없습니다.
                  </p>
                  <p>
                    미인증 {myResult.missedCount}회 · 제출{" "}
                    {myResult.submittedCount}/{myResult.totalProblems}
                  </p>
                </div>
              )}

              {myResult?.status === "UNPAID" && (
                <p className="mt-2 text-sm text-gray-600">
                  참가비 납부 확인 후 환급액을 조회할 수 있습니다.
                </p>
              )}

              {myResult?.status === "NOT_REGISTERED" && (
                <p className="mt-2 text-sm text-gray-600">
                  해당 기수 참가자로 등록되어 있지 않습니다.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDetailOpen(true)}
              className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              상세 내용 보기
            </button>
          </div>
        </div>
      )}

      {isDetailOpen && refundData && detailSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setIsDetailOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            ref={dialogRef}
            onKeyDown={handleDialogKeyDown}
            className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  환급액 계산 상세
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {refundData.season.seasonNumber}기 ·{" "}
                  {refundData.season.name}
                </p>
              </div>
              <button
                ref={detailFirstRef}
                onClick={() => setIsDetailOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm text-gray-700">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  기본 규칙
                </h3>
                <ul className="space-y-1 text-yellow-700">
                  <li>- 1등 (0회 미인증): 중도포기 풀의 70%</li>
                  <li>- 2등 (1회 미인증): 중도포기 풀의 20%</li>
                  <li>- 3등 (2회 미인증): 중도포기 풀의 10%</li>
                  <li>- 중도포기 (3회 이상 미인증): 환급 없음</li>
                  <li>- 완주자는 참가비를 전액 환급받습니다.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">납부자 / 완주자</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {detailSummary.paidCount}명 · {detailSummary.activeCount}명
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">중도포기</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {detailSummary.droppedCount}명
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">총 풀 / 중도포기 풀</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatCurrency(refundData.totalPool)} ·{" "}
                    {formatCurrency(refundData.droppedPool)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">완주자 환급 합계</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {formatCurrency(detailSummary.activeRefundTotal)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                완주자 {detailSummary.activeCount}명 (1등{" "}
                {detailSummary.rankCounts.first}명 · 2등{" "}
                {detailSummary.rankCounts.second}명 · 3등{" "}
                {detailSummary.rankCounts.third}명 · 기타{" "}
                {detailSummary.rankCounts.other}명)
              </p>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                  완주자 순위 그룹 요약
                </div>
                <div className="divide-y divide-gray-200">
                  {rankSummaryRows.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      순위 그룹 정보가 없습니다.
                    </div>
                  )}
                  {rankSummaryRows.map((group) => (
                    <div
                      key={group.rank}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {group.label} · {group.count}명
                        </p>
                        <p className="text-xs text-gray-500">
                          적용 비율 {group.totalPercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-sm text-gray-700">
                        지급 총액 {formatCurrency(group.totalRefund)}
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">
                        기타 순위 · {detailSummary.rankCounts.other}명
                      </p>
                      <p className="text-xs text-gray-500">
                        보너스 비율 0%
                      </p>
                    </div>
                    <div className="text-sm text-gray-700">
                      지급 총액 0원
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                보너스 분배 합계는{" "}
                {formatCurrency(detailSummary.bonusTotal)}이며, 계산 시
                원단위 절삭으로{" "}
                {formatCurrency(detailSummary.bonusRemainder)}가 남을 수
                있습니다.
              </div>
            </div>
          </div>
        </div>
      )}

      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setIsRulesOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            ref={rulesDialogRef}
            onKeyDown={handleRulesKeyDown}
            className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                환급 규칙
              </h2>
              <button
                ref={rulesFirstRef}
                onClick={() => setIsRulesOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-gray-700">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  기본 규칙
                </h3>
                <ul className="space-y-1 text-yellow-700">
                  <li>- 1등 (0회 미인증): 중도포기 풀의 70%</li>
                  <li>- 2등 (1회 미인증): 중도포기 풀의 20%</li>
                  <li>- 3등 (2회 미인증): 중도포기 풀의 10%</li>
                  <li>- 중도포기 (3회 이상 미인증): 환급 없음</li>
                  <li>- 완주자는 참가비를 전액 환급받습니다.</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  미인증이란?
                </h3>
                <p className="text-blue-700">
                  해당 날짜에 문제를 제출하지 않은 경우 미인증으로 처리됩니다.
                  3회 이상 미인증 시 중도포기로 전환되어 환급을 받을 수 없습니다.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">
                  환급 시기
                </h3>
                <p className="text-gray-600">
                  환급액은 기수 종료 후 정산되며, 환급액 조회는 기수 종료 2일
                  전부터 가능합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
