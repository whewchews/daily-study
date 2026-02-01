import { useQuery } from "@tanstack/react-query";

export interface ProblemSubmission {
  id: string;
  code: string;
  language: string;
  submittedAt: string;
  participant: {
    githubUsername?: string | null;
    email?: string | null;
  };
}

interface ProblemSubmissionsResponse {
  submissions: ProblemSubmission[];
}

export function useProblemSubmissions(problemId: string) {
  return useQuery<ProblemSubmissionsResponse>({
    queryKey: ["problemSubmissions", problemId],
    queryFn: async () => {
      const res = await fetch(`/api/problems/${problemId}/submissions`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,   // 2분
    gcTime: 10 * 60 * 1000,     // 10분
    refetchOnMount: false,      // 마운트 시 재요청 방지
    refetchOnWindowFocus: false,
  });
}
