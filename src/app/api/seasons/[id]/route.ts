import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

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

    const { id } = await params
    const body = await request.json()
    const { name, startDate, endDate, entryFee, isActive, status } = body
    let resolvedStatus = status
    let resolvedIsActive = isActive

    if (status) {
      resolvedIsActive = status === 'ACTIVE'
    } else if (isActive !== undefined) {
      if (isActive) {
        resolvedStatus = 'ACTIVE'
      } else {
        const currentSeason = await prisma.season.findUnique({
          where: { id },
          select: { status: true },
        })
        if (currentSeason?.status === 'ACTIVE') {
          resolvedStatus = 'COMPLETED'
        }
      }
    }

    const season = await prisma.season.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(entryFee !== undefined && { entryFee }),
        ...(resolvedIsActive !== undefined && { isActive: resolvedIsActive }),
        ...(resolvedStatus && { status: resolvedStatus }),
      },
    })

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

    const { id } = await params
    await prisma.season.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting season:', error)
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 })
  }
}
