import { useQuery } from "@tanstack/react-query";

type RefundStatus = "NOT_REGISTERED" | "UNPAID" | "ACTIVE" | "DROPPED";

interface RefundRankSummary {
  rank: number;
  count: number;
  totalPercentage: number;
  totalBonus: number;
  totalRefund: number;
}

interface RefundSummary {
  paidCount: number;
  activeCount: number;
  droppedCount: number;
  rankCounts: {
    first: number;
    second: number;
    third: number;
    other: number;
  };
  rankSummaries: RefundRankSummary[];
  activeRefundTotal: number;
  bonusTotal: number;
  bonusRemainder: number;
}

export interface RefundApiResponse {
  season: {
    id: string;
    seasonNumber: number;
    name: string;
    entryFee: number;
  };
  totalProblems: number;
  totalPool: number;
  droppedPool: number;
  summary: RefundSummary;
  my: {
    status: RefundStatus;
    refundAmount: number;
    missedCount: number;
    submittedCount: number;
    totalProblems: number;
  };
}

export function useRefundQuery(seasonId: string, enabled: boolean) {
  return useQuery<RefundApiResponse>({
    queryKey: ["refund", seasonId],
    queryFn: async () => {
      const res = await fetch(`/api/refund/${seasonId}/me`);
      if (res.status === 401) throw new Error("로그인이 필요합니다.");
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "환급액을 조회하지 못했습니다.");
      }
      return res.json();
    },
    enabled,
    staleTime: 30 * 60 * 1000,  // 30분 - 환급 데이터는 자주 안 바뀜
    gcTime: 60 * 60 * 1000,     // 1시간 캐시
    refetchOnMount: false,      // 마운트 시 재요청 방지
    refetchOnWindowFocus: false,
    retry: false,
  });
}
