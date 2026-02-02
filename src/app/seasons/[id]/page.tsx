import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { Header } from '@/components/layout/Header'
import { SubmissionGrid } from '@/components/dashboard/SubmissionGrid'
import { RefundLookupPanel } from '@/components/seasons/RefundLookupPanel'

export const dynamic = 'force-dynamic'

export default async function SeasonDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: { problemId?: string | string[] }
}) {
  const { id } = await params
  const initialProblemId =
    typeof searchParams?.problemId === "string"
      ? searchParams.problemId
      : undefined

  const session = await getServerSession(authOptions)
  const currentUsername = session?.user?.githubUsername

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      problems: {
        orderBy: { dayNumber: 'asc' },
      },
      participants: {
        where: { status: { not: 'DROPPED' } },
        orderBy: { githubUsername: 'asc' },
        include: {
          submissions: {
            where: { isValid: true },
            select: { problemId: true },
          },
        },
      },
    },
  })

  if (!season) {
    notFound()
  }

  // 현재 사용자가 해당 시즌의 참여자인지 확인 (DROPPED 포함)
  let isParticipant = false
  if (currentUsername) {
    const participant = await prisma.participant.findFirst({
      where: {
        seasonId: id,
        githubUsername: currentUsername,
      },
      select: { id: true },
    })
    isParticipant = !!participant
  }

  const dashboardData = {
    problems: season.problems,
    participants: season.participants.map(p => ({
      ...p,
      submittedProblemIds: p.submissions.map(s => s.problemId),
    })),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {season.seasonNumber}기 제출 현황
          </h1>
          <p className="text-gray-600 mt-1">{season.name}</p>
          <p className="text-gray-500 text-sm">
            {new Date(season.startDate).toLocaleDateString('ko-KR')} ~{' '}
            {new Date(season.endDate).toLocaleDateString('ko-KR')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {season.participants.length}
              </p>
              <p className="text-sm text-gray-500">참여자</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {season.problems.length}
              </p>
              <p className="text-sm text-gray-500">문제</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {season.participants.reduce(
                  (acc, p) => acc + p.submissions.length,
                  0
                )}
              </p>
              <p className="text-sm text-gray-500">제출</p>
            </div>
          </div>
        </div>

        <RefundLookupPanel
          seasonId={season.id}
          endDate={season.endDate.toISOString()}
          isParticipant={isParticipant}
        />

        <SubmissionGrid
          problems={dashboardData.problems}
          participants={dashboardData.participants}
          initialProblemId={initialProblemId}
        />
      </main>
    </div>
  )
}
