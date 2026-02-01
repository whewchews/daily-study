import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { LoginModal } from '@/components/auth/LoginModal'
import {
  getSeasonStatusBadgeClass,
  getSeasonStatusLabel,
} from '@/lib/utils/season'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const activeSeasons = await prisma.season.findMany({
    where: { isActive: true },
    orderBy: { seasonNumber: 'desc' },
    include: {
      _count: {
        select: {
          participants: true,
          problems: true,
          submissions: true,
        },
      },
    },
  })

  const recentSeasons = await prisma.season.findMany({
    orderBy: { seasonNumber: 'desc' },
    take: 5,
    include: {
      _count: {
        select: { participants: true },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Daily Study</h1>
          <p className="text-xl text-gray-600">2주 단위 코딩테스트 스터디</p>
        </div>

        {activeSeasons.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">현재 진행중</h2>
              <span className="text-sm text-gray-500">
                총 {activeSeasons.length}개
              </span>
            </div>
            <div className="grid gap-6">
              {activeSeasons.map((season) => (
                <div
                  key={season.id}
                  className="bg-white rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {season.seasonNumber}기 - {season.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getSeasonStatusBadgeClass(
                        season
                      )}`}
                    >
                      {getSeasonStatusLabel(season)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {new Date(season.startDate).toLocaleDateString('ko-KR')} ~{' '}
                    {new Date(season.endDate).toLocaleDateString('ko-KR')}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {season._count.participants}
                      </p>
                      <p className="text-sm text-gray-500">참여자</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {season._count.problems}
                      </p>
                      <p className="text-sm text-gray-500">문제</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {season._count.submissions}
                      </p>
                      <p className="text-sm text-gray-500">제출</p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    {session ? (
                      <Link
                        href={`/submit?seasonId=${season.id}`}
                        className="flex-1 text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        코드 제출하기
                      </Link>
                    ) : (
                      <LoginModal
                        triggerLabel="코드 제출하기"
                        callbackUrl={`/submit?seasonId=${season.id}`}
                        triggerClassName="flex-1 text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      />
                    )}
                    <Link
                      href={`/seasons/${season.id}`}
                      className="flex-1 text-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      제출 현황 보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center mb-8">
            <p className="text-gray-500">현재 진행중인 스터디가 없습니다.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">최근 기수</h2>
          <div className="space-y-3">
            {recentSeasons.map((season) => (
              <Link
                key={season.id}
                href={`/seasons/${season.id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {season.seasonNumber}기 - {season.name}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({season._count.participants}명)
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded ${getSeasonStatusBadgeClass(
                    season
                  )}`}
                >
                  {getSeasonStatusLabel(season)}
                </span>
              </Link>
            ))}
          </div>
          {recentSeasons.length > 0 && (
            <Link
              href="/seasons"
              className="block text-center text-blue-600 hover:underline mt-4"
            >
              전체 기수 보기
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
