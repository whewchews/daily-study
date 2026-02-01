import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import {
  getSeasonStatusBadgeClass,
  getSeasonStatusLabel,
} from '@/lib/utils/season'

export const dynamic = 'force-dynamic'

export default async function SeasonsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: { seasonNumber: 'desc' },
    include: {
      _count: {
        select: {
          participants: true,
          problems: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">기수 현황</h1>

        <div className="space-y-4">
          {seasons.map(season => (
            <Link
              key={season.id}
              href={`/seasons/${season.id}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {season.seasonNumber}기 - {season.name}
                    </h2>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${getSeasonStatusBadgeClass(
                        season
                      )}`}
                    >
                      {getSeasonStatusLabel(season)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    {new Date(season.startDate).toLocaleDateString('ko-KR')} ~{' '}
                    {new Date(season.endDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    참여자 {season._count.participants}명 · 문제 {season._count.problems}개
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {seasons.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              등록된 기수가 없습니다.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
