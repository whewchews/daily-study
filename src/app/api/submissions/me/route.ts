import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email && !session?.user?.githubUsername) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const problemId = searchParams.get('problemId')

    if (!problemId) {
      return NextResponse.json({ error: 'Problem ID required' }, { status: 400 })
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { seasonId: true },
    })

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }

    const normalizedEmail = session.user.email?.toLowerCase() || undefined

    const participant = await prisma.participant.findFirst({
      where: {
        seasonId: problem.seasonId,
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          ...(session.user.githubUsername
            ? [{ githubUsername: session.user.githubUsername }]
            : []),
        ],
      },
    })

    if (!participant) {
      return NextResponse.json({ submission: null })
    }

    const submission = await prisma.submission.findUnique({
      where: {
        participantId_problemId: {
          participantId: participant.id,
          problemId: problemId,
        },
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error fetching my submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
