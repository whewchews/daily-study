import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
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
          submissions: true,
        },
      },
    },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">기수 관리</h1>
        <Link
          href="/admin/seasons/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          새 기수 생성
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기수
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                참여자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                문제
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {seasons.map(season => (
              <tr key={season.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {season.seasonNumber}기 - {season.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    참가비: {season.entryFee.toLocaleString()}원
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(season.startDate).toLocaleDateString('ko-KR')} ~{' '}
                  {new Date(season.endDate).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {season._count.participants}명
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {season._count.problems}개
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeasonStatusBadgeClass(
                      season
                    )}`}
                  >
                    {getSeasonStatusLabel(season)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/admin/seasons/${season.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    상세보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {seasons.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            등록된 기수가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
