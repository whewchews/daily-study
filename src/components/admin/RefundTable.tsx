'use client'

import { RefundResult, getRankLabel } from '@/lib/utils/refund'

export function RefundTable({
  results,
  entryFee,
}: {
  results: RefundResult[]
  entryFee: number
}) {
  const activeResults = results.filter(r => !r.isDropped).sort((a, b) => (a.rank || 999) - (b.rank || 999))
  const droppedResults = results.filter(r => r.isDropped)
  const isGithubHandle = (value: string) =>
    !value.includes('@') && !value.startsWith('participant-')

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            완주자 ({activeResults.length}명)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  GitHub
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  제출
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  미인증
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  보너스 비율
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  환급액
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeResults.map(result => (
                <tr key={result.githubUsername}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        result.rank === 1
                          ? 'bg-yellow-100 text-yellow-800'
                          : result.rank === 2
                          ? 'bg-gray-100 text-gray-800'
                          : result.rank === 3
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {getRankLabel(result.rank)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isGithubHandle(result.githubUsername) ? (
                      <a
                        href={`https://github.com/${result.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {result.githubUsername}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-700">
                        {result.githubUsername}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    {result.submittedCount}/{result.totalProblems}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`text-sm font-medium ${
                        result.missedCount === 0
                          ? 'text-green-600'
                          : result.missedCount === 1
                          ? 'text-yellow-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {result.missedCount}회
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {result.refundPercentage > 0 ? `+${result.refundPercentage.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-green-600">
                      {result.refundAmount.toLocaleString()}원
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={5} className="px-6 py-4 text-right font-medium text-gray-900">
                  완주자 환급 합계
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-lg font-bold text-green-600">
                    {activeResults
                      .reduce((sum, r) => sum + r.refundAmount, 0)
                      .toLocaleString()}
                    원
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {droppedResults.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              중도포기 ({droppedResults.length}명)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    GitHub
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    제출
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    미인증
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    환급액
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {droppedResults.map(result => (
                  <tr key={result.githubUsername} className="bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isGithubHandle(result.githubUsername) ? (
                        <a
                          href={`https://github.com/${result.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {result.githubUsername}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-700">
                          {result.githubUsername}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {result.submittedCount}/{result.totalProblems}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-red-600">
                        {result.missedCount}회
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-red-600">0원</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
