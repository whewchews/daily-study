import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { calculateRefund } from '@/lib/utils/refund'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { seasonId } = await params

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        problems: {
          where: { isPractice: false },
        },
        participants: {
          where: { isPaid: true },
          include: {
            submissions: {
              where: { isValid: true },
              select: { problemId: true },
            },
          },
        },
      },
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    const problemIds = new Set(season.problems.map(p => p.id))
    const totalProblems = season.problems.length

    const problemsData = season.problems.map(p => ({
      id: p.id,
      assignedDate: p.assignedDate,
    }))

    const participantsData = season.participants.map(p => ({
      githubUsername: p.githubUsername || p.email || `participant-${p.id}`,
      isPaid: p.isPaid,
      status: p.status,
      submittedProblemIds: p.submissions
        .filter(s => problemIds.has(s.problemId))
        .map(s => s.problemId),
    }))

    const refundResult = calculateRefund(participantsData, problemsData, season.entryFee)

    return NextResponse.json({
      season: {
        id: season.id,
        seasonNumber: season.seasonNumber,
        name: season.name,
        entryFee: season.entryFee,
      },
      totalProblems,
      ...refundResult,
    })
  } catch (error) {
    console.error('Error calculating refund:', error)
    return NextResponse.json({ error: 'Failed to calculate refund' }, { status: 500 })
  }
}
