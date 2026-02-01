import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: participantId } = await params

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
