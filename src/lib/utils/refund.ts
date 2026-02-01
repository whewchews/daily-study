import { getKoreaStartOfDay } from './date'

export interface RefundResult {
  githubUsername: string
  totalProblems: number
  submittedCount: number
  missedCount: number
  rank: number | null
  refundPercentage: number
  refundAmount: number
  isDropped: boolean
}

export interface RefundCalculation {
  totalPool: number
  droppedPool: number
  results: RefundResult[]
}

export function calculateRefund(
  participants: Array<{
    githubUsername: string
    isPaid: boolean
    status: 'ACTIVE' | 'DROPPED' | 'COMPLETED'
    submittedProblemIds: string[]
  }>,
  problems: Array<{
    id: string
    assignedDate: Date | string
  }>,
  entryFee: number
): RefundCalculation {
  const paidParticipants = participants.filter(p => p.isPaid)
  const totalPool = paidParticipants.length * entryFee
  const totalProblems = problems.length

  // Get today's date at midnight (Korea time)
  const today = getKoreaStartOfDay(new Date())

  // Identify problems that are in the past
  const pastProblems = problems.filter(p => {
    // Ensure problem date is treated as start of day for comparison
    const pDate = new Date(p.assignedDate)
    // If we assume assignedDate is already midnight or we just want to compare dates:
    // We compare with 'today'.
    // If pDate < today, it's strictly in the past (yesterday or before).
    return pDate < today
  })

  const results: RefundResult[] = paidParticipants.map(participant => {
    const submittedCount = participant.submittedProblemIds.length
    
    const missedCount = pastProblems.filter(p => 
      !participant.submittedProblemIds.includes(p.id)
    ).length

    const isDropped =
      participant.status === 'DROPPED' ||
      (participant.status === 'ACTIVE' && missedCount >= 3)

    return {
      githubUsername: participant.githubUsername,
      totalProblems,
      submittedCount,
      missedCount,
      rank: null,
      refundPercentage: 0,
      refundAmount: 0,
      isDropped,
    }
  })

  const droppedResults = results.filter(r => r.isDropped)
  const activeResults = results.filter(r => !r.isDropped)

  const droppedPool = droppedResults.length * entryFee

  activeResults.sort((a, b) => a.missedCount - b.missedCount)

  let currentRank = 1
  for (let i = 0; i < activeResults.length; i++) {
    if (i > 0 && activeResults[i].missedCount > activeResults[i - 1].missedCount) {
      currentRank = i + 1
    }
    activeResults[i].rank = currentRank
  }

  const rankGroups = new Map<number, RefundResult[]>()
  activeResults.forEach(result => {
    if (result.rank !== null) {
      const group = rankGroups.get(result.rank) || []
      group.push(result)
      rankGroups.set(result.rank, group)
    }
  })

  const refundDistribution: Record<number, number> = {
    1: 70,
    2: 20,
    3: 10,
  }

  let usedPercentage = 0
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b)

  for (const rank of sortedRanks) {
    const group = rankGroups.get(rank) || []

    let totalPercentageForRank = 0
    for (let r = rank; r <= Math.min(rank + group.length - 1, 3); r++) {
      totalPercentageForRank += refundDistribution[r] || 0
    }

    if (rank > 3) {
      totalPercentageForRank = 0
    }

    const percentagePerPerson = totalPercentageForRank / group.length

    group.forEach(result => {
      result.refundPercentage = percentagePerPerson
      result.refundAmount = Math.floor((droppedPool * percentagePerPerson) / 100)
    })

    usedPercentage += totalPercentageForRank
  }

  activeResults.forEach(result => {
    result.refundAmount += entryFee
  })

  return {
    totalPool,
    droppedPool,
    results: [...activeResults, ...droppedResults],
  }
}

export function getRankLabel(rank: number | null): string {
  if (rank === null) return '중도포기'
  if (rank === 1) return '1등 (0회 미인증)'
  if (rank === 2) return '2등 (1회 미인증)'
  if (rank === 3) return '3등 (2회 미인증)'
  return `${rank}등`
}
