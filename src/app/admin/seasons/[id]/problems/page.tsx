import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProblemTableEditor } from '@/components/admin/ProblemTableEditor'

export const dynamic = 'force-dynamic'

export default async function ProblemsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      problems: {
        orderBy: { dayNumber: 'asc' },
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
        <h1 className="text-2xl font-bold text-gray-900 mt-2">문제 관리</h1>
        <p className="text-gray-600">
          {season.seasonNumber}기 - {season.name} ({new Date(season.startDate).toLocaleDateString('ko-KR')} ~ {new Date(season.endDate).toLocaleDateString('ko-KR')})
        </p>
      </div>

      <ProblemTableEditor
        seasonId={season.id}
        startDate={season.startDate}
        existingProblems={season.problems}
      />
    </div>
  )
}
