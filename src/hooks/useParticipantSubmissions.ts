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
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,   // 5분
    gcTime: 15 * 60 * 1000,     // 15분
    refetchOnMount: false,      // 마운트 시 재요청 방지
    refetchOnWindowFocus: false,
  });
}
