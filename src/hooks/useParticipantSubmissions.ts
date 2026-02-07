import { useQuery } from "@tanstack/react-query";

export interface ParticipantSubmission {
  id: string;
  code: string;
  language: string;
  submittedAt: string;
  problem: {
    id: string;
    dayNumber: number;
    title: string;
    assignedDate: string;
    problemType: string;
  };
}

interface ParticipantSubmissionsResponse {
  submissions: ParticipantSubmission[];
}

export function useParticipantSubmissions(participantId: string) {
  return useQuery<ParticipantSubmissionsResponse>({
    queryKey: ["participantSubmissions", participantId],
    queryFn: async () => {
      const res = await fetch(`/api/participants/${participantId}/submissions`);
      if (!res.ok) {
        if (res.status === 401) throw new Error("로그인이 필요합니다.");
        if (res.status === 403) throw new Error("조회 권한이 없습니다.");
        throw new Error("제출 내역을 불러오지 못했습니다.");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,   // 5분
    gcTime: 15 * 60 * 1000,     // 15분
    refetchOnMount: false,      // 마운트 시 재요청 방지
    refetchOnWindowFocus: false,
  });
}
