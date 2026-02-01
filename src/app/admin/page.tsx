import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [activeSeasons, totalSeasons, totalParticipants, totalSubmissions] = await Promise.all([
    prisma.season.findMany({
      where: { isActive: true },
      orderBy: { seasonNumber: 'desc' },
    }),
    prisma.season.count(),
    prisma.participant.count(),
    prisma.submission.count(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">관리자 대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">전체 기수</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalSeasons}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">전체 참여자</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalParticipants}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">전체 제출</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalSubmissions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">현재 진행중</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {activeSeasons.length ? `${activeSeasons.length}개` : '-'}
          </p>
        </div>
      </div>

      {activeSeasons.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 진행중인 기수</h2>
          <div className="divide-y divide-gray-200">
            {activeSeasons.map((season) => (
              <div
                key={season.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-lg font-semibold text-blue-600">
                    {season.seasonNumber}기 - {season.name}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {new Date(season.startDate).toLocaleDateString('ko-KR')} ~{' '}
                    {new Date(season.endDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <Link
                  href={`/admin/seasons/${season.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  관리하기
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <Link
          href="/admin/seasons/new"
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
        >
          새 기수 생성
        </Link>
        <Link
          href="/admin/seasons"
          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          기수 목록 보기
        </Link>
      </div>
    </div>
  )
}
