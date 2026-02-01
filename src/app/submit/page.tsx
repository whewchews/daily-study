import { prisma } from '@/lib/db/prisma'
import { Header } from '@/components/layout/Header'
import { SubmitForm } from '@/components/submit/SubmitForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export default async function SubmitPage({
  searchParams,
}: {
  searchParams?: Promise<{ seasonId?: string | string[]; problemId?: string | string[] }>
}) {
  const session = await getServerSession(authOptions)
  const resolvedParams = await searchParams
  const selectedSeasonId =
    typeof resolvedParams?.seasonId === 'string' ? resolvedParams.seasonId : undefined
  const selectedProblemId =
    typeof resolvedParams?.problemId === 'string' ? resolvedParams.problemId : undefined

  const activeSeasons = await prisma.season.findMany({
    where: { isActive: true },
    orderBy: { seasonNumber: 'desc' },
    include: {
      problems: {
        orderBy: { dayNumber: 'asc' },
      },
      participants: {
        select: { githubUsername: true, email: true },
      },
    },
  })

  const seasons = activeSeasons.map((season) => ({
    id: season.id,
    seasonNumber: season.seasonNumber,
    name: season.name,
    problems: season.problems,
    participants: season.participants.map((p) => ({
      githubUsername: p.githubUsername,
      email: p.email,
    })),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">코드 제출</h1>
        <p className="text-gray-600 mb-8">
          문제를 풀고 코드를 제출하세요. 제출된 코드는 GitHub에 자동으로 커밋됩니다.
        </p>

        {seasons.length > 0 ? (
          <SubmitForm
            seasons={seasons}
            defaultSeasonId={selectedSeasonId}
            defaultProblemId={selectedProblemId}
            initialGithubUsername={session?.user?.githubUsername || ''}
            initialEmail={session?.user?.email || ''}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">현재 진행중인 기수가 없습니다.</p>
          </div>
        )}
      </main>
    </div>
  )
}
