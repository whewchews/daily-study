import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: problemId } = await params

    const submissions = await prisma.submission.findMany({
      where: {
        problemId: problemId,
        isValid: true, // 유효한 제출만 조회
      },
      include: {
        participant: {
          select: {
            githubUsername: true,
            email: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
