import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { isAdminUser } from '@/lib/auth/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: participantId } = await params

    // 참가자 정보 조회
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: { email: true, githubUsername: true },
    })

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // 본인 또는 관리자만 조회 가능
    const userEmail = session.user?.email?.toLowerCase()
    const userName = session.user?.name
    const isOwner =
      (userEmail && participant.email?.toLowerCase() === userEmail) ||
      (userName && participant.githubUsername === userName)

    if (!isOwner && !isAdminUser({ email: session.user?.email })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const submissions = await prisma.submission.findMany({
      where: {
        participantId: participantId,
        isValid: true,
      },
      include: {
        problem: {
          select: {
            id: true,
            dayNumber: true,
            title: true,
            assignedDate: true,
            problemType: true,
          },
        },
      },
      orderBy: {
        problem: {
          dayNumber: 'asc',
        },
      },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching participant submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
