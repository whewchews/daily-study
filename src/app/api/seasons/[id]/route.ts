import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { isAdminUser } from '@/lib/auth/admin'
import { getDateForDay, parseKoreaDate } from '@/lib/utils/date'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        problems: {
          orderBy: { dayNumber: 'asc' },
        },
        participants: {
          orderBy: { githubUsername: 'asc' },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    })

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    return NextResponse.json(season)
  } catch (error) {
    console.error('Error fetching season:', error)
    return NextResponse.json({ error: 'Failed to fetch season' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdminUser({ email: session.user?.email })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, startDate, endDate, entryFee, status } = body

    // status 필드로 통일, isActive는 status === 'ACTIVE'로 자동 설정
    const resolvedIsActive = status ? status === 'ACTIVE' : undefined

    const season = await prisma.season.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: parseKoreaDate(startDate) }),
        ...(endDate && { endDate: parseKoreaDate(endDate) }),
        ...(entryFee !== undefined && { entryFee }),
        ...(resolvedIsActive !== undefined && { isActive: resolvedIsActive }),
        ...(status && { status }),
      },
    })

    // startDate가 변경되면 모든 문제의 assignedDate를 재계산
    if (startDate) {
      const problems = await prisma.problem.findMany({
        where: { seasonId: id },
        select: { id: true, dayNumber: true },
      })

      if (problems.length > 0) {
        const newStartDate = parseKoreaDate(startDate)
        await Promise.all(
          problems.map((problem) => {
            const assignedDate = getDateForDay(newStartDate, problem.dayNumber)
            return prisma.problem.update({
              where: { id: problem.id },
              data: { assignedDate },
            })
          })
        )
      }
    }

    return NextResponse.json(season)
  } catch (error) {
    console.error('Error updating season:', error)
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 })
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

    if (!isAdminUser({ email: session.user?.email })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await prisma.season.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting season:', error)
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 })
  }
}
