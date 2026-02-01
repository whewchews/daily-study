import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { ProblemType } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: seasonId } = await params
    const problems = await prisma.problem.findMany({
      where: { seasonId },
      orderBy: { dayNumber: 'asc' },
    })
    return NextResponse.json(problems)
  } catch (error) {
    console.error('Error fetching problems:', error)
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: seasonId } = await params
    const body = await request.json()
    const { title, url, assignedDate, dayNumber, problemType, isPractice } = body

    const existingProblem = await prisma.problem.findUnique({
      where: { seasonId_dayNumber: { seasonId, dayNumber } },
    })

    if (existingProblem) {
      return NextResponse.json({ error: '이미 해당 일차에 문제가 있습니다.' }, { status: 400 })
    }

    const problem = await prisma.problem.create({
      data: {
        seasonId,
        title,
        url,
        assignedDate: new Date(assignedDate),
        dayNumber,
        problemType: problemType || 'REGULAR',
        isPractice: isPractice || false,
      },
    })

    return NextResponse.json(problem, { status: 201 })
  } catch (error) {
    console.error('Error creating problem:', error)
    return NextResponse.json({ error: 'Failed to create problem' }, { status: 500 })
  }
}

// Bulk update/create problems
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: seasonId } = await params
    const { problems } = await request.json() as {
      problems: Array<{
        dayNumber: number
        title: string
        url?: string
        assignedDate: string
        problemType: ProblemType
        isPractice?: boolean
      }>
    }

    // Validate season exists
    const season = await prisma.season.findUnique({ where: { id: seasonId } })
    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Upsert each problem
    const results = await Promise.all(
      problems.map(async (problem) => {
        return prisma.problem.upsert({
          where: {
            seasonId_dayNumber: { seasonId, dayNumber: problem.dayNumber },
          },
          update: {
            title: problem.title,
            url: problem.url || null,
            assignedDate: new Date(problem.assignedDate),
            problemType: problem.problemType,
            isPractice: problem.isPractice || false,
          },
          create: {
            seasonId,
            dayNumber: problem.dayNumber,
            title: problem.title,
            url: problem.url || null,
            assignedDate: new Date(problem.assignedDate),
            problemType: problem.problemType,
            isPractice: problem.isPractice || false,
          },
        })
      })
    )

    return NextResponse.json({ success: true, problems: results })
  } catch (error) {
    console.error('Error bulk updating problems:', error)
    return NextResponse.json({ error: 'Failed to update problems' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const problemId = searchParams.get('problemId')

    if (!problemId) {
      return NextResponse.json({ error: 'Problem ID required' }, { status: 400 })
    }

    await prisma.problem.delete({ where: { id: problemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting problem:', error)
    return NextResponse.json({ error: 'Failed to delete problem' }, { status: 500 })
  }
}
