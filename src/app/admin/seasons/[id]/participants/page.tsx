import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ParticipantForm } from '@/components/admin/ParticipantForm'
import { ParticipantList } from '@/components/admin/ParticipantList'

export const dynamic = 'force-dynamic'

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      participants: {
        orderBy: { githubUsername: 'asc' },
        include: {
          _count: {
            select: { submissions: true },
          },
        },
      },
      _count: {
        select: { problems: true },
      },
    },
  })

  if (!season) {
    notFound()
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/seasons/${season.id}`}
          className="text-blue-600 hover:text-blue-900 text-sm"
        >
          ← {season.seasonNumber}기로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">참여자 관리</h1>
        <p className="text-gray-600">
          {season.seasonNumber}기 - {season.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ParticipantList
            seasonId={season.id}
            participants={season.participants}
            totalProblems={season._count.problems}
          />
        </div>
        <div>
          <ParticipantForm seasonId={season.id} />
        </div>
      </div>
    </div>
  )
}
