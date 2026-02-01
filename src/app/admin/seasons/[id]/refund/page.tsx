import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RefundTable } from '@/components/admin/RefundTable'
import { calculateRefund } from '@/lib/utils/refund'

export const dynamic = 'force-dynamic'

export default async function RefundPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      problems: {
        where: { isPractice: false },
      },
      participants: {
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

  const problemIds = new Set(season.problems.map(p => p.id))
  const totalProblems = season.problems.length

  const problemsData = season.problems.map(p => ({
    id: p.id,
    assignedDate: p.assignedDate,
  }))

  const participantsData = season.participants.map(p => ({
    githubUsername: p.githubUsername || p.email || `participant-${p.id}`,
    isPaid: p.isPaid,
    status: p.status,
    submittedProblemIds: p.submissions
      .filter(s => problemIds.has(s.problemId))
      .map(s => s.problemId),
  }))

  const refundResult = calculateRefund(participantsData, problemsData, season.entryFee)

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/seasons/${season.id}`}
          className="text-blue-600 hover:text-blue-900 text-sm"
        >
          ← {season.seasonNumber}기로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">환급 계산</h1>
        <p className="text-gray-600">
          {season.seasonNumber}기 - {season.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">참가비</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {season.entryFee.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">총 풀 (납부자)</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {refundResult.totalPool.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">중도포기 풀</h3>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {refundResult.droppedPool.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">문제 수 (연습 제외)</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalProblems}개</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <h3 className="font-semibold text-yellow-800 mb-2">환급 규칙</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>- 1등 (0회 미인증): 중도포기자 금액의 70%</li>
          <li>- 2등 (1회 미인증): 중도포기자 금액의 20%</li>
          <li>- 3등 (2회 미인증): 중도포기자 금액의 10%</li>
          <li>- 중도포기 (3회 이상 미인증): 환급 없음</li>
          <li>- 완주자는 참가비를 전액 환급받습니다.</li>
        </ul>
      </div>

      <RefundTable results={refundResult.results} entryFee={season.entryFee} />
    </div>
  )
}
