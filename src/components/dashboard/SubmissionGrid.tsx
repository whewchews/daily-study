'use client'

import { useState } from 'react'
import { ProblemSubmissionsViewer } from '@/components/seasons/ProblemSubmissionsViewer'

type ProblemType = 'REGULAR' | 'FREE' | 'REST'

interface Problem {
  id: string
  dayNumber: number
  title: string
  problemType: ProblemType
  isPractice: boolean
  assignedDate: string | Date
}

interface Participant {
  id: string
  githubUsername?: string | null
  email?: string | null
  submittedProblemIds: string[]
}

export function SubmissionGrid({
  problems,
  participants,
}: {
  problems: Problem[]
  participants: Participant[]
}) {
  const [selectedProblem, setSelectedProblem] = useState<{
    id: string
    title: string
  } | null>(null)

  // Get today's date at midnight for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Format date helper
  const formatDate = (dateInput: string | Date) => {
    const date = new Date(dateInput)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
    return `${month}.${day} (${dayOfWeek})`
  }

  // Check if a problem date is in the past (yesterday or before)
  const isDatePast = (dateInput: string | Date) => {
    const date = new Date(dateInput)
    date.setHours(0, 0, 0, 0)
    return date < today
  }

  // 휴식일 제외한 제출 가능 문제 수
  const submittableProblems = problems.filter(p => p.problemType !== 'REST')

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  참여자
                </th>
                {problems.map(problem => (
                  <th
                    key={problem.id}
                    onClick={() => {
                      if (problem.problemType !== 'REST') {
                        setSelectedProblem({
                          id: problem.id,
                          title: `Day ${problem.dayNumber}: ${problem.title}`,
                        })
                      }
                    }}
                    className={`px-2 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors ${
                      problem.problemType === 'REST'
                        ? 'bg-gray-200 text-gray-400 cursor-default'
                        : problem.problemType === 'FREE'
                        ? 'bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100'
                        : 'text-gray-500 cursor-pointer hover:bg-gray-200'
                    }`}
                    title={
                      problem.problemType !== 'REST'
                        ? '클릭하여 제출 내역 보기'
                        : problem.title
                    }
                  >
                    <div className="flex flex-col items-center">
                      <span>D{problem.dayNumber}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        {formatDate(problem.assignedDate)}
                      </span>
                      {problem.problemType === 'REST' && (
                        <span className="text-[10px]">휴식</span>
                      )}
                      {problem.problemType === 'FREE' && (
                        <span className="text-[10px]">자율</span>
                      )}
                      {problem.isPractice && (
                        <span className="text-yellow-600 text-[10px]">연습</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제출
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  미제출
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map(participant => {
                // 휴식일 제외하고 제출 수 계산
                const submittedCount = submittableProblems.filter(p =>
                  participant.submittedProblemIds.includes(p.id)
                ).length
                
                // Missed count: Only count if date is past AND not submitted
                const missedCount = submittableProblems.filter(p => 
                  isDatePast(p.assignedDate) && !participant.submittedProblemIds.includes(p.id)
                ).length

                return (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                      {participant.githubUsername ? (
                        <a
                          href={`https://github.com/${participant.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {participant.githubUsername}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-gray-700">
                          {participant.email || '알 수 없음'}
                        </span>
                      )}
                    </td>
                    {problems.map(problem => {
                      const isSubmitted = participant.submittedProblemIds.includes(problem.id)
                      const isRest = problem.problemType === 'REST'
                      const isPast = isDatePast(problem.assignedDate)

                      return (
                        <td
                          key={problem.id}
                          className={`px-2 py-3 text-center ${isRest ? 'bg-gray-100' : ''}`}
                        >
                          {isRest ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 text-gray-400">
                              -
                            </span>
                          ) : isSubmitted ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                              O
                            </span>
                          ) : isPast ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                              X
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 text-gray-300">
                              -
                            </span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-green-600">
                        {submittedCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-medium ${
                          missedCount >= 3
                            ? 'text-red-600'
                            : missedCount > 0
                            ? 'text-yellow-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {missedCount}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {participants.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              참여자가 없습니다.
            </div>
          )}
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-end space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 text-xs">
                O
              </span>
              <span>제출 완료</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs">
                X
              </span>
              <span>미제출</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="inline-flex items-center justify-center w-5 h-5 text-gray-400 text-xs">
                -
              </span>
              <span>휴식/예정</span>
            </div>
          </div>
        </div>
      </div>

      {selectedProblem && (
        <ProblemSubmissionsViewer
          problemId={selectedProblem.id}
          problemTitle={selectedProblem.title}
          onClose={() => setSelectedProblem(null)}
        />
      )}
    </>
  )
}
