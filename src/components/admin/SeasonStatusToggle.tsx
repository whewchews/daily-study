'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSeasonStatusKey,
  SEASON_STATUS_OPTIONS,
  type SeasonStatusKey,
} from '@/lib/utils/season'

export function SeasonStatusToggle({
  seasonId,
  status,
  isActive,
}: {
  seasonId: string
  status: SeasonStatusKey
  isActive: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const resolvedStatus = getSeasonStatusKey({ status, isActive })
  const [currentStatus, setCurrentStatus] = useState<SeasonStatusKey>(resolvedStatus)

  useEffect(() => {
    setCurrentStatus(resolvedStatus)
  }, [resolvedStatus])

  async function updateStatus(nextStatus: SeasonStatusKey) {
    if (nextStatus === currentStatus) {
      return
    }

    const previousStatus = currentStatus
    setCurrentStatus(nextStatus)
    setLoading(true)

    try {
      await fetch(`/api/seasons/${seasonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to update status:', error)
      setCurrentStatus(previousStatus)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <span className="text-sm text-gray-500">상태</span>
      <select
        value={currentStatus}
        onChange={(event) => updateStatus(event.target.value as SeasonStatusKey)}
        disabled={loading}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-60"
      >
        {SEASON_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {loading && <span className="text-xs text-gray-400">처리 중...</span>}
    </div>
  )
}
