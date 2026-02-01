'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format } from 'date-fns'

export function ProblemForm({
  seasonId,
  startDate,
  existingDays,
}: {
  seasonId: string
  startDate: Date
  existingDays: number[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dayNumber, setDayNumber] = useState(
    existingDays.length > 0 ? Math.max(...existingDays) + 1 : 1
  )

  const assignedDate = addDays(new Date(startDate), dayNumber - 1)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      dayNumber,
      assignedDate: format(assignedDate, 'yyyy-MM-dd'),
      isPractice: formData.get('isPractice') === 'on',
    }

    try {
      const res = await fetch(`/api/seasons/${seasonId}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to create problem')
      }

      router.refresh()
      ;(e.target as HTMLFormElement).reset()
      setDayNumber(dayNumber + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">문제 추가</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>
        )}

        <div>
          <label htmlFor="dayNumber" className="block text-sm font-medium text-gray-700">
            일차
          </label>
          <input
            type="number"
            id="dayNumber"
            value={dayNumber}
            onChange={e => setDayNumber(parseInt(e.target.value) || 1)}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
          <p className="mt-1 text-sm text-gray-500">
            배정일: {format(assignedDate, 'yyyy-MM-dd')}
          </p>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            문제 제목
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            placeholder="예: 두 수의 합"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            문제 URL
          </label>
          <input
            type="url"
            id="url"
            name="url"
            placeholder="https://..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPractice"
            name="isPractice"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isPractice" className="ml-2 block text-sm text-gray-900">
            연습 문제 (첫째 날)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '추가 중...' : '문제 추가'}
        </button>
      </form>
    </div>
  )
}
