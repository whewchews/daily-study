'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Problem {
  id: string
  title: string
  url: string | null
  assignedDate: Date
  dayNumber: number
  isPractice: boolean
  _count: {
    submissions: number
  }
}

export function ProblemList({
  seasonId,
  problems,
}: {
  seasonId: string
  problems: Problem[]
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(problemId: string) {
    if (!confirm('정말 삭제하시겠습니까? 관련된 제출 기록도 모두 삭제됩니다.')) {
      return
    }

    setDeleting(problemId)
    try {
      await fetch(`/api/seasons/${seasonId}/problems?problemId=${problemId}`, {
        method: 'DELETE',
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to delete problem:', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          문제 목록 ({problems.length}개)
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {problems.map(problem => (
          <div key={problem.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-blue-600">
                    Day {problem.dayNumber}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {problem.title}
                  </span>
                  {problem.isPractice && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                      연습
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">
                    {new Date(problem.assignedDate).toLocaleDateString('ko-KR')}
                  </span>
                  <span className="text-sm text-gray-500">
                    제출: {problem._count.submissions}건
                  </span>
                  {problem.url && (
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      문제 링크
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(problem.id)}
                disabled={deleting === problem.id}
                className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
              >
                {deleting === problem.id ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        ))}
        {problems.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            등록된 문제가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
