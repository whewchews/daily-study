import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeasonStatusToggle } from "@/components/admin/SeasonStatusToggle";
import { SeasonEditForm } from "@/components/admin/SeasonEditForm";

export const dynamic = "force-dynamic";

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      problems: {
        orderBy: { dayNumber: "asc" },
        take: 5,
      },
      participants: {
        orderBy: { githubUsername: "asc" },
        take: 5,
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      },
      _count: {
        select: {
          problems: true,
          participants: true,
          submissions: true,
        },
      },
    },
  });

  if (!season) {
    notFound();
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <SeasonEditForm
          season={{
            id: season.id,
            seasonNumber: season.seasonNumber,
            name: season.name,
            startDate: season.startDate,
            endDate: season.endDate,
            entryFee: season.entryFee,
          }}
        />
        <SeasonStatusToggle
          seasonId={season.id}
          status={season.status}
          isActive={season.isActive}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">참가비</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {season.entryFee.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">참여자</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {season._count.participants}명
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">문제</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {season._count.problems}개
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">제출</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {season._count.submissions}건
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">문제 목록</h2>
            <Link
              href={`/admin/seasons/${season.id}/problems`}
              className="text-blue-600 hover:text-blue-900 text-sm"
            >
              전체 보기 / 관리
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {season.problems.map((problem) => (
              <div key={problem.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Day {problem.dayNumber}: {problem.title}
                    </span>
                    {problem.isPractice && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                        연습
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(problem.assignedDate).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            ))}
            {season.problems.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                등록된 문제가 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">참여자 목록</h2>
            <Link
              href={`/admin/seasons/${season.id}/participants`}
              className="text-blue-600 hover:text-blue-900 text-sm"
            >
              전체 보기 / 관리
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {season.participants.map((participant) => (
              <div key={participant.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {participant.githubUsername ? (
                      <span className="text-sm font-medium text-gray-900">
                        {participant.githubUsername}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {participant.email || '알 수 없음'}
                      </span>
                    )}
                    {participant.isPaid && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                        납부완료
                      </span>
                    )}
                    {participant.status === 'DROPPED' && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                        중도포기
                      </span>
                    )}
                    {participant.status === 'COMPLETED' && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        완주완료
                      </span>
                    )}
                    {participant.status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                        진행중
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    제출: {participant._count.submissions}건
                  </span>
                </div>
              </div>
            ))}
            {season.participants.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                등록된 참여자가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex space-x-4">
        <Link
          href={`/seasons/${season.id}`}
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          target="_blank"
        >
          대시보드 보기
        </Link>
        <Link
          href={`/admin/seasons/${season.id}/refund`}
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          환급 계산
        </Link>
      </div>
    </div>
  );
}
