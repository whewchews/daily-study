'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ParticipantForm({ seasonId }: { seasonId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bulkMode, setBulkMode] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    if (bulkMode) {
      const entriesValue = (formData.get('entries') as string) || ''
      const entries = entriesValue
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      try {
        for (const entry of entries) {
          if (!entry.includes('@')) {
            console.warn('Skipping invalid entry:', entry)
            continue
          }
          const res = await fetch(`/api/seasons/${seasonId}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: entry, isPaid: false }),
          })
          if (!res.ok) {
            const result = await res.json()
            console.warn(`Failed to add ${entry}:`, result.error)
          }
        }
        router.refresh()
        ;(e.target as HTMLFormElement).reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
      return
    }

    const data = {
      email: formData.get('email') as string,
      isPaid: formData.get('isPaid') === 'on',
    }

    try {
      const res = await fetch(`/api/seasons/${seasonId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to add participant')
      }

      router.refresh()
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">참여자 추가</h2>
        <button
          type="button"
          onClick={() => setBulkMode(!bulkMode)}
          className="text-sm text-blue-600 hover:text-blue-900"
        >
          {bulkMode ? '개별 추가' : '일괄 추가'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>
        )}

        {bulkMode ? (
          <div>
            <label htmlFor="entries" className="block text-sm font-medium text-gray-700">
              이메일 (한 줄에 하나씩)
            </label>
            <textarea
              id="entries"
              name="entries"
              rows={10}
              required
              placeholder={`user1@example.com\nuser2@example.com\nuser3@example.com`}
              className="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 font-mono"
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="예: user@example.com"
                className="mt-1 text-gray-700 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPaid"
                name="isPaid"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-900">
                참가비 납부 완료
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '추가 중...' : bulkMode ? '일괄 추가' : '참여자 추가'}
        </button>
      </form>
    </div>
  )
}
