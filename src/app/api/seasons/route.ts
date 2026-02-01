import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: { seasonNumber: 'desc' },
      include: {
        _count: {
          select: {
            participants: true,
            problems: true,
            submissions: true,
          },
        },
      },
    })
    return NextResponse.json(seasons)
  } catch (error) {
    console.error('Error fetching seasons:', error)
    return NextResponse.json({ error: 'Failed to fetch seasons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { seasonNumber, name, startDate, endDate, entryFee } = body

    const existingSeason = await prisma.season.findUnique({
      where: { seasonNumber },
    })

    if (existingSeason) {
      return NextResponse.json({ error: '이미 존재하는 기수 번호입니다.' }, { status: 400 })
    }

    const season = await prisma.season.create({
      data: {
        seasonNumber,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        entryFee: entryFee || 20000,
      },
    })

    return NextResponse.json(season, { status: 201 })
  } catch (error) {
    console.error('Error creating season:', error)
    return NextResponse.json({ error: 'Failed to create season' }, { status: 500 })
  }
}
