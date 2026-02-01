'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Participant {
  id: string
  githubUsername?: string | null
  email?: string | null
  isPaid: boolean
  status: 'ACTIVE' | 'DROPPED' | 'COMPLETED'
  refundCompleted: boolean
  _count: {
    submissions: number
  }
}

export function ParticipantList({
  seasonId,
  participants,
  totalProblems,
}: {
  seasonId: string
  participants: Participant[]
  totalProblems: number
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, {
    isPaid: boolean
    status: Participant['status']
    refundCompleted: boolean
  }>>({})
  const [deleting, setDeleting] = useState<string | null>(null)

  const startEditing = () => {
    const nextDrafts: typeof drafts = {}
    participants.forEach(participant => {
      nextDrafts[participant.id] = {
        isPaid: participant.isPaid,
        status: participant.status,
        refundCompleted: participant.refundCompleted,
      }
    })
    setDrafts(nextDrafts)
    setError('')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDrafts({})
    setError('')
    setIsEditing(false)
  }

  const updateDraft = (
    participantId: string,
    patch: Partial<{
      isPaid: boolean
      status: Participant['status']
      refundCompleted: boolean
    }>
  ) => {
    setDrafts(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        ...patch,
      },
    }))
  }

  const saveChanges = async () => {
    setSaving(true)
    setError('')

    const updates = participants
      .map(participant => {
        const draft = drafts[participant.id]
        if (!draft) return null

        const payload: {
          participantId: string
          isPaid?: boolean
          status?: Participant['status']
          refundCompleted?: boolean
        } = { participantId: participant.id }

        if (draft.isPaid !== participant.isPaid) {
          payload.isPaid = draft.isPaid
        }
        if (draft.status !== participant.status) {
          payload.status = draft.status
        }
        if (draft.refundCompleted !== participant.refundCompleted) {
          payload.refundCompleted = draft.refundCompleted
        }

        const hasChanges = Object.keys(payload).length > 1
        return hasChanges ? payload : null
      })
      .filter(Boolean) as Array<{
      participantId: string
      isPaid?: boolean
      status?: Participant['status']
      refundCompleted?: boolean
    }>

    if (updates.length === 0) {
      setSaving(false)
      setIsEditing(false)
      return
    }

    try {
      const responses = await Promise.all(
        updates.map(payload =>
          fetch(`/api/seasons/${seasonId}/participants`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        )
      )
      const failed = responses.find(response => !response.ok)
      if (failed) {
        throw new Error('Failed to update participants')
      }
      router.refresh()
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update participants:', err)
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(participantId: string) {
    if (!confirm('정말 삭제하시겠습니까? 관련된 제출 기록도 모두 삭제됩니다.')) {
      return
    }

    setDeleting(participantId)
    try {
      await fetch(`/api/seasons/${seasonId}/participants?participantId=${participantId}`, {
        method: 'DELETE',
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to delete participant:', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          참여자 목록 ({participants.length}명)
        </h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startEditing}
              className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
            >
              수정
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mx-6 mt-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                계정
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                제출
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                납부
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                환급완료
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map(participant => {
              const missedCount = totalProblems - participant._count.submissions
              const displayName =
                participant.githubUsername || participant.email || '알 수 없음'
              const secondaryLabel =
                participant.githubUsername && participant.email
                  ? participant.email
                  : null
              const isGithubHandle =
                participant.githubUsername && !participant.githubUsername.includes('@')
              const draft = drafts[participant.id]
              return (
                <tr key={participant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {isGithubHandle ? (
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
                          {displayName}
                        </span>
                      )}
                      {secondaryLabel && (
                        <span className="text-xs text-gray-400">{secondaryLabel}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {participant._count.submissions}/{totalProblems}
                    {missedCount > 0 && (
                      <span className="ml-1 text-red-500">(-{missedCount})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={(draft ? draft.isPaid : participant.isPaid) ? 'true' : 'false'}
                        onChange={event =>
                          updateDraft(participant.id, {
                            isPaid: event.target.value === 'true',
                          })
                        }
                        disabled={saving}
                        className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                      >
                        <option value="false">미납</option>
                        <option value="true">납부완료</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          participant.isPaid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {participant.isPaid ? '납부완료' : '미납'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={draft?.status ?? participant.status}
                        onChange={event =>
                          updateDraft(participant.id, {
                            status: event.target.value as Participant['status'],
                          })
                        }
                        disabled={saving}
                        className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                      >
                        <option value="ACTIVE">진행중</option>
                        <option value="COMPLETED">완주완료</option>
                        <option value="DROPPED">중도포기</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          participant.status === 'DROPPED'
                            ? 'bg-red-100 text-red-800'
                            : participant.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {participant.status === 'DROPPED'
                          ? '중도포기'
                          : participant.status === 'COMPLETED'
                          ? '완주완료'
                          : '진행중'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={(draft ? draft.refundCompleted : participant.refundCompleted) ? 'true' : 'false'}
                        onChange={event =>
                          updateDraft(participant.id, {
                            refundCompleted: event.target.value === 'true',
                          })
                        }
                        disabled={saving}
                        className="px-2 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50"
                      >
                        <option value="false">미완료</option>
                        <option value="true">환급완료</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          participant.refundCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {participant.refundCompleted ? '환급완료' : '미완료'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(participant.id)}
                      disabled={deleting === participant.id}
                      className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                    >
                      {deleting === participant.id ? '삭제 중...' : '삭제'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {participants.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            등록된 참여자가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}
