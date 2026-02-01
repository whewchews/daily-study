'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewSeasonPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      seasonNumber: parseInt(formData.get('seasonNumber') as string),
      name: formData.get('name') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      entryFee: parseInt(formData.get('entryFee') as string) || 20000,
    }

    try {
      const res = await fetch('/api/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to create season')
      }

      const season = await res.json()
      router.push(`/admin/seasons/${season.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">새 기수 생성</h1>

      <div className="max-w-2xl bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="seasonNumber"
                className="block text-sm font-medium text-gray-700"
              >
                기수 번호
              </label>
              <input
                type="number"
                id="seasonNumber"
                name="seasonNumber"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                이름
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="예: 2024년 1월 스터디"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                시작일
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                종료일
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="entryFee" className="block text-sm font-medium text-gray-700">
              참가비 (원)
            </label>
            <input
              type="number"
              id="entryFee"
              name="entryFee"
              defaultValue={20000}
              min="0"
              step="1000"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
