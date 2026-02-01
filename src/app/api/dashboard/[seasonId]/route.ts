import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params

    const season = await prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        problems: {
          orderBy: { dayNumber: 'asc' },
        },
        participants: {
          where: { status: { not: 'DROPPED' } },
          orderBy: { githubUsername: 'asc' },
        },
        submissions: {
          where: { isValid: true },
          select: {
            participantId: true,
            problemId: true,
            submittedAt: true,
          },
        },
      },
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    const submissionMap = new Map<string, Set<string>>()
    season.submissions.forEach(sub => {
      const key = sub.participantId
      if (!submissionMap.has(key)) {
        submissionMap.set(key, new Set())
      }
      submissionMap.get(key)!.add(sub.problemId)
    })

    const dashboard = {
      season: {
        id: season.id,
        seasonNumber: season.seasonNumber,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
      },
      problems: season.problems.map(p => ({
        id: p.id,
        dayNumber: p.dayNumber,
        title: p.title,
        assignedDate: p.assignedDate,
        isPractice: p.isPractice,
      })),
      participants: season.participants.map(participant => {
        const submissions = submissionMap.get(participant.id) || new Set()
        const problemStatus = season.problems.map(problem => ({
          problemId: problem.id,
          dayNumber: problem.dayNumber,
          submitted: submissions.has(problem.id),
        }))

        return {
          id: participant.id,
          githubUsername: participant.githubUsername,
          submittedCount: submissions.size,
          totalProblems: season.problems.length,
          problemStatus,
        }
      }),
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
